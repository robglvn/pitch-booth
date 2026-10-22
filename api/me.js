import { db } from '../lib/db.js';
import { handler, HttpError, personFrom, clip } from '../lib/http.js';

// GET: the invited person's profile and call list. PUT: update their profile.
export default handler(['GET', 'PUT'], async (req, res) => {
  const sql = await db();
  const p = await personFrom(sql, req);

  if (req.method === 'PUT') {
    const b = req.body || {};
    const prefs = b.prefs && typeof b.prefs === 'object' ? b.prefs : p.prefs;
    const prefsJson = JSON.stringify(prefs).slice(0, 4000);
    const seller = b.seller && typeof b.seller === 'object' && !Array.isArray(b.seller) ? b.seller : p.seller;
    const sellerJson = JSON.stringify(seller);
    if (sellerJson.length > 8000) throw new HttpError(400, 'Your answers are too long. Shorten a few and try again.', 'too_long');
    await sql`UPDATE people SET name = ${clip(b.name ?? p.name, 80)}, sells = ${clip(b.sells ?? p.sells, 4000)},
      city = ${clip(b.city ?? p.city, 120)}, prefs = ${prefsJson}::jsonb, seller = ${sellerJson}::jsonb WHERE id = ${p.id}`;
    return res.status(200).json({ ok: true });
  }

  await sql`UPDATE people SET last_seen = now() WHERE id = ${p.id}`;
  const calls = await sql`SELECT id, (extract(epoch FROM created_at) * 1000)::float8 AS ts, mode, difficulty, overall, asked_for_sale, summary
    FROM calls WHERE person_id = ${p.id} ORDER BY created_at DESC LIMIT 500`;
  res.status(200).json({ profile: { name: p.name, sells: p.sells, city: p.city, prefs: p.prefs, seller: p.seller }, calls });
});
