import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleLoom } from '../src/lib/loom/service.mjs';

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const post = (kv, body) => handleLoom(new Request('https://pointcast.xyz/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { kv });
const req = (path) => new Request(`https://pointcast.xyz${path}`);

test('classic incremental reads request only new messages and retain the operations', async () => {
  const source = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
  const query = source.match(/fetch\((`\$\{API\}\?to=.*?`), full/)[1];
  const path = new Function('API', 'address', 'full', 'seq', 'return ' + query);
  const kv = memoryKv();
  for (const body of ['first', 'second']) {
    await post(kv, { to: '#poll-check', from: { name: 'reader', kind: 'human' }, body });
  }
  const initial = await (await handleLoom(req(path('/api/loom', '#poll-check', true, 0)), { kv })).json();
  assert.deepEqual(initial.messages.filter((m) => m.from.kind !== 'robot').map((m) => m.body), ['first', 'second']);
  const update = await (await handleLoom(req(path('/api/loom', '#poll-check', false, initial.seq - 1)), { kv })).json();
  assert.deepEqual(update.messages.map((m) => m.body), ['second']);
  assert.equal(update.ops.length, 1);
});
