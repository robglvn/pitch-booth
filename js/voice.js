// Pitch Booth — How the other person sounds: studio voices (ElevenLabs via /api/voice), browser voices as a fallback, and the ring tone.
'use strict';

/* ---------- voice out ---------- */
let voices = [];
const NOVELTY = /bells|bubbles|zarvox|whisper|bad news|good news|jester|organ|trinoids|boing|cellos|superstar|wobble|albert|bahh|hysterical|deranged|pipe|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i;
const FEMALE = /samantha|victoria|karen|moira|tessa|fiona|veena|allison|ava|susan|zira|female|serena|kate|joanna|salli|kimberly|nicky|aria|jenny|michelle|emma|libby|sonia|natasha|clara|catherine|martha|hazel|heera/i;
const MALE = /\bmale\b|daniel|alex|fred|\btom\b|oliver|aaron|arthur|rishi|gordon|\blee\b|david|mark|\bguy\b|ryan|eric|christopher|roger|william|brian|matthew|justin|joey|thomas|liam|george|james/i;
function loadVoices() {
  try { voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang) && !NOVELTY.test(v.name)); } catch { voices = []; }
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

// Browser voices vary a lot by device; natural/neural ones (Edge's "Online (Natural)", macOS Premium) sound far better.
const voiceQuality = v => (/natural|neural|premium|enhanced/i.test(v.name) ? 2 : /google|online/i.test(v.name) ? 1 : 0);
function voiceFor(p, s = settings) {
  if (s.voiceName) { const v = voices.find(v => v.name === s.voiceName); if (v) return v; }
  if (!voices.length) return null;
  const female = voices.filter(v => FEMALE.test(v.name));
  const male = voices.filter(v => !FEMALE.test(v.name) && MALE.test(v.name));
  let pool = p.voice_gender === 'female' ? female : male;
  if (!pool.length) pool = voices;
  const best = Math.max(...pool.map(voiceQuality));
  pool = pool.filter(v => voiceQuality(v) === best);
  return pool[hash(p.name) % pool.length];
}

// Studio voices (ElevenLabs via /api/voice) for invited people; the browser's own voice otherwise or if that fails.
// speechToken drops audio that arrives after the caller has already started talking over it.
let studioVoice = 'unknown'; // 'off' once the server says studio voices aren't set up
let currentAudio = null, finishAudio = null, speechToken = 0;
const isSpeaking = () => ('speechSynthesis' in window && speechSynthesis.speaking) || (!!currentAudio && !currentAudio.paused);
function stopSpeaking() {
  speechToken++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (currentAudio) { currentAudio.pause(); finishAudio?.(); }
}

async function speak(text, p) {
  const s = settings;
  if (!s.voiceOn) return;
  stopSpeaking();
  const token = speechToken;
  if (usingProxy() && studioVoice !== 'off' && p) {
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-invite-code': s.inviteCode },
        body: JSON.stringify({ text, gender: p.voice_gender, age: p.age, seed: p.name, rate: (p.voice_rate || 1) * (s.rate || 1) }),
      });
      if (res.status === 503) studioVoice = 'off';
      else if (res.ok) {
        const blob = await res.blob();
        if (token !== speechToken) return;
        return await playAudio(blob);
      }
    } catch {}
    if (token !== speechToken) return;
  }
  return browserSpeak(text, p, s);
}

function playAudio(blob) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true; clearTimeout(guard); URL.revokeObjectURL(url);
      if (currentAudio === a) { currentAudio = null; finishAudio = null; }
      resolve();
    };
    const guard = setTimeout(finish, 60000);
    a.onended = finish; a.onerror = finish;
    currentAudio = a; finishAudio = finish;
    a.play().catch(finish);
  });
}

let currentUtterance = null; // kept referenced so Chrome doesn't drop onend
function browserSpeak(text, p, s) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = p ? voiceFor(p, s) : null;
    if (v) u.voice = v;
    u.pitch = p ? p.voice_pitch : 1;
    u.rate = (p ? p.voice_rate : 1) * (s.rate || 1);
    let done = false;
    const finish = () => { if (!done) { done = true; clearTimeout(guard); resolve(); } };
    const guard = setTimeout(finish, 4000 + text.length * 120);
    u.onend = finish; u.onerror = finish;
    currentUtterance = u;
    speechSynthesis.speak(u);
  });
}
/* ---------- ringing ---------- */
let audioCtx = null;
function startRinging() {
  let stopped = false;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ringOnce = () => {
      if (stopped) return;
      const t = audioCtx.currentTime;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.05);
      g.gain.setValueAtTime(0.06, t + 1.9);
      g.gain.linearRampToValueAtTime(0, t + 2);
      g.connect(audioCtx.destination);
      [440, 480].forEach(f => { const o = audioCtx.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 2); });
    };
    ringOnce();
    const id = setInterval(ringOnce, 4000);
    return () => { stopped = true; clearInterval(id); };
  } catch { return () => {}; }
}
