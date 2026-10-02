import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet, onRequestPost, onRequestDelete } from '../functions/api/me/nouns-money.ts';
import { onRequestGet as getState, onRequestPut as putState } from '../functions/api/me/state.ts';

// Execute actual migration and production JSON SQL rather than reimplementing
// collection behavior in the test adapter.
class SQLiteD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    for (const migration of ['0001_init.sql', '0002_user_state.sql']) {
      this.sqlite.exec(readFileSync(new URL(`../migrations/auth/${migration}`, import.meta.url), 'utf8'));
    }
    for (const id of ['alice', 'bob']) {
      const payload = JSON.stringify({ userId: id, identities: [], preferredName: id, createdAt: '2026-10-02T00:00:00.000Z' });
      this.sqlite.prepare('INSERT INTO users (id,payload,created_at) VALUES (?,?,?)').run(id, payload, '2026-10-02');
      this.sqlite.prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)').run(`pcs_${id}`, id, Date.now() + 60_000);
    }
  }
  prepare(sql) {
    const db = this;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() { return db.sqlite.prepare(sql).get(...this.args) ?? null; },
      async run() {
        if (sql.includes('INSERT INTO user_state') && db.beforeStateWrite) {
          const hook = db.beforeStateWrite; db.beforeStateWrite = null; await hook();
        }
        const result = db.sqlite.prepare(sql).run(...this.args);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
  }
}
function environment(t) {
  const AUTH_DB = new SQLiteD1();
  t.after(() => AUTH_DB.sqlite.close());
  return { AUTH_DB };
}
function request(method = 'GET', body, { user = 'alice', origin = 'https://pointcast.xyz', headers = {}, raw, path = '/api/me/nouns-money' } = {}) {
  return new Request(`https://pointcast.xyz${path}`, {
    method,
    headers: {
      ...(user ? { cookie: `pc_session=pcs_${user}` } : {}),
      ...(method === 'GET' || origin === null ? {} : { origin }),
      ...(method === 'GET' || !user ? {} : { 'X-PointCast-User': user }),
      ...(body === undefined && raw === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    ...(raw === undefined ? (body === undefined ? {} : { body: JSON.stringify(body) }) : { body: raw }),
  });
}
async function call(env, method, body, options) {
  const handlers = { GET: onRequestGet, POST: onRequestPost, DELETE: onRequestDelete };
  return handlers[method]({ env, request: request(method, body, options) });
}
async function view(env, user = 'alice') { return (await call(env, 'GET', undefined, { user })).json(); }
const collect = (env, noteId, options) => call(env, 'POST', { noteId }, options);
const remove = (env, noteId, options) => call(env, 'DELETE', { noteId }, options);
function row(env, user = 'alice') { return env.AUTH_DB.sqlite.prepare('SELECT * FROM user_state WHERE user_id=?').get(user); }

test('collection requires the existing session and D1, returns private account storage, and performs no signed-out write', async (t) => {
  const env = environment(t);
  for (const method of ['GET', 'POST', 'DELETE']) {
    const response = await call(env, method, method === 'GET' ? undefined : { noteId: 'nm100-000' }, { user: null });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).reason, 'unauthorized');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  assert.equal(row(env), undefined);
  assert.deepEqual(await view(env), {
    ok: true, schema: 'pointcast.nouns-money.collection/v1', userId: 'alice', storage: 'account',
    noteIds: [], collectedAt: {}, updatedAt: null,
  });
  assert.equal(row(env), undefined, 'empty GET must not write a collection');
  for (const fallback of [{}, { USERS: { get: () => { throw new Error('must not promise KV persistence'); } } }]) {
    const response = await call(fallback, 'GET');
    assert.equal(response.status, 503);
    assert.equal((await response.json()).reason, 'nouns-money-collection-unavailable');
  }
});

test('write origin, exact JSON object, catalog IDs, and actual streamed bytes are validated', async (t) => {
  const env = environment(t);
  for (const origin of [null, 'https://attacker.example', 'https://pointcast.xyz.attacker.example']) {
    assert.equal((await collect(env, 'nm100-000', { origin })).status, 403);
    assert.equal((await remove(env, 'nm100-000', { origin })).status, 403);
  }
  for (const body of [null, [], {}, { noteId: 0 }, { noteId: 'nm100-100' }, { noteId: 'nm100-00' }, { noteId: 'nm100-999' }, { noteId: 'nm-01' }, { noteId: 'nm100-000', userId: 'bob' }, { noteId: 'nm100-000', extra: true }]) {
    assert.equal((await call(env, 'POST', body)).status, 400, JSON.stringify(body));
  }
  for (const raw of ['', '{', 'null', '"nm100-000"']) {
    assert.equal((await call(env, 'POST', undefined, { raw })).status, 400);
  }
  assert.equal((await collect(env, 'nm100-000', { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await collect(env, 'nm100-000', { headers: { 'content-type': 'application/jsonp' } })).status, 415);
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('{"noteId":"'));
    controller.enqueue(new Uint8Array(300).fill(120)); controller.close();
  } });
  const response = await onRequestPost({ env, request: new Request('https://pointcast.xyz/api/me/nouns-money', {
    method: 'POST', headers: { cookie: 'pc_session=pcs_alice', origin: 'https://pointcast.xyz', 'X-PointCast-User': 'alice', 'content-type': 'application/json' }, body: stream, duplex: 'half',
  }) });
  assert.equal(response.status, 413, 'missing Content-Length must not bypass body limit');
  assert.equal((await response.json()).reason, 'body-too-large');
  assert.equal(row(env), undefined);
});

