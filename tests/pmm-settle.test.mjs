// PMM v0.4 settle: every decision and state transition in public/pmm/settle.js. app.js only wires
// these to the screen, the wallet page and the data channel, so the attacks are tested here.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../public/pmm/settle.js';

const PAYEE = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb', PAYER = 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6', STRANGER = 'tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx';
const KT1 = 'KT1' + 'A'.repeat(33), TZ2 = 'tz2' + 'A'.repeat(33);
const OP = 'oo' + '1'.repeat(49), OP2 = 'oo' + '2'.repeat(49);
const ME_ID = 'ab'.repeat(32), BOB_ID = '0123456789abcdef' + 'cd'.repeat(24), PREFIX = '0123456789abcdef', N = '00112233aabbccdd';
const T0 = Date.parse('2026-10-23T02:00:00Z');

// Alice (payer) holds Bob as a friend; Bob (payee) holds Alice.
const bobOnAlice = (o = {}) => ({ id: BOB_ID, name: 'BOB', xtz: PAYEE, xtzProven: PAYEE, xtzAt: T0 - 3_600_000, ledger: [{ id: 't1', amount: 12.5, ts: T0 - 60_000 }, { id: 't2', amount: 3, ts: T0 - 30_000 }], ...o });
const aliceOnBob = (o = {}) => ({ id: ME_ID, name: 'ALICE', xtz: PAYER, xtzProven: PAYER, xtzAt: T0 - 3_600_000, ledger: [{ id: 't1', amount: 12.5, ts: T0 - 60_000 }, { id: 't2', amount: 3, ts: T0 - 30_000 }], ...o });
const press = (f, o = {}) => S.onSettlePress(f, { myAddr: PAYER, myProven: PAYER, now: T0, since: T0, nonce: N, ...o });
const ret = (o = {}) => ({ op: OP, to: PAYEE, from: PAYER, mutez: 2_500_000, friend: PREFIX, nonce: N, ...o });
const back = (f, r = ret(), o = {}) => S.onReturn(f, r, { myAddr: PAYER, myProven: PAYER, now: T0 + 60_000, id: 'c1', liveOpsSet: new Set(), ...o });
const claimOf = (o = {}) => ({ id: 'c1', to: ME_ID, note: PAYEE, dir: PAYER, amount: 2_500_000, text: S.claimText({ op: OP, tabs: ['t1', 't2'], since: T0 }), ts: T0 + 60_000, ...o });
const receive = (f, c = claimOf(), o = {}) => S.onClaim(f, c, { myId: ME_ID, myAddr: PAYEE, now: T0 + 61_000, liveOpsSet: new Set(), ...o });
const states = (f) => (f.ledger || []).map((x) => `${x.id}:${x.settled ? 'settled' : x.pending ? 'pending' : 'open'}`).join(' ');
const chainOk = { ok: true, from: PAYER, mutez: 2_500_000, level: 9, time: '2026-10-23T02:00:30Z' };

test('mutez, nonces and formatting', () => {
  assert.equal(S.toMutez('1.5'), 1_500_000); assert.equal(S.toMutez('0,000001'), 1);
  for (const bad of ['', '0', '-1', '1e3', '1.0000001', '1001', null]) assert.equal(S.toMutez(bad), null, String(bad));
  for (const v of [0, 1.5, -1, '5', 1e12]) assert.equal(S.validMutez(v), false, String(v));
  for (const s of ['1', '1.5', '0.000001', '1000']) assert.equal(S.formatTez(S.toMutez(s)), s);
  let called = 0;
  const n = S.newNonce({ getRandomValues: (b) => { called++; b.fill(171); return b; } });
  assert.equal(called, 1, 'the CSPRNG stub is what fills the nonce'); assert.equal(n, 'ab'.repeat(8));
  assert.match(S.newNonce(), /^[0-9a-f]{16}$/);
});

