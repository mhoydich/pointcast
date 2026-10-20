// witness.js: the logic behind "Witness in your browser" (/chain/witness): replay
// the PointCast devnet from genesis with the Block Yard's pinned verifier, refuse
// to sign on any fault, pick a checkpoint exactly as pc-witness.mjs does, sign it
// and post it, then read the roll back.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-witness.test.mjs, scripts/e2e-chain-app-witness.mjs). It
// builds on public/chain/net/witness.js (the digest domain pointcast-devnet/
// witness/v1, buildWitnessBody, signWitness, dayCheckpoint) and never repeats it.
//
// What an attestation means, and nothing more: a public claim, tied to a free
// key, "I replayed this chain from genesis with the pinned verifier and got this
// block hash and state root at height h". It is NOT proof of replay: someone who
// copies /status signs the same bytes. "Correct" means it agreed with this
// server. Counts are keys, not people. Devnet: no value, may reset.
//
// The replay, two ways with one result. In a browser the pinned Block Yard worker
// (verify-worker.js) runs behind a small shim (witness-shim.js) that only reports
// the block headers the worker downloads; workerReplay() collects the worker's
// verified hashes and those headers. In node, replayNode() drives the pinned
// verify.js and wasm directly, the way pc-witness.mjs and bots/verify.mjs do.
// Both feed makeCollector(), which re-hashes every header and demands it equal the
// hash the verifier computed: a timestamp is used only if it is bound to a block
// the verifier accepted.

import { KitError, cleanText, describeError, isHex64, isObj, isWhole, pcc, sha256Hex, signAndSend } from './chain-kit.js';
import * as W from '../net/witness.js';

export { W };

/** What this page calls itself in the `tool` field of the attestation (at most 64 characters). */
export const TOOL = 'chain-witness-page/1';
export const CHANNEL_WIT = 'WIT';
export const CHANNEL_NET = 'NET';
export const CLAIM_FORMAT = 'pointcast-witness-claim/v1';
export const JOURNAL_SLOT = 'pointcast-chain-apps/witness-journal/v1';

export const LIMITS = Object.freeze({
  noteChars: 140,
  /** A replay older than this is run again before anything is sent. */
  staleMs: 30 * 60 * 1000,
  /** No new block for this long while the replay is not at the tip: give up and say why. */
  stallMs: 45000,
  fetchMs: 60000,
  rollPages: 5,
  rollLimit: 100,
  rollRows: 50,
  pollTries: 8,
  pollMs: 2500,
  journalMax: 50,
});

/** The three files of the Block Yard's verifier the page runs, and the order it checks them in. */
export const VERIFIER_FILES = Object.freeze(['verify.js', 'verify-worker.js', 'pointcast_chain.wasm']);

/** Where the browser's module worker shim lives, next to this file. */
export const SHIM_URL = new URL('./witness-shim.js', import.meta.url).href;

// ---------------------------------------------------------------- refusals

/** Anything that means "nothing is signed": a bad pin, a fault, a stall, the midnight guard. */
export class Refusal extends Error {
  constructor(message, code = 'refused') {
    super(message);
    this.name = 'Refusal';
    this.code = code;
  }
}
export class PinError extends Refusal {
  constructor(message) {
    super(message, 'pin');
    this.name = 'PinError';
  }
}
export class ReplayFault extends Refusal {
  constructor({ fault, height, reason, sequencerFault = false, evidenceJson = '' }) {
    super('FAULT at height ' + height + ': ' + cleanText(String(fault), 60) + ' (' + cleanText(String(reason), 200) + ')' + (sequencerFault ? ', a sequencer fault' : '') + '; refusing to sign', 'fault');
    this.name = 'ReplayFault';
    this.at = Number(height);
    this.fault = cleanText(String(fault), 60);
    this.reason = cleanText(String(reason), 200);
    this.sequencerFault = Boolean(sequencerFault);
    this.evidenceJson = typeof evidenceJson === 'string' ? evidenceJson : '';
  }
}
export class Midnight extends Refusal {
  constructor(message) {
    super(message, 'midnight');
    this.name = 'Midnight';
  }
}
export class Cancelled extends Refusal {
  constructor() {
    super('cancelled: nothing was signed or sent', 'cancelled');
    this.name = 'Cancelled';
  }
}

const utcLine = (ms) => new Date(ms).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

/** True from 23:59:00 to 00:00:59 UTC, when a post could land on either day (pc-witness.mjs nearMidnight). */
export function nearMidnight(ms) {
  const minute = Math.floor((ms % 86_400_000) / 60_000);
  return minute >= 1439 || minute < 1;
}

/**
 * Throws Midnight when `ms` is in that minute. `what` names the post that was not sent. `landed` is true when an earlier
 * post of the same send is already in a block (the attestation, before the check-in): then the words say that, not "nothing".
 */
export function assertNotNearMidnight(ms, what, { landed = false } = {}) {
  if (nearMidnight(ms)) {
    throw new Midnight(what + ' not sent: it is ' + utcLine(ms) + ', and a post sent between 23:59 and 00:01 UTC could land on either day. '
      + (landed ? 'The attestation is already in; nothing more was sent. Try the check-in again after 00:01 UTC.' : 'Nothing was sent; try again after 00:01 UTC.'));
  }
}

// ---------------------------------------------------------------- names and notes

/**
 * Names that start like the house's or the keyless bots' (the house runner is house-runner-1; the bots are claude, grok, chatgpt,
 * frog and sparrow). The devnet binds none of them to a visitor's key, but it does not bind a lookalike such as house-runner-9
 * to anyone either, so on the public roll it would read as the house runner. This page does not offer one. It is the page's rule,
 * on top of the Daily Net's own list of seven (W.RESERVED_NAMES).
 */
export const RESERVED_PREFIXES = Object.freeze(['house-', 'claude', 'grok', 'chatgpt', 'frog', 'sparrow', 'pointcast']);

