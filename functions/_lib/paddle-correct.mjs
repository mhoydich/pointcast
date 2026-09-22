// Pure parts of /api/paddles/correct — validation of a correction claim —
// kept in a plain module so tests run them under node without the Pages runtime.

export const FIELDS = ['launch-date', 'price', 'usap', 'upaa', 'dimensions', 'construction', 'pro', 'lifecycle', 'other'];
export const CLAIM_MIN = 10;
export const CLAIM_MAX = 600;
export const SOURCE_MAX = 500;
export const CONTACT_MAX = 120;
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MARKUP_RE = /[<>][a-zA-Z]/;

/** Strip control characters (keeps tab and newline), collapse CR to LF, trim. */
export function cleanText(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/\r\n?/g, '\n').replace(CONTROL_RE, '').trim();
}

/**
 * Pure: parse and validate a correction body, or return a reason. Never repairs
 * a claim beyond stripping control characters; a claim that fails a range is
 * refused so what is stored is what the submitter wrote.
 */
export function parseCorrection(body) {
  if (!body || typeof body !== 'object') return { reason: 'bad-body' };
  const paddleId = typeof body.paddleId === 'string' ? body.paddleId : '';
  if (!ID_RE.test(paddleId) || paddleId.length > 64) return { reason: 'bad-paddle' };
  const field = typeof body.field === 'string' ? body.field : '';
  if (!FIELDS.includes(field)) return { reason: 'bad-field' };
  const claim = cleanText(body.claim);
  if (claim.length < CLAIM_MIN) return { reason: 'claim-too-short' };
  if (claim.length > CLAIM_MAX) return { reason: 'claim-too-long' };
  if (MARKUP_RE.test(claim)) return { reason: 'claim-looks-like-markup' };
  const source = cleanText(body.source);
  if (!source) return { reason: 'source-required' };
  if (source.length > SOURCE_MAX) return { reason: 'source-too-long' };
  if (!isHttpsUrl(source)) return { reason: 'source-not-https' };
  let contact = null;
  if (body.contact != null && body.contact !== '') {
    contact = cleanText(body.contact);
    if (contact.length > CONTACT_MAX) return { reason: 'contact-too-long' };
    if (MARKUP_RE.test(contact)) return { reason: 'contact-looks-like-markup' };
    if (!contact) contact = null;
  }
  return { paddleId, correction: { field, claim, source, contact } };
}

function isHttpsUrl(s) {
  if (!/^https:\/\/\S+$/.test(s)) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** The public shape for the admin queue: everything but the contact. */
export function withoutContact(item) {
  const { contact, ...rest } = item;
  return rest;
}

/** Count open items per paddle. */
export function countOpen(queue) {
  const counts = {};
  for (const it of queue) if (it.status === 'open') counts[it.paddleId] = (counts[it.paddleId] ?? 0) + 1;
  return counts;
}
