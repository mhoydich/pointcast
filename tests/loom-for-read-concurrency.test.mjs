import assert from 'node:assert/strict';
import test from 'node:test';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { addressKey } from '../src/lib/loom/address.mjs';

const NOW = new Date('2026-11-18T12:00:00Z');
export async function fixture() {
  const data = new Map(), index = [], own = [];
  for (let i = 0; i < 85; i++) {
    const address = i === 0 ? '@mike' : '#room' + i, key = await addressKey(address);
    const at = new Date(NOW.getTime() - i * 1000).toISOString();
    const from = { name: 'Desk' + (i % 35), address: '@desk' + (i % 35), kind: 'agent' };
    const id = 'm_fixture' + i;
    data.set('loom:log:' + key, JSON.stringify({ address, key, label: address,
      ops: [{ op: 'append', seq: 1, id, at, from, kind: 'question', body: 'NEEDS MIKE · decision ' + i }] }));
    index.push({ key, updatedAt: at }); own.push({ key });
    const outkey = 'loom:out:' + await addressKey(from.address);
    if (!data.has(outkey)) data.set(outkey, JSON.stringify([{ id, at, key, to: address, body: 'first post' }]));
  }
  data.set('loom:index', JSON.stringify(index));
  data.set('loom:out:' + await addressKey('@mike'), JSON.stringify(own));
  return data;
}
export function delayedKv(data, failKey = '') {
  let active = 0, peak = 0; const reads = [];
  return {
    reads, get peak() { return peak; },
    async get(key) {
      reads.push(key); peak = Math.max(peak, ++active);
      // Completion order differs from input order to catch race-dependent sorting.
      const delay = 2 + key.charCodeAt(key.length - 1) % 5;
      try {
        await new Promise(resolve => setTimeout(resolve, delay));
        if (key === failKey) throw new Error('fixture read failure');
        return data.get(key) ?? null;
      } finally { active--; }
    },
    async put() { throw new Error('GET must not write'); },
  };
}
export async function request(kv, handler = handleLoom) {
  return (await handler(new Request('https://pointcast.xyz/api/loom?for=mike&format=json'),
    { kv, clock: () => NOW })).json();
}
test('For You overlaps reads at most six ways and preserves scan caps and ordering', async () => {
  const kv = delayedKv(await fixture()), result = await request(kv);
  assert.equal(result.ok, true);
  assert.equal(result.scanned.logs, 80);
  assert.equal(kv.reads.filter(k => k.startsWith('loom:log:')).length, 80);
  assert.equal(kv.reads.filter(k => k.startsWith('loom:out:')).length, 31); // owner plus 30 senders
  assert.ok(kv.peak > 1); assert.ok(kv.peak <= 6);
  assert.equal(result.piles.needsYes.length, 25);
  assert.deepEqual(result.piles.needsYes.map(x => x.id), Array.from({ length:25 }, (_,i) => 'm_fixture' + i));
  const again = await request(delayedKv(await fixture()));
  assert.deepEqual(result, again);
});
test('missing and failed reads retain fallback behavior without rejecting the feed', async () => {
  const data = await fixture(), missing = 'loom:log:' + await addressKey('#room1');
  data.delete(missing);
  const kv = delayedKv(data, 'loom:log:' + await addressKey('#room2'));
  const result = await request(kv);
  assert.equal(result.ok, true); assert.equal(result.scanned.logs, 78);
  assert.ok(!result.piles.needsYes.some(x => ['m_fixture1','m_fixture2'].includes(x.id)));
  assert.ok(kv.peak <= 6);
});
test('no KV still returns an empty public feed', async () => {
  const result = await request(null);
  assert.equal(result.ok,true);assert.equal(result.scanned.logs,0);
});
