// Pitch Booth — Browser checks and startup. Loaded last.
'use strict';

/* ---------- environment checks ---------- */
function renderEnv() {
  const msgs = [];
  if (!window.isSecureContext) msgs.push('This page isn\'t in a secure context, so the microphone won\'t work. Serve it from localhost: run <code>python3 -m http.server 8777</code> in this folder and open <a href="http://localhost:8777">http://localhost:8777</a>.');
  if (!SR) msgs.push('This browser doesn\'t support speech recognition. Use Chrome or Edge for voice — you can still type your lines.');
  $('env-banner').innerHTML = msgs.map(m => `<div class="banner warn">${m}</div>`).join('');
}

window.addEventListener('beforeunload', e => { if (call && !call.ended && call.turns.length) { e.preventDefault(); e.returnValue = ''; } });

async function init() {
  profile = null;
  history = usingProxy() ? [] : LS.get('ph_history', []);
  renderEnv();
  if (!settings.inviteCode && !settings.apiKey) { showWelcome('join'); return; }
  if (!usingProxy()) { if (settings.myName || seller().offer) show('home'); else showWelcome('about'); return; }
  show('home');
  try {
    await loadProfile();
    if (!profile.sells) showWelcome('about'); else show('home');
  } catch (e) {
    // A revoked or mistyped code sends you back to the welcome screen instead of a broken home page.
    if (e.type === 'invalid_invite') {
      // A link carrying the universal code lands here first; joining turns it into a personal code.
      try { await enterWithCode(settings.inviteCode); return; } catch {}
      settings = { ...settings, inviteCode: '' }; LS.set('ph_settings', settings); showWelcome('join', e.message);
    }
    else showError(e.message);
  }
}
hydrateIcons();
init();
