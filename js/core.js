// Pitch Booth — Shared helpers, reference data (call phases, moods, score labels) and screen switching.
'use strict';

/* ---------- reference data ---------- */
// Industries, their customer types and the four kinds of call live in industries.js.
const CATEGORIES = window.PB_INDUSTRIES;
const CALL_TYPES = window.PB_CALL_TYPES;
// Personality traits, their odds and rules, plus backgrounds, live in personalities.js.
const PERSONALITY = window.PB_PERSONALITY;
// Kinds of business and owner types, for calling business owners, live in data/business-types.js.
const BUSINESS_TYPES = window.PB_BUSINESS_TYPES;
const OWNER_TYPES = window.PB_OWNER_TYPES;
// The searchable list of jobs behind "What do you do?" lives in data/professions.js.
const PROFESSIONS = window.PB_PROFESSIONS;
const PHASES = [
  { id: 'opener', t: 'Opener', d: 'Permission-based, under 30 seconds', hint: 'Ask for permission: "Did I catch you at a bad time?" Keep it short.' },
  { id: 'intro', t: 'Who I am + why I\'m calling', d: 'One breath: you, and why them', hint: 'Say who you are and why you called *them* specifically.' },
  { id: 'discovery', t: 'Discovery', d: 'Ask before you pitch', hint: 'Ask about their situation: what\'s working, what isn\'t, what they want. Aim for 3+ questions.' },
  { id: 'pitch', t: 'Pitch', d: 'Tied to what they said', hint: 'Start with "You mentioned…" and connect to their words, not a script.' },
  { id: 'objection', t: 'Objection handling', d: 'Acknowledge → ask → answer', hint: 'Don\'t argue. Acknowledge it, ask a question about it, then answer.' },
  { id: 'close', t: 'Close', d: 'Trial close, then ask', hint: 'Trial close ("Does that sound useful?"), then ask directly for the next step.' },
];
const MOODS = { cold: ['#b9472f', 'Cold'], guarded: ['#c98a2b', 'Guarded'], neutral: ['#a39b91', 'Neutral'], warming: ['#8fa85e', 'Warming up'], interested: ['#3f7d5c', 'Interested'], sold: ['#2f6248', 'Sold'] };
const SCORE_KEYS = [['opener', 'Opener'], ['discovery', 'Discovery'], ['listening', 'Listening'], ['objection_handling', 'Objection handling'], ['close_attempt', 'Close attempt'], ['rapport', 'Rapport']];
// Shown to people; the ids (easy/realistic/brutal) stay the same in prompts and saved calls.
const DIFFICULTY_LABELS = { easy: 'Easy', realistic: 'Realistic', brutal: 'Brutal' };
const DRILL_REPS = 5;
const BRUTAL_UNLOCK = 3;
const BRUTAL_CUTOFF_MS = 20000;

const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const clamp = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const completedCount = () => history.length;
const brutalUnlocked = () => completedCount() >= BRUTAL_UNLOCK;
/* ---------- views ---------- */
const VIEWS = ['welcome', 'home', 'setup', 'prep', 'call', 'score', 'history'];
let currentView = 'home';
function show(v) {
  currentView = v;
  VIEWS.forEach(x => $('view-' + x).classList.toggle('hidden', x !== v));
  $('top-nav').classList.toggle('hidden', v === 'welcome');
  hideError();
  if (v === 'home') renderHome();
  if (v === 'history') renderHistory();
  window.scrollTo(0, 0);
}
function showError(msg) { const b = $('err-banner'); b.textContent = msg; b.classList.remove('hidden'); }
function hideError() { $('err-banner').classList.add('hidden'); }
