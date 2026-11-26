import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { addressKey } from '../src/lib/loom/address.mjs';
import { readHearthPerson } from '../src/lib/loom/hearth-person.mjs';
import { HEARTH_DAY } from '../src/lib/loom/hearth-day.mjs';

// Load the real Pages entry point using the copied dependencies, without a build.
const entry = new URL('../functions/api/loom-hearth.ts', import.meta.url);
const source = (await readFile(entry, 'utf8')).replace(
  "'../../src/lib/loom/hearth-activity.mjs'",
  JSON.stringify(new URL('../src/lib/loom/hearth-activity.mjs', import.meta.url).href),
).replace(
  "'../../src/lib/loom/atomic.mjs'",
  JSON.stringify(new URL('../src/lib/loom/atomic.mjs', import.meta.url).href),
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
const { onRequestGet } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const NOW = Date.parse('2026-11-25T19:00:00Z');

async function fixture(t) {
  let clock = NOW;
  t.mock.method(Date, 'now', () => clock);
  const entries = new Map();
  const stats = { fetches: 0, roomReads: 0, hits: 0, puts: 0, matches: 0 };
  const cache = {
    async match(request) {
      stats.matches++;
      assert.equal(request.method, 'GET');
      assert.equal([...request.headers].length, 0);
      const entry = entries.get(request.url);
      if (!entry || clock >= entry.expires) return undefined;
      stats.hits++;
      return new Response(entry.body, entry.init);
    },
    async put(request, response) {
      stats.puts++;
      const control = response.headers.get('cache-control');
      assert.equal(control, 'public, max-age=0, s-maxage=60');
      const seconds = Number(control.match(/s-maxage=(\d+)/)[1]);
      entries.set(request.url, { expires: clock + seconds * 1000, body: await response.text(),
        init: { status: response.status, headers: [...response.headers] } });
    },
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  Object.defineProperty(globalThis, 'caches', { value: { default: cache }, configurable: true });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'caches', previous);
    else delete globalThis.caches;
  });
  const logs = Array.from({ length: 10 }, (_, i) => ({ kind: 'topic',
    address: '#room' + String(i).padStart(2, '0'), updatedAt: new Date(NOW).toISOString() }));
  logs.push({ kind: 'topic', address: '#old', updatedAt: new Date(NOW - 8 * HEARTH_DAY).toISOString() });
  const records = new Map();
  for (const log of logs) records.set('loom:log:' + await addressKey(log.address), {
    address: log.address, key: await addressKey(log.address), createdAt: new Date(NOW - 5000).toISOString(),
    trimmedBefore: log.address === '#room09' ? 1 : undefined,
    ops: ['Mike', 'Sam'].map((name, i) => ({ op: 'append', seq: i + 1, id: `m_${name}_${log.address}`,
      at: new Date(NOW - 1000).toISOString(), from: { name, kind: 'human' }, kind: 'note', body: `${name}'s full post` })),
  });
  const kv = {
    // The Loom handler reads stored JSON text; count room reads only.
    async get(key) { if (key.startsWith('loom:log:')) stats.roomReads++; const value = records.get(key); return value ? JSON.stringify(value) : null; },
    async put() { assert.fail('Person reads must not write Loom storage'); },
  };
  const bodies = [];
  async function request(path, options = {}) {
    stats.fetches++;
    const url = new URL(path, 'https://pointcast.xyz');
    if (url.pathname === '/api/loom') return Response.json({ ok: true, kvBound: true, logs });
    const pending = [];
    const response = await onRequestGet({ request: new Request(url, options), env: { PC_LOOM_KV: kv },
      waitUntil(task) { pending.push(task); } });
    await Promise.all(pending);
    bodies.push(await response.clone().text());
    return response;
  }
  return { request, cache, stats, logs, records, bodies, entries,
    advance(ms) { clock = NOW + ms; },
    read(name) { return readHearthPerson(name, { request, now: NOW }); } };
}

