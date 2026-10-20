// chain-kit.js: the small shared toolbox of the four devnet apps that read and
// write the PointCast devnet from a browser: the Observatory, the Daily Mint,
// the Notary and Time Capsules (/chain/observatory, /chain/daily-mint,
// /chain/notary, /chain/capsules).
//
// An ES module with no DOM access, importable by node, so the pages and the
// tests run the same code. Rules every app holds, and tests/chain-app-*.test.mjs
// check from the source:
//   - everything the devnet sends is hostile text: it is cut down with
//     cleanText() and written with textContent. Never markup, an href, a src
//     or a style value.
//   - the devnet is pinned by its genesis hash. A page that signs or reads
//     numbers first checks /status against the genesis it was built with, and
//     says GENESIS CHANGED instead of carrying on when a reset happened.
//   - ?devnet=http://127.0.0.1:PORT is honoured only for the hosts localhost
//     and 127.0.0.1, for end-to-end runs against a throwaway local devnet.
//   - a key made in the browser lives in memory unless the person asks to
//     keep it on this device. It signs on a devnet only: no value, may reset.
//
// The SDK is the v0.2 copy at /chain/first-mints/lib/ (the file at /chain/sdk/
// is the older v0.1 one without the block, capsule and tx-form helpers).

import * as pcc from '../first-mints/lib/pointcast-chain.js';

export { pcc };

export const LIMITS = Object.freeze({
  timeoutMs: 10000,
  maxChars: 4000000,
  waitMs: 45000,
});

export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isHex = (s, bytes) => typeof s === 'string' && s.length === bytes * 2 && !/[^0-9a-f]/.test(s);
export const isHex64 = (s) => isHex(s, 32);
export const isWhole = (v) => Number.isSafeInteger(v) && v >= 0;

const INVISIBLE = [[0, 31], [127, 159], [173, 173], [0x61c, 0x61c], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]];
const isInvisible = (cp) => INVISIBLE.some(([a, b]) => cp >= a && cp <= b);

/** Hostile text, one safe line of at most `max` characters. Non-strings give ''. */
export function cleanText(v, max = 120) {
  if (typeof v !== 'string') return '';
  const flat = Array.from(v.slice(0, 4000)).map((ch) => (isInvisible(ch.codePointAt(0)) ? ' ' : ch)).join('').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length <= max ? flat : chars.slice(0, Math.max(1, max - 1)).join('').trimEnd() + '…';
}

/** Hostile multi-line text: control and bidi characters removed, newlines kept, cut at `max` characters. */
export function cleanBlock(v, max = 2000) {
  if (typeof v !== 'string') return '';
  const kept = Array.from(v.slice(0, max * 2)).map((ch) => {
    if (ch === '\n') return ch;
    return isInvisible(ch.codePointAt(0)) ? ' ' : ch;
  }).join('').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const chars = Array.from(kept);
  return chars.length <= max ? kept : chars.slice(0, max - 1).join('').trimEnd() + '…';
}

// ---------------------------------------------------------------- the ?devnet= override

/**
 * `?devnet=http://127.0.0.1:8799` for local end-to-end runs. Honoured only for
 * http(s) at the host `localhost` or `127.0.0.1`, no credentials; the result
 * is the bare origin. `&genesis=<64 hex>` may pin that node's genesis.
 * Anything else (another host, another scheme, a lookalike) is null, and
 * `ignoredOverride()` says so for the page to print.
 */
export function devnetOverride(search) {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch { return null; }
  const raw = q.get('devnet');
  if (!raw) return null;
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return null;
  if (u.username || u.password) return null;
  const g = String(q.get('genesis') || '').toLowerCase();
  return { api: u.origin, genesis: isHex64(g) ? g : null };
}

/** True when `?devnet=` was given but is not honoured (so the page can say it ignored it). */
export function ignoredOverride(search) {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch { return false; }
  return Boolean(q.get('devnet')) && !devnetOverride(search);
}

