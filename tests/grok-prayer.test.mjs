import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { JSDOM } from 'jsdom';
import {
  handlePrayer,
  offerPrayer,
  readPrayer,
  hashIp,
  allowedOrigin,
  RATE_WINDOW_MS,
  OFFER_KEEP_MS,
  TOTAL_KEY,
} from '../functions/_lib/grok-prayer.mjs';
import { playCourtBell, wireCourtPrayer, safeStorage, BOOK_KEY, SOUND_KEY, COOL_MS } from '../src/lib/grok-court-prayer.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const MIGRATION = read('migrations/auth/0033_grok_prayer.sql');
const ORIGIN = 'https://pointcast.xyz';

function memoryKv({ failPut = false } = {}) {
  const store = new Map();
  const writes = [];
  return {
    store,
    writes,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value, opts) {
      if (failPut) throw new Error('kv down');
      writes.push({ key, value: String(value), opts });
      store.set(key, String(value));
    },
  };
}

/** D1 over node:sqlite. batch() is one transaction, matching Workers D1. */
class PrayerDb {
  constructor(sql = MIGRATION) {
    this.db = new DatabaseSync(':memory:');
    if (sql) this.db.exec(sql);
  }
  prepare(sql) {
    const db = this.db;
    let args = [];
    const reads = /^\s*SELECT|\bRETURNING\b/i.test(sql);
    const execute = () => {
      const statement = db.prepare(sql);
      if (!reads) return { results: [], success: true, meta: { changes: Number(statement.run(...args).changes) } };
      const results = statement.all(...args).map((row) => ({ ...row }));
      return { results, success: true, meta: { changes: 0 } };
    };
    const stmt = {
      bind(...values) { args = values; return stmt; },
      async first() { return execute().results[0] ?? null; },
      async all() { return execute(); },
      async run() { return execute(); },
      execute,
    };
    return stmt;
  }
  async batch(stmts) {
    this.db.exec('BEGIN');
    try {
      const out = stmts.map((statement) => statement.execute());
      this.db.exec('COMMIT');
      return out;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }
}

function memoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    store,
  };
}

function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function request(method, { origin, body, ip, raw } = {}) {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  if (ip) headers.set('cf-connecting-ip', ip);
  const init = { method, headers };
  if (method !== 'GET' && method !== 'OPTIONS') {
    headers.set('content-type', 'application/json');
    init.body = raw !== undefined ? raw : JSON.stringify(body ?? {});
  }
  return new Request('https://pointcast.xyz/api/grok/prayer', init);
}

async function bodyOf(response) {
  return response.json();
}

function lin(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function contrast(a, b) {
  const lum = (hex) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function audioClass({ hang = false } = {}) {
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
      if (hang) return new Promise(() => {});
      this.state = 'running';
      return Promise.resolve();
    }
    createGain() { return this.node(); }
    createOscillator() { return this.node(); }
    node() {
      const self = this;
      const param = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {} });
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
  const dom = new JSDOM(`<!doctype html><body>
    <section id="court-prayer" class="pray">
      <div class="pray__actions">
        <button type="button" id="pray-button">Offer a prayer</button>
        <button type="button" id="pray-sound" aria-pressed="true">Sound on</button>
      </div>
      <p class="pray__tally" aria-hidden="true"><span class="digits" id="pray-digits"></span></p>
      <p id="pray-live" aria-live="polite" aria-atomic="true"></p>
      <p id="pray-note"></p>
    </section>
  </body>`, { url: 'https://pointcast.xyz/grok/', runScripts: 'outside-only' });
  const doc = dom.window.document;
  return { doc, button: doc.getElementById('pray-button'), sound: doc.getElementById('pray-sound'), live: doc.getElementById('pray-live') };
}

function digits(doc) {
  return [...doc.querySelectorAll('#pray-digits .digit')].map((node) => node.textContent).join('');
}

function savedBook(storage) {
  return JSON.parse(storage.getItem(BOOK_KEY) || 'null');
}

async function waitFor(fn, ms = 700) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (fn()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`timed out: ${fn.toString()}`);
}