test('links: tz1 only, every part required, the page reads them back and strips control characters', () => {
  const link = S.settleLink({ to: PAYEE, me: PAYER, friend: PREFIX, nonce: N, note: 'tacos' });
  assert.equal(link, `/pmm/settle#to=${PAYEE}&me=${PAYER}&f=${PREFIX}&n=${N}&note=tacos`);
  assert.deepEqual(S.parseSettleHash(link.split('#')[1]), { mode: 'pay', to: PAYEE, me: PAYER, friend: PREFIX, nonce: N, note: 'tacos', errors: [] });
  for (const to of [KT1, TZ2, 'tz1short']) assert.throws(() => S.settleLink({ to, me: PAYER, friend: PREFIX, nonce: N }), /no-payee/, to);
  assert.throws(() => S.settleLink({ to: PAYEE, me: PAYER, friend: PREFIX }), /no-nonce/);
  assert.equal(S.parseSettleHash(`to=${PAYEE}&note=%0atacos%07`).note, 'tacos', 'control characters first and last');
  assert.equal('tez' in S.parseSettleHash(`to=${PAYEE}&tez=9`), false, 'no amount prefill');
  const prove = S.proveLink({ me: PAYER, pid: ME_ID, nonce: N });
  assert.deepEqual(S.parseSettleHash(prove.split('#')[1]), { mode: 'prove', me: PAYER, pid: ME_ID, nonce: N, errors: [] });
  const r = S.returnLink({ opHash: OP, friend: PREFIX, mutez: 2_500_000, to: PAYEE, from: PAYER, nonce: N });
  assert.deepEqual(S.parseReturn(r.split('#')[1]), ret());
  assert.equal(S.parseReturn(`settled=${'o' + '1'.repeat(45) + '/1234'}&mutez=1&to=${PAYEE}&from=${PAYER}&f=${PREFIX}&n=${N}`), null, 'a 51-char op with a slash');
  for (const bad of [`settled=${OP}&mutez=1&to=${PAYEE}&from=${PAYER}&f=${PREFIX}`, `settled=${OP}&mutez=0&to=${PAYEE}&from=${PAYER}&f=${PREFIX}&n=${N}`, `settled=${OP}&mutez=1&to=${KT1}&from=${PAYER}&f=${PREFIX}&n=${N}`]) assert.equal(S.parseReturn(bad), null, bad);
});

test('the send page gate: friend, both proven addresses, the same unused nonce, in time', () => {
  const req = S.parseSettleHash(S.settleLink({ to: PAYEE, me: PAYER, friend: PREFIX, nonce: N }).split('#')[1]);
  const f = bobOnAlice(); press(f);
  const st = { me: { id: ME_ID, tzAddr: PAYER, xtzProof: { addr: PAYER } }, friends: [f] };
  assert.deepEqual(S.pendingSettleFor(req, st, T0 + 1), { ok: true, name: 'BOB' });
  assert.equal(S.pendingSettleFor({ ...req, to: STRANGER }, st, T0).reason, 'not-their-address', 'an arbitrary payee');
  assert.equal(S.pendingSettleFor(req, { ...st, friends: [{ ...f, xtzProven: '' }] }, T0).reason, 'not-their-address', 'an unproven friend address');
  assert.equal(S.pendingSettleFor(req, { ...st, me: { ...st.me, xtzProof: null } }, T0).reason, 'not-your-address', 'my address not proven');
  assert.equal(S.pendingSettleFor(req, { ...st, friends: [{ ...f, settling: { ...f.settling, nonce: 'ffffffffffffffff' } }] }, T0).reason, 'no-pending-settle', 'superseded nonce');
  assert.equal(S.pendingSettleFor(req, { ...st, friends: [{ ...f, settling: { ...f.settling, used: true } }] }, T0).reason, 'no-pending-settle', 'already consumed');
  assert.equal(S.pendingSettleFor(req, st, T0 + S.SETTLE_TTL_MS + 1).reason, 'expired');
  assert.equal(S.pendingSettleFor(req, null, T0).reason, 'not-a-friend');
  const preq = S.parseSettleHash(S.proveLink({ me: PAYER, pid: ME_ID, nonce: N }).split('#')[1]);
  assert.deepEqual(S.pendingProofFor(preq, { me: { id: ME_ID, tzAddr: PAYER, proving: { nonce: N, addr: PAYER, at: T0 } } }, T0 + 1), { ok: true });
  assert.equal(S.pendingProofFor(preq, { me: { id: ME_ID, tzAddr: PAYER } }, T0).reason, 'no-pending-proof');
  assert.equal(S.pendingProofFor(preq, { me: { id: 'ff'.repeat(32), tzAddr: PAYER, proving: { nonce: N, addr: PAYER, at: T0 } } }, T0).reason, 'not-your-address');
});

