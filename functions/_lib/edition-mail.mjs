// The Morning Edition by email: copy, tokens, links, the send clock and the
// two mail bodies. Pure, no repo imports (the morning-daily Worker bundles
// it, and so do the Pages signup routes); WebCrypto and Intl globals only
// (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §3.3).
//
// Nothing here logs, and nothing here returns an email address except
// normalizeEmail, which hands back the address it was given.

export const EDITION_SENDER = 'morning@pointcast.xyz';
export const EDITION_FROM = 'PointCast Morning Edition <morning@pointcast.xyz>';
export const SITE = 'https://pointcast.xyz';
/** A test pins it equal to FIRST_EDITION in functions/_lib/morning.mjs. */
export const FIRST_EDITION = '2026-10-03';
export const SEND_HOUR = 6;
export const EDITION_SLOTS = 7;
export const CONFIRM_TTL_MS = 48 * 3_600_000;
export const CONFIRM_RESEND_MS = 60_000;
export const PRUNE_SENT_PENDING_MS = 30 * 86_400_000;
/** Refused confirm sends before the Worker's sweep stops retrying a pending row (a new signup for it starts over). */
export const CONFIRM_MAX_ATTEMPTS = 5;
export const SUB_SOURCES = Object.freeze(['morning', 'receipt', 'card', 'rss', 'other']);
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const MAIL_OFF_NOTE = 'No mail sender yet: RESEND_API_KEY is not set, and Cloudflare Email Sending is not onboarded for pointcast.xyz (its DNS is at Namecheap).';
/** Signup answers, shared by the endpoint and the page. */
export const SIGNUP_COPY = Object.freeze({
  'check-email': 'Check your email for a confirmation link. An address already on the list gets no new one.',
  'on-list': 'You are on the list. The confirmation link goes out by the next morning’s mail run once the paper’s mail is on; an address already on the list gets no new one. Until then the paper is at /morning every day at 6:45 AM, and at /morning.xml.',
});

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Byte-for-byte the rule in functions/api/auth/email/_shared.ts: trim, lower case, 3..254 chars, one @ and a dot after it. */
export function normalizeEmail(v) {
  if (typeof v !== 'string') return null;
  const email = v.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return null;
  return email;
}

/** A SUB_SOURCES value, else 'morning'. */
export function parseSource(v) {
  return typeof v === 'string' && SUB_SOURCES.includes(v) ? v : 'morning';
}

/** 32 random bytes → a 43-char base64url string, no padding. */
export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export async function sha256Hex(s) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time for equal lengths. False on non-strings or a length mismatch. */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** & < > " ' */
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function confirmUrl(raw) {
  return `${SITE}/api/morning/confirm?t=${raw}`;
}

export function unsubscribeUrl(token) {
  return `${SITE}/api/morning/unsubscribe?t=${token}`;
}

export function editionLink(date) {
  return `${SITE}/morning?d=${date}&src=em`;
}

export const reportLink = () => `${SITE}/r?src=em`;

const LA_HOUR = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
});

/**
 * LA day and hour of `ms` → {send, day, reason}: reason 'before-first-edition'
 * (day < FIRST_EDITION) | 'not-6am' (hour !== SEND_HOUR) | null. The Worker
 * fires at 13:45 and 14:45 UTC every day; this keeps exactly one of them.
 */
export function shouldSend(ms) {
  const p = {};
  for (const part of LA_HOUR.formatToParts(new Date(ms))) p[part.type] = part.value;
  const day = `${p.year}-${p.month}-${p.day}`;
  const hour = Number(p.hour) % 24;
  if (day < FIRST_EDITION) return { send: false, day, reason: 'before-first-edition' };
  if (hour !== SEND_HOUR) return { send: false, day, reason: 'not-6am' };
  return { send: true, day, reason: null };
}

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * The JSON Feed item for `day` (feed = the /morning.json?d=<day> body) when it
 * is frozen and whole: id `morning:<day>`, _pointcast.frozen true, not
 * provisional, exactly EDITION_SLOTS slots each with a non-empty `line` and
 * `label`. Else null.
 */
