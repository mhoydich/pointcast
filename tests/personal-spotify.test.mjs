import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet as startOAuth } from '../functions/api/spotify/auth.ts';
import { onRequestGet as finishOAuth } from '../functions/api/spotify/callback.ts';
import { onRequestGet, onRequestDelete } from '../functions/api/me/spotify.ts';
import { storePersonalSpotifyCredentials } from '../functions/api/spotify/_personal.ts';

const origin = 'https://pointcast.xyz';
const aliceKey = 'spotify:personal:credentials:v1:alice';
const bobKey = 'spotify:personal:credentials:v1:bob';
const sharedKey = 'spotify:broadcast:credentials:v1';
const trackId = '4uLU6hMCjMI75M1A2tKUQC';

function environment() {
  const entries = new Map();
  for (const id of ['alice', 'bob', 'station']) {
    entries.set(`user:${id}`, JSON.stringify({
      userId: id, preferredName: id, identities: [], createdAt: new Date().toISOString(), roles: id === 'station' ? ['broadcaster'] : [],
    }));
    entries.set(`session:pcs_${id}`, JSON.stringify({ userId: id, sessionToken: `pcs_${id}`, expiresAt: new Date(Date.now() + 3600_000).toISOString() }));
  }
  const reads = [];
  const env = {
    SPOTIFY_CLIENT_ID: 'fixture-client', SPOTIFY_CLIENT_SECRET: 'fixture-secret',
    SPOTIFY_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64url'),
    USERS: {
      async get(key, type) { reads.push(key); const value = entries.get(key) ?? null; return type === 'json' && value ? JSON.parse(value) : value; },
      async put(key, value) { entries.set(key, value); },
      async delete(key) { entries.delete(key); },
    },
  };
  return { env, entries, reads };
}

function request(path = '/api/me/spotify', user = 'alice', init = {}) {
  return new Request(`${origin}${path}`, {
    ...init,
    headers: { ...(user ? { cookie: `pc_session=pcs_${user}` } : {}), ...init.headers },
  });
}

function credentials(user, expiresAt = Date.now() + 3600_000) {
  return { accessToken: `${user}-access`, refreshToken: `${user}-refresh`, expiresAt };
}

function currentTrack(title = 'Personal fixture') {
  return {
    is_playing: true, progress_ms: 8000,
    device: { name: 'Private device; must not reach the UI' },
    item: {
      type: 'track', id: trackId, name: title, duration_ms: 123000,
      artists: [{ name: 'Fixture artist' }],
      album: { name: 'Fixture album', images: [{ url: 'https://i.scdn.co/image/fixture' }] },
      external_urls: { spotify: 'https://evil.example/do-not-use' },
    },
  };
}

async function begin(env, user = 'alice', query = '?personal=1&returnTo=%2Fshwa%2F') {
  const response = await startOAuth({ env, request: request(`/api/spotify/auth${query}`, user) });
  assert.equal(response.status, 302);
  return new URL(response.headers.get('location'));
}

test('personal OAuth is opt-in, session-bound, and preserves the broadcaster default', async () => {
  const { env, entries } = environment();
  const denied = await startOAuth({ env, request: request('/api/spotify/auth') });
  assert.equal(denied.status, 403);
  const authorize = await begin(env);
  assert.equal(authorize.origin, 'https://accounts.spotify.com');
  assert.equal(authorize.searchParams.get('scope'), 'user-read-currently-playing');
  assert.equal(authorize.searchParams.get('redirect_uri'), `${origin}/api/spotify/callback`);
  const state = JSON.parse(entries.get(`oauth-state:spotify:${authorize.searchParams.get('state')}`));
  assert.equal(state.personal, true);
  assert.equal(state.currentUserId, 'alice');
  assert.equal(state.returnTo, '/shwa/');
  const broadcaster = await begin(env, 'station', '?returnTo=%2Fme');
  const broadcastState = JSON.parse(entries.get(`oauth-state:spotify:${broadcaster.searchParams.get('state')}`));
  assert.equal(broadcastState.personal, undefined);
  const login = await begin(env, null);
  assert.equal(login.pathname, '/api/auth/google');
  assert.equal(login.searchParams.get('returnTo'), '/api/spotify/auth?personal=1&returnTo=%2Fshwa%2F');
});

