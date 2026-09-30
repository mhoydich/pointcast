import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { ROCK_FAMILIES } from '../src/lib/pocket-rocks.mjs';

const KEY = 'pc:pocket-rocks:cabinet:v1';
const root = new URL('../', import.meta.url);
const page = await readFile(new URL('src/pages/rocks.astro', root), 'utf8');
// Use the real page's controls. Only expand its server-rendered family loop.
const markup = page.match(/<(?:main|div)\b[^>]*data-pocket-rocks>[\s\S]*?(?=\s*<script>)/)[0].replace(
  /\{ROCK_FAMILIES\.map\([\s\S]*?\)\)\}/,
  ROCK_FAMILIES.map(family => `<button type="button" data-family="${family.id}" disabled>${family.geology}</button>`).join(''),
);
const bundled = await build({
  entryPoints: [fileURLToPath(new URL('src/scripts/pocket-rocks.ts', root))],
  bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent',
  plugins: [{
    name: 'gpu-boundary',
    setup(builder) {
      builder.onResolve({ filter: /pocket-rocks-renderer$/ }, () => ({ path: 'viewer', namespace: 'gpu-boundary' }));
      builder.onLoad({ filter: /.*/, namespace: 'gpu-boundary' }, () => ({
        // DOM emulation cannot provide WebGL. All collection, import, sharing,
        // validation and SVG logic comes from the unchanged production modules.
        contents: `export async function createRockViewer() {
          window.__viewerCreates++;
          if (window.__viewerFails) throw new Error('WebGL unavailable');
          return {setRock(){},turn(direction){window.__turns.push(direction)},dispose(){window.__viewerDisposes++}};
        }`,
      }));
    },
  }],
});
const client = bundled.outputFiles[0].text;
const settle = () => new Promise(resolve => setImmediate(resolve));

class SharedStorage {
  values = new Map();
  windows = new Set();
  events = [];
  readBlocked = false;
  writeBlocked = false;
  afterRead;
  attach(window) {
    this.windows.add(window);
    const storage = {
      getItem: key => {
        if (this.readBlocked) throw new window.DOMException('Blocked', 'SecurityError');
        const value = this.values.get(key) ?? null;
        const callback = this.afterRead;
        if (key === KEY && callback) { this.afterRead = undefined; callback(); }
        return value;
      },
      setItem: (key, value) => {
        if (this.writeBlocked) throw new window.DOMException('Full', 'QuotaExceededError');
        this.change(window, key, String(value));
      },
      removeItem: key => {
        if (this.writeBlocked) throw new window.DOMException('Blocked', 'SecurityError');
        this.change(window, key, null);
      },
    };
    Object.defineProperty(window, 'localStorage', { value: storage });
  }
  change(source, key, newValue) {
    const oldValue = this.values.get(key) ?? null;
    if (newValue === oldValue) return;
    if (newValue === null) this.values.delete(key); else this.values.set(key, newValue);
    for (const target of this.windows) if (target !== source) this.events.push({ target, key, oldValue, newValue, url: source.location.href });
  }
  flush(reverse = false) {
    let delivered = 0;
    while (this.events.length) {
      assert.ok(delivered++ < 100, 'storage reconciliation must converge');
      const event = reverse ? this.events.pop() : this.events.shift();
      event.target.dispatchEvent(new event.target.StorageEvent('storage', event));
    }
  }
  saved() { return JSON.parse(this.values.get(KEY)); }
}

async function open(t, { storage = new SharedStorage(), url = 'https://pointcast.test/rocks/', clipboardRejects = false, viewerFails = false } = {}) {
  const dom = new JSDOM(markup, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const window = dom.window;
  const downloads = [], copies = [];
  storage.attach(window);
  window.__viewerCreates = 0; window.__viewerDisposes = 0; window.__turns = []; window.__viewerFails = viewerFails;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: true });
  window.Blob = Blob;
  window.URL.createObjectURL = blob => { downloads.push({ blob }); return `blob:test-${downloads.length}`; };
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function () { downloads.at(-1).filename = this.download; };
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async text => { if (clipboardRejects) throw new Error('Clipboard blocked'); copies.push(text); } } });
  let seed = 100;
  Object.defineProperty(window.crypto, 'getRandomValues', { value: array => { array[0] = seed++; return array; } });
  window.eval(client);
  await settle();
  t.after(() => { storage.windows.delete(window); window.close(); });
  const $ = selector => window.document.querySelector(selector);
  return {
    window, storage, downloads, copies, $, click: selector => $(selector).click(),
    count: () => Number($('[data-cabinet-count]').textContent),
    status: () => $('[data-rock-status]').textContent,
    import: async (text, size = Buffer.byteLength(text)) => {
      const input = $('[data-import]');
      Object.defineProperty(input, 'files', { configurable: true, value: [{ size, text: async () => text }] });
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
      await settle();
    },
    export: async () => {
      $('[data-export]').click();
      return JSON.parse(await downloads.at(-1).blob.text());
    },
  };
}

