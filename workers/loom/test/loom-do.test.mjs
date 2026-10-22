// Loom v2 on the real Workers runtime: the service (src/lib/loom/service.mjs)
// running against LoomDoc objects in Miniflare, with SQLite persistence.
//   cd workers/loom && npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../../node_modules/esbuild/lib/main.js';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { handleLoom } from '../../../src/lib/loom/service.mjs';
import { addressKey } from '../../../src/lib/loom/address.mjs';
import { doStore, kvStore, loomStore } from '../../../src/lib/loom/store.mjs';
import { generateKeyPair, open, seal } from '../../../src/lib/loom/seal.mjs';

const source = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const compiled = await build({ entryPoints: [source], bundle: true, write: false, format: 'esm', platform: 'browser', external: ['cloudflare:workers'] });
const script = compiled.outputFiles[0].text;

function runtime(path) {
  return new Miniflare({
    ...convertV4MiniflareOptions({
      modules: true, script, compatibilityDate: '2026-09-14',
      durableObjects: { LOOM: { className: 'LoomDoc', useSQLite: true } },
      durableObjectsPersist: path, log: new Log(LogLevel.ERROR),
    }),
    resourcePersistencePath: path,
  });
}
function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const base = 'https://pointcast.xyz/api/loom';
const post = (store, body, opts = {}) => handleLoom(new Request(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { store, ...opts });
const get = async (store, query) => (await handleLoom(new Request(`${base}${query}`), { store })).json();

async function withRuntime(fn) {
  const path = await mkdtemp(join(tmpdir(), 'loom-do-test-'));
  const state = { mf: runtime(path) };
  try { await fn(state, path); } finally { await state.mf.dispose(); await rm(path, { recursive: true, force: true }); }
}

test('forty people appending to one thread at once all land, in order, and survive a restart', { timeout: 60_000 }, async () => {
  await withRuntime(async (state, path) => {
    const store = doStore(await state.mf.getDurableObjectNamespace('LOOM'));
    const results = await Promise.all(Array.from({ length: 40 }, (_, i) => post(store, { to: '#rush', from: { name: `P${i}`, kind: 'human' }, body: `message ${i}` })));
    assert.deepEqual(results.map((r) => r.status), Array(40).fill(201));
    let log = await get(store, '?to=%23rush');
    assert.equal(log.count, 40);
    assert.equal(log.seq, 40);
    assert.deepEqual(log.ops.map((o) => o.seq), Array.from({ length: 40 }, (_, i) => i + 1));
    assert.equal(log.storage, 'durable-object');
    assert.match(log.log.live, /^wss:\/\/pointcast\.xyz\/api\/loom\/live\?to=%23rush$/);
    assert.ok(!JSON.stringify(log).includes('tokenHash'));
    const directory = await get(store, '');
    assert.equal(directory.logs.find((e) => e.address === '#rush').count, 40);

    await state.mf.dispose();
    state.mf = runtime(path);
    log = await get(doStore(await state.mf.getDurableObjectNamespace('LOOM')), '?to=%23rush');
    assert.equal(log.count, 40, 'the thread is still there after the runtime restarts');
  });
});

test('the v1 KV store loses concurrent writes; that is the race v2 removes', async () => {
  // Real KV reads and writes take milliseconds, which is what opens the window.
  const map = new Map();
  const lag = () => new Promise((r) => setTimeout(r, 1 + Math.random() * 4));
  const kv = { get: async (k) => { await lag(); return map.get(k) ?? null; }, put: async (k, v) => { await lag(); map.set(k, v); } };
  await Promise.all(Array.from({ length: 20 }, (_, i) => post(kvStore(kv), { to: '#rush', from: { name: `P${i}`, kind: 'human' }, body: `m${i}` })));
  const log = await get(kvStore(kv), '?to=%23rush');
  assert.ok(log.count < 20, `expected lost writes under KV, kept ${log.count}`);
});

test('watchers get each append pushed the moment it lands, without private fields', { timeout: 30_000 }, async () => {
  await withRuntime(async ({ mf }) => {
    const ns = await mf.getDurableObjectNamespace('LOOM');
    const store = doStore(ns);
    await post(store, { to: '#live', from: { name: 'First', kind: 'human' }, body: 'before anyone watched' });
    const key = await addressKey('#live');
    const res = await store.connect(key, new Request('https://pointcast.xyz/api/loom/live?to=%23live', { headers: { Upgrade: 'websocket' } }));
    assert.equal(res.status, 101);
    const ws = res.webSocket;
    const messages = [];
    const waiters = [];
    ws.accept();
    ws.addEventListener('message', (e) => {
      if (e.data === 'pong') { messages.push('pong'); } else messages.push(JSON.parse(e.data));
      for (const w of [...waiters]) { const hit = messages.find(w.match); if (hit) { waiters.splice(waiters.indexOf(w), 1); w.resolve(hit); } }
    });
    const next = (match) => messages.find(match) ? Promise.resolve(messages.find(match)) : new Promise((resolve, reject) => { waiters.push({ match, resolve }); setTimeout(() => reject(new Error(`timeout; got ${JSON.stringify(messages)}`)), 4000); });
    const hello = await next((m) => m.type === 'hello');
    assert.deepEqual(hello, { type: 'hello', key, seq: 1 });
    ws.send('ping');
    await next((m) => m === 'pong');
    const made = await (await post(store, { to: '#live', from: { name: 'Second', kind: 'agent', model: 'test' }, body: 'pushed, not polled' })).json();
    const pushed = await next((m) => m.type === 'ops');
    assert.equal(pushed.seq, 2);
    assert.equal(pushed.ops[0].id, made.message.id);
    assert.equal(pushed.ops[0].body, 'pushed, not polled');
    assert.ok(!('tokenHash' in pushed.ops[0]));
    ws.close();
  });
});

test('a thread that lived in v1 KV is imported whole on its first v2 write; the directory is seeded once', { timeout: 30_000 }, async () => {
  await withRuntime(async ({ mf }) => {
    const kv = memoryKv();
    const v1 = kvStore(kv);
    const first = await (await post(v1, { to: 'https://pointcast.xyz/court', from: { name: 'Ana', kind: 'human' }, body: 'written under v1' })).json();
    await post(v1, { to: '#elsewhere', from: { name: 'Ben', kind: 'human' }, body: 'another v1 thread' });

    const v2 = loomStore({ ns: await mf.getDurableObjectNamespace('LOOM'), kv });
    let page = await get(v2, `?to=${encodeURIComponent('https://pointcast.xyz/court')}`);
    assert.equal(page.count, 1, 'read falls through to KV before the object exists');

    // The v1 edit token still works against the imported thread.
    const reply = await post(v2, { to: first.address, from: { name: 'Cy', kind: 'human' }, body: 'written under v2' });
    assert.equal(reply.status, 201);
    assert.equal((await post(v2, { action: 'edit', to: first.address, token: first.editToken, body: 'edited under v2' })).status, 200);
    page = await get(v2, `?to=${encodeURIComponent('https://pointcast.xyz/court')}`);
    assert.equal(page.count, 2);
    assert.equal(page.seq, 3);
    assert.equal(page.messages[0].body, 'edited under v2');
    assert.equal(page.messages[1].depth, 1);

    const directory = await get(v2, '');
    const addresses = directory.logs.map((e) => e.address);
    assert.ok(addresses.includes('#elsewhere'), 'the KV directory was carried over');
    assert.equal(addresses[0], 'https://pointcast.xyz/court');
    assert.equal(kv.map.get('loom:index') && JSON.parse(kv.map.get('loom:index')).length, 2, 'KV is never written by v2');
  });
});

test('sealed DMs on the Durable Object store: keys are compare-and-set, only the inbox can open', { timeout: 30_000 }, async () => {
  await withRuntime(async ({ mf }) => {
    const store = doStore(await mf.getDurableObjectNamespace('LOOM'));
    const bob = await generateKeyPair();
    const squatter = await generateKeyPair();
    const [a, b] = await Promise.all([
      post(store, { action: 'key', address: '@bob', publicKey: bob.publicKey }),
      post(store, { action: 'key', address: '@bob', publicKey: squatter.publicKey }),
    ]);
    const statuses = [a.status, b.status].sort();
    assert.equal(statuses[0], 201, 'exactly one first publish wins');
    assert.ok([403, 409].includes(statuses[1]));
    const winner = a.status === 201 ? bob : squatter;

    const keys = await get(store, '?key=%40bob');
    assert.equal(keys.keys.current.kid, winner.kid);
    const envelope = await seal('meet at court 3', [{ kid: keys.keys.current.kid, publicKey: keys.keys.current.publicKey }]);
    const sent = await post(store, { to: '@bob', from: { name: 'Ana', kind: 'human' }, sealed: envelope });
    assert.equal(sent.status, 201);
    const inbox = await get(store, '?to=%40bob');
    const message = inbox.messages[0];
    assert.equal(message.kind, 'sealed');
    assert.equal(message.body, '');
    assert.ok(!JSON.stringify(inbox).includes('meet at court'));
    assert.equal(await open(message.sealed, { kid: winner.kid, privateKey: winner.privateKey }), 'meet at court 3');
  });
});
