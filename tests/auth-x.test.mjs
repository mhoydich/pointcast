import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet as startX, onRequestDelete as disconnectX } from '../functions/api/auth/x.ts';
import { onRequestDelete as deletePasskey } from '../functions/api/auth/passkey/credentials.ts';
import { deleteOwnedPasskey, PasskeyLastSignInError } from '../functions/api/auth/passkey/_shared.ts';
import { onRequestGet as callbackX } from '../functions/api/auth/x/callback.ts';
import { X_STATE_COOKIE, pkceChallenge, removeXIdentity, saveXIdentity } from '../functions/api/auth/x/_shared.ts';
import { IdentityConflictError, issueSession, loadUserById, upsertUserForIdentity } from '../functions/api/auth/session.ts';

// Match Workers' Web Crypto extension while running the route code in Node.
crypto.subtle.timingSafeEqual ??= (a, b) => timingSafeEqual(Buffer.from(a), Buffer.from(b));

class SQLiteD1 {
  constructor({ migrated = true } = {}) {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec(readFileSync(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8'));
    this.sqlite.exec('ALTER TABLE sessions ADD COLUMN authenticated_at INTEGER NOT NULL DEFAULT 0');
    this.sqlite.exec(readFileSync(new URL('../migrations/auth/0003_passkeys.sql', import.meta.url), 'utf8'));
    if (migrated) this.sqlite.exec(readFileSync(new URL('../migrations/auth/0015_x_identity.sql', import.meta.url), 'utf8'));
  }
  prepare(sql) {
    const db = this;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() { return db.sqlite.prepare(sql).get(...this.args) ?? null; },
      async run() {
        const result = db.sqlite.prepare(sql).run(...this.args);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
      execute() {
        const result = db.sqlite.prepare(sql).run(...this.args);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
  }
  async batch(statements) {
    if (this.beforeBatch) {
      const hook = this.beforeBatch;
      this.beforeBatch = null;
      await hook();
    }
    this.sqlite.exec('BEGIN');
    try {
      const results = statements.map((statement) => statement.execute());
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) { this.sqlite.exec('ROLLBACK'); throw error; }
  }
}

function environment(options) {
  return { AUTH_DB: new SQLiteD1(options), X_CLIENT_ID: 'test-client', X_CLIENT_SECRET: 'test-secret' };
}
function request(path, cookie = '', init = {}) {
  return new Request(`https://pointcast.xyz${path}`, { ...init, headers: { ...(cookie ? { cookie } : {}), ...init.headers } });
}
function identity(id, username = `member${id}`) {
  return { provider: 'x', id, username, name: `Member ${id}`, verifiedAt: new Date().toISOString() };
}
async function googleMember(env, id = 'google-member') {
  const user = await upsertUserForIdentity(env, { provider: 'google', id, name: 'Existing member', verifiedAt: new Date().toISOString() });
  const session = await issueSession(env, user.userId);
  return { user, session, cookie: `pc_session=${session.sessionToken}` };
}
async function start(env, { cookie = '', intent = 'login', returnTo = '/me' } = {}) {
  const response = await startX({ env, request: request(`/api/auth/x?intent=${intent}&returnTo=${encodeURIComponent(returnTo)}`, cookie) });
  const target = new URL(response.headers.get('location'));
  const flowCookie = response.headers.get('set-cookie').split(';')[0];
  return { response, target, state: target.searchParams.get('state'), cookie: [cookie, flowCookie].filter(Boolean).join('; ') };
}
function result(response, key = 'auth_error') { return new URL(response.headers.get('location')).searchParams.get(key); }
function callbackRequest(flow, suffix = '&code=accepted-code') {
  return request(`/api/auth/x/callback?state=${flow.state}${suffix}`, flow.cookie);
}
function provider(t, { id = '123456', username = 'hello_member', tokenStatus = 200, profileStatus = 200, data } = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('/oauth2/token')) {
      return Response.json({ access_token: 'never-persist-this-token', token_type: 'bearer' }, { status: tokenStatus });
    }
    return Response.json(data ?? { data: { id, username, name: 'Hello member', profile_image_url: 'https://pbs.twimg.com/profile_images/member.jpg' } }, { status: profileStatus });
  });
  return calls;
}

test('availability fails closed without credentials, D1, or the identity migration', async () => {
  for (const env of [{}, { USERS: {} }, { ...environment(), X_CLIENT_SECRET: undefined }, environment({ migrated: false })]) {
    const response = await startX({ env, request: request('/api/auth/x?status=1') });
    assert.equal((await response.json()).available, false);
    const startResponse = await startX({ env, request: request('/api/auth/x') });
    assert.equal(result(startResponse), 'x-not-configured');
  }
  assert.equal((await (await startX({ env: environment(), request: request('/api/auth/x?status=1') })).json()).available, true);
});

test('X authorization uses PKCE S256, identity-only scopes, and a secure browser cookie', async () => {
  const env = environment();
  const flow = await start(env, { returnTo: '//attacker.example/steal' });
  assert.equal(flow.target.origin, 'https://x.com');
  assert.equal(flow.target.searchParams.get('scope'), 'tweet.read users.read');
  assert.equal(flow.target.searchParams.get('code_challenge_method'), 'S256');
  assert.match(flow.response.headers.get('set-cookie'), /__Host-pc_x_oauth=.*; Path=\/; HttpOnly; Secure; SameSite=Lax/);
  const stored = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM oauth_states').get().payload);
  assert.equal(flow.target.searchParams.get('code_challenge'), await pkceChallenge(stored.codeVerifier));
  assert.equal(stored.returnTo, '/me');
  assert.notEqual(stored.browserToken, flow.state);
  assert.equal(flow.target.searchParams.has('code_verifier'), false);
});

test('callback creates an X-backed profile and never persists provider tokens', async (t) => {
  const env = environment();
  const calls = provider(t);
  const flow = await start(env);
  const response = await callbackX({ env, request: callbackRequest(flow) });
  assert.equal(result(response, 'auth'), 'x');
  assert.match(response.headers.get('set-cookie'), /pc_session=/);
  assert.match(response.headers.get('set-cookie'), /__Host-pc_x_oauth=;.*Max-Age=0/);
  const user = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users').get().payload);
  assert.equal(user.identities[0].provider, 'x');
  assert.equal(user.identities[0].id, '123456');
  assert.equal(user.identities[0].username, 'hello_member');
  assert.equal(calls[0].init.headers.Authorization, `Basic ${btoa('test-client:test-secret')}`);
  assert.equal(calls[0].init.body.get('grant_type'), 'authorization_code');
  assert.equal(calls[1].init.headers.Authorization, 'Bearer never-persist-this-token');
  for (const table of ['users', 'identities', 'sessions', 'oauth_states']) {
    assert.doesNotMatch(JSON.stringify(env.AUTH_DB.sqlite.prepare(`SELECT * FROM ${table}`).all()), /never-persist-this-token|test-secret/);
  }
  assert.equal(result(await callbackX({ env, request: callbackRequest(flow) })), 'x-state-expired');
  assert.equal(calls.length, 2);
});

test('a returning stable X ID updates the handle without creating another user', async (t) => {
  const env = environment();
  const original = await saveXIdentity(env.AUTH_DB, identity('123456', 'old_handle'), null);
  provider(t, { username: 'new_handle' });
  const response = await callbackX({ env, request: callbackRequest(await start(env)) });
  assert.equal(result(response, 'auth'), 'x');
  const rows = env.AUTH_DB.sqlite.prepare('SELECT id, payload FROM users').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, original.userId);
  assert.equal(JSON.parse(rows[0].payload).identities[0].username, 'new_handle');
});