test('actual controls keep once, persist across reloads, and give specimens distinct accessible names', async t => {
  const storage = new SharedStorage();
  const first = await open(t, { storage });
  assert.equal(first.count(), 0);
  first.click('[data-keep]'); first.click('[data-keep]');
  assert.equal(first.count(), 1);
  assert.equal(first.$('[data-keep]').disabled, true);
  first.click('[data-family="agate"]'); first.click('[data-keep]');
  assert.equal(first.count(), 2);
  const labels = [...first.window.document.querySelectorAll('[data-specimen]')].map(button => button.getAttribute('aria-label'));
  assert.equal(new Set(labels).size, 2);
  assert.ok(labels.every(label => /specimen [0-9A-F]{8}/.test(label)));
  const reload = await open(t, { storage });
  assert.equal(reload.count(), 2);
  assert.equal(reload.$('[data-keep]').disabled, true);
  assert.equal(reload.$('[data-rock-number]').textContent, '01140FFA');
  first.click('[data-specimen="PR-AGATE-00000064"]'); first.click('[data-feature]');
  const favoriteReload = await open(t, { storage });
  assert.equal(favoriteReload.$('[data-rock-number]').textContent, '00000064');
});

test('actual share handling rejects invalid seeds/families and shares the displayed safe specimen', async t => {
  for (const query of ['seed=4294967296&family=basalt', 'seed=-1&family=basalt', 'seed=1e2&family=basalt', 'seed=5&family=__proto__', 'seed=5']) {
    const app = await open(t, { url: `https://pointcast.test/rocks/?${query}&private=secret#cabinet` });
    assert.match(app.status(), /specimen link was not valid/);
    assert.equal(app.$('[data-rock-number]').textContent, '01140FFA');
    app.click('[data-share]'); await settle();
    const link = new URL(app.copies[0]);
    assert.equal(link.searchParams.get('seed'), '18092026');
    assert.equal(link.searchParams.get('family'), 'agate');
    assert.equal(link.searchParams.has('private'), false);
    assert.equal(link.hash, '');
  }
  const zero = await open(t, { url: 'https://pointcast.test/rocks/?seed=0&family=basalt', clipboardRejects: true });
  assert.equal(zero.$('[data-rock-number]').textContent, '00000000');
  zero.click('[data-share]'); await settle();
  assert.equal(zero.$('[data-share-fallback]').hidden, false);
  assert.equal(new URL(zero.$('[data-share-url]').value).searchParams.get('seed'), '0');
});

test('actual export/import transfers a cabinet, merges duplicates, and rejects bad files without losing finds', async t => {
  const source = await open(t);
  source.click('[data-keep]'); source.click('[data-family="basalt"]'); source.click('[data-keep]');
  const exported = await source.export();
  assert.equal(source.downloads.at(-1).filename, 'pointcast-pocket-rocks-cabinet.json');
  assert.equal(exported.rocks.length, 2);
  const target = await open(t);
  await target.import(JSON.stringify(exported));
  assert.equal(target.count(), 2);
  await target.import(JSON.stringify(exported));
  assert.equal(target.count(), 2);
  assert.match(target.status(), /^0 rocks added/);
  const safeNames = [...target.window.document.querySelectorAll('[data-specimen] strong')].map(el => el.textContent);
  const forged = structuredClone(exported);
  forged.rocks[0].name = '<script>window.attack=true</script>';
  forged.rocks[0].palette = ['url(https://example.com/attack)'];
  await target.import(JSON.stringify(forged));
  assert.equal(target.window.attack, undefined);
  assert.deepEqual([...target.window.document.querySelectorAll('[data-specimen] strong')].map(el => el.textContent), safeNames);
  await target.import('{');
  assert.equal(target.count(), 2);
  assert.match(target.status(), /no valid Pocket Rocks specimens/);
  await target.import(JSON.stringify(exported), 1_000_001);
  assert.equal(target.count(), 2);
  assert.match(target.status(), /smaller than 1 MB/);
  source.click('[data-artwork]');
  const artwork = await source.downloads.at(-1).blob.text();
  assert.match(artwork, /^<svg/);
  assert.match(artwork, /width="1200"/);
  assert.match(source.downloads.at(-1).filename, /^pr-basalt-[a-f0-9]+\.svg$/);
});

