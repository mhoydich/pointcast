import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { localStores, readSchedule } from './helpers/loom-local-store.mjs';
import { addressKey } from '../src/lib/loom/address.mjs';
import { BODY_MAX, MAX_OPS } from '../src/lib/loom/service.mjs';
import { MAX_LOG_BYTES } from '../src/lib/loom/atomic.mjs';

// Compile the real Pages entry point in memory only. No output directory,
// site build, disk database, migration application, or remote requests.
const compiled = await build({ entryPoints: ['functions/api/loom.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const endpoint = 'https://loom.test.invalid/api/loom';
const room = '#size-guard-fixture';
const roomKey = await addressKey(room);
const storageKey = `loom:log:${roomKey}`;
const from = { name: 'Guest', kind: 'agent', address: '@size-fixture' };
const byteLength = value => Buffer.byteLength(value, 'utf8');
let serial = 0;
let networkCalls = 0;

test.before(() => test.mock.method(globalThis, 'fetch', () => {
  networkCalls++;
  throw new Error('Network access forbidden in Loom size tests');
}));
test.after(() => assert.equal(networkCalls, 0));

function fixture(t, schedule = { afterRead: async () => {} }) {
  const stores = localStores(schedule, { atomic: true });
  t.after(stores.close);
  return stores;
}

function post(stores, body) {
  return onRequest({ env: stores.env, request: new Request(endpoint, {
    method: 'POST',
    // Distinct local fixture IPs keep storage tests independent of rate caps.
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `2001:db8::${(++serial).toString(16)}` },
    body: JSON.stringify({ to: room, from, body }),
  }) });
}

async function append(stores, body) {
  const response = await post(stores, body);
  const receipt = await response.json();
  assert.equal(response.status, 201, JSON.stringify(receipt));
  return receipt.message;
}

async function read(stores) {
  const response = await onRequest({ env: stores.env, request: new Request(`${endpoint}?to=${encodeURIComponent(room)}`) });
  assert.equal(response.status, 200);
  return response.json();
}

async function rows(stores) {
  const result = await stores.env.AUTH_DB.prepare(
    "SELECT json_group_array(json_object('key', key, 'value', value)) AS rows FROM (SELECT key, value FROM loom_atomic_values ORDER BY key)"
  ).first();
  return JSON.parse(result.rows);
}

async function roomState(stores) {
  const all = await rows(stores);
  const current = all.find(row => row.key === storageKey);
  const archives = all.filter(row => row.key.startsWith(`loom:archive:${roomKey}:`));
  return { all, current, log: current ? JSON.parse(current.value) : null, archives };
}

function preserved(state) {
  return [...state.archives.flatMap(row => JSON.parse(row.value).ops), ...(state.log?.ops ?? [])].sort((a, b) => a.seq - b.seq);
}

function assertPreserved(state, acknowledged) {
  const ops = preserved(state).filter(op => op.op === 'append');
  assert.equal(ops.length, acknowledged.length);
  assert.equal(new Set(ops.map(op => op.id)).size, ops.length, 'archive and retained room must not duplicate posts');
  assert.deepEqual(ops.map(({ id, seq, body }) => ({ id, seq, body })), acknowledged.map(({ id, seq, body }) => ({ id, seq, body })));
  for (const row of state.all) {
    assert.ok(byteLength(row.value) <= MAX_LOG_BYTES, `${row.key}: ${byteLength(row.value)} bytes exceeds ${MAX_LOG_BYTES}`);
  }
}

function legacyLog(count, bodyFor = i => `Earlier post ${i}`) {
  const at = '2026-11-22T12:00:00.000Z';
  return { v: 1, address: room, key: roomKey, kind: 'topic', label: room, title: null,
    createdAt: at, updatedAt: at, seq: count,
    ops: Array.from({ length: count }, (_, i) => ({ op: 'append', id: `m_prior${i}`, seq: i + 1, at, from, kind: 'note', body: bodyFor(i), tags: [], mentions: [], cites: [] })) };
}

test('600 maximum-length CJK posts stay readable and every receipt survives in the room or archive', async t => {
  const stores = fixture(t);
  const acknowledged = [];
  let largestStored = 0;
  for (let i = 0; i < 600; i++) {
    const prefix = String(i).padStart(4, '0');
    acknowledged.push(await append(stores, prefix + '界'.repeat(BODY_MAX - prefix.length)));
    const size = await stores.env.AUTH_DB.prepare('SELECT length(CAST(value AS BLOB)) AS bytes FROM loom_atomic_values WHERE key = ?').bind(storageKey).first();
    largestStored = Math.max(largestStored, size.bytes);
  }
  const state = await roomState(stores);
  t.diagnostic(`600 acknowledged CJK posts; largest stored log ${largestStored} bytes; ${state.archives.length} archive chunks`);
  assert.ok(largestStored <= MAX_LOG_BYTES, `largest stored log was ${largestStored} bytes`);
  assert.ok(state.archives.length > 0, 'overflow must be archived');
  assertPreserved(state, acknowledged);
  assert.equal(state.log.trimmedBefore, state.log.ops[0].seq);
  const view = await read(stores);
  assert.equal(view.seq, 600);
  assert.deepEqual(view.messages.map(message => message.id), state.log.ops.map(op => op.id));
  assert.equal(view.messages.at(-1).id, acknowledged.at(-1).id);
  assert.equal(stores.stats().archiveWrites, 0, 'legacy KV stays read-only');
});

test('ordinary small rooms retain every operation without trimming or archive writes', async t => {
  const stores = fixture(t);
  const acknowledged = [];
  for (let i = 0; i < 5; i++) acknowledged.push(await append(stores, `Small post ${i}`));
  const state = await roomState(stores);
  assert.equal(state.archives.length, 0);
  assert.equal(state.log.trimmedBefore, undefined);
  assertPreserved(state, acknowledged);
  const view = await read(stores);
  assert.equal(view.log.trimmedBefore, null);
  assert.deepEqual(view.messages.map(({ id, body }) => ({ id, body })), acknowledged.map(({ id, body }) => ({ id, body })));
  assert.equal(stores.stats().archiveWrites, 0);
});

test('the existing operation-count trim archives old posts rather than discarding them', async t => {
  const stores = fixture(t);
  const acknowledged = [];
  for (let i = 0; i < MAX_OPS + 3; i++) acknowledged.push(await append(stores, `Count-limit post ${i}`));
  const state = await roomState(stores);
  assert.ok(state.log.ops.length <= MAX_OPS);
  assert.ok(state.archives.length > 0);
  assertPreserved(state, acknowledged);
  assert.equal((await read(stores)).seq, MAX_OPS + 3);
});

test('first D1 append safely imports a legacy room already larger than the row ceiling', async t => {
  const stores = fixture(t);
  const log = legacyLog(MAX_OPS, i => String(i).padStart(4, '0') + '界'.repeat(BODY_MAX - 4));
  const original = JSON.stringify(log);
  assert.ok(byteLength(original) > 2_000_000, 'legacy fixture must exceed the real D1 row ceiling');
  stores.archive.set(storageKey, original);
  const message = await append(stores, 'First accepted post after cutover');
  const state = await roomState(stores);
  assert.ok(state.archives.length >= 2, 'oversized history must split across bounded archive rows');
  assertPreserved(state, [...log.ops, message]);
  assert.equal((await read(stores)).messages.at(-1).id, message.id);
  assert.equal(stores.archive.get(storageKey), original);
  assert.equal(stores.stats().archiveWrites, 0);
});

test('untrimmable legacy metadata returns a clear 413 without changing storage', async t => {
  const stores = fixture(t);
  const log = legacyLog(1);
  log.title = '界'.repeat(Math.ceil(MAX_LOG_BYTES / 3));
  const original = JSON.stringify(log);
  stores.archive.set(storageKey, original);
  const response = await post(stores, 'Cannot fit beside the legacy metadata');
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, 'loom_log_too_large');
  assert.deepEqual(await rows(stores), []);
  assert.equal(stores.archive.get(storageKey), original);
  assert.deepEqual(stores.stats(), { archiveWrites: 0, batches: 0, conflicts: 0 });
});

test('an unsplittable legacy operation returns 413 instead of silently losing its contents', async t => {
  const stores = fixture(t);
  const original = JSON.stringify(legacyLog(1, () => '界'.repeat(Math.ceil(MAX_LOG_BYTES / 3))));
  stores.archive.set(storageKey, original);
  const response = await post(stores, 'The old operation must also be preserved');
  assert.equal(response.status, 413);
  const failure = await response.json();
  assert.equal(failure.error, 'loom_log_too_large');
  assert.equal(failure.maxLogBytes, MAX_LOG_BYTES);
  assert.deepEqual(await rows(stores), []);
  assert.equal(stores.archive.get(storageKey), original);
  assert.equal(stores.stats().batches, 0);
});

test('an oversized derived outbox refuses the whole append before any D1 write', async t => {
  const stores = fixture(t);
  const outboxKey = `loom:out:${await addressKey(from.address)}`;
  const original = JSON.stringify([{ id: 'm_oversizedoutbox', body: '界'.repeat(Math.ceil(MAX_LOG_BYTES / 3)) }]);
  stores.archive.set(outboxKey, original);
  const response = await post(stores, 'The source room fits but its outbox does not');
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, 'loom_log_too_large');
  assert.deepEqual(await rows(stores), []);
  assert.equal(stores.archive.get(outboxKey), original);
  assert.equal(stores.stats().batches, 0);
});