test('callback cannot be moved to another browser or origin, and does not consume their state', async (t) => {
  const env = environment();
  const calls = provider(t);
  const flow = await start(env);
  for (const badRequest of [
    request(`/api/auth/x/callback?state=${flow.state}&code=code`),
    request(`/api/auth/x/callback?state=${flow.state}&code=code`, `${X_STATE_COOKIE}=${'a'.repeat(43)}`),
    new Request(`https://other.example/api/auth/x/callback?state=${flow.state}&code=code`, { headers: { cookie: flow.cookie } }),
  ]) {
    assert.equal(result(await callbackX({ env, request: badRequest })), 'x-state-invalid');
  }
  assert.equal(calls.length, 0);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM oauth_states').get().n, 1);
});

test('expired state and provider denial fail without fetching or creating profiles', async (t) => {
  const env = environment();
  const calls = provider(t);
  const expired = await start(env);
  env.AUTH_DB.sqlite.prepare('UPDATE oauth_states SET expires_at = ?').run(Date.now() - 1);
  assert.equal(result(await callbackX({ env, request: callbackRequest(expired) })), 'x-state-expired');
  const denied = await start(env, { returnTo: '/me?panel=connections' });
  const response = await callbackX({ env, request: callbackRequest(denied, '&error=access_denied') });
  assert.equal(result(response), 'x-denied');
  assert.equal(new URL(response.headers.get('location')).searchParams.get('panel'), 'connections');
  assert.equal(calls.length, 0);
});

