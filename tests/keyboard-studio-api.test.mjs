import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/keyboard-studio.ts';

const BASE = 'https://pointcast.xyz/api/keyboard-studio';
const SECRET = 'ab'.repeat(32);
const HEADERS = { origin: 'https://pointcast.xyz', 'cf-connecting-ip': '192.0.2.4' };

function fixture({ secret = SECRET, kv = true } = {}) {
  const counters = new Map();
  const calls = [];
  const env = {
    KEYBOARD_STUDIO_SIGNING_KEY: secret,
    KEYBOARD_STUDIO: {
      idFromName(name) { calls.push(name); return name; },
      get(id) {
        return {
          fetch(request) {
            calls.push(request.url);
            return Response.json({ room: id, passages: [] });
          },
        };
      },
    },
    ...(kv ? {
      PC_RATES_KV: {
        async get(key) { return counters.get(key) ?? null; },
        async put(key, value) { counters.set(key, value); },
      },
    } : {}),
  };
  const call = (url, init = {}) => onRequest({ request: new Request(url, init), env });
  return { env, calls, counters, call };
}

async function create(f) {
  const response = await f.call(BASE + '?action=create', { method: 'POST', headers: HEADERS });
  return { response, data: await response.json() };
}

test('server issues a signed shareable room without instantiating a Durable Object', async () => {
  const f = fixture();
  const { response, data } = await create(f);
  assert.equal(response.status, 201);
  assert.match(data.room, /^[0-9a-f]{32}$/);
  assert.match(data.token, /^[0-9a-f]{64}$/);
  assert.equal(f.calls.length, 0);

  const join = await f.call(BASE + '?room=' + data.room + '&token=' + data.token);
  assert.equal(join.status, 200);
  assert.equal(f.calls.length, 2);
});

test('missing, forged, and room-swapped tokens never touch the Durable Object', async () => {
  const f = fixture();
  const { data } = await create(f);
  const otherRoom = data.room === '0'.repeat(32) ? '1'.repeat(32) : '0'.repeat(32);
  for (const url of [
    BASE + '?room=' + data.room,
    BASE + '?room=' + data.room + '&token=' + '0'.repeat(64),
    BASE + '?room=' + otherRoom + '&token=' + data.token,
  ]) {
    const response = await f.call(url);
    assert.equal(response.status, 403);
  }
  const post = await f.call(BASE + '?room=' + data.room + '&token=' + '0'.repeat(64), {
    method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(post.status, 403);
  assert.equal(f.calls.length, 0);
});

test('creation and shared posting fail closed when a required binding is unavailable', async () => {
  const noSecret = fixture();
  delete noSecret.env.KEYBOARD_STUDIO_SIGNING_KEY;
  for (const f of [noSecret, fixture({ secret: 'weak' }), fixture({ kv: false })]) {
    const response = await f.call(BASE + '?action=create', { method: 'POST', headers: HEADERS });
    assert.equal(response.status, 503);
    assert.equal(f.calls.length, 0);
  }

  const f = fixture();
  const { data } = await create(f);
  delete f.env.PC_RATES_KV;
  const response = await f.call(BASE + '?room=' + data.room + '&token=' + data.token, {
    method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 503);
  assert.equal(f.calls.length, 0);
});

test('rate store write failure prevents issuing a room', async () => {
  const f = fixture();
  f.env.PC_RATES_KV.put = async () => { throw new Error('KV unavailable'); };
  const response = await f.call(BASE + '?action=create', { method: 'POST', headers: HEADERS });
  assert.equal(response.status, 503);
  assert.equal(f.calls.length, 0);
});

test('a signed post reaches the room only while the posting rate gate can write', async () => {
  const f = fixture();
  const { data } = await create(f);
  const url = BASE + '?room=' + data.room + '&token=' + data.token;
  const init = {
    method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Lee', text: 'A shared line', clientId: crypto.randomUUID() }),
  };
  const accepted = await f.call(url, init);
  assert.equal(accepted.status, 200);
  assert.equal(f.calls.length, 2);

  f.calls.length = 0;
  f.env.PC_RATES_KV.put = async () => { throw new Error('KV unavailable'); };
  const blocked = await f.call(url, init);
  assert.equal(blocked.status, 503);
  assert.equal(f.calls.length, 0);
});

test('room creation is limited to six per hour per client', async () => {
  const f = fixture();
  for (let i = 0; i < 6; i++) assert.equal((await create(f)).response.status, 201);
  const limited = await create(f);
  assert.equal(limited.response.status, 429);
  assert.ok(Number(limited.response.headers.get('retry-after')) > 0);
  assert.equal(f.calls.length, 0);
});