test('personal callback rejects a different session owner before any provider call', async (t) => {
  const { env, entries } = environment();
  const authorize = await begin(env);
  const state = authorize.searchParams.get('state');
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Mismatched owner must not exchange tokens'); });
  const response = await finishOAuth({ env, request: request(`/api/spotify/callback?state=${state}&code=fixture`, 'bob') });
  const location = new URL(response.headers.get('location'));
  assert.equal(location.pathname, '/shwa/');
  assert.equal(location.searchParams.get('spotify_error'), 'spotify-session-mismatch');
  assert.equal(entries.has(`oauth-state:spotify:${state}`), false);
  assert.equal(entries.has(aliceKey), false);
  assert.equal(entries.has(bobKey), false);
});

test('personal callback stores only encrypted owner credentials and cannot replay state', async (t) => {
  const { env, entries } = environment();
  const authorize = await begin(env);
  const state = authorize.searchParams.get('state');
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://accounts.spotify.com/api/token');
    return Response.json({ access_token: 'alice-access', refresh_token: 'alice-refresh', expires_in: 3600 });
  });
  const callback = request(`/api/spotify/callback?state=${state}&code=fixture`);
  const response = await finishOAuth({ env, request: callback });
  assert.equal(new URL(response.headers.get('location')).searchParams.get('spotify'), 'connected');
  const stored = entries.get(aliceKey);
  assert.equal(JSON.parse(stored).version, 1);
  assert.doesNotMatch(stored, /alice-access|alice-refresh/);
  assert.equal(entries.has(sharedKey), false);
  assert.equal(entries.has(bobKey), false);
  const replay = await finishOAuth({ env, request: callback });
  assert.equal(new URL(replay.headers.get('location')).searchParams.get('spotify_error'), 'spotify-state-expired');
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('the callback trusts stored flow type, not a personal query flag', async (t) => {
  const { env, entries } = environment();
  entries.set('oauth-state:spotify:legacy', JSON.stringify({ currentUserId: 'alice', returnTo: '/me', nonce: 'fixture', createdAt: new Date().toISOString() }));
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Personal query must not bypass broadcaster authorization'); });
  const response = await finishOAuth({ env, request: request('/api/spotify/callback?state=legacy&code=fixture&personal=1') });
  assert.equal(new URL(response.headers.get('location')).searchParams.get('spotify_error'), 'spotify-session-mismatch');
});

test('the default broadcaster callback still updates its existing shared connection', async (t) => {
  const { env, entries } = environment();
  const authorize = await begin(env, 'station', '?returnTo=%2Fme');
  const state = authorize.searchParams.get('state');
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url) => url.endsWith('/api/token')
    ? Response.json({ access_token: 'station-access', refresh_token: 'station-refresh', expires_in: 3600 })
    : new Response(null, { status: 204 }));
  const response = await finishOAuth({ env, request: request(`/api/spotify/callback?state=${state}&code=fixture`, 'station') });
  assert.equal(new URL(response.headers.get('location')).searchParams.get('spotify'), 'connected');
  assert.equal(JSON.parse(entries.get(sharedKey)).version, 1);
  assert.doesNotMatch(entries.get(sharedKey), /station-access|station-refresh/);
  assert.equal(entries.has('spotify:broadcast:signal:v1'), true);
  assert.equal(entries.has('spotify:personal:credentials:v1:station'), false);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('OAuth denial returns to the personal room and consumes the state', async (t) => {
  const { env, entries } = environment();
  const authorize = await begin(env);
  const state = authorize.searchParams.get('state');
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Denied OAuth must not exchange tokens'); });
  const response = await finishOAuth({ env, request: request(`/api/spotify/callback?state=${state}&error=access_denied`) });
  const location = new URL(response.headers.get('location'));
  assert.equal(location.pathname, '/shwa/');
  assert.equal(location.searchParams.get('spotify_error'), 'spotify-denied');
  assert.equal(entries.has(`oauth-state:spotify:${state}`), false);
});

