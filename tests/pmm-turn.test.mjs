import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, normalizeIceServers, mintTurn, turnConfigured, fromSite } from '../functions/api/pmm/turn.ts';

const get = (env, headers = {}) => onRequestGet({ request: new Request('https://pointcast.xyz/api/pmm/turn', { headers }), env, params: {} });

test('without the two secrets the endpoint answers an empty list and never calls upstream', async () => {
  assert.equal(turnConfigured({}), false);
  assert.equal(turnConfigured({ CF_TURN_KEY_ID: 'k' }), false);
  const r = await get({});
  assert.equal(r.status, 200, 'a 200 so phones asking for a relay log no console errors');
  assert.deepEqual(await r.json(), { iceServers: [], reason: 'turn-not-configured' });
});

test('normalizeIceServers accepts both Cloudflare response shapes and drops junk', () => {
  assert.deepEqual(normalizeIceServers({ iceServers: { urls: ['stun:stun.cloudflare.com:3478', 'turn:turn.cloudflare.com:3478?transport=udp'], username: 'u', credential: 'c' } }),
    [{ urls: ['stun:stun.cloudflare.com:3478', 'turn:turn.cloudflare.com:3478?transport=udp'], username: 'u', credential: 'c' }]);
  assert.deepEqual(normalizeIceServers({ iceServers: [{ urls: 'turns:turn.cloudflare.com:5349?transport=tcp', username: 'u', credential: 'c' }, { urls: ['http://evil'] }, 'nope'] }),
    [{ urls: ['turns:turn.cloudflare.com:5349?transport=tcp'], username: 'u', credential: 'c' }]);
  assert.deepEqual(normalizeIceServers({}), []);
  assert.deepEqual(normalizeIceServers(null), []);
});

test('mintTurn posts the ttl with the bearer token to the key url and returns the servers', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ iceServers: [{ urls: ['turn:turn.cloudflare.com:3478?transport=udp'], username: 'u', credential: 'c' }] }), { status: 200 }); };
  const servers = await mintTurn({ CF_TURN_KEY_ID: 'key id', CF_TURN_API_TOKEN: 'tok' }, fetchImpl, 600);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://rtc.live.cloudflare.com/v1/turn/keys/key%20id/credentials/generate-ice-servers');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
  assert.ok(calls[0].init.signal, 'the upstream call is time-boxed');
  assert.deepEqual(JSON.parse(calls[0].init.body), { ttl: 600 });
  assert.equal(servers[0].username, 'u');
  await assert.rejects(() => mintTurn({ CF_TURN_KEY_ID: 'k', CF_TURN_API_TOKEN: 't' }, async () => new Response('no', { status: 401 })), /turn-upstream-401/);
  await assert.rejects(() => mintTurn({ CF_TURN_KEY_ID: 'k', CF_TURN_API_TOKEN: 't' }, async () => new Response('{}', { status: 200 })), /turn-upstream-empty/);
});

test('only the site\'s own pages get a credential', async () => {
  const at = (h) => fromSite(new Request('https://pointcast.xyz/api/pmm/turn', { headers: h }));
  assert.equal(at({ 'sec-fetch-site': 'same-origin' }), true);
  assert.equal(at({ 'sec-fetch-site': 'cross-site' }), false);
  assert.equal(at({ 'sec-fetch-site': 'none' }), false, 'a typed URL or a bare script is not the app');
  assert.equal(at({ origin: 'https://pointcast.xyz' }), true);
  assert.equal(at({ origin: 'https://evil.example' }), false);
  assert.equal(at({ referer: 'https://pointcast.xyz/pmm/' }), true);
  assert.equal(at({ referer: 'https://pointcast.xyz.evil.example/pmm/' }), false);
  assert.equal(at({}), false, 'no headers at all is not the app');
  const env = { CF_TURN_KEY_ID: 'k', CF_TURN_API_TOKEN: 't' };
  const r = await get(env, { 'sec-fetch-site': 'cross-site' });
  assert.equal(r.status, 403);
  assert.deepEqual(await r.json(), { iceServers: [], reason: 'turn-site-only' });
});
