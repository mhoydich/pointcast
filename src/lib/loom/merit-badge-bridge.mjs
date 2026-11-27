/**
 * Camp Merit Badge bridge.
 *
 * A badge is a public sample record: who, which room, when, and a URL that
 * points at the evidence. The proof is a Block Yard pin. In
 * public/chain/yard/index.html a body shard is used only when its `sha256`
 * matches /^[0-9a-f]{64}$/ and equals SHA-256 of the exact bytes
 * (`crypto.subtle.digest("SHA-256", buf)`, lowercase hex). Anything else is
 * skipped. verify.js `sha256Hex` is the same digest. This module hashes the
 * canonical badge text the same way and refuses a record whose pin does not
 * match. Chain transaction ids stay blake2b; this pin is the Yard's SHA-256
 * file check, not a tx hash.
 *
 * The Tezos note is text for #mint-queue. It is unsigned, free, and CC0.
 * `signed` is false and `liveMintEnabled` is false. This file does not sign,
 * price, send, or mint.
 *
 * Web Crypto only. No imports, no Node built-ins. The sketch page and
 * `node --test` both run it.
 */

export const BADGE_SCHEMA = 'pointcast.camp.merit-badge/v1';
export const MINT_TICKET_SCHEMA = 'pointcast.camp.merit-badge.mint-ticket/v1';
/** Same shape the Block Yard requires before it will read a pinned file. */
export const YARD_SHA256_PIN = /^[0-9a-f]{64}$/;
export const RECORD_KEYS = Object.freeze([
  'badgeId',
  'recipientHandle',
  'room',
  'earnedAt',
  'evidenceUrl',
  'sha256',
]);

/** Illustrations for the sketch. `label` and `line` are not part of the proof. */
export const SAMPLE_BADGES = Object.freeze([
  Object.freeze({
    label: 'Tide watch',
    line: 'Sample only. A sketch of reading the water before a swim. Not a chain transaction and not a claim that this handle earned it.',
    badgeId: 'tide-watch',
    recipientHandle: '@shore',
    room: '#camp',
    earnedAt: '2026-07-04T16:30:00Z',
    evidenceUrl: 'https://pointcast.xyz/thus-camp',
  }),
  Object.freeze({
    label: 'Knot yard',
    line: 'Sample only. A bowline that holds and still unties. The proof is the pin below, not a mint.',
    badgeId: 'knot-yard',
    recipientHandle: '@elm',
    room: '#camp',
    earnedAt: '2026-08-12T19:05:00Z',
    evidenceUrl: 'https://pointcast.xyz/thus-camp',
  }),
  Object.freeze({
    label: 'First light',
    line: 'Sample only. Kept a morning fire until the room was warm. Unsigned, and not on Tezos.',
    badgeId: 'first-light',
    recipientHandle: '@wick',
    room: '#hearth',
    earnedAt: '2026-11-26T14:00:00Z',
    evidenceUrl: 'https://pointcast.xyz/loom',
  }),
]);

export class BadgeError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'BadgeError';
    this.code = code;
  }
}

function noControls(value, code) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) throw new BadgeError(code);
  return value.trim();
}

export function canonicalBadgeId(raw) {
  const s = noControls(raw, 'badge_id').toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(s)) throw new BadgeError('badge_id');
  return s;
}

/** Loom handle grammar: `@` plus 1–32 of the handle alphabet, stored lowercase. */
export function canonicalHandle(raw) {
  let s = noControls(raw, 'recipient_handle').toLowerCase();
  if (!s.startsWith('@')) s = `@${s}`;
  if (!/^@[a-z0-9][a-z0-9_.-]{0,31}$/.test(s)) throw new BadgeError('recipient_handle');
  return s;
}

