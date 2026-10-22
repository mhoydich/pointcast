import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { offerPrayer, readTotal, RATE_KV_TTL_SECONDS, RATE_WINDOW_MS } from '../functions/_lib/grok-prayer.mjs';
import { playCourtBell, wireCourtPrayer } from '../src/lib/grok-court-prayer.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function memoryKv() {
  const store = new Map();
  const writes = [];
  return {
    store,
    writes,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value, opts) {
      writes.push({ key, value: String(value), opts });
      store.set(key, String(value));
    },
  };
}

function memoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
  };
}

function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function audioClass() {
  const made = [];
  class FakeAudio {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 4;
      this.destination = {};
      this.starts = [];
      this.stops = [];
      made.push(this);
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    createGain() { return this.node(); }
    createOscillator() { return this.node(); }
    node() {
      const param = () => ({
        setValueAtTime() {},
        exponentialRampToValueAtTime(value) { this.peaks = this.peaks || []; this.peaks.push(value); },
      });
      const self = this;
      return {
        gain: param(),
        frequency: param(),
        type: 'sine',
        connect() { return this; },
        start(time) { self.starts.push(time); },
        stop(time) { self.stops.push(time); },
      };
    }
  }
  return { FakeAudio, made };
}

function courtDom() {
  const dom = new JSDOM(`
    <section id="court-prayer" class="pray">
      <button type="button" id="pray-button">Offer a prayer</button>
      <span class="digits" id="pray-digits"></span>
      <p id="pray-note"></p>
      <p id="pray-status" role="status"></p>
    </section>
  `, { url: 'https://pointcast.xyz/grok/', runScripts: 'outside-only' });
  return dom;
}

test('the shared tally starts at zero and counts one prayer per session window', async () => {
  const kv = memoryKv();
  assert.deepEqual(await readTotal(null), { ok: false, reason: 'kv-not-bound', total: 0, storage: 'unbound' });
  assert.equal((await readTotal(kv)).total, 0);
  assert.equal((await offerPrayer(null, { sessionId: 'a' })).status, 503);

  const missing = await offerPrayer(kv, { sessionId: '   ' });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.reason, 'missing-session');

  const first = await offerPrayer(kv, { sessionId: 'visitor-a', now: 1_000 });
  assert.equal(first.status, 200);
  assert.equal(first.body.total, 1);
  assert.equal(first.body.storage, 'kv');
  const rateWrite = kv.writes.find((w) => w.key.startsWith('grok:prayer:rate:'));
  assert.equal(rateWrite.opts.expirationTtl, RATE_KV_TTL_SECONDS);

  const again = await offerPrayer(kv, { sessionId: 'visitor-a', now: 1_000 + RATE_WINDOW_MS - 1 });
  assert.equal(again.status, 429);
  assert.equal(again.body.total, 1);

  const other = await offerPrayer(kv, { sessionId: 'visitor-b', now: 1_200 });
  assert.equal(other.body.total, 2);
  const later = await offerPrayer(kv, { sessionId: 'visitor-a', now: 1_000 + RATE_WINDOW_MS });
  assert.equal(later.body.total, 3);
  assert.equal((await readTotal(kv)).total, 3);
});

test('the bell is scheduled from a running context and stays under two seconds', () => {
  const { FakeAudio } = audioClass();
  const ctx = new FakeAudio();
  ctx.state = 'running';
  const tone = playCourtBell(ctx);
  assert.equal(tone.duration, 1.7);
  assert.equal(ctx.starts.length, 3);
  assert.ok(ctx.stops.every((t) => t <= ctx.currentTime + 2));
  assert.ok(ctx.starts.every((t) => t === ctx.currentTime));
});

test('the prayer button waits for a tap, then rings and shares the count', async () => {
  const dom = courtDom();
  const { window } = dom;
  const { FakeAudio, made } = audioClass();
  const storage = memoryStorage();
  let releaseGet;
  const calls = [];
  const fetchImpl = (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push({ url, method, body: opts.body });
    if (method === 'GET') {
      return new Promise((resolve) => {
        releaseGet = () => resolve(jsonResponse({ ok: true, total: 4, storage: 'kv' }));
      });
    }
    return Promise.resolve(jsonResponse({ ok: true, total: 5, storage: 'kv' }));
  };

  try {
    wireCourtPrayer(window.document, {
      fetchImpl,
      storage,
      AudioContext: FakeAudio,
      reducedMotion: false,
      coolMs: 0,
    });
    assert.equal(made.length, 0, 'no audio before a tap');
    releaseGet();
    await new Promise((r) => setImmediate(r));
    assert.equal(window.document.getElementById('pray-digits').getAttribute('aria-label'), '4');
    assert.match(window.document.getElementById('pray-note').textContent, /Shared tally/);

    window.document.getElementById('pray-button').click();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    assert.equal(made.length, 1);
    assert.equal(made[0].starts.length, 3);
    assert.equal(window.document.getElementById('court-prayer').classList.contains('is-rising'), true);
    assert.equal(window.document.getElementById('pray-digits').getAttribute('aria-label'), '5');
    assert.match(window.document.getElementById('pray-status').textContent, /small bell/);
    const post = calls.find((c) => c.method === 'POST');
    assert.equal(post.url, '/api/grok/prayer');
    assert.equal(JSON.parse(post.body).sessionId.length > 8, true);
    assert.equal(storage.getItem('pc-grok-prayer-total'), '5');
  } finally {
    window.close();
  }
});

