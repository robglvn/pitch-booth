// Pitch Booth — The microphone: hold to talk, or hands-free (pause to send, tap to interrupt, mute).
'use strict';

/* ---------- talking: hold to talk, or hands-free ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recFinal = '', recInterim = '', talking = false, talkStart = 0, micBlocked = false, cutoffTimer = null, cutoffHit = false, bargedIn = false;
// Hands-free: the mic opens after the other person finishes, a pause sends, and the big button sends early or interrupts.
// The mic stays off while they talk, so it never hears their voice through the speaker.
let muted = false, discardTalk = false, emptyListens = 0;
const handsFree = () => settings.talkMode === 'handsfree' || (settings.talkMode !== 'hold' && matchMedia('(pointer: coarse)').matches);
const pttIdle = () => (handsFree() ? 'Tap to talk' : 'Hold to talk');
const helpText = () => (handsFree()
  ? 'Hands-free: just talk, and a short pause sends it. Tap the button to send early or to interrupt.'
  : 'Hold the button or hold <b>Space</b> to talk. Release to send.');

// After the other person finishes speaking, open the mic again (hands-free only).
function listenNext() {
  if (!handsFree() || muted || !call || call.ended || call.busy || talking) return;
  startTalk();
}

function startTalk() {
  if (!call || call.ended || call.busy || talking || $('ptt').disabled) return;
  if (!SR) { showError("Voice input isn't available in this browser. Use Chrome or Edge — or type your lines in the box below."); return; }
  if (!window.isSecureContext) { showError('The microphone needs a secure page. Open this app at http://localhost (see the comment at the top of the file).'); return; }
  bargedIn = isSpeaking();
  if (bargedIn) stopSpeaking();
  hideError();
  talking = true; cutoffHit = false; recFinal = ''; recInterim = ''; talkStart = Date.now(); micBlocked = false;
  setPtt(handsFree() ? 'Listening… tap to send' : 'Listening… release to send', false, true);
  renderLive();
  rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = !handsFree(); // hands-free lets the browser end the turn when you pause
  rec.interimResults = true;
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) recFinal += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    recInterim = interim;
    renderLive();
  };
  rec.onerror = e => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    micBlocked = true; talking = false;
    const m = {
      'not-allowed': 'Microphone access is blocked. Click the camera/mic icon in the address bar, allow the microphone, and reload.',
      'service-not-allowed': 'Microphone access is blocked. Click the camera/mic icon in the address bar, allow the microphone, and reload.',
      'audio-capture': 'No microphone was found. Plug one in or check your system sound settings.',
      'network': "Chrome's speech recognition couldn't reach its server. Check your connection, or type instead.",
      'language-not-supported': 'Speech recognition does not support this language setting.',
    }[e.error] || `Speech recognition error: ${e.error}`;
    showError(m);
  };
  rec.onend = () => {
    if (talking && !micBlocked && !handsFree()) { try { rec.start(); } catch {} return; } // browser stopped early; keep listening
    talking = false;
    clearTimeout(cutoffTimer);
    finishTalk();
  };
  try { rec.start(); } catch (err) { talking = false; showError('Could not start the microphone: ' + err.message); setPtt(pttIdle(), false); return; }
  if (call.cfg.difficulty === 'brutal') {
    cutoffTimer = setTimeout(() => { cutoffHit = true; stopTalk(); }, BRUTAL_CUTOFF_MS);
  }
}

function stopTalk() {
  if (!talking) return;
  talking = false;
  clearTimeout(cutoffTimer);
  try { rec.stop(); } catch { finishTalk(); }
}

function finishTalk() {
  if (!rec) return;
  rec = null;
  const live = document.querySelector('.msg.live');
  if (live) live.remove();
  if (micBlocked) { setPtt(pttIdle(), false); return; }
  if (discardTalk) { discardTalk = false; setPtt(muted ? 'Muted' : pttIdle(), muted); return; }
  const text = (recFinal + ' ' + recInterim).replace(/\s+/g, ' ').trim();
  const dur = (Date.now() - talkStart) / 1000;
  setPtt(pttIdle(), false);
  // Hands-free and nothing heard: keep listening a few times, then wait for a tap.
  if (!text && handsFree()) {
    if (++emptyListens < 3) setTimeout(listenNext, 250);
    return;
  }
  emptyListens = 0;
  handleCallerUtterance(text, { dur, cutoff: cutoffHit, bargedIn });
}

function setPtt(label, disabled, on = false) {
  const b = $('ptt');
  b.textContent = label;
  b.disabled = disabled;
  b.classList.toggle('on', on);
  $('type-input').disabled = disabled && !on;
  $('type-send').disabled = disabled && !on;
}

function flashHelp(msg) {
  const h = $('ptt-help');
  const orig = helpText();
  h.textContent = msg; h.style.color = 'var(--amber)';
  setTimeout(() => { h.innerHTML = orig; h.style.color = ''; }, 3500);
}

const ptt = $('ptt');
ptt.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (handsFree()) { tapTalk(); return; }
  try { ptt.setPointerCapture(e.pointerId); } catch {}
  startTalk();
});
['pointerup', 'pointercancel'].forEach(ev => ptt.addEventListener(ev, () => { if (!handsFree()) stopTalk(); }));
// Hands-free taps: send now while listening, interrupt while they talk, otherwise start listening.
function tapTalk() {
  if (!call || call.ended || call.busy) return;
  if (talking) { stopTalk(); return; }
  if (muted) { setMuted(false); return; }
  emptyListens = 0;
  startTalk(); // startTalk stops their audio and notes the barge-in
}
function setMuted(on) {
  muted = on;
  $('mute').textContent = on ? 'Unmute' : 'Mute';
  if (on && talking) { discardTalk = true; stopTalk(); }
  if (on) setPtt('Muted', false);
  else { setPtt(pttIdle(), false); if (!isSpeaking()) listenNext(); }
}
$('mute').onclick = () => setMuted(!muted);
ptt.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || currentView !== 'call' || e.repeat) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || !$('settings-modal').classList.contains('hidden')) return;
  e.preventDefault();
  startTalk();
});
document.addEventListener('keyup', e => {
  if (e.code !== 'Space' || !talking) return;
  e.preventDefault();
  stopTalk();
});
window.addEventListener('blur', () => stopTalk());

function sendTyped() {
  const v = $('type-input').value;
  if (!v.trim() || !call || call.busy) return;
  if (isSpeaking()) stopSpeaking();
  if (talking) { discardTalk = true; stopTalk(); }
  $('type-input').value = '';
  handleCallerUtterance(v, {});
}
$('type-send').onclick = sendTyped;
$('type-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendTyped(); } });
