// PMM v0.4: settle a TAB in tez. One ES module shared by PMM (lazy-loaded from app.js) and the
// /pmm/settle page (imported at runtime). No DOM, no wallet, no network except verifyOnChain, so
// node tests cover every decision. app.js only wires these to the screen and the data channel.
//
// Who may do what:
// - Addresses are proven, not typed. Each side proves its tz1 address with one wallet signature
//   (tezos-proof.js), and the proof rides in the hello. SETTLE needs both addresses proven.
// - SETTLE makes a one-time nonce (friend.settling). /pmm/settle only sends for that pending
//   settle, and PMM only accepts a return carrying it. Nothing else can make PMM sign a claim.
// - A signed 'paid' claim names the operation, the exact tabs and the settle time.
// - Both phones look the operation up on TzKT: applied, from the payer's proven address, to the
//   payee's, at least the amount, made after the settle press and the newest named tab.
// - Tabs carry no currency, so the payee decides. ACCEPT closes the named tabs on both phones,
//   via a signed paid-ok. NOT ENOUGH, RELEASE, a refusal or CANCEL reopen them. Nothing else
//   closes a tab: not the chain result, not the payer's own phone.

export const TZ_RE = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
export const TZ1_RE = /^tz1[1-9A-HJ-NP-Za-km-z]{33}$/;
export const OP_RE = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
const HEX16 = /^[0-9a-f]{16}$/;
const PMM_ID_RE = /^[0-9a-f]{16,128}$/;
export const TAB_ID_RE = /^[a-z0-9]{1,40}$/;
export const MAX_TEZ = 1000;
export const MAX_TABS = 50;
// Phones' clocks are not synced; a tab's time and a block's time are compared with this much slack.
export const SKEW_MS = 10 * 60_000;
// A SETTLE press stays valid this long, and a second press within it reuses the same nonce.
export const SETTLE_TTL_MS = 30 * 60_000;
// A claim still unresolved after this long can be released (payee) or cancelled (payer).
export const STALE_MS = 10 * 60_000;
export const MAX_CHAIN_TRIES = 12;

