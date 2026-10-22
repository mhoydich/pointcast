// PMM v0.4 settle: the pure decisions in public/pmm/settle.js. app.js and /pmm/settle only wire
// these to the DOM, the wallet and the data channel, so the attacks are tested here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMutez, formatTez, validMutez, newNonce, settleLink, parseSettleHash, pendingSettleFor, returnLink, parseReturn,
  acceptReturn, claimText, parseClaimText, judgeClaim, judgeTransfer, verifyOnChain, TZKT, TZ_RE, OP_RE, SKEW_MS,
} from '../public/pmm/settle.js';

const PAYEE = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const PAYER = 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6';
const STRANGER = 'tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx';
const OP = 'oo' + '1'.repeat(49), OP2 = 'oo' + '2'.repeat(49);
const FRIEND_ID = '0123456789abcdef' + 'ffff', PREFIX = '0123456789abcdef', NONCE = '00112233aabbccdd';
const T0 = Date.parse('2026-10-22T18:00:00Z');

test('mutez parsing: up to six decimals, either separator, more than 0, at most 1000 tez', () => {
  assert.equal(toMutez('1.5'), 1_500_000);
  assert.equal(toMutez('0,000001'), 1);
  for (const bad of ['', '0', '0.0', '-1', '1e3', '1.0000001', '1001', 'NaN', null]) assert.equal(toMutez(bad), null, String(bad));
  for (const s of ['1', '1.5', '0.000001', '12.345678', '1000']) assert.equal(formatTez(toMutez(s)), s);
  assert.equal(validMutez(0), false); assert.equal(validMutez(1.5), false); assert.equal(validMutez(-1), false); assert.equal(validMutez('5'), false);
});

test('nonces are 16 hex from the CSPRNG', () => {
  const a = newNonce(), b = newNonce();
  assert.match(a, /^[0-9a-f]{16}$/); assert.notEqual(a, b);
});

test('the settle link needs payee, payer, friend and nonce; the page reads them back and strips control characters', () => {
  const link = settleLink({ to: PAYEE, me: PAYER, friend: PREFIX, nonce: NONCE, note: 'tacos' });
  assert.equal(link, `/pmm/settle#to=${PAYEE}&me=${PAYER}&f=${PREFIX}&n=${NONCE}&note=tacos`);
  assert.throws(() => settleLink({ to: PAYEE, me: PAYER, friend: PREFIX }), /no-nonce/);
  assert.throws(() => settleLink({ to: 'KT1x', me: PAYER, friend: PREFIX, nonce: NONCE }), /no-payee/);
  assert.deepEqual(parseSettleHash(link.split('#')[1]), { to: PAYEE, me: PAYER, friend: PREFIX, nonce: NONCE, note: 'tacos', errors: [] });
  // Control characters first and last, so the assertion fails if the sanitiser is removed.
  assert.equal(parseSettleHash(`to=${PAYEE}&note=%0atacos%07`).note, 'tacos');
  assert.deepEqual(parseSettleHash('').errors, ['no-to', 'no-me', 'no-friend', 'no-nonce']);
  assert.equal('tez' in parseSettleHash(`to=${PAYEE}&tez=999`), false, 'no amount prefill');
});

test('the settle page only enables SEND for a settle PMM is waiting on', () => {
  const req = parseSettleHash(settleLink({ to: PAYEE, me: PAYER, friend: PREFIX, nonce: NONCE }).split('#')[1]);
  const saved = { me: { tzAddr: PAYER }, friends: [{ id: FRIEND_ID, name: 'BOB', xtz: PAYEE, settling: { nonce: NONCE, to: PAYEE, tabs: ['t1'], ts: T0 } }] };
  assert.deepEqual(pendingSettleFor(req, saved), { ok: true, name: 'BOB' });
  assert.equal(pendingSettleFor({ ...req, to: STRANGER }, saved).reason, 'not-their-address', 'an arbitrary payee is refused');
  assert.equal(pendingSettleFor(req, { ...saved, friends: [{ ...saved.friends[0], settling: { ...saved.friends[0].settling, nonce: 'ffffffffffffffff' } }] }).reason, 'no-pending-settle');
  assert.equal(pendingSettleFor(req, { ...saved, friends: [{ ...saved.friends[0], settling: undefined }] }).reason, 'no-pending-settle');
  assert.equal(pendingSettleFor(req, { ...saved, me: { tzAddr: STRANGER } }).reason, 'not-your-address');
  assert.equal(pendingSettleFor(req, { me: {}, friends: [] }).reason, 'not-a-friend');
  assert.equal(pendingSettleFor(req, null).reason, 'not-a-friend');
  assert.equal(pendingSettleFor(parseSettleHash(''), saved).reason, 'bad-link');
});

