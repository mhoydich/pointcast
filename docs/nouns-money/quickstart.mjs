// Run from the PointCast checkout with Node 24:
// node docs/nouns-money/quickstart.mjs
// Local memory only. No requests, real funds, wallet, or chain operations.
import assert from 'node:assert/strict';
import { NounsMoneySandbox, MemorySandboxStore } from '../../packages/nouns-money-sdk/src/index.ts';

const sandbox = new NounsMoneySandbox(new MemorySandboxStore());
const intent = await sandbox.createIntent(
  { label: 'Two-note art demo', noteCount: 2, mode: 'test' },
  { idempotencyKey: 'quickstart:create:001' },
);
const retry = await sandbox.createIntent(
  { label: 'Two-note art demo', noteCount: 2, mode: 'test' },
  { idempotencyKey: 'quickstart:create:001' },
);
assert.equal(retry.id, intent.id);
assert.equal(intent.status, 'requires_notes');

const confirmed = await sandbox.confirmIntent(
  intent.id,
  { noteIds: ['nm100-000', 'nm100-001'], mode: 'test' },
  { idempotencyKey: 'quickstart:confirm:001' },
);
const confirmedAgain = await sandbox.confirmIntent(
  intent.id,
  { noteIds: ['nm100-001', 'nm100-000'], mode: 'test' },
  { idempotencyKey: 'quickstart:confirm:002' },
);
assert.equal(confirmed.status, 'succeeded');
assert.equal(confirmedAgain.receipt.id, confirmed.receipt.id);
assert.equal((await sandbox.retrieveIntent(intent.id)).receipt.id, confirmed.receipt.id);

const cancelable = await sandbox.createIntent(
  { label: 'Cancel example', noteCount: 1, mode: 'test' },
  { idempotencyKey: 'quickstart:create:002' },
);
const canceled = await sandbox.cancelIntent(cancelable.id, { idempotencyKey: 'quickstart:cancel:001' });
assert.equal(canceled.status, 'canceled');
await assert.rejects(
  sandbox.confirmIntent(canceled.id, { noteIds: ['nm100-000'], mode: 'test' }, { idempotencyKey: 'quickstart:confirm:003' }),
  error => error.code === 'invalid_state',
);
console.log(JSON.stringify({ mode: 'test', intent: confirmed, canceled: canceled.id, checks: 'passed' }, null, 2));
