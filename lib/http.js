import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message, type = 'error') { super(message); this.status = status; this.type = type; }
}

// Wraps a Vercel Node handler: method check + JSON errors in the same shape the Anthropic API uses.
export function handler(methods, fn) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) throw new HttpError(405, 'Method not allowed');
      await fn(req, res);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      res.status(status).json({ type: 'error', error: { type: e.type || 'server_error', message: e instanceof HttpError ? e.message : 'Something went wrong on the server.' } });
    }
  };
}

export const today = () => new Date().toISOString().slice(0, 10);
export const newId = () => randomBytes(9).toString('base64url');

// Invite codes look like "k7m-q2p": 6 characters, no look-alikes (0/o, 1/l/i), so they're easy to read out or type.
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function newInviteCode() {
  const bytes = randomBytes(6);
  const chars = [...bytes].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `${chars.slice(0, 3)}-${chars.slice(3)}`;
}

// Accept "K7M Q2P", "k7mq2p" or "k7m-q2p" for the same code.
export function normalizeCode(raw) {
  const s = String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return s.length === 6 ? `${s.slice(0, 3)}-${s.slice(3)}` : String(raw || '').trim().toLowerCase();
}

// The invite code is the person's login: every profile request carries it.
export async function personFrom(sql, req) {
  const code = normalizeCode(req.headers['x-invite-code']);
  if (!code) throw new HttpError(401, 'Missing invite code.', 'invalid_invite');
  const [p] = await sql`SELECT id, code, label, name, sells, city, prefs FROM people WHERE code = ${code} AND NOT revoked`;
  if (!p) throw new HttpError(401, 'Invite code not recognized.', 'invalid_invite');
  return p;
}

export function requireAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new HttpError(503, 'Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables to use the admin page.', 'no_admin_password');
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = createHash('sha256').update(got).digest(), b = createHash('sha256').update(expected).digest();
  if (!got || !timingSafeEqual(a, b)) throw new HttpError(401, 'Wrong admin password.', 'bad_admin_password');
}

export const clip = (v, n) => String(v ?? '').slice(0, n);
