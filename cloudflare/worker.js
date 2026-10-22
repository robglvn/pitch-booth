// Please Hold — API proxy (Cloudflare Worker)
// Keeps your Anthropic API key on Cloudflare, so people you invite only need an invite code.
//
// Settings → Variables and Secrets:
//   ANTHROPIC_API_KEY  (Secret)  your key from console.anthropic.com
//   INVITE_CODES       (Secret)  comma-separated codes, one per person, e.g. "maria-7f3k,dave-q92x"
//   ALLOWED_ORIGIN     (Text)    https://robglvn.github.io
//   DAILY_LIMIT        (Text, optional) API requests per invite code per day (default 250, ~10 calls)
// Bindings (optional, turns on the daily limit):
//   KV namespace, variable name USAGE

const ALLOWED_MODELS = new Set(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5']);
const MAX_TOKENS_CAP = 16000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : (allowed[0] || ''),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, anthropic-version, anthropic-beta, x-invite-code',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const reply = (status, message, type = 'proxy_error') =>
      new Response(JSON.stringify({ type: 'error', error: { type, message } }), {
        status, headers: { ...cors, 'content-type': 'application/json' },
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/v1/messages') return reply(404, 'Not found');
    if (!okOrigin) return reply(403, 'This proxy only serves the Please Hold app.', 'bad_origin');
    if (!env.ANTHROPIC_API_KEY) return reply(500, 'The proxy is missing its ANTHROPIC_API_KEY secret.');

    const code = (request.headers.get('x-invite-code') || '').trim().toLowerCase();
    const codes = (env.INVITE_CODES || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!code || !codes.includes(code)) return reply(401, 'Invite code not recognized.', 'invalid_invite');

    let body;
    try { body = await request.json(); } catch { return reply(400, 'Bad request body.'); }
    if (!ALLOWED_MODELS.has(body.model)) return reply(400, `The model "${body.model}" isn't enabled on this proxy.`, 'model_not_allowed');
    body.max_tokens = Math.min(Number(body.max_tokens) || 1024, MAX_TOKENS_CAP);
    delete body.stream;

    if (env.USAGE) {
      const key = `${code}:${new Date().toISOString().slice(0, 10)}`;
      const limit = parseInt(env.DAILY_LIMIT || '250', 10);
      const used = parseInt((await env.USAGE.get(key)) || '0', 10);
      if (used >= limit) return reply(429, 'Daily practice limit reached for this invite. Try again tomorrow.', 'daily_limit');
      try { await env.USAGE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 48 }); } catch { /* KV write quota hit: don't block practice */ }
    }

    const headers = {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
    };
    const beta = request.headers.get('anthropic-beta');
    if (beta) headers['anthropic-beta'] = beta;

    let upstream;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
    } catch {
      return reply(502, "The proxy couldn't reach Anthropic.");
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, 'content-type': upstream.headers.get('content-type') || 'application/json' },
    });
  },
};
