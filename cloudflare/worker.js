// Please Hold — API proxy + usage dashboard (Cloudflare Worker)
// Keeps your Anthropic API key on Cloudflare, so people you invite only need an invite code,
// and records every request so you can see usage per person at /admin.
//
// Settings → Variables and Secrets:
//   ANTHROPIC_API_KEY  (Secret)  your key from console.anthropic.com
//   INVITE_CODES       (Secret)  comma-separated codes, one per person, e.g. "maria-7f3k,dave-q92x"
//   ADMIN_PASSWORD     (Secret)  password for the /admin dashboard
//   ALLOWED_ORIGIN     (Text)    https://robglvn.github.io
//   DAILY_LIMIT        (Text, optional) API requests per invite code per day (default 250, ~10 calls)
// Bindings:
//   D1 database, variable name DB (usage log + daily limits). The table is created automatically.

const ALLOWED_MODELS = new Set(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5']);
const MAX_TOKENS_CAP = 16000;
const ROLES = new Set(['owner', 'persona', 'coach']);

// $ per million tokens: [input, output, cache-read multiplier]. Cache writes are 1.25x input.
const PRICES = {
  'claude-haiku-5-5': [0.10, 0.50, 0.1],
  'claude-sonnet-5-5': [2, 10, 0.1],
  'claude-opus-5-5': [4, 20, 0.05],
  'claude-opus-4-8': [5, 25, 0.1],
};

function costUsd(model, u) {
  const p = PRICES[model];
  if (!p || !u) return 0;
  return ((u.input_tokens || 0) * p[0] + (u.cache_read_input_tokens || 0) * p[0] * p[2]
    + (u.cache_creation_input_tokens || 0) * p[0] * 1.25 + (u.output_tokens || 0) * p[1]) / 1e6;
}

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL, day TEXT NOT NULL, code TEXT NOT NULL, role TEXT NOT NULL,
    model TEXT, status INTEGER, input INTEGER, cache_read INTEGER, cache_write INTEGER,
    output INTEGER, cost REAL)`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS usage_code_day ON usage (code, day)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS usage_ts ON usage (ts)').run();
  schemaReady = true;
}

const today = () => new Date().toISOString().slice(0, 10);
const inviteCodes = env => (env.INVITE_CODES || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/admin' || url.pathname === '/admin/data') return admin(request, env, url);
    return proxy(request, env, ctx, url);
  },
};

/* ---------- proxy ---------- */

async function proxy(request, env, ctx, url) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const okOrigin = allowed.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  const cors = {
    'Access-Control-Allow-Origin': okOrigin ? origin : (allowed[0] || ''),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, anthropic-version, anthropic-beta, x-invite-code, x-ph-role',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  const reply = (status, message, type = 'proxy_error') =>
    new Response(JSON.stringify({ type: 'error', error: { type, message } }), {
      status, headers: { ...cors, 'content-type': 'application/json' },
    });

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST' || url.pathname !== '/v1/messages') return reply(404, 'Not found');
  if (!okOrigin) return reply(403, 'This proxy only serves the Please Hold app.', 'bad_origin');
  if (!env.ANTHROPIC_API_KEY) return reply(500, 'The proxy is missing its ANTHROPIC_API_KEY secret.');

  const code = (request.headers.get('x-invite-code') || '').trim().toLowerCase();
  if (!code || !inviteCodes(env).includes(code)) return reply(401, 'Invite code not recognized.', 'invalid_invite');
  const roleHeader = (request.headers.get('x-ph-role') || '').toLowerCase();
  const role = ROLES.has(roleHeader) ? roleHeader : 'other';

  let body;
  try { body = await request.json(); } catch { return reply(400, 'Bad request body.'); }
  if (!ALLOWED_MODELS.has(body.model)) return reply(400, `The model "${body.model}" isn't enabled on this proxy.`, 'model_not_allowed');
  body.max_tokens = Math.min(Number(body.max_tokens) || 1024, MAX_TOKENS_CAP);
  delete body.stream;

  const day = today();
  if (env.DB) {
    try {
      await ensureSchema(env.DB);
      const limit = parseInt(env.DAILY_LIMIT || '250', 10);
      const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM usage WHERE code = ? AND day = ?').bind(code, day).first();
      if ((row?.n || 0) >= limit) return reply(429, 'Daily practice limit reached for this invite. Try again tomorrow.', 'daily_limit');
    } catch { /* database trouble shouldn't block practice */ }
  }

  const headers = {
    'content-type': 'application/json',
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
  };
  const beta = request.headers.get('anthropic-beta');
  if (beta) headers['anthropic-beta'] = beta;

  let upstream, text;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
    text = await upstream.text();
  } catch {
    return reply(502, "The proxy couldn't reach Anthropic.");
  }

  if (env.DB) {
    let data = null;
    try { data = JSON.parse(text); } catch {}
    const u = data?.usage || {};
    const model = data?.model || body.model; // a server-side fallback can answer with a different model
    ctx.waitUntil(env.DB.prepare(
      'INSERT INTO usage (ts, day, code, role, model, status, input, cache_read, cache_write, output, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(Date.now(), day, code, role, model, upstream.status, u.input_tokens || 0, u.cache_read_input_tokens || 0,
      u.cache_creation_input_tokens || 0, u.output_tokens || 0, upstream.ok ? costUsd(model, u) : 0).run().catch(() => {}));
  }

  return new Response(text, {
    status: upstream.status,
    headers: { ...cors, 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}

/* ---------- admin ---------- */

function safeEqual(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function admin(request, env, url) {
  const noStore = { 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' };
  if (!env.ADMIN_PASSWORD) return new Response('Set the ADMIN_PASSWORD secret to use the dashboard.', { status: 503, headers: noStore });
  let pass = '';
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Basic ')) {
    try { pass = atob(auth.slice(6)).split(':').slice(1).join(':'); } catch {}
  }
  if (!safeEqual(pass, env.ADMIN_PASSWORD)) {
    return new Response('Password required.', { status: 401, headers: { ...noStore, 'WWW-Authenticate': 'Basic realm="Please Hold admin", charset="UTF-8"' } });
  }
  if (url.pathname === '/admin') return new Response(ADMIN_HTML, { headers: { ...noStore, 'content-type': 'text/html; charset=utf-8' } });

  if (!env.DB) return Response.json({ error: 'No D1 database is bound as DB.' }, { status: 500, headers: noStore });
  await ensureSchema(env.DB);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10) || 30, 1), 365);
  const now = Date.now();
  const since = now - days * 864e5;
  const d = today();
  const q = (sql, ...args) => env.DB.prepare(sql).bind(...args).all().then(r => r.results);

  const [daily, people, todayByCode, models, totals] = await Promise.all([
    q('SELECT day, role, SUM(cost) AS cost, COUNT(*) AS requests FROM usage WHERE ts >= ? GROUP BY day, role ORDER BY day', since),
    q(`SELECT code, SUM(CASE WHEN role = 'persona' AND status = 200 THEN 1 ELSE 0 END) AS calls, COUNT(*) AS requests,
         SUM(CASE WHEN status != 200 THEN 1 ELSE 0 END) AS errors, SUM(cost) AS cost, MAX(ts) AS last
       FROM usage WHERE ts >= ? GROUP BY code`, since),
    q('SELECT code, COUNT(*) AS requests, SUM(cost) AS cost FROM usage WHERE day = ? GROUP BY code', d),
    q(`SELECT model, COUNT(*) AS requests, SUM(input + cache_read + cache_write) AS input, SUM(cache_read) AS cache_read,
         SUM(output) AS output, SUM(cost) AS cost FROM usage WHERE ts >= ? GROUP BY model ORDER BY cost DESC`, since),
    q(`SELECT SUM(CASE WHEN day = ? THEN cost ELSE 0 END) AS today, SUM(CASE WHEN ts >= ? THEN cost ELSE 0 END) AS d7,
         SUM(CASE WHEN ts >= ? THEN cost ELSE 0 END) AS d30 FROM usage WHERE ts >= ?`, d, now - 7 * 864e5, now - 30 * 864e5, now - 30 * 864e5),
  ]);
  return Response.json({
    days, today: d, dailyLimit: parseInt(env.DAILY_LIMIT || '250', 10),
    codes: inviteCodes(env), daily, people, todayByCode, models, totals: totals[0] || {},
  }, { headers: noStore });
}