test('migration applies twice and the trigger is present', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(MIGRATION);
  db.exec(MIGRATION);
  const trigger = db.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'grok_prayer_apply'").get();
  assert.equal(trigger.name, 'grok_prayer_apply');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM grok_prayer_total').get().n, 0);
});

test('D1 counts one prayer per address window and replays the same id', async () => {
  const env = { AUTH_DB: new PrayerDb() };
  const first = await offerPrayer(env, { id: 'idem-key-1', ip: '10.0.0.1', now: 10_000 });
  const soon = await offerPrayer(env, { id: 'idem-key-2', ip: '10.0.0.1', now: 10_100 });
  const replay = await offerPrayer(env, { id: 'idem-key-1', ip: '10.0.0.9', now: 12_000 });
  const other = await offerPrayer(env, { id: 'idem-key-3', ip: '10.0.0.2', now: 10_200 });
  const later = await offerPrayer(env, { id: 'idem-key-4', ip: '10.0.0.1', now: 10_000 + RATE_WINDOW_MS });

  assert.equal(first.status, 200);
  assert.equal(first.body.total, 1);
  assert.equal(first.body.storage, 'd1');
  assert.equal(first.body.approximate, false);
  assert.equal(soon.status, 429);
  assert.equal(soon.body.total, 1);
  assert.equal(soon.body.retryAfterSec, 5);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.duplicate, true);
  assert.equal(replay.body.total, 1);
  assert.equal(other.body.total, 2);
  assert.equal(later.body.total, 3);
  assert.equal(later.body.duplicate, undefined);

  const read = await readPrayer(env);
  assert.equal(read.body.total, 3);
  assert.equal(read.body.approximate, false);
});

test('overlapping offers from one address count once', async () => {
  const env = { AUTH_DB: new PrayerDb() };
  const [a, b] = await Promise.all([
    offerPrayer(env, { id: 'idem-par-1', ip: '10.1.0.1', now: 50_000 }),
    offerPrayer(env, { id: 'idem-par-2', ip: '10.1.0.1', now: 50_000 }),
  ]);
  const accepted = [a, b].filter((result) => result.status === 200 && !result.body.duplicate);
  assert.equal(accepted.length, 1);
  assert.equal([a, b].filter((result) => result.status === 429).length, 1);
  assert.equal(Math.max(a.body.total, b.body.total), 1);
});

test('a fresh id does not skip the address limit, and old ids expire', async () => {
  const env = { AUTH_DB: new PrayerDb() };
  await offerPrayer(env, { id: 'idem-old-111', ip: '10.9.9.9', now: 1_000 });
  const bypass = await offerPrayer(env, { id: 'idem-new-222', ip: '10.9.9.9', now: 1_500 });
  assert.equal(bypass.status, 429);
  const again = await offerPrayer(env, { id: 'idem-old-111', ip: '10.9.9.9', now: 1_000 + OFFER_KEEP_MS + 10 });
  assert.equal(again.status, 200);
  assert.equal(again.body.duplicate, undefined);
  assert.equal(again.body.total, 2);
});

test('the rate key is a hash, never the address', async () => {
  const ip = '203.0.113.44';
  const hashed = await hashIp(ip);
  assert.equal(hashed.includes(ip), false);
  assert.equal(await hashIp(ip), hashed);
  assert.notEqual(await hashIp('203.0.113.45'), hashed);
  const kv = memoryKv();
  const response = await handlePrayer(request('POST', { origin: ORIGIN, ip, body: { id: 'idem-hash-1', ip: '198.51.100.9' } }), { VISITS: kv });
  assert.equal(response.status, 200);
  assert.equal([...kv.store.keys()].some((key) => key.includes(ip) || key.includes('198.51.100.9')), false);
  assert.equal([...kv.store.keys()].some((key) => key.includes(hashed)), true);
});