test('blocked storage keeps a visit cabinet and lets its real export preserve the finds', async t => {
  const storage = new SharedStorage(); storage.readBlocked = true; storage.writeBlocked = true;
  const app = await open(t, { storage });
  assert.match(app.$('[data-storage-note]').textContent, /Storage is unavailable/);
  app.click('[data-keep]');
  assert.equal(app.count(), 1);
  assert.match(app.status(), /kept for this visit/);
  const exported = await app.export();
  assert.equal(exported.rocks.length, 1);
  const reload = await open(t, { storage });
  assert.equal(reload.count(), 0);
  const restored = await open(t);
  await restored.import(JSON.stringify(exported));
  assert.equal(restored.count(), 1);
});

test('a quota failure after a saved find preserves both visit finds in the exported backup', async t => {
  const storage = new SharedStorage();
  const app = await open(t, { storage });
  app.click('[data-keep]');
  storage.writeBlocked = true;
  app.click('[data-family="granite"]'); app.click('[data-keep]');
  assert.equal(app.count(), 2);
  assert.equal(storage.saved().rocks.length, 1);
  assert.match(app.status(), /kept for this visit/);
  assert.equal((await app.export()).rocks.length, 2);
});

test('two real clients reconcile overlapping writes and out-of-order storage events without losing a rock', async t => {
  const storage = new SharedStorage();
  const a = await open(t, { storage, url: 'https://pointcast.test/rocks/?seed=10&family=basalt' });
  const b = await open(t, { storage, url: 'https://pointcast.test/rocks/?seed=20&family=granite' });
  storage.events.length = 0;
  // Different tabs can read the same old value before either write completes.
  // Interleave at the storage API boundary; neither client logic is replaced.
  storage.afterRead = () => b.click('[data-keep]');
  a.click('[data-keep]');
  storage.flush(true);
  assert.equal(a.count(), 2);
  assert.equal(b.count(), 2);
  assert.deepEqual(new Set(storage.saved().rocks.map(rock => rock.id)), new Set(['PR-BASALT-0000000A', 'PR-GRANITE-00000014']));
  const reload = await open(t, { storage });
  assert.equal(reload.count(), 2);
});

test('viewer fallback availability updates real controls and page lifecycle mounts only once', async t => {
  const app = await open(t);
  app.window.document.dispatchEvent(new app.window.Event('astro:page-load'));
  await settle();
  assert.equal(app.window.__viewerCreates, 1);
  assert.equal(app.$('[data-turn]').disabled, false);
  const stage = app.$('[data-rock-stage]');
  stage.dispatchEvent(new app.window.CustomEvent('rock-viewer-status', { detail: { available: false } }));
  assert.equal(app.$('[data-turn]').disabled, true);
  assert.match(app.$('[data-turn-hint]').textContent, /Illustrated specimen/);
  stage.dispatchEvent(new app.window.CustomEvent('rock-viewer-status', { detail: { available: true } }));
  assert.equal(app.$('[data-turn]').disabled, false);
  app.click('[data-turn="1"]');
  stage.dispatchEvent(new app.window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
  assert.deepEqual([...app.window.__turns], [1, -1]);
  app.window.document.dispatchEvent(new app.window.Event('astro:before-swap'));
  assert.equal(app.window.__viewerDisposes, 1);
  app.click('[data-keep]');
  assert.equal(app.count(), 0);
  const fallback = await open(t, { viewerFails: true });
  assert.equal(fallback.$('[data-turn]').disabled, true);
  assert.match(fallback.$('[data-turn-hint]').textContent, /Illustrated specimen/);
  assert.ok(fallback.$('[data-rock-fallback] svg[role="img"]'));
});

test('clipboard rejection after page cleanup does not reopen or focus a stale share control', async t => {
  const app = await open(t);
  let reject;
  app.window.navigator.clipboard.writeText = () => new Promise((resolve, fail) => { reject = fail; });
  app.click('[data-share]');
  app.window.document.dispatchEvent(new app.window.Event('astro:before-swap'));
  reject(new Error('Clipboard permission rejected'));
  await settle();
  assert.equal(app.$('[data-share-fallback]').hidden, true);
  assert.equal(app.status(), '');
  assert.notEqual(app.window.document.activeElement, app.$('[data-share-url]'));
});
