import { db, getUniversal } from '../../lib/db.js';
import { handler, HttpError, requireAdmin, normalizeCode, clip } from '../../lib/http.js';

// PATCH {universal: {enabled?, code?}} turns the universal code on or off, or changes it.
export default handler(['PATCH'], async (req, res) => {
  requireAdmin(req);
  const sql = await db();
  const u = (req.body || {}).universal || {};
  const next = await getUniversal(sql);

  if ('enabled' in u) next.enabled = !!u.enabled;
  if ('code' in u) {
    const code = normalizeCode(clip(u.code, 40));
    if (!/^[a-z0-9-]{4,40}$/.test(code)) throw new HttpError(400, 'Use 4 or more letters, numbers or dashes, like "try-booth".', 'bad_code');
    // A personal invite with the same code would make it ambiguous who's signing in.
    const [taken] = await sql`SELECT 1 FROM people WHERE replace(code, '-', '') = ${code.replace(/-/g, '')}`;
    if (taken) throw new HttpError(400, "That's already someone's personal code. Pick another.", 'code_taken');
    next.code = code;
  }

  await sql`INSERT INTO settings (key, value) VALUES ('universal', ${JSON.stringify(next)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  res.status(200).json({ universal: next });
});
