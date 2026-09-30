import test from 'node:test';
import assert from 'node:assert/strict';
import { handleKeeps, normalizeKeep } from '../functions/api/keeps.ts';
import { ensureKeepsMigrated, listD1Keeps } from '../functions/api/me/_keeps-store.ts';
import { SqliteD1, MemoryKV } from './helpers/me-d1.mjs';

const USER = 'pcu_test';
const link = (n, extra = {}) => ({ kind: 'link', url: `https://pointcast.xyz/b/${String(n).padStart(4, '0')}`, title: `Page ${n}`, ...extra });
const request = (method, body, headers = {}) => new Request('https://pointcast.xyz/api/keeps', {
  method, headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const call = (env, method = 'GET', body, userId = USER, headers) => handleKeeps(request(method, body, headers), env, async () => userId ? { user: { userId } } : null);
const body = async (response) => ({ status: response.status, ...(await response.json()) });
const fixture = (t) => { const db = new SqliteD1(); t.after(() => db.close()); return { AUTH_DB: db, VISITS: new MemoryKV(), ME_KEEPS_D1: '1' }; };

for (const size of [0, 1, 100, 101, 300]) {
  for (const mode of ['legacy', 'd1']) test(`${mode}: full old-client import preserves all ${size} records`, async (t) => {
    const env = mode === 'd1' ? fixture(t) : { VISITS: new MemoryKV() };
    const result = await body(await call(env, 'POST', { items: Array.from({ length: size }, (_, i) => link(i)) }));
    assert.equal(result.status, 200);
    assert.equal(result.keeps.length, size);
    const read = await body(await call(env));
    assert.equal(read.keeps.length, size);
    assert.equal(read.userId, USER);
    assert.equal(read.importProtocol, 2);
    if (size && mode === 'd1') { assert.match(read.keeps[0].itemId, /^[0-9a-f-]{36}$/); assert.equal(read.keeps[0].version, 1); }
  });
}

for (const mode of ['legacy', 'd1']) test(`${mode}: legacy validation and overflow fail without partial import or eviction`, async (t) => {
  const env = mode === 'd1' ? fixture(t) : { VISITS: new MemoryKV() };
  await call(env, 'POST', { items: Array.from({ length: 299 }, (_, i) => link(i)) });
  assert.equal((await call(env, 'POST', { items: [link(500), link(501)] })).status, 409);
  let read = await body(await call(env));
  assert.equal(read.keeps.length, 299);
  assert.ok(!read.keeps.some((k) => k.url === link(500).url));
  assert.equal((await call(env, 'POST', { items: [link(500), { kind: 'invalid' }] })).status, 400);
  read = await body(await call(env)); assert.equal(read.keeps.length, 299);
  const excess = Array.from({ length: 301 }, (_, i) => link(i));
  assert.equal((await call(env, 'POST', { items: excess })).status, 400);
});

for (const mode of ['legacy', 'd1']) test(`${mode}: v2 acknowledges exact source IDs, duplicates, invalid entries and overflow`, async (t) => {
  const env = mode === 'd1' ? fixture(t) : { VISITS: new MemoryKV() };
  await call(env, 'POST', { items: Array.from({ length: 299 }, (_, i) => link(i, { note: 'original note' })) });
  const result = await body(await call(env, 'POST', { importProtocol: 2, items: [
    link(0, { id: 'old-alias', note: 'must not overwrite', title: 'changed' }),
    { kind: 'link', id: 'slashless', url: 'https://newsite.org' },
    link(502, { id: 'rejected-full' }), { id: 'invalid', kind: 'bad' },
  ] }));
  assert.equal(result.status, 200); assert.equal(result.keeps.length, 300);
  assert.deepEqual(result.acceptedIds, ['old-alias', 'slashless']);
  assert.deepEqual(result.duplicateIds, ['old-alias']);
  assert.deepEqual(result.rejected, [{ id: 'invalid', reason: 'invalid-keep' }, { id: 'rejected-full', reason: 'limit-reached' }]);
  const original = result.keeps.find((k) => k.url === link(0).url);
  assert.equal(original.note, 'original note'); assert.equal(original.title, 'Page 0');
  assert.equal((await call(env, 'POST', { importProtocol: 2, items: Array.from({ length: 101 }, (_, i) => link(i)) })).status, 400);
  const duplicateAtCap = await body(await call(env, 'POST', { importProtocol: 2, items: [link(0)] }));
  assert.equal(duplicateAtCap.acceptedIds.length, 1); assert.equal(duplicateAtCap.duplicateIds.length, 1);
});

test('D1 preserves simultaneous additions and enforces cap transactionally', async (t) => {
  const env = fixture(t);
  await call(env); // migrate first
  const added = await Promise.all([call(env, 'POST', { item: link(1) }), call(env, 'POST', { item: link(2) })]);
  assert.deepEqual(added.map((r) => r.status), [200, 200]);
  assert.equal((await body(await call(env))).keeps.length, 2);
  await call(env, 'POST', { items: Array.from({ length: 297 }, (_, i) => link(i + 3)) });
  const full = await Promise.all([call(env, 'POST', { item: link(500) }), call(env, 'POST', { item: link(501) })]);
  assert.deepEqual(full.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await body(await call(env))).keeps.length, 300);
});

test('D1 editing uses account and item incarnation scoped versions', async (t) => {
  const env = fixture(t);
  const first = await body(await call(env, 'POST', { item: link(1) }));
  const keep = first.keeps[0];
  const races = await Promise.all([
    call(env, 'PATCH', { id: keep.id, version: 1, title: 'My title', note: 'private note' }),
    call(env, 'PATCH', { id: keep.id, version: 1, title: 'Stale title' }),
  ]);
  assert.deepEqual(races.map((r) => r.status).sort(), [200, 409]);
  const edited = (await body(await call(env))).keeps[0];
  assert.equal(edited.version, 2); assert.equal(edited.title, 'My title'); assert.equal(edited.note, 'private note');
  assert.equal((await call(env, 'PATCH', { id: keep.id, version: 2, title: 'Intruder' }, 'pcu_other')).status, 404);
  await call(env, 'DELETE', { id: keep.id });
  const readded = (await body(await call(env, 'POST', { item: link(1) }))).keeps[0];
  assert.notEqual(readded.itemId, keep.itemId); assert.equal(readded.version, 1);
  assert.equal((await call(env, 'PATCH', { id: keep.id, version: 1, expectedItemId: keep.itemId, title: 'Old incarnation' })).status, 409);
  assert.equal((await body(await call(env))).keeps[0].title, 'Page 1');
});

test('D1 guarded deletion refuses stale versions and a re-added alias', async (t) => {
  const env = fixture(t);
  const original = (await body(await call(env, 'POST', { item: link(1) }))).keeps[0];
  await call(env, 'PATCH', { id: original.id, version: 1, expectedItemId: original.itemId, note: 'New private note' });
  const staleVersion = await body(await call(env, 'DELETE', { id: original.id, version: 1, expectedItemId: original.itemId }));
  assert.equal(staleVersion.status, 409); assert.equal(staleVersion.reason, 'conflict');
  assert.equal((await body(await call(env))).keeps[0].note, 'New private note');
  assert.equal((await call(env, 'DELETE', { id: original.id, version: 2, expectedItemId: original.itemId })).status, 200);
  const readded = (await body(await call(env, 'POST', { item: link(1) }))).keeps[0];
  assert.notEqual(readded.itemId, original.itemId); assert.equal(readded.version, 1);
  assert.equal((await call(env, 'DELETE', { id: original.id, version: 1, expectedItemId: original.itemId })).status, 409);
  assert.equal((await body(await call(env))).keeps[0].itemId, readded.itemId);
  assert.equal((await call(env, 'DELETE', { id: original.id, version: 0, expectedItemId: readded.itemId })).status, 400);
  assert.equal((await call(env, 'DELETE', { id: original.id, expectedItemId: '' })).status, 400);
  assert.equal((await call(env, 'DELETE', { id: original.id, version: 1, expectedItemId: readded.itemId }, 'pcu_other')).status, 409);
  assert.equal((await call(env, 'DELETE', { id: original.id, version: 1, expectedItemId: readded.itemId })).status, 200);
  assert.equal((await body(await call(env))).keeps.length, 0);
  // The pre-existing alias-only contract remains idempotent for old callers.
  assert.equal((await call(env, 'DELETE', { id: original.id })).status, 200);
});

test('legacy deletion does not silently ignore D1 lifetime guards', async () => {
  const env = { VISITS: new MemoryKV() };
  const original = (await body(await call(env, 'POST', { item: link(1) }))).keeps[0];
  assert.equal((await call(env, 'DELETE', { id: original.id, version: 1, expectedItemId: 'old-d1-item' })).status, 409);
  assert.equal((await body(await call(env))).keeps.length, 1);
  assert.equal((await call(env, 'DELETE', { id: original.id })).status, 200);
});

test('migration is durable, preserves frozen aliases, and never reimports after deletion/flag rollback', async (t) => {
  const env = fixture(t);
  const original = normalizeKeep(link(1, { note: 'keep my note' })); original.id = 'link:original-alias';
  env.VISITS.data.set(`keeps:v1:${USER}`, JSON.stringify({ items: [original] }));
  const first = await body(await call(env));
  assert.equal(first.keeps[0].id, original.id); assert.equal(first.keeps[0].note, original.note);
  const marker = env.AUTH_DB.sqlite.prepare('SELECT * FROM me_keeps_migrations').get();
  assert.equal(marker.source_count, 1); assert.equal(env.VISITS.writes, 0);
  await call(env, 'DELETE', { id: original.id });
  env.ME_KEEPS_D1 = '0';
  assert.equal((await body(await call(env))).keeps.length, 0);
  assert.equal((await call(env, 'POST', { item: link(2) })).status, 200);
  assert.equal((await body(await call(env))).keeps.length, 1); assert.equal(env.VISITS.writes, 0);
});

test('older concurrent migration cannot resurrect a deleted keep', async (t) => {
  const env = fixture(t);
  const original = normalizeKeep(link(1));
  env.VISITS.data.set(`keeps:v1:${USER}`, JSON.stringify({ items: [original] }));
  let release, reached;
  const gate = new Promise((resolve) => { reached = resolve; });
  const get = env.VISITS.get.bind(env.VISITS); let reads = 0;
  env.VISITS.get = async (...args) => {
    const snapshot = await get(...args);
    if (++reads === 1) { reached(); await new Promise((resolve) => { release = resolve; }); }
    return snapshot;
  };
  const stale = ensureKeepsMigrated(env, USER);
  await gate;
  await ensureKeepsMigrated(env, USER);
  await call(env, 'DELETE', { id: original.id });
  release(); await stale;
  assert.equal((await listD1Keeps(env.AUTH_DB, USER)).length, 0);
});

test('failed migration rolls back rows and marker; retry succeeds', async (t) => {
  const env = fixture(t);
  env.VISITS.data.set(`keeps:v1:${USER}`, JSON.stringify({ items: [normalizeKeep(link(1)), normalizeKeep(link(2))] }));
  const batch = env.AUTH_DB.batch.bind(env.AUTH_DB);
  env.AUTH_DB.batch = (statements) => batch([statements[0], env.AUTH_DB.prepare('INSERT INTO missing_table VALUES (1)')]);
  assert.equal((await call(env)).status, 503);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM me_keeps').get().n, 0);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM me_keeps_migrations').get().n, 0);
  env.AUTH_DB.batch = batch;
  assert.equal((await body(await call(env))).keeps.length, 2);
});

