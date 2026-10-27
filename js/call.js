// Pitch Booth — The call itself: building the person, the Get ready screen, dialing, each turn, and the live call screen.
'use strict';

/* ---------- call state ---------- */
async function generatePersona(cfg) {
  const { system, user } = personaBuilderPrompt(cfg);
  const { json } = await callClaude({ model: call.models.persona, system, messages: [{ role: 'user', content: user }], maxTokens: 4000, effort: 'medium', schema: PERSONA_SCHEMA, track: call, role: 'persona' });
  json.voice_pitch = clamp(json.voice_pitch, 0.75, 1.25, 1);
  json.voice_rate = clamp(json.voice_rate, 0.85, 1.2, 1);
  json.objections = (json.objections || []).slice(0, 2);
  return json;
}

let call = null;

function buildConfig(mode, opts = {}) {
  let difficulty = opts.difficulty || 'realistic';
  if (mode === 'random') difficulty = brutalUnlocked() && Math.random() < 0.25 ? 'brutal' : 'realistic';
  if (difficulty === 'brutal' && !brutalUnlocked()) difficulty = 'realistic';
  // The person is generated fresh each call: one customer type from the industry, plus random personality, age and background.
  const types = sellerCat().types || [];
  const customerType = (opts.customerType && types.find(x => x.label === opts.customerType)) || (types.length ? pick(types) : null);
  const callType = CALL_TYPES[opts.callType] ? opts.callType : pick(userCallTypes());
  const objection = mode === 'drill' ? (opts.objection || pick(objectionPool())) : null;
  // A fresh mix of personality traits each call, avoiding the kinds of people met in the last few calls.
  const personality = PERSONALITY.roll({ difficulty, preset: opts.archetype, avoid: history.slice(0, 5).map(h => h.traitSig).filter(Boolean) });
  return { mode, difficulty, personality, customerType, callType, objection, opts };
}

// Tapping a call card builds the person first, then shows who you're calling and what you're selling.
// Nothing rings until the caller presses Call.
async function startCall(cfg) {
  hideError();
  call = {
    cfg, persona: null, messages: [], turns: [], startedAt: null, busy: true, ended: false,
    phasesSeen: new Set(), currentPhase: 'opener', discoveryCount: 0, questionCount: 0, statementCount: 0,
    askedForSale: false, trialClose: false, openerSecs: null, mood: 'guarded', rep: 1, reps: [], timerId: null, outcome: null,
    // Fixed for the whole call: caches are per model and per effort, so changing either mid-call would miss.
    models: { owner: roleModel('owner'), persona: roleModel('persona'), coach: roleModel('coach') },
    ownerEffort: settings.ownerEffort, coachEffort: settings.coachEffort, cache: settings.cache,
    cost: { cents: 0, uncachedCents: 0, known: true, byRole: {} },
  };
  const mine = call;
  show('prep');
  $('prep').innerHTML = '<div class="card loading"><div class="spinner"></div><div>Finding someone to call…</div></div>';
  try {
    mine.persona = await generatePersona(cfg);
  } catch (e) {
    if (call !== mine) return;
    call = null;
    show('home');
    showError(e instanceof FriendlyError ? e.message : 'Something went wrong setting up the call: ' + e.message);
    return;
  }
  if (call !== mine || currentView !== 'prep') return;
  renderPrep();
}

const goalLine = cfg => cfg.mode === 'drill'
  ? 'Handle the objection: acknowledge it, ask about it, answer, then push for a next step.'
  : `${CALL_TYPES[cfg.callType].goal[0].toUpperCase()}${CALL_TYPES[cfg.callType].goal.slice(1)}.${seller().goal ? ` Your next step: ${seller().goal}.` : ''}`;

// What you're selling, for the Get ready screen and the side of the call screen.
function pitchHtml() {
  const s = seller();
  const rows = s.offer && !s.quick
    ? [['Offer', s.offer + (s.company ? ` (${s.company})` : '')], ['Why you', s.edge], ['Price', s.price], ['Special', s.promo], ['Ask for', s.goal]].filter(r => r[1])
    : [['Offer', (s.offer || settings.pitch || '').slice(0, 240)]];
  return `<h3 class="pitch-h">What you're selling</h3>${rows.map(([k, v]) => `<div class="pitch-row"><span>${k}</span><p>${esc(v)}</p></div>`).join('')}`;
}