test('repeated normalized person loads hit the edge for 60 seconds without new room reads', async t => {
  const f = await fixture(t);
  const first = await f.read('mike');
  const firstBodies = [...f.bodies];
  assert.equal(f.stats.fetches, 3, 'one directory fetch and two bounded batch fetches');
  assert.equal(f.stats.roomReads, 10, 'the old directory room was skipped');
  assert.equal(f.stats.puts, 2);
  assert.equal(first.incomplete, true);
  assert.deepEqual(first.trimmed, ['#room09']);

  f.advance(59999);
  f.logs.reverse();
  const cached = await f.read('  @@ MIKE  ');
  assert.equal(f.stats.fetches, 6, 'the existing batch API still receives requests');
  assert.equal(f.stats.roomReads, 10, 'all repeated batches avoid new room reads');
  assert.equal(f.stats.hits, 2);
  assert.deepEqual(f.bodies.slice(2), firstBodies, 'cached response bodies are byte-identical');
  assert.deepEqual(cached, first, 'card shape, contents and partial-history disclosure survive caching');

  const other = await f.read('sam');
  assert.equal(f.stats.roomReads, 20, 'a different normalized name misses');
  assert.equal(other.normalizedName, 'sam');
  assert.ok(other.posts.every(post => post.from.name === 'Sam'));

  f.advance(60000);
  await f.read('@mike');
  assert.equal(f.stats.roomReads, 30, 'the 60-second boundary refreshes every batch');
  assert.deepEqual(f.bodies.slice(6), firstBodies, 'refresh keeps the same response body for unchanged rooms');
});

test('cache keys isolate rooms and preserve order while normalizing addresses and ignoring extra parameters', async t => {
  const f = await fixture(t);
  const first = await f.request('/api/loom-hearth?room=%23ROOM00&person=%40MIKE');
  const again = await f.request('/api/loom-hearth?person=mike&room=%23room00&room=%23ROOM00&noise=1', {
    headers: { range: 'bytes=0-5', 'if-none-match': 'anything' },
  });
  assert.equal(await again.text(), await first.text());
  assert.equal(f.stats.roomReads, 1);
  const different = await f.request('/api/loom-hearth?person=mike&room=%23room01');
  assert.equal((await different.json()).rooms[0].address, '#room01');
  assert.equal(f.stats.roomReads, 2);
  for (const rooms of [['#room00', '#room01'], ['#room01', '#room00']]) {
    const query = new URLSearchParams(rooms.map(room => ['room', room]));
    query.set('person', 'mike');
    const response = await f.request('/api/loom-hearth?' + query);
    assert.deepEqual((await response.json()).rooms.map(room => room.address), rooms);
  }
  assert.equal(f.stats.roomReads, 6, 'different ordered batches cannot return the wrong room list');
});

test('unavailable batches are not cached and recover without hiding partial history', async t => {
  const f = await fixture(t);
  const key = 'loom:log:' + await addressKey('#room00');
  const saved = f.records.get(key);
  f.records.delete(key);
  const first = await f.read('mike');
  assert.equal(first.incomplete, true);
  assert.deepEqual(first.unavailable, ['#room00']);
  assert.deepEqual(first.trimmed, ['#room09']);
  assert.equal(f.stats.puts, 1, 'only the fully readable batch can be stored');
  f.records.set(key, saved);
  const recovered = await f.read('mike');
  assert.deepEqual(recovered.unavailable, []);
  assert.deepEqual(recovered.trimmed, ['#room09']);
  assert.equal(recovered.incomplete, true);
  assert.equal(f.stats.roomReads, 18, 'the failed batch retries while the other batch hits');
});

test('invalid requests and non-person activity bypass the person cache', async t => {
  const f = await fixture(t);
  for (const query of ['person=mike', 'person=&room=%23room00', 'person=%40%20&room=%23room00',
    'person=' + 'x'.repeat(121) + '&room=%23room00', 'person=mike&room=invalid',
    'person=mike&' + Array(9).fill('room=%23room00').join('&')]) {
    assert.equal((await f.request('/api/loom-hearth?' + query)).status, 400);
  }
  assert.equal(f.stats.matches, 0);
  assert.equal(f.stats.roomReads, 0);
  const response = await f.request('/api/loom-hearth?room=%23room00');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=30');
  assert.equal(f.stats.matches, 0);
  assert.equal(f.stats.puts, 0);
});

test('cache lookup and storage failures leave person reads usable', async t => {
  const f = await fixture(t);
  f.cache.match = async () => { throw new Error('cache unavailable'); };
  f.cache.put = async () => { throw new Error('cache unavailable'); };
  const first = await f.read('mike');
  const second = await f.read('mike');
  assert.equal(f.stats.roomReads, 20);
  assert.deepEqual(second, first);
  delete globalThis.caches;
  assert.deepEqual(await f.read('mike'), first, 'a runtime without Cache API still serves the same card');
});
