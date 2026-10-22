import { db } from '../lib/db.js';
import { handler, HttpError, personFrom, clip } from '../lib/http.js';
import { synthesize } from '../lib/voice.js';

// POST {text, gender, age, seed, rate}: one spoken line from the person on the call, as MP3.
// Invite-code only, like /api/claude. The app falls back to the browser's voice on any error.
export default handler(['POST'], async (req, res) => {
  const sql = await db();
  await personFrom(sql, req);
  const b = req.body || {};
  const text = clip(b.text, 600).trim();
  if (!text) throw new HttpError(400, 'Nothing to say.', 'bad_request');
  const audio = await synthesize({ text, gender: String(b.gender || ''), age: Number(b.age) || 0, seed: clip(b.seed, 80), rate: b.rate });
  res.setHeader('content-type', 'audio/mpeg');
  res.setHeader('cache-control', 'no-store');
  res.status(200).send(audio);
});