function renderPrep() {
  const c = call, p = c.persona, cfg = c.cfg, ct = CALL_TYPES[cfg.callType], first = p.name.split(' ')[0];
  $('prep').innerHTML = `
    <div class="card prep-card">
      <div class="small muted prep-kicker">${esc(modeLabel(cfg))} · Get ready</div>
      <div class="persona" style="margin-top:12px">
        <div class="avatar" style="background:${avatarColor(p.name)}">${esc(initials(p.name))}</div>
        <div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="sub">${esc(p.card_detail || p.who_line || '')}</div></div>
      </div>
      ${p.caller_briefing ? `<div class="brief"><b>What you know:</b> ${esc(p.caller_briefing)}</div>` : ''}
      <div class="prep-grid">
        <div><h3>Your goal</h3><p>${esc(goalLine(cfg))}</p></div>
        ${cfg.objection ? `<div><h3>Objection you'll practice</h3><p>“${esc(cfg.objection)}”</p></div>` : `<div><h3>Tip</h3><p>${esc(ct.tip || '')}</p></div>`}
      </div>
      <div class="pitch-box">${pitchHtml()}</div>
      <div class="row prep-actions">
        <button class="btn primary" id="prep-call">${icon('phone')} Call ${esc(first)}</button>
        <button class="btn" id="prep-other">Someone else</button>
        <button class="btn" id="prep-back">Back</button>
      </div>
      <p class="small muted" style="margin:12px 0 0">Their personality and what they're really thinking stay hidden until the scorecard.</p>
    </div>`;
  $('prep-call').onclick = dial;
  $('prep-other').onclick = () => startCall(buildConfig(cfg.mode, cfg.opts));
  $('prep-back').onclick = () => { call = null; show('home'); };
}

async function dial() {
  const cfg = call.cfg;
  show('call');
  $('call-mode-label').textContent = modeLabel(cfg);
  $('next-rep').classList.toggle('hidden', cfg.mode !== 'drill');
  $('next-rep').textContent = 'Next rep';
  $('timer').textContent = '0:00';
  $('transcript').innerHTML = '';
  $('pitch-side').innerHTML = pitchHtml();
  $('pitch-inline-body').innerHTML = pitchHtml();
  $('mute').classList.toggle('hidden', !handsFree());
  muted = false; $('mute').textContent = 'Mute';
  $('ptt-help').innerHTML = helpText();
  call.system = personaSystemPrompt(call.persona, cfg);
  renderPersona();
  renderCoach();
  setPtt(cfg.mode === 'drill' ? 'Connecting…' : 'Ringing…', true);
  keepAwake(true);

  if (cfg.mode !== 'drill') {
    const stopRing = startRinging();
    await new Promise(r => setTimeout(r, 2500 + Math.random() * 2500)); // a ring or two before they pick up
    stopRing();
  }
  if (!call || call.ended) return;
  call.startedAt = Date.now();
  call.timerId = setInterval(() => { $('timer').textContent = fmt(elapsed()); }, 500);

  if (cfg.mode === 'drill') {
    await startRep();
  } else {
    const pickup = call.persona.pickup_line;
    call.messages.push({ role: 'user', content: '[Call notes — from the training software, not spoken: the phone rings and you pick up.]' });
    call.messages.push({ role: 'assistant', content: JSON.stringify({ caller_move: 'none', phase: 'opener', mood: 'guarded', say: pickup, hang_up: false }) });
    addTurn('them', pickup);
    call.busy = false;
    setPtt(handsFree() ? 'Interrupt' : pttIdle(), false);
    await speak(pickup, call.persona);
    listenNext();
  }
}

// Keeps a phone screen from locking mid-call.
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}

function modeLabel(cfg) {
  const d = DIFFICULTY_LABELS[cfg.difficulty] || cfg.difficulty;
  if (cfg.mode === 'drill') return `Pushback practice · ${d}`;
  if (CALL_TYPES[cfg.callType]) return `${CALL_TYPES[cfg.callType].label} · ${d}`;
  if (cfg.mode === 'scenario') return `Specific call · ${d}`;
  return `Random call · ${d}`;
}

const elapsed = () => (call && call.startedAt ? (Date.now() - call.startedAt) / 1000 : 0);

async function startRep() {
  call.messages = [];
  addTurn('sys', `Rep ${call.rep} of ${DRILL_REPS}`);
  call.messages.push({ role: 'user', content: `[Call notes — from the training software, not spoken: segment ${call.rep} of ${DRILL_REPS} begins. The caller just finished a quick intro and pitch. Speak first and raise your objection.]` });
  await ownerTurn();
}

function addTurn(who, text, extra = {}) {
  const turn = { who, text, t: elapsed(), rep: call.rep, ...extra };
  call.turns.push(turn);
  renderTranscript();
  return turn;
}

async function handleCallerUtterance(text, meta = {}) {
  text = text.trim();
  if (!call || call.ended || call.busy) return;
  if (!text) { flashHelp(handsFree() ? "Didn't catch that. Tap the button and try again." : "Didn't catch that — hold the button a little longer and speak clearly."); return; }
  const isFirst = !call.turns.some(t => t.who === 'me');
  const turn = addTurn('me', text, { dur: meta.dur });
  if (isFirst && meta.dur) call.openerSecs = Math.round(meta.dur);

  const notes = [`elapsed ${fmt(elapsed())}`, `discovery questions the caller has asked so far (before this line): ${call.discoveryCount}`];
  if (meta.cutoff) notes.push('the caller talked for over 20 seconds without stopping; you cut them off mid-sentence');
  if (meta.bargedIn) notes.push('the caller talked over you before you finished');
  if (call.cfg.mode === 'drill') notes.push(`segment ${call.rep} of ${DRILL_REPS}`);
  call.messages.push({ role: 'user', content: `${text}\n\n[Call notes — from the training software, not spoken: ${notes.join('; ')}.]` });

  const ok = await ownerTurn(turn);
  if (!ok) {
    // roll back so the caller can retry
    call.messages.pop();
    call.turns = call.turns.filter(t => t !== turn);
    renderTranscript();
    $('type-input').value = text;
  }
}

async function ownerTurn(callerTurn) {
  call.busy = true;
  setPtt(`${call.persona.name.split(' ')[0]} is responding…`, true);
  showTyping(true);
  let res;
  try {
    res = await callClaude({ model: call.models.owner, system: call.system, messages: call.messages, maxTokens: 1500, effort: call.ownerEffort, schema: TURN_SCHEMA, cache: call.cache, track: call, role: 'owner' });
  } catch (e) {
    showTyping(false);
    call.busy = false;
    setPtt(pttIdle(), false);
    showError((e instanceof FriendlyError ? e.message : 'Unexpected error: ' + e.message) + (callerTurn ? ' Your line is back in the text box — press Enter to resend.' : ''));
    return false;
  }
  showTyping(false);
  if (!call || call.ended) return true;
  hideError();
  const r = res.json;
  call.messages.push({ role: 'assistant', content: res.raw });
  if (callerTurn) applyAnalysis(callerTurn, r);
  if (r.mood && MOODS[r.mood]) call.mood = r.mood;
  renderPersona();
  addTurn('them', r.say);
  renderCoach();
  call.busy = false;
  setPtt(handsFree() ? 'Interrupt' : pttIdle(), false);
  await speak(r.say, call.persona);
  if (r.hang_up && call && !call.ended) {
    addTurn('sys', `${call.persona.name.split(' ')[0]} hung up`);
    if (call.cfg.mode === 'drill' && call.rep < DRILL_REPS) { setPtt('Rep over — press Next rep', true); }
    else { call.outcome = 'hung_up'; setTimeout(() => endCall(), 900); }
    return true;
  }
  if (call && !call.ended && !talking) { setPtt(muted ? 'Muted' : pttIdle(), false); listenNext(); }
  return true;
}

function applyAnalysis(turn, r) {
  turn.move = r.caller_move;
  switch (r.caller_move) {
    case 'discovery_question': call.discoveryCount++; call.questionCount++; break;
    case 'other_question': call.questionCount++; break;
    case 'ask_for_sale': call.askedForSale = true; call.statementCount++; break;
    case 'trial_close': call.trialClose = true; call.questionCount++; break;
    case 'none': case 'off_call': break;
    default: call.statementCount++;
  }
  if (r.phase) { call.currentPhase = r.phase; call.phasesSeen.add(r.phase); }
  if (r.caller_move === 'opener' || call.turns.filter(t => t.who === 'me').length === 1) call.phasesSeen.add('opener');
  if (r.caller_move === 'intro') call.phasesSeen.add('intro');
  if (r.caller_move === 'pitch') call.phasesSeen.add('pitch');
  if (r.caller_move === 'objection_response') call.phasesSeen.add('objection');
}
/* ---------- call rendering ---------- */
function avatarColor(name) { return `hsl(${hash(name) % 360} 38% 85%)`; }
function initials(name) { return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

function renderPersona() {
  const p = call.persona;
  const [color, label] = MOODS[call.mood] || MOODS.neutral;
  const order = Object.keys(MOODS), level = Math.max(0, order.indexOf(call.mood)) + 1;
  $('persona-card').innerHTML = `
    <div class="persona">
      <div class="avatar" style="background:${avatarColor(p.name)}">${esc(initials(p.name))}</div>
      <div style="min-width:0">
        <div class="name">${esc(p.name.split(' ')[0])}, ${esc(p.age)} — ${esc(p.who_line || '')}</div>
        <div class="sub">${esc(p.card_detail || '')}</div>
        <div class="meter" title="How they feel about this call, from Cold to Sold"><div class="meter-track"><div class="meter-fill" style="width:${level / order.length * 100}%;background:${color}"></div></div><span>${esc(label)}</span></div>
      </div>
    </div>
    ${p.caller_briefing ? `<div class="brief"><b>What you know:</b> ${esc(p.caller_briefing)}</div>` : ''}`;
}

function renderTranscript() {
  const box = $('transcript');
  const firstName = call.persona ? call.persona.name.split(' ')[0] : 'Owner';
  box.innerHTML = call.turns.map(t => {
    if (t.who === 'sys') return `<div class="msg sys">${esc(t.text)}</div>`;
    const who = t.who === 'me' ? (settings.myName || 'You') : firstName;
    return `<div class="msg ${t.who}"><div class="who">${esc(who)} · ${fmt(t.t)}</div>${esc(t.text)}</div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function renderLive() {
  const box = $('transcript');
  let live = box.querySelector('.msg.live');
  if (!live) { live = document.createElement('div'); live.className = 'msg me live'; box.appendChild(live); }
  const text = (recFinal + ' ' + recInterim).trim();
  live.innerHTML = `<div class="who">${esc(settings.myName || 'You')} · speaking</div>${esc(text) || '<span class="muted">…</span>'}`;
  box.scrollTop = box.scrollHeight;
}

function showTyping(on) {
  const box = $('transcript');
  const ex = box.querySelector('.typing');
  if (ex) ex.remove();
  if (on) {
    const d = document.createElement('div');
    d.className = 'msg them typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
  }
}

function renderCoach() {
  const c = call;
  const drill = c.cfg.mode === 'drill';
  $('phases').innerHTML = PHASES.map(ph => {
    let done = c.phasesSeen.has(ph.id);
    let meta = ph.d;
    if (ph.id === 'opener' && c.openerSecs != null) meta = `${c.openerSecs}s ${c.openerSecs <= 30 ? '✓ under 30s' : '— over 30s, tighten it'}`;
    if (ph.id === 'discovery') { done = c.discoveryCount >= 2; meta = `${c.discoveryCount} question${c.discoveryCount === 1 ? '' : 's'} asked${c.discoveryCount < 2 ? ' · ask 2+ before pitching' : ''}`; }
    if (ph.id === 'close') { done = c.askedForSale; meta = c.askedForSale ? 'You asked for the sale ✓' : (c.trialClose ? 'Trial close ✓ — now ask directly' : ph.d); }
    const current = ph.id === c.currentPhase && !c.ended;
    const dimmed = drill && (ph.id === 'opener' || ph.id === 'intro');
    return `<li class="${done ? 'done' : ''} ${current ? 'current' : ''}" style="${dimmed ? 'opacity:.4' : ''}">
      <div class="box">${done ? icon('check', 14) : ''}</div>
      <div><div class="t">${esc(ph.t)}</div><div class="meta">${esc(meta)}</div>${current && settings.showTips ? `<div class="hint">${esc(ph.hint)}</div>` : ''}</div>
    </li>`;
  }).join('');
  const ratio = c.statementCount ? (c.questionCount / c.statementCount).toFixed(1) : (c.questionCount ? '∞' : '—');
  $('live-stats').innerHTML = `
    <div class="kv"><span>Questions asked</span><span>${c.questionCount}</span></div>
    <div class="kv"><span>Question : statement</span><span>${ratio}</span></div>
    <div class="kv"><span>Asked for the sale</span><span>${c.askedForSale ? '<span style="color:var(--green)">Yes</span>' : 'Not yet'}</span></div>
    ${drill ? `<div class="kv"><span>Rep</span><span>${c.rep} / ${DRILL_REPS}</span></div>` : ''}`;
}

$('next-rep').onclick = async () => {
  if (!call || call.busy) return;
  if (talking) stopTalk();
  stopSpeaking();
  if (call.rep >= DRILL_REPS) { endCall(); return; }
  call.rep++;
  if (call.rep === DRILL_REPS) $('next-rep').textContent = 'Finish drill';
  renderCoach();
  await startRep();
};
$('end-call').onclick = () => endCall();
