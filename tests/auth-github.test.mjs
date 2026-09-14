import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet as startGitHub } from '../functions/api/auth/github.ts';
import { onRequestGet as callbackGitHub } from '../functions/api/auth/github/callback.ts';
import { githubIdentity, githubPkceChallenge, GITHUB_STATE_COOKIE } from '../functions/api/auth/github/_shared.ts';
import { issueSession, readSessionFromRequest, upsertUserForIdentity } from '../functions/api/auth/session.ts';

crypto.subtle.timingSafeEqual ??= (a, b) => timingSafeEqual(Buffer.from(a), Buffer.from(b));

class SQLiteD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec(readFileSync(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8'));
    this.sqlite.exec('ALTER TABLE sessions ADD COLUMN authenticated_at INTEGER NOT NULL DEFAULT 0');
  }
  prepare(sql) {
    const db = this;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() { return db.sqlite.prepare(sql).get(...this.args) ?? null; },
      async run() { return this.execute(); },
      execute() {
        const result = db.sqlite.prepare(sql).run(...this.args);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
  }
  async batch(statements) {
    if (this.beforeBatch) { const hook = this.beforeBatch; this.beforeBatch = null; await hook(); }
    this.sqlite.exec('BEGIN');
    try {
      const results = statements.map((statement) => statement.execute());
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) { this.sqlite.exec('ROLLBACK'); throw error; }
  }
}

function environment() { return { AUTH_DB: new SQLiteD1(), GITHUB_CLIENT_ID: 'fixture-client', GITHUB_CLIENT_SECRET: 'fixture-secret' }; }
function request(path, cookie = '', init = {}) {
  return new Request(`https://pointcast.xyz${path}`, { ...init, headers: { ...(cookie ? { cookie } : {}), ...init.headers } });
}
function result(response, key = 'auth_error') { return new URL(response.headers.get('location')).searchParams.get(key); }
function identity(id = '123', username = 'octocat') {
  return { provider: 'github', id, username, name: 'Fixture member', verifiedAt: new Date().toISOString() };
}
async function member(env, id = 'existing-google') {
  const user = await upsertUserForIdentity(env, { provider: 'google', id, name: 'Existing member', verifiedAt: new Date().toISOString() }, { roles: ['broadcaster'] });
  const session = await issueSession(env, user.userId);
  return { user, session, cookie: `pc_session=${session.sessionToken}` };
}
async function start(env, { cookie = '', intent = 'login', returnTo = '/shwa/' } = {}) {
  const response = await startGitHub({ env, request: request(`/api/auth/github?intent=${intent}&returnTo=${encodeURIComponent(returnTo)}`, cookie) });
  const target = new URL(response.headers.get('location'));
  const flowCookie = response.headers.get('set-cookie').split(';')[0];
  return { response, target, state: target.searchParams.get('state'), cookie: [cookie, flowCookie].filter(Boolean).join('; ') };
}
function callbackRequest(flow, suffix = '&code=fixture-code') {
  return request(`/api/auth/github/callback?state=${flow.state}${suffix}`, flow.cookie);
}
function provider(t, { scope = '', tokenStatus = 200, profileStatus = 200, data, token } = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    if (url === 'https://github.com/login/oauth/access_token') {
      return Response.json(token ?? { access_token: 'never-store-github-token', token_type: 'bearer', scope }, { status: tokenStatus });
    }
    assert.equal(url, 'https://api.github.com/user');
    return Response.json(data ?? {
      id: 123, login: 'octocat', name: 'Octo Cat', type: 'User',
      avatar_url: 'https://avatars.githubusercontent.com/u/123',
      email: 'victim@example.com', site_admin: true, private_repos: 700,
    }, { status: profileStatus });
  });
  return calls;
}