test('return links round-trip, and malformed ones are refused', () => {
  const back = returnLink({ opHash: OP, friend: PREFIX, mutez: 2_500_000, to: PAYEE, from: PAYER, nonce: NONCE });
  assert.deepEqual(parseReturn(back.split('#')[1]), { op: OP, to: PAYEE, from: PAYER, mutez: 2_500_000, friend: PREFIX, nonce: NONCE });
  assert.throws(() => returnLink({ opHash: 'javascript:alert(1)', friend: PREFIX, mutez: 1, to: PAYEE, from: PAYER, nonce: NONCE }));
  assert.throws(() => returnLink({ opHash: OP, friend: PREFIX, mutez: 0, to: PAYEE, from: PAYER, nonce: NONCE }), /bad-amount/);
  for (const bad of [`settled=${OP}&mutez=1&to=${PAYEE}&from=${PAYER}&f=${PREFIX}`, `settled=${OP}&mutez=0&to=${PAYEE}&from=${PAYER}&f=${PREFIX}&n=${NONCE}`, `settled=${OP}&mutez=1.5&to=${PAYEE}&from=${PAYER}&f=${PREFIX}&n=${NONCE}`, '']) assert.equal(parseReturn(bad), null, bad);
});

const friendWith = (over = {}) => ({
  id: FRIEND_ID, name: 'BOB', xtz: PAYEE,
  ledger: [{ id: 't1', amount: 12.5, ts: T0 - 60_000 }, { id: 't2', amount: 3, ts: T0 - 30_000 }],
  settling: { nonce: NONCE, to: PAYEE, tabs: ['t1', 't2'], ts: T0 },
  ...over,
});
const ret = (over = {}) => ({ op: OP, to: PAYEE, from: PAYER, mutez: 2_500_000, friend: PREFIX, nonce: NONCE, ...over });

test('acceptReturn: only the settle this phone started, to the shared payee, from my shared address', () => {
  assert.deepEqual(acceptReturn(ret(), friendWith(), PAYER), { ok: true, tabs: ['t1', 't2'], since: T0 });
  assert.equal(acceptReturn(ret({ nonce: 'ffffffffffffffff' }), friendWith(), PAYER).reason, 'no-pending-settle', 'a crafted link without the nonce');
  assert.equal(acceptReturn(ret(), friendWith({ settling: undefined }), PAYER).reason, 'no-pending-settle', 'nothing pending');
  assert.equal(acceptReturn(ret({ to: STRANGER }), friendWith(), PAYER).reason, 'wrong-payee');
  assert.equal(acceptReturn(ret(), friendWith({ xtz: STRANGER }), PAYER).reason, 'wrong-payee', 'the friend changed address since');
  assert.equal(acceptReturn(ret({ from: STRANGER }), friendWith(), PAYER).reason, 'wrong-payer');
  assert.equal(acceptReturn(null, friendWith(), PAYER).reason, 'bad-link');
  const later = friendWith({ ledger: [{ id: 't1', amount: 12.5, ts: T0, settled: true }, { id: 't2', amount: 3, ts: T0, pending: OP2 }, { id: 't3', amount: 9, ts: T0 + 1 }] });
  assert.equal(acceptReturn(ret(), later, PAYER).reason, 'no-open-tabs', 'a tab added after SETTLE (t3) is never swept in');
});

test('claim text carries the op, the exact tabs and the settle time', () => {
  const text = claimText({ op: OP, tabs: ['t1', 't2'], since: T0 });
  assert.deepEqual(parseClaimText(text), { op: OP, tabs: ['t1', 't2'], since: T0 });
  for (const bad of [`${OP} t1`, `${OP} t1,t1 ${T0}`, `${OP}  ${T0}`, `nope t1 ${T0}`, `${OP} T1! ${T0}`, `${OP} t1 -5`, `${OP} ${Array.from({ length: 51 }, (_, i) => 't' + i).join(',')} ${T0}`]) assert.equal(parseClaimText(bad), null, bad);
});

const payee = (over = {}) => ({ id: 'f'.repeat(64), name: 'ALICE', xtz: PAYER, ledger: [{ id: 't1', amount: 12.5, ts: T0 - 60_000 }, { id: 't2', amount: 3, ts: T0 - 30_000 }], ...over });
const claim = (over = {}) => ({ to: 'me', note: PAYEE, dir: PAYER, amount: 2_500_000, text: claimText({ op: OP, tabs: ['t1', 't2'], since: T0 }), ts: T0 + 90_000, ...over });
const judge = (c, f = payee(), seen = new Set()) => judgeClaim({ claim: c, friend: f, myId: 'me', myAddr: PAYEE, seenOps: seen });

test('judgeClaim: a good claim gives what to look up and the earliest the transfer may be', () => {
  const j = judge(claim());
  assert.equal(j.ok, true);
  assert.deepEqual([j.op, j.tabs, j.mutez, j.from, j.to], [OP, ['t1', 't2'], 2_500_000, PAYER, PAYEE]);
  assert.equal(j.notBefore, T0 - SKEW_MS, 'not before the SETTLE press');
});