test('reduced motion still rings, and a quiet store stays on this browser', async () => {
  const dom = courtDom();
  const { window } = dom;
  const { FakeAudio, made } = audioClass();
  const storage = memoryStorage({ 'pc-grok-prayer-total': '2' });
  const fetchImpl = async () => { throw new Error('offline'); };

  try {
    wireCourtPrayer(window.document, {
      fetchImpl,
      storage,
      AudioContext: FakeAudio,
      reducedMotion: true,
      coolMs: 0,
    });
    await new Promise((r) => setImmediate(r));
    assert.match(window.document.getElementById('pray-note').textContent, /this browser/);
    assert.equal(window.document.getElementById('pray-digits').getAttribute('aria-label'), '2');
    assert.equal(made.length, 0);

    window.document.getElementById('pray-button').click();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    assert.equal(made.length, 1);
    assert.equal(window.document.getElementById('court-prayer').classList.contains('is-rising'), false);
    assert.equal(window.document.getElementById('court-prayer').classList.contains('is-lit'), true);
    assert.equal(window.document.getElementById('pray-digits').getAttribute('aria-label'), '3');
    assert.equal(storage.getItem('pc-grok-prayer-total'), '3');
    assert.match(window.document.getElementById('pray-status').textContent, /this browser/);
  } finally {
    window.close();
  }
});

test('a stalled tone still records the prayer', async () => {
  const dom = courtDom();
  const { window } = dom;
  class HungAudio {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    resume() { return new Promise(() => {}); }
    createOscillator() { throw new Error('should not schedule'); }
    createGain() { throw new Error('should not schedule'); }
  }
  const storage = memoryStorage();
  const fetchImpl = async () => { throw new Error('offline'); };
  try {
    wireCourtPrayer(window.document, {
      fetchImpl,
      storage,
      AudioContext: HungAudio,
      audioWaitMs: 30,
      coolMs: 0,
    });
    await new Promise((r) => setImmediate(r));
    window.document.getElementById('pray-button').click();
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(window.document.getElementById('pray-digits').getAttribute('aria-label'), '1');
    assert.match(window.document.getElementById('pray-status').textContent, /tone did not start/);
    assert.equal(storage.getItem('pc-grok-prayer-total'), '1');
  } finally {
    window.close();
  }
});

test('a rate limit puts the shared total back', async () => {
  const dom = courtDom();
  const { window } = dom;
  const { FakeAudio } = audioClass();
  const storage = memoryStorage();
  const fetchImpl = async (_url, opts = {}) => {
    if ((opts.method || 'GET') === 'GET') return jsonResponse({ ok: true, total: 9, storage: 'kv' });
    return jsonResponse({ ok: false, reason: 'rate-limited', total: 9, storage: 'kv' }, 429);
  };
  try {
    wireCourtPrayer(window.document, { fetchImpl, storage, AudioContext: FakeAudio, coolMs: 0 });
    await new Promise((r) => setImmediate(r));
    window.document.getElementById('pray-button').click();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    assert.equal(window.document.getElementById('pray-digits').getAttribute('aria-label'), '9');
    assert.match(window.document.getElementById('pray-status').textContent, /Wait a moment/);
  } finally {
    window.close();
  }
});

test('the grok page, route, and archive files are all on this branch', () => {
  const page = read('src/pages/grok.astro');
  const css = read('src/styles/grok-court.css');
  const route = read('functions/api/grok/prayer.ts');
  const script = read('src/scripts/grok-page.mjs');
  const lib = read('src/lib/grok-court-prayer.mjs');
  assert.match(page, /id="pray-button"/);
  assert.match(page, />Offer a prayer</);
  assert.match(page, /type="button"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /pray-glow/);
  assert.match(route, /onRequestGet/);
  assert.match(route, /onRequestPost/);
  assert.match(route, /grok-prayer\.mjs/);
  assert.match(script, /wireCourtPrayer\(document\)/);
  const clickAt = lib.indexOf("button.addEventListener('click'");
  assert.equal(lib.slice(0, clickAt).includes('await ring()'), false);
  assert.equal(lib.slice(clickAt).includes('await ring()'), true);

  const images = [
    'public/features/good-form-strange-fortunes/assets/court.webp',
    'public/features/good-form-strange-fortunes/assets/bloom.webp',
    'public/images/small-shrines/garden.webp',
    'public/images/small-shrines/memory.webp',
    'public/garden-signal/open-heart/door-01.jpg',
    'public/garden-signal/open-heart/door-02.jpg',
    'public/garden-signal/open-heart/door-03.jpg',
    'public/garden-signal/open-heart/door-04.jpg',
  ];
  for (const image of images) assert.equal(existsSync(new URL(`../${image}`, import.meta.url)), true, image);
  for (const src of [
    '/features/good-form-strange-fortunes/assets/court.webp',
    '/features/good-form-strange-fortunes/assets/bloom.webp',
    '/images/small-shrines/garden.webp',
    '/images/small-shrines/memory.webp',
    '/garden-signal/open-heart/door-01.jpg',
    '/garden-signal/open-heart/door-04.jpg',
  ]) {
    assert.equal(page.includes(src), true, src);
  }
  const shrines = read('public/images/small-shrines/provenance.json');
  const collection = read('public/features/good-form-strange-fortunes/index.json');
  const heart = read('public/garden-signal/open-heart.json');
  assert.match(shrines, /Midjourney/);
  assert.match(shrines, /garden\.webp/);
  assert.match(shrines, /memory\.webp/);
  assert.match(collection, /court\.webp/);
  assert.match(collection, /bloom\.webp/);
  assert.match(collection, /midjourney\.com/);
  assert.match(heart, /Midjourney/);
  assert.match(heart, /door-01\.jpg/);
});
