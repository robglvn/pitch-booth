import { db } from '../lib/db.js';
import { handler, HttpError, personFrom, newId, clip } from '../lib/http.js';

// A person's own calls. GET ?id= returns one full scorecard and transcript; POST saves one; DELETE removes one or all.
// Only the owner (by invite code) can read details; the admin page never selects `detail`.
const MAX_DETAIL_BYTES = 300_000;

export default handler(['GET', 'POST', 'DELETE'], async (req, res) => {
  const sql = await db();
  const p = await personFrom(sql, req);

  if (req.method === 'GET') {
    const [row] = await sql`SELECT detail FROM calls WHERE id = ${String(req.query.id || '')} AND person_id = ${p.id}`;
    if (!row) throw new HttpError(404, 'Call not found.', 'not_found');
    return res.status(200).json(row.detail);
  }

  if (req.method === 'DELETE') {
    if (req.query.all === '1') await sql`DELETE FROM calls WHERE person_id = ${p.id}`;
    else await sql`DELETE FROM calls WHERE id = ${String(req.query.id || '')} AND person_id = ${p.id}`;
    return res.status(200).json({ ok: true });
  }

  const b = req.body || {};
  const detail = JSON.stringify(b.detail || {});
  if (detail.length > MAX_DETAIL_BYTES) throw new HttpError(413, 'That call is too large to save.', 'too_large');
  const summary = JSON.stringify(b.summary || {}).slice(0, 4000);
  const overall = Math.max(0, Math.min(10, Number(b.overall) || 0));
  const id = newId();
  await sql`INSERT INTO calls (id, person_id, mode, difficulty, overall, asked_for_sale, summary, detail)
    VALUES (${id}, ${p.id}, ${clip(b.mode, 20)}, ${clip(b.difficulty, 20)}, ${overall}, ${!!b.asked_for_sale}, ${summary}::jsonb, ${detail}::jsonb)`;
  res.status(200).json({ id });
});