/** Loom topic grammar. `#camp` and `#mint-queue` are rooms; stored lowercase. */
export function canonicalRoom(raw) {
  let s = noControls(raw, 'room').toLowerCase();
  if (!s.startsWith('#')) s = `#${s}`;
  if (!/^#[a-z0-9][a-z0-9-]{0,39}$/.test(s)) throw new BadgeError('room');
  return s;
}

/** UTC to the second, `Z` only, so two spellings of one instant cannot both pin. */
export function canonicalEarnedAt(raw) {
  const s = noControls(raw, 'earned_at');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)) throw new BadgeError('earned_at');
  const ms = Date.parse(s);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== `${s.slice(0, -1)}.000Z`) {
    throw new BadgeError('earned_at');
  }
  return s;
}

export function canonicalEvidenceUrl(raw) {
  const s = noControls(raw, 'evidence_url');
  if (s.length === 0 || s.length > 400) throw new BadgeError('evidence_url');
  let url;
  try { url = new URL(s); } catch { throw new BadgeError('evidence_url'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new BadgeError('evidence_url');
  url.hash = '';
  if (url.href.length > 400) throw new BadgeError('evidence_url');
  return url.href;
}

/** The five fields, in pin order, already normalized. */
export function canonicalizeBadge(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadgeError('not-a-record');
  return {
    badgeId: canonicalBadgeId(input.badgeId),
    recipientHandle: canonicalHandle(input.recipientHandle),
    room: canonicalRoom(input.room),
    earnedAt: canonicalEarnedAt(input.earnedAt),
    evidenceUrl: canonicalEvidenceUrl(input.evidenceUrl),
  };
}

/**
 * Exact UTF-8 text the pin covers. Field order is fixed, so key order on the
 * input object cannot move the hash. No extra whitespace.
 */
export function canonicalBadgeText(record) {
  const fields = canonicalizeBadge(record);
  return JSON.stringify([
    BADGE_SCHEMA,
    fields.badgeId,
    fields.recipientHandle,
    fields.room,
    fields.earnedAt,
    fields.evidenceUrl,
  ]);
}

/** Lowercase hex SHA-256. Same WebCrypto call the Block Yard uses for a pin. */
export async function sha256Hex(bytes) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle || typeof subtle.digest !== 'function') throw new BadgeError('webcrypto_unavailable');
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  const digest = new Uint8Array(await subtle.digest('SHA-256', data));
  let hex = '';
  for (const b of digest) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/** Issue one badge. Same input always returns the same frozen record. */
export async function issueBadge(input) {
  const fields = canonicalizeBadge(input);
  const sha256 = await sha256Hex(canonicalBadgeText(fields));
  return Object.freeze({ ...fields, sha256 });
}

/**
 * Recompute the pin and compare. A bad shape, a non-lowercase pin, or a
 * digest that differs is a refusal (`ok: false`), which is the Yard's skip.
 */
export async function verifyBadge(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { ok: false, reason: 'not-a-record' };
  }
  const keys = Object.keys(record);
  if (keys.length !== RECORD_KEYS.length || keys.some((key) => !RECORD_KEYS.includes(key))) {
    return { ok: false, reason: 'record-shape' };
  }
  let fields;
  try {
    fields = canonicalizeBadge(record);
  } catch (err) {
    return { ok: false, reason: err instanceof BadgeError ? err.code : 'invalid' };
  }
  for (const key of RECORD_KEYS) {
    if (key === 'sha256') continue;
    if (record[key] !== fields[key]) return { ok: false, reason: 'not-canonical' };
  }
  if (typeof record.sha256 !== 'string' || !YARD_SHA256_PIN.test(record.sha256)) {
    return { ok: false, reason: 'bad-pin' };
  }
  let digest;
  try {
    digest = await sha256Hex(canonicalBadgeText(fields));
  } catch {
    return { ok: false, reason: 'webcrypto_unavailable' };
  }
  if (digest !== record.sha256) return { ok: false, reason: 'pin-mismatch' };
  return { ok: true, reason: 'match', sha256: digest };
}

