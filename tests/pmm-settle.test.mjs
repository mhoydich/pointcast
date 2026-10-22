import test from 'node:test';
import assert from 'node:assert/strict';
import { toMutez, formatTez, parseSettleHash, returnLink, judgeTransfer, settleLink, parseReturn, verifyOnChain, TZKT, TZ_RE, OP_RE } from '../public/pmm/settle.js';

const TZ = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const TZ2 = 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6';
const OP = 'oo' + '1'.repeat(49);

test('toMutez accepts up to six decimals, either separator, and refuses the rest', () => {
  assert.equal(toMutez('1'), 1_000_000);
  assert.equal(toMutez('1.5'), 1_500_000);
  assert.equal(toMutez('0,000001'), 1);
  assert.equal(toMutez('12.345678'), 12_345_678);
  for (const bad of ['', '0', '0.0', '-1', '1e3', '1.0000001', '1001', 'NaN', '1.2.3', ' ', null, undefined, '0x10']) assert.equal(toMutez(bad), null, String(bad));
  assert.equal(toMutez('1000'), 1_000_000_000);
});

test('formatTez is the inverse of toMutez', () => {
  for (const s of ['1', '1.5', '0.000001', '12.345678', '1000']) assert.equal(formatTez(toMutez(s)), s);
});

test('parseSettleHash validates the payee, the amount, the note and the friend link', () => {
  const ok = parseSettleHash(`#to=${TZ}&tez=2.5&note=tacos&f=0123456789abcdef&me=${TZ2}`);
  assert.deepEqual(ok, { to: TZ, mutez: 2_500_000, note: 'tacos', friend: '0123456789abcdef', me: TZ2, errors: [] });
  assert.equal(parseSettleHash(`#to=${TZ}&me=nope`).me, null);
  assert.deepEqual(parseSettleHash('#to=KT1notapayee&tez=1').errors, ['no-payee']);
  assert.deepEqual(parseSettleHash(`#to=${TZ}&tez=-3`).errors, ['bad-amount']);
  assert.equal(parseSettleHash(`#to=${TZ}`).mutez, null, 'amount may be left for the payer to type');
  assert.equal(parseSettleHash(`#to=${TZ}&note=${'x'.repeat(200)}%0a<b>`).note.length, 60);
  assert.equal(parseSettleHash(`#to=${TZ}&f=../../etc`).friend, null);
});

test('returnLink only carries a real operation hash back into PMM', () => {
  assert.equal(returnLink({ opHash: OP, friend: '0123456789abcdef', mutez: 5, to: TZ, from: TZ2 }), `/pmm/#settled=${OP}&mutez=5&to=${TZ}&from=${TZ2}&f=0123456789abcdef`);
  assert.throws(() => returnLink({ opHash: 'javascript:alert(1)', mutez: 1, to: TZ, from: TZ2 }));
  assert.throws(() => returnLink({ opHash: OP, mutez: 1, to: TZ }), /bad-payer/, 'the payer address is required');
  assert.ok(OP_RE.test(OP) && TZ_RE.test(TZ));
});

test('judgeTransfer checks payee, status and amount across a batch', () => {
  const row = (target, amount, status = 'applied') => ({ target: { address: target }, sender: { address: TZ2 }, amount, status, level: 9 });
  assert.deepEqual(judgeTransfer([row(TZ, 2_000_000)], { to: TZ, mutez: 2_000_000 }), { ok: true, from: TZ2, mutez: 2_000_000, level: 9 });
  assert.deepEqual(judgeTransfer([], { to: TZ, mutez: 1 }), { ok: false, reason: 'not-found' });
  assert.equal(judgeTransfer([row(TZ2, 9e9)], { to: TZ, mutez: 1 }).reason, 'wrong-payee');
  assert.equal(judgeTransfer([row(TZ, 9e9, 'failed')], { to: TZ, mutez: 1 }).reason, 'not-applied');
  assert.deepEqual(judgeTransfer([row(TZ, 1_000_000)], { to: TZ, mutez: 2_000_000 }), { ok: false, reason: 'short', paid: 1_000_000 });
  assert.equal(judgeTransfer([row(TZ, 9e6)], { to: TZ, mutez: 1, from: TZ2 }).ok, true, 'the claimed payer sent it');
  assert.equal(judgeTransfer([row(TZ, 9e6)], { to: TZ, mutez: 1, from: TZ }).reason, 'wrong-payer', 'someone else\'s transfer to the payee does not count');
  const mixed = [{ ...row(TZ, 1_000_000), sender: { address: TZ } }, row(TZ, 1_000_000)];
  assert.equal(judgeTransfer(mixed, { to: TZ, mutez: 2_000_000, from: TZ2 }).reason, 'short', 'only the claimed payer\'s rows add up');
  assert.equal(judgeTransfer([row(TZ, 1_000_000), row(TZ, 1_000_000)], { to: TZ, mutez: 2_000_000 }).ok, true, 'a batch paying in two parts adds up');
  assert.equal(judgeTransfer({ not: 'an array' }, { to: TZ, mutez: 1 }).reason, 'not-found');
});

test('settleLink and parseReturn are the two ends of the round trip through /pmm/settle', () => {
  assert.equal(settleLink({ to: TZ, note: 'tacos', friend: '0123456789abcdef', me: TZ2 }), `/pmm/settle#to=${TZ}&me=${TZ2}&note=tacos&f=0123456789abcdef`);
  assert.throws(() => settleLink({ to: 'KT1nope', me: TZ2 }));
  assert.throws(() => settleLink({ to: TZ }), /no-payer/, 'you must have shared your own address');
  const back = returnLink({ opHash: OP, friend: '0123456789abcdef', mutez: 2_500_000, to: TZ, from: TZ2 });
  assert.deepEqual(parseReturn(back.split('#')[1]), { op: OP, to: TZ, from: TZ2, mutez: 2_500_000, friend: '0123456789abcdef' });
  assert.equal(parseReturn(`settled=${OP}&mutez=1&to=${TZ}`), null, 'a return without the payer is refused');
  for (const bad of [`settled=nope&mutez=1&to=${TZ}&from=${TZ2}`, `settled=${OP}&mutez=0&to=${TZ}&from=${TZ2}`, `settled=${OP}&mutez=1&to=KT1x&from=${TZ2}`, `settled=${OP}&mutez=1e99&to=${TZ}&from=${TZ2}`, '']) assert.equal(parseReturn(bad), null, bad);
});

test('verifyOnChain asks TzKT for the one operation and never throws', async () => {
  const seen = [];
  const answer = (status, body) => async (url) => { seen.push(url); return { ok: status === 200, status, json: async () => body }; };
  const rows = [{ target: { address: TZ }, sender: { address: TZ2 }, amount: 3_000_000, status: 'applied', level: 7 }];
  assert.deepEqual(await verifyOnChain(OP, { to: TZ, mutez: 3_000_000 }, answer(200, rows)), { ok: true, from: TZ2, mutez: 3_000_000, level: 7 });
  assert.ok(seen[0].startsWith(TZKT + OP));
  assert.equal((await verifyOnChain(OP, { to: TZ, mutez: 1 }, answer(404, null))).reason, 'not-found');
  assert.equal((await verifyOnChain(OP, { to: TZ, mutez: 1 }, answer(502, null))).reason, 'offline');
  assert.equal((await verifyOnChain(OP, { to: TZ, mutez: 1 }, async () => { throw new Error('down'); })).reason, 'offline');
  assert.equal((await verifyOnChain('../../x', { to: TZ, mutez: 1 }, answer(200, rows))).reason, 'bad-op');
});