test('POST refuses another site, a null body, and a client-chosen session', async () => {
  const env = { AUTH_DB: new PrayerDb(), VISITS: memoryKv() };

  const evil = await handlePrayer(request('POST', { origin: 'https://evil.example', ip: '192.0.2.8', body: { id: 'idem-evil-1' } }), env);
  assert.equal(evil.status, 403);
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  assert.equal((await bodyOf(evil)).reason, 'origin');

  const missing = await handlePrayer(request('POST', { origin: ORIGIN, body: { sessionId: 'visitor-a' } }), env);
  assert.equal(missing.status, 400);
  assert.equal((await bodyOf(missing)).reason, 'bad-id');

  for (const raw of ['null', '[]', '{', '123']) {
    const response = await handlePrayer(request('POST', { origin: ORIGIN, raw }), env);
    assert.equal(response.status, 400);
    assert.equal((await bodyOf(response)).reason, 'bad-body');
    assert.notEqual(response.headers.get('access-control-allow-origin'), '*');
  }

  const read = await readPrayer(env);
  assert.equal(read.body.total, 0);
});

test('POST echoes the site origin and GET stays public', async () => {
  const env = { AUTH_DB: new PrayerDb() };
  const posted = await handlePrayer(request('POST', { origin: ORIGIN, ip: '192.0.2.10', body: { id: 'idem-cors-1' } }), env);
  assert.equal(posted.status, 200);
  assert.equal(posted.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(posted.headers.get('vary'), 'Origin');

  const www = await handlePrayer(request('OPTIONS', { origin: 'https://www.pointcast.xyz' }), env);
  assert.equal(www.status, 204);
  assert.equal(www.headers.get('access-control-allow-origin'), 'https://www.pointcast.xyz');

  const local = await handlePrayer(request('POST', { origin: 'http://127.0.0.1:4322', ip: '127.0.0.1', body: { id: 'idem-cors-2' } }), env);
  assert.equal(local.status, 200);
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://127.0.0.1:4322');

  const preview = await handlePrayer(request('POST', { origin: 'https://preview.pages.dev', body: { id: 'idem-cors-3' } }), env);
  assert.equal(preview.status, 403);

  const curl = await handlePrayer(request('POST', { ip: '192.0.2.20', body: { id: 'idem-cors-4' } }), env);
  assert.equal(curl.status, 200);
  assert.equal(curl.headers.get('access-control-allow-origin'), null);

  const get = await handlePrayer(request('GET', { origin: 'https://evil.example' }), env);
  assert.equal(get.status, 200);
  assert.equal(get.headers.get('access-control-allow-origin'), '*');
  assert.equal((await bodyOf(get)).approximate, false);

  const options = await handlePrayer(request('OPTIONS', { origin: 'https://evil.example' }), env);
  assert.equal(options.status, 403);
  assert.equal(options.headers.get('access-control-allow-origin'), null);

  assert.equal(allowedOrigin('http://localhost:4321'), true);
  assert.equal(allowedOrigin('https://evil.example'), false);
});

test('an unbound store is 503 and a broken D1 does not also write KV', async () => {
  const empty = await handlePrayer(request('GET'), {});
  assert.equal(empty.status, 503);
  assert.equal((await bodyOf(empty)).reason, 'unbound');

  const kv = memoryKv();
  const broken = {
    prepare() { return { bind() { return this; } }; },
    batch() { throw new Error('D1_ERROR: internal'); },
  };
  const response = await handlePrayer(request('POST', { origin: ORIGIN, ip: '192.0.2.30', body: { id: 'idem-d1-down' } }), { AUTH_DB: broken, VISITS: kv });
  assert.equal(response.status, 503);
  assert.equal((await bodyOf(response)).storage, 'd1');
  assert.equal(kv.writes.length, 0);

  const missing = {
    prepare() { return { bind() { return this; }, async first() { throw new Error('no such table: grok_prayer_total'); } }; },
    batch() { throw new Error('no such table: grok_prayer_offers'); },
  };
  const fallback = await handlePrayer(request('POST', { origin: ORIGIN, ip: '192.0.2.31', body: { id: 'idem-kv-111' } }), { AUTH_DB: missing, VISITS: kv });
  const payload = await bodyOf(fallback);
  assert.equal(fallback.status, 200);
  assert.equal(payload.storage, 'kv');
  assert.equal(payload.approximate, true);
  assert.equal(payload.total, 1);

  const replay = await handlePrayer(request('POST', { origin: ORIGIN, ip: '192.0.2.99', body: { id: 'idem-kv-111' } }), { AUTH_DB: missing, VISITS: kv });
  const replayed = await bodyOf(replay);
  assert.equal(replayed.duplicate, true);
  assert.equal(replayed.total, 1);

  const limited = await handlePrayer(request('POST', { origin: ORIGIN, ip: '192.0.2.31', body: { id: 'idem-kv-222' } }), { AUTH_DB: missing, VISITS: kv });
  assert.equal(limited.status, 429);

  const thrown = memoryKv({ failPut: true });
  const down = await handlePrayer(request('POST', { origin: ORIGIN, ip: '192.0.2.40', body: { id: 'idem-kv-333' } }), { VISITS: thrown });
  assert.equal(down.status, 503);
  assert.equal(thrown.writes.length, 0);
  assert.equal(kv.store.get(TOTAL_KEY), '1');
});

test('the bell is short and starts only from the button', () => {
  const { FakeAudio, made } = audioClass();
  const ctx = new FakeAudio();
  ctx.state = 'running';
  const bell = playCourtBell(ctx);
  assert.equal(bell.duration, 1.7);
  assert.equal(ctx.stops.includes(4 + 1.7), true);
  assert.equal(made.length, 1);
});

test('a prayer posts its own id, rings, and keeps the button usable', async () => {
  const storage = memoryStorage();
  const { FakeAudio, made } = audioClass();
  let posts = 0;
  let total = 4;
  const fetchImpl = async (_url, opts) => {
    if (opts?.method === 'POST') {
      posts += 1;
      const payload = JSON.parse(opts.body);
      assert.match(payload.id, /^[a-zA-Z0-9-]{8,80}$/);
      assert.equal(payload.sessionId, undefined);
      total += 1;
      return jsonResponse({ ok: true, total, storage: 'd1', approximate: false });
    }
    return jsonResponse({ ok: true, total: 4, storage: 'd1', approximate: false });
  };
  const { doc, button, live } = courtDom();
  assert.equal(live.textContent, '');
  wireCourtPrayer(doc, {
    fetchImpl,
    storage,
    AudioContext: FakeAudio,
    reducedMotion: false,
    now: () => 1_000_000,
    audioWaitMs: 20,
    fetchWaitMs: 200,
  });
  assert.equal(live.textContent, '');
  await waitFor(() => live.textContent === '4 prayers offered.');
  assert.equal(digits(doc), '4');
  assert.equal(made.length, 0);

  button.focus();
  button.click();
  await waitFor(() => button.getAttribute('aria-disabled') == null && live.textContent === '5 prayers offered. A small bell.');
  assert.equal(posts, 1);
  assert.equal(digits(doc), '5');
  assert.equal(button.disabled, false);
  assert.equal(button.hasAttribute('disabled'), false);
  assert.equal(button.getAttribute('aria-disabled'), null);
  assert.equal(doc.activeElement, button);
  assert.equal(doc.getElementById('court-prayer').classList.contains('is-rising'), true);
  assert.equal(made.length, 1);
  assert.equal(made[0].starts.length, 3);
  assert.match(live.textContent, /^5 prayers offered\. A small bell\.$/);
  assert.equal(doc.querySelector('[role="status"]'), null);
  assert.equal(doc.getElementById('pray-digits').closest('[aria-hidden="true"]') != null, true);
});

test('reduced motion still rings, and a mute control stays off', async () => {
  const storage = memoryStorage();
  const { FakeAudio, made } = audioClass();
  let clock = 5_000;
  let total = 1;
  const fetchImpl = async (_url, opts) => {
    if (opts?.method !== 'POST') return jsonResponse({ ok: true, total: 1, storage: 'd1', approximate: false });
    total += 1;
    return jsonResponse({ ok: true, total, storage: 'd1', approximate: false });
  };
  const { doc, button, sound } = courtDom();
  const root = doc.getElementById('court-prayer');
  wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: FakeAudio, reducedMotion: true, audioWaitMs: 20, now: () => clock });
  await waitFor(() => digits(doc) === '1');
  button.click();
  await waitFor(() => doc.getElementById('pray-live').textContent === '2 prayers offered. A small bell.');
  assert.equal(root.classList.contains('is-rising'), false);
  assert.equal(root.classList.contains('is-lit'), true);
  assert.equal(made.length, 1);
  assert.equal(made[0].starts.length, 3);

  clock += COOL_MS;
  sound.click();
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
  assert.equal(sound.textContent, 'Sound off');
  assert.equal(storage.getItem(SOUND_KEY), 'off');
  button.click();
  await waitFor(() => doc.getElementById('pray-live').textContent === '3 prayers offered.');
  assert.equal(digits(doc), '3');
  assert.equal(made.length, 1);
});

