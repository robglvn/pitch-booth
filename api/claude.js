import { db } from '../lib/db.js';
import { handler, HttpError, personFrom, newId, today, clip } from '../lib/http.js';
import { ALLOWED_MODELS, costUsd } from '../lib/prices.js';
import { loadShared } from '../lib/shared.js';

// The only way invited people reach Claude. The browser says which job it needs done (a role) plus the facts of
// this call; the server builds the instructions itself from the person's saved profile and js/prompts.js, picks an
// allowed model, caps the size of the request, and stops at a daily spending limit. The browser never sends a
// system prompt, so the server's API key can't be used for anything but practice calls.
//
//   persona  build the person who picks up      { cfg, recentNames }          → reply includes `session`
//   owner    one reply from that person         { session, messages }
//   coach    grade the call                     { session, turns, metrics }
//   draft    draft a "Write your own" industry  { description, note, previous }
const HAIKU = 'claude-haiku-5-5', SONNET = 'claude-sonnet-5-5';
const ROLES = {
  persona: { model: SONNET, maxTokens: 4000, efforts: ['medium'] },
  owner: { model: HAIKU, maxTokens: 1000, efforts: ['low', 'medium'], cache: true },
  coach: { model: SONNET, maxTokens: 10000, efforts: ['medium', 'high'] },
  draft: { model: SONNET, maxTokens: 3000, efforts: ['medium'] },
};
const DIFFICULTIES = ['easy', 'realistic', 'brutal'], MODES = ['random', 'scenario', 'drill'];
const bad = msg => new HttpError(400, msg, 'bad_request');

export default handler(['POST'], async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(500, 'The server is missing ANTHROPIC_API_KEY.', 'no_api_key');
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const rule = ROLES[b.role];
  if (!rule) throw bad('Unknown request.');
  const sql = await db();
  const person = await personFrom(sql, req);

  // Daily limits: a request count and, more importantly, an estimated dollar amount per person.
  const day = today();
  const reqLimit = parseInt(process.env.DAILY_LIMIT || '250', 10);
  const costLimit = parseFloat(process.env.DAILY_COST_LIMIT || '2');
  const [{ n, spent }] = await sql`SELECT COUNT(*)::int AS n, COALESCE(SUM(cost), 0)::float8 AS spent FROM usage WHERE person_id = ${person.id} AND day = ${day}`;
  if (n >= reqLimit || spent >= costLimit) throw new HttpError(429, "You've reached today's practice limit. It resets at midnight UTC.", 'daily_limit');

  const W = loadShared(), P = W.PB_PROMPTS;
  const seller = person.seller && typeof person.seller === 'object' ? person.seller : {};
  const ctx = { seller, pitch: person.sells || '', city: person.city || '', myName: person.name || '', recentNames: names(b.recentNames) };

  let system, messages, schema, session = null;
  if (b.role === 'persona') {
    const cfg = hydrateCfg(b.cfg, seller, W);
    ({ system } = P.personaBuilderPrompt(cfg, ctx));
    messages = [{ role: 'user', content: P.personaBuilderPrompt(cfg, ctx).user }];
    schema = P.PERSONA_SCHEMA;
    session = { id: newId(), cfg };
  } else if (b.role === 'owner' || b.role === 'coach') {
    const [s] = await sql`SELECT cfg, persona FROM sessions WHERE id = ${clip(b.session, 40)} AND person_id = ${person.id}`;
    if (!s) throw new HttpError(404, 'This call has expired. Start a new one.', 'session_missing');
    if (b.role === 'owner') {
      system = P.personaSystemPrompt(s.persona, s.cfg, ctx);
      messages = checkMessages(b.messages);
      schema = P.TURN_SCHEMA;
    } else {
      const m = b.metrics || {};
      const call = {
        persona: s.persona, cfg: s.cfg, turns: checkTurns(b.turns), outcome: m.outcome === 'hung_up' ? 'hung_up' : null,
        discoveryCount: count(m.discoveryCount), questionCount: count(m.questionCount), statementCount: count(m.statementCount),
        openerSecs: Number.isFinite(m.openerSecs) ? Math.min(600, Math.max(0, m.openerSecs)) : null,
        durationSecs: Math.min(7200, Math.max(0, Number(m.durationSecs) || 0)),
      };
      const built = P.coachPrompt(call, ctx);
      system = built.system;
      messages = [{ role: 'user', content: built.user }];
      schema = P.GRADE_SCHEMA;
    }
  } else {
    const prev = b.previous && typeof b.previous === 'object' ? {
      label: clip(b.previous.label, 60), customer: clip(b.previous.customer, 200),
      types: (Array.isArray(b.previous.types) ? b.previous.types : []).slice(0, 8).map(t => ({ label: clip(t?.label, 60) })),
    } : null;
    const built = P.industryDraftPrompt(clip(b.description, 400).trim() || 'something', clip(b.note, 300).trim(), prev);
    system = built.system;
    messages = [{ role: 'user', content: built.user }];
    schema = P.INDUSTRY_SCHEMA;
  }

  // Only Haiku and Sonnet; anything else falls back to the role's usual model. Sizes are capped per role.
  const model = ALLOWED_MODELS.has(b.model) ? b.model : rule.model;
  let effort = rule.efforts.includes(b.effort) ? b.effort : rule.efforts[0];
  let cache = !!rule.cache && b.cache !== false;
  let fallbacks = model === SONNET;

  let upstream, text;
  for (let attempt = 0; attempt < 4; attempt++) {
    const body = { model, max_tokens: rule.maxTokens, system, messages, output_config: { format: { type: 'json_schema', schema }, ...(effort ? { effort } : {}) } };
    if (cache) body.cache_control = { type: 'ephemeral' };
    const headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
    if (fallbacks) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
      text = await upstream.text();
    } catch {
      throw new HttpError(502, "The server couldn't reach Anthropic.", 'upstream_unreachable');
    }
    // Optional features some models or accounts don't accept: retry without them.
    if (upstream.status === 400) {
      if (fallbacks && /fallback/i.test(text)) { fallbacks = false; continue; }
      if (effort && /effort/i.test(text)) { effort = null; continue; }
      if (cache && /cache/i.test(text)) { cache = false; continue; }
    }
    break;
  }

  let data = null;
  try { data = JSON.parse(text); } catch {}
  const u = data?.usage || {};
  const used = data?.model || model; // a server-side fallback can answer with a different model
  try {
    await sql`INSERT INTO usage (day, person_id, role, model, status, input, cache_read, cache_write, output, cost)
      VALUES (${day}, ${person.id}, ${b.role === 'draft' ? 'persona' : b.role}, ${used}, ${upstream.status}, ${u.input_tokens || 0}, ${u.cache_read_input_tokens || 0},
              ${u.cache_creation_input_tokens || 0}, ${u.output_tokens || 0}, ${upstream.ok ? costUsd(used, u) : 0})`;
  } catch (e) { console.error('usage log failed', e); }

  // A new person: remember them (and this call's setup) on the server, so later turns can't swap in other instructions.
  if (session && upstream.ok && data) {
    const persona = parseJson(data);
    if (persona) {
      persona.objections = (persona.objections || []).slice(0, 2);
      await sql`DELETE FROM sessions WHERE person_id = ${person.id} AND created_at < now() - interval '2 days'`;
      await sql`INSERT INTO sessions (id, person_id, cfg, persona) VALUES (${session.id}, ${person.id}, ${JSON.stringify(session.cfg)}::jsonb, ${JSON.stringify(persona)}::jsonb)`;
      return res.status(200).json({ ...data, session: session.id });
    }
  }
  res.status(upstream.status).setHeader('content-type', upstream.headers.get('content-type') || 'application/json').send(text);
});

