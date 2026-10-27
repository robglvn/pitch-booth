// Pitch Booth — "Pick your scenario" and the objection drill setup.
'use strict';

/* ---------- setup ---------- */
let setupMode = 'scenario', setupDifficulty = 'realistic';
function openSetup(mode) {
  setupMode = mode;
  setupDifficulty = 'realistic';
  $('setup-title').textContent = mode === 'drill' ? 'Objection drill' : 'Pick your scenario';
  $('setup-objection-wrap').classList.toggle('hidden', mode !== 'drill');
  $('setup-personality-wrap').classList.toggle('hidden', mode === 'drill');
  $('setup-start').textContent = mode === 'drill' ? `Start drill (${DRILL_REPS} reps)` : 'Start call';
  $('setup-objection').innerHTML = '<option value="">Random</option>' + objectionPool().map(o => `<option>${esc(o)}</option>`).join('');
  $('setup-calltype').innerHTML = '<option value="">Random</option>' + userCallTypes().map(k => `<option value="${k}">${esc(CALL_TYPES[k].label)}</option>`).join('');
  const types = sellerCat().types || [];
  $('setup-type').innerHTML = '<option value="">Random</option>' + types.map(x => `<option>${esc(x.label)}</option>`).join('');
  $('setup-type-wrap').classList.toggle('hidden', !types.length);
  $('setup-personality').innerHTML = '<option value="">Random</option>' + Object.entries(PERSONALITY.PRESETS).map(([k, x]) => `<option value="${k}">${esc(x.label)}</option>`).join('');
  renderDifficulty();
  show('setup');
}
function renderDifficulty() {
  document.querySelectorAll('#setup-difficulty button').forEach(b => {
    b.classList.toggle('on', b.dataset.d === setupDifficulty);
    if (b.dataset.d === 'brutal') { b.disabled = !brutalUnlocked(); b.textContent = brutalUnlocked() ? 'Brutal' : '🔒 Brutal'; }
  });
  $('setup-brutal-note').textContent = brutalUnlocked() ? '' : `Brutal unlocks after ${BRUTAL_UNLOCK} completed calls (${completedCount()}/${BRUTAL_UNLOCK}).`;
}
document.querySelectorAll('#setup-difficulty button').forEach(b => b.onclick = () => { setupDifficulty = b.dataset.d; renderDifficulty(); });
$('setup-start').onclick = () => startCall(buildConfig(setupMode, {
  callType: $('setup-calltype').value || null,
  customerType: $('setup-type').value || null,
  archetype: setupMode === 'drill' ? null : ($('setup-personality').value || null),
  objection: $('setup-objection').value || null,
  difficulty: setupDifficulty,
}));
$('setup-cancel').onclick = () => show('home');

$('mode-random').onclick = () => startCall(buildConfig('random'));
$('mode-scenario').onclick = () => openSetup('scenario');
$('mode-drill').onclick = () => openSetup('drill');
$('brand').onclick = () => { if (currentView === 'welcome' || (currentView === 'call' && call && !call.ended)) return; show('home'); };
$('btn-history').onclick = () => { if (currentView === 'call' && call && !call.ended) return; show('history'); };