test('judgeClaim refuses replay, strangers, zero or fractional amounts, closed or unknown tabs, and odd times', () => {
  assert.equal(judge(claim(), payee(), new Set([OP])).reason, 'replay', 'an op already counted or pending on this phone');
  assert.equal(judge(claim({ dir: STRANGER })).reason, 'unshared-payer', 'paid from an address they never shared');
  assert.equal(judge(claim(), payee({ xtz: '' })).reason, 'unshared-payer');
  assert.equal(judge(claim({ note: STRANGER })).reason, 'not-my-address');
  assert.equal(judge(claim({ to: 'someone-else' })).reason, 'not-for-me');
  for (const amount of [0, -1, 1.5, '2500000', 1e12]) assert.equal(judge(claim({ amount })).reason, 'bad-amount', String(amount));
  assert.equal(judge(claim({ text: claimText({ op: OP, tabs: ['t9'], since: T0 }) })).reason, 'tabs-not-open', 'a tab this phone does not have');
  assert.equal(judge(claim(), payee({ ledger: [{ id: 't1', amount: 12.5, ts: T0, settled: true }, { id: 't2', amount: 3, ts: T0 }] })).reason, 'tabs-not-open', 'an already settled tab');
  assert.equal(judge(claim(), payee({ ledger: [{ id: 't1', amount: 12.5, ts: T0, pending: OP2 }, { id: 't2', amount: 3, ts: T0 }] })).reason, 'tabs-not-open', 'a tab pending another payment');
  assert.equal(judge(claim({ ts: T0 - 10 * SKEW_MS })).reason, 'from-the-future', 'a settle time after the claim itself');
  assert.equal(judge(claim({ text: 'garbage' })).reason, 'bad-claim');
});

test('judgeClaim binds freshness to the newest named tab even if the payer backdates the settle time', () => {
  const f = payee({ ledger: [{ id: 't1', amount: 12.5, ts: T0 + 3_600_000 }] });
  const j = judge(claim({ text: claimText({ op: OP, tabs: ['t1'], since: 1 }), ts: T0 + 3_700_000 }), f);
  assert.equal(j.notBefore, T0 + 3_600_000 - SKEW_MS);
});

const row = (over = {}) => ({ target: { address: PAYEE }, sender: { address: PAYER }, amount: 2_500_000, status: 'applied', level: 9, timestamp: new Date(T0 + 30_000).toISOString(), ...over });

test('judgeTransfer: payee, payer, status, amount and age', () => {
  const claimed = { to: PAYEE, mutez: 2_500_000, from: PAYER, notBefore: T0 - SKEW_MS };
  assert.deepEqual(judgeTransfer([row()], claimed), { ok: true, from: PAYER, mutez: 2_500_000, level: 9 });
  assert.equal(judgeTransfer([], claimed).reason, 'not-found');
  assert.equal(judgeTransfer([row({ target: { address: STRANGER } })], claimed).reason, 'wrong-payee');
  assert.equal(judgeTransfer([row({ sender: { address: STRANGER } })], claimed).reason, 'wrong-payer', "a stranger's transfer to the payee");
  assert.equal(judgeTransfer([row({ status: 'failed' })], claimed).reason, 'not-applied');
  assert.equal(judgeTransfer([row({ timestamp: '2026-01-01T00:00:00Z' })], claimed).reason, 'too-old', 'an old real transfer from the payer, e.g. a gift months ago');
  assert.equal(judgeTransfer([row({ timestamp: undefined })], claimed).reason, 'too-old', 'no timestamp counts as too old');
  assert.deepEqual(judgeTransfer([row({ amount: 1_000_000 })], claimed), { ok: false, reason: 'short', paid: 1_000_000 });
  assert.equal(judgeTransfer([row({ amount: 1_250_000 }), row({ amount: 1_250_000 })], claimed).ok, true, 'a batch paying in two parts adds up');
  assert.equal(judgeTransfer([row({ amount: 1_250_000 }), row({ amount: 1_250_000, sender: { address: STRANGER } })], claimed).reason, 'short', "only the payer's rows count");
});

test('verifyOnChain asks TzKT for the one operation with its timestamp, times out, and never throws', async () => {
  const seen = [];
  const answer = (status, body) => async (url, init) => { seen.push([url, init]); return { ok: status === 200, status, json: async () => body }; };
  const claimed = { to: PAYEE, mutez: 2_500_000, from: PAYER, notBefore: T0 - SKEW_MS };
  assert.equal((await verifyOnChain(OP, claimed, answer(200, [row()]))).ok, true);
  assert.ok(seen[0][0].startsWith(TZKT + OP) && seen[0][0].includes('timestamp'));
  assert.ok(seen[0][1].signal, 'the fetch carries an abort signal');
  assert.equal((await verifyOnChain(OP, claimed, answer(404, null))).reason, 'not-found');
  assert.equal((await verifyOnChain(OP, claimed, answer(502, null))).reason, 'offline');
  assert.equal((await verifyOnChain(OP, claimed, async () => { throw new Error('down'); })).reason, 'offline');
  const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  assert.equal((await verifyOnChain(OP, claimed, hang, 20)).reason, 'offline', 'a hung TzKT times out');
  assert.equal((await verifyOnChain('../../x', claimed, answer(200, [row()]))).reason, 'bad-op');
  assert.ok(TZ_RE.test(PAYEE) && OP_RE.test(OP));
});
