import { HttpError } from './http.js';

// Invite emails go out through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Needs RESEND_API_KEY and INVITE_FROM, an address on a domain verified in Resend,
// e.g. "Pitch Booth <invites@yourdomain.com>".
export const emailReady = () => !!(process.env.RESEND_API_KEY && process.env.INVITE_FROM);
export const EMAIL_SETUP_HELP = 'To email invites, add RESEND_API_KEY and INVITE_FROM in Vercel → Settings → Environment Variables, then redeploy.';

export const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

// The address people open: APP_URL if set, otherwise whatever host the admin page was loaded from.
export function siteUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (/^localhost|^127\./.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Email clients ignore web fonts and most CSS, so this is tables, inline styles and Georgia for the serif.
export function inviteEmail({ name, code, link }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const subject = `${first === 'there' ? 'Your' : first + ', your'} Pitch Booth invite`;
  const text = [
    `Hi ${first},`,
    '',
    "You're invited to Pitch Booth: practice sales calls with a pretend business owner, then get a score and tips.",
    '',
    `Start here: ${link}`,
    '',
    `Your invite code is ${code}. It's your login, so keep this email.`,
  ].join('\n');
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f2ec;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Practice sales calls and get a score. Your code is ${esc(code)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ec;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="padding:0 4px 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1c1917;">
        <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#3f7d5c;margin-right:8px;vertical-align:middle;"></span>Pitch Booth
      </td></tr>
      <tr><td style="background:#fffdfa;border:1px solid #ebe5dc;border-radius:20px;padding:36px 32px;">
        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;color:#1c1917;">Hi ${esc(first)}, you're <em style="color:#3f7d5c;">invited</em></h1>
        <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.55;color:#6b645c;">Practice your sales calls with a pretend business owner, then get a score and tips to get better.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
          <a href="${esc(link)}" style="display:inline-block;background:#1c1917;color:#fffdfa;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:600;padding:15px 36px;border-radius:999px;">Start practicing</a>
        </td></tr></table>
        <p style="margin:32px 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#6b645c;text-align:center;">Your invite code</p>
        <p style="margin:0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:26px;letter-spacing:4px;color:#1c1917;text-align:center;">${esc(code)}</p>
        <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#a39b91;text-align:center;">It's your login on any device, so keep this email.</p>
      </td></tr>
      <tr><td style="padding:20px 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.5;color:#a39b91;text-align:center;">
        Button not working? Open this link: <a href="${esc(link)}" style="color:#6b645c;">${esc(link)}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  return { subject, html, text };
}

export async function sendInviteEmail({ to, name, code, link }) {
  if (!emailReady()) throw new HttpError(503, EMAIL_SETUP_HELP, 'email_not_configured');
  const { subject, html, text } = inviteEmail({ name, code, link });
  let res, data;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.INVITE_FROM, to: [to], subject, html, text }),
    });
  } catch { throw new HttpError(502, "Couldn't reach the email service. Try again in a minute.", 'email_failed'); }
  try { data = await res.json(); } catch { data = {}; }
  if (res.ok) return data.id;
  const msg = String(data?.message || '');
  console.error('Resend error', res.status, msg);
  if (res.status === 401 || (res.status === 403 && /api key/i.test(msg))) throw new HttpError(502, 'The email service rejected RESEND_API_KEY. Check it in Vercel.', 'email_failed');
  if (/verify a domain|testing emails|not verified/i.test(msg)) throw new HttpError(502, "Resend can only send to other people after you verify your domain in Resend, and INVITE_FROM must use that domain.", 'email_failed');
  throw new HttpError(502, `The email didn't send: ${msg || 'error ' + res.status}`, 'email_failed');
}
