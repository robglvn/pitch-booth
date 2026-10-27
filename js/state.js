// Pitch Booth — Settings, call history, invite links, and the invited person's profile on the server.
'use strict';

/* ---------- storage ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

const DEFAULT_SETTINGS = {
  apiKey: '',
  preset: 'balanced',
  ownerModel: 'claude-haiku-5-5',
  personaModel: 'claude-sonnet-5-5',
  coachModel: 'claude-sonnet-5-5',
  ownerEffort: 'low',
  coachEffort: 'medium',
  cache: true,
  myName: '',
  city: '',
  pitch: "I'm a local videographer/photographer. I make photos and short-form video (Instagram/TikTok/Facebook reels) for small businesses: behind-the-scenes reels, product and menu photography, staff and owner features, event coverage. I offer monthly content packages so owners get fresh posts every week without doing it themselves.\n(Edit this with your real packages and pricing.)",
  voiceOn: true,
  showTips: true,
  talkMode: 'auto', // 'auto' = hands-free on phones, hold-to-talk elsewhere
  voiceName: '',
  rate: 1,
};
let settings = { ...DEFAULT_SETTINGS, ...LS.get('ph_settings', {}) };
delete settings.model; // replaced by presets / per-role models

// Who plays which part. The owner talks every turn, so it's where a cheaper model saves the most.
const PRESETS = {
  realistic: { owner: 'claude-sonnet-5-5', persona: 'claude-sonnet-5-5', coach: 'claude-sonnet-5-5' },
  balanced: { owner: 'claude-haiku-5-5', persona: 'claude-sonnet-5-5', coach: 'claude-sonnet-5-5' },
  budget: { owner: 'claude-haiku-5-5', persona: 'claude-haiku-5-5', coach: 'claude-haiku-5-5' },
};
const roleModel = role => (PRESETS[settings.preset] || {})[role] || settings[role + 'Model'] || DEFAULT_SETTINGS[role + 'Model'];

// $ per million tokens: [input, output, cache-read multiplier]. Cache writes are 1.25x input.
const PRICES = {
  'claude-haiku-5-5': [0.10, 0.50, 0.1],
  'claude-sonnet-5-5': [2, 10, 0.1],
  'claude-sonnet-5': [2, 10, 0.1],
  'claude-opus-5-5': [4, 20, 0.05],
  'claude-opus-5': [5, 25, 0.1],
  'claude-fable-5-1': [10, 50, 0.025],
};
function addUsage(track, model, u, role) {
  track.cost = track.cost || { cents: 0, uncachedCents: 0, known: true, byRole: {} };
  const p = PRICES[model];
  if (!p || !u) { track.cost.known = false; return; }
  const inp = u.input_tokens || 0, read = u.cache_read_input_tokens || 0, write = u.cache_creation_input_tokens || 0, out = u.output_tokens || 0;
  const cents = (inp * p[0] + read * p[0] * p[2] + write * p[0] * 1.25 + out * p[1]) / 1e4;
  track.cost.cents += cents;
  track.cost.uncachedCents += ((inp + read + write) * p[0] + out * p[1]) / 1e4;
  if (role) {
    const r = (track.cost.byRole = track.cost.byRole || {})[role] ||= { cents: 0, requests: 0, outTokens: 0 };
    r.cents += cents; r.requests++; r.outTokens += out;
  }
}

// Invited people go through this site's own server (/api) with their invite code, and their
// profile and calls live there. Anyone who pastes their own API key instead goes straight to
// Anthropic, and their history stays in this browser.
const usingProxy = () => !!settings.inviteCode && !settings.apiKey;

// Invite links look like …/#invite=CODE. Save the code, then drop it from the address bar.
function takeInviteFromUrl() {
  const m = location.hash.match(/invite=([\w-]+)/);
  if (!m) return false;
  settings.inviteCode = m[1].toLowerCase();
  LS.set('ph_settings', settings);
  try { window.history.replaceState(null, '', location.pathname + location.search); } catch {}
  return true;
}
takeInviteFromUrl();
// An invite link opened while the app is already open only changes the hash, so pick it up here too.
window.addEventListener('hashchange', () => { if (takeInviteFromUrl() && !call) init(); });
let history = usingProxy() ? [] : LS.get('ph_history', []);
const saveHistory = () => { if (!usingProxy() && !LS.set('ph_history', history)) showError("Couldn't save to localStorage (storage full or blocked)."); };
/* ---------- profile (invited people) ---------- */
let profile = null;
const PREF_KEYS = ['preset', 'ownerModel', 'personaModel', 'coachModel', 'ownerEffort', 'coachEffort', 'cache', 'voiceOn', 'rate', 'showTips', 'talkMode'];
const pickPrefs = o => Object.fromEntries(PREF_KEYS.filter(k => o && k in o).map(k => [k, o[k]]));

