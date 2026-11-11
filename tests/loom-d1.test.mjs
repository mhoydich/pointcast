// The Loom on D1 (migrations/auth/0035_loom.sql), against a node:sqlite stand-in for D1 that
// applies the real migration and answers each call after a few milliseconds, so concurrent
// requests interleave the way they do on the edge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { d1Store, kvStore, loomStore } from '../src/lib/loom/store.mjs';

const MIGRATION = readFileSync(new URL('../migrations/auth/0035_loom.sql', import.meta.url), 'utf8');
const lag = () => new Promise((resolve) => setTimeout(resolve, 1 + Math.random() * 4));

/** The parts of the D1 binding the store uses: prepare/bind/first/all/run and a transactional batch. */
function fakeD1({ migrated = true } = {}) {
  const db = new DatabaseSync(':memory:');
  if (migrated) db.exec(MIGRATION);
  const prepare = (sql) => {
    let args = [];
    const stmt = {
      bind(...values) { args = values; return stmt; },
      exec() { return { results: db.prepare(sql).all(...args) }; },
      async first() { await lag(); return db.prepare(sql).get(...args) ?? null; },
      async all() { await lag(); return stmt.exec(); },
      async run() { await lag(); db.prepare(sql).run(...args); return {}; },
    };
    return stmt;
  };
  return {
    sqlite: db,
    prepare,
    async batch(statements) {
      await lag();
      db.exec('BEGIN');
      try { const results = statements.map((s) => s.exec()); db.exec('COMMIT'); return results; } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
}
function laggyKv() {
  const map = new Map();
  return { map, get: async (k) => { await lag(); return map.get(k) ?? null; }, put: async (k, v) => { await lag(); map.set(k, v); } };
}
const base = 'https://pointcast.xyz/api/loom';
const post = (store, body) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { store });
const get = async (store, query) => (await handleLoom(new Request(`${base}${query}`), { store })).json();
const rush = (store, n) => Promise.all(Array.from({ length: n }, (_, i) => post(store, { to: '#rush', from: { name: `P${i}`, kind: 'human' }, body: `message ${i}` })));

test('forty people appending to one thread at once all land, numbered 1 to 40', async () => {
  const store = d1Store(fakeD1());
  const results = await rush(store, 40);
  assert.deepEqual(results.map((r) => r.status), Array(40).fill(201));
  const log = await get(store, '?to=%23rush');
  assert.equal(log.storage, 'd1');
  assert.equal(log.count, 40);
  assert.deepEqual(log.ops.map((o) => o.seq), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.ok(!JSON.stringify(log).includes('tokenHash'));
  const directory = await get(store, '');
  assert.equal(directory.logs.find((e) => e.address === '#rush').count, 40, 'the directory cache only moves forward');
  assert.equal((await get(store, '?from=%40p7')).sent[0].body, 'message 7');
});

test('the same rush on v1 KV loses messages; that is the race D1 removes', async () => {
  const kv = laggyKv();
  await rush(kvStore(kv), 20);
  assert.ok((await get(kvStore(kv), '?to=%23rush')).count < 20);
});

test('threads, replies, ripple, the Collator, edits and outboxes behave as on KV', async () => {
  const store = d1Store(fakeD1());
  const made = await (await post(store, { to: 'https://pointcast.xyz/court', from: { name: 'Ana', kind: 'human' }, body: 'Dry courts, @sky? see https://pointcast.xyz/air', title: 'Courts' })).json();
  assert.deepEqual(made.reached.sort(), ['@sky', 'https://pointcast.xyz/air']);
  await post(store, { to: made.address, from: { name: 'Sky', kind: 'agent' }, body: 'Dry.' });
  const second = await (await post(store, { to: '#weather', from: { name: 'Ben', kind: 'human' }, body: 'also https://pointcast.xyz/air' })).json();
  const weather = await get(store, '?to=%23weather');
  assert.ok(weather.messages.some((m) => m.from.name === 'Collator' && m.parent === second.message.id), 'the Collator stitched the shared link');
  assert.equal((await post(store, { action: 'edit', to: made.address, token: made.editToken, body: 'Dry courts.' })).status, 200);
  const court = await get(store, `?to=${encodeURIComponent('https://pointcast.xyz/court')}`);
  assert.equal(court.log.title, 'Courts');
  assert.equal(court.messages[0].body, 'Dry courts.');
  assert.equal(court.messages[1].depth, 1);
  assert.equal((await get(store, '?to=%40sky')).messages[0].via.address, 'https://pointcast.xyz/court');
  const outbox = await get(store, '?from=%40ana');
  assert.deepEqual(outbox.sent.map((s) => s.to), ['https://pointcast.xyz/court'], 'echoes are not in the sender\'s outbox');
  const since = await get(store, `?to=${encodeURIComponent('https://pointcast.xyz/court')}&since=2`);
  assert.deepEqual(since.ops.map((o) => o.op), ['edit']);
  assert.equal((await (await post(store, { action: 'nope' })).json()).error, 'action_unknown');
});

test('a seed thread is written whole on its first append, then numbered after it', async () => {
  const store = d1Store(fakeD1());
  const before = await get(store, '?to=%23loom');
  await post(store, { to: '#loom', from: { name: 'A', kind: 'human' }, body: 'hello' });
  const after = await get(store, '?to=%23loom');
  assert.equal(after.seq, before.seq + 1);
  assert.equal(after.count, before.count + 1);
  assert.equal(after.log.title, before.log.title);
});

test('before the migration everything stays on KV; after it, KV threads are imported on their next write', async () => {
  const db = fakeD1({ migrated: false });
  const kv = laggyKv();
  const store = loomStore({ db, kv });
  const first = await (await post(store, { to: '#old', from: { name: 'Ana', kind: 'human' }, body: 'written before the migration' })).json();
  assert.ok(kv.map.has(`loom:log:${first.address.slice(5, 29)}`), 'the write went to KV');
  assert.equal((await get(store, '?to=%23old')).count, 1);

  db.sqlite.exec(MIGRATION);
  assert.equal((await get(store, '?to=%23old')).count, 1, 'KV is still read before the thread has a D1 row');
  await post(store, { to: first.address, from: { name: 'Ben', kind: 'human' }, body: 'written after' });
  assert.equal((await post(store, { action: 'edit', to: first.address, token: first.editToken, body: 'edited after' })).status, 200, 'a v1 edit token still works');
  const log = await get(store, '?to=%23old');
  assert.equal(log.storage, 'd1');
  assert.deepEqual(log.ops.map((o) => o.seq), [1, 2, 3]);
  assert.equal(log.messages[0].body, 'edited after');
  assert.equal(log.messages[1].depth, 1);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM loom_ops').get().n, 3, 'the v1 op was imported once');

  await post(kvStore(kv), { to: '#kv-only', from: { name: 'Cy', kind: 'human' }, body: 'only in KV' });
  const directory = await get(store, '');
  const addresses = directory.logs.map((e) => e.address);
  assert.equal(addresses[0], '#kv-only', 'the directory merges both stores, newest first');
  assert.ok(addresses.includes('#old'));
  assert.equal(addresses.filter((a) => a === '#old').length, 1);
  assert.deepEqual((await get(store, '?from=%40ana')).sent.map((s) => s.to), ['#old'], 'outboxes merge KV history');
});