test('GitHub availability requires configured credentials and the existing D1 auth schema', async () => {
  const absent = environment();
  absent.AUTH_DB.sqlite.exec('DROP TABLE oauth_states');
  for (const env of [{}, { USERS: {} }, { ...environment(), GITHUB_CLIENT_SECRET: undefined }, absent]) {
    const response = await startGitHub({ env, request: request('/api/auth/github?status=1') });
    assert.deepEqual(await response.json(), { ok: true, provider: 'github', available: false });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(result(await startGitHub({ env, request: request('/api/auth/github') })), 'github-not-configured');
  }
  const response = await startGitHub({ env: environment(), request: request('/api/auth/github?status=1') });
  assert.deepEqual(await response.json(), { ok: true, provider: 'github', available: true });
});

test('GitHub start binds the browser and PKCE verifier, requests zero scopes, and validates returnTo', async () => {
  const env = environment();
  const flow = await start(env, { returnTo: '//attacker.example/steal' });
  assert.equal(flow.target.origin, 'https://github.com');
  assert.equal(flow.target.searchParams.get('scope'), '');
  assert.equal(flow.target.searchParams.get('prompt'), 'select_account');
  assert.equal(flow.target.searchParams.get('redirect_uri'), 'https://pointcast.xyz/api/auth/github/callback');
  assert.equal(flow.target.searchParams.get('code_challenge_method'), 'S256');
  const stored = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM oauth_states').get().payload);
  assert.equal(flow.target.searchParams.get('code_challenge'), await githubPkceChallenge(stored.codeVerifier));
  assert.equal(stored.returnTo, '/me');
  assert.notEqual(stored.browserToken, flow.state);
  assert.equal(flow.target.searchParams.has('code_verifier'), false);
  assert.doesNotMatch(flow.target.href, /fixture-secret/);
  assert.match(flow.response.headers.get('set-cookie'), /__Host-pc_github_oauth=.*; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  assert.equal(flow.response.headers.get('referrer-policy'), 'no-referrer');
  const insecure = await startGitHub({ env, request: new Request('http://pointcast.xyz/api/auth/github') });
  assert.equal(result(insecure), 'github-secure-origin-required');
});

test('GitHub callback creates the shared PointCast session and persists only public identity fields', async (t) => {
  const env = environment();
  const calls = provider(t);
  const flow = await start(env);
  const stored = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM oauth_states').get().payload);
  const response = await callbackGitHub({ env, request: callbackRequest(flow) });
  assert.equal(result(response, 'auth'), 'github');
  assert.equal(new URL(response.headers.get('location')).pathname, '/shwa/');
  assert.match(response.headers.get('set-cookie'), /pc_session=.*HttpOnly; Secure; SameSite=Lax/);
  assert.match(response.headers.get('set-cookie'), /__Host-pc_github_oauth=;.*Max-Age=0/);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith('pc_session=')).split(';')[0];
  const restored = await readSessionFromRequest(request('/api/auth/session', cookie), env);
  assert.equal(restored.user.identities[0].provider, 'github');
  assert.equal(restored.user.identities[0].id, '123');
  assert.equal(restored.user.identities[0].username, 'octocat');
  assert.deepEqual(restored.user.roles, []);
  assert.equal(calls[0].init.body.get('client_secret'), 'fixture-secret');
  assert.equal(calls[0].init.body.get('code_verifier'), stored.codeVerifier);
  assert.equal(calls[1].init.headers.Authorization, 'Bearer never-store-github-token');
  assert.equal(calls[1].init.headers['User-Agent'], 'PointCast-Authentication');
  for (const table of ['users', 'identities', 'sessions', 'oauth_states']) {
    assert.doesNotMatch(JSON.stringify(env.AUTH_DB.sqlite.prepare(`SELECT * FROM ${table}`).all()), /never-store-github-token|fixture-secret|victim@example.com|private_repos|site_admin/);
  }
  assert.equal(calls.length, 2);
});

