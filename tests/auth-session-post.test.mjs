import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost, onRequestGet, issueSession, readSessionFromRequest } from '../functions/api/auth/session.ts';

function environment() {
  const user = { userId: 'known-victim', preferredName: 'Fixture member', createdAt: new Date().toISOString(), identities: [], roles: [] };
  const entries = new Map([['user:known-victim', JSON.stringify(user)]]);
  const env = { USERS: {
    async get(key) { return entries.get(key) ?? null; },
    async put(key, value) { entries.set(key, value); },
    async delete(key) { entries.delete(key); },
  } };
  return { env, entries, user };
}

test('public session POST cannot mint or refresh a session using a forged internal header', async () => {
  const { env, entries } = environment();
  for (const cookie of ['', 'pc_session=attacker-supplied']) {
    const response = await onRequestPost({ env, request: new Request('https://pointcast.xyz/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-pointcast-internal-auth': '1', origin: 'https://pointcast.xyz', cookie },
      body: JSON.stringify({ userId: 'known-victim', ttlSeconds: 31536000 }),
    }) });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, DELETE');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.deepEqual(await response.json(), { ok: false, reason: 'method-not-allowed' });
    assert.deepEqual([...entries.keys()], ['user:known-victim']);
  }
});

test('session POST rejects malformed requests without touching storage', async () => {
  const env = new Proxy({}, { get() { throw new Error('Rejected requests must not access storage'); } });
  const response = await onRequestPost({ env, request: new Request('https://pointcast.xyz/api/auth/session', {
    method: 'POST', headers: { 'x-pointcast-internal-auth': '1' }, body: 'not-json',
  }) });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('verified provider handlers can still issue and read a normal session directly', async () => {
  const { env, user } = environment();
  const session = await issueSession(env, user.userId);
  const current = await readSessionFromRequest(new Request('https://pointcast.xyz/api/auth/session', {
    headers: { cookie: `pc_session=${session.sessionToken}` },
  }), env);
  assert.equal(current.user.userId, user.userId);
  assert.equal(current.session.sessionToken, session.sessionToken);
});


test('session GET exposes a display summary without exposing the bearer token', async () => {
  const { env, user } = environment();
  const session = await issueSession(env, user.userId);
  const response = await onRequestGet({ env, request: new Request('https://pointcast.xyz/api/auth/session', {
    headers: { cookie: `pc_session=${session.sessionToken}` },
  }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.session, { userId: user.userId, expiresAt: session.expiresAt });
  assert.equal(JSON.stringify(body).includes(session.sessionToken), false);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
});

test('session renewal rotates the cookie without exposing either bearer token in JSON', async () => {
  const { env, user, entries } = environment();
  const session = await issueSession(env, user.userId, 3600);
  const response = await onRequestGet({ env, request: new Request('https://pointcast.xyz/api/auth/session', {
    headers: { cookie: `pc_session=${session.sessionToken}` },
  }) });
  const body = await response.json();
  const cookie = response.headers.get('set-cookie');
  const renewedToken = decodeURIComponent(cookie.match(/^pc_session=([^;]+)/)[1]);
  assert.notEqual(renewedToken, session.sessionToken);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  assert.deepEqual(Object.keys(body.session).sort(), ['expiresAt', 'userId']);
  assert.equal(body.renewed, true);
  assert.equal(body.session.userId, user.userId);
  assert.ok(Date.parse(body.session.expiresAt) > Date.parse(session.expiresAt));
  assert.equal(JSON.stringify(body).includes(session.sessionToken), false);
  assert.equal(JSON.stringify(body).includes(renewedToken), false);
  assert.equal(entries.has(`session:${session.sessionToken}`), false);
  assert.equal(entries.has(`session:${renewedToken}`), true);
});
