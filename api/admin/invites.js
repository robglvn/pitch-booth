import { db } from '../../lib/db.js';
import { handler, HttpError, requireAdmin, newId, newInviteCode, clip } from '../../lib/http.js';

// POST {label} creates an invite (a new, empty profile). PATCH {id, revoked} turns access off or back on.
export default handler(['POST', 'PATCH'], async (req, res) => {
  requireAdmin(req);
  const sql = await db();
  const b = req.body || {};

  if (req.method === 'POST') {
    const label = clip(b.label, 60).trim();
    if (!label) throw new HttpError(400, 'Give the invite a name, like "Maria".', 'missing_label');
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newInviteCode(label);
      const rows = await sql`INSERT INTO people (id, code, label) VALUES (${newId()}, ${code}, ${label}) ON CONFLICT (code) DO NOTHING RETURNING id, code, label`;
      if (rows.length) return res.status(200).json(rows[0]);
    }
    throw new HttpError(500, "Couldn't create a unique invite code. Try again.");
  }

  const [row] = await sql`UPDATE people SET revoked = ${!!b.revoked} WHERE id = ${String(b.id || '')} RETURNING id, revoked`;
  if (!row) throw new HttpError(404, 'Invite not found.', 'not_found');
  res.status(200).json(row);
});
