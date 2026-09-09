import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost, issueSession, readSessionFromRequest } from '../functions/api/auth/session.ts';

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