// The call's setup, checked against the same data the browser used. Anything unknown is replaced, never passed through.
function hydrateCfg(raw, seller, W) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const P = W.PB_PROMPTS, CT = W.PB_CALL_TYPES, PER = W.PB_PERSONALITY, BT = W.PB_BUSINESS_TYPES;
  const difficulty = DIFFICULTIES.includes(r.difficulty) ? r.difficulty : 'realistic';
  const mode = MODES.includes(r.mode) ? r.mode : 'random';
  const fresh = PER.roll({ difficulty }).ids;
  const ids = {};
  for (const [k, t] of Object.entries(PER.TRAITS)) ids[k] = t.options.some(o => o.id === r.personality?.ids?.[k]) ? r.personality.ids[k] : fresh[k];
  const bizKey = BT[r.business] ? r.business : null;
  const audience = bizKey ? 'businesses' : P.audienceOf(seller);
  const customerType = P.customerTypesFor(seller, { audience }).find(t => t.label === r.customerType) || null;
  const pool = P.objectionsFor(seller);
  return {
    mode, difficulty, callType: CT[r.callType] ? r.callType : 'cold', personality: { ids },
    business: bizKey ? { key: bizKey, ...BT[bizKey] } : null, customerType,
    objection: mode === 'drill' ? (pool.includes(r.objection) ? r.objection : pool[0] || null) : null,
  };
}

// The conversation so far: alternating caller and prospect, starting and ending with the caller, sizes capped.
function checkMessages(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 120) throw bad('Bad conversation.');
  let total = 0;
  const out = raw.map((m, i) => {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    if (m?.role !== role || typeof m.content !== 'string' || m.content.length > 2500) throw bad('Bad conversation.');
    total += m.content.length;
    return { role, content: m.content };
  });
  if (out.at(-1).role !== 'user' || total > 80000) throw bad('Bad conversation.');
  return out;
}

function checkTurns(raw) {
  if (!Array.isArray(raw) || raw.length > 400) throw bad('Bad transcript.');
  return raw.map(t => ({ who: ['me', 'them', 'sys'].includes(t?.who) ? t.who : 'sys', text: clip(t?.text, 2500), t: Number(t?.t) || 0 }));
}

const count = v => Math.min(500, Math.max(0, parseInt(v, 10) || 0));
const names = v => (Array.isArray(v) ? v.slice(0, 12).map(x => clip(x, 60)).filter(Boolean) : []);
function parseJson(data) {
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  try { return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { return null; }
}