test('the stable GitHub ID restores the same account when its username changes', async (t) => {
  const env = environment();
  const original = await upsertUserForIdentity(env, identity());
  provider(t, { data: { id: 123, login: 'new-name', type: 'User', name: 'New name' } });
  const response = await callbackGitHub({ env, request: callbackRequest(await start(env)) });
  assert.equal(result(response, 'auth'), 'github');
  const users = env.AUTH_DB.sqlite.prepare('SELECT id, payload FROM users').all();
  assert.equal(users.length, 1);
  assert.equal(users[0].id, original.userId);
  const user = JSON.parse(users[0].payload);
  assert.equal(user.identities[0].username, 'new-name');
  assert.equal(user.preferredName, original.preferredName);
});

test('forwarded callback URLs fail browser binding before consuming state or contacting GitHub', async (t) => {
  const env = environment();
  const flow = await start(env);
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Browser mismatch must not call GitHub'); });
  for (const cookie of ['', `${GITHUB_STATE_COOKIE}=${'a'.repeat(43)}`]) {
    const response = await callbackGitHub({ env, request: request(`/api/auth/github/callback?state=${flow.state}&code=fixture`, cookie) });
    assert.equal(result(response), 'github-state-invalid');
  }
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM oauth_states').get().n, 1);
  const wrongOrigin = new Request(callbackRequest(flow).url.replace('pointcast.xyz', 'preview.example'), { headers: { cookie: flow.cookie } });
  assert.equal(result(await callbackGitHub({ env, request: wrongOrigin })), 'github-state-invalid');
});

test('GitHub callback state is consumed atomically across concurrent callbacks', async (t) => {
  const env = environment();
  const calls = provider(t);
  const flow = await start(env);
  const responses = await Promise.all([1, 2].map(() => callbackGitHub({ env, request: callbackRequest(flow) })));
  assert.equal(responses.filter((response) => result(response, 'auth') === 'github').length, 1);
  assert.equal(responses.filter((response) => result(response) === 'github-state-expired').length, 1);
  assert.equal(calls.length, 2);
  assert.equal(result(await callbackGitHub({ env, request: callbackRequest(flow) })), 'github-state-expired');
});

test('cancellation and expired state return safely without issuing a session', async (t) => {
  const env = environment();
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Rejected flow must not call GitHub'); });
  const denied = await callbackGitHub({ env, request: callbackRequest(await start(env), '&error=access_denied&error_description=untrusted') });
  assert.equal(result(denied), 'github-denied');
  assert.equal(new URL(denied.headers.get('location')).pathname, '/shwa/');
  assert.doesNotMatch(denied.headers.get('location'), /untrusted/);
  const flow = await start(env);
  env.AUTH_DB.sqlite.prepare('UPDATE oauth_states SET expires_at = ?').run(Date.now() - 1);
  assert.equal(result(await callbackGitHub({ env, request: callbackRequest(flow) })), 'github-state-expired');
  assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
});

test('linking requires explicit intent, a fresh session, and the same session at callback', async (t) => {
  const env = environment();
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Rejected linking must not call GitHub'); });
  const anonymous = await start(env, { intent: 'link' });
  assert.equal(result(anonymous.response), 'github-sign-in-required');
  const alice = await member(env, 'alice');
  const bob = await member(env, 'bob');
  const flow = await start(env, { cookie: alice.cookie, intent: 'link' });
  const changed = request(callbackRequest(flow).url.replace('https://pointcast.xyz', ''), flow.cookie.replace(alice.cookie, bob.cookie));
  assert.equal(result(await callbackGitHub({ env, request: changed })), 'github-session-changed');
  env.AUTH_DB.sqlite.prepare('UPDATE sessions SET authenticated_at = ? WHERE token = ?').run(Date.now() - 16 * 60_000, alice.session.sessionToken);
  assert.equal(result((await start(env, { cookie: alice.cookie, intent: 'link' })).response), 'github-fresh-sign-in-required');
});