/**
 * Unsigned CC0 ticket proposal for #mint-queue. Refuses a record that does
 * not verify, so a tampered badge never receives ticket text.
 */
export async function formatMintTicket(record) {
  const verdict = await verifyBadge(record);
  if (!verdict.ok) throw new BadgeError('ticket_refused', verdict.reason);
  const text = [
    '#mint-queue',
    'Camp Merit Badge · unsigned CC0 ticket proposal',
    '',
    'This note is a proposal to read. It is not a Tezos operation.',
    'It is unsigned, free, and CC0. Nothing here is priced, signed, or sent.',
    '',
    'signed: false',
    'liveMintEnabled: false',
    'priceMutez: 0',
    'priced: false',
    'license: CC0-1.0',
    'rights: CC0 1.0 Universal',
    'network: tezos',
    'interfaces: TZIP-012, TZIP-016, TZIP-021',
    '',
    `badgeId: ${record.badgeId}`,
    `recipientHandle: ${record.recipientHandle}`,
    `room: ${record.room}`,
    `earnedAt: ${record.earnedAt}`,
    `evidenceUrl: ${record.evidenceUrl}`,
    `sha256: ${record.sha256}`,
    '',
    'Proof: lowercase hex SHA-256 of the canonical badge bytes.',
    'The Block Yard uses that same pin before it trusts a body shard. A mismatch is a refusal.',
    '',
    'Do not mint from this note.',
  ].join('\n');
  return Object.freeze({
    schema: MINT_TICKET_SCHEMA,
    to: '#mint-queue',
    network: 'tezos',
    interfaces: Object.freeze(['TZIP-012', 'TZIP-016', 'TZIP-021']),
    license: 'CC0-1.0',
    rights: 'CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    priceMutez: 0,
    priced: false,
    free: true,
    signed: false,
    liveMintEnabled: false,
    proposalOnly: true,
    submits: false,
    badgeId: record.badgeId,
    recipientHandle: record.recipientHandle,
    room: record.room,
    earnedAt: record.earnedAt,
    evidenceUrl: record.evidenceUrl,
    sha256: record.sha256,
    text,
  });
}

