import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, onRequestPost } from '../functions/api/drum.ts';

function context(request, env) {
  return { request, env, functionPath: '/api/drum', params: {}, data: {}, waitUntil() {}, next: async () => new Response('next') };
}

test('drum POST keeps its response contract while proxying to DrumCounter', async () => {
  const requests = [];
  const stub = { async fetch(url, init) { requests.push([url, init]); return new Response(JSON.stringify({ ok: true, globalTotal: 14, yourTotal: 6 })); } };
  const env = {
    VISITS: { async get() { throw new Error('legacy KV should not be read when DO is bound'); } },
    DRUM_COUNTER: { idFromName(name) { assert.equal(name, 'global'); return name; }, get() { return stub; } },
  };
  const response = await onRequestPost(context(new Request('https://pointcast.xyz/api/drum', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta: 6, sessionId: 'session-a' }),
  }), env));
  assert.deepEqual(await response.json(), { ok: true, globalTotal: 14, yourTotal: 6 });
  assert.equal(requests.length, 1);
  assert.match(requests[0][0], /session=[a-f0-9]{16}/);
});

test('drum GET keeps its response contract through DrumCounter', async () => {
  const env = {
    VISITS: { async get() { throw new Error('legacy KV should not be read when DO is bound'); } },
    DRUM_COUNTER: {
      idFromName() { return 'global'; },
      get() { return { async fetch() { return new Response(JSON.stringify({ globalTotal: 14, yourTotal: 6 })); } }; },
    },
  };
  const response = await onRequestGet(context(new Request('https://pointcast.xyz/api/drum?sessionId=session-a'), env));
  assert.deepEqual(await response.json(), { globalTotal: 14, yourTotal: 6 });
});