test('an archive batch failure rolls back the archive, trimmed room, and revision together', async t => {
  const stores = fixture(t);
  const log = legacyLog(MAX_OPS);
  const original = JSON.stringify(log);
  stores.archive.set(storageKey, original);
  const batch = stores.env.AUTH_DB.batch.bind(stores.env.AUTH_DB);
  let archiveAttempted = false;
  stores.env.AUTH_DB.batch = statements => {
    archiveAttempted = statements.some(statement => String(statement.args[0]).startsWith(`loom:archive:${roomKey}:`));
    return batch([...statements, { execute() { throw new Error('local archive transaction failure'); } }]);
  };
  const response = await post(stores, 'This transaction must fail');
  assert.equal(response.status, 503);
  assert.equal(archiveAttempted, true, 'failure must roll back actual archive writes');
  assert.deepEqual(await rows(stores), []);
  assert.equal(stores.archive.get(storageKey), original);
  assert.equal((await stores.env.AUTH_DB.prepare('SELECT revision FROM loom_atomic_state').first()).revision, 0);
  assert.equal(stores.stats().archiveWrites, 0);
});

test('overlapping posts crossing the trim boundary retry without losing or duplicating archive entries', async t => {
  const schedule = readSchedule(storageKey, 2);
  t.after(schedule.cancel);
  const stores = fixture(t, schedule);
  const log = legacyLog(MAX_OPS);
  stores.archive.set(storageKey, JSON.stringify(log));
  const acknowledged = await Promise.all([0, 1].map(i => schedule.run(i, () => append(stores, `Concurrent trim ${i}`))));
  const state = await roomState(stores);
  assert.ok(stores.stats().conflicts >= 1, 'test must exercise a real revision rollback and retry');
  assert.ok(state.archives.length > 0);
  assertPreserved(state, [...log.ops, ...acknowledged].sort((a, b) => a.seq - b.seq));
  assert.equal(state.log.seq, MAX_OPS + 2);
  assert.equal((await read(stores)).seq, MAX_OPS + 2);
  assert.equal(stores.stats().archiveWrites, 0);
});