/** Where a page reads: the override when honoured, else the devnet and genesis it was built with. */
export function resolveApi(search, built) {
  const o = devnetOverride(search);
  if (o) return { api: o.api, genesis: o.genesis, override: true, ignored: false };
  return { api: String(built.api || ''), genesis: String(built.genesis || ''), override: false, ignored: ignoredOverride(search) };
}

// ---------------------------------------------------------------- formatting

const pad = (n, w = 2) => String(n).padStart(w, '0');

/** A time as "2026-10-20 06:25:00 UTC". Non-numbers give ''. */
export function utc(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + ' UTC';
}

/** Just the time of day, "06:25:00Z". */
export function utcClock(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const d = new Date(ms);
  return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
}

/** A span in words: "3 s", "4 min 10 s", "2 h 05 min", "1 d 3 h". Negative or non-numbers give ''. */
export function duration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const s = Math.round(ms / 1000);
  if (s < 60) return s + ' s';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min' + (s % 60 ? ' ' + pad(s % 60) + ' s' : '');
  const h = Math.floor(m / 60);
  if (h < 48) return h + ' h' + (m % 60 ? ' ' + pad(m % 60) + ' min' : '');
  const d = Math.floor(h / 24);
  return d + ' d' + (h % 24 ? ' ' + (h % 24) + ' h' : '');
}

/** A hash or key cut to its ends: "a720735b…6f4280". Short strings are returned as they are. */
export function shortHex(h, head = 8, tail = 6) {
  const s = String(h || '');
  return s.length <= head + tail + 1 ? s : s.slice(0, head) + '…' + s.slice(-tail);
}

/** An address cut to its ends: "tz1WspKr…gJ3uME". */
export function shortAddr(a) {
  return shortHex(String(a || ''), 8, 6);
}

export const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');

