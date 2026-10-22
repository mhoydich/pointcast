// The PMM and Nouns Messenger service workers: each precaches only files that exist,
// serves its own app cache-first, leaves /api/ and /now.json to the network, and
// sweeps its own older caches without touching the other app's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const PUBLIC = resolve(import.meta.dirname, '../public');
const APPS = [
  { dir: 'pmm', prefix: 'pmm-', pages: ['/pmm/', '/pmm/brand/'] },
  { dir: 'nouns-messenger', prefix: 'nouns-messenger-', pages: ['/nouns-messenger/'] },
];

const read = (p) => readFileSync(resolve(PUBLIC, p), 'utf8');
const list = (src) => [...(/const FILES = \[([^\]]*)\]/.exec(src)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
const version = (src) => /const VERSION = '([^']+)'/.exec(src)?.[1];

// Run a worker inside a sandbox with a fake Cache Storage and fake network, and hand back its handlers.
function boot(src) {
  const store = new Map();
  const cacheFor = (name) => {
    if (!store.has(name)) store.set(name, new Map());
    const m = store.get(name);
    const key = (r) => new URL(typeof r === 'string' ? r : r.url, 'https://pointcast.xyz').href;
    return {
      async addAll(reqs) { for (const r of reqs) m.set(key(r), new Response('precached ' + key(r))); },
      async match(r) { return m.get(key(r))?.clone(); },
      async put(r, res) { m.set(key(r), res); },
    };
  };
  const handlers = {};
  const fetched = [];
  const self = {
    location: new URL('https://pointcast.xyz/x/sw.js'),
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  // A worker resolves relative URLs against its own origin; Node's Request does not.
  class SwRequest extends Request { constructor(input, init) { super(typeof input === 'string' ? new URL(input, 'https://pointcast.xyz').href : input, init); } }
  const ctx = {
    self, URL, Request: SwRequest, Response, console,
    caches: { open: async (n) => cacheFor(n), keys: async () => [...store.keys()], delete: async (n) => store.delete(n), store },
    fetch: async (req) => { fetched.push(req.url); return new Response('network ' + req.url); },
  };
  vm.runInNewContext(src, ctx, { filename: 'sw.js' });
  const route = async (url, init = {}) => {
    const { mode, ...rest } = init;
    const req = new Request('https://pointcast.xyz' + url, rest);
    if (mode) Object.defineProperty(req, 'mode', { value: mode }); // Node refuses mode: 'navigate' up front
    let out = null;
    handlers.fetch({ request: req, respondWith: (p) => { out = p; } });
    return out ? (await out).text() : null;
  };
  return { handlers, store, fetched, route };
}

for (const app of APPS) {
  const src = read(`${app.dir}/sw.js`);

  test(`${app.dir}: the worker names a dated version and precaches only files that exist`, () => {
    assert.match(version(src), new RegExp(`^${app.prefix}\\d{4}-\\d{2}-\\d{2}[a-z]?$`));
    const files = list(src);
    assert.ok(files.length >= 7, 'precache list is present');
    for (const f of files) {
      const onDisk = resolve(PUBLIC, '.' + (f.endsWith('/') ? f + 'index.html' : f));
      assert.ok(existsSync(onDisk), `${f} exists under public/`);
      assert.ok(f.startsWith(`/${app.dir}/`), `${f} is inside the app's own scope`);
    }
    for (const p of app.pages) assert.ok(files.includes(p), `${p} is precached`);
    assert.ok(!files.some((f) => f.endsWith('/sw.js')), 'the worker never caches itself');
  });

  test(`${app.dir}: index.html registers the worker once, feature-detected, after load, without throwing`, () => {
    const html = read(`${app.dir}/index.html`);
    const lines = html.split('\n').filter((l) => l.includes('serviceWorker'));
    assert.equal(lines.length, 1);
    assert.match(lines[0], /'serviceWorker' in navigator/);
    assert.match(lines[0], /addEventListener\('load'/);
    assert.match(lines[0], new RegExp(`register\\('/${app.dir}/sw\\.js', \\{ scope: '/${app.dir}/' \\}\\)\\.catch`));
  });

  test(`${app.dir}: own files are cache-first, pages normalise to one cached copy, /api/ and /now.json are left alone`, async () => {
    const w = boot(src);
    await new Promise((done) => w.handlers.install({ waitUntil: (p) => p.then(done) }));
    const files = list(src);
    assert.equal(await w.route(`/${app.dir}/style.css`), `precached https://pointcast.xyz/${app.dir}/style.css`);
    assert.equal(await w.route(`/${app.dir}/index.html?utm=x`, { mode: 'navigate' }), `precached https://pointcast.xyz/${app.dir}/`);
    assert.equal(await w.route(`/${app.dir}/`, { mode: 'navigate' }), `precached https://pointcast.xyz/${app.dir}/`);
    for (const p of app.pages) assert.equal(await w.route(p, { mode: 'navigate' }), `precached https://pointcast.xyz${p}`);
    assert.equal(await w.route('/api/pmm/signal'), null, 'the signal note is never handled');
    assert.equal(await w.route('/api/ping'), null, 'the SI packet is never handled');
    assert.equal(await w.route('/now.json'), null, 'the ticker is never handled');
    assert.equal(await w.route(`/${app.dir}/card.png`), null, 'files outside the list are not handled');
    assert.equal(await w.route(`/${app.dir}/sw.js`), null, 'the worker itself is not handled');
    assert.equal(await w.route(`/${app.dir}/app.js`, { method: 'POST' }), null, 'only GET is handled');
    assert.equal(w.fetched.length, 0, 'nothing went to the network while every file was cached');
    assert.ok(files.includes(`/${app.dir}/app.js`));
  });

  test(`${app.dir}: a file missing from the cache is fetched once and kept; activate sweeps only this app's older caches`, async () => {
    const w = boot(src);
    const v = version(src);
    w.store.set(v, new Map()); // installed, but the cache came up empty
    assert.equal(await w.route(`/${app.dir}/app.js`), `network https://pointcast.xyz/${app.dir}/app.js`);
    assert.deepEqual(w.fetched, [`https://pointcast.xyz/${app.dir}/app.js`]);
    assert.equal(await w.route(`/${app.dir}/app.js`), `network https://pointcast.xyz/${app.dir}/app.js`);
    assert.equal(w.fetched.length, 1, 'the second request came from the cache');
    w.store.set(`${app.prefix}2020-01-01`, new Map());
    w.store.set('other-app-v1', new Map());
    await new Promise((done) => w.handlers.activate({ waitUntil: (p) => p.then(done) }));
    assert.deepEqual([...w.store.keys()].sort(), [v, 'other-app-v1'].sort());
  });
}
