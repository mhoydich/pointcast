import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  IdentityConflictError,
  consumeAuthState,
  deleteSession,
  issueSession,
  readAuthState,
  readSessionFromRequest,
  upsertUserForIdentity,
  writeAuthState,
} from '../functions/api/auth/session.ts';

class FakeKV {
  constructor(entries = []) {
    this.values = new Map(entries);
    this.puts = [];
    this.deletes = [];
  }

  async get(key, type) {
    const value = this.values.get(key) ?? null;
    if (value === null || type !== 'json') return value;
    return JSON.parse(value);
  }

  async put(key, value, options) {
    this.values.set(key, value);
    this.puts.push({ key, value, options });
  }

  async delete(key) {
    this.values.delete(key);
    this.deletes.push(key);
  }
}

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    const { sql, args, db } = this;
    if (sql.startsWith('SELECT payload FROM users')) {
      const row = db.users.get(args[0]);
      return row ? { payload: row.payload } : null;
    }
    if (sql.startsWith('SELECT user_id FROM identities')) {
      const row = db.identities.get(`${args[0]}:${args[1]}`);
      return row ? { user_id: row.user_id } : null;
    }
    if (sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) {
      const row = db.sessions.get(args[0]);
      return row ? { ...row } : null;
    }
    if (sql.startsWith('SELECT payload, expires_at FROM oauth_states')) {
      const row = db.oauthStates.get(args[0]);
      return row ? { ...row } : null;
    }
    if (sql.startsWith('DELETE FROM oauth_states') && sql.includes('RETURNING')) {
      const row = db.oauthStates.get(args[0]) ?? null;
      db.oauthStates.delete(args[0]);
      return row ? { ...row } : null;
    }
    throw new Error(`Unsupported fake D1 first(): ${sql}`);
  }

  async run() {
    const { sql, args, db } = this;
    if (sql === 'DELETE FROM sessions WHERE expires_at <= ?') {
      for (const [token, row] of db.sessions) {
        if (row.expires_at <= args[0]) db.sessions.delete(token);
      }
    } else if (sql === 'DELETE FROM oauth_states WHERE expires_at <= ?') {
      for (const [state, row] of db.oauthStates) {
        if (row.expires_at <= args[0]) db.oauthStates.delete(state);
      }
    } else if (sql.startsWith('INSERT INTO users')) {
      db.users.set(args[0], { id: args[0], payload: args[1], created_at: args[2] });
    } else if (sql.startsWith('INSERT INTO identities')) {
      db.identities.set(`${args[0]}:${args[1]}`, {
        provider: args[0], id: args[1], user_id: args[2], payload: args[3],
      });
    } else if (sql.startsWith('INSERT INTO sessions')) {
      db.sessions.set(args[0], { token: args[0], user_id: args[1], expires_at: args[2] });
    } else if (sql.startsWith('INSERT INTO oauth_states')) {
      db.oauthStates.set(args[0], { payload: args[1], expires_at: args[2] });
    } else if (sql === 'DELETE FROM sessions WHERE token = ?') {
      db.sessions.delete(args[0]);
    } else if (sql === 'DELETE FROM oauth_states WHERE state = ?') {
      db.oauthStates.delete(args[0]);
    } else {
      throw new Error(`Unsupported fake D1 run(): ${sql}`);
    }
    return { success: true };
  }
}