test('collect, duplicate collect, remove, repeated remove, and recollect are idempotent with server timestamps', async (t) => {
  const env = environment(t);
  let now = 1_790_899_200_000;
  t.mock.method(Date, 'now', () => now);
  const first = await (await collect(env, 'nm100-000')).json();
  assert.equal(first.changed, true);
  assert.deepEqual(first.noteIds, ['nm100-000']);
  assert.equal(first.collectedAt['nm100-000'], new Date(now).toISOString());
  const version = row(env).version;
  now += 1000;
  const again = await (await collect(env, 'nm100-000')).json();
  assert.deepEqual({ ...again, changed: true }, first);
  assert.equal(again.changed, false);
  assert.equal(row(env).version, version);
  const deleted = await (await remove(env, 'nm100-000')).json();
  assert.equal(deleted.changed, true);
  assert.deepEqual(deleted.noteIds, []);
  assert.deepEqual(deleted.collectedAt, {});
  const removedVersion = row(env).version;
  now += 1000;
  assert.equal((await (await remove(env, 'nm100-000')).json()).changed, false);
  assert.equal(row(env).version, removedVersion);
  const recollected = await (await collect(env, 'nm100-000')).json();
  assert.equal(recollected.changed, true);
  assert.equal(recollected.collectedAt['nm100-000'], new Date(now).toISOString());
  assert.notEqual(recollected.collectedAt['nm100-000'], first.collectedAt['nm100-000']);
  const { changed, ...expectedReload } = recollected;
  assert.deepEqual(await view(env), expectedReload);
});

test('all 100 source IDs can be collected concurrently without duplicate entries or lost notes, and accounts remain isolated', async (t) => {
  const env = environment(t);
  const ids = Array.from({ length: 100 }, (_, i) => `nm100-${String(i).padStart(3, '0')}`);
  const responses = await Promise.all(ids.map((id) => collect(env, id)));
  assert.ok(responses.every((response) => response.status === 200));
  const alice = await view(env);
  assert.deepEqual(alice.noteIds, ids);
  assert.equal(Object.keys(alice.collectedAt).length, 100);
  await collect(env, 'nm100-099', { user: 'bob' });
  assert.deepEqual((await view(env, 'bob')).noteIds, ['nm100-099']);
  await remove(env, 'nm100-000', { user: 'bob' });
  assert.deepEqual((await view(env)).noteIds, ids);
  await Promise.all(ids.map((id) => remove(env, id)));
  assert.deepEqual((await view(env)).noteIds, []);
  assert.deepEqual((await view(env, 'bob')).noteIds, ['nm100-099']);
});