test('a stalled tone or a stalled request releases the button', async () => {
  const storage = memoryStorage();
  const { FakeAudio, made } = audioClass({ hang: true });
  const fetchImpl = async (_url, opts) => {
    if (opts?.method === 'POST') return jsonResponse({ ok: true, total: 3, storage: 'd1', approximate: false });
    return jsonResponse({ ok: true, total: 2, storage: 'd1', approximate: false });
  };
  const { doc, button, live } = courtDom();
  wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: FakeAudio, audioWaitMs: 30, fetchWaitMs: 80, now: () => 9_000, reducedMotion: true });
  await waitFor(() => digits(doc) === '2');
  button.focus();
  button.click();
  await waitFor(() => button.getAttribute('aria-disabled') == null && digits(doc) === '3', 500);
  assert.equal(button.disabled, false);
  assert.equal(doc.activeElement, button);
  assert.equal(made[0].starts.length, 0);
  assert.match(live.textContent, /The tone did not start/);

  let hung = 0;
  const storage2 = memoryStorage();
  const { doc: doc2, button: button2 } = courtDom();
  const fetchHang = async (_url, opts) => {
    if (opts?.method === 'POST') {
      hung += 1;
      return new Promise(() => {});
    }
    return jsonResponse({ ok: true, total: 2, storage: 'd1', approximate: false });
  };
  wireCourtPrayer(doc2, { fetchImpl: fetchHang, storage: storage2, AudioContext: null, fetchWaitMs: 40, audioWaitMs: 10, now: () => 9_000, reducedMotion: true });
  await waitFor(() => digits(doc2) === '2');
  button2.click();
  await waitFor(() => button2.getAttribute('aria-disabled') == null && savedBook(storage2).pending.length === 1, 500);
  assert.equal(hung, 1);
  assert.equal(button2.disabled, false);
  assert.match(doc2.getElementById('pray-note').textContent, /browser/);
  assert.equal(digits(doc2), '3');
});

