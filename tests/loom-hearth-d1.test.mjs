import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { localStores } from './helpers/loom-local-store.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { readHearth } from '../src/lib/loom/hearth-read.mjs';
import { HEARTH_DAY } from '../src/lib/loom/hearth-day.mjs';
import { addressKey } from '../src/lib/loom/address.mjs';

// Compile only the two Pages handlers in memory, as in the lost-posts
// qualification. No site build, output directory, disk database or remote I/O.
async function handler(path) {
  const compiled = await build({ entryPoints: [path], bundle: true, platform: 'node', format: 'esm', write: false });
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
}
const { onRequest } = await handler('functions/api/loom.ts');
const { onRequestGet } = await handler('functions/api/loom-hearth.ts');
const origin = 'https://loom.test.invalid';
const room = '#hearth-d1-fixture';
let networkCalls = 0;
test.before(() => test.mock.method(globalThis, 'fetch', () => {
  networkCalls++;
  throw new Error('Network access forbidden in Hearth storage tests');
}));
test.after(() => assert.equal(networkCalls, 0));

function fixture(t) {
  const stores = localStores({ afterRead: async () => {} }, { atomic: true });
  t.after(stores.close);
  // The copied helper returns raw strings. Match KV's optional JSON decoding
  // too, so the pre-fix Hearth reader sees a realistic legacy archive.
  const get = stores.env.PC_LOOM_KV.get;
  stores.env.PC_LOOM_KV.get = async (key, type) => {
    const value = await get(key);
    return type === 'json' && value !== null ? JSON.parse(value) : value;
  };
  return stores;
}

async function append(env, name, kind = 'agent') {
  const response = await onRequest({ env, request: new Request(origin + '/api/loom', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body: JSON.stringify({ to: room, from: { name, kind }, body: `A fresh log from ${name}.` }),
  }) });
  assert.equal(response.status, 201);
  return (await response.json()).message;
}

async function activity(env, address = room) {
  const response = await onRequestGet({ env, request: new Request(origin + '/api/loom-hearth?' +
    new URLSearchParams({ room: address })) });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.ok, true);
  assert.equal(data.rooms.length, 1);
  return { response, summary: data.rooms[0] };
}

async function seedArchive(stores, { at = Date.now() - 1000 } = {}) {
  const response = await handleLoom(new Request(origin + '/api/loom', {
    method: 'POST', body: JSON.stringify({ to: room, from: { name: 'Archive voice', kind: 'human' }, body: 'Before the cutover.' }),
  }), {
    kv: { get: async key => stores.archive.get(key) ?? null, put: async (key, value) => stores.archive.set(key, value) },
    clock: () => new Date(at), firstHelloEnabled: false,
  });
  assert.equal(response.status, 201);
  return (await response.json()).message;
}

test('fresh posts through the D1 Pages handler light Hearth with the latest voice', async t => {
  const stores = fixture(t);
  await append(stores.env, 'First agent');
  const person = await append(stores.env, 'A person', 'human');
  const latest = await append(stores.env, 'Latest agent');
  const { response, summary } = await activity(stores.env);
  assert.deepEqual(summary, {
    address: room, state: 'active', count: 3, size: 40, human: true,
    lastAt: latest.at, lastName: latest.from.name, lastKind: 'agent',
    lastHumanAt: person.at, humanName: person.from.name,
    brief: { done: [], open: [] },
  });
  assert.equal(response.headers.get('cache-control'), 'public, max-age=30');

  // Exercise the directory plus activity batches used by the Hearth page.
  const board = await readHearth({ request: path => {
    const request = new Request(new URL(path, origin));
    return new URL(request.url).pathname === '/api/loom'
      ? onRequest({ request, env: stores.env }) : onRequestGet({ request, env: stores.env });
  } });
  assert.deepEqual(board.active.find(entry => entry.address === room), { title: room, ...summary });
  assert.ok(!board.embers.some(entry => entry.address === room));
  assert.ok(!board.unavailable.some(entry => entry.address === room));
  assert.equal(stores.archive.size, 0, 'accepted D1 posts never populate the KV archive');
  assert.equal(stores.stats().archiveWrites, 0);
});

test('fresh D1 activity wins over an old quiet KV copy', async t => {
  const stores = fixture(t);
  await seedArchive(stores, { at: Date.now() - 2 * HEARTH_DAY });
  const archiveBefore = [...stores.archive];
  const latest = await append(stores.env, 'After cutover');
  const { summary } = await activity(stores.env);
  assert.equal(summary.state, 'active');
  assert.equal(summary.count, 1);
  assert.equal(summary.lastName, latest.from.name);
  assert.equal(summary.lastAt, latest.at);
  assert.deepEqual([...stores.archive], archiveBefore);
  assert.equal(stores.stats().archiveWrites, 0);
});

test('D1 reads retain untouched archive rooms without writing them back', async t => {
  const stores = fixture(t);
  const old = await seedArchive(stores);
  const { summary } = await activity(stores.env);
  assert.equal(summary.state, 'active');
  assert.equal(summary.lastName, old.from.name);
  assert.equal(summary.count, 1);
  assert.deepEqual(stores.stats(), { archiveWrites: 0, batches: 0, conflicts: 0 });
});

for (const binding of ['PC_LOOM_KV', 'VISITS']) {
  test(`Hearth still reads ${binding} when D1 is not bound`, async t => {
    const stores = fixture(t);
    const old = await seedArchive(stores);
    const { summary } = await activity({ [binding]: stores.env.PC_LOOM_KV });
    assert.equal(summary.state, 'active');
    assert.equal(summary.lastName, old.from.name);
    assert.equal(summary.count, 1);
    assert.equal(stores.stats().archiveWrites, 0);
  });
}

test('a broken bound D1 never falls back to a lit KV archive', async t => {
  const stores = fixture(t);
  await seedArchive(stores);
  for (const failOn of ['loom_atomic_state', 'loom_atomic_values']) {
    const prepare = stores.env.AUTH_DB.prepare;
    stores.env.AUTH_DB.prepare = sql => {
      if (sql.includes(failOn)) throw new Error('Unavailable local D1 fixture');
      return prepare(sql);
    };
    try {
      const { response, summary } = await activity(stores.env);
      assert.deepEqual(summary, { address: room, state: 'unavailable' });
      assert.equal(response.headers.get('cache-control'), 'no-store');
    } finally { stores.env.AUTH_DB.prepare = prepare; }
  }
});

test('missing rooms and incomplete recent history stay unavailable', async t => {
  const stores = fixture(t);
  assert.deepEqual((await activity(stores.env)).summary, { address: room, state: 'unavailable' });
  await append(stores.env, 'Trimmed fixture');
  const key = 'loom:log:' + await addressKey(room);
  const db = stores.env.AUTH_DB;
  const log = JSON.parse((await db.prepare('SELECT value FROM loom_atomic_values WHERE key = ?').bind(key).first()).value);
  log.trimmedBefore = log.ops[0].seq;
  await db.batch([db.prepare('UPDATE loom_atomic_values SET value = ? WHERE key = ?').bind(JSON.stringify(log), key)]);
  const { response, summary } = await activity(stores.env);
  assert.deepEqual(summary, { address: room, state: 'unavailable' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
