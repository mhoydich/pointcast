import test from 'node:test';
import assert from 'node:assert/strict';
import { addressKey } from '../src/lib/loom/address.mjs';
import { serveHearthActivity } from '../src/lib/loom/hearth-activity.mjs';
import { readHearthLedger, LEDGER_ROOMS } from '../src/lib/loom/hearth-ledger.mjs';

const NOW = Date.parse('2026-11-25T19:00:00Z');

async function fixture() {
  let now = NOW;
  const records = new Map(), entries = new Map();
  const stats = { reads: 0, hits: 0, puts: 0 };
  for (const room of LEDGER_ROOMS) records.set('loom:log:' + await addressKey(room), {
    address: room, key: await addressKey(room), createdAt: new Date(NOW - 5000).toISOString(),
    trimmedBefore: room === '#officenoun-tasks' ? 1 : null,
    ops: [{ op: 'append', seq: 1, id: 'report', at: new Date(NOW - 1000).toISOString(),
      from: { name: 'Astra', address: '@astra', kind: 'agent', operator: 'Mike' },
      kind: 'note', body: room === '#efficiency' ? 'Actual ~140k tokens.' : 'Retained author metadata.' }],
  });
  const kv = {
    // The Loom handler reads stored JSON text; count room reads only.
    async get(key) { if (key.startsWith('loom:log:')) stats.reads++; const value = records.get(key); return value ? JSON.stringify(value) : null; },
    async put() { assert.fail('Ledger reads must not write Loom storage'); },
    async delete() { assert.fail('Ledger reads must not delete Loom storage'); },
  };
  const cache = {
    async match(request) {
      assert.equal(request.method, 'GET');
      assert.equal([...request.headers].length, 0);
      const entry = entries.get(request.url);
      if (!entry || now >= entry.expires) return undefined;
      stats.hits++;
      return new Response(entry.body, entry.init);
    },
    async put(request, response) {
      assert.equal(response.headers.get('cache-control'), 'public, max-age=0, s-maxage=60');
      stats.puts++;
      entries.set(request.url, { body: await response.text(), expires: now + 60000,
        init: { status: response.status, headers: [...response.headers] } });
    },
  };
  const bodies = [];
  async function request(path, options = {}) {
    const url = new URL(path, 'https://pointcast.xyz');
    if (url.pathname === '/api/loom') return Response.json({ ok: true, kvBound: true,
      logs: LEDGER_ROOMS.map(address => ({ address, kind: 'topic' })) });
    const response = await serveHearthActivity(new Request(url, options), kv, now, { cache });
    bodies.push(await response.clone().text());
    return response;
  }
  return { records, entries, cache, stats, bodies, request, kv, advance(ms) { now = NOW + ms; },
    read() { return readHearthLedger({ request, now: NOW }); } };
}

test('ledger batch cache keeps reports and partial history for 60s without new room reads or KV writes', async () => {
  const f = await fixture();
  const first = await f.read();
  assert.equal(first.rows[0].handle, 'mike');
  assert.equal(first.rows[0].lent.tokens, 140000);
  assert.equal(first.rows[0].lent.approximate, true);
  assert.deepEqual(first.trimmed, ['#officenoun-tasks']);
  assert.equal(first.incomplete, true);
  assert.equal(f.stats.reads, 3);
  assert.equal(f.stats.puts, 1);
  f.advance(59999);
  assert.deepEqual(await f.read(), first);
  assert.equal(f.stats.reads, 3);
  assert.equal(f.stats.hits, 1);
  assert.equal(f.bodies[0], f.bodies[1]);
  f.advance(60000);
  assert.deepEqual(await f.read(), first);
  assert.equal(f.stats.reads, 6);
  assert.equal(f.stats.puts, 2);
});

test('ledger cache normalizes room addresses but stays separate from person and activity reads', async () => {
  const f = await fixture();
  const first = await f.request('/api/loom-hearth?ledger=1&room=%23EFFICIENCY');
  const again = await f.request('/api/loom-hearth?room=%23efficiency&room=%23EFFICIENCY&noise=1&ledger=1', {
    headers: { range: 'bytes=0-5', 'if-none-match': 'anything' },
  });
  assert.equal(await again.text(), await first.text());
  assert.equal(f.stats.reads, 1);
  const person = await f.request('/api/loom-hearth?room=%23efficiency&person=other');
  assert.deepEqual((await person.json()).rooms[0].messages, []);
  assert.equal(f.stats.reads, 2);
  const activity = await f.request('/api/loom-hearth?room=%23efficiency');
  assert.equal(activity.headers.get('cache-control'), 'public, max-age=30');
  assert.equal(f.stats.reads, 3);
  for (const query of ['ledger=0&room=%23efficiency', 'ledger=1&person=mike&room=%23efficiency',
    'ledger=1&room=%23unrelated', 'ledger=1']) {
    assert.equal((await f.request('/api/loom-hearth?' + query)).status, 400);
  }
  assert.equal(f.stats.reads, 3);
});

test('unavailable ledger batches are never cached and recover on retry', async () => {
  const f = await fixture();
  const key = 'loom:log:' + await addressKey('#officenoun-tasks');
  const saved = f.records.get(key);
  f.records.delete(key);
  const partial = await f.read();
  assert.deepEqual(partial.unavailable, ['#officenoun-tasks']);
  assert.equal(partial.incomplete, true);
  assert.equal(f.stats.puts, 0);
  f.records.set(key, saved);
  const recovered = await f.read();
  assert.deepEqual(recovered.unavailable, []);
  assert.deepEqual(recovered.trimmed, ['#officenoun-tasks']);
  assert.equal(f.stats.reads, 6);
  assert.equal(f.stats.puts, 1);
});

test('cache failures and runtimes without a cache still return ledger reports', async () => {
  const f = await fixture();
  f.cache.match = async () => { throw new Error('cache offline'); };
  f.cache.put = async () => { throw new Error('cache offline'); };
  const first = await f.read();
  assert.deepEqual(await f.read(), first);
  assert.equal(f.stats.reads, 6);
  const response = await serveHearthActivity(new Request('https://pointcast.xyz/api/loom-hearth?ledger=1&room=%23efficiency'), f.kv, NOW);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).rooms[0].messages[0].body, 'Actual ~140k tokens.');
});
