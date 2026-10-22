import { db, getUniversal } from '../lib/db.js';
import { handler, HttpError, newId, newInviteCode, normalizeCode } from '../lib/http.js';

// POST {code}: turns what someone typed on the welcome screen into their personal code.
// A personal invite code comes straight back. The universal code (when it's on) creates a fresh
// profile with its own code, so testers never share history. Joins through it are capped per day.
export default handler(['POST'], async (req, res) => {
  const sql = await db();
  const code = normalizeCode((req.body || {}).code);
  if (!code) throw new HttpError(400, 'Type the code from your invite.', 'invalid_invite');

  const [p] = await sql`SELECT code FROM people WHERE code = ${code} AND NOT revoked`;
  if (p) return res.status(200).json({ code: p.code, via: 'invite' });

  // Spacing, dashes and caps don't matter: "TRY BOOTH" matches "try-booth".
  const squash = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const u = await getUniversal(sql);
  if (!u.enabled || squash(u.code) !== squash(code)) throw new HttpError(401, 'Invite code not recognized.', 'invalid_invite');

  const limit = parseInt(process.env.UNIVERSAL_DAILY_JOINS || '25', 10);
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM people WHERE via = 'universal' AND created_at >= date_trunc('day', now())`;
  if (n >= limit) throw new HttpError(429, 'Too many people joined with this code today. Try again tomorrow, or ask for a personal invite.', 'universal_limit');

  for (let attempt = 0; attempt < 5; attempt++) {
    const rows = await sql`INSERT INTO people (id, code, label, via) VALUES (${newId()}, ${newInviteCode()}, 'Universal code', 'universal') ON CONFLICT (code) DO NOTHING RETURNING code`;
    if (rows.length) return res.status(200).json({ code: rows[0].code, via: 'universal' });
  }
  throw new HttpError(500, "Couldn't create your profile. Try again.");
});