test('a friend address is kept only as a proven tz1 that is neither mine nor another friend\'s', () => {
  const f = { xtz: '', xtzAt: 0 };
  assert.deepEqual(S.peerAddress(f, { xtz: PAYEE, proofOk: true, myAddr: PAYER, otherAddrs: [], now: T0 }), { xtz: PAYEE, xtzProven: PAYEE, xtzAt: T0 });
  assert.equal(S.peerAddress(f, { xtz: PAYEE, proofOk: false, myAddr: PAYER, now: T0 }).xtzProven, '', 'no proof, not proven');
  assert.equal(S.peerAddress(f, { xtz: PAYER, proofOk: true, myAddr: PAYER, now: T0 }).xtz, '', 'my own address');
  assert.equal(S.peerAddress(f, { xtz: PAYEE, proofOk: true, myAddr: PAYER, otherAddrs: [PAYEE], now: T0 }).xtz, '', "another friend's address");
  assert.equal(S.peerAddress(f, { xtz: TZ2, proofOk: true, myAddr: PAYER, now: T0 }).xtz, '', 'tz2 is not supported');
  assert.equal(S.peerAddress({ xtz: PAYEE, xtzAt: 5 }, { xtz: PAYEE, proofOk: true, myAddr: PAYER, now: T0 }).xtzAt, 5, 'unchanged keeps its time');
});

test('SETTLE needs both proven addresses and reuses an outstanding nonce', () => {
  assert.equal(press(bobOnAlice(), { myProven: '' }).reason, 'prove-yours');
  assert.equal(press(bobOnAlice({ xtzProven: '' })).reason, 'unproven-friend');
  assert.equal(press(bobOnAlice({ ledger: [{ id: 't1', amount: 1, settled: true }] })).reason, 'no-open-tabs');
  const f = bobOnAlice();
  assert.deepEqual(press(f), { ok: true, nonce: N, tabs: ['t1', 't2'], reused: false });
  assert.deepEqual(press(f, { nonce: 'ffffffffffffffff', now: T0 + 1000 }), { ok: true, nonce: N, tabs: ['t1', 't2'], reused: true }, 'a second press keeps the first page valid');
  assert.equal(press(f, { nonce: 'ffffffffffffffff', now: T0 + S.SETTLE_TTL_MS + 1 }).nonce, 'ffffffffffffffff', 'after the TTL a new nonce');
});

test('a return is accepted only for this phone\'s pending settle, once', () => {
  assert.equal(back(bobOnAlice(), ret()).reason, 'no-pending-settle', 'nothing pending: a crafted link signs nothing');
  let f = bobOnAlice(); press(f);
  assert.equal(back(f, ret({ nonce: 'ffffffffffffffff' })).reason, 'no-pending-settle');
  assert.equal(back(f, ret({ to: STRANGER })).reason, 'wrong-payee');
  assert.equal(back(f, ret({ from: STRANGER })).reason, 'wrong-payer');
  assert.equal(back(f, ret(), { myProven: '' }).reason, 'wrong-payer', 'my address no longer proven');
  assert.equal(back(f, ret(), { liveOpsSet: new Set([OP]) }).reason, 'known-op');
  assert.equal(back(f, null).reason, 'bad-link');
  const r = back(f);
  assert.equal(r.ok, true); assert.equal(r.record.notBefore, T0 - S.SKEW_MS); assert.equal(r.record.state, 'checking');
  assert.equal(states(f), 't1:pending t2:pending', 'tabs pending, not settled');
  assert.equal(back(f, ret({ op: OP2 })).reason, 'no-pending-settle', 'the nonce is consumed');
  f = bobOnAlice(); press(f); f.ledger.push({ id: 't3', amount: 9, ts: T0 + 1 });
  assert.deepEqual(back(f).record.tabs, ['t1', 't2'], 'a tab added after SETTLE is never swept in');
});

