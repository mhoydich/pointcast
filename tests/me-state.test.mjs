import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, onRequestPut } from '../functions/api/me/state.ts';

class FakeD1Statement {
  constructor(db, sql) { this.db = db; this.sql = sql.replace(/\s+/g, ' ').trim(); this.args = []; }
  bind(...args) { this.args = args; return this; }
  async first() {
    const { db, sql, args } = this;
    if (sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) return db.sessions.get(args[0]) ?? null;
    if (sql.startsWith('SELECT payload FROM users')) return db.users.get(args[0]) ?? null;
    if (sql.startsWith('SELECT payload, version, updated_at FROM user_state')) return db.userState.get(args[0]) ?? null;
    throw new Error(`Unsupported fake D1 first(): ${sql}`);
  }
  async run() {
    const { db, sql, args } = this;
    if (sql.startsWith('INSERT INTO user_state')) {
      db.userState.set(args[0], { payload: args[1], version: args[2], updated_at: args[3] });
      return { success: true };
    }
    if (sql === 'DELETE FROM sessions WHERE token = ?') { db.sessions.delete(args[0]); return { success: true }; }
    throw new Error(`Unsupported fake D1 run(): ${sql}`);
  }
}

class FakeD1 {
  constructor() {
    this.users = new Map([['pcu_test', { payload: JSON.stringify({ userId: 'pcu_test', identities: [], preferredName: 'Test', createdAt: '2026-09-02T00:00:00.000Z', roles: [] }) }]]);
    this.sessions = new Map([['pcs_test', { token: 'pcs_test', user_id: 'pcu_test', expires_at: Date.now() + 60_000 }]]);
    this.userState = new Map();
  }
  prepare(sql) { return new FakeD1Statement(this, sql); }
}

function request(method, body) {
  return new Request('https://pointcast.xyz/api/me/state', {
    method,
    headers: { cookie: 'pc_session=pcs_test', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('user state is session-gated, allow-listed, and last-writer-wins per key', async () => {
  const env = { AUTH_DB: new FakeD1() };
  const first = await onRequestPut({ request: request('PUT', {
    payload: {
      mood: { updatedAt: 100, value: 'quiet' },
      passportStamps: { updatedAt: 100, value: { first: { at: '2026-09-02' } } },
    },
  }), env });
  assert.equal(first.status, 200);

  const second = await onRequestPut({ request: request('PUT', {
    payload: {
      mood: { updatedAt: 99, value: 'hype' },
      library: { updatedAt: 110, value: ['/passport'] },
    },
  }), env });
  const result = await second.json();
  assert.equal(result.payload.mood.value, 'quiet');
  assert.deepEqual(result.payload.library.value, ['/passport']);
  assert.equal(result.version, 2);

  const loaded = await onRequestGet({ request: request('GET'), env });
  assert.deepEqual((await loaded.json()).payload, result.payload);

  const unknown = await onRequestPut({ request: request('PUT', {
    payload: { admin: { updatedAt: 120, value: true } },
  }), env });
  assert.equal(unknown.status, 400);
});

test('the client uses fake fetch to hydrate legacy local state and writes a timestamped payload', async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  const values = new Map([['pc:mood', 'quiet']]);
  const eventTarget = new EventTarget();
  globalThis.window = Object.assign(eventTarget, {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
    setTimeout,
    clearTimeout,
  });
  globalThis.document = {};
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (url === '/api/auth/session') return Response.json({ user: { userId: 'pcu_test' } });
    if (url === '/api/me/state' && (!init.method || init.method === 'GET')) {
      return Response.json({ payload: { mood: { updatedAt: 1, value: 'hype' } } });
    }
    return Response.json({ ok: true, payload: JSON.parse(init.body).payload });
  };

  try {
    const state = await import(`../src/lib/me-state.ts?fake-fetch=${Date.now()}`);
    await state.hydrateMeState();
    assert.equal(values.get('pc:mood'), 'quiet');
    await state.flushMeState();
    const put = calls.find((call) => call.url === '/api/me/state' && call.init.method === 'PUT');
    assert.ok(put);
    assert.equal(JSON.parse(put.init.body).payload.mood.value, 'quiet');
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  }
});