export const validMutez = (n) => Number.isSafeInteger(n) && n > 0 && n <= MAX_TEZ * 1_000_000;
/** Parse "1.5" or "1,5" into whole mutez, or null. Up to 6 decimals, more than 0, at most MAX_TEZ. */
export function toMutez(input) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const mutez = Number(whole) * 1_000_000 + Number(frac.padEnd(6, '0'));
  return validMutez(mutez) ? mutez : null;
}
export function formatTez(mutez) {
  const whole = Math.floor(mutez / 1_000_000), frac = String(mutez % 1_000_000).padStart(6, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}
/** A one-time nonce: 16 hex from the platform's CSPRNG. */
export function newNonce(cryptoImpl = globalThis.crypto) {
  const b = new Uint8Array(8); cryptoImpl.getRandomValues(b);
  const out = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  if (!HEX16.test(out)) throw new Error('no-random');
  return out;
}

// ---------- links between PMM and /pmm/settle ----------

/** PMM → /pmm/settle to pay: payee, payer, friend prefix, nonce. The amount is typed on the page. */
export function settleLink({ to, me, friend, nonce, note = '' }) {
  if (!TZ1_RE.test(to || '')) throw new Error('no-payee');
  if (!TZ1_RE.test(me || '')) throw new Error('no-payer');
  if (!HEX16.test(friend || '')) throw new Error('no-friend');
  if (!HEX16.test(nonce || '')) throw new Error('no-nonce');
  const p = new URLSearchParams({ to, me, f: friend, n: nonce });
  if (note) p.set('note', String(note).slice(0, 60));
  return '/pmm/settle#' + p.toString();
}
/** PMM → /pmm/settle to prove an address: the address, my PMM id, a nonce. */
export function proveLink({ me, pid, nonce }) {
  if (!TZ1_RE.test(me || '')) throw new Error('no-address');
  if (!PMM_ID_RE.test(pid || '')) throw new Error('no-id');
  if (!HEX16.test(nonce || '')) throw new Error('no-nonce');
  return '/pmm/settle#' + new URLSearchParams({ prove: '1', me, pid, n: nonce }).toString();
}
/** Read the settle page fragment. mode is 'pay' or 'prove'. */
export function parseSettleHash(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const get = (k, re) => (re.test(p.get(k) || '') ? p.get(k) : null);
  if (p.get('prove') === '1') {
    const out = { mode: 'prove', me: get('me', TZ1_RE), pid: get('pid', PMM_ID_RE), nonce: get('n', HEX16) };
    out.errors = ['me', 'pid', 'nonce'].filter((k) => !out[k]).map((k) => 'no-' + k);
    return out;
  }
  const out = {
    mode: 'pay', to: get('to', TZ1_RE), me: get('me', TZ1_RE), friend: get('f', HEX16), nonce: get('n', HEX16),
    note: (p.get('note') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60),
  };
  out.errors = ['to', 'me', 'friend', 'nonce'].filter((k) => !out[k]).map((k) => 'no-' + k);
  return out;
}
/**
 * The settle page's gate, run at load AND again right before the transfer: SEND only for a settle
 * this browser's PMM is waiting on (friend, both proven addresses, the same unused nonce, in time).
 */
export function pendingSettleFor(req, pmmState, now = Date.now()) {
  if (!req || req.mode !== 'pay' || req.errors?.length) return { ok: false, reason: 'bad-link' };
  const friends = Array.isArray(pmmState?.friends) ? pmmState.friends : [];
  const f = friends.find((x) => typeof x?.id === 'string' && x.id.startsWith(req.friend));
  if (!f) return { ok: false, reason: 'not-a-friend' };
  if (f.xtz !== req.to || f.xtzProven !== req.to) return { ok: false, reason: 'not-their-address' };
  const me = pmmState?.me || {};
  if (me.tzAddr !== req.me || me.xtzProof?.addr !== req.me) return { ok: false, reason: 'not-your-address' };
  const s = f.settling;
  if (!s || s.used || s.nonce !== req.nonce || s.to !== req.to) return { ok: false, reason: 'no-pending-settle' };
  if (!(now - (Number(s.at) || 0) < SETTLE_TTL_MS)) return { ok: false, reason: 'expired' };
  return { ok: true, name: typeof f.name === 'string' ? f.name : 'FRIEND' };
}
/** The settle page's gate in prove mode: PMM is waiting on a proof for this address and id. */
export function pendingProofFor(req, pmmState, now = Date.now()) {
  if (!req || req.mode !== 'prove' || req.errors?.length) return { ok: false, reason: 'bad-link' };
  const me = pmmState?.me || {}, p = me.proving;
  if (me.id !== req.pid || me.tzAddr !== req.me) return { ok: false, reason: 'not-your-address' };
  if (!p || p.nonce !== req.nonce || p.addr !== req.me || !(now - (Number(p.at) || 0) < SETTLE_TTL_MS)) return { ok: false, reason: 'no-pending-proof' };
  return { ok: true };
}

/** The settle page → PMM after a send. */
export function returnLink({ opHash, friend, mutez, to, from, nonce }) {
  if (!OP_RE.test(opHash || '')) throw new Error('bad-op');
  if (!TZ1_RE.test(from || '')) throw new Error('bad-payer');
  if (!TZ1_RE.test(to || '')) throw new Error('bad-payee');
  if (!validMutez(mutez)) throw new Error('bad-amount');
  if (!HEX16.test(friend || '') || !HEX16.test(nonce || '')) throw new Error('bad-pending');
  return '/pmm/#' + new URLSearchParams({ settled: opHash, mutez: String(mutez), to, from, f: friend, n: nonce }).toString();
}
export function parseReturn(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const op = p.get('settled') || '', to = p.get('to') || '', from = p.get('from') || '', mutez = Number(p.get('mutez'));
  const friend = p.get('f') || '', nonce = p.get('n') || '';
  if (!OP_RE.test(op) || !TZ1_RE.test(to) || !TZ1_RE.test(from) || !validMutez(mutez) || !HEX16.test(friend) || !HEX16.test(nonce)) return null;
  return { op, to, from, mutez, friend, nonce };
}
/** The settle page → PMM after a proof: the address, key, signature and its time. */
export function provedLink({ addr, pk, sig, at, nonce }) {
  return '/pmm/#' + new URLSearchParams({ proved: addr, pk, sig, at, n: nonce }).toString();
}
export function parseProved(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const addr = p.get('proved') || '', pk = p.get('pk') || '', sig = p.get('sig') || '', at = p.get('at') || '', nonce = p.get('n') || '';
  if (!TZ1_RE.test(addr) || !/^edpk[1-9A-HJ-NP-Za-km-z]{50}$/.test(pk) || !/^(edsig|sig)[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(sig) || !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(at) || !HEX16.test(nonce)) return null;
  return { addr, pk, sig, at, nonce };
}
/** A BroadcastChannel post is only for this tab if this tab started it (holds the nonce in memory). */
export function ownedNonce(hereNonces, h) {
  const m = typeof h === 'string' && /(?:^|&)n=([0-9a-f]{16})(?:&|$)/.exec(h);
  return m && hereNonces && hereNonces.has(m[1]) ? m[1] : null;
}

// ---------- addresses ----------

/**
 * A friend's hello names an address. Keep it only when it is a tz1, not my own address and not
 * another friend's; `proofOk` is tezos-proof.js's verdict on the proof that came with it.
 * Returns the fields to set on the friend.
 */
export function peerAddress(friend, { xtz, proofOk, myAddr, otherAddrs = [], now }) {
  const clean = TZ1_RE.test(xtz || '') && xtz !== myAddr && !otherAddrs.includes(xtz) ? xtz : '';
  const out = { xtz: clean, xtzProven: clean && proofOk ? clean : '' };
  out.xtzAt = clean !== (friend.xtz || '') ? now : (Number(friend.xtzAt) || now);
  return out;
}

// ---------- records and tabs ----------

const isOpen = (x) => !x.settled && !x.pending;
export const openTabIds = (f) => (f.ledger || []).filter(isOpen).map((x) => x.id);
export function markPending(f, ids, op) { (f.ledger || []).forEach((x) => { if (ids.includes(x.id) && !x.settled) x.pending = op; }); }
export function unmarkPending(f, op) { (f.ledger || []).forEach((x) => { if (x.pending === op) delete x.pending; }); }
export function closeTabs(f, ids, op) {
  const c = (f.ledger || []).filter((x) => ids.includes(x.id) && !x.settled);
  c.forEach((x) => { x.settled = true; x.settledBy = op; delete x.pending; });
  return c;
}
/** The newest record for an op (and id, when given) matching a predicate. */
export function findRecord(f, op, { id, mine, states } = {}) {
  const list = f.paid || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const r = list[i];
    if (r.op !== op || (id && r.id !== id) || (mine !== undefined && Boolean(r.mine) !== mine) || (states && !states.includes(r.state))) continue;
    return r;
  }
  return null;
}
const DONE = ['failed', 'declined', 'released', 'cancelled'];
/** Every op counted or still open anywhere on this phone; ended ones may be claimed again. */
export const liveOps = (friends) => new Set(friends.flatMap((x) => (x.paid || []).filter((p) => !DONE.includes(p.state)).map((p) => p.op)));

// ---------- the payer's side ----------

/** SETTLE pressed. Both addresses must be proven. A second press within the TTL reuses the nonce. */
export function onSettlePress(f, { myAddr, myProven, now, since, nonce }) {
  if (!TZ1_RE.test(myAddr || '') || myProven !== myAddr) return { ok: false, reason: 'prove-yours' };
  if (!TZ1_RE.test(f.xtz || '') || f.xtzProven !== f.xtz) return { ok: false, reason: 'unproven-friend' };
  const s = f.settling;
  if (s && !s.used && s.to === f.xtz && now - (Number(s.at) || 0) < SETTLE_TTL_MS) return { ok: true, nonce: s.nonce, tabs: s.tabs, reused: true };
  const tabs = openTabIds(f).slice(-MAX_TABS);
  if (!tabs.length) return { ok: false, reason: 'no-open-tabs' };
  f.settling = { nonce, to: f.xtz, tabs, ts: Number(since) || now, at: now, used: false };
  return { ok: true, nonce, tabs, reused: false };
}
/** A send came back. Accept it only for this phone's pending settle, then record the claim. */
export function onReturn(f, r, { myAddr, myProven, now, id, liveOpsSet }) {
  if (!r) return { ok: false, reason: 'bad-link' };
  const s = f.settling;
  if (!s || s.used || !HEX16.test(s.nonce || '') || r.nonce !== s.nonce) return { ok: false, reason: 'no-pending-settle' };
  if (r.to !== s.to || r.to !== f.xtz || f.xtzProven !== f.xtz) return { ok: false, reason: 'wrong-payee' };
  if (!TZ1_RE.test(myAddr || '') || r.from !== myAddr || myProven !== myAddr) return { ok: false, reason: 'wrong-payer' };
  if (liveOpsSet && liveOpsSet.has(r.op)) return { ok: false, reason: 'known-op' };
  const tabs = (s.tabs || []).filter((t) => openTabIds(f).includes(t));
  if (!tabs.length) return { ok: false, reason: 'no-open-tabs' };
  s.used = true;
  const newest = Math.max(0, ...(f.ledger || []).filter((x) => tabs.includes(x.id)).map((x) => Number(x.ts) || 0));
  const record = { id, op: r.op, tabs, to: r.to, from: r.from, mutez: r.mutez, since: s.ts, notBefore: Math.max(Number(s.ts) || 0, newest) - SKEW_MS, state: 'checking', mine: true, acked: false, at: now };
  (f.paid = f.paid || []).push(record);
  markPending(f, tabs, r.op);
  return { ok: true, record };
}
/** The payee answered my claim. Only a paid-ok closes my tabs. */
export function onAnswer(f, kind, op, { reason = '' } = {}) {
  const record = findRecord(f, op, { mine: true, states: ['checking', 'confirmed', 'unconfirmed', 'cancelled'] });
  if (!record) return { ok: false };
  if (kind === 'paid-ok') { const closed = closeTabs(f, record.tabs, op); record.state = 'ok'; return { ok: true, record, closed }; }
  record.state = 'declined'; record.why = String(reason || '').slice(0, 40); unmarkPending(f, op);
  return { ok: true, record, closed: [] };
}
export function onAck(f, id) { const r = (f.paid || []).find((x) => x.mine && x.id === id); if (r) r.acked = true; return Boolean(r); }
/** CANCEL my own claim when it is unconfirmed, or unacked or stale while checking. Reopens, closes nothing. */
export const canCancel = (r, now) => Boolean(r && r.mine && (r.state === 'unconfirmed' || (r.state === 'checking' && (!r.acked || now - (Number(r.at) || 0) > STALE_MS))));
export function onCancel(f, record, { now }) {
  if (!canCancel(record, now)) return { ok: false };
  record.state = 'cancelled'; unmarkPending(f, record.op);
  return { ok: true };
}

// ---------- the payee's side ----------

/**
 * A signed 'paid' claim arrived (signature checked by app.js). Refusals come back with a reason
 * the payee sends to the payer in a signed paid-no. A repeat of a known claim id is a re-ack.
 */
export function onClaim(f, claim, { myId, myAddr, now, liveOpsSet }) {
  const dup = (f.paid || []).find((x) => !x.mine && x.id === claim?.id);
  if (dup) return { ok: true, dup: true, record: dup };
  const j = judgeClaim({ claim, friend: f, myId, myAddr, seenOps: liveOpsSet });
  if (!j.ok) return j;
  const record = { id: claim.id, op: j.op, tabs: j.tabs, to: j.to, from: j.from, mutez: j.mutez, since: j.since, notBefore: j.notBefore, state: 'checking', mine: false, at: now };
  (f.paid = f.paid || []).push(record);
  markPending(f, j.tabs, j.op);
  return { ok: true, record };
}
/** ACCEPT / NOT ENOUGH on an awaiting claim; RELEASE on an unconfirmed or stale one. */
export const canRelease = (r, now) => Boolean(r && !r.mine && (r.state === 'unconfirmed' || (r.state === 'checking' && now - (Number(r.at) || 0) > STALE_MS)));
export function onDecide(f, record, act, { now }) {
  if (!record || record.mine) return { ok: false };
  if (act === 'accept' && record.state === 'awaiting') { const closed = closeTabs(f, record.tabs, record.op); record.state = 'ok'; return { ok: true, wire: 'paid-ok', closed }; }
  if (act === 'decline' && record.state === 'awaiting') { record.state = 'declined'; unmarkPending(f, record.op); return { ok: true, wire: 'paid-no', reason: 'not-enough' }; }
  if (act === 'release' && canRelease(record, now)) { record.state = 'released'; unmarkPending(f, record.op); return { ok: true, wire: 'paid-no', reason: 'released' }; }
  return { ok: false };
}
/** The payer cancelled. */
export function onCancelled(f, op) {
  const record = findRecord(f, op, { mine: false, states: ['checking', 'awaiting', 'unconfirmed'] });
  if (!record) return { ok: false };
  record.state = 'cancelled'; unmarkPending(f, op);
  return { ok: true, record };
}

// ---------- both sides ----------

/** A chain lookup finished. Moves the record along; never closes a tab. */
export function onChain(f, record, v, { tries = 0 } = {}) {
  if (!record || record.state !== 'checking') return { ok: false };
  if (v.ok) { record.state = record.mine ? 'confirmed' : 'awaiting'; record.chain = { from: v.from, mutez: v.mutez, level: v.level, time: v.time || null }; return { ok: true, state: record.state }; }
  if (v.reason === 'offline' || v.reason === 'not-found') {
    if (tries < MAX_CHAIN_TRIES) return { ok: true, state: 'checking', retry: true };
    record.state = 'unconfirmed'; return { ok: true, state: 'unconfirmed' };
  }
  record.state = 'failed'; record.why = v.reason; unmarkPending(f, record.op);
  return { ok: true, state: 'failed', reason: v.reason };
}

/** The claim text: "<op> <tab>,<tab>… <since ms>". */
export const claimText = ({ op, tabs, since }) => `${op} ${tabs.join(',')} ${since}`;
export function parseClaimText(text) {
  const parts = String(text || '').split(' ');
  if (parts.length !== 3) return null;
  const [op, list, sinceStr] = parts, tabs = list.split(',').filter(Boolean), since = Number(sinceStr);
  if (!OP_RE.test(op) || !tabs.length || tabs.length > MAX_TABS || !tabs.every((t) => TAB_ID_RE.test(t)) || new Set(tabs).size !== tabs.length) return null;
  if (!Number.isSafeInteger(since) || since <= 0) return null;
  return { op, tabs, since };
}
/** The payee's checks on a claim before any chain lookup. */
export function judgeClaim({ claim, friend, myId, myAddr, seenOps }) {
  if (!claim || claim.to !== myId) return { ok: false, reason: 'not-for-me' };
  if (!TZ1_RE.test(myAddr || '') || claim.note !== myAddr) return { ok: false, reason: 'not-my-address' };
  if (!friend || !TZ1_RE.test(claim.dir || '') || claim.dir === myAddr || friend.xtz !== claim.dir || friend.xtzProven !== claim.dir) return { ok: false, reason: 'unproven-payer' };
  if (!validMutez(claim.amount)) return { ok: false, reason: 'bad-amount' };
  const c = parseClaimText(claim.text);
  if (!c) return { ok: false, reason: 'bad-claim' };
  if (seenOps && seenOps.has(c.op)) return { ok: false, reason: 'replay' };
  if (Number(friend.xtzAt) > c.since + SKEW_MS) return { ok: false, reason: 'address-changed' };
  const ledger = friend.ledger || [];
  const named = c.tabs.map((t) => ledger.find((x) => x.id === t));
  if (named.some((x) => !x || x.settled || x.pending)) return { ok: false, reason: 'tabs-not-open' };
  if (c.since > (Number(claim.ts) || 0) + SKEW_MS) return { ok: false, reason: 'from-the-future' };
  const notBefore = Math.max(c.since, ...named.map((x) => Number(x.ts) || 0)) - SKEW_MS;
  return { ok: true, op: c.op, tabs: c.tabs, since: c.since, notBefore, mutez: claim.amount, from: claim.dir, to: claim.note };
}
/**
 * Judge a TzKT /v1/operations/transactions/{hash} answer. The applied rows from `from` to `to`,
 * made no earlier than `notBefore`, must add up to `mutez`. Both `from` and `notBefore` are required.
 */
export function judgeTransfer(tzktRows, { to, mutez, from, notBefore }) {
  if (!TZ_RE.test(from || '') || !TZ_RE.test(to || '') || !(Number(notBefore) > 0) || !validMutez(mutez)) return { ok: false, reason: 'bad-claim' };
  if (!Array.isArray(tzktRows) || !tzktRows.length) return { ok: false, reason: 'not-found' };
  const toPayee = tzktRows.filter((r) => r && r.target && r.target.address === to);
  if (!toPayee.length) return { ok: false, reason: 'wrong-payee' };
  const hits = toPayee.filter((r) => r.sender && r.sender.address === from);
  if (!hits.length) return { ok: false, reason: 'wrong-payer' };
  const applied = hits.filter((r) => r.status === 'applied');
  if (!applied.length) return { ok: false, reason: 'not-applied' };
  if (applied.some((r) => !(Date.parse(r.timestamp) >= notBefore))) return { ok: false, reason: 'too-old' };
  const paid = applied.reduce((n, r) => n + (Number.isSafeInteger(r.amount) ? r.amount : 0), 0);
  if (paid < mutez) return { ok: false, reason: 'short', paid };
  return { ok: true, from, mutez: paid, level: applied[0].level ?? null, time: applied[0].timestamp || null };
}

export const TZKT = 'https://api.tzkt.io/v1/';
async function tzktGet(path, fetchImpl, timeoutMs) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try { return await fetchImpl(TZKT + path, { cache: 'no-store', signal: ctrl?.signal }); }
  finally { if (timer) clearTimeout(timer); }
}
/** Ask TzKT about one operation and judge it. Never throws; a failure or timeout is 'offline'. */
export async function verifyOnChain(op, claim, fetchImpl = globalThis.fetch, timeoutMs = 10_000) {
  if (!OP_RE.test(op || '')) return { ok: false, reason: 'bad-op' };
  try {
    const r = await tzktGet('operations/transactions/' + op + '?select=target,sender,amount,status,level,timestamp', fetchImpl, timeoutMs);
    if (!r.ok) return { ok: false, reason: r.status === 404 ? 'not-found' : 'offline' };
    return judgeTransfer(await r.json(), claim);
  } catch (_) {
    return { ok: false, reason: 'offline' };
  }
}
/** Chain time now (TzKT head), so the settle time does not depend on this phone's clock. Null on failure. */
export async function chainNow(fetchImpl = globalThis.fetch, timeoutMs = 4000) {
  try {
    const r = await tzktGet('head', fetchImpl, timeoutMs); if (!r.ok) return null;
    const t = Date.parse((await r.json())?.timestamp); return Number.isFinite(t) ? t : null;
  } catch (_) { return null; }
}
