import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost, parseSignal } from '../functions/api/pmm/signal.ts';

const fakeKv = () => {
  const store = new Map();
  return {
    store,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v) { store.set(k, v); },
  };
};
const get = (env, qs = '') => onRequestGet({ request: new Request('https://pointcast.xyz/api/pmm/signal' + qs), env, params: {} });
const post = (env, body) => onRequestPost({ request: new Request('https://pointcast.xyz/api/pmm/signal', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }), env, params: {} });

test('parseSignal only accepts a six-letter room, a known role and a bounded sdp', () => {
  assert.deepEqual(parseSignal({ room: 'ABCDEF', role: 'offer', sdp: 'v=0' }), { room: 'ABCDEF', role: 'offer', sdp: 'v=0' });
  assert.equal(parseSignal({ room: 'ABCDE1', role: 'offer', sdp: 'v=0' }).error, 'bad-room', 'ambiguous glyphs are not in the alphabet');
  assert.equal(parseSignal({ room: 'ABCDEF', role: 'ice', sdp: 'v=0' }).error, 'bad-role');
  assert.equal(parseSignal({ room: 'ABCDEF', role: 'offer', sdp: 'x'.repeat(40_000) }).error, 'bad-sdp');
  assert.equal(parseSignal(null).error, 'bad-body');
});

test('without PMM_KV the status says unbound and storage calls answer 503', async () => {
  const status = await get({});
  assert.deepEqual(await status.json(), { bound: false, ttlSeconds: 600 });
  assert.equal((await get({}, '?room=ABCDEF&role=offer')).status, 503);
  assert.equal((await post({}, { room: 'ABCDEF', role: 'offer', sdp: 'v=0' })).status, 503);
});

test('offer then answer round trip, offers cannot be overwritten, answers can wait', async () => {
  const env = { PMM_KV: fakeKv() };
  assert.deepEqual(await (await get(env, '?room=ABCDEF&role=offer')).json(), { pending: true }, 'a pending room answers 200 so phones polling it log no errors');
  const created = await post(env, { room: 'ABCDEF', role: 'offer', sdp: 'v=0 offer' });
  assert.equal(created.status, 201);
  assert.deepEqual(await (await get(env, '?room=ABCDEF&role=offer')).json(), { sdp: 'v=0 offer' });
  assert.equal((await post(env, { room: 'ABCDEF', role: 'offer', sdp: 'v=0 hijack' })).status, 409);
  assert.deepEqual(await (await get(env, '?room=ABCDEF&role=answer')).json(), { pending: true });
  assert.equal((await post(env, { room: 'ABCDEF', role: 'answer', sdp: 'v=0 answer' })).status, 201);
  assert.deepEqual(await (await get(env, '?room=ABCDEF&role=answer')).json(), { sdp: 'v=0 answer' });
  assert.equal((await post(env, '{not json')).status, 400);
  assert.equal((await get(env, '?room=abc&role=offer')).status, 400);
});