/** A witness name: 2 to 24 of a-z, 0-9 and hyphen, not reserved and not starting like a reserved one. '' is fine (no name). Returns { ok, name, reason }. */
export function checkName(raw) {
  const name = String(raw === undefined || raw === null ? '' : raw).trim();
  if (!name) return { ok: true, name: '', reason: '' };
  if (!W.NAME_RE.test(name)) return { ok: false, name, reason: 'A name is 2 to 24 of a–z, 0–9 and hyphen (lower case).' };
  if (W.RESERVED_NAMES.includes(name)) return { ok: false, name, reason: '“' + name + '” is reserved for the house. Pick another.' };
  if (RESERVED_PREFIXES.some((p) => name.startsWith(p))) return { ok: false, name, reason: '“' + name + '” starts like a name reserved for the house or the bots (' + RESERVED_PREFIXES.join(', ') + '). Pick another.' };
  return { ok: true, name, reason: '' };
}

/** A check-in note: up to 140 characters, no control or invisible characters. '' is fine. Returns { ok, note, reason }. */
export function checkNote(raw) {
  const note = String(raw === undefined || raw === null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (!note) return { ok: true, note: '', reason: '' };
  try {
    W.buildNetBody('checkin', { note }, '2026-01-01');
  } catch (e) {
    return { ok: false, note, reason: cleanText(String(e && e.message), 120) };
  }
  return { ok: true, note, reason: '' };
}

// ---------------------------------------------------------------- the pinned verifier

const toBytes = (b) => (b instanceof Uint8Array ? b : b instanceof ArrayBuffer ? new Uint8Array(b) : null);

/**
 * Check the verifier's bytes before anything runs. `files` maps each of
 * VERIFIER_FILES to its bytes; `pins` maps each to the sha256 this page pins;
 * `sumsText` is the Block Yard's own pointcast_chain.wasm.sha256, whose first
 * word must equal the wasm's hash too. Returns { name: sha256 }. Throws a
 * PinError naming the first file that is not the one pinned.
 */
export async function checkVerifierBytes(files, pins, sumsText) {
  const sha = {};
  for (const name of VERIFIER_FILES) {
    const bytes = toBytes(files && files[name]);
    if (!bytes) throw new PinError(name + ' did not load, so the verifier is not run');
    const want = String((pins && pins[name]) || '').toLowerCase();
    if (!isHex64(want)) throw new PinError('this page has no pin for ' + name);
    const got = await sha256Hex(bytes);
    sha[name] = got;
    if (got !== want) throw new PinError(name + ' is not the verifier this page pins (sha256 ' + got.slice(0, 12) + '…, want ' + want.slice(0, 12) + '…); refusing to run it');
  }
  if (typeof sumsText !== 'string') throw new PinError('pointcast_chain.wasm.sha256 did not load, so the Block Yard’s own fingerprint could not be compared');
  const listed = sumsText.trim().split(/\s+/)[0] || '';
  if (listed.toLowerCase() !== sha['pointcast_chain.wasm']) {
    throw new PinError('pointcast_chain.wasm.sha256 lists ' + cleanText(listed, 64) + ', the wasm is ' + sha['pointcast_chain.wasm'] + '; refusing to run it');
  }
  return sha;
}

async function fetchBytes(f, url, ms) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;
  const clock = new Promise((_, reject) => {
    timer = setTimeout(() => {
      if (ctrl) ctrl.abort();
      reject(new PinError(url.split('/').pop() + ' did not load (timed out)'));
    }, ms);
  });
  clock.catch(() => {});
  try {
    const res = await Promise.race([f(url, { credentials: 'omit', cache: 'no-cache', referrerPolicy: 'no-referrer', signal: ctrl ? ctrl.signal : undefined }), clock]);
    if (!res || !res.ok) throw new PinError(url.split('/').pop() + ' did not load (HTTP ' + (res ? res.status : 0) + ')');
    return new Uint8Array(await Promise.race([res.arrayBuffer(), clock]));
  } catch (e) {
    if (e instanceof PinError) throw e;
    throw new PinError(url.split('/').pop() + ' did not load (' + (e && e.name === 'AbortError' ? 'timed out' : 'unreachable') + ')');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch the verifier from `base` (the Block Yard's folder on this site) and check
 * it against the pins. Returns { bytes: {name: Uint8Array}, sha: {name: hex}, base }.
 */
export async function fetchVerifier({ fetch: f, base, pins, sumsFile = 'pointcast_chain.wasm.sha256', timeoutMs = LIMITS.fetchMs }) {
  const doFetch = f || ((...a) => globalThis.fetch(...a));
  const names = [...VERIFIER_FILES, sumsFile];
  const got = await Promise.all(names.map((n) => fetchBytes(doFetch, base + n, timeoutMs)));
  const bytes = Object.fromEntries(VERIFIER_FILES.map((n, i) => [n, got[i]]));
  const sums = new TextDecoder().decode(got[VERIFIER_FILES.length]);
  const sha = await checkVerifierBytes(bytes, pins, sums);
  return { bytes, sha, base };
}

/**
 * Blob URLs of the checked bytes, for the worker: it runs verify-worker.js and
 * imports verify.js from these, never from a URL the page could not vouch for.
 * `env` is { URL, Blob } (the window's). revoke() frees them.
 */
export function blobAssets(bytes, env) {
  const mk = (b) => env.URL.createObjectURL(new env.Blob([b], { type: 'text/javascript' }));
  const urls = [mk(bytes['verify.js']), mk(bytes['verify-worker.js'])];
  return {
    verifyJsUrl: urls[0],
    workerUrl: urls[1],
    /** A fresh copy each time: the worker takes it by transfer. */
    wasmCopy: () => bytes['pointcast_chain.wasm'].slice().buffer,
    revoke() { for (const u of urls) { try { env.URL.revokeObjectURL(u); } catch { /* already gone */ } } },
  };
}

function base64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * Check the bytes and load verify.js from exactly those bytes (the node path:
 * pc-witness.mjs does the same). Returns { PointcastVerifier, parseJson, wasm,
 * sha }. `importModule` is how a data: module is imported (a test can swap it).
 */
export async function loadPinnedVerifier({ files, pins, sumsText, importModule = (u) => import(u) }) {
  const sha = await checkVerifierBytes(files, pins, sumsText);
  const mod = await importModule('data:text/javascript;base64,' + base64(toBytes(files['verify.js'])));
  if (typeof mod.PointcastVerifier !== 'function' || typeof mod.parseJson !== 'function') throw new PinError('verify.js has no PointcastVerifier');
  return { PointcastVerifier: mod.PointcastVerifier, parseJson: mod.parseJson, wasm: toBytes(files['pointcast_chain.wasm']), sha };
}

// ---------------------------------------------------------------- the replay's result

const isCp = (h) => h === 1 || (h >= 10 && h % 10 === 0);

/**
 * Gathers what a replay says, from either path, and makes the one result.
 *   addVerified([[height, block_hash, state_root], ...])   the verifier's own checkpoints
 *   addHeaders([[height, timestamp, prev_hash, tx_root, state_root], ...])   the headers as downloaded
 *   addBlocks([{ height, txs: [card] }, ...])   the verifier's cards, for the WIT and NET posts
 * result({ minHeight }) re-hashes every header and demands it equal the verified
 * hash at its height: a timestamp that is not bound to a verified block is not
 * used, and the replay is refused.
 */
export function makeCollector() {
  const hashAt = new Map();
  const rows = new Map();
  const posts = [];
  let conflict = 0;
  return {
    addVerified(list) {
      for (const r of Array.isArray(list) ? list : []) {
        if (!Array.isArray(r)) continue;
        const h = Number(r[0]);
        if (Number.isSafeInteger(h) && h >= 1 && isHex64(r[1]) && isHex64(r[2])) hashAt.set(h, { block_hash: r[1], state_root: r[2] });
      }
    },
    addHeaders(list) {
      for (const r of Array.isArray(list) ? list : []) {
        if (!Array.isArray(r)) continue;
        const h = Number(r[0]);
        const row = [Number(r[1]), String(r[2]), String(r[3]), String(r[4])];
        if (!Number.isSafeInteger(h) || h < 1) continue;
        const had = rows.get(h);
        if (had && had.join() !== row.join()) conflict = conflict || h;
        else rows.set(h, row);
      }
    },
    addBlocks(list) {
      for (const b of Array.isArray(list) ? list : []) {
        const height = Number(b && b.height);
        for (const t of (b && Array.isArray(b.txs) ? b.txs : [])) {
          const p = t && t.payload;
          if (t && t.kind === 'publish_block' && isObj(p) && (p.channel === CHANNEL_WIT || p.channel === CHANNEL_NET)) {
            posts.push({ height, tx: String(t.hash), sender: String(t.sender), channel: p.channel, title: String(p.title), body_hash: String(p.body_hash) });
          }
        }
      }
    },
    result({ minHeight = 0 } = {}) {
      let top = 0;
      for (const h of hashAt.keys()) top = Math.max(top, h);
      if (top < 1) throw new Refusal('the replay produced no blocks', 'empty');
      if (hashAt.size !== top) throw new Refusal('the replay skipped blocks (it holds ' + hashAt.size + ' of ' + top + '); refusing to sign', 'gap');
      if (top < minHeight) throw new Refusal('the replay stopped at block ' + top + ', short of the ' + minHeight + ' blocks the devnet reported; refusing to sign', 'short');
      if (conflict) throw new Refusal('the devnet served block ' + conflict + ' two different ways during the replay; refusing to sign', 'conflict');
      const ts = [];
      for (let h = 1; h <= top; h++) {
        const row = rows.get(h);
        if (!row || !Number.isSafeInteger(row[0]) || row[0] < 0) throw new Refusal('no header was read for block ' + h + ' that could be bound to the replay; refusing to sign', 'unbound');
        let got = '';
        try {
          got = pcc.blockHeaderHash({ height: h, prev_hash: row[1], timestamp: row[0], tx_root: row[2], state_root: row[3] });
        } catch {
          got = '';
        }
        if (got !== hashAt.get(h).block_hash) throw new Refusal('the header read for block ' + h + ' does not hash to the block the verifier accepted; refusing to sign', 'unbound');
        ts[h] = row[0];
      }
      const cps = new Map();
      for (const [h, v] of hashAt) if (isCp(h)) cps.set(h, v);
      const tip = { height: top, ...hashAt.get(top) };
      return { tip, cps, ts, posts: posts.slice() };
    },
  };
}

// ---------------------------------------------------------------- the node replay

const sleepFor = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Replay /raw/blocks from height 1 through a loaded pinned verifier, the way
 * pc-witness.mjs and bots/verify.mjs do. `get(path)` returns the node's JSON
 * parsed losslessly (verify.js parseJson). Returns { promise, cancel }; the
 * promise resolves to the collector's result and rejects with ReplayFault on
 * any fault, Refusal for what cannot be bound, Cancelled after cancel().
 * A 429 or 5xx on a page is tried again (`retries` times, waiting Retry-After
 * when the node says how long).
 */
export function replayNode({ get, verifier, params, genesis, minHeight = 0, onProgress = () => {}, sleep = sleepFor, retries = 3 }) {
  let cancelled = false;
  const guard = () => { if (cancelled) throw new Cancelled(); };
  const getRetry = async (path) => {
    for (let i = 0; ; i++) {
      guard();
      try {
        return await get(path);
      } catch (e) {
        const status = Number(e && e.status);
        const transient = status === 429 || (status >= 500 && status < 600) || /^(429|5\d\d) /.test(String(e && e.message));
        if (!transient || i >= retries) throw e;
        await sleep(Math.min(8000, Math.max(300, (Number(e && e.retryAfter) || 0) * 1000 || 700 * (i + 1))));
      }
    }
  };
  const promise = (async () => {
    const v = await verifier.PointcastVerifier.load(verifier.wasm);
    v.call('verifier.new', { params, genesis });
    const col = makeCollector();
    for (let from = 1; ;) {
      const page = await getRetry('/raw/blocks?from=' + from + '&limit=500');
      guard();
      if (!page || !Array.isArray(page.blocks) || !page.blocks.length) break;
      const out = v.call('verifier.push', { blocks: page.blocks });
      const done = out.checkpoints.length;
      col.addVerified(out.checkpoints.map((c) => [Number(c.height), c.block_hash, c.state_root]));
      col.addHeaders(page.blocks.slice(0, done).map((b) => [Number(b.header.height), Number(b.header.timestamp), b.header.prev_hash, b.header.tx_root, b.header.state_root]));
      col.addBlocks(out.blocks || []);
      if (out.fault) {
        throw new ReplayFault({ fault: out.fault, height: out.at_height, reason: out.reason, sequencerFault: Boolean(out.sequencer_fault) });
      }
      onProgress({ height: Number(out.height), tip: Math.max(Number(page.tip) || 0, minHeight) });
      // A page that did not move the replay on is not served again for ever: the node is not honouring `from`.
      if (!(Number(out.height) >= from)) throw new Refusal('the devnet’s blocks do not advance the replay past block ' + (from - 1) + '; refusing to sign', 'stuck');
      from = Number(out.height) + 1;
      if (from > Number(page.tip)) break;
    }
    return col.result({ minHeight });
  })();
  return { promise, cancel() { cancelled = true; } };
}

// ---------------------------------------------------------------- the worker replay

/**
 * Replay in the pinned Block Yard worker. `spawn()` returns a Worker (a module
 * worker running witness-shim.js, or a test double). `assets` is blobAssets()
 * of the checked bytes. The worker keeps following the tip after it catches up;
 * the replay ends the first time it has replayed up to the tip it knows (never
 * below `minHeight`, the height /status gave), then the worker is stopped and
 * terminated. Returns { promise, cancel }.
 *
 * Refuses (rejects) on: a fault (ReplayFault, with the evidence the worker made),
 * a worker that did not start from genesis, a worker that cannot load, a stall of
 * `stallMs` with no new block, and whatever the collector cannot bind.
 */
export function workerReplay({ spawn, assets, api, genesis, shas = {}, minHeight = 0, onProgress = () => {}, onNote = () => {}, stallMs = LIMITS.stallMs, timers = {} }) {
  const setT = timers.setTimeout || ((f, ms) => globalThis.setTimeout(f, ms));
  const clearT = timers.clearTimeout || ((t) => globalThis.clearTimeout(t));
  const nowFn = timers.now || (() => Date.now());
  let cancel = () => {};
  const promise = new Promise((resolve, reject) => {
    let w;
    try {
      w = spawn();
    } catch (e) {
      reject(new Refusal('this browser could not start a worker (' + cleanText(String(e && e.message), 100) + '); nothing was signed', 'worker'));
      return;
    }
    const col = makeCollector();
    let done = false;
    let tip = minHeight;
    let height = 0;
    let last = nowFn();
    let note = '';
    let timer = null;
    const end = (fn, v) => {
      if (done) return;
      done = true;
      clearT(timer);
      try { w.postMessage({ stop: true, save: false }); } catch { /* the worker is gone already */ }
      try { w.terminate(); } catch { /* ditto */ }
      fn(v);
    };
    const watch = () => {
      if (done) return;
      if (nowFn() - last > stallMs) {
        end(reject, new Refusal('the replay stalled at block ' + height + ' of ' + tip + ': no new block for ' + Math.round(stallMs / 1000) + ' s' + (note ? ' (' + note + ')' : '') + '. Nothing was signed.', 'stall'));
        return;
      }
      timer = setT(watch, Math.max(50, Math.min(1000, Math.round(stallMs / 4))));
    };
    timer = setT(watch, Math.max(50, Math.min(1000, Math.round(stallMs / 4))));
    cancel = () => end(reject, new Cancelled());
    w.onmessage = (ev) => {
      if (done) return;
      const m = ev && ev.data;
      if (!isObj(m)) return;
      try {
        switch (m.type) {
          case 'ready':
            if (!(isObj(m.basis) && m.basis.verified_from_genesis === true) || m.resumed) {
              end(reject, new Refusal('the worker did not start from genesis (it reports another basis), so its replay is not used', 'basis'));
              return;
            }
            last = nowFn();
            onNote({ type: 'ready' });
            break;
          case 'witness-headers':
            col.addHeaders(m.rows);
            break;
          case 'progress': {
            col.addVerified(m.verified);
            col.addBlocks(m.blocks);
            const h = Number(m.height);
            if (Number.isSafeInteger(h) && h > height) { height = h; last = nowFn(); }
            tip = Math.max(tip, Number(m.tip) || 0, height);
            onProgress({ height, tip });
            if (height >= tip && height > 0) {
              const result = col.result({ minHeight });
              end(resolve, result);
            }
            break;
          }
          case 'fault':
            end(reject, new ReplayFault({ fault: m.fault, height: m.height, reason: m.reason, sequencerFault: true, evidenceJson: m.evidence_json }));
            break;
          case 'node_fault':
            note = 'the devnet served a block that does not extend the replay at ' + Number(m.height) + ': ' + cleanText(String(m.reason), 140);
            onNote({ type: 'node_fault', text: note, status: /\b429\b/.test(String(m.reason)) ? 429 : 0 });
            break;
          case 'error':
            if (m.transient) {
              note = cleanText(String(m.message), 160);
              onNote({ type: 'transient', text: note, status: /\b429\b/.test(note) ? 429 : 0 });
            } else {
              end(reject, new Refusal('the verifier worker stopped: ' + cleanText(String(m.message), 200) + '. Nothing was signed.', 'worker'));
            }
            break;
          default:
            break;
        }
      } catch (e) {
        end(reject, e);
      }
    };
    w.onerror = (e) => end(reject, new Refusal('the verifier worker could not run (' + cleanText(String((e && e.message) || 'it failed to load'), 160) + '): this browser cannot replay here. Nothing was signed.', 'worker'));
    try {
      const wasm = assets.wasmCopy();
      w.postMessage({
        workerUrl: assets.workerUrl,
        start: { api, genesis, verifyJsUrl: assets.verifyJsUrl, wasm, wasmSha256: shas['pointcast_chain.wasm'], workerSha256: shas['verify-worker.js'], verifyJsSha256: shas['verify.js'] },
      }, [wasm]);
    } catch (e) {
      end(reject, new Refusal('the verifier worker could not be started (' + cleanText(String(e && e.message), 120) + '). Nothing was signed.', 'worker'));
    }
  });
  return { promise, cancel: () => cancel() };
}

// ---------------------------------------------------------------- choosing the checkpoint

/**
 * What to attest, from the replay alone (never from /status or /duties), the
 * way pc-witness.mjs picks it: the epoch is block 1's hash; the UTC day is the
 * later of the replayed tip's and the clock's (a post counts on its block's day,
 * and just after midnight an idle chain's tip is still yesterday's); the target
 * is today's day checkpoint, else the latest sealed one. Returns
 * { epoch, day, dayCp, target, claim, tipHeight, empty }; target is null (empty
 * true) when no checkpoint is sealed yet (the first is height 10).
 */
export function chooseCheckpoint({ replay, nowMs }) {
  const { tip, cps, ts } = replay;
  const epoch = cps.get(1).block_hash;
  const day = W.utcDay(Math.max(ts[tip.height], nowMs));
  const headers = [];
  ts.forEach((t, h) => headers.push({ height: h, timestamp: t }));
  const dayCp = W.dayCheckpoint(headers, { day });
  const target = dayCp ?? W.checkpointAt(tip.height);
  return { epoch, day, dayCp, target, claim: target === null ? null : cps.get(target), tipHeight: tip.height, empty: target === null };
}

const WIT_TITLE = /^witness · h\d+ · root [0-9a-f]{12}( · |$)/;
const NET_CHECKIN = /^net · checkin( · |$)/;

/**
 * What this key already has on chain, from the replay's own posts: a WIT post at
 * the target, any WIT post counted today, a NET check-in today. A post counts on
 * the UTC day of its block (the replay's timestamp).
 */
export function standingFromReplay({ posts, ts, address, target, claim, day }) {
  const mine = posts.filter((p) => p.sender === address);
  const wits = mine.filter((p) => p.channel === CHANNEL_WIT && WIT_TITLE.test(p.title));
  const prefix = 'witness · h' + target + ' · root ' + String(claim ? claim.state_root : '').slice(0, 12);
  const onDay = (p) => Number.isFinite(ts[p.height]) && W.utcDay(ts[p.height]) === day;
  return {
    atTarget: wits.find((p) => p.title === prefix || p.title.startsWith(prefix + ' · ')) || null,
    today: wits.find(onDay) || null,
    checkin: mine.find((p) => p.channel === CHANNEL_NET && NET_CHECKIN.test(p.title) && onDay(p)) || null,
  };
}

// ---------------------------------------------------------------- the journal

/** The claims this browser signed, kept only if storage works: { v, entries }. Never throws. */
export function readJournal(storage) {
  try {
    const raw = storage && storage.getItem(JOURNAL_SLOT);
    const j = raw ? JSON.parse(raw) : null;
    if (!isObj(j) || !Array.isArray(j.entries)) return { v: 1, entries: [] };
    const entries = j.entries.filter((e) => isObj(e) && isHex64(e.genesis) && isHex64(e.epoch) && typeof e.address === 'string' && isWhole(e.height) && isHex64(e.block_hash) && isHex64(e.state_root));
    return { v: 1, entries: entries.slice(-LIMITS.journalMax) };
  } catch {
    return { v: 1, entries: [] };
  }
}

/** Add or update one claim (matched by genesis, epoch, address and height). Returns true when it was written. */
export function writeJournal(storage, entry) {
  try {
    const j = readJournal(storage);
    const same = (e) => e.genesis === entry.genesis && e.epoch === entry.epoch && e.address === entry.address && e.height === entry.height;
    const i = j.entries.findIndex(same);
    if (i >= 0) j.entries[i] = { ...j.entries[i], ...entry };
    else j.entries.push(entry);
    storage.setItem(JOURNAL_SLOT, JSON.stringify({ v: 1, entries: j.entries.slice(-LIMITS.journalMax) }));
    return true;
  } catch {
    return false;
  }
}

/** The journal's entries for this chain epoch and key. */
export const journalFor = (journal, { genesis, epoch, address }) => journal.entries.filter((e) => e.genesis === genesis && e.epoch === epoch && e.address === address);

/** The first journal entry whose claim differs from this replay's at the same height, or null. */
export function journalConflict(entries, cps) {
  for (const e of entries) {
    const now = cps.get(e.height);
    if (now && (now.block_hash !== e.block_hash || now.state_root !== e.state_root)) return e;
  }
  return null;
}

// ---------------------------------------------------------------- the plan

const utf8 = (s) => new TextEncoder().encode(s).length;

/** What a plan says when there is no key. It is the next step, not a fault: the page shows it as a polite line, not an alert. */
export const NEED_KEY = 'Make a key first: the claim is signed by it.';

/** The words under the claim's line one: what it says in plain text. Parsers ignore everything after the first newline. */
export function humanLine({ chainId, wasmSha, target }) {
  return 'I replayed ' + chainId + ' from genesis with the pinned verifier (wasm ' + String(wasmSha).slice(0, 12) + ') in a browser tab and got this block hash and state root at height ' + target + '. A public claim tied to this key, not proof of replay. Devnet: no value, may reset.';
}

/**
 * Everything the page will send, worked out and (for the claim) signed, with
 * nothing sent. Returns:
 *   { ok, errors, notes, sendable, blocked, day, epoch, dayCp, target, claim, tipHeight, sender, name,
 *     wit: {channel,title,body,line,digest,signature,publicKey} | null, witSkip: {why, tx, height} | null,
 *     net: {channel,title,body} | null, netSkip: string }
 * `ok` is false when something stops the plan (no key, a bad name, a journal
 * conflict, nothing sealed yet); `sendable` when there is a post to send now;
 * `blocked` is 'midnight' while the guard holds. A key signs only what the replay
 * said: the block hash and state root come from `replay`, never from the server.
 *
 *   replay   the collector's result      choice   chooseCheckpoint()'s result
 *   key      keyFromSeed()               opts     { name, checkin, note }
 *   journal  readJournal()               earlier  { status, height } of this key's journalled tx at the target, or null
 */
export async function planWitness({ replay, choice, chainId, genesis, key, opts = {}, nowMs, wasmSha, journal = { entries: [] }, earlier = null }) {
  const plan = { ok: false, errors: [], notes: [], sendable: false, blocked: '', day: choice.day, epoch: choice.epoch, dayCp: choice.dayCp, target: choice.target, claim: choice.claim, tipHeight: choice.tipHeight, sender: key ? key.sender : '', name: '', wit: null, witSkip: null, net: null, netSkip: '' };
  const nm = checkName(opts.name);
  if (!nm.ok) plan.errors.push(nm.reason);
  plan.name = nm.ok ? nm.name : '';
  const nt = opts.checkin ? checkNote(opts.note) : { ok: true, note: '' };
  if (!nt.ok) plan.errors.push('The check-in note: ' + nt.reason);
  if (choice.empty) {
    plan.errors.push('No checkpoint is sealed yet (the first is height 10), so there is nothing to attest.');
    return plan;
  }
  if (!key) {
    plan.errors.push(NEED_KEY);
    return plan;
  }
  const conflict = journalConflict(journalFor(journal, { genesis, epoch: choice.epoch, address: key.sender }), replay.cps);
  if (conflict) {
    plan.errors.push('Your journal holds a different claim at №' + conflict.height + ' (signed ' + cleanText(String(conflict.signed_at || ''), 40) + (conflict.tx ? ', tx ' + String(conflict.tx).slice(0, 12) + '…' : '') + ') than this replay: refusing to sign. Something changed (your verifier, or the chain this server shows you); a second claim would be public evidence against your key.');
    return plan;
  }
  if (plan.errors.length) return plan;
  const st = standingFromReplay({ posts: replay.posts, ts: replay.ts, address: key.sender, target: choice.target, claim: choice.claim, day: choice.day });
  // ---- the attestation, or why none is sent
  let witLanded = false;
  const have = st.atTarget || st.today;
  if (have) {
    const at = /^witness · h(\d+) /.exec(have.title);
    plan.witSkip = { why: 'You attested today already (checkpoint №' + (at ? at[1] : choice.target) + ', tx ' + have.tx + ' in block №' + have.height + '). Nothing new to sign.', tx: have.tx, height: have.height };
    witLanded = true;
  } else if (earlier && earlier.status === 'included') {
    plan.witSkip = { why: 'You attested №' + choice.target + ' already (' + (earlier.sentHere ? 'this page sent it, and it is' : 'your journal’s tx is') + ' in block №' + earlier.height + '). Nothing new to sign.', tx: earlier.tx || '', height: earlier.height };
    witLanded = true;
  } else if (earlier && earlier.status === 'pending') {
    plan.witSkip = { why: 'Your attestation of №' + choice.target + ' is still waiting for a block (tx ' + String(earlier.tx || '').slice(0, 12) + '…). Not sending another.', tx: earlier.tx || '', height: null };
  } else {
    const s = await W.signWitness(key.seedHex, { chain_id: chainId, genesis, epoch: choice.epoch, height: choice.target, block_hash: choice.claim.block_hash, state_root: choice.claim.state_root, tool: TOOL, name: plan.name || undefined });
    if (s.address !== key.sender) throw new Error('the witness key and the account key disagree');
    const body = s.line + '\n' + humanLine({ chainId, wasmSha, target: choice.target });
    if (utf8(body) > W.BODY_MAX_BYTES) throw new Error('the attestation does not fit ' + W.BODY_MAX_BYTES + ' bytes');
    plan.wit = { channel: CHANNEL_WIT, title: s.title, body, line: s.line, digest: s.digest, signature: s.signature, publicKey: s.public_key };
  }
  // ---- the check-in
  if (opts.checkin) {
    if (st.checkin) plan.netSkip = 'You checked in today already (tx ' + st.checkin.tx + ', block №' + st.checkin.height + ').';
    else if (!witLanded && !plan.wit) plan.netSkip = 'The check-in waits until the attestation is in a block.';
    else {
      plan.net = { channel: CHANNEL_NET, title: 'net · checkin' + (plan.name ? ' · ' + plan.name : ''), body: W.buildNetBody('checkin', { note: nt.note || undefined, name: plan.name || undefined }, choice.day) };
    }
  }
  plan.ok = true;
  plan.sendable = Boolean(plan.wit || plan.net);
  if (plan.sendable && nearMidnight(nowMs)) {
    plan.blocked = 'midnight';
    plan.notes.push('It is ' + utcLine(nowMs) + ': nothing can be sent between 23:59 and 00:01 UTC. Try again after 00:01 UTC.');
  }
  return plan;
}

// ---------------------------------------------------------------- sending

const wordFilter = (e) => /word filter/i.test(String(e && e.message));

/** The devnet's refusal for a hex-reading word filter, in pc-witness.mjs's words. Keeps the error's tags (sendState, txHash). */
function explainRefusal(e, channel) {
  if (wordFilter(e)) {
    // The hex-reading explanation fits the attestation, whose body is a signed line of hex. A check-in is text the person chose:
    // its name and its note, so that is what to change.
    e.message = channel === CHANNEL_WIT
      ? channel + ' refused: ' + cleanText(String(e.message), 160) + '. A devnet whose word filter predates the Daily Net reads hex as words, so a few witness bodies in a hundred trip it; the same claim is refused again until the Daily Net door (which filters only text fields) is live there. Nothing else was sent.'
      : channel + ' refused: ' + cleanText(String(e.message), 160) + '. The check-in carries your name and your note: change or clear them and send it again.';
  }
  return e;
}

async function postOne({ chain, key, channel, title, body, now, label, onStage, wait, onSigned, landed = false }) {
  assertNotNearMidnight(now(), label, { landed });
  let tx = await chain.buildPublish({ sender: key.sender, channel, title, body });
  for (let attempt = 0; ; attempt++) {
    assertNotNearMidnight(now(), label, { landed });
    try {
      return await signAndSend(chain, key, tx, { onStage, onSigned, ...wait });
    } catch (e) {
      const m = String(e && e.message);
      if (attempt === 0 && e && e.sendState === 'refused' && /nonce mismatch/i.test(m) && !/already included/i.test(m)) {
        tx = { ...tx, nonce: await chain.nextNonce(key.sender) };
        continue;
      }
      throw explainRefusal(e, channel);
    }
  }
}

/**
 * Send what the plan says, in pc-witness.mjs's order: the attestation on WIT, wait
 * for its block, then (if planned) the check-in on NET. The midnight guard is
 * checked before every write, and the plan is refused if its UTC day has passed,
 * its replay is older than LIMITS.staleMs, or the devnet's block 1 is no longer
 * the epoch it was made for. `onSigned(kind, {txHash, plan})` runs after a post is
 * signed and BEFORE any byte of it leaves, so a journal can keep the claim first.
 * Returns { wit: {txHash, height, timeMs, counted} | null, net: {...} | null }.
 * Throws signAndSend's tagged errors (sendState: refused, maybe, sent, rejected).
 * If the attestation landed and the check-in then failed, the error carries what
 * landed as `partial` (the same shape as the return value): the attestation is in
 * a block, and a page must say so and must not offer it again.
 */
export async function sendWitness({ chain, net, key, plan, now = () => Date.now(), replayedAt = 0, onStage = () => {}, onSigned = () => {}, wait = {} }) {
  if (!plan || !plan.ok || !plan.sendable) throw new Refusal('there is nothing to send', 'nothing');
  if (!key || plan.sender !== key.sender) throw new Refusal('the key changed since the review; review again', 'key');
  assertNotNearMidnight(now(), 'the post');
  if (W.utcDay(now()) !== plan.day) throw new Refusal('the UTC day changed since the replay (it was ' + plan.day + '): replay again so the check-in and the claim count on today’s roll', 'day');
  if (replayedAt && now() - replayedAt > LIMITS.staleMs) throw new Refusal('the replay is ' + Math.round((now() - replayedAt) / 60000) + ' minutes old: replay again', 'stale');
  const blockOne = await net.get('/block/1');
  if (!isObj(blockOne) || blockOne.hash !== plan.epoch) throw new Refusal('the devnet’s block 1 is not the one this replay started from (it was restarted): replay again. Nothing was sent.', 'epoch');
  const out = { wit: null, net: null };
  const timeOf = async (height) => {
    try {
      const b = await net.get('/block/' + height);
      return isObj(b) && isWhole(b.timestamp) ? b.timestamp : null;
    } catch {
      return null;
    }
  };
  try {
    if (plan.wit) {
      const done = await postOne({ chain, key, channel: CHANNEL_WIT, title: plan.wit.title, body: plan.wit.body, now, label: 'the attestation', onStage: (s) => onStage('wit', s), wait, onSigned: (info) => onSigned('wit', { ...info, plan }) });
      const timeMs = await timeOf(done.height);
      out.wit = { txHash: done.txHash, height: done.height, timeMs, counted: timeMs === null ? '' : W.countedDay({ kind: 'witness', blockTimestamp: timeMs }) };
    }
    if (plan.net) {
      const done = await postOne({ chain, key, channel: CHANNEL_NET, title: plan.net.title, body: plan.net.body, now, label: 'the check-in', onStage: (s) => onStage('net', s), wait, onSigned: (info) => onSigned('net', { ...info, plan }), landed: Boolean(out.wit) });
      const timeMs = await timeOf(done.height);
      out.net = { txHash: done.txHash, height: done.height, timeMs, counted: timeMs === null ? '' : W.countedDay({ kind: 'net', bodyDay: plan.day, blockTimestamp: timeMs }) };
    }
  } catch (e) {
    // what already landed goes with the error: the attestation is in a block even though the check-in after it failed
    if (e && typeof e === 'object' && (out.wit || out.net)) e.partial = out;
    throw e;
  }
  return out;
}

// ---------------------------------------------------------------- the claim file

/** The portable evidence: what was signed, how, and where it went. A plain JSON file. */
export function makeClaimFile({ chainId, genesis, api, plan, txHash = '', height = null, timeMs = null, createdMs = Date.now() }) {
  const w = plan.wit;
  return {
    format: CLAIM_FORMAT,
    meaning: 'A public claim, tied to this key: it replayed this chain from genesis with the pinned verifier and got this block hash and state root at this height. It is not proof of replay. devnet: no value, may reset.',
    devnet: { chain_id: chainId, genesis, api },
    epoch: plan.epoch,
    claim: { height: plan.target, block_hash: plan.claim.block_hash, state_root: plan.claim.state_root },
    signed_by: { address: plan.sender, public_key: w ? w.publicKey : '' },
    digest: w ? w.digest : '',
    signature: w ? w.signature : '',
    line: w ? w.line : '',
    tool: TOOL,
    ...(plan.name ? { name: plan.name } : {}),
    tx: txHash,
    included: height === null ? null : { height, time_ms: timeMs },
    created: new Date(createdMs).toISOString(),
  };
}

// ---------------------------------------------------------------- the roll

const NAME_OK = (n) => typeof n === 'string' && W.NAME_RE.test(n);
const ADDR_OK = (a) => typeof a === 'string' && /^[A-Za-z0-9]{20,60}$/.test(a);
const RESULTS = new Set(['correct', 'mismatch', 'conflict', 'duplicate', 'over_cap', 'premature', 'not_checkpoint', 'other_epoch', 'unsupported_key', 'bad_key', 'bad_sig', 'malformed']);
const nat = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);

/** GET /checkpoints/{h}/witnesses -> the keys that signed it. Names and addresses that do not look like names and addresses are left out. */
export function readCheckpointRoll(json, height) {
  if (!isObj(json)) throw new KitError('the devnet’s roll for this checkpoint is not the shape this page reads', { code: 'shape' });
  if (json.network !== undefined && json.network !== 'devnet') throw new KitError('that is not a devnet roll', { code: 'shape' });
  if (nat(json.height) !== height) throw new KitError('that is not the roll for the checkpoint asked for', { code: 'shape' });
  const keys = (Array.isArray(json.witnesses) ? json.witnesses : []).filter(isObj).slice(0, LIMITS.rollRows).map((k) => ({
    addr: ADDR_OK(k.addr) ? k.addr : '',
    name: NAME_OK(k.name) ? k.name : '',
    nameBound: k.name_bound === true,
    tier: k.tier === 'witness' ? 'witness' : '',
    established: k.established === true,
    tx: isHex64(k.tx) ? k.tx : '',
    result: RESULTS.has(k.result) ? k.result : 'other',
    includedAt: nat(k.included_at),
  }));
  return {
    height,
    blockHash: isHex64(json.block_hash) ? json.block_hash : '',
    stateRoot: isHex64(json.state_root) ? json.state_root : '',
    sealed: json.sealed === true,
    distinct: Math.min(nat(json.distinct) ?? 0, 99999),
    correct: Math.min(nat(json.correct) ?? 0, 99999),
    strikes: Math.min(nat(json.strikes) ?? 0, 99999),
    more: Math.min(nat(json.more) ?? 0, 99999),
    tip: nat(json.tip),
    indexedHeight: nat(json.indexed_height),
    day: typeof json.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(json.day) ? json.day : '',
    keys,
  };
}

/** GET /witnesses -> one page of witness keys and where the next page starts. */
export function readWitnessRoll(json) {
  if (!isObj(json) || !Array.isArray(json.witnesses)) throw new KitError('the devnet’s witness roll is not the shape this page reads', { code: 'shape' });
  return {
    next: typeof json.next_after === 'string' && /^[A-Za-z0-9]{20,60}$/.test(json.next_after) ? json.next_after : null,
    day: typeof json.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(json.day) ? json.day : '',
    keys: json.witnesses.filter(isObj).slice(0, 200).map((k) => ({
      addr: ADDR_OK(k.addr) ? k.addr : '',
      name: NAME_OK(k.name) ? k.name : '',
      nameBound: k.name_bound === true,
      attestations: Math.min(nat(k.attestations) ?? 0, 99999),
      correct: Math.min(nat(k.correct) ?? 0, 99999),
      strikes: Math.min(nat(k.strikes) ?? 0, 99999),
      streak: Math.min(nat(k.streak) ?? 0, 99999),
      bestStreak: Math.min(nat(k.best_streak) ?? 0, 99999),
      established: k.established === true,
    })),
  };
}

/** Both reads of the roll: the keys at the checkpoint, and the whole witness roll (pages of 100, at most LIMITS.rollPages). */
export async function fetchRoll(net, { target, address }) {
  const cpJson = await net.get('/checkpoints/' + target + '/witnesses');
  const checkpoint = cpJson === null ? null : readCheckpointRoll(cpJson, target);
  let all = [];
  let next = null;
  let complete = false;
  for (let i = 0; i < LIMITS.rollPages; i++) {
    const page = readWitnessRoll(await net.get('/witnesses?limit=' + LIMITS.rollLimit + (next ? '&after=' + next : '')));
    all = all.concat(page.keys);
    next = page.next;
    if (!next || !page.keys.length) { complete = true; break; }
  }
  return { checkpoint, keys: all, complete, mine: all.find((k) => k.addr && k.addr === address) || null };
}

/**
 * What the roll says about this key's attestation, in the page's three words and
 * a few more: correct, strike, pending (and duplicate, notcounted, notlisted).
 * `includedAt` is the block the post landed in (null while it has not).
 */
export function standingOnRoll({ checkpoint, address, txHash = '', includedAt = null }) {
  const row = checkpoint ? checkpoint.keys.find((k) => (address && k.addr === address) || (txHash && k.tx === txHash)) : null;
  if (row) {
    switch (row.result) {
      case 'correct': return { state: 'correct', label: 'CORRECT', result: row.result, text: 'The devnet’s roll counts your attestation: your block hash and state root agree with this server’s at checkpoint №' + checkpoint.height + '. That is all “correct” says: it agreed with this server.' };
      case 'mismatch':
      case 'conflict': return { state: 'strike', label: 'STRIKE', result: row.result, text: 'The roll gives your key a strike (' + row.result + '): ' + W.STRIKE_COPY };
      case 'duplicate': return { state: 'duplicate', label: 'DUPLICATE', result: row.result, text: 'The same claim from your key is on the roll already. This one is not counted, and there is no strike.' };
      case 'over_cap': return { state: 'notcounted', label: 'NOT COUNTED', result: row.result, text: 'Over the day’s cap (24 counted attestations per witness, 50 new witnesses a day). Not counted; a strike would still apply if the claim were wrong.' };
      default: return { state: 'notcounted', label: 'NOT COUNTED', result: row.result, text: 'The roll did not count it (' + String(row.result).replace(/_/g, ' ') + ').' };
    }
  }
  if (includedAt === null) return { state: 'pending', label: 'PENDING', result: '', text: 'Your post is not in a block yet, so the roll cannot list it.' };
  if (checkpoint && checkpoint.indexedHeight !== null && checkpoint.indexedHeight < includedAt) {
    return { state: 'pending', label: 'PENDING', result: '', text: 'The roll has read to block №' + checkpoint.indexedHeight + ' and your post is in block №' + includedAt + '. Read it again in a moment.' };
  }
  if (!checkpoint) return { state: 'pending', label: 'PENDING', result: '', text: 'The devnet has no roll for this checkpoint yet. Read it again in a moment.' };
  return { state: 'notlisted', label: 'NOT LISTED', result: '', text: 'The roll has read past your post (block №' + includedAt + ') and does not list your key at this checkpoint.' };
}

/**
 * Read the roll until this key's row is there or `tries` reads have gone by,
 * `everyMs` apart (a post is on the roll a moment after its block). Returns the
 * last { roll, standing }.
 */
export async function pollRoll({ net, target, address, txHash = '', includedAt = null, tries = LIMITS.pollTries, everyMs = LIMITS.pollMs, sleep = sleepFor, onRead = () => {} }) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    const roll = await fetchRoll(net, { target, address });
    const standing = standingOnRoll({ checkpoint: roll.checkpoint, address, txHash, includedAt });
    last = { roll, standing };
    onRead(last);
    if (standing.state !== 'pending') break;
    if (i < tries - 1) await sleep(everyMs);
  }
  return last;
}

export { describeError };
