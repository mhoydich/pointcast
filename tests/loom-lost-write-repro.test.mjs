import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLoom, MAX_OPS } from '../src/lib/loom/service.mjs';
import { addressKey } from '../src/lib/loom/address.mjs';

// Diagnostic assertions intentionally describe the current bug, not a desired invariant.
// When room writes become atomic, invert the loss assertions and retain this schedule.
test('diagnostic: two accepted concurrent appends overwrite one another below the cap', { timeout: 2000 }, async () => {
  const address = '#lost-write-reproduction';
  const key = 'loom:log:' + await addressKey(address);
  const data = new Map();
  let armed = false, reads = 0, release;
  const barrier = new Promise(resolve => { release = resolve; });
  const kv = {
    async get(k) {
      const snapshot = data.get(k) ?? null;
      if (armed && k === key && reads < 2) {
        reads++;
        if (reads === 2) release();
        await barrier;
      }
      return snapshot;
    },
    async put(k, v) { data.set(k, v); },
  };
  const options = { kv, firstHelloEnabled: false, clock: () => new Date('2026-11-14T05:00:00Z') };
  const post = (body, name) => handleLoom(new Request('https://pointcast.xyz/api/loom', {
    method: 'POST', body: JSON.stringify({ to: address, from: { name, kind: 'agent' }, body }),
  }), options);
  assert.equal((await post('Initial room note.', 'Initial desk')).status, 201);
  armed = true;
  const responses = await Promise.all([post('First concurrent note.', 'Desk A'), post('Second concurrent note.', 'Desk B')]);
  assert.deepEqual(responses.map(r => r.status), [201, 201]);
  const accepted = await Promise.all(responses.map(r => r.json()));
  assert.notEqual(accepted[0].message.id, accepted[1].message.id);
  assert.equal(accepted[0].message.seq, accepted[1].message.seq);
  const saved = JSON.parse(data.get(key));
  assert.equal(saved.trimmedBefore, undefined);
  assert.ok(saved.ops.length < MAX_OPS);
  assert.equal(accepted.filter(a => saved.ops.some(o => o.id === a.message.id)).length, 1);
  assert.equal(saved.ops.length, 2); // seed + one winner, although both appends returned 201
});