test('collection changes preserve other profile state and generic PUT cannot directly replace collection', async (t) => {
  const env = environment(t);
  const payload = { mood: { updatedAt: 100, value: 'quiet' }, library: { updatedAt: 100, value: ['/me'] } };
  const put = (next) => putState({ env, request: request('PUT', { payload: next }, { path: '/api/me/state' }) });
  assert.equal((await put(payload)).status, 200);
  await collect(env, 'nm100-012');
  const saved = JSON.parse(row(env).payload);
  assert.deepEqual(saved.mood, payload.mood);
  assert.deepEqual(saved.library, payload.library);
  assert.equal((await put({ nounsMoneyCollection: saved.nounsMoneyCollection })).status, 400);
  assert.equal((await put({ nounsMoneyCollection: { updatedAt: Date.now(), value: {} } })).status, 400);
  assert.equal((await (await put({ nounsMoneyCollection: saved.nounsMoneyCollection })).json()).reason, 'collection-endpoint-required');
  const generic = await getState({ env, request: request('GET', undefined, { path: '/api/me/state' }) });
  assert.deepEqual((await generic.json()).payload, saved, 'GET recognizes the collection slot without dropping other fields');
  await remove(env, 'nm100-012');
  assert.deepEqual(JSON.parse(row(env).payload).mood, payload.mood);
});

test('generic writes atomically preserve collection added or removed after their read snapshot', async (t) => {
  const env = environment(t);
  await collect(env, 'nm100-001');
  env.AUTH_DB.beforeStateWrite = () => collect(env, 'nm100-002');
  const response = await putState({ env, request: request('PUT', { payload: { mood: { updatedAt: 100, value: 'quiet' } } }, { path: '/api/me/state' }) });
  assert.equal(response.status, 200);
  assert.deepEqual((await view(env)).noteIds, ['nm100-001', 'nm100-002']);
  assert.equal(row(env).version, 3);
  env.AUTH_DB.beforeStateWrite = () => remove(env, 'nm100-001');
  const second = await putState({ env, request: request('PUT', { payload: { mood: { updatedAt: 101, value: 'hype' } } }, { path: '/api/me/state' }) });
  assert.equal(second.status, 200);
  assert.deepEqual((await view(env)).noteIds, ['nm100-002']);
  assert.equal(JSON.parse(row(env).payload).mood.value, 'hype');
  assert.equal(row(env).version, 5);
});

test('missing profile migration and storage errors fail closed without a false saved response', async (t) => {
  const env = environment(t);
  env.AUTH_DB.sqlite.exec('DROP TABLE user_state');
  for (const method of ['GET', 'POST', 'DELETE']) {
    const response = await call(env, method, method === 'GET' ? undefined : { noteId: 'nm100-000' });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).reason, 'nouns-money-collection-unavailable');
  }
});


test('profile document capacity is enforced atomically and removing a note remains available', async (t) => {
  const env = environment(t);
  await collect(env, 'nm100-001');
  const saved = JSON.parse(row(env).payload);
  saved.quests = { updatedAt: 100, value: { oversized: '' } };
  saved.quests.value.oversized = 'x'.repeat(16 * 1024 - 1 - Buffer.byteLength(JSON.stringify(saved)));
  assert.equal(Buffer.byteLength(JSON.stringify(saved)), 16 * 1024 - 1);
  env.AUTH_DB.sqlite.prepare('UPDATE user_state SET payload=? WHERE user_id=?').run(JSON.stringify(saved), 'alice');
  const before = row(env);
  assert.equal((await collect(env, 'nm100-002')).status, 413);
  assert.deepEqual(row(env), before, 'failed collection write cannot mutate any profile state');
  assert.equal((await collect(env, 'nm100-001')).status, 200, 'duplicate remains an idempotent success');
  assert.equal((await remove(env, 'nm100-001')).status, 200);
  assert.deepEqual((await view(env)).noteIds, []);
});

