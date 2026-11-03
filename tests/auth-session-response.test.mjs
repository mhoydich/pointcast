import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  hasFreshAuthentication,
  issueSession,
  onRequestDelete,
  onRequestGet,
  readSessionFromRequest,
} from '../functions/api/auth/session.ts';
import { getSession } from '../src/lib/auth/client.ts';

const DAY = 24 * 60 * 60;

// Exercise the route's real SQL against SQLite, with the same transaction
// boundary as D1.batch. Everything lives in memory; no live bindings or login.
class SQLiteD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec(readFileSync(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8'));
    this.sqlite.exec('ALTER TABLE sessions ADD COLUMN authenticated_at INTEGER NOT NULL DEFAULT 0');
  }

  prepare(sql) {
    const db = this.sqlite;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() { return db.prepare(sql).get(...this.args) ?? null; },
      async run() { return this.execute(); },
      execute() {
        const result = db.prepare(sql).run(...this.args);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
  }

  async batch(statements) {
    this.sqlite.exec('BEGIN');
    try {
      const results = statements.map((statement) => statement.execute());
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
}

class MemoryKV {
  values = new Map();
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

async function fixture(t, storage, ttlSeconds = 30 * DAY) {
  const kv = new MemoryKV();
  const db = storage === 'KV' ? null : new SQLiteD1();
  if (db) t.after(() => db.sqlite.close());
  const env = storage === 'KV' ? { USERS: kv }
    : storage === 'D1' ? { AUTH_DB: db } : { AUTH_DB: db, USERS: kv };
  const user = {
    userId: 'pcu_session_response_fixture',
    createdAt: '2026-01-01T00:00:00.000Z',
    preferredName: 'Fixture member',
    identities: [{ provider: 'google', id: 'fixture-google', name: 'Fixture member', verifiedAt: '2026-01-01T00:00:00.000Z' }],
    roles: ['broadcaster'],
  };
  const legacy = storage === 'KV to D1';
  if (db && !legacy) {
    db.sqlite.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
      .run(user.userId, JSON.stringify(user), user.createdAt);
  } else {
    await kv.put(`user:${user.userId}`, JSON.stringify(user));
  }
  const authenticatedAt = new Date(Date.now() - 10 * DAY * 1000).toISOString();
  const session = await issueSession(legacy ? { USERS: kv } : env, user.userId, ttlSeconds, authenticatedAt);
  if (!db || legacy) {
    // A future internal session field must not silently expand the JSON API.
    await kv.put(`session:${session.sessionToken}`, JSON.stringify({ ...session, internalOnly: 'fixture-private-metadata' }));
  }
  return { env, db, kv, user, session, authenticatedAt };
}

function request(cookie = '', method = 'GET') {
  return new Request('https://pointcast.xyz/api/auth/session', { method, headers: { cookie } });
}

async function publicBody(response, user, session) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  const raw = await response.text();
  // Avoid putting even synthetic bearer values in assertion diagnostics.
  assert.equal(raw.includes(session.sessionToken), false, 'JSON must not contain the input bearer token');
  assert.equal(/sessionToken|authenticatedAt|internalOnly|fixture-private-metadata/.test(raw), false, 'JSON must contain only public session fields');
  const body = JSON.parse(raw);
  assert.equal(body.ok, true);
  assert.deepEqual(body.user, user);
  assert.deepEqual(body.session, { userId: session.userId, expiresAt: body.session.expiresAt });
  return body;
}

for (const storage of ['KV', 'D1', 'KV to D1']) {
  test(`${storage}: normal GET returns public metadata and keeps the cookie signed in`, async (t) => {
    const { env, db, user, session } = await fixture(t, storage);
    const req = request(`pc_session=${session.sessionToken}`);
    const response = await onRequestGet({ env, request: req });
    const body = await publicBody(response, user, session);
    assert.equal(body.session.expiresAt, session.expiresAt);
    assert.equal(body.renewed, undefined);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal((await readSessionFromRequest(req, env))?.user.userId, user.userId);
    if (db) assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
  });

  test(`${storage}: renewal exposes no bearer and rotates only through the protected cookie`, async (t) => {
    const { env, db, kv, user, session, authenticatedAt } = await fixture(t, storage, 60);
    const oldRequest = request(`pc_session=${session.sessionToken}`);
    const response = await onRequestGet({ env, request: oldRequest });
    const body = await publicBody(response, user, session);
    assert.equal(body.renewed, true);
    const setCookie = response.headers.get('set-cookie');
    assert.ok(setCookie);
    for (const attribute of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax']) {
      assert.ok(setCookie.split('; ').includes(attribute));
    }
    const maxAge = Number(setCookie.match(/Max-Age=(\d+)/)?.[1]);
    assert.ok(maxAge > 29 * DAY && maxAge <= 30 * DAY);
    const cookie = setCookie.split(';')[0];
    assert.equal(cookie === `pc_session=${session.sessionToken}`, false, 'renewal must rotate the bearer');
    const renewed = await readSessionFromRequest(request(cookie), env);
    assert.ok(renewed);
    assert.equal((JSON.stringify(body)).includes(renewed.session.sessionToken), false, 'JSON must not contain the renewed bearer token');
    assert.deepEqual(renewed.user, user);
    assert.equal(body.session.expiresAt, renewed.session.expiresAt);
    assert.ok(Date.parse(body.session.expiresAt) > Date.parse(session.expiresAt));
    assert.equal(await hasFreshAuthentication(env, renewed.session), false, 'a visit must not become fresh authentication');
    if (db) {
      assert.equal(db.sqlite.prepare('SELECT authenticated_at FROM sessions WHERE token = ?').get(renewed.session.sessionToken).authenticated_at, Date.parse(authenticatedAt));
      assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
    } else {
      assert.equal(renewed.session.authenticatedAt, authenticatedAt);
    }
    assert.equal(await readSessionFromRequest(oldRequest, env), null);
    assert.equal(kv.values.has(`session:${session.sessionToken}`), false, 'legacy records must not resurrect a rotated session');

    const logout = await onRequestDelete({ env, request: request(cookie, 'DELETE') });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax; Max-Age=0/);
    const signedOut = await onRequestGet({ env, request: request(cookie) });
    assert.equal(signedOut.status, 401);
    assert.deepEqual(await signedOut.json(), { ok: false, reason: 'unauthorized' });
  });

  test(`${storage}: absent, unknown and expired cookies fail closed without new credentials`, async (t) => {
    const { env, session } = await fixture(t, storage, -60);
    for (const cookie of ['', 'pc_session=fixture-unknown', `pc_session=${session.sessionToken}`]) {
      const response = await onRequestGet({ env, request: request(cookie) });
      assert.equal(response.status, 401);
      assert.equal(response.headers.get('set-cookie'), null);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.deepEqual(await response.json(), { ok: false, reason: 'unauthorized' });
    }
  });
}

test('the browser getSession client restores the same profile from the safe response', async (t) => {
  const { env, user, session } = await fixture(t, 'KV', 60);
  let cookie = `pc_session=${session.sessionToken}`;
  globalThis.window = {};
  globalThis.document = {};
  t.after(() => { delete globalThis.window; delete globalThis.document; });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    const response = await onRequestGet({ env, request: request(cookie) });
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return response;
  });
  assert.deepEqual(await getSession(), user);
  assert.deepEqual(await getSession(), user);
  assert.deepEqual(calls, Array.from({ length: 2 }, () => ({
    url: '/api/auth/session', options: { credentials: 'include', cache: 'no-store' },
  })));
  await onRequestDelete({ env, request: request(cookie, 'DELETE') });
  assert.equal(await getSession(), null);
});

test('unbound storage returns no session or cookie', async () => {
  const response = await onRequestGet({ env: {}, request: request() });
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(await response.json(), { ok: false, reason: 'kv-not-bound' });
});