test('the button waits out the same window the server uses', async () => {
  assert.equal(COOL_MS, RATE_WINDOW_MS);
  const storage = memoryStorage();
  const { FakeAudio, made } = audioClass();
  let clock = 20_000;
  let posts = 0;
  let total = 4;
  const fetchImpl = async (_url, opts) => {
    if (opts?.method !== 'POST') return jsonResponse({ ok: true, total: 4, storage: 'd1', approximate: false });
    posts += 1;
    if (posts === 1) return jsonResponse({ ok: false, reason: 'rate-limited', retryAfterSec: 9, total: 4, storage: 'd1', approximate: false }, 429);
    total += 1;
    return jsonResponse({ ok: true, total, storage: 'd1', approximate: false });
  };
  const { doc, button, live } = courtDom();
  wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: FakeAudio, now: () => clock, audioWaitMs: 10, fetchWaitMs: 100, reducedMotion: true });
  await waitFor(() => digits(doc) === '4');
  button.click();
  await waitFor(() => live.textContent === 'Wait a moment.');
  assert.equal(posts, 1);
  assert.equal(digits(doc), '4');
  assert.equal(made.length, 0);
  assert.equal(savedBook(storage).pending.length, 0);

  clock += 8_999;
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(posts, 1);

  clock += 1;
  button.click();
  await waitFor(() => live.textContent === '5 prayers offered. A small bell.');
  assert.equal(posts, 2);
  assert.equal(digits(doc), '5');
  assert.equal(made.length, 1);
});