test('link requires fresh sign-in and binds the callback to the original session', async (t) => {
  const env = environment();
  const calls = provider(t);
  assert.equal(result((await start(env, { intent: 'link' })).response), 'x-sign-in-required');
  const member = await googleMember(env);
  env.AUTH_DB.sqlite.prepare('UPDATE sessions SET authenticated_at = ?').run(Date.now() - 16 * 60_000);
  assert.equal(result((await start(env, { intent: 'link', cookie: member.cookie })).response), 'x-fresh-sign-in-required');
  env.AUTH_DB.sqlite.prepare('UPDATE sessions SET authenticated_at = ?').run(Date.now());
  const flow = await start(env, { intent: 'link', cookie: member.cookie });
  const otherSession = await issueSession(env, member.user.userId);
  flow.cookie = flow.cookie.replace(member.session.sessionToken, otherSession.sessionToken);
  assert.equal(result(await callbackX({ env, request: callbackRequest(flow) })), 'x-session-changed');
  assert.equal(calls.length, 0);
});

test('explicit linking preserves profile name, existing identity, roles, and custom fields', async (t) => {
  const env = environment();
  const member = await googleMember(env);
  env.AUTH_DB.sqlite.prepare("UPDATE users SET payload = json_set(payload, '$.customField', 'keep-me', '$.roles', json('[\"broadcaster\"]'))").run();
  provider(t);
  const flow = await start(env, { intent: 'link', cookie: member.cookie });
  const response = await callbackX({ env, request: callbackRequest(flow) });
  assert.equal(result(response, 'auth'), 'x-linked');
  const user = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users').get().payload);
  assert.equal(user.userId, member.user.userId);
  assert.equal(user.preferredName, 'Existing member');
  assert.equal(user.customField, 'keep-me');
  assert.deepEqual(user.roles, ['broadcaster']);
  assert.deepEqual(user.identities.map(({ provider }) => provider), ['google', 'x']);
});

test('login while signed in does not silently link or merge the two accounts', async (t) => {
  const env = environment();
  const member = await googleMember(env);
  provider(t);
  const response = await callbackX({ env, request: callbackRequest(await start(env, { cookie: member.cookie })) });
  assert.equal(result(response, 'auth'), 'x');
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 2);
  const original = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users WHERE id = ?').get(member.user.userId).payload);
  assert.deepEqual(original.identities.map(({ provider }) => provider), ['google']);
});

test('link rejects an X ID that belongs to another PointCast member', async (t) => {
  const env = environment();
  const owner = await saveXIdentity(env.AUTH_DB, identity('123456'), null);
  const member = await googleMember(env);
  provider(t);
  const response = await callbackX({ env, request: callbackRequest(await start(env, { intent: 'link', cookie: member.cookie })) });
  assert.equal(result(response), 'x-already-linked');
  assert.equal(env.AUTH_DB.sqlite.prepare("SELECT user_id FROM identities WHERE provider = 'x'").get().user_id, owner.userId);
});

test('competing claims cannot steal an X identity or leave orphan accounts', async () => {
  const env = environment();
  const results = await Promise.allSettled([
    saveXIdentity(env.AUTH_DB, identity('123456'), null),
    saveXIdentity(env.AUTH_DB, identity('123456'), null),
  ]);
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 1);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM identities').get().n, 1);
});

test('competing X accounts cannot overwrite the same profile connection', async () => {
  const env = environment();
  const member = await googleMember(env);
  const results = await Promise.allSettled([
    saveXIdentity(env.AUTH_DB, identity('111'), member.user.userId),
    saveXIdentity(env.AUTH_DB, identity('222'), member.user.userId),
  ]);
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
  const user = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users').get().payload);
  const row = env.AUTH_DB.sqlite.prepare("SELECT id FROM identities WHERE provider = 'x'").get();
  assert.equal(user.identities.filter(({ provider }) => provider === 'x').length, 1);
  assert.equal(user.identities.find(({ provider }) => provider === 'x').id, row.id);
});