function el(doc, tag, attrs, text) {
  const node = doc.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Phone sketch binder. Builds the sample list, runs verifyBadge in this
 * document, and shows ticket text only after the pin matches.
 */
export async function mountMeritBadgeBridge(root) {
  if (!root || typeof root.ownerDocument?.createElement !== 'function') {
    throw new BadgeError('root_required');
  }
  const doc = root.ownerDocument;
  const issued = await Promise.all(SAMPLE_BADGES.map(async (sample) => ({
    sample,
    badge: await issueBadge(sample),
  })));

  const header = el(doc, 'header', { class: 'top' });
  const yard = el(doc, 'a', { href: '/chain/yard/' }, 'Block Yard');
  const dek = el(doc, 'p', { class: 'dek' });
  dek.append(
    'Each proof is a lowercase SHA-256 pin of the canonical bytes, the same check the ',
    yard,
    ' uses before it trusts a body shard. These three are samples. They are not chain transactions, and this page does not mint.',
  );
  header.append(
    el(doc, 'p', { class: 'kicker' }, 'Camp · Merit badge bridge'),
    el(doc, 'h1', {}, 'Sample badges, checked here'),
    dek,
  );

  const picker = el(doc, 'div', { class: 'picker', role: 'group', 'aria-label': 'Sample Camp Merit Badges' });
  const buttons = issued.map((item, index) => {
    const button = el(doc, 'button', { type: 'button', 'data-index': String(index) }, item.sample.label);
    const meta = el(doc, 'span', {}, `${item.sample.badgeId} · ${item.badge.recipientHandle}`);
    button.append(meta);
    picker.append(button);
    return button;
  });

  const record = el(doc, 'section', { class: 'panel', 'aria-labelledby': 'badge-title' });
  const title = el(doc, 'h2', { id: 'badge-title' });
  const line = el(doc, 'p', { class: 'line' });
  const list = el(doc, 'dl');
  const values = {};
  for (const key of RECORD_KEYS) {
    list.append(el(doc, 'dt', {}, key), values[key] = el(doc, 'dd', { class: key === 'sha256' ? 'pin' : '' }));
  }
  const status = el(doc, 'p', { id: 'proof-status', class: 'status', role: 'status' });
  const actions = el(doc, 'div', { class: 'actions' });
  const verifyBtn = el(doc, 'button', { type: 'button', 'data-action': 'verify' }, 'Verify proof');
  const tamperBtn = el(doc, 'button', { type: 'button', 'data-action': 'tamper' }, 'Tamper the room');
  const restoreBtn = el(doc, 'button', { type: 'button', 'data-action': 'restore' }, 'Restore sample');
  actions.append(verifyBtn, tamperBtn, restoreBtn);
  const bytes = el(doc, 'details');
  const preimage = el(doc, 'pre', { id: 'preimage' });
  bytes.append(el(doc, 'summary', {}, 'Canonical bytes'), preimage);
  record.append(title, line, list, status, actions, bytes);

  const ticketSection = el(doc, 'section', { class: 'panel ticket', 'aria-labelledby': 'ticket-title' });
  const flags = el(doc, 'p', { class: 'flags' }, 'signed: false · liveMintEnabled: false · priceMutez: 0 · CC0');
  const ticket = el(doc, 'pre', { id: 'ticket' });
  ticketSection.append(
    el(doc, 'h2', { id: 'ticket-title' }, 'Unsigned #mint-queue ticket'),
    el(doc, 'p', { class: 'line' }, 'A proposal to read. Free, CC0, never priced. This page does not sign it or send it.'),
    flags,
    ticket,
  );

  root.replaceChildren(header, picker, record, ticketSection);

  let index = 0;
  let working = issued[0].badge;
  let tampered = false;

  async function paint() {
    const item = issued[index];
    for (const button of buttons) button.setAttribute('aria-pressed', button === buttons[index] ? 'true' : 'false');
    title.textContent = item.sample.label;
    line.textContent = item.sample.line;
    for (const key of RECORD_KEYS) values[key].textContent = working[key] ?? '';
    preimage.textContent = canonicalBadgeText(working);
    tamperBtn.setAttribute('aria-pressed', tampered ? 'true' : 'false');
    const verdict = await verifyBadge(working);
    status.dataset.ok = verdict.ok ? 'true' : 'false';
    status.dataset.reason = verdict.reason;
    status.textContent = verdict.ok
      ? 'Proof matches. The SHA-256 pin equals the canonical bytes.'
      : `Refused. The Block Yard would skip this pin (${verdict.reason}).`;
    if (!verdict.ok) {
      ticket.dataset.withheld = 'true';
      ticket.dataset.signed = 'false';
      ticket.dataset.liveMintEnabled = 'false';
      ticket.textContent = 'No ticket. This sketch formats a #mint-queue proposal only after the proof matches. signed stays false. Nothing is sent.';
      return verdict;
    }
    const proposal = await formatMintTicket(working);
    ticket.dataset.withheld = 'false';
    ticket.dataset.signed = 'false';
    ticket.dataset.liveMintEnabled = 'false';
    ticket.textContent = proposal.text;
    return verdict;
  }

  function select(next) {
    index = next;
    working = issued[next].badge;
    tampered = false;
    return paint();
  }

  picker.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !picker.contains(button)) return;
    select(Number(button.getAttribute('data-index')));
  });
  verifyBtn.addEventListener('click', () => { paint(); });
  tamperBtn.addEventListener('click', () => {
    working = { ...issued[index].badge, room: `${issued[index].badge.room}-x` };
    tampered = true;
    paint();
  });
  restoreBtn.addEventListener('click', () => { select(index); });

  const ready = paint();
  return { ready, select, paint };
}
