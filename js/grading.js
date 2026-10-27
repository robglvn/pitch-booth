// Pitch Booth — Ending a call and asking the coach for a score.
'use strict';

/* ---------- grading ---------- */
async function gradeCall(c) {
  const { system, user } = coachPrompt(c);
  const { json } = await callClaude({ model: c.models.coach, system, messages: [{ role: 'user', content: user }], maxTokens: 12000, effort: c.coachEffort, schema: GRADE_SCHEMA, track: c, role: 'coach' });
  return json;
}

async function endCall() {
  if (!call || call.ended) return;
  if (talking) stopTalk();
  call.ended = true;
  clearInterval(call.timerId);
  stopSpeaking();
  keepAwake(false);
  const c = call;
  const callerTurns = c.turns.filter(t => t.who === 'me').length;
  if (!c.persona || callerTurns === 0) { call = null; show('home'); showError('Call ended before you said anything, so there was nothing to score.'); return; }

  show('score');
  $('view-score').innerHTML = `<div class="card loading"><div class="spinner"></div><div>Running your Pitch Check…</div><div class="small muted">${callerTurns} of your lines · ${fmt(elapsed())}</div></div>`;
  const durationSecs = Math.round(elapsed());
  let grade;
  try {
    grade = await gradeCall(c);
  } catch (e) {
    $('view-score').innerHTML = `<div class="card"><h2>Couldn't score this call</h2><p class="muted">${esc(e instanceof FriendlyError ? e.message : e.message)}</p>
      <div class="row"><button class="btn primary" id="retry-grade">Try again</button><button class="btn" id="grade-home">Home</button></div></div>`;
    $('retry-grade').onclick = () => { call = c; call.ended = false; endCall(); };
    $('grade-home').onclick = () => { call = null; show('home'); };
    return;
  }
  const vals = SCORE_KEYS.map(([k]) => grade.scores[k]).filter(v => v > 0);
  const overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
  const entry = {
    id: Date.now().toString(36),
    date: new Date().toISOString(),
    mode: c.cfg.mode, difficulty: c.cfg.difficulty, objection: c.cfg.objection,
    callType: c.cfg.callType, customerType: c.cfg.customerType?.label || null,
    traitSig: c.cfg.personality?.sig || null, traits: PERSONALITY.labels(c.cfg.personality?.ids || {}),
    setup: { mode: c.cfg.mode, opts: c.cfg.opts },
    persona: c.persona,
    durationSecs,
    metrics: { discovery: c.discoveryCount, questions: c.questionCount, statements: c.statementCount, openerSecs: c.openerSecs },
    grade, overall,
    models: c.models,
    cost: c.cost,
    transcript: transcriptText(c),
    turns: c.turns,
  };
  const wasLocked = !brutalUnlocked();
  history.unshift(entry);
  if (usingProxy()) saveCallRemote(entry); else saveHistory();
  call = null;
  renderScorecard(entry, wasLocked && brutalUnlocked());
}
