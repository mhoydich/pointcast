// PMM v0.4: settle a TAB in tez. One ES module shared by PMM (lazy-loaded from app.js) and the
// /pmm/settle page (imported at runtime), with no DOM and no wallet code so node tests cover it.
//
// The payer's PMM opens /pmm/settle with the payee's address and an amount in the URL
// fragment (never sent to a server). The page sends one plain tez transfer through the
// PointCast Beacon wallet and hands the operation hash back to PMM, which tells the friend.
// The friend's phone checks that operation on chain before it marks the tab settled.

// tz1/tz2/tz3/tz4 implicit accounts: a base58 body of 33 characters. The page also runs the
// wallet library's checksum validation; this regex is the cheap first gate.
export const TZ_RE = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
// Tezos operation hashes: 'o' plus 50 base58 characters.
export const OP_RE = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
// A friend id prefix PMM uses in its own links (#f=...): 16 hex.
const FRIEND_RE = /^[0-9a-f]{16}$/;
export const MAX_TEZ = 1000;

/** Parse "1.5" or "1,5" into whole mutez, or null. Up to 6 decimals, more than 0, at most MAX_TEZ. */
export function toMutez(input) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const mutez = Number(whole) * 1_000_000 + Number(frac.padEnd(6, '0'));
  if (!Number.isSafeInteger(mutez) || mutez <= 0 || mutez > MAX_TEZ * 1_000_000) return null;
  return mutez;
}

export function formatTez(mutez) {
  const whole = Math.floor(mutez / 1_000_000), frac = String(mutez % 1_000_000).padStart(6, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}

/** Read the settle page fragment: #to=tz1...&tez=1.5&note=tacos&f=<friend id prefix>&me=<payer tz>. */
export function parseSettleHash(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const to = (p.get('to') || '').trim();
  const out = {
    to: TZ_RE.test(to) ? to : null,
    mutez: p.has('tez') ? toMutez(p.get('tez')) : null,
    note: (p.get('note') || '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 60),
    friend: FRIEND_RE.test(p.get('f') || '') ? p.get('f') : null,
    // The address the payer shared in PMM. The friend only counts a payment sent from it.
    me: TZ_RE.test(p.get('me') || '') ? p.get('me') : null,
  };
  out.errors = [];
  if (!out.to) out.errors.push('no-payee');
  if (p.has('tez') && out.mutez === null) out.errors.push('bad-amount');
  return out;
}

/** The link back into PMM after a send: #settled=<op>&mutez=<n>&to=<payee>&from=<payer>&f=<friend>. */
export function returnLink({ opHash, friend, mutez, to, from }) {
  if (!OP_RE.test(opHash || '')) throw new Error('bad-op');
  if (!TZ_RE.test(from || '')) throw new Error('bad-payer');
  const p = new URLSearchParams({ settled: opHash, mutez: String(mutez), to, from });
  if (friend) p.set('f', friend);
  return '/pmm/#' + p.toString();
}

/**
 * Judge a TzKT /v1/operations/transactions/{hash} answer against what was claimed.
 * Returns { ok: true, from, mutez, level } or { ok: false, reason }.
 * A batch can hold several transactions; the applied ones from `from` to `to` must add up to `mutez`.
 * `from` binds the payment to the friend who claims it, so nobody can cite someone else's transfer.
 */
export function judgeTransfer(tzktRows, { to, mutez, from }) {
  if (!Array.isArray(tzktRows) || !tzktRows.length) return { ok: false, reason: 'not-found' };
  const toPayee = tzktRows.filter((r) => r && r.target && r.target.address === to);
  if (!toPayee.length) return { ok: false, reason: 'wrong-payee' };
  const hits = from ? toPayee.filter((r) => r.sender && r.sender.address === from) : toPayee;
  if (!hits.length) return { ok: false, reason: 'wrong-payer' };
  const applied = hits.filter((r) => r.status === 'applied');
  if (!applied.length) return { ok: false, reason: 'not-applied' };
  const paid = applied.reduce((n, r) => n + (Number.isSafeInteger(r.amount) ? r.amount : 0), 0);
  if (paid < mutez) return { ok: false, reason: 'short', paid };
  return { ok: true, from: applied[0].sender?.address || null, mutez: paid, level: applied[0].level ?? null };
}

/** The payer's link from a PMM chat to the settle page. Amount is left for the payer to type. */
export function settleLink({ to, note = '', friend = '', me = '' }) {
  if (!TZ_RE.test(to || '')) throw new Error('no-payee');
  if (!TZ_RE.test(me || '')) throw new Error('no-payer');
  const p = new URLSearchParams({ to, me });
  if (note) p.set('note', String(note).slice(0, 60));
  if (FRIEND_RE.test(friend)) p.set('f', friend);
  return '/pmm/settle#' + p.toString();
}

/** PMM's side of returnLink: read #settled=...&mutez=...&to=...&f=... or return null. */
export function parseReturn(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const op = p.get('settled') || '', to = p.get('to') || '', from = p.get('from') || '', mutez = Number(p.get('mutez'));
  if (!OP_RE.test(op) || !TZ_RE.test(to) || !TZ_RE.test(from) || !Number.isSafeInteger(mutez) || mutez <= 0 || mutez > MAX_TEZ * 1_000_000) return null;
  const friend = p.get('f') || '';
  return { op, to, from, mutez, friend: FRIEND_RE.test(friend) ? friend : null };
}

export const TZKT = 'https://api.tzkt.io/v1/operations/transactions/';

/** Ask TzKT about one operation and judge it. A network failure is { ok: false, reason: 'offline' }. */
export async function verifyOnChain(op, claim, fetchImpl = globalThis.fetch) {
  if (!OP_RE.test(op || '')) return { ok: false, reason: 'bad-op' };
  try {
    const r = await fetchImpl(TZKT + op + '?select=target,sender,amount,status,level', { cache: 'no-store' });
    if (!r.ok) return { ok: false, reason: r.status === 404 ? 'not-found' : 'offline' };
    return judgeTransfer(await r.json(), claim);
  } catch (_) {
    return { ok: false, reason: 'offline' };
  }
}
