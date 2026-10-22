// PMM v0.4: settle a TAB in tez. One ES module shared by PMM (lazy-loaded from app.js) and the
// /pmm/settle page (imported at runtime), with no DOM and no wallet code so node tests cover it.
//
// The flow, and what each step refuses:
// 1. The payer presses SETTLE. PMM records a one-time nonce, the payee's address and the ids of
//    the open tabs (friend.settling), then opens /pmm/settle with them in the URL fragment.
// 2. /pmm/settle only enables SEND for that pending settle. It sends one plain transfer from the
//    payer's own wallet, which must be the address the payer shared in PMM.
// 3. The result returns to the PMM tab that pressed SETTLE. acceptReturn() refuses any return that
//    does not match the pending nonce, payee and payer, so a crafted link cannot make PMM sign.
// 4. PMM signs a 'paid' claim naming the operation, the exact tabs and the moment SETTLE was
//    pressed. judgeClaim() on the payee's phone checks it before any chain lookup.
// 5. Both phones look the operation up on TzKT (judgeTransfer): applied, from the payer, to the
//    payee, at least the amount, and made after SETTLE was pressed and after every named tab.
// 6. Tabs carry no currency, so tez cannot be checked against them. The payee decides: ACCEPT
//    closes the named tabs on both phones, NOT ENOUGH leaves them open. Until then they are pending.

// tz1/tz2/tz3/tz4 implicit accounts: a base58 body of 33 characters. The page also runs the
// wallet library's checksum validation; this regex is the cheap first gate.
export const TZ_RE = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
// Tezos operation hashes: 'o' plus 50 base58 characters.
export const OP_RE = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
// A friend id prefix PMM uses in its own links (#f=...), and a settle nonce: 16 hex each.
const HEX16 = /^[0-9a-f]{16}$/;
// PMM's tab ids (uid() in app.js): lowercase base36.
export const TAB_ID_RE = /^[a-z0-9]{1,40}$/;
export const MAX_TEZ = 1000;
export const MAX_TABS = 50;
// Phones' clocks and block times drift; allow this much when comparing them.
export const SKEW_MS = 120_000;

/** Parse "1.5" or "1,5" into whole mutez, or null. Up to 6 decimals, more than 0, at most MAX_TEZ. */
export function toMutez(input) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const mutez = Number(whole) * 1_000_000 + Number(frac.padEnd(6, '0'));
  return validMutez(mutez) ? mutez : null;
}
export const validMutez = (n) => Number.isSafeInteger(n) && n > 0 && n <= MAX_TEZ * 1_000_000;

