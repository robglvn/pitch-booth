// Pitch Booth — Sends requests to Claude (through /api/claude, or straight to Anthropic with your own key) and turns errors into plain messages.
'use strict';

/* ---------- Claude API ---------- */
const FALLBACK_MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1']);
const supportsEffort = m => !/haiku-4|sonnet-4-5|sonnet-4-0|opus-4-0|opus-4-1|claude-3/.test(m);

class FriendlyError extends Error {}

// Invited people: the request carries only a role and the facts of this call (params); the server builds the
// prompt itself (see api/claude.js). People using their own API key: the prompt is built here and sent to Anthropic.
// Returns { json, raw, data } for schema requests.
async function callClaude({ model, system, messages, maxTokens = 2000, effort, schema, cache = false, track, role, params = {} }) {
  const viaProxy = usingProxy();
  if (viaProxy ? !settings.inviteCode : !settings.apiKey) {
    showWelcome('join');
    throw new FriendlyError('Enter your invite code first.');
  }
  model = (model || DEFAULT_SETTINGS.personaModel).trim();
  let useFallbacks = FALLBACK_MODELS.has(model);
  let useEffort = !!effort && supportsEffort(model);
  let useCache = cache;

  for (let attempt = 0; attempt < 4; attempt++) {
    const body = viaProxy ? { role, model, effort, cache, ...params } : { model, max_tokens: maxTokens, system, messages };
    // Automatic caching: the conversation only ever grows, so each turn re-reads the
    // previous turn's prefix from cache at ~10% of the input price.
    const headers = { 'content-type': 'application/json' };
    if (viaProxy) headers['x-invite-code'] = settings.inviteCode;
    else {
      if (useCache) body.cache_control = { type: 'ephemeral' };
      const oc = {};
      if (useEffort) oc.effort = effort;
      if (schema) oc.format = { type: 'json_schema', schema };
      if (Object.keys(oc).length) body.output_config = oc;
      Object.assign(headers, { 'anthropic-version': '2023-06-01', 'x-api-key': settings.apiKey, 'anthropic-dangerous-direct-browser-access': 'true' });
      if (useFallbacks) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    }

    let res, data;
    try {
      res = await fetch(viaProxy ? '/api/claude' : 'https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
    } catch {
      throw new FriendlyError(`Couldn't reach ${viaProxy ? 'the practice server' : 'api.anthropic.com'}. Check your internet connection and try again.`);
    }
    try { data = await res.json(); } catch { data = null; }

    if (!res.ok) {
      const msg = data?.error?.message || '';
      // Older models or accounts may not accept these optional fields; retry without them.
      if (!viaProxy && res.status === 400 && useFallbacks && /fallback/i.test(msg)) { useFallbacks = false; continue; }
      if (!viaProxy && res.status === 400 && useEffort && /effort/i.test(msg)) { useEffort = false; continue; }
      if (!viaProxy && res.status === 400 && useCache && /cache/i.test(msg)) { useCache = false; continue; }
      throw new FriendlyError(friendlyApiError(res.status, msg, model, viaProxy, data?.error?.type));
    }
    if (track) addUsage(track, model, data.usage, role);
    if (data.stop_reason === 'refusal') throw new FriendlyError('Claude declined to continue this turn. Try rephrasing what you said.');
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (!schema) return text;
    try {
      return { json: JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')), raw: text, data };
    } catch {
      throw new FriendlyError(data.stop_reason === 'max_tokens' ? 'The reply got cut off. Try again.' : 'Got an unreadable reply from the API. Try again.');
    }
  }
  throw new FriendlyError('The API kept rejecting the request. Check the model ID in Settings.');
}

function friendlyApiError(status, msg, model, viaProxy, type) {
  if (viaProxy) {
    if (type === 'invalid_invite') return "That code didn't work. Check it for typos, or ask the person who invited you for a new one.";
    if (['daily_limit', 'session_missing', 'bad_request', 'bad_origin', 'model_not_allowed'].includes(type)) return msg;
    if (status === 401) return 'The practice server\'s API key was rejected. Let the person who invited you know.';
    if (status === 400 && /credit balance/i.test(msg)) return 'The practice server is out of API credits. Let the person who invited you know.';
  }
  if (status === 401) return 'Your API key was rejected. Open Settings and paste a valid key from console.anthropic.com.';
  if (status === 403) return `This API key isn't allowed to make that request. ${msg}`;
  if (status === 404 || (status === 400 && /model/i.test(msg) && /not found|invalid|does not exist|unknown/i.test(msg))) return `The model "${model}" wasn't found. Check the model ID in Settings.`;
  if (status === 400 && /credit balance/i.test(msg)) return 'Your Anthropic account is out of credits. Add credits at console.anthropic.com → Billing.';
  if (status === 429) return 'Rate limited — too many requests in a short time. Wait a few seconds and try again.';
  if (status === 529 || status >= 500) return "Anthropic's API is overloaded or having trouble right now. Try again in a few seconds.";
  return `API error (${status}): ${msg || 'unknown error'}`;
}
