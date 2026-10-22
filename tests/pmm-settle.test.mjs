import test from 'node:test';
import assert from 'node:assert/strict';
import { toMutez, formatTez, parseSettleHash, returnLink, judgeTransfer, TZ_RE, OP_RE } from '../src/lib/pmm-settle-core.mjs';

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
  const ok = parseSettleHash(`#to=${TZ}&tez=2.5&note=tacos&f=0123456789abcdef`);
  assert.deepEqual(ok, { to: TZ, mutez: 2_500_000, note: 'tacos', friend: '0123456789abcdef', errors: [] });
  assert.deepEqual(parseSettleHash('#to=KT1notapayee&tez=1').errors, ['no-payee']);
  assert.deepEqual(parseSettleHash(`#to=${TZ}&tez=-3`).errors, ['bad-amount']);
  assert.equal(parseSettleHash(`#to=${TZ}`).mutez, null, 'amount may be left for the payer to type');
  assert.equal(parseSettleHash(`#to=${TZ}&note=${'x'.repeat(200)}%0a<b>`).note.length, 60);
  assert.equal(parseSettleHash(`#to=${TZ}&f=../../etc`).friend, null);
});

test('returnLink only carries a real operation hash back into PMM', () => {
  assert.equal(returnLink({ opHash: OP, friend: '0123456789abcdef', mutez: 5, to: TZ }), `/pmm/#settled=${OP}&mutez=5&to=${TZ}&f=0123456789abcdef`);
  assert.throws(() => returnLink({ opHash: 'javascript:alert(1)', mutez: 1, to: TZ }));
  assert.ok(OP_RE.test(OP) && TZ_RE.test(TZ));
});

test('judgeTransfer checks payee, status and amount across a batch', () => {
  const row = (target, amount, status = 'applied') => ({ target: { address: target }, sender: { address: TZ2 }, amount, status, level: 9 });
  assert.deepEqual(judgeTransfer([row(TZ, 2_000_000)], { to: TZ, mutez: 2_000_000 }), { ok: true, from: TZ2, mutez: 2_000_000, level: 9 });
  assert.deepEqual(judgeTransfer([], { to: TZ, mutez: 1 }), { ok: false, reason: 'not-found' });
  assert.equal(judgeTransfer([row(TZ2, 9e9)], { to: TZ, mutez: 1 }).reason, 'wrong-payee');
  assert.equal(judgeTransfer([row(TZ, 9e9, 'failed')], { to: TZ, mutez: 1 }).reason, 'not-applied');
  assert.deepEqual(judgeTransfer([row(TZ, 1_000_000)], { to: TZ, mutez: 2_000_000 }), { ok: false, reason: 'short', paid: 1_000_000 });
  assert.equal(judgeTransfer([row(TZ, 1_000_000), row(TZ, 1_000_000)], { to: TZ, mutez: 2_000_000 }).ok, true, 'a batch paying in two parts adds up');
  assert.equal(judgeTransfer({ not: 'an array' }, { to: TZ, mutez: 1 }).reason, 'not-found');
});