test('private status verifies the owner token, sanitizes metadata, and never uses shared credentials', async (t) => {
  const { env, entries, reads } = environment();
  entries.set(sharedKey, 'shared-fixture');
  await storePersonalSpotifyCredentials(env, 'alice', credentials('alice'));
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://api.spotify.com/v1/me/player/currently-playing');
    assert.equal(init.headers.Authorization, 'Bearer alice-access');
    return Response.json(currentTrack());
  });
  const response = await onRequestGet({ env, request: request() });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  const body = await response.json();
  assert.equal(body.connected, true);
  assert.equal(body.configured, true);
  assert.equal(body.track.spotifyUrl, `https://open.spotify.com/track/${trackId}`);
  assert.equal(body.track.title, 'Personal fixture');
  assert.equal(body.track.isPlaying, true);
  assert.doesNotMatch(JSON.stringify(body), /alice-access|alice-refresh|Private device|evil\.example/);
  const bob = await onRequestGet({ env, request: request('/api/me/spotify?userId=alice', 'bob') });
  assert.equal((await bob.json()).status, 'disconnected');
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(reads.includes(sharedKey), false);
});

test('ciphertext moved to another owner fails authentication without a provider call', async (t) => {
  const { env, entries } = environment();
  await storePersonalSpotifyCredentials(env, 'alice', credentials('alice'));
  entries.set(bobKey, entries.get(aliceKey));
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Ciphertext owner mismatch must not use provider credentials'); });
  const response = await onRequestGet({ env, request: request('/api/me/spotify', 'bob') });
  const body = await response.json();
  assert.equal(body.status, 'reconnect_required');
  assert.equal(body.connected, false);
  assert.equal(body.track, null);
});

test('unauthenticated status and disconnect cannot read personal credentials', async (t) => {
  const { env, reads } = environment();
  t.mock.method(globalThis, 'fetch', () => { assert.fail('Anonymous request must not contact Spotify'); });
  const get = await onRequestGet({ env, request: request('/api/me/spotify', null) });
  const remove = await onRequestDelete({ env, request: request('/api/me/spotify', null, { method: 'DELETE', headers: { Origin: origin } }) });
  assert.equal(get.status, 401);
  assert.equal(remove.status, 401);
  assert.equal(reads.length, 0);
});