test('provider token failure, lookup failure, and malformed identities never issue sessions', async (t) => {
  for (const [options, expected] of [
    [{ tokenStatus: 401 }, 'x-token-failed'],
    [{ profileStatus: 429 }, 'x-profile-failed'],
    [{ data: { data: { id: 'not-a-stable-id', username: 'member' } } }, 'x-profile-failed'],
  ]) {
    const env = environment();
    provider(t, options);
    const response = await callbackX({ env, request: callbackRequest(await start(env)) });
    assert.equal(result(response), expected);
    assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 0);
    t.mock.restoreAll();
  }
});

test('disconnect requires same origin, fresh auth, owned X ID, and another sign-in method', async () => {
  const env = environment();
  const user = await saveXIdentity(env.AUTH_DB, identity('123456'), null);
  const session = await issueSession(env, user.userId);
  const cookie = `pc_session=${session.sessionToken}`;
  const remove = (headers = {}, id = '123456') => disconnectX({ env, request: request('/api/auth/x', cookie, {
    method: 'DELETE', headers: { origin: 'https://pointcast.xyz', 'content-type': 'application/json', ...headers }, body: JSON.stringify({ id }),
  }) });
  assert.equal((await remove({ origin: 'https://attacker.example' })).status, 403);
  assert.equal((await remove({}, '999')).status, 404);
  assert.equal((await (await remove()).json()).reason, 'x-last-sign-in-method');
  await upsertUserForIdentity(env, { provider: 'google', id: 'backup', name: 'Backup', verifiedAt: new Date().toISOString() }, { currentUserId: user.userId });
  env.AUTH_DB.sqlite.prepare('UPDATE sessions SET authenticated_at = ?').run(Date.now() - 16 * 60_000);
  assert.equal((await (await remove()).json()).reason, 'fresh-sign-in-required');
  env.AUTH_DB.sqlite.prepare('UPDATE sessions SET authenticated_at = ?').run(Date.now());
  assert.deepEqual(await (await remove()).json(), { ok: true, removed: '123456' });
  const saved = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users').get().payload);
  assert.deepEqual(saved.identities.map(({ provider }) => provider), ['google']);
  assert.equal(env.AUTH_DB.sqlite.prepare("SELECT count(*) AS n FROM identities WHERE provider = 'x'").get().n, 0);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 1);
});


test('stale generic sign-in cannot resurrect an X account detached and relinked to another member', async () => {
  const env = environment();
  const original = await googleMember(env, 'original-google');
  const recipient = await googleMember(env, 'recipient-google');
  await saveXIdentity(env.AUTH_DB, identity('123456'), original.user.userId);
  // Interleave after the generic sign-in reads the original profile, but
  // before it saves: detach X, then link that same X ID to another member.
  env.AUTH_DB.beforeBatch = async () => {
    assert.equal(await removeXIdentity(env.AUTH_DB, original.user.userId, '123456'), true);
    await saveXIdentity(env.AUTH_DB, identity('123456'), recipient.user.userId);
  };
  const saved = await upsertUserForIdentity(env, {
    provider: 'google', id: 'original-google', name: 'Google refreshed', verifiedAt: new Date().toISOString(),
  });
  assert.equal(saved.userId, original.user.userId);
  assert.deepEqual(saved.identities.map(({ provider }) => provider), ['google']);
  assert.equal(env.AUTH_DB.sqlite.prepare("SELECT user_id FROM identities WHERE provider = 'x'").get().user_id, recipient.user.userId);
  const persisted = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users WHERE id = ?').get(original.user.userId).payload);
  assert.deepEqual(persisted.identities.map(({ provider }) => provider), ['google']);
});

test('generic sign-in preserves a concurrent X link and profile edits and does not restore removed roles', async () => {
  const env = environment();
  const member = await googleMember(env);
  env.AUTH_DB.sqlite.prepare("UPDATE users SET payload = json_set(payload, '$.roles', json(?))").run(JSON.stringify(['broadcaster']));
  env.AUTH_DB.beforeBatch = async () => {
    await saveXIdentity(env.AUTH_DB, identity('123456'), member.user.userId);
    env.AUTH_DB.sqlite.prepare("UPDATE users SET payload = json_set(payload, '$.preferredName', 'Fresh name', '$.customField', 'fresh value', '$.roles', json('[]'))").run();
  };
  const saved = await upsertUserForIdentity(env, {
    provider: 'google', id: 'google-member', name: 'Provider name', verifiedAt: new Date().toISOString(),
  });
  assert.equal(saved.preferredName, 'Fresh name');
  assert.equal(saved.customField, 'fresh value');
  assert.deepEqual(saved.roles, []);
  assert.deepEqual(saved.identities.map(({ provider }) => provider), ['google', 'x']);
});

