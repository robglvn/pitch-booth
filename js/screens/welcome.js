// Pitch Booth — The welcome screen: invite codes, quick start, and your own API key.
'use strict';

/* ---------- welcome: get in, then set up a profile ---------- */
function showWelcome(step, err = '', newCode = '') {
  show('welcome');
  $('w-join').classList.toggle('hidden', step !== 'join');
  $('w-about').classList.toggle('hidden', step !== 'about');
  $('w-quick-panel').classList.toggle('hidden', step !== 'quick');
  if (step === 'join') {
    $('w-err').textContent = err;
    checkQuickStart();
  } else if (step === 'quick') {
    $('q-quick').value = seller().quick ? seller().offer || '' : '';
    $('q-quick-err').textContent = '';
    $('q-quick').focus();
  } else openQuestionnaire(newCode);
}

// Quick start rides on the universal code switch in /admin; when it's on, the welcome screen leads with it.
async function checkQuickStart() {
  let open = false;
  try { open = !!(await (await fetch('/api/join')).json()).quickStart; } catch {}
  $('w-quick-card').classList.toggle('hidden', !open);
  $('w-or').classList.toggle('hidden', !open);
  $('w-go').classList.toggle('primary', !open);
  (open ? $('w-quick') : $('w-code')).focus();
}

// Picks the industry whose keywords show up most in a one-line description (see "match" in industries.js).
function guessCategory(text) {
  let best = '', score = 0;
  for (const [k, c] of Object.entries(CATEGORIES)) {
    if (!c.match) continue;
    const n = (text.match(new RegExp(c.match, 'gi')) || []).length;
    if (n > score) { best = k; score = n; }
  }
  return best;
}

// Describe it in a sentence and go straight into a call. No code needed when quick start is open.
async function quickStart(text, errEl, btn) {
  text = text.trim();
  if (text.split(/\s+/).length < 3) { errEl.textContent = 'Say a little about what you sell, like "I sell life insurance to young families."'; return; }
  errEl.textContent = '';
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Setting up…';
  try {
    if (!settings.inviteCode && !settings.apiKey) {
      const { code } = await api('/api/join', { method: 'POST', body: JSON.stringify({ quick: true }) });
      settings = { ...settings, inviteCode: code };
    }
    if (usingProxy() && !profile) await loadProfile();
    const category = guessCategory(text);
    settings = { ...settings, pitch: text, seller: { offer: text.slice(0, 200), category, audience: CATEGORIES[category]?.audience || '', quick: true } };
    LS.set('ph_settings', settings);
    if (usingProxy()) await saveProfile();
    startCall(buildConfig('random'));
  } catch (e) {
    errEl.textContent = e.message;
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
}
$('w-quick-go').onclick = () => quickStart($('w-quick').value, $('w-quick-err'), $('w-quick-go'));
$('q-quick-go').onclick = () => quickStart($('q-quick').value, $('q-quick-err'), $('q-quick-go'));
$('q-quick-back').onclick = () => openQuestionnaire();

// Swap what was typed (a personal code or the universal code) for the person's own code, then load them in.
async function enterWithCode(raw) {
  const { code, via } = await api('/api/join', { method: 'POST', body: JSON.stringify({ code: raw }) });
  settings = { ...settings, inviteCode: code, apiKey: '' };
  await loadProfile();
  LS.set('ph_settings', settings);
  if (!profile.sells) showWelcome('about', '', via === 'universal' ? code : ''); else show('home');
}

async function joinWithCode() {
  const code = $('w-code').value.trim().toLowerCase();
  if (!code) { $('w-err').textContent = 'Type the code from your invite.'; return; }
  $('w-err').textContent = '';
  $('w-go').disabled = true; $('w-go').textContent = 'Checking…';
  try { await enterWithCode(code); }
  catch (e) {
    settings = { ...settings, inviteCode: '' };
    $('w-err').textContent = e.message;
  }
  $('w-go').disabled = false; $('w-go').textContent = "Let's go";
}
$('w-go').onclick = joinWithCode;
$('w-code').onkeydown = e => { if (e.key === 'Enter') joinWithCode(); };
$('w-key-go').onclick = () => {
  const key = $('w-key').value.trim();
  if (!key) return;
  settings = { ...settings, apiKey: key, inviteCode: '' };
  LS.set('ph_settings', settings);
  $('w-key').value = '';
  init();
};
