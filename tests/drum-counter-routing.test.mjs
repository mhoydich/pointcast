import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, onRequestPost } from '../functions/api/drum.ts';
import { onRequestGet as onTopGet } from '../functions/api/drum/top.ts';

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
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('drum top reads the authoritative DO instead of the delayed KV mirror', async () => {
  const env = {
    VISITS: { async get() { throw new Error('legacy KV should not be read when DO is bound'); } },
    DRUM_COUNTER: {
      idFromName(name) { assert.equal(name, 'global'); return name; },
      get() { return { async fetch(url) { assert.match(url, /top=1/); return new Response(JSON.stringify({ entries: [{ rank: 1, hash: 'deadbeef', nounId: 12, count: 50 }] })); } }; },
    },
  };
  const response = await onTopGet(context(new Request('https://pointcast.xyz/api/drum/top'), env));
  assert.deepEqual(await response.json(), { entries: [{ rank: 1, hash: 'deadbeef', nounId: 12, count: 50 }] });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

import { onRequestGet as onSignalGet, onRequestPost as onSignalPost } from '../functions/api/drum/signal.ts';
import { resolveSource } from '../functions/_lib/drum-signal.ts';

function captureCounter(reply = { ok: true, globalTotal: 1, yourTotal: 0 }) {
  const calls = [];
  return {
    calls,
    env: {
      DRUM_COUNTER: {
        idFromName() { return 'global'; },
        get() { return { async fetch(url, init) { calls.push([url, init]); return new Response(JSON.stringify(reply)); } }; },
      },
    },
  };
}

test('drum signal infers a PointCast room from the referer path', () => {
  const req = new Request('https://pointcast.xyz/api/drum', { headers: { Referer: 'https://pointcast.xyz/drum-v4/' } });
  assert.deepEqual(resolveSource(req, undefined, 'US'), { kind: 'pointcast', app: '/drum-v4', place: 'cc:us' });
});

test('drum signal: foreign origins are embeds and cannot claim to be pointcast', () => {
  const req = new Request('https://pointcast.xyz/api/drum/signal', { headers: { Origin: 'https://example.com' } });
  assert.deepEqual(resolveSource(req, { kind: 'pointcast', place: 'Court 3!' }), { kind: 'embed', app: 'example.com', place: 'court-3' });
  assert.equal(resolveSource(req, { kind: 'artifact' }).kind, 'artifact');
});

test('drum signal: sandboxed frames are artifacts, originless calls are standalone', () => {
  const sandboxed = new Request('https://pointcast.xyz/api/drum/signal', { headers: { Origin: 'null' } });
  assert.equal(resolveSource(sandboxed, {}).kind, 'artifact');
  const bare = new Request('https://pointcast.xyz/api/drum/signal');
  assert.deepEqual(resolveSource(bare, {}), { kind: 'standalone', app: 'direct', place: null });
  assert.deepEqual(resolveSource(bare, { kind: 'agent', app: 'mcp' }), { kind: 'agent', app: 'mcp', place: null });
});

test('drum POST forwards the resolved source to DrumCounter', async () => {
  const { calls, env } = captureCounter();
  await onRequestPost(context(new Request('https://pointcast.xyz/api/drum', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://pointcast.xyz/drum' },
    body: JSON.stringify({ delta: 3, sessionId: 'session-a' }),
  }), { VISITS: {}, ...env }));
  assert.deepEqual(JSON.parse(calls[0][1].body).source, { kind: 'pointcast', app: '/drum', place: null });
});

test('drum signal POST accepts sendBeacon text bodies, clamps beats, and needs no session', async () => {
  const { calls, env } = captureCounter();
  const response = await onSignalPost(context(new Request('https://pointcast.xyz/api/drum/signal', {
    method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: 'https://friend.site' },
    body: JSON.stringify({ beats: 5000, app: 'Friend Site', place: 'el-segundo' }),
  }), env));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  const [url, init] = calls[0];
  assert.doesNotMatch(url, /session=/);
  assert.deepEqual(JSON.parse(init.body), { delta: 100, source: { kind: 'embed', app: 'friend-site', place: 'el-segundo' } });
});

test('drum signal GET reads the summary from DrumCounter', async () => {
  const { calls, env } = captureCounter({ globalTotal: 9, attributed: 2, unattributed: 7, kinds: [] });
  const response = await onSignalGet(context(new Request('https://pointcast.xyz/api/drum/signal'), env));
  assert.equal((await response.json()).unattributed, 7);
  assert.match(calls[0][0], /signal=1/);
});