test('a claim whose earlier attempt failed or was declined may be made again', () => {
  const ops = S.liveOps([{ paid: [{ op: OP, state: 'failed' }, { op: OP2, state: 'declined' }] }]);
  assert.equal(ops.has(OP) || ops.has(OP2), false);
  assert.equal(S.liveOps([{ paid: [{ op: OP, state: 'awaiting' }] }]).has(OP), true);
});

test('judgeClaim refuses unproven or changed payers, replay, odd amounts, closed tabs and odd times', () => {
  const j = (c, f = aliceOnBob(), seen = new Set()) => S.judgeClaim({ claim: c, friend: f, myId: ME_ID, myAddr: PAYEE, seenOps: seen });
  assert.equal(j(claimOf()).ok, true);
  assert.equal(j(claimOf(), aliceOnBob({ xtzProven: '' })).reason, 'unproven-payer', 'an address that was named but never proven');
  assert.equal(j(claimOf(), aliceOnBob({ xtz: '', xtzProven: '' })).reason, 'unproven-payer');
  assert.equal(j(claimOf({ dir: '' }), aliceOnBob({ xtz: '', xtzProven: '' })).reason, 'unproven-payer', "payee xtz '' and claim dir ''");
  assert.equal(j(claimOf({ dir: STRANGER })).reason, 'unproven-payer');
  assert.equal(j(claimOf({ dir: PAYEE }), aliceOnBob({ xtz: PAYEE, xtzProven: PAYEE })).reason, 'unproven-payer', 'my own address as the payer');
  assert.equal(j(claimOf(), aliceOnBob({ xtzAt: T0 + 60 * 60_000 })).reason, 'address-changed', 'address changed after SETTLE');
  assert.equal(j(claimOf(), aliceOnBob(), new Set([OP])).reason, 'replay');
  assert.equal(j(claimOf({ note: STRANGER })).reason, 'not-my-address');
  assert.equal(j(claimOf({ to: 'x' })).reason, 'not-for-me');
  for (const amount of [0, -1, 1.5, '2500000', 1e12]) assert.equal(j(claimOf({ amount })).reason, 'bad-amount', String(amount));
  assert.equal(j(claimOf({ text: S.claimText({ op: OP, tabs: ['t9'], since: T0 }) })).reason, 'tabs-not-open');
  assert.equal(j(claimOf(), aliceOnBob({ ledger: [{ id: 't1', amount: 1, ts: T0, pending: OP2 }, { id: 't2', amount: 1, ts: T0 }] })).reason, 'tabs-not-open', 'a tab pending another claim');
  assert.equal(j(claimOf({ ts: T0 - 2 * S.SKEW_MS })).reason, 'from-the-future');
  const backdated = j(claimOf({ text: S.claimText({ op: OP, tabs: ['t1'], since: 1 }) }), aliceOnBob({ xtzAt: 0, ledger: [{ id: 't1', amount: 1, ts: T0 + 3_600_000 }] }));
  assert.equal(backdated.notBefore, T0 + 3_600_000 - S.SKEW_MS, 'a backdated settle time cannot reach before the newest tab');
});

const row = (o = {}) => ({ target: { address: PAYEE }, sender: { address: PAYER }, amount: 2_500_000, status: 'applied', level: 9, timestamp: '2026-10-23T02:00:30Z', ...o });
const claimed = { to: PAYEE, mutez: 2_500_000, from: PAYER, notBefore: T0 - S.SKEW_MS };