class FakeD1 {
  constructor() {
    this.users = new Map();
    this.identities = new Map();
    this.sessions = new Map();
    this.oauthStates = new Map();
    this.batchCalls = 0;
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  async batch(statements) {
    this.batchCalls += 1;
    return Promise.all(statements.map((statement) => statement.run()));
  }
}

function identity(id = 'tz1-test-address') {
  return {
    provider: 'kukai',
    id,
    name: id,
    verifiedAt: new Date().toISOString(),
  };
}

function sessionRequest(token) {
  return new Request('https://pointcast.xyz/api/auth/session', {
    headers: { cookie: `pc_session=${token}` },
  });
}

test('the AUTH_DB binding points Wrangler at the complete auth migration', async () => {
  const [config, migration] = await Promise.all([
    readFile(new URL('../wrangler.toml', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8'),
  ]);

  assert.match(config, /\[\[d1_databases\]\][\s\S]*binding = "AUTH_DB"/);
  assert.match(config, /database_name = "pointcast-auth"/);
  assert.match(config, /database_id = "REPLACE_ME"/);
  assert.match(config, /migrations_dir = "migrations\/auth"/);
  for (const table of ['users', 'identities', 'sessions', 'oauth_states']) {
    assert.match(migration, new RegExp(`CREATE TABLE ${table}`));
  }
  assert.match(migration, /PRIMARY KEY \(provider, id\)/);
  assert.match(migration, /token TEXT PRIMARY KEY/);
  assert.match(migration, /state TEXT PRIMARY KEY/);
  assert.match(migration, /sessions_user_id_idx/);
  assert.match(migration, /sessions_expires_at_idx/);
  assert.match(migration, /oauth_states_expires_at_idx/);
});

test('AUTH_DB is preferred for users, identities, sessions, and expiring auth state', async () => {
  const db = new FakeD1();
  const kv = new FakeKV();
  const env = { AUTH_DB: db, USERS: kv };

  const user = await upsertUserForIdentity(env, identity(), { roles: ['broadcaster'] });
  const session = await issueSession(env, user.userId);
  await writeAuthState(env, 'oauth-state:google:test', { nonce: 'n1' }, 600);

  assert.equal(kv.puts.length, 0);
  assert.equal(db.users.size, 1);
  assert.equal(db.identities.get('kukai:tz1-test-address').user_id, user.userId);
  assert.equal(db.sessions.get(session.sessionToken).user_id, user.userId);
  assert.ok(db.oauthStates.get('oauth-state:google:test').expires_at > Date.now());
  assert.ok(db.batchCalls >= 3);

  const current = await readSessionFromRequest(sessionRequest(session.sessionToken), env);
  assert.equal(current?.user.userId, user.userId);
  assert.equal((await readAuthState(env, 'oauth-state:google:test'))?.nonce, 'n1');
  assert.deepEqual(await consumeAuthState(env, 'oauth-state:google:test'), { nonce: 'n1' });
  assert.equal(await consumeAuthState(env, 'oauth-state:google:test'), null);
});

test('KV remains a complete fallback when AUTH_DB is unbound', async () => {
  const kv = new FakeKV();
  const env = { USERS: kv };

  const user = await upsertUserForIdentity(env, identity('tz1-kv'));
  const session = await issueSession(env, user.userId, 120);
  await writeAuthState(env, 'oauth-state:google:kv', { nonce: 'kv-nonce' }, 600);

  assert.equal(kv.values.get('identity:kukai:tz1-kv'), user.userId);
  assert.equal(kv.puts.find(({ key }) => key === `session:${session.sessionToken}`).options.expirationTtl, 120);
  assert.equal(kv.puts.find(({ key }) => key === 'oauth-state:google:kv').options.expirationTtl, 600);
  assert.equal((await readSessionFromRequest(sessionRequest(session.sessionToken), env))?.user.userId, user.userId);
  assert.deepEqual(await consumeAuthState(env, 'oauth-state:google:kv'), { nonce: 'kv-nonce' });
  assert.equal(kv.values.has('oauth-state:google:kv'), false);
});

test('a legacy KV session and user read through into D1 without logging the browser out', async () => {
  const legacyUser = {
    userId: 'pcu_legacy',
    createdAt: '2026-08-01T00:00:00.000Z',
    identities: [identity('tz1-legacy')],
    preferredName: 'Legacy member',
    roles: [],
  };
  const legacySession = {
    userId: legacyUser.userId,
    sessionToken: 'pcs_legacy',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  const kv = new FakeKV([
    [`user:${legacyUser.userId}`, JSON.stringify(legacyUser)],
    ['identity:kukai:tz1-legacy', legacyUser.userId],
    [`session:${legacySession.sessionToken}`, JSON.stringify(legacySession)],
  ]);
  const db = new FakeD1();
  const env = { AUTH_DB: db, USERS: kv };

  const current = await readSessionFromRequest(sessionRequest(legacySession.sessionToken), env);
  assert.deepEqual(current, { session: legacySession, user: legacyUser });
  assert.ok(db.users.has(legacyUser.userId));
  assert.equal(db.identities.get('kukai:tz1-legacy').user_id, legacyUser.userId);
  assert.equal(db.sessions.get(legacySession.sessionToken).user_id, legacyUser.userId);

  await deleteSession(env, legacySession.sessionToken);
  assert.equal(kv.values.has(`session:${legacySession.sessionToken}`), false);
  assert.equal(await readSessionFromRequest(sessionRequest(legacySession.sessionToken), env), null);
});

test('D1 expiry checks reject stale rows and writes clean up expired records', async () => {
  const db = new FakeD1();
  const env = { AUTH_DB: db };
  db.oauthStates.set('expired-state', { payload: JSON.stringify({ old: true }), expires_at: Date.now() - 1 });
  db.sessions.set('expired-session', { token: 'expired-session', user_id: 'gone', expires_at: Date.now() - 1 });

  assert.equal(await readAuthState(env, 'expired-state'), null);
  await writeAuthState(env, 'fresh-state', { fresh: true }, 600);

  assert.equal(db.oauthStates.has('expired-state'), false);
  assert.equal(db.sessions.has('expired-session'), false);
  assert.deepEqual(await consumeAuthState(env, 'fresh-state'), { fresh: true });
});

test('D1 identity uniqueness still blocks linking one identity to two users', async () => {
  const db = new FakeD1();
  const env = { AUTH_DB: db };
  const first = await upsertUserForIdentity(env, identity('tz1-unique'));

  await assert.rejects(
    upsertUserForIdentity(env, identity('tz1-unique'), { currentUserId: 'pcu_someone_else' }),
    IdentityConflictError,
  );
  assert.equal(db.identities.get('kukai:tz1-unique').user_id, first.userId);
});
