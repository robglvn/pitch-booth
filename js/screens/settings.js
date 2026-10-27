// Pitch Booth — The Settings window.
'use strict';

/* ---------- settings ---------- */
function openSettings() {
  $('s-account').textContent = usingProxy() ? `Signed in with code ${settings.inviteCode}` : 'Using your own Anthropic API key';
  draftPreset = settings.preset;
  ['owner', 'persona', 'coach'].forEach(r => { $(`s-${r}-model`).value = roleModel(r); });
  $('s-owner-effort').value = settings.ownerEffort;
  $('s-coach-effort').value = settings.coachEffort;
  $('s-cache').checked = settings.cache;
  renderPresets();
  $('s-name').value = settings.myName;
  $('s-city').value = settings.city;
  $('s-pitch').value = settings.pitch;
  $('s-voice-on').checked = settings.voiceOn;
  $('s-tips').checked = settings.showTips !== false;
  $('s-talk').value = settings.talkMode || 'auto';
  $('s-rate').value = settings.rate;
  $('s-rate-v').textContent = `(${(+settings.rate).toFixed(2)}×)`;
  loadVoices();
  $('s-voice').innerHTML = '<option value="">Auto — different voice per owner</option>' + voices.map(v => `<option ${v.name === settings.voiceName ? 'selected' : ''}>${esc(v.name)}</option>`).join('');
  $('settings-modal').classList.remove('hidden');
}
function closeSettings() { $('settings-modal').classList.add('hidden'); }

let draftPreset = settings.preset;
function renderPresets() {
  document.querySelectorAll('#s-preset button').forEach(b => b.classList.toggle('on', b.dataset.p === draftPreset));
  $('s-preset-note').textContent = draftPreset === 'custom'
    ? 'Custom: using the models under Fine-tuning. Click a preset to go back.'
    : 'Cost estimates are rough. Real usage shows in your Anthropic console.';
}
document.querySelectorAll('#s-preset button').forEach(b => b.onclick = () => {
  draftPreset = b.dataset.p;
  ['owner', 'persona', 'coach'].forEach(r => { $(`s-${r}-model`).value = PRESETS[draftPreset][r]; });
  renderPresets();
});
['owner', 'persona', 'coach'].forEach(r => $(`s-${r}-model`).addEventListener('input', () => { draftPreset = 'custom'; renderPresets(); }));
$('btn-settings').onclick = openSettings;
$('s-rebuild').onclick = () => { closeSettings(); openQuestionnaire(); };
$('home-tune-go').onclick = () => openQuestionnaire();
$('s-cancel').onclick = closeSettings;
$('settings-modal').onclick = e => { if (e.target.id === 'settings-modal') closeSettings(); };
$('s-rate').oninput = () => { $('s-rate-v').textContent = `(${(+$('s-rate').value).toFixed(2)}×)`; };
$('s-save').onclick = async () => {
  settings = {
    ...settings,
    preset: draftPreset,
    ownerModel: $('s-owner-model').value.trim() || DEFAULT_SETTINGS.ownerModel,
    personaModel: $('s-persona-model').value.trim() || DEFAULT_SETTINGS.personaModel,
    coachModel: $('s-coach-model').value.trim() || DEFAULT_SETTINGS.coachModel,
    ownerEffort: $('s-owner-effort').value,
    coachEffort: $('s-coach-effort').value,
    cache: $('s-cache').checked,
    myName: $('s-name').value.trim(),
    city: $('s-city').value.trim(),
    pitch: $('s-pitch').value.trim() || DEFAULT_SETTINGS.pitch,
    voiceOn: $('s-voice-on').checked,
    showTips: $('s-tips').checked,
    talkMode: $('s-talk').value,
    voiceName: $('s-voice').value,
    rate: +$('s-rate').value || 1,
  };
  if (!LS.set('ph_settings', settings)) showError("Couldn't save settings — localStorage is blocked in this browser.");
  closeSettings();
  if (usingProxy() && profile) {
    try { await saveProfile(); } catch (e) { showError("Couldn't save your profile: " + e.message); }
  }
};
$('s-test-voice').onclick = () => {
  const prev = settings;
  settings = { ...settings, voiceOn: true, voiceName: $('s-voice').value, rate: +$('s-rate').value || 1 };
  speak('Hello, this is the shop, how can I help you?', { name: 'Test', age: 40, voice_gender: 'female', voice_pitch: 1, voice_rate: 1 });
  settings = prev;
};
$('s-clear').onclick = async () => {
  if (!confirm('Delete all saved calls and scores? This cannot be undone.')) return;
  if (usingProxy()) {
    try { await api('/api/calls?all=1', { method: 'DELETE' }); } catch (e) { showError(e.message); return; }
  }
  history = []; saveHistory(); closeSettings(); show('home');
};
// Signing out of an invite forgets that person's profile here; it stays saved on the server.
$('s-signout').onclick = () => {
  settings = usingProxy()
    ? { ...settings, inviteCode: '', apiKey: '', myName: '', city: '', pitch: DEFAULT_SETTINGS.pitch, seller: undefined }
    : { ...settings, inviteCode: '', apiKey: '' };
  LS.set('ph_settings', settings);
  closeSettings();
  init();
};
