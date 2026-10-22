import { HttpError } from './http.js';

// Studio voices through ElevenLabs (https://elevenlabs.io/docs/api-reference/text-to-speech/convert).
// Needs ELEVENLABS_API_KEY. ELEVENLABS_MODEL picks the model (default eleven_flash_v2_5: fast and half the credits).
// Voices come from the account's own voice list, so adding voices in ElevenLabs widens the cast with no code change.
const API = 'https://api.elevenlabs.io/v1';
export const voiceReady = () => !!process.env.ELEVENLABS_API_KEY;
const headers = () => ({ 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' });

let cache = null, cachedAt = 0;
async function listVoices() {
  if (cache && Date.now() - cachedAt < 60 * 60 * 1000) return cache;
  let res;
  try { res = await fetch(`${API}/voices`, { headers: headers() }); } catch { throw new HttpError(502, "Couldn't reach ElevenLabs.", 'voice_failed'); }
  if (!res.ok) throw voiceError(res.status, await res.text());
  const data = await res.json();
  const norm = s => String(s || '').toLowerCase().replace(/[\s-]+/g, '_');
  cache = (data.voices || []).map(v => ({ id: v.voice_id, gender: norm(v.labels?.gender), age: norm(v.labels?.age), accent: norm(v.labels?.accent) }));
  cachedAt = Date.now();
  return cache;
}

const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

// Narrow by gender, then by age, then prefer American accents when there are any; each step only applies if it leaves someone.
// The same person (seed) always gets the same voice.
export function pickVoice(voices, { gender, age, seed }) {
  const bucket = !age ? '' : age < 35 ? 'young' : age < 58 ? 'middle_aged' : 'old';
  let pool = voices;
  const narrow = test => { const next = pool.filter(test); if (next.length) pool = next; };
  if (gender === 'male' || gender === 'female') narrow(v => v.gender === gender);
  if (bucket) narrow(v => v.age === bucket);
  narrow(v => v.accent.includes('american'));
  if (!pool.length) throw new HttpError(503, 'No voices found in the ElevenLabs account.', 'voice_not_configured');
  return pool[hash(seed) % pool.length].id;
}

function voiceError(status, body) {
  console.error('ElevenLabs error', status, String(body).slice(0, 300));
  // Running out of credits can also come back as a 401, so check for that first.
  if (status === 429 || /quota|credits/i.test(body)) return new HttpError(429, 'ElevenLabs is out of credits or busy.', 'voice_quota');
  if (status === 401) return new HttpError(502, 'ElevenLabs rejected ELEVENLABS_API_KEY.', 'voice_failed');
  return new HttpError(502, `ElevenLabs error ${status}.`, 'voice_failed');
}

export async function synthesize({ text, gender, age, seed, rate }) {
  if (!voiceReady()) throw new HttpError(503, 'Studio voices are not set up. Add ELEVENLABS_API_KEY in Vercel.', 'voice_not_configured');
  const voiceId = pickVoice(await listVoices(), { gender, age, seed });
  const speed = Math.min(1.2, Math.max(0.7, Number(rate) || 1));
  let res;
  try {
    res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5', voice_settings: { stability: 0.45, similarity_boost: 0.75, speed } }),
    });
  } catch { throw new HttpError(502, "Couldn't reach ElevenLabs.", 'voice_failed'); }
  if (!res.ok) throw voiceError(res.status, await res.text());
  return Buffer.from(await res.arrayBuffer());
}
