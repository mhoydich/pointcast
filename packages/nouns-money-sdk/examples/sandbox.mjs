// Node 24+: node packages/nouns-money-sdk/examples/sandbox.mjs
// Runs locally in memory. It sends no requests and moves no funds.
import { MemorySandboxStore, NounsMoneySandbox } from '../src/index.ts';
const sandbox = new NounsMoneySandbox(new MemorySandboxStore());
const intent = await sandbox.createIntent(
  { label: 'Example studio demo', noteCount: 2, mode: 'test' },
  { idempotencyKey: 'example-create-0001' },
);
const result = await sandbox.confirmIntent(
  intent.id,
  { noteIds: ['nm100-000', 'nm100-042'], mode: 'test' },
  { idempotencyKey: 'example-confirm-0001' },
);
console.log(JSON.stringify({ localSandbox: true, fundsMoved: false, intent: result }, null, 2));