test('pause, missing D1, database failures and account changes never write the fallback shelf', async (t) => {
  const env = fixture(t);
  env.ME_KEEPS_D1 = 'pause';
  assert.equal((await call(env, 'POST', { item: link(1) })).status, 503);
  assert.equal((await call(env)).status, 200); assert.equal(env.VISITS.writes, 0);
  env.ME_KEEPS_D1 = '1';
  assert.equal((await call({ ...env, AUTH_DB: undefined }, 'POST', { item: link(1) })).status, 503);
  await call(env);
  const changed = await body(await call(env, 'POST', { expectedUserId: 'pcu_someone_else', item: link(1) }));
  assert.equal(changed.status, 409); assert.equal(changed.reason, 'account-changed');
  assert.equal((await body(await call(env))).keeps.length, 0);
  const prepare = env.AUTH_DB.prepare;
  env.ME_KEEPS_D1 = '0'; env.AUTH_DB.prepare = () => { throw Error('database unavailable'); };
  assert.equal((await call(env, 'POST', { item: link(1) })).status, 503);
  env.AUTH_DB.prepare = prepare; assert.equal(env.VISITS.writes, 0);
});

test('input/security errors do not mutate storage; overlong URLs are never truncated', async (t) => {
  const env = fixture(t);
  assert.equal((await call(env, 'GET', undefined, null)).status, 401);
  assert.equal((await call(env, 'POST', { item: link(1) }, USER, { Origin: 'https://elsewhere.org' })).status, 403);
  assert.equal((await call(env, 'POST', { item: { kind: 'link', url: `https://host.org/${'x'.repeat(601)}` } })).status, 400);
  assert.equal((await call(env, 'POST', { item: { kind: 'link', url: 'https://user:password@host.org/' } })).status, 400);
  assert.equal((await call(env, 'POST', { item: { kind: 'link', url: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await call(env, 'POST', { item: link(1), padding: 'x'.repeat(1_000_001) })).status, 413);
  assert.equal((await body(await call(env))).keeps.length, 0);
});