test('judgeTransfer requires payer and freshness, then checks payee, sender, status, age and amount', () => {
  assert.deepEqual(S.judgeTransfer([row()], claimed), { ok: true, from: PAYER, mutez: 2_500_000, level: 9, time: '2026-10-23T02:00:30Z' });
  assert.equal(S.judgeTransfer([row()], { ...claimed, from: '' }).reason, 'bad-claim', 'no payer: refused, never skipped');
  assert.equal(S.judgeTransfer([row()], { ...claimed, notBefore: 0 }).reason, 'bad-claim', 'no freshness bound: refused, never skipped');
  assert.equal(S.judgeTransfer([row()], { ...claimed, notBefore: undefined }).reason, 'bad-claim');
  assert.equal(S.judgeTransfer([row()], { ...claimed, mutez: 0 }).reason, 'bad-claim');
  assert.equal(S.judgeTransfer([], claimed).reason, 'not-found');
  assert.equal(S.judgeTransfer([row({ target: { address: STRANGER } })], claimed).reason, 'wrong-payee');
  assert.equal(S.judgeTransfer([row({ sender: { address: STRANGER } })], claimed).reason, 'wrong-payer', "a third party's transfer to the payee");
  assert.equal(S.judgeTransfer([row({ status: 'failed' })], claimed).reason, 'not-applied');
  assert.equal(S.judgeTransfer([row({ timestamp: '2026-01-01T00:00:00Z' })], claimed).reason, 'too-old', 'an old gift');
  assert.equal(S.judgeTransfer([row({ timestamp: undefined })], claimed).reason, 'too-old');
  assert.equal(S.judgeTransfer([row({ amount: 1_000_000 })], claimed).reason, 'short');
  assert.equal(S.judgeTransfer([row({ amount: 1_250_000 }), row({ amount: 1_250_000 })], claimed).ok, true);
  assert.equal(S.judgeTransfer([row({ amount: 1_250_000 }), row({ amount: 1_250_000, sender: { address: STRANGER } })], claimed).reason, 'short');
});

test('only the payee\'s ACCEPT, and the payer receiving it, close tabs', () => {
  // Payer side.
  const a = bobOnAlice(); press(a); const mine = back(a).record;
  S.onChain(a, mine, chainOk);
  assert.equal(mine.state, 'confirmed'); assert.equal(states(a), 't1:pending t2:pending', "the payer's own chain result closes nothing");
  // Payee side.
  const b = aliceOnBob(); const theirs = receive(b).record;
  assert.equal(states(b), 't1:pending t2:pending');
  S.onChain(b, theirs, chainOk);
  assert.equal(theirs.state, 'awaiting'); assert.equal(states(b), 't1:pending t2:pending', "the payee's chain result closes nothing");
  const d = S.onDecide(b, theirs, 'accept', { now: T0 });
  assert.equal(d.wire, 'paid-ok'); assert.equal(states(b), 't1:settled t2:settled', 'ACCEPT closes on the payee');
  const ans = S.onAnswer(a, 'paid-ok', OP);
  assert.equal(ans.ok, true); assert.equal(states(a), 't1:settled t2:settled', 'paid-ok closes on the payer');
});

test('NOT ENOUGH, a refusal, RELEASE and CANCEL reopen tabs and close nothing', () => {
  const a = bobOnAlice(); press(a); const mine = back(a).record; S.onChain(a, mine, chainOk);
  const b = aliceOnBob(); const theirs = receive(b).record; S.onChain(b, theirs, chainOk);
  const d = S.onDecide(b, theirs, 'decline', { now: T0 });
  assert.deepEqual([d.wire, d.reason], ['paid-no', 'not-enough']); assert.equal(states(b), 't1:open t2:open');
  S.onAnswer(a, 'paid-no', OP, { reason: 'not-enough' });
  assert.equal(states(a), 't1:open t2:open', 'paid-no never closes the payer\'s tabs'); assert.equal(mine.state, 'declined');
  // A refused claim: the payer gets a paid-no and reopens.
  const a2 = bobOnAlice(); press(a2); back(a2); S.onAnswer(a2, 'paid-no', OP, { reason: 'unproven-payer' });
  assert.equal(states(a2), 't1:open t2:open');
  // RELEASE: only once unconfirmed or stale.
  const b2 = aliceOnBob(); const r2 = receive(b2).record;
  assert.equal(S.onDecide(b2, r2, 'release', { now: T0 + 62_000 }).ok, false, 'not while freshly checking');
  assert.equal(S.onDecide(b2, r2, 'accept', { now: T0 }).ok, false, 'no ACCEPT before the chain confirms');
  const rel = S.onDecide(b2, r2, 'release', { now: T0 + 61_000 + S.STALE_MS + 1 });
  assert.deepEqual([rel.wire, rel.reason], ['paid-no', 'released']); assert.equal(states(b2), 't1:open t2:open');
  const b3 = aliceOnBob(); const r3 = receive(b3).record;
  for (let i = 1; i <= S.MAX_CHAIN_TRIES; i++) S.onChain(b3, r3, { ok: false, reason: 'not-found' }, { tries: i });
  assert.equal(r3.state, 'unconfirmed'); assert.equal(S.canRelease(r3, T0), true, 'unconfirmed can always be released');
  // CANCEL: the payer's own unacked or unconfirmed claim.
  const a3 = bobOnAlice(); press(a3); const m3 = back(a3).record;
  assert.equal(S.canCancel(m3, T0 + 61_000), true, 'unacked'); S.onAck(a3, 'c1');
  assert.equal(S.canCancel(m3, T0 + 61_000), false, 'acked and fresh');
  assert.equal(S.onCancel(a3, m3, { now: T0 + 60_000 + S.STALE_MS + 1 }).ok, true); assert.equal(states(a3), 't1:open t2:open');
  const b4 = aliceOnBob(); receive(b4); assert.equal(S.onCancelled(b4, OP).ok, true); assert.equal(states(b4), 't1:open t2:open');
});

