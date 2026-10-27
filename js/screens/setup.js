// Pitch Booth — "Set up a specific call" and "Practice handling pushback" setup.
'use strict';

/* ---------- setup ---------- */
let setupMode = 'scenario', setupDifficulty = 'realistic';
function openSetup(mode) {
  setupMode = mode;
  setupDifficulty = 'realistic';
  $('setup-title').textContent = mode === 'drill' ? 'Practice handling pushback' : 'Set up a specific call';
  $('setup-objection-wrap').classList.toggle('hidden', mode !== 'drill');
  $('setup-personality-wrap').classList.toggle('hidden', mode === 'drill');
  $('setup-start').textContent = mode === 'drill' ? `Start (${DRILL_REPS} tries)` : 'Start call';
  $('setup-objection').innerHTML = '<option value="">Random</option>' + objectionPool().map(o => `<option>${esc(o)}</option>`).join('');
  $('setup-calltype').innerHTML = '<option value="">Random</option>' + userCallTypes().map(k => `<option value="${k}">${esc(CALL_TYPES[k].label)}</option>`).join('');
  const target = callTarget();
  $('setup-business-wrap').classList.toggle('hidden', target.audience !== 'businesses');
  $('setup-business').innerHTML = '<option value="">Any kind of business</option>' + Object.entries(BUSINESS_TYPES).map(([k, b]) => `<option value="${k}" ${target.business === k ? 'selected' : ''}>${esc(b.label)}</option>`).join('');
  const types = customerTypesFor(target);
  $('setup-type').innerHTML = '<option value="">Random</option>' + types.map(x => `<option>${esc(x.label)}</option>`).join('');
  $('setup-type-wrap').classList.toggle('hidden', !types.length);
  $('setup-personality').innerHTML = '<option value="">Random</option>' + Object.entries(PERSONALITY.PRESETS).map(([k, x]) => `<option value="${k}">${esc(x.label)}</option>`).join('');
  renderDifficulty();
  show('setup');
}
function renderDifficulty() {
  document.querySelectorAll('#setup-difficulty button').forEach(b => {
    b.classList.toggle('on', b.dataset.d === setupDifficulty);
    if (b.dataset.d === 'brutal') { b.disabled = !brutalUnlocked(); b.innerHTML = brutalUnlocked() ? 'Brutal' : `${icon('lock', 16)} Brutal`; }
  });
  $('setup-brutal-note').textContent = brutalUnlocked() ? '' : `Brutal unlocks after ${BRUTAL_UNLOCK} practice calls (${completedCount()} of ${BRUTAL_UNLOCK} done).`;
}
document.querySelectorAll('#setup-difficulty button').forEach(b => b.onclick = () => { setupDifficulty = b.dataset.d; renderDifficulty(); });
$('setup-start').onclick = () => startCall(buildConfig(setupMode, {
  callType: $('setup-calltype').value || null,
  customerType: $('setup-type').value || null,
  business: $('setup-business').value || null,
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