test('disconnect requires same-origin CSRF protection and deletes only the current owner', async () => {
  const { env, entries } = environment();
  await storePersonalSpotifyCredentials(env, 'alice', credentials('alice'));
  await storePersonalSpotifyCredentials(env, 'bob', credentials('bob'));
  entries.set(sharedKey, 'shared-fixture');
  const bobBefore = entries.get(bobKey);
  for (const headers of [{}, { Origin: 'null' }, { Origin: 'https://evil.example' }, { Origin: origin, 'Sec-Fetch-Site': 'cross-site' }]) {
    const response = await onRequestDelete({ env, request: request('/api/me/spotify', 'alice', { method: 'DELETE', headers }) });
    assert.equal(response.status, 403);
    assert.equal(entries.has(aliceKey), true);
  }
  const response = await onRequestDelete({ env, request: request('/api/me/spotify?userId=bob', 'alice', { method: 'DELETE', headers: { Origin: origin } }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal((await response.json()).status, 'disconnected');
  assert.equal(entries.has(aliceKey), false);
  assert.equal(entries.get(bobKey), bobBefore);
  assert.equal(entries.get(sharedKey), 'shared-fixture');
});

for (const [label, upstream, expected] of [
  ['revoked token', () => Response.json({ error: 'invalid_grant' }, { status: 400 }), 'reconnect_required'],
  ['provider failure', () => Response.json({ error: 'fixture-secret' }, { status: 503 }), 'unavailable'],
  ['network failure', () => { throw new Error('fixture-secret'); }, 'unavailable'],
  ['malformed expiry', () => Response.json({ access_token: 'fresh-access', expires_in: '3600' }), 'unavailable'],
]) {
  test(`refresh ${label} never reports connected or falls back to music`, async (t) => {
    const { env, entries } = environment();
    await storePersonalSpotifyCredentials(env, 'alice', credentials('alice', Date.now() - 1000));
    const before = entries.get(aliceKey);
    const fetchMock = t.mock.method(globalThis, 'fetch', async (url) => {
      assert.equal(url, 'https://accounts.spotify.com/api/token');
      return upstream();
    });
    const response = await onRequestGet({ env, request: request() });
    const body = await response.json();
    assert.equal(body.status, expected);
    assert.equal(body.connected, false);
    assert.equal(body.track, null);
    assert.equal(entries.get(aliceKey), before);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.doesNotMatch(JSON.stringify(body), /fixture-secret|access_token|refresh_token/);
  });
}

test('refresh preserves an omitted refresh token and verifies the newly issued access token', async (t) => {
  const { env } = environment();
  await storePersonalSpotifyCredentials(env, 'alice', credentials('alice', Date.now() - 1000));
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (url.endsWith('/api/token')) {
      assert.equal(init.body.get('refresh_token'), 'alice-refresh');
      return Response.json({ access_token: 'fresh-access', expires_in: 3600 });
    }
    assert.equal(init.headers.Authorization, 'Bearer fresh-access');
    return new Response(null, { status: 204 });
  });
  const response = await onRequestGet({ env, request: request() });
  const body = await response.json();
  assert.equal(body.connected, true);
  assert.equal(body.track, null);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('401 permits one refresh and does not loop or retain a false connected state', async (t) => {
  const { env } = environment();
  await storePersonalSpotifyCredentials(env, 'alice', credentials('alice'));
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url) => url.endsWith('/api/token')
    ? Response.json({ access_token: 'fresh-access', expires_in: 3600 })
    : new Response(null, { status: 401 }));
  const response = await onRequestGet({ env, request: request() });
  const body = await response.json();
  assert.equal(body.connected, false);
  assert.equal(body.status, 'reconnect_required');
  assert.equal(fetchMock.mock.callCount(), 3);
});

test('a disconnect observed during token refresh is not overwritten', async (t) => {
  const { env, entries } = environment();
  await storePersonalSpotifyCredentials(env, 'alice', credentials('alice', Date.now() - 1000));
  let finishRefresh;
  let announceRefresh;
  const refreshing = new Promise((resolve) => { announceRefresh = resolve; });
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://accounts.spotify.com/api/token');
    announceRefresh();
    return new Promise((resolve) => { finishRefresh = resolve; });
  });
  const pending = onRequestGet({ env, request: request() });
  await refreshing;
  await onRequestDelete({ env, request: request('/api/me/spotify', 'alice', { method: 'DELETE', headers: { Origin: origin } }) });
  finishRefresh(Response.json({ access_token: 'fresh-access', expires_in: 3600 }));
  const body = await (await pending).json();
  assert.equal(body.connected, false);
  assert.equal(entries.has(aliceKey), false);
});

test('missing provider setup reports unavailable, not a working connection', async () => {
  const { env } = environment();
  delete env.SPOTIFY_CLIENT_ID;
  const body = await (await onRequestGet({ env, request: request() })).json();
  assert.equal(body.configured, false);
  assert.equal(body.connected, false);
  assert.equal(body.status, 'unavailable');
});
