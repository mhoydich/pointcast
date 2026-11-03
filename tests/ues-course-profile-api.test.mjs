import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet, onRequestPut, onRequestDelete } from '../functions/api/me/courses.ts';
import { createProgress, setWeekComplete, setFinalOutcome } from '../src/lib/ues-progress.mjs';

class SQLiteD1 {
  sqlite = new DatabaseSync(':memory:');
  constructor(migrate = true) {
    this.sqlite.exec(readFileSync(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8'));
    if (migrate) this.sqlite.exec(readFileSync(new URL('../migrations/auth/0033_ues_course_progress.sql', import.meta.url), 'utf8'));
    for (const id of ['alpha', 'beta']) {
      const user = { userId: id, preferredName: id, createdAt: '2026-01-01T00:00:00.000Z', identities: [{ provider: 'google', id: `synthetic-${id}` }], roles: [] };
      this.sqlite.prepare('INSERT INTO users VALUES (?, ?, ?)').run(id, JSON.stringify(user), user.createdAt);
      this.sqlite.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(`fixture-${id}`, id, Date.now() + 600_000);
    }
  }
  async batch(statements) {
    this.sqlite.exec('BEGIN');
    try {
      const result = statements.map(statement => statement.execute());
      this.sqlite.exec('COMMIT'); return result;
    } catch (error) { this.sqlite.exec('ROLLBACK'); throw error; }
  }
  prepare(sql) {
    const db = this.sqlite;
    return {
      args: [], bind(...args) { this.args = args; return this; },
      async first() { return db.prepare(sql).get(...this.args) ?? null; },
      async all() { return { success: true, results: db.prepare(sql).all(...this.args) }; },
      execute() {
        const statement = db.prepare(sql);
        return statement.columns().length
          ? { success: true, results: statement.all(...this.args), meta: { changes: 0 } }
          : { success: true, results: [], meta: { changes: Number(statement.run(...this.args).changes) } };
      },
      async run() { return this.execute(); },
    };
  }
}
function fixture(t, migrate = true) {
  const db = new SQLiteD1(migrate); t.after(() => db.sqlite.close());
  return { AUTH_DB: db, UES_COURSE_PROFILE_ENABLED: '1' };
}
const endpoint = 'https://pointcast.test/api/me/courses';
const initial = () => setWeekComplete(createProgress('UES-201'), 1, true, '2026-01-01T00:00:00.000Z');
const input = (overrides = {}) => ({ courseCode: 'UES-201', progress: initial(), consent: true, expectedRevision: null, ...overrides });
function req(method = 'GET', body, user = 'alpha', headers = {}, search = '') {
  return new Request(endpoint + search, { method, headers: {
    cookie: `pc_session=fixture-${user}`, ...(method === 'GET' ? {} : { origin: 'https://pointcast.test', 'content-type': 'application/json', 'X-PointCast-User': user }), ...headers,
  }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
}
const call = (handler, env, request) => handler({ request, env });
const save = async (env, body = input(), user = 'alpha') => {
  if (body && typeof body === 'object' && !Object.hasOwn(body, 'expectedGeneration')) {
    body = { ...body, expectedGeneration: (await read(env, user)).generation };
  }
  return call(onRequestPut, env, req('PUT', body, user));
};
const read = async (env, user = 'alpha', search = '') => (await call(onRequestGet, env, req('GET', undefined, user, {}, search))).json();

test('course feature fails closed when disabled, KV-only, or migration missing', async t => {
  const env = fixture(t, false);
  for (const bindings of [env, { ...env, UES_COURSE_PROFILE_ENABLED: undefined }, { USERS: {}, UES_COURSE_PROFILE_ENABLED: '1' }]) {
    const response = await call(onRequestGet, bindings, req());
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});
test('anonymous, unknown and expired sessions cannot read or mutate checklists', async t => {
  const env = fixture(t);
  env.AUTH_DB.sqlite.prepare('UPDATE sessions SET expires_at = 1 WHERE user_id = ?').run('beta');
  for (const user of ['', 'missing', 'beta']) {
    for (const [handler, request] of [[onRequestGet, req('GET', undefined, user)], [onRequestPut, req('PUT', input(), user)], [onRequestDelete, req('DELETE', { courseCode: 'UES-201', expectedRevision: crypto.randomUUID() }, user)]]) {
      assert.equal((await call(handler, env, request)).status, 401);
    }
  }
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM ues_course_progress').get().n, 0);
});
test('only deliberate same-origin JSON writes for the displayed account are accepted', async t => {
  const env = fixture(t);
  for (const [headers, status] of [[{ origin: 'https://elsegundo.xyz' }, 403], [{ origin: '' }, 403], [{ 'sec-fetch-site': 'cross-site' }, 403], [{ 'X-PointCast-User': 'beta' }, 409], [{ 'content-type': 'text/plain' }, 415]]) {
    assert.equal((await call(onRequestPut, env, req('PUT', input(), 'alpha', headers))).status, status);
  }
  assert.equal((await call(onRequestGet, env, req('GET', undefined, 'alpha', { origin: 'https://elsegundo.xyz' }))).status, 403);
  assert.equal((await save(env, input({ consent: false }))).status, 400);
});
test('private account copy persists across sessions, is scoped to its owner, and projects only allowed data', async t => {
  const env = fixture(t);
  const response = await save(env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('set-cookie'), null);
  const result = await response.json();
  assert.deepEqual(result.course.progress, initial());
  assert.equal(result.course.visibility, 'private'); assert.equal(result.course.attestation, 'self-attested');
  assert.equal(result.userId, 'alpha');
  assert.equal((await read(env)).courses.length, 1); assert.deepEqual((await read(env, 'beta')).courses, []);
  env.AUTH_DB.sqlite.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run('fixture-alpha-second', 'alpha', Date.now() + 600_000);
  const secondSession = await call(onRequestGet, env, req('GET', undefined, 'alpha', { cookie: 'pc_session=fixture-alpha-second' }));
  assert.deepEqual((await secondSession.json()).courses[0].progress, initial());
  assert.doesNotMatch(JSON.stringify(result), /fixture-alpha|identities|synthetic-alpha|sessionToken/);
  const filtered = await read(env, 'alpha', '?courseCode=UES-202'); assert.deepEqual(filtered.courses, []);
});
test('course updates preserve other courses, reject stale writes, and permit undoing completion', async t => {
  const env = fixture(t);
  const first = (await (await save(env)).json()).course;
  assert.equal((await save(env)).status, 409);
  assert.equal((await save(env, input({ courseCode: 'UES-202', progress: createProgress('UES-202') }))).status, 200);
  let complete = initial(); for (const n of [2, 3, 4]) complete = setWeekComplete(complete, n, true, '2026-01-01T01:00:00.000Z');
  complete = setFinalOutcome(complete, true, '2026-01-01T02:00:00.000Z');
  const second = (await (await save(env, input({ progress: complete, expectedRevision: first.revision }))).json()).course;
  assert.equal(second.progress.finalOutcome, true); assert.notEqual(second.revision, first.revision);
  assert.equal((await save(env, input({ expectedRevision: first.revision }))).status, 409);
  assert.equal((await save(env, input({ expectedRevision: second.revision }))).status, 200);
  const courses = (await read(env)).courses; assert.equal(courses.length, 2); assert.deepEqual(courses[1].progress, createProgress('UES-202'));
});
test('concurrent snapshots cannot silently clobber the same revision', async t => {
  const env = fixture(t);
  const first = (await (await save(env)).json()).course;
  const generation = (await read(env)).generation;
  const writes = await Promise.all([save(env, input({ expectedRevision: first.revision, expectedGeneration: generation })), save(env, input({ expectedRevision: first.revision, expectedGeneration: generation }))]);
  assert.deepEqual(writes.map(r => r.status).sort(), [200, 409]);
});
test('remove is account/revision scoped; stale writes cannot revive a removed or recreated copy', async t => {
  const env = fixture(t);
  const first = (await (await save(env)).json()).course;
  const remove = { courseCode: 'UES-201', expectedRevision: first.revision, expectedGeneration: (await read(env)).generation };
  assert.equal((await call(onRequestDelete, env, req('DELETE', remove, 'beta'))).status, 409);
  assert.equal((await call(onRequestDelete, env, req('DELETE', remove))).status, 200);
  assert.deepEqual((await read(env)).courses, []);
  assert.equal((await save(env, input({ expectedRevision: first.revision }))).status, 409);
  assert.equal((await save(env)).status, 200);
  assert.equal((await call(onRequestDelete, env, req('DELETE', remove))).status, 409);
  assert.equal((await read(env)).courses.length, 1);
});
test('invalid, forged credential, private-note and cross-course payloads never persist', async t => {
  const env = fixture(t);
  const malformed = [
    input({ courseCode: 'UES-999' }), input({ courseCode: 'UES-202' }), input({ userId: 'beta' }), input({ verified: true }), input({ consent: undefined }),
    input({ progress: { ...initial(), privateNote: 'private assignment' } }), input({ progress: { ...initial(), completedWeeks: [1, 1] } }),
    input({ progress: { ...initial(), completedWeeks: [7] } }), input({ progress: { ...initial(), finalOutcome: 'yes' } }),
    input({ progress: { ...initial(), startedAt: null } }), input({ progress: { ...initial(), completedAt: '2026-01-01T01:00:00.000Z' } }),
    input({ progress: { ...initial(), startedAt: '2999-01-01T00:00:00.000Z' } }), input({ progress: { ...initial(), startedAt: '2026-02-30T00:00:00.000Z' } }),
    input({ expectedRevision: 'not-a-revision' }), input({ expectedGeneration: null }), input({ expectedGeneration: 'invalid' }), input({ progress: null }), '{bad', '[]',
  ];
  for (const value of malformed) assert.equal((await save(env, value)).status, 400);
  assert.equal((await call(onRequestPut, env, req('PUT', input()))).status, 400, 'a save without a reviewed generation is rejected');
  assert.equal((await save(env, ' '.repeat(2049))).status, 413);
  assert.equal((await read(env)).courses.length, 0);
});
test('streamed requests are bounded without relying on content-length', async t => {
  const env = fixture(t);
  const stream = new ReadableStream({ start(controller) { for (let n = 0; n < 4; n++) controller.enqueue(new Uint8Array(700)); controller.close(); } });
  const request = new Request(endpoint, { method: 'PUT', body: stream, duplex: 'half', headers: { cookie: 'pc_session=fixture-alpha', origin: 'https://pointcast.test', 'content-type': 'application/json', 'X-PointCast-User': 'alpha' } });
  assert.equal((await call(onRequestPut, env, request)).status, 413);
});
test('deleting a user cascades private progress', async t => {
  const env = fixture(t); await save(env);
  env.AUTH_DB.sqlite.prepare('DELETE FROM users WHERE id = ?').run('alpha');
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM ues_course_progress').get().n, 0);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM ues_course_profile_revisions').get().n, 0);
});

test('an old empty-profile read cannot resurrect a course after another client saves then removes it', async t => {
  const env = fixture(t);
  const absent = await read(env);
  assert.deepEqual(absent.courses, []);
  const created = await (await save(env)).json();
  const removed = await call(onRequestDelete, env, req('DELETE', {
    courseCode: 'UES-201', expectedRevision: created.course.revision, expectedGeneration: created.generation,
  }));
  assert.equal(removed.status, 200);
  const delayedFirstSave = await save(env, input({ expectedGeneration: absent.generation }));
  assert.equal(delayedFirstSave.status, 409, 'a first save based on the pre-delete empty view must not recreate the removed course');
  assert.deepEqual((await read(env)).courses, []);
  const metadata = env.AUTH_DB.sqlite.prepare('SELECT * FROM ues_course_profile_revisions WHERE user_id = ?').get('alpha');
  assert.deepEqual(Object.keys(metadata).sort(), ['generation', 'user_id']);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM ues_course_progress').get().n, 0);
  assert.equal((await save(env)).status, 200, 'a new explicit save after rereading the empty profile remains allowed');
});


test('a failed course mutation rolls back generation advancement and remains safely retryable', async t => {
  const env = fixture(t);
  const before = await read(env);
  env.AUTH_DB.sqlite.exec("CREATE TRIGGER fixture_fail_insert BEFORE INSERT ON ues_course_progress BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
  assert.equal((await save(env, input({ expectedGeneration: before.generation }))).status, 503);
  const after = await read(env);
  assert.equal(after.generation, before.generation); assert.deepEqual(after.courses, []);
  env.AUTH_DB.sqlite.exec('DROP TRIGGER fixture_fail_insert');
  assert.equal((await save(env, input({ expectedGeneration: before.generation }))).status, 200);
});
