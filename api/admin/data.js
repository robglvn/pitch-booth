import { db, getUniversal } from '../../lib/db.js';
import { handler, requireAdmin, today } from '../../lib/http.js';
import { emailReady } from '../../lib/email.js';

// Everything the admin page shows: usage, spend, and each person's scores. Never transcripts or feedback.
export default handler(['GET'], async (req, res) => {
  requireAdmin(req);
  const sql = await db();
  const days = Math.min(Math.max(parseInt(req.query.days || '30', 10) || 30, 1), 365);
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const d = today();

  const [daily, people, usageByPerson, todayByPerson, models, totals, universal] = await Promise.all([
    sql`SELECT to_char(day, 'YYYY-MM-DD') AS day, role, SUM(cost)::float8 AS cost FROM usage WHERE ts >= ${since} GROUP BY day, role ORDER BY day`,
    sql`SELECT p.id, p.code, p.label, p.name, p.email, p.via, p.revoked, (extract(epoch FROM p.emailed_at) * 1000)::float8 AS emailed_at, (extract(epoch FROM p.created_at) * 1000)::float8 AS created,
          (extract(epoch FROM p.last_seen) * 1000)::float8 AS last_seen,
          COUNT(c.id)::int AS calls, AVG(c.overall)::float8 AS avg_score,
          AVG(CASE WHEN c.asked_for_sale THEN 1 ELSE 0 END)::float8 AS ask_rate,
          (SELECT overall FROM calls WHERE person_id = p.id ORDER BY created_at DESC LIMIT 1) AS last_score,
          (SELECT json_agg(x.overall ORDER BY x.created_at) FROM (SELECT overall, created_at FROM calls WHERE person_id = p.id ORDER BY created_at DESC LIMIT 12) x) AS recent
        FROM people p LEFT JOIN calls c ON c.person_id = p.id AND c.created_at >= ${since}
        GROUP BY p.id ORDER BY p.created_at`,
    sql`SELECT person_id, SUM(cost)::float8 AS cost, COUNT(*)::int AS requests, SUM(CASE WHEN status <> 200 THEN 1 ELSE 0 END)::int AS errors
        FROM usage WHERE ts >= ${since} GROUP BY person_id`,
    sql`SELECT person_id, COUNT(*)::int AS requests, SUM(cost)::float8 AS cost FROM usage WHERE day = ${d} GROUP BY person_id`,
    sql`SELECT model, COUNT(*)::int AS requests, SUM(input + cache_read + cache_write)::float8 AS input, SUM(cache_read)::float8 AS cache_read,
          SUM(output)::float8 AS output, SUM(cost)::float8 AS cost FROM usage WHERE ts >= ${since} GROUP BY model ORDER BY 6 DESC`,
    sql`SELECT COALESCE(SUM(CASE WHEN day = ${d} THEN cost END), 0)::float8 AS today,
          COALESCE(SUM(CASE WHEN ts >= ${since7} THEN cost END), 0)::float8 AS d7,
          COALESCE(SUM(cost), 0)::float8 AS d30 FROM usage WHERE ts >= ${since30}`,
    getUniversal(sql),
  ]);

  res.status(200).json({
    days, today: d, dailyLimit: parseInt(process.env.DAILY_LIMIT || '250', 10), emailReady: emailReady(), universal,
    daily, people, usageByPerson, todayByPerson, models, totals: totals[0],
  });
});