test('concurrent generic claims cannot reassign an identity or create an orphan member', async () => {
  const env = environment();
  const credential = { provider: 'google', id: 'contended-google', name: 'Member', verifiedAt: new Date().toISOString() };
  const results = await Promise.allSettled([
    upsertUserForIdentity(env, credential), upsertUserForIdentity(env, credential),
  ]);
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.equal(results.find(({ status }) => status === 'rejected').reason instanceof IdentityConflictError, true);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 1);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM identities').get().n, 1);
});

test('legacy KV migration preserves profile data but never imports an X claim', async () => {
  const env = environment();
  const legacy = {
    userId: 'pcu_legacy', createdAt: new Date().toISOString(), preferredName: 'Legacy member',
    identities: [{ provider: 'google', id: 'legacy-google', name: 'Legacy member', verifiedAt: new Date().toISOString() }, identity('123456')],
    roles: ['broadcaster'], customField: 'legacy custom data',
  };
  env.USERS = { async get(key) { return key === 'user:pcu_legacy' ? JSON.stringify(legacy) : null; } };
  const loaded = await loadUserById(env, legacy.userId);
  assert.equal(loaded.customField, 'legacy custom data');
  assert.deepEqual(loaded.roles, ['broadcaster']);
  assert.deepEqual(loaded.identities.map(({ provider }) => provider), ['google']);
  assert.equal(env.AUTH_DB.sqlite.prepare("SELECT count(*) AS n FROM identities WHERE provider = 'x'").get().n, 0);
  await assert.rejects(upsertUserForIdentity(env, identity('123456')), /x-oauth-required/);
});


async function memberWithPasskeyAndX(env) {
  const user = await upsertUserForIdentity(env, {
    provider: 'passkey', id: 'credential-1', name: 'My device', verifiedAt: new Date().toISOString(),
  });
  env.AUTH_DB.sqlite.prepare(`INSERT INTO passkey_credentials
    (credential_id, user_id, public_key, counter, transports, created_at, label)
    VALUES (?, ?, ?, 0, '[]', ?, 'My device')`)
    .run('credential-1', user.userId, new Uint8Array([1]), new Date().toISOString());
  return saveXIdentity(env.AUTH_DB, identity('123456'), user.userId);
}

test('passkey deletion racing X disconnect retains the final method and does not restore X', async () => {
  const env = environment();
  const user = await memberWithPasskeyAndX(env);
  env.AUTH_DB.beforeBatch = async () => {
    assert.equal(await removeXIdentity(env.AUTH_DB, user.userId, '123456'), true);
  };
  await assert.rejects(deleteOwnedPasskey(env.AUTH_DB, user, 'credential-1'), PasskeyLastSignInError);
  const saved = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users').get().payload);
  assert.deepEqual(saved.identities.map(({ provider }) => provider), ['passkey']);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM passkey_credentials').get().n, 1);
});

test('X disconnect racing passkey deletion retains X as the final method', async () => {
  const env = environment();
  const user = await memberWithPasskeyAndX(env);
  env.AUTH_DB.beforeBatch = async () => {
    assert.equal(await deleteOwnedPasskey(env.AUTH_DB, user, 'credential-1'), true);
  };
  assert.equal(await removeXIdentity(env.AUTH_DB, user.userId, '123456'), false);
  const saved = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users').get().payload);
  assert.deepEqual(saved.identities.map(({ provider }) => provider), ['x']);
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT count(*) AS n FROM passkey_credentials').get().n, 0);
});

test('passkey removal exposes a clear last-sign-in-method error', async () => {
  const env = environment();
  const user = await memberWithPasskeyAndX(env);
  assert.equal(await removeXIdentity(env.AUTH_DB, user.userId, '123456'), true);
  const session = await issueSession(env, user.userId);
  const response = await deletePasskey({ env, request: request('/api/auth/passkey/credentials', `pc_session=${session.sessionToken}`, {
    method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credentialId: 'credential-1' }),
  }) });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).reason, 'passkey-last-sign-in-method');
});