test('generic state capacity includes the current atomic collection when another request adds it during a generic write', async (t) => {
  const env = environment(t);
  const huge = { quests: { updatedAt: 100, value: { work: 'x'.repeat(16_315) } } };
  assert.ok(Buffer.byteLength(JSON.stringify(huge)) <= 16 * 1024);
  env.AUTH_DB.beforeStateWrite = () => collect(env, 'nm100-099');
  const response = await putState({ env, request: request('PUT', { payload: huge }, { path: '/api/me/state' }) });
  assert.equal(response.status, 413);
  assert.deepEqual((await view(env)).noteIds, ['nm100-099']);
  assert.equal(JSON.parse(row(env).payload).quests, undefined);
});


test('expected account guards cross-tab session switches before either account can be mutated', async (t) => {
  const env = environment(t);
  await collect(env, 'nm100-007', { user: 'bob' });
  const bobBefore = row(env, 'bob');
  for (const method of ['POST', 'DELETE']) {
    for (const expected of ['', 'alice']) {
      const response = await call(env, method, { noteId: 'nm100-007' }, { user: 'bob', headers: { 'X-PointCast-User': expected } });
      assert.equal(response.status, 409);
      assert.equal((await response.json()).reason, 'account-changed');
      assert.deepEqual(row(env, 'bob'), bobBefore);
      assert.equal(row(env, 'alice'), undefined);
    }
    const missing = new Request('https://pointcast.xyz/api/me/nouns-money', {
      method, headers: { cookie: 'pc_session=pcs_bob', origin: 'https://pointcast.xyz', 'content-type': 'application/json' },
      body: JSON.stringify({ noteId: 'nm100-007' }),
    });
    const handler = method === 'POST' ? onRequestPost : onRequestDelete;
    assert.equal((await handler({ env, request: missing })).status, 409);
    assert.deepEqual(row(env, 'bob'), bobBefore);
  }
  assert.equal((await collect(env, 'nm100-008', { user: 'bob' })).status, 200);
  assert.deepEqual((await view(env, 'bob')).noteIds, ['nm100-007', 'nm100-008']);
});

test('first collect migrates existing legacy mood and quests before adding the account collection', async (t) => {
  const env = environment(t);
  const legacy = {
    mood: { updatedAt: 100, value: 'quiet' },
    quests: { updatedAt: 101, value: { firstVisit: { complete: true } } },
  };
  const reads = [];
  env.USERS = { async get(key) { reads.push(key); return key === 'user-state:alice' ? JSON.stringify(legacy) : null; } };
  const response = await collect(env, 'nm100-033');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).changed, true);
  const saved = JSON.parse(row(env).payload);
  assert.deepEqual(saved.mood, legacy.mood);
  assert.deepEqual(saved.quests, legacy.quests);
  assert.deepEqual((await view(env)).noteIds, ['nm100-033']);
  assert.deepEqual(reads, ['user-state:alice'], 'D1 becomes authoritative after the one migration');
});

test('legacy migration cannot overwrite a D1 profile or collection created during its KV read', async (t) => {
  const env = environment(t);
  const legacy = { mood: { updatedAt: 100, value: 'old KV' }, quests: { updatedAt: 100, value: { old: true } } };
  const winner = {
    mood: { updatedAt: 200, value: 'new D1' },
    quests: { updatedAt: 200, value: { current: true } },
    nounsMoneyCollection: { updatedAt: 200, value: { 'nm100-004': 200 } },
  };
  env.USERS = { async get(key) {
    assert.equal(key, 'user-state:alice');
    env.AUTH_DB.sqlite.prepare('INSERT INTO user_state(user_id,payload,version,updated_at) VALUES(?,?,?,?)')
      .run('alice', JSON.stringify(winner), 7, 200);
    return JSON.stringify(legacy);
  } };
  const migrated = await getState({ env, request: request('GET', undefined, { path: '/api/me/state' }) });
  assert.deepEqual((await migrated.json()).payload, winner);
  assert.equal(row(env).version, 7);
  await collect(env, 'nm100-005');
  const saved = JSON.parse(row(env).payload);
  assert.deepEqual(saved.mood, winner.mood);
  assert.deepEqual(saved.quests, winner.quests);
  assert.deepEqual((await view(env)).noteIds, ['nm100-004', 'nm100-005']);
});