test('a second tap inside five seconds does not post again', async () => {
  const storage = memoryStorage();
  let clock = 40_000;
  let posts = 0;
  const fetchImpl = async (_url, opts) => {
    if (opts?.method !== 'POST') return jsonResponse({ ok: true, total: 1, storage: 'd1', approximate: false });
    posts += 1;
    return jsonResponse({ ok: true, total: posts + 1, storage: 'd1', approximate: false });
  };
  const { doc, button } = courtDom();
  wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: null, now: () => clock, fetchWaitMs: 100, reducedMotion: true });
  await waitFor(() => digits(doc) === '1');
  button.click();
  await waitFor(() => posts === 1);
  clock += 1_000;
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(posts, 1);
  clock += COOL_MS;
  button.click();
  await waitFor(() => posts === 2);
});

test('a double click sends one prayer', async () => {
  const storage = memoryStorage();
  let posts = 0;
  let release;
  const fetchImpl = async (_url, opts) => {
    if (opts?.method !== 'POST') return jsonResponse({ ok: true, total: 7, storage: 'd1', approximate: false });
    posts += 1;
    return new Promise((resolve) => {
      release = () => resolve(jsonResponse({ ok: true, total: 8, storage: 'd1', approximate: false }));
    });
  };
  const { doc, button } = courtDom();
  wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: null, now: () => 70_000, fetchWaitMs: 400, reducedMotion: true });
  await waitFor(() => digits(doc) === '7');
  button.click();
  button.click();
  assert.equal(posts, 1);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.equal(button.disabled, false);
  release();
  await waitFor(() => button.getAttribute('aria-disabled') == null && savedBook(storage).pending.length === 0);
  assert.equal(digits(doc), '8');
  assert.equal(posts, 1);
});

test('a lost response is not added on top of the server tally', async () => {
  const storage = memoryStorage();
  let mode = 'fail';
  const posts = [];
  const fetchImpl = async (_url, opts) => {
    if (opts?.method === 'POST') {
      const id = JSON.parse(opts.body).id;
      posts.push(id);
      if (mode === 'fail') throw new Error('network');
      return jsonResponse({ ok: true, duplicate: true, total: 6, storage: 'd1', approximate: false });
    }
    return jsonResponse({ ok: true, total: mode === 'fail' ? 5 : 6, storage: 'd1', approximate: false });
  };
  const { doc, button } = courtDom();
  const api = wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: null, now: () => 80_000, fetchWaitMs: 100, reducedMotion: true });
  await waitFor(() => digits(doc) === '5');
  button.click();
  await waitFor(() => savedBook(storage).pending.length === 1);
  assert.equal(digits(doc), '6');
  const id = savedBook(storage).pending[0];
  mode = 'replay';
  await api.sync();
  assert.equal(savedBook(storage).pending.length, 0);
  assert.equal(digits(doc), '6');
  assert.equal(posts.filter((item) => item === id).length, 2);
});

test('a waiting prayer survives a lower server tally until the replay lands', async () => {
  const storage = memoryStorage({ [BOOK_KEY]: JSON.stringify({ server: null, pending: ['idem-keep-1'] }) });
  let release;
  const fetchImpl = async (_url, opts) => {
    if (opts?.method === 'POST') {
      assert.equal(JSON.parse(opts.body).id, 'idem-keep-1');
      return new Promise((resolve) => {
        release = () => resolve(jsonResponse({ ok: true, total: 1, storage: 'd1', approximate: false }));
      });
    }
    return jsonResponse({ ok: true, total: 0, storage: 'd1', approximate: false });
  };
  const { doc } = courtDom();
  wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: null, now: () => 90_000, fetchWaitMs: 400, reducedMotion: true });
  await waitFor(() => typeof release === 'function');
  assert.equal(digits(doc), '1');
  assert.deepEqual(savedBook(storage).pending, ['idem-keep-1']);
  release();
  await waitFor(() => savedBook(storage).pending.length === 0);
  assert.equal(digits(doc), '1');
  assert.equal(savedBook(storage).server, 1);
});