const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Please Hold · Usage</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #0a0d12; --panel: #11161e; --panel-2: #161d27; --border: #212b38;
    --text: #e7edf3; --muted: #8a97a6; --dim: #5d6a79;
    --grid: #1c2430;
    --series-1: #3987e5; --series-2: #d95926; --series-3: #199e70;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 20px 16px 60px; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
  h1 { font-size: 20px; margin: 0; display: flex; gap: 10px; align-items: center; }
  h1 i { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; display: inline-block; }
  h2 { font-size: 16px; margin: 0 0 12px; }
  a { color: #60a5fa; }
  .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .seg { display: inline-flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .seg button { background: var(--panel-2); color: var(--muted); border: 0; padding: 7px 14px; font: inherit; cursor: pointer; }
  .seg button.on { background: #14532d; color: var(--text); }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 18px; margin-top: 14px; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
  .kpi { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
  .kpi .v { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .kpi .k { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  .legend { display: flex; gap: 16px; font-size: 13px; color: var(--muted); margin-bottom: 8px; flex-wrap: wrap; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .legend b { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  .chart { position: relative; }
  .chart svg { display: block; width: 100%; height: auto; }
  .tip { position: absolute; pointer-events: none; background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; font-size: 13px; min-width: 150px; box-shadow: 0 6px 20px rgba(0,0,0,.4); display: none; }
  .tip .t { font-weight: 600; margin-bottom: 4px; }
  .tip .r { display: flex; justify-content: space-between; gap: 14px; color: var(--muted); }
  .tip .r b { color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; color: var(--muted); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; padding: 8px; border-bottom: 1px solid var(--border); }
  td { padding: 9px 8px; border-bottom: 1px solid var(--border); font-variant-numeric: tabular-nums; }
  td.num, th.num { text-align: right; }
  td:first-child { white-space: nowrap; }
  .bar { height: 6px; background: var(--series-1); border-radius: 0 3px 3px 0; min-width: 2px; }
  .muted { color: var(--muted); }
  .small { font-size: 13px; }
  .scroll { overflow-x: auto; }
  details summary { cursor: pointer; color: var(--muted); font-size: 13px; margin-top: 10px; }
  .empty { color: var(--muted); padding: 30px 0; text-align: center; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1><i></i>Please Hold · Usage</h1>
    <div class="row">
      <div class="seg" id="range"><button data-d="7">7 days</button><button data-d="30" class="on">30 days</button><button data-d="90">90 days</button></div>
      <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener">Credits &amp; billing →</a>
    </div>
  </header>
  <div class="kpis" id="kpis"></div>
  <div class="card">
    <h2>Spend per day</h2>
    <div class="legend"><span><b style="background:var(--series-1)"></b>Owner replies</span><span><b style="background:var(--series-2)"></b>Persona builder</span><span><b style="background:var(--series-3)"></b>Coach</span></div>
    <div class="chart" id="chart"></div>
    <details><summary>Show as table</summary><div class="scroll" id="daily-table"></div></details>
  </div>
  <div class="card">
    <h2>People</h2>
    <div class="scroll" id="people"></div>
  </div>
  <div class="card">
    <h2>Models</h2>
    <div class="scroll" id="models"></div>
  </div>
  <p class="small muted">Costs are estimates from token counts and list prices; your Anthropic invoice is the source of truth. Days are in UTC. People who use their own API key in the app don't go through this server and aren't counted.</p>
</div>
<script>
'use strict';
var ROLES = [['owner', 'Owner replies', 'var(--series-1)'], ['persona', 'Persona builder', 'var(--series-2)'], ['coach', 'Coach', 'var(--series-3)']];
var days = 30, lastSeries = null;
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function money(v) { v = v || 0; if (v === 0) return '$0'; if (v < 0.01) return '<$0.01'; return '$' + v.toFixed(2); }
function num(v) { return (v || 0).toLocaleString(); }
function dayLabel(d) { var p = d.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
function ago(ts) {
  if (!ts) return '—';
  var m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
  var h = Math.round(m / 60); if (h < 48) return h + 'h ago';
  return Math.round(h / 24) + 'd ago';
}

function load() {
  fetch('/admin/data?days=' + days, { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(render).catch(function (e) {
    $('chart').innerHTML = '<div class="empty">Couldn\\'t load usage: ' + esc(e.message) + '</div>';
  });
}

function render(d) {
  if (d.error) { $('chart').innerHTML = '<div class="empty">' + esc(d.error) + '</div>'; return; }
  var calls = 0, active = 0;
  d.people.forEach(function (p) { calls += p.calls || 0; if (p.requests) active++; });
  var t = d.totals;
  $('kpis').innerHTML = [['Today', money(t.today)], ['Last 7 days', money(t.d7)], ['Last 30 days', money(t.d30)],
    ['Calls · ' + d.days + 'd', num(calls)], ['People active · ' + d.days + 'd', active + ' / ' + d.codes.length]]
    .map(function (k) { return '<div class="kpi"><div class="v">' + k[1] + '</div><div class="k">' + esc(k[0]) + '</div></div>'; }).join('');

  // one entry per day in range, zero-filled
  var byDay = {};
  d.daily.forEach(function (r) { (byDay[r.day] = byDay[r.day] || {})[r.role] = r.cost || 0; });
  var series = [];
  for (var i = d.days - 1; i >= 0; i--) {
    var key = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    var v = byDay[key] || {};
    var other = 0;
    Object.keys(v).forEach(function (k) { if (k !== 'owner' && k !== 'persona' && k !== 'coach') other += v[k]; });
    series.push({ day: key, owner: v.owner || 0, persona: v.persona || 0, coach: (v.coach || 0) + other });
  }
  lastSeries = series;
  drawChart(series);
  $('daily-table').innerHTML = '<table><thead><tr><th>Day</th>' + ROLES.map(function (r) { return '<th class="num">' + r[1] + '</th>'; }).join('') + '<th class="num">Total</th></tr></thead><tbody>' +
    series.slice().reverse().map(function (s) { return '<tr><td>' + dayLabel(s.day) + '</td>' + ROLES.map(function (r) { return '<td class="num">' + money(s[r[0]]) + '</td>'; }).join('') + '<td class="num">' + money(s.owner + s.persona + s.coach) + '</td></tr>'; }).join('') + '</tbody></table>';

  var todayMap = {};
  d.todayByCode.forEach(function (r) { todayMap[r.code] = r; });
  var rows = {};
  d.codes.forEach(function (c) { rows[c] = { code: c, calls: 0, requests: 0, errors: 0, cost: 0, last: 0, invited: true }; });
  d.people.forEach(function (p) { rows[p.code] = Object.assign({ invited: d.codes.indexOf(p.code) >= 0 }, p); });
  var list = Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (a, b) { return (b.cost || 0) - (a.cost || 0); });
  var max = Math.max.apply(null, list.map(function (r) { return r.cost || 0; }).concat([0.000001]));
  $('people').innerHTML = list.length ? '<table><thead><tr><th>Invite code</th><th class="num">Calls</th><th class="num">Spend · ' + d.days + 'd</th><th style="width:22%"></th><th class="num">Today</th><th class="num">Today vs limit</th><th>Last active</th></tr></thead><tbody>' +
    list.map(function (r) {
      var td = todayMap[r.code] || {};
      return '<tr><td>' + esc(r.code) + (r.invited ? '' : ' <span class="muted small">(removed)</span>') + '</td><td class="num">' + num(r.calls) + '</td><td class="num">' + money(r.cost) + '</td>' +
        '<td><div class="bar" style="width:' + ((r.cost || 0) / max * 100).toFixed(1) + '%"></div></td>' +
        '<td class="num">' + money(td.cost) + '</td><td class="num">' + num(td.requests) + ' / ' + num(d.dailyLimit) + '</td><td class="muted">' + ago(r.last) + (r.errors ? ' · ' + r.errors + ' errors' : '') + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="empty">No invite codes yet. Add some to INVITE_CODES.</div>';

  $('models').innerHTML = d.models.length ? '<table><thead><tr><th>Model</th><th class="num">Requests</th><th class="num">Input tokens</th><th class="num">From cache</th><th class="num">Output tokens</th><th class="num">Spend</th></tr></thead><tbody>' +
    d.models.map(function (m) {
      var pct = m.input ? Math.round(m.cache_read / m.input * 100) : 0;
      return '<tr><td>' + esc(m.model) + '</td><td class="num">' + num(m.requests) + '</td><td class="num">' + num(m.input) + '</td><td class="num">' + pct + '%</td><td class="num">' + num(m.output) + '</td><td class="num">' + money(m.cost) + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="empty">No requests in this range.</div>';
}

function niceMax(v) {
  if (v <= 0) return 0.1;
  var p = Math.pow(10, Math.floor(Math.log10(v)));
  var steps = [1, 2, 2.5, 5, 10];
  for (var i = 0; i < steps.length; i++) if (steps[i] * p >= v) return steps[i] * p;
  return 10 * p;
}

function drawChart(series) {
  var total = series.reduce(function (a, s) { return a + s.owner + s.persona + s.coach; }, 0);
  if (total === 0) { $('chart').innerHTML = '<div class="empty">No usage in this range yet.</div>'; return; }
  var W = Math.max(320, $('chart').clientWidth || 1000), H = 280, L = 52, R = 8, T = 10, B = 28;
  var iw = W - L - R, ih = H - T - B;
  var top = niceMax(Math.max.apply(null, series.map(function (s) { return s.owner + s.persona + s.coach; })));
  var y = function (v) { return T + ih - v / top * ih; };
  var slot = iw / series.length, bw = Math.max(2, Math.min(28, slot - 2));
  var svg = '';
  for (var g = 0; g <= 4; g++) {
    var gv = top * g / 4, gy = y(gv);
    svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--grid)" stroke-width="1"/>';
    svg += '<text x="' + (L - 8) + '" y="' + (gy + 4) + '" fill="var(--dim)" font-size="11" text-anchor="end">' + money(gv) + '</text>';
  }
  var every = Math.ceil(series.length / 8);
  series.forEach(function (s, i) {
    var x = L + i * slot + (slot - bw) / 2;
    var base = 0, segs = [];
    ROLES.forEach(function (r) { var v = s[r[0]]; if (v > 0) { segs.push([base, base + v, r[2]]); base += v; } });
    segs.forEach(function (sg, j) {
      var y0 = y(sg[0]), y1 = y(sg[1]);
      var h = y0 - y1 - (j > 0 ? 2 : 0); // 2px surface gap between stacked segments
      if (h < 0.5) h = 0.5;
      var yTop = y0 - (j > 0 ? 2 : 0) - h;
      if (j === segs.length - 1 && h > 4) {
        var r = Math.min(4, bw / 2);
        svg += '<path d="M' + x + ',' + (yTop + h) + 'V' + (yTop + r) + 'Q' + x + ',' + yTop + ' ' + (x + r) + ',' + yTop + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + yTop + ' ' + (x + bw) + ',' + (yTop + r) + 'V' + (yTop + h) + 'Z" fill="' + sg[2] + '"/>';
      } else {
        svg += '<rect x="' + x + '" y="' + yTop + '" width="' + bw + '" height="' + h + '" fill="' + sg[2] + '"/>';
      }
    });
    if ((series.length - 1 - i) % every === 0) svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" fill="var(--dim)" font-size="11" text-anchor="middle">' + dayLabel(s.day) + '</text>';
    svg += '<rect class="hit" data-i="' + i + '" x="' + (L + i * slot) + '" y="' + T + '" width="' + slot + '" height="' + ih + '" fill="transparent"/>';
  });
  svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--border)" stroke-width="1"/>';
  $('chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Spend per day, stacked by owner replies, persona builder and coach">' + svg + '</svg><div class="tip" id="tip"></div>';

  var tip = $('tip'), box = $('chart');
  box.querySelectorAll('.hit').forEach(function (el) {
    el.addEventListener('mousemove', function (ev) {
      var s = series[+el.getAttribute('data-i')];
      tip.innerHTML = '<div class="t">' + dayLabel(s.day) + ' · ' + money(s.owner + s.persona + s.coach) + '</div>' +
        ROLES.slice().reverse().map(function (r) { return '<div class="r"><span><b style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + r[2] + ';margin-right:6px"></b>' + r[1] + '</span><b>' + money(s[r[0]]) + '</b></div>'; }).join('');
      tip.style.display = 'block';
      var rect = box.getBoundingClientRect();
      var left = ev.clientX - rect.left + 14;
      if (left + tip.offsetWidth > rect.width) left = ev.clientX - rect.left - tip.offsetWidth - 14;
      tip.style.left = left + 'px';
      tip.style.top = Math.max(0, ev.clientY - rect.top - tip.offsetHeight - 10) + 'px';
    });
    el.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  });
}

document.querySelectorAll('#range button').forEach(function (b) {
  b.onclick = function () {
    days = +b.getAttribute('data-d');
    document.querySelectorAll('#range button').forEach(function (x) { x.classList.toggle('on', x === b); });
    load();
  };
});
window.addEventListener('resize', function () { if (lastSeries) drawChart(lastSeries); });
load();
</script>
</body>
</html>`;