export function frozenItem(feed, day) {
  if (!isObj(feed) || !Array.isArray(feed.items) || typeof day !== 'string') return null;
  const item = feed.items.find((i) => isObj(i) && i.id === `morning:${day}`);
  if (!item || !isObj(item._pointcast)) return null;
  const pc = item._pointcast;
  if (pc.frozen !== true || pc.provisional === true) return null;
  if (!Array.isArray(pc.slots) || pc.slots.length !== EDITION_SLOTS) return null;
  if (!pc.slots.every((s) => isObj(s) && nonEmpty(s.line) && nonEmpty(s.label))) return null;
  return item;
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function htmlPage(title, inner) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title></head>`,
    `<body style="margin:0;padding:24px 16px;background:#ffffff;color:#111111;font-family:${FONT};font-size:16px;line-height:1.45;">`,
    '<div style="max-width:560px;margin:0 auto;">',
    inner,
    '</div>',
    '</body>',
    '</html>',
  ].join('\n');
}

const p = (text, style = '') => `<p style="margin:0 0 12px;${style}">${escapeHtml(text)}</p>`;
const a = (href, text) => `<a href="${escapeHtml(href)}" style="color:#111111;">${escapeHtml(text)}</a>`;

/**
 * {subject, text, html, headers} for one subscriber. `item` is a frozenItem().
 * Links: the edition and the report page carry src=em; the unsubscribe link
 * carries the subscriber's token. No images, no pixel.
 */
export function editionEmail(item, token) {
  const pc = isObj(item?._pointcast) ? item._pointcast : {};
  const date = String(item?.id ?? '').replace(/^morning:/u, '');
  const subject = String(item?.title ?? 'PointCast Morning Edition');
  const masthead = nonEmpty(pc.masthead) ? pc.masthead : subject;
  const reporterLine = nonEmpty(pc.reporterLine) ? pc.reporterLine : '';
  const slots = Array.isArray(pc.slots) ? pc.slots : [];
  const tail = [pc.footer, pc.disclosure].filter(nonEmpty);
  const links = [
    ['Read it on the site', editionLink(date)],
    ['Report from a court', reportLink()],
    ['Unsubscribe', unsubscribeUrl(token)],
  ];

  const text = [
    masthead,
    ...(reporterLine ? [reporterLine] : []),
    '',
    ...slots.flatMap((s) => [String(s.label), String(s.line), '']),
    ...tail,
    ...(tail.length ? [''] : []),
    ...links.map(([label, href]) => `${label}: ${href}`),
  ].join('\n');

  const html = htmlPage(subject, [
    p(masthead, 'font-size:13px;letter-spacing:.04em;font-weight:600;'),
    ...(reporterLine ? [p(reporterLine, 'font-size:14px;color:#444444;')] : []),
    '<hr style="border:0;border-top:1px solid #dddddd;margin:16px 0;">',
    ...slots.map((s) => [
      `<p style="margin:0 0 2px;font-size:12px;letter-spacing:.04em;color:#555555;">${escapeHtml(s.label)}</p>`,
      p(s.line, 'margin-bottom:16px;'),
    ].join('\n')),
    '<hr style="border:0;border-top:1px solid #dddddd;margin:16px 0;">',
    ...tail.map((t) => p(t, 'font-size:13px;color:#555555;')),
    ...links.map(([label, href]) => `<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(label)}: ${a(href, href)}</p>`),
  ].join('\n'));

  return {
    subject,
    text,
    html,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl(token)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

const CONFIRM_SUBJECT = 'Confirm the PointCast Morning Edition';
const CONFIRM_LEAD = 'Open this link to get the Morning Edition by email at 6:45 AM each day:';
const CONFIRM_FINE = 'The link works for 48 hours. If you did not ask for this, ignore this email and nothing more will be sent.';
const CONFIRM_SIGN = 'PointCast · El Segundo · https://pointcast.xyz/morning';

/** {subject, text, html} for the double opt-in mail. */
export function confirmEmail(raw) {
  const url = confirmUrl(raw);
  const text = [CONFIRM_LEAD, '', url, '', CONFIRM_FINE, '', CONFIRM_SIGN].join('\n');
  const html = htmlPage(CONFIRM_SUBJECT, [
    p(CONFIRM_LEAD),
    `<p style="margin:0 0 12px;">${a(url, url)}</p>`,
    p(CONFIRM_FINE, 'font-size:14px;color:#444444;'),
    `<p style="margin:0;font-size:13px;color:#555555;">PointCast · El Segundo · ${a(`${SITE}/morning`, `${SITE}/morning`)}</p>`,
  ].join('\n'));
  return { subject: CONFIRM_SUBJECT, text, html };
}

/**
 * Whether this env can send mail.
 *   RESEND_API_KEY set                                   → resend
 *   SEND_EMAIL bound and MORNING_SEND_EMAIL_READY 'true' → send_email
 *   SEND_EMAIL bound, not marked ready                   → not configured, 'send-email-not-onboarded'
 *   neither                                              → not configured, 'no-mail-sender'
 * A bare SEND_EMAIL binding is never "configured": pointcast.xyz is not
 * onboarded to Email Sending.
 */
export function mailReadiness(env) {
  const e = isObj(env) ? env : {};
  if (nonEmpty(e.RESEND_API_KEY)) return { configured: true, via: 'resend', reason: null, note: null };
  if (e.SEND_EMAIL) {
    if (e.MORNING_SEND_EMAIL_READY === 'true') return { configured: true, via: 'send_email', reason: null, note: null };
    return { configured: false, via: null, reason: 'send-email-not-onboarded', note: MAIL_OFF_NOTE };
  }
  return { configured: false, via: null, reason: 'no-mail-sender', note: MAIL_OFF_NOTE };
}