test('blocked storage does not throw or stop the button', async () => {
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  const safe = safeStorage(storage);
  safe.setItem('k', 'v');
  assert.equal(safe.getItem('k'), 'v');

  const fetchImpl = async (_url, opts) => (
    opts?.method === 'POST'
      ? jsonResponse({ ok: true, total: 1, storage: 'd1', approximate: false })
      : jsonResponse({ ok: true, total: 0, storage: 'd1', approximate: false })
  );
  const { doc, button } = courtDom();
  assert.doesNotThrow(() => wireCourtPrayer(doc, { fetchImpl, storage, AudioContext: null, now: () => 100_000, fetchWaitMs: 100, reducedMotion: true }));
  await waitFor(() => doc.getElementById('pray-note').textContent.includes('does not reset'));
  button.click();
  await waitFor(() => digits(doc) === '1');
  assert.equal(button.disabled, false);
});

test('the page, the machine twin, and the archive files agree', () => {
  const html = read('src/pages/grok.astro');
  const prayer = html.slice(html.indexOf('id="court-prayer"'), html.indexOf('id="live"'));
  assert.match(prayer, /id="pray-button"/);
  assert.match(prayer, /id="pray-sound"/);
  assert.match(prayer, /id="pray-live"/);
  assert.match(prayer, /aria-hidden="true"/);
  assert.doesNotMatch(prayer, /role="status"/);
  assert.doesNotMatch(prayer, /\/api\/grok\/prayer/);
  assert.doesNotMatch(prayer, /drum/);
  assert.doesNotMatch(prayer, /stays at zero/);
  assert.match(prayer, /You can still read the court/);

  const css = read('src/styles/grok-court.css');
  assert.match(css, /\.pray__button:focus-visible/);
  assert.doesNotMatch(css, /\.shot img \{ aspect-ratio: 3 \/ 4; \}/);
  assert.doesNotMatch(css, /\.film img \{ aspect-ratio: 16 \/ 9; \}/);
  for (const [fg, bg] of [['#f4ead8', '#0c6e78'], ['#102418', '#e7ffc4'], ['#0e5a38', '#f4ead8'], ['#14284b', '#f4ead8']]) {
    assert.equal(css.includes(fg) && css.includes(bg), true);
    assert.equal(contrast(fg, bg) >= 4.5, true);
  }

  const json = read('src/pages/grok.json.ts');
  assert.match(json, /migration 0033/);
  assert.doesNotMatch(json, /sessionId/);
  const images = [
    ['/features/good-form-strange-fortunes/assets/court.webp', 'empty tennis pavilion'],
    ['/images/small-shrines/garden.webp', 'delicate tree'],
    ['/images/small-shrines/memory.webp', 'botanical line drawings'],
    ['/features/good-form-strange-fortunes/assets/bloom.webp', 'chrome flower'],
    ['/garden-signal/open-heart/door-01.jpg', 'chrome door opens'],
    ['/garden-signal/open-heart/door-02.jpg', 'mirrored door'],
    ['/garden-signal/open-heart/door-03.jpg', 'chrome doorway'],
    ['/garden-signal/open-heart/door-04.jpg', 'silver garden door'],
  ];
  for (const [src, alt] of images) {
    assert.equal(html.includes(src), true);
    assert.equal(json.includes(src), true);
    assert.equal(json.includes(alt), true);
    assert.equal(existsSync(new URL(`../public${src}`, import.meta.url)), true);
  }

  const route = read('functions/api/grok/prayer.ts');
  assert.match(route, /handlePrayer/);
  assert.doesNotMatch(route, /Access-Control-Allow-Origin/);
  assert.equal(existsSync(new URL('../migrations/auth/0033_grok_prayer.sql', import.meta.url)), true);
});
