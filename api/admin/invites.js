import { db } from '../../lib/db.js';
import { handler, HttpError, requireAdmin, newId, newInviteCode, clip } from '../../lib/http.js';
import { isEmail, siteUrl, sendInviteEmail } from '../../lib/email.js';

// POST {label, email?} creates an invite (a new, empty profile) and emails it when there's an address.
// PATCH {id, revoked} turns access off or back on. PATCH {id, send: true, email?} (re)sends the invite email.
export default handler(['POST', 'PATCH'], async (req, res) => {
  requireAdmin(req);
  const sql = await db();
  const b = req.body || {};
  const email = clip(b.email, 254).trim().toLowerCase();
  if (email && !isEmail(email)) throw new HttpError(400, "That email address doesn't look right.", 'bad_email');

  // The invite is saved either way; a failed send comes back as email_error so the admin can copy the link instead.
  const emailInvite = async p => {
    if (!p.email) return p;
    try {
      await sendInviteEmail({ to: p.email, name: p.label, code: p.code, link: `${siteUrl(req)}/#invite=${encodeURIComponent(p.code)}` });
      const [row] = await sql`UPDATE people SET emailed_at = now() WHERE id = ${p.id} RETURNING (extract(epoch FROM emailed_at) * 1000)::float8 AS emailed_at`;
      return { ...p, emailed_at: row.emailed_at };
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      return { ...p, email_error: e.message };
    }
  };

  if (req.method === 'POST') {
    const label = clip(b.label, 60).trim();
    if (!label) throw new HttpError(400, 'Give the invite a name, like "Maria".', 'missing_label');
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newInviteCode();
      const rows = await sql`INSERT INTO people (id, code, label, email) VALUES (${newId()}, ${code}, ${label}, ${email}) ON CONFLICT (code) DO NOTHING RETURNING id, code, label, email`;
      if (rows.length) return res.status(200).json(await emailInvite(rows[0]));
    }
    throw new HttpError(500, "Couldn't create a unique invite code. Try again.");
  }

  const id = String(b.id || '');
  if (b.send) {
    const [p] = email
      ? await sql`UPDATE people SET email = ${email} WHERE id = ${id} RETURNING id, code, label, email, revoked`
      : await sql`SELECT id, code, label, email, revoked FROM people WHERE id = ${id}`;
    if (!p) throw new HttpError(404, 'Invite not found.', 'not_found');
    if (p.revoked) throw new HttpError(400, 'Restore this invite before emailing it.', 'revoked');
    if (!p.email) throw new HttpError(400, 'Add an email address first.', 'missing_email');
    return res.status(200).json(await emailInvite(p));
  }

  const [row] = await sql`UPDATE people SET revoked = ${!!b.revoked} WHERE id = ${id} RETURNING id, revoked`;
  if (!row) throw new HttpError(404, 'Invite not found.', 'not_found');
  res.status(200).json(row);
});