test('chain results move records along and fail closed', () => {
  const b = aliceOnBob(); const r = receive(b).record;
  assert.deepEqual(S.onChain(b, r, { ok: false, reason: 'offline' }, { tries: 1 }), { ok: true, state: 'checking', retry: true });
  const f = S.onChain(b, r, { ok: false, reason: 'too-old' });
  assert.equal(f.state, 'failed'); assert.equal(states(b), 't1:open t2:open');
  assert.equal(S.onChain(b, r, chainOk).ok, false, 'a finished record does not move again');
  assert.equal(S.onDecide(b, r, 'accept', { now: T0 }).ok, false);
});

test('a repeated claim id is a re-ack, not a second record; lookups take the newest record', () => {
  const b = aliceOnBob(); receive(b);
  const again = receive(b);
  assert.equal(again.dup, true); assert.equal(b.paid.length, 1);
  b.paid.push({ ...b.paid[0], id: 'c2', state: 'awaiting' });
  assert.equal(S.findRecord(b, OP).id, 'c2'); assert.equal(S.findRecord(b, OP, { id: 'c1' }).id, 'c1');
});

test('a BroadcastChannel result is only for the tab that started it', () => {
  const here = new Set([N]);
  assert.equal(S.ownedNonce(here, `settled=${OP}&f=${PREFIX}&n=${N}`), N);
  assert.equal(S.ownedNonce(here, `settled=${OP}&f=${PREFIX}&n=ffffffffffffffff`), null);
  assert.equal(S.ownedNonce(new Set(), `settled=${OP}&n=${N}`), null);
  assert.equal(S.ownedNonce(here, null), null);
});

test('verifyOnChain and chainNow ask TzKT, time out, and never throw', async () => {
  const seen = [];
  const answer = (status, body) => async (url, init) => { seen.push([url, init]); return { ok: status === 200, status, json: async () => body }; };
  assert.equal((await S.verifyOnChain(OP, claimed, answer(200, [row()]))).ok, true);
  assert.ok(seen[0][0].startsWith(S.TZKT + 'operations/transactions/' + OP) && seen[0][0].includes('timestamp') && seen[0][1].signal);
  assert.equal((await S.verifyOnChain(OP, claimed, answer(404, null))).reason, 'not-found');
  assert.equal((await S.verifyOnChain(OP, claimed, answer(502, null))).reason, 'offline');
  assert.equal((await S.verifyOnChain(OP, claimed, async () => { throw new Error('down'); })).reason, 'offline');
  const hang = (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
  assert.equal((await S.verifyOnChain(OP, claimed, hang, 20)).reason, 'offline');
  assert.equal((await S.verifyOnChain('../../x', claimed, answer(200, [row()]))).reason, 'bad-op');
  assert.equal(await S.chainNow(answer(200, { timestamp: '2026-10-23T02:00:00Z' })), T0);
  assert.equal(await S.chainNow(async () => { throw new Error('down'); }), null);
});
