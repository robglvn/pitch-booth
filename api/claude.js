import { db } from '../lib/db.js';
import { handler, HttpError, personFrom, today } from '../lib/http.js';
import { ALLOWED_MODELS, costUsd } from '../lib/prices.js';

// Proxies one Messages API request for an invited person, using the server's API key, and logs its usage.
const MAX_TOKENS_CAP = 16000;
const ROLES = new Set(['owner', 'persona', 'coach']);

export default handler(['POST'], async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(500, 'The server is missing ANTHROPIC_API_KEY.', 'no_api_key');
  const sql = await db();
  const person = await personFrom(sql, req);
  const role = ROLES.has(String(req.headers['x-ph-role'])) ? String(req.headers['x-ph-role']) : 'other';

  const body = req.body && typeof req.body === 'object' ? { ...req.body } : null;
  if (!body) throw new HttpError(400, 'Bad request body.');
  if (!ALLOWED_MODELS.has(body.model)) throw new HttpError(400, `The model "${body.model}" isn't enabled on this server.`, 'model_not_allowed');
  body.max_tokens = Math.min(Number(body.max_tokens) || 1024, MAX_TOKENS_CAP);
  delete body.stream;

  const day = today();
  const limit = parseInt(process.env.DAILY_LIMIT || '250', 10);
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM usage WHERE person_id = ${person.id} AND day = ${day}`;
  if (n >= limit) throw new HttpError(429, "You've hit today's practice limit. It resets at midnight UTC.", 'daily_limit');

  const headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': String(req.headers['anthropic-version'] || '2023-06-01') };
  if (req.headers['anthropic-beta']) headers['anthropic-beta'] = String(req.headers['anthropic-beta']);

  let upstream, text;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
    text = await upstream.text();
  } catch {
    throw new HttpError(502, "The server couldn't reach Anthropic.", 'upstream_unreachable');
  }

  let data = null;
  try { data = JSON.parse(text); } catch {}
  const u = data?.usage || {};
  const model = data?.model || body.model; // a server-side fallback can answer with a different model
  try {
    await sql`INSERT INTO usage (day, person_id, role, model, status, input, cache_read, cache_write, output, cost)
      VALUES (${day}, ${person.id}, ${role}, ${model}, ${upstream.status}, ${u.input_tokens || 0}, ${u.cache_read_input_tokens || 0},
              ${u.cache_creation_input_tokens || 0}, ${u.output_tokens || 0}, ${upstream.ok ? costUsd(model, u) : 0})`;
  } catch (e) { console.error('usage log failed', e); }

  res.status(upstream.status).setHeader('content-type', upstream.headers.get('content-type') || 'application/json').send(text);
});