export function formatTez(mutez) {
  const whole = Math.floor(mutez / 1_000_000), frac = String(mutez % 1_000_000).padStart(6, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}

/** A one-time settle nonce: 16 hex from the platform's CSPRNG. */
export function newNonce(cryptoImpl = globalThis.crypto) {
  const b = new Uint8Array(8); cryptoImpl.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** The payer's link from a PMM chat to the settle page. The amount is left for the payer to type. */
export function settleLink({ to, note = '', friend, me, nonce }) {
  if (!TZ_RE.test(to || '')) throw new Error('no-payee');
  if (!TZ_RE.test(me || '')) throw new Error('no-payer');
  if (!HEX16.test(friend || '')) throw new Error('no-friend');
  if (!HEX16.test(nonce || '')) throw new Error('no-nonce');
  const p = new URLSearchParams({ to, me, f: friend, n: nonce });
  if (note) p.set('note', String(note).slice(0, 60));
  return '/pmm/settle#' + p.toString();
}

/** Read the settle page fragment: #to=<payee>&me=<payer>&f=<friend id prefix>&n=<nonce>&note=…. */
export function parseSettleHash(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const get = (k, re) => (re.test(p.get(k) || '') ? p.get(k) : null);
  const out = {
    to: get('to', TZ_RE),
    me: get('me', TZ_RE),
    friend: get('f', HEX16),
    nonce: get('n', HEX16),
    note: (p.get('note') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60),
  };
  out.errors = ['to', 'me', 'friend', 'nonce'].filter((k) => !out[k]).map((k) => 'no-' + k);
  return out;
}

/**
 * The settle page's gate. SEND is enabled only for a settle this browser's PMM is waiting on:
 * a friend whose id starts with the fragment's prefix, whose shared address is the payee, and
 * whose pending settle carries the same nonce and payee. `pmmState` is PMM's saved state.
 */
export function pendingSettleFor(req, pmmState) {
  if (!req || req.errors?.length) return { ok: false, reason: 'bad-link' };
  const friends = Array.isArray(pmmState?.friends) ? pmmState.friends : [];
  const f = friends.find((x) => typeof x?.id === 'string' && x.id.startsWith(req.friend));
  if (!f) return { ok: false, reason: 'not-a-friend' };
  if (f.xtz !== req.to) return { ok: false, reason: 'not-their-address' };
  if (pmmState?.me?.tzAddr !== req.me) return { ok: false, reason: 'not-your-address' };
  const s = f.settling;
  if (!s || s.nonce !== req.nonce || s.to !== req.to) return { ok: false, reason: 'no-pending-settle' };
  return { ok: true, name: typeof f.name === 'string' ? f.name : 'FRIEND' };
}

/** The link back into PMM after a send: #settled=<op>&mutez=<n>&to=<payee>&from=<payer>&f=<friend>&n=<nonce>. */
export function returnLink({ opHash, friend, mutez, to, from, nonce }) {
  if (!OP_RE.test(opHash || '')) throw new Error('bad-op');
  if (!TZ_RE.test(from || '')) throw new Error('bad-payer');
  if (!TZ_RE.test(to || '')) throw new Error('bad-payee');
  if (!validMutez(mutez)) throw new Error('bad-amount');
  if (!HEX16.test(friend || '') || !HEX16.test(nonce || '')) throw new Error('bad-pending');
  return '/pmm/#' + new URLSearchParams({ settled: opHash, mutez: String(mutez), to, from, f: friend, n: nonce }).toString();
}

/** PMM's side of returnLink: read the fragment, or null if any part is malformed. */
export function parseReturn(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const op = p.get('settled') || '', to = p.get('to') || '', from = p.get('from') || '', mutez = Number(p.get('mutez'));
  const friend = p.get('f') || '', nonce = p.get('n') || '';
  if (!OP_RE.test(op) || !TZ_RE.test(to) || !TZ_RE.test(from) || !validMutez(mutez) || !HEX16.test(friend) || !HEX16.test(nonce)) return null;
  return { op, to, from, mutez, friend, nonce };
}

/**
 * The payer's PMM accepts a return only for the settle it started: same nonce, same payee (still
 * the friend's shared address), sent from the payer's own shared address. Returns the tabs still
 * open from the snapshot, or a reason. A crafted link or a stray BroadcastChannel post fails here.
 */
export function acceptReturn(r, friend, myAddr) {
  if (!r) return { ok: false, reason: 'bad-link' };
  const s = friend && friend.settling;
  if (!s || !HEX16.test(s.nonce || '') || r.nonce !== s.nonce) return { ok: false, reason: 'no-pending-settle' };
  if (r.to !== s.to || r.to !== friend.xtz) return { ok: false, reason: 'wrong-payee' };
  if (!TZ_RE.test(myAddr || '') || r.from !== myAddr) return { ok: false, reason: 'wrong-payer' };
  const open = new Set((friend.ledger || []).filter((x) => !x.settled && !x.pending).map((x) => x.id));
  const tabs = (s.tabs || []).filter((t) => open.has(t));
  if (!tabs.length) return { ok: false, reason: 'no-open-tabs' };
  return { ok: true, tabs, since: Number(s.ts) || 0 };
}

/** The signed claim text: "<op> <tab>,<tab>… <since ms>". */
export const claimText = ({ op, tabs, since }) => `${op} ${tabs.join(',')} ${since}`;
export function parseClaimText(text) {
  const parts = String(text || '').split(' ');
  if (parts.length !== 3) return null;
  const [op, list, sinceStr] = parts, tabs = list.split(',').filter(Boolean), since = Number(sinceStr);
  if (!OP_RE.test(op) || !tabs.length || tabs.length > MAX_TABS || !tabs.every((t) => TAB_ID_RE.test(t)) || new Set(tabs).size !== tabs.length) return null;
  if (!Number.isSafeInteger(since) || since <= 0) return null;
  return { op, tabs, since };
}

/**
 * The payee's phone judges a 'paid' claim (signature already verified by app.js) before any
 * chain lookup. `seenOps` holds every operation hash already counted or pending on this phone.
 * On success returns what to look up and the earliest time the transfer may have happened.
 */
export function judgeClaim({ claim, friend, myId, myAddr, seenOps }) {
  if (!claim || claim.to !== myId) return { ok: false, reason: 'not-for-me' };
  if (!TZ_RE.test(myAddr || '') || claim.note !== myAddr) return { ok: false, reason: 'not-my-address' };
  if (!friend || !TZ_RE.test(friend.xtz || '') || claim.dir !== friend.xtz) return { ok: false, reason: 'unshared-payer' };
  if (!validMutez(claim.amount)) return { ok: false, reason: 'bad-amount' };
  const c = parseClaimText(claim.text);
  if (!c) return { ok: false, reason: 'bad-claim' };
  if (seenOps && seenOps.has(c.op)) return { ok: false, reason: 'replay' };
  const ledger = friend.ledger || [];
  const named = c.tabs.map((t) => ledger.find((x) => x.id === t));
  if (named.some((x) => !x || x.settled || x.pending)) return { ok: false, reason: 'tabs-not-open' };
  if (c.since > (Number(claim.ts) || 0) + SKEW_MS) return { ok: false, reason: 'from-the-future' };
  // The transfer must postdate the settle press and every tab it pays for.
  const notBefore = Math.max(c.since, ...named.map((x) => Number(x.ts) || 0)) - SKEW_MS;
  return { ok: true, op: c.op, tabs: c.tabs, since: c.since, notBefore, mutez: claim.amount, from: claim.dir, to: claim.note };
}

/**
 * Judge a TzKT /v1/operations/transactions/{hash} answer against what was claimed.
 * The applied rows from `from` to `to`, made no earlier than `notBefore` (ms), must add up to `mutez`.
 * `from` binds the payment to the claiming friend; `notBefore` stops an old transfer being reused.
 */
export function judgeTransfer(tzktRows, { to, mutez, from, notBefore = 0 }) {
  if (!Array.isArray(tzktRows) || !tzktRows.length) return { ok: false, reason: 'not-found' };
  const toPayee = tzktRows.filter((r) => r && r.target && r.target.address === to);
  if (!toPayee.length) return { ok: false, reason: 'wrong-payee' };
  const hits = from ? toPayee.filter((r) => r.sender && r.sender.address === from) : toPayee;
  if (!hits.length) return { ok: false, reason: 'wrong-payer' };
  const applied = hits.filter((r) => r.status === 'applied');
  if (!applied.length) return { ok: false, reason: 'not-applied' };
  if (notBefore && applied.some((r) => !(Date.parse(r.timestamp) >= notBefore))) return { ok: false, reason: 'too-old' };
  const paid = applied.reduce((n, r) => n + (Number.isSafeInteger(r.amount) ? r.amount : 0), 0);
  if (paid < mutez) return { ok: false, reason: 'short', paid };
  return { ok: true, from: applied[0].sender?.address || null, mutez: paid, level: applied[0].level ?? null };
}

export const TZKT = 'https://api.tzkt.io/v1/operations/transactions/';

/** Ask TzKT about one operation and judge it. Never throws; a network failure or timeout is 'offline'. */
export async function verifyOnChain(op, claim, fetchImpl = globalThis.fetch, timeoutMs = 10_000) {
  if (!OP_RE.test(op || '')) return { ok: false, reason: 'bad-op' };
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const r = await fetchImpl(TZKT + op + '?select=target,sender,amount,status,level,timestamp', { cache: 'no-store', signal: ctrl?.signal });
    if (!r.ok) return { ok: false, reason: r.status === 404 ? 'not-found' : 'offline' };
    return judgeTransfer(await r.json(), claim);
  } catch (_) {
    return { ok: false, reason: 'offline' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
