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
  { dir: 'pmm', prefix: 'pmm-', pages: ['/pmm/', '/pmm/brand/', '/pmm/moods/'] },
  { dir: 'nouns-messenger', prefix: 'nouns-messenger-', pages: ['/nouns-messenger/'] },
];

const read = (p) => readFileSync(resolve(PUBLIC, p), 'utf8');
const list = (src) => [...(/const FILES = \[([^\]]*)\]/.exec(src)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
const version = (src) => /const VERSION = '([^']+)'/.exec(src)?.[1];

// Run a worker inside a sandbox with a fake Cache Storage and fake network, and hand back its handlers.
// Two workers can share one `store` (an upgrade); `deploy` labels what the network serves (a release).
function boot(src, { store = new Map(), deploy = null } = {}) {
  const cacheFor = (name) => {
    if (!store.has(name)) store.set(name, new Map());
    const m = store.get(name);
    const key = (r) => new URL(typeof r === 'string' ? r : r.url, 'https://pointcast.xyz').href;
    return {
      async addAll(reqs) { for (const r of reqs) m.set(key(r), new Response((deploy || 'precached') + ' ' + key(r))); },
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
    fetch: async (req) => { fetched.push(req.url); return new Response((deploy || 'network') + ' ' + req.url); },
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
    assert.equal(await w.route(`/${app.dir}/index.html?utm=x`, { mode: 'navigate' }), `precached https://pointcast.xyz/${app.dir}/`, 'answered from the cache at once');
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(await w.route(`/${app.dir}/`, { mode: 'navigate' }), `network https://pointcast.xyz/${app.dir}/index.html?utm=x`, 'the one page copy was refreshed in the background by the previous navigation');
    for (const p of app.pages) assert.ok((await w.route(p, { mode: 'navigate' })).includes(`https://pointcast.xyz${p}`), `${p} is served under its own key`);
    assert.equal(await w.route('/api/pmm/signal'), null, 'the signal note is never handled');
    assert.equal(await w.route('/api/ping'), null, 'the SI packet is never handled');
    assert.equal(await w.route('/now.json'), null, 'the ticker is never handled');
    assert.equal(await w.route(`/${app.dir}/card.png`), null, 'files outside the list are not handled');
    assert.equal(await w.route(`/${app.dir}/sw.js`), null, 'the worker itself is not handled');
    assert.equal(await w.route(`/${app.dir}/app.js`, { method: 'POST' }), null, 'only GET is handled');
    assert.ok(w.fetched.every((u) => u.includes(`/${app.dir}/`)), 'background refreshes only touch the app\'s own files');
    assert.ok(files.includes(`/${app.dir}/app.js`));
  });

  test(`${app.dir}: a cache miss is fetched and kept; a hit answers from the cache and refreshes in the background; activate sweeps only this app's older caches`, async () => {
    const w = boot(src);
    const v = version(src);
    w.store.set(v, new Map()); // installed, but the cache came up empty
    assert.equal(await w.route(`/${app.dir}/app.js`), `network https://pointcast.xyz/${app.dir}/app.js`);
    assert.deepEqual(w.fetched, [`https://pointcast.xyz/${app.dir}/app.js`]);
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(await w.route(`/${app.dir}/app.js`), `network https://pointcast.xyz/${app.dir}/app.js`, 'the second request is answered from the cache');
    assert.equal(w.fetched.length, 2, 'and the same file is refreshed in the background');
    w.store.set(`${app.prefix}2020-01-01`, new Map());
    w.store.set('other-app-v1', new Map());
    await new Promise((done) => w.handlers.activate({ waitUntil: (p) => p.then(done) }));
    assert.deepEqual([...w.store.keys()].sort(), [v, 'other-app-v1'].sort());
  });
}

// A phone that installed the 10-22a cache-first worker (#1489) meets the current worker on its next
// online visit. The new worker must precache the current deploy into its own cache, drop the old
// cache on activate, and from then on answer from the new copy, refreshing it in the background.
const FIXTURES = resolve(import.meta.dirname, 'fixtures/pmm-offline');
const settle = () => new Promise((r) => setTimeout(r, 0));
const run = (handlers, type) => new Promise((done) => handlers[type]({ waitUntil: (p) => p.then(done) }));
for (const app of APPS) {
  test(`${app.dir}: upgrading from the 10-22a cache-first worker drops its cache and serves the new deploy`, async () => {
    const oldSrc = readFileSync(resolve(FIXTURES, `${app.dir}-sw-2026-10-22a.js`), 'utf8');
    const newSrc = read(`${app.dir}/sw.js`);
    assert.equal(version(oldSrc), `${app.prefix}2026-10-22a`);
    assert.notEqual(version(newSrc), version(oldSrc), 'the current worker uses a new cache name');
    const store = new Map();
    const before = boot(oldSrc, { store, deploy: 'deploy1' });
    await run(before.handlers, 'install'); await run(before.handlers, 'activate');
    assert.equal(await before.route(`/${app.dir}/app.js`), `deploy1 https://pointcast.xyz/${app.dir}/app.js`);
    assert.equal(before.fetched.length, 0, 'the old worker never refreshes: cache-first only');

    const after = boot(newSrc, { store, deploy: 'deploy2' });
    await run(after.handlers, 'install');
    assert.deepEqual([...store.keys()].sort(), [version(oldSrc), version(newSrc)].sort(), 'both caches exist while the new worker waits to activate');
    await run(after.handlers, 'activate');
    assert.deepEqual([...store.keys()], [version(newSrc)], 'activate dropped the 10-22a cache');
    for (const f of list(newSrc)) assert.ok(store.get(version(newSrc)).has(`https://pointcast.xyz${f}`), `${f} is precached from the new deploy`);
    assert.equal(await after.route(`/${app.dir}/app.js`), `deploy2 https://pointcast.xyz/${app.dir}/app.js`, 'the first request after the upgrade is the new deploy');
    assert.equal(await after.route(`/${app.dir}/`, { mode: 'navigate' }), `deploy2 https://pointcast.xyz/${app.dir}/`);
    await settle();

    // A later deploy with no VERSION bump: the next open answers from cache, the one after gets it.
    const later = boot(newSrc, { store, deploy: 'deploy3' });
    assert.equal(await later.route(`/${app.dir}/app.js`), `deploy2 https://pointcast.xyz/${app.dir}/app.js`, 'answered from the cache at once');
    await settle();
    assert.equal(await later.route(`/${app.dir}/app.js`), `deploy3 https://pointcast.xyz/${app.dir}/app.js`, 'the background refresh landed for the next open');
    assert.ok(later.fetched.every((u) => u.startsWith(`https://pointcast.xyz/${app.dir}/`)), 'refreshes only touch the app\'s own files');
  });
}