async function api(path, opts = {}) {
  let res, data;
  try {
    res = await fetch(path, { ...opts, headers: { 'content-type': 'application/json', 'x-invite-code': settings.inviteCode, ...(opts.headers || {}) } });
  } catch { throw new FriendlyError("Couldn't reach the practice server. Check your internet connection."); }
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new FriendlyError(friendlyApiError(res.status, data?.error?.message || '', '', true, data?.error?.type));
    err.type = data?.error?.type;
    throw err;
  }
  return data;
}

// Calls listed from the server carry only their summary; the full scorecard loads when opened.
function fromServerCall(c) {
  const s = c.summary || {};
  return {
    id: c.id, remote: true, date: new Date(c.ts).toISOString(), mode: c.mode, difficulty: c.difficulty,
    objection: s.objection, overall: c.overall, durationSecs: s.durationSecs, setup: s.setup, callType: s.callType, customerType: s.customerType, business: s.business, traitSig: s.traitSig,
    grade: { asked_for_sale: c.asked_for_sale }, persona: { name: s.personaName, card_summary: s.card || '' },
  };
}

async function loadProfile() {
  const d = await api('/api/me');
  profile = d.profile;
  settings = { ...settings, ...pickPrefs(profile.prefs) };
  if (profile.name) settings.myName = profile.name;
  if (profile.sells) settings.pitch = profile.sells;
  settings.seller = profile.seller && Object.keys(profile.seller).length ? profile.seller : undefined;
  settings.city = profile.city || '';
  history = d.calls.map(fromServerCall);
}

async function saveProfile() {
  await api('/api/me', { method: 'PUT', body: JSON.stringify({ name: settings.myName, sells: settings.pitch, city: settings.city, seller: settings.seller || {}, prefs: pickPrefs(settings) }) });
  profile = { ...profile, name: settings.myName, sells: settings.pitch, city: settings.city, seller: settings.seller };
}

async function saveCallRemote(entry) {
  const { cost, models, transcript, ...detail } = entry;
  try {
    const { id } = await api('/api/calls', {
      method: 'POST',
      body: JSON.stringify({
        mode: entry.mode, difficulty: entry.difficulty, overall: entry.overall, asked_for_sale: !!entry.grade.asked_for_sale,
        summary: { objection: entry.objection, durationSecs: entry.durationSecs, setup: entry.setup, card: entry.persona.card_summary, personaName: entry.persona.name, callType: entry.callType, customerType: entry.customerType, business: entry.business, traitSig: entry.traitSig },
        detail,
      }),
    });
    entry.id = id; entry.remote = true;
  } catch (e) {
    showError("Couldn't save this call to your profile: " + e.message);
  }
}

async function openEntry(e) {
  if (e.remote && !e.turns) {
    show('score');
    $('view-score').innerHTML = '<div class="card loading"><div class="spinner"></div><div>Loading call…</div></div>';
    try { Object.assign(e, await api('/api/calls?id=' + encodeURIComponent(e.id)), { id: e.id, remote: true }); }
    catch (err) { show('history'); showError(err.message); return; }
  }
  show('score');
  renderScorecard(e);
}