/** Thousands separators without locale surprises. */
export function groups(n) {
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ---------------------------------------------------------------- reading the devnet

export class KitError extends Error {
  constructor(message, { status = 0, body = null, code = '' } = {}) {
    super(message);
    this.name = 'KitError';
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

/**
 * A fetch that keeps its timer until the BODY has been read, not just until the
 * headers arrive: a server that sends headers and then stalls would otherwise
 * hold a page (and the SDK client, which has no timer of its own) forever. The
 * request is aborted when the timer fires, and the wait is raced against it as
 * well, for a fetch that ignores its signal. Returns a fetch-shaped function
 * whose response carries ok, status, headers and text().
 */
export function timedFetch(f, ms = LIMITS.timeoutMs) {
  const base = f || ((...a) => globalThis.fetch(...a));
  return async (url, init = {}) => {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    let timer = null;
    const clock = new Promise((_, reject) => {
      timer = setTimeout(() => {
        if (ctrl) ctrl.abort();
        reject(Object.assign(new Error('timed out'), { name: 'AbortError', timedOut: true }));
      }, ms);
    });
    clock.catch(() => {});
    const stop = () => clearTimeout(timer);
    let res;
    try {
      res = await Promise.race([base(url, { ...init, signal: ctrl ? ctrl.signal : init.signal }), clock]);
    } catch (e) {
      stop();
      throw e;
    }
    if (!res || typeof res.text !== 'function') { stop(); return res; }
    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      async text() {
        try { return await Promise.race([res.text(), clock]); } finally { stop(); }
      },
    };
  };
}

/**
 * A reader of one devnet: every read is a GET with a timeout (kept through the
 * body), a size cap, no credentials and no referrer. A 404 is a normal answer
 * (null) for get(); every other failure throws a KitError carrying the devnet's
 * own words. `count` is how many requests this reader has made, so a page can
 * say so.
 */
export function makeNet(api, env = {}) {
  const f = env.fetch || ((...a) => globalThis.fetch(...a));
  const net = {
    api,
    count: 0,
    async request(path, init = {}, { allow404 = false } = {}) {
      net.count += 1;
      let res;
      let text;
      try {
        res = await timedFetch(f, env.timeoutMs || LIMITS.timeoutMs)(api + path, { ...init, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
        if (res) text = await res.text();
      } catch (e) {
        throw new KitError('the devnet did not answer (' + (e && (e.name === 'AbortError' || e.timedOut) ? 'timed out' : 'unreachable') + ')', { code: 'unreachable' });
      }
      if (!res) throw new KitError('the devnet did not answer', { code: 'unreachable' });
      if (text.length > LIMITS.maxChars) throw new KitError('the reply to ' + path + ' is too large to read here', { status: res.status, code: 'too_large' });
      let json = null;
      try { json = JSON.parse(text); } catch { json = null; }
      if (res.status === 404 && allow404) return { status: 404, json, text };
      if (!res.ok) {
        const words = json && typeof json.error === 'string' ? cleanText(json.error, 240) : 'the devnet answered ' + res.status;
        const e = new KitError(words, { status: res.status, body: json, code: json && typeof json.code === 'string' ? cleanText(json.code, 40) : '' });
        const retry = res.headers && typeof res.headers.get === 'function' ? res.headers.get('retry-after') : null;
        if (retry) e.retryAfter = Number(retry) || 0;
        throw e;
      }
      return { status: res.status, json, text };
    },
    /** GET path -> parsed JSON, or null on 404. */
    async get(path) {
      const r = await net.request(path, {}, { allow404: true });
      return r.status === 404 ? null : r.json;
    },
    /** GET path -> raw text, or null on 404. */
    async getText(path) {
      const r = await net.request(path, {}, { allow404: true });
      return r.status === 404 ? null : r.text;
    },
    /** POST JSON -> parsed JSON. */
    async post(path, body) {
      const r = await net.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      return r.json;
    },
  };
  return net;
}

/** GET /status, checked for the shape the apps read. Returns a plain object. */
export function readStatus(json) {
  if (!isObj(json) || typeof json.chain_id !== 'string' || !isHex64(json.genesis_hash) || !isWhole(json.height)) {
    throw new KitError('the devnet’s /status is not the shape this page reads', { code: 'shape' });
  }
  return {
    chainId: cleanText(json.chain_id, 64),
    genesis: json.genesis_hash,
    height: json.height,
    tipHash: isHex64(json.tip_hash) ? json.tip_hash : '',
    tipTimestamp: isWhole(json.tip_timestamp) ? json.tip_timestamp : 0,
    stateRoot: isHex64(json.state_root) ? json.state_root : '',
    mempool: isWhole(json.mempool) ? json.mempool : 0,
    accounts: isWhole(json.accounts) ? json.accounts : null,
    agents: isWhole(json.agents) ? json.agents : null,
    bots: isWhole(json.bots) ? json.bots : null,
    drops: isWhole(json.drops) ? json.drops : null,
    supply: Number.isFinite(json.total_supply) ? json.total_supply : Number.isFinite(json.supply) ? json.supply : null,
    maxSupply: Number.isFinite(json.max_supply) ? json.max_supply : null,
    label: cleanText(json.label, 80),
    mayReset: json.may_reset === true,
    anchors: cleanText(typeof json.anchors === 'string' ? json.anchors : '', 160),
    house: typeof json.house === 'string' ? cleanText(json.house, 80) : '',
  };
}

/** Thrown by pinned() when the devnet answers with a genesis the page was not built for. */
export class GenesisChanged extends Error {
  constructor(want, got) {
    super('GENESIS CHANGED: the devnet reports ' + got + ', this page pins ' + want);
    this.name = 'GenesisChanged';
    this.want = want;
    this.got = got;
  }
}

/** Read /status and check it against the pinned genesis (when there is one). */
export async function pinnedStatus(net, pinned) {
  const st = readStatus(await net.get('/status'));
  if (pinned && st.genesis !== pinned) throw new GenesisChanged(pinned, st.genesis);
  return st;
}

/**
 * Connect the SDK client to the devnet with the genesis pinned: it reads
 * /status and /params and refuses unless the params hash to the genesis the
 * page trusts (the node's own, labelled as such, under a local ?devnet=).
 */
export async function connectPinned(api, { pinned = null, env = {} } = {}) {
  // The SDK client has no timer of its own: every request it makes (and the
  // polling that waits for a block) goes through the bounded fetch.
  const f = timedFetch(env.fetch, env.timeoutMs || LIMITS.timeoutMs);
  const st = readStatus(await (async () => {
    const r = await f(api + '/status', { credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new KitError('the devnet answered ' + r.status + ' for /status', { status: r.status });
    return JSON.parse(await r.text());
  })());
  if (pinned && st.genesis !== pinned) throw new GenesisChanged(pinned, st.genesis);
  const chain = await pcc.connect(api, { expect: pinned ? { genesisHash: pinned } : {}, fetch: f });
  return chain;
}

// ---------------------------------------------------------------- keys made in the browser

const PKCS8_ED25519 = '302e020100300506032b657004220420';

/** Does this runtime have WebCrypto ed25519? Resolves true or false, never throws. */
export async function ed25519Works() {
  try {
    const s = globalThis.crypto && globalThis.crypto.subtle;
    if (!s) return false;
    const k = await s.importKey('pkcs8', new Uint8Array([...pcc.hexToBytes(PKCS8_ED25519), ...new Uint8Array(32).fill(1)]), { name: 'Ed25519' }, true, ['sign']);
    return Boolean(k);
  } catch {
    return false;
  }
}

/** 32 fresh random bytes as 64 hex characters. */
export function newSeedHex() {
  return pcc.bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * A raw ed25519 key from a 32-byte seed (64 hex). Returns { seedHex, publicKey,
 * sender, sign(digestHex) -> signature hex }. Any ed25519 key is a tz1 account
 * on the devnet.
 */
export async function keyFromSeed(seedHex) {
  const seed = String(seedHex || '').trim().toLowerCase();
  if (!isHex64(seed)) throw new KitError('a key is 64 hex characters (32 bytes)', { code: 'bad_key' });
  const key = await globalThis.crypto.subtle.importKey('pkcs8', new Uint8Array([...pcc.hexToBytes(PKCS8_ED25519), ...pcc.hexToBytes(seed)]), { name: 'Ed25519' }, true, ['sign']);
  const jwk = await globalThis.crypto.subtle.exportKey('jwk', key);
  const raw = Uint8Array.from(atob(String(jwk.x).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const publicKey = { scheme: 'ed25519', bytes: pcc.bytesToHex(raw) };
  const sender = pcc.tezosAddress(publicKey);
  return {
    seedHex: seed,
    publicKey,
    sender,
    async sign(digestHex) {
      const sig = await globalThis.crypto.subtle.sign({ name: 'Ed25519' }, key, pcc.hexToBytes(digestHex));
      return pcc.bytesToHex(new Uint8Array(sig));
    },
  };
}

/** The key kept on this device, if the person chose to keep one. `storage` is localStorage (or a test double). */
export function loadStoredSeed(storage, slot) {
  try {
    const v = storage && storage.getItem(slot);
    return isHex64(v) ? v : null;
  } catch {
    return null;
  }
}
export function storeSeed(storage, slot, seedHex) {
  try { storage.setItem(slot, seedHex); return true; } catch { return false; }
}
export function forgetSeed(storage, slot) {
  try { storage.removeItem(slot); return true; } catch { return false; }
}

// ---------------------------------------------------------------- signing and sending

/**
 * Sign `tx` (an unsigned tx object from buildTx or chain.buildPublish) with the
 * key over the digest the SDK computes locally, send it, and wait for the block.
 * Returns { txHash, height, index, receipt }. `onStage('signed'|'sent'|'waiting')`
 * lets a page narrate. Throws the SDK's ChainError (the devnet's own words).
 */
export async function signAndSend(chain, key, tx, { wait = true, onStage = () => {}, timeoutMs = LIMITS.waitMs } = {}) {
  const digest = pcc.signingHash(tx, chain.domain);
  const signature = await key.sign(digest);
  onStage('signed');
  const signed = { tx, public_key: key.publicKey, signature };
  const { txHash } = await chain.submit(signed);
  onStage('sent');
  if (!wait) return { txHash, height: null, index: null, receipt: null };
  onStage('waiting');
  const done = await chain.waitForTx(txHash, { timeoutMs, intervalMs: 800 });
  return { txHash, height: done.height, index: done.index, receipt: done.receipt || null };
}

/** The devnet's words for a failure, cut to one safe line. */
export function describeError(e) {
  if (e && e.name === 'GenesisChanged') return 'GENESIS CHANGED. The devnet reports genesis ' + e.got + ', this page pins ' + e.want + '. The devnet was probably reset; a reset is dated and recorded. Nothing was sent.';
  const msg = e && e.message ? String(e.message) : 'something went wrong';
  if (e && e.status === 429) {
    // A retry hint only where one is true: the devnet said how long (Retry-After) or its own words name a per-minute
    // window. A per-day cap (the faucet's 3 claims per IP per UTC day) is not cured by trying again in a minute.
    const words = cleanText(msg, 240);
    if (e.retryAfter) return words + ' Try again in ' + e.retryAfter + ' s.';
    if (/\b(?:per|each|every|a) minute\b|\bper[- ]minute\b/i.test(words)) return words + ' Try again in a minute.';
    return words;
  }
  return cleanText(msg, 280);
}

// ---------------------------------------------------------------- hashing

/** SHA-256 of bytes as hex, with WebCrypto when it is there and the SDK's own implementation when not. */
export async function sha256Hex(bytes) {
  const s = globalThis.crypto && globalThis.crypto.subtle;
  if (s && typeof s.digest === 'function') {
    try { return pcc.bytesToHex(new Uint8Array(await s.digest('SHA-256', bytes))); } catch { /* fall through */ }
  }
  return pcc.bytesToHex(pcc.sha256(bytes));
}

// ---------------------------------------------------------------- the block rate

/**
 * The seal rate the devnet is actually keeping, in blocks per hour, from block
 * timestamps (oldest first, any gaps). Needs two blocks at least a second apart;
 * otherwise `fallback`. An idle devnet seals one heartbeat block every five
 * minutes (12 an hour); a busy one seals every 3 seconds.
 */
export function blocksPerHour(timestamps, fallback = 12) {
  const ts = (timestamps || []).filter((t) => Number.isFinite(t) && t > 0);
  if (ts.length < 2) return fallback;
  const span = ts[ts.length - 1] - ts[0];
  if (span < 1000) return fallback;
  return ((ts.length - 1) * 3600000) / span;
}

/** How long until the chain reaches `height`, in ms, at `perHour` blocks an hour (never negative). */
export function msUntilHeight(height, tip, perHour) {
  const rate = perHour > 0 ? perHour : 12;
  return Math.max(0, Math.round(((height - tip) * 3600000) / rate));
}

/** The lazy start every app page uses: after load and idle, near the viewport, in a visible tab. */
export function whenReady(root, start, env = {}) {
  const win = env.window || (typeof window !== 'undefined' ? window : null);
  if (!win) return;
  const doc = win.document;
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    start();
  };
  const idle = (fn) => (typeof win.requestIdleCallback === 'function' ? win.requestIdleCallback(fn, { timeout: 4000 }) : win.setTimeout(fn, 1200));
  const nearby = () => {
    if (typeof win.IntersectionObserver !== 'function') return fire();
    const io = new win.IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fire(); }
    }, { rootMargin: '400px' });
    io.observe(root);
    // The Browser pane never fires an observer for an element that starts off-screen: do not wait forever.
    win.setTimeout(() => { io.disconnect(); fire(); }, 2500);
  };
  const visible = () => {
    if (doc.visibilityState === 'hidden') {
      doc.addEventListener('visibilitychange', function once() {
        if (doc.visibilityState !== 'hidden') { doc.removeEventListener('visibilitychange', once); nearby(); }
      });
    } else nearby();
  };
  const go = () => idle(visible);
  if (doc.readyState === 'complete') go(); else win.addEventListener('load', go, { once: true });
}