test('GitHub links only to the explicitly chosen existing account and preserves its data', async (t) => {
  const env = environment();
  const existing = await member(env);
  env.AUTH_DB.sqlite.prepare("UPDATE users SET payload = json_set(payload, '$.customNote', 'keep this') WHERE id = ?").run(existing.user.userId);
  provider(t);
  const response = await callbackGitHub({ env, request: callbackRequest(await start(env, { cookie: existing.cookie, intent: 'link', returnTo: '/auth' })) });
  assert.equal(result(response, 'auth'), 'github-linked');
  const user = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users WHERE id = ?').get(existing.user.userId).payload);
  assert.equal(user.identities.length, 2);
  assert.equal(user.preferredName, 'Existing member');
  assert.equal(user.customNote, 'keep this');
  assert.deepEqual(user.roles, ['broadcaster']);
});

test('a matching email and an existing cookie never implicitly link a GitHub login', async (t) => {
  const env = environment();
  const existing = await member(env, 'victim@example.com');
  provider(t);
  const response = await callbackGitHub({ env, request: callbackRequest(await start(env, { cookie: existing.cookie, intent: 'login' })) });
  assert.equal(result(response, 'auth'), 'github');
  const users = env.AUTH_DB.sqlite.prepare('SELECT id, payload FROM users').all();
  assert.equal(users.length, 2);
  const untouched = JSON.parse(users.find((user) => user.id === existing.user.userId).payload);
  assert.equal(untouched.identities.length, 1);
  const created = JSON.parse(users.find((user) => user.id !== existing.user.userId).payload);
  assert.deepEqual(created.roles, []);
});

test('a GitHub identity already owned by another account cannot be linked', async (t) => {
  const env = environment();
  const owner = await upsertUserForIdentity(env, identity());
  const other = await member(env);
  provider(t);
  const response = await callbackGitHub({ env, request: callbackRequest(await start(env, { cookie: other.cookie, intent: 'link' })) });
  assert.equal(result(response), 'github-already-linked');
  assert.equal(env.AUTH_DB.sqlite.prepare("SELECT user_id FROM identities WHERE provider = 'github' AND id = '123'").get().user_id, owner.userId);
  const otherUser = JSON.parse(env.AUTH_DB.sqlite.prepare('SELECT payload FROM users WHERE id = ?').get(other.user.userId).payload);
  assert.equal(otherUser.identities.length, 1);
});

for (const [name, options, expected] of [
  ['broader pre-existing grant', { scope: 'repo,user:email' }, 'github-scope-mismatch'],
  ['failed token exchange', { tokenStatus: 400 }, 'github-token-failed'],
  ['missing token', { token: {} }, 'github-token-failed'],
  ['failed profile lookup', { profileStatus: 403 }, 'github-profile-failed'],
  ['unsafe ID', { data: { id: Number.MAX_SAFE_INTEGER + 1, login: 'octocat', type: 'User' } }, 'github-profile-failed'],
  ['organization identity', { data: { id: 123, login: 'octocat', type: 'Organization' } }, 'github-profile-failed'],
]) {
  test(`${name} fails closed without creating an account or session`, async (t) => {
    const env = environment();
    provider(t, options);
    const response = await callbackGitHub({ env, request: callbackRequest(await start(env)) });
    assert.equal(result(response), expected);
    assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
    assert.equal(env.AUTH_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
    assert.doesNotMatch(response.headers.get('set-cookie'), /(?:^|,\s*)pc_session=/);
  });
}

test('untrusted profile URLs and email are omitted from the identity', () => {
  const value = githubIdentity({ id: 123, login: 'octocat', type: 'User', name: null, avatar_url: 'https://evil.example/avatar', email: 'victim@example.com' });
  assert.equal(value.name, 'octocat');
  assert.equal(value.avatar, undefined);
  assert.equal(value.email, undefined);
  assert.equal(githubIdentity({ id: '123', login: 'octocat', type: 'User' }), null);
});
