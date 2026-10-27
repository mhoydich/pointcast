import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptView } from '../public/chain/receipt/model.mjs';
const h = 'a'.repeat(64);
test('reads pending, missing, rejected, and included without promising finality', () => {
  assert.equal(receiptView(h, null, 9).state, 'not-found');
  assert.equal(receiptView(h, {status:'unknown'}, 9).state, 'not-found');
  assert.equal(receiptView(h, {status:'pending'}, 9).state, 'pending');
  assert.equal(receiptView(h, {status:'rejected',reason:'bad nonce'}, 9).reason, 'bad nonce');
  const v = receiptView(h, {status:'included',height:8,receipt:{tx_hash:h,kind:'transfer'}}, 10);
  assert.equal(v.since, 2); assert.match(v.detail, /not an independently verified proof/);
});
test('rejects malformed input and inconsistent node responses', () => {
  assert.throws(() => receiptView('a', null, 9));
  assert.throws(() => receiptView(h, {status:'included',height:8,receipt:{tx_hash:'b'.repeat(64)}}, 10));
  assert.throws(() => receiptView(h, {status:'included',height:11,receipt:{tx_hash:h}}, 10));
  assert.throws(() => receiptView(h, {status:'mystery'}, 10));
});
