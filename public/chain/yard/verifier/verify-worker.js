// Verify Desk worker: replays a pointcast-chain node's blocks with the real
// consensus code (verify.js + pointcast_chain.wasm) and reports what it finds.
// Module worker.
//
// The PAGE fetches this file, verify.js and the wasm, checks each against the
// sha256 pinned in index.html, and starts the worker from those checked bytes:
//   postMessage({ api, genesis?, verifyJsUrl, wasm: ArrayBuffer, wasmSha256, checkpoint?,
//                 cache?, share?, wake?, workerSha256?, verifyJsSha256? })
// The worker never loads code from the node it is checking.
//
// checkpoint (optional; needs a verifier wasm with verifier.from_checkpoint):
// "latest" fetches the node's /snapshot/latest manifest and chunks, or pass
// a snapshot object (a manifest with `state` filled in). The wasm re-checks
// the seal, key proof and the state root over every account and module, and
// the replay starts at its height. `basis` then says
// "from checkpoint #H (sequencer-sealed)": show it yellow, never "verified".
//
// Offline-first (Town Network batch 5, `offline`). All three are opt-in, so
// a page that passes none of them gets exactly the batch-4 worker:
//
// - cache: true. This browser's OWN verified state is kept in IndexedDB
//   ("pointcast-chain", store "checkpoints"), keyed by the genesis pin and
//   the pinned verifier code (the wasm sha256, plus the worker's and
//   verify.js's sha256 the page passes as workerSha256 / verifyJsSha256):
//   {header, state} from this worker's replay every CACHE_SAVE_EVERY blocks
//   and on {stop}. The next start resumes from the newest one with
//   verifier.from_checkpoint (the wasm re-checks the seal and recomputes the
//   state root over every account and module, so a tampered entry is
//   refused, deleted, and the replay starts at genesis). That basis is
//   "self_verified": verified in this browser earlier. It is never green and
//   never "verified_from_genesis": anything on this origin can write
//   IndexedDB, so how the saving run started is only the entry's word
//   (`rests_on`). Only what the wasm re-checked is restored: the checkpoint
//   block's hash and root, never an older verified tail or replayed cards.
//   New verifier code, or a new genesis at the same node, discards the old
//   entries. Caps: CACHE_MAX_CHECKPOINTS per chain, and CACHE_MAX_BYTES in
//   all for this origin, of which OUTBOX_RESERVE_BYTES stay for the page's
//   outbox. No IndexedDB (a private window, blocked storage, a hung open)
//   means a full replay, never a failure. Nothing leaves the browser.
// - share: true (needs `genesis`). One fetcher per chain across this
//   browser's tabs: the leader (a Web Lock where the browser has them, else
//   an election over BroadcastChannel("pcc:" + genesis) with heartbeats)
//   fetches. Every other tab still VERIFIES: it takes the leader's state
//   through verifier.from_checkpoint (seal and state root re-checked; basis
//   "self_verified", via "tab", never green), then pushes the blocks the
//   leader relays through its own wasm, checks relayed fault evidence with
//   evidence.check and relayed anchors with anchor.check. Nothing a channel
//   message claims (a basis, a height, a card, a verdict) is shown as is:
//   any script on this origin can post on that channel. When the leader
//   stops (or its tab closes) another takes over from its own verified
//   state. Tabs only follow a leader running the same pinned code against
//   the same node.
// - wake: an http(s) EventSource URL (a pc-town /api/town/live, a replica or
//   devnet /stream). An event only wakes the next /raw/blocks fetch early,
//   at most once per WAKE_MIN_MS; nothing in an event is believed. After
//   WAKE_MAX_ERRORS failures the worker stops listening (the poll goes on).
//
// Messages in (besides the start message):
//   { stop: true, save?: false }    stop; the leader saves a checkpoint first (unless save: false),
//                                   then answers { type: "stopped" }
//   { forget: true, genesis? }      delete every cached checkpoint of this chain and stop saving
//                                   (also asks the tabs' leader to); answers { type: "forgotten" }
//   { save: true }                  the leader saves now (a pagehide hint)
//
// Messages out:
//   { type: "ready", genesis_hash, chain_id, wasm_sha256, basis, resumed, role }
//                                                        basis: the wasm's verifier.basis report
//                                                        ({kind, label, verified_from_genesis, …}),
//                                                        or null with an older wasm; on a resume from
//                                                        this browser's cache or another tab's state
//                                                        {kind: "self_verified", via: "cache" | "tab", …}.
//                                                        resumed: {height, saved_at, via} or null.
//                                                        role: "solo" | "leader" | "follower". Sent again
//                                                        after a takeover.
//   { type: "progress", height, block_hash, state_root, tip,
//     verified: [[height, block_hash, state_root, tx_count], ...],
//     blocks: [{ height, block_hash, txs: [card fields from the replay] }], resumed? }
//                                                        verified/blocks: blocks this worker's wasm
//                                                        applied. resumed: true on the one sent right
//                                                        after a resume: just the checkpoint block
//                                                        ([height, block_hash, state_root, null]:
//                                                        its tx count is not known), no cards
//   { type: "fault", fault, height, reason, evidence, evidence_json, verdict }
//                                                        sequencer fault with evidence checked against
//                                                        this genesis (verdict.genesis); the worker stops.
//                                                        evidence_json is the exact JSON to save (u64s intact)
//   { type: "node_fault", fault, height, reason }         the node served something wrong; retried
//   { type: "anchors", match, total, ahead, bad_sig, foreign, unknown, mismatch: [heights] }
//                                                        unknown: validly signed for a height the
//                                                        replay holds no checkpoint for (below a
//                                                        checkpoint start): neither match nor mismatch
//   { type: "cache", event, height?, saved_at?, bytes?, removed?, reason? }
//                                                        event: resumed | saved | refused | invalidated |
//                                                        too_big | unavailable | error
//   { type: "tab", event: "refused", reason }            a state handed over on the tabs' channel that
//                                                        the wasm refused (this tab waits for another)
//   { type: "role", role: "leader" | "follower", takeover? }
//   { type: "stopped", saved }                           saved: the height saved on stop, or null
//   { type: "forgotten", genesis, removed }
//   { type: "error", message, transient? }

const PAGE = 500;
const POLL_MS = 3000;
// At most this many pages per sync pass, so a node that keeps answering with
// full pages (or ignores `from`) cannot keep the worker spinning.
const MAX_PAGES_PER_SYNC = 40;
// Largest checkpoint state the worker fetches (JSON bytes).
const MAX_SNAPSHOT_BYTES = 64 * 1024 * 1024;

// ---- browser storage for this browser's own verified checkpoints.
// How much a public page may keep in a visitor's browser is Mike's call
// (Town Network "needs Mike"); CACHE_MAX_BYTES is the one constant to change,
// for everything this origin keeps in the "pointcast-chain" database.
// Counted in JSON characters.
const CACHE_MAX_BYTES = 50 * 1024 * 1024;
// Kept back from that for the explorer's outbox of signed txs (index.html
// OUTBOX_MAX_BYTES, the same number); checkpoints get the rest.
const OUTBOX_RESERVE_BYTES = 1024 * 1024;
// Newest checkpoints kept per chain (genesis + verifier code).
const CACHE_MAX_CHECKPOINTS = 3;
// Blocks of this worker's own replay between saves (and one on stop).
const CACHE_SAVE_EVERY = 1000;
// A storage call that has not answered by then counts as no storage.
const IDB_TIMEOUT_MS = 5000;
// Shared with index.html's offline banner and outbox (same origin, same database).
const DB_NAME = "pointcast-chain";
const DB_VERSION = 1;
const CP_STORE = "checkpoints";
const OUTBOX_STORE = "outbox";
const SNAPSHOT_FORMAT = "pointcast-chain/snapshot/v1";

// ---- tab sharing (BroadcastChannel election, used where Web Locks are not)
const BEAT_MS = 1000;
const LEADER_TIMEOUT_MS = 4000;
const CLAIM_MS = 400;
// A follower asks the leader for its state again at most this often, and a
// leader sends its state (a full snapshot) at most this often, whoever asks.
const RESYNC_MIN_MS = 2000;
const STATE_MIN_MS = 1000;
// Relayed batches a follower holds while it waits for the leader's state.
const PENDING_BATCHES_MAX = 64;
// ---- waking early
const WAKE_MIN_MS = 1000;
const WAKE_MAX_ERRORS = 5;

let api = "", v = null, params = null, stopped = false, halted = false, tipSeen = 0;
// verify.js's lossless parseJson/stringifyJson, set once it is imported.
let json = null;
// fetch, postMessage, timers and storage, captured from the global scope when
// a message arrives (one worker per scope in a browser; the tests run two).
let env = null;
let started = false, startMsg = null, wasmSha = "", workerSha = "", verifyJsSha = "", genesisPin = null;
// Cache state.
let useCache = false, cacheMax = CACHE_MAX_BYTES - OUTBOX_RESERVE_BYTES, saveEvery = CACHE_SAVE_EVERY;
let origin = null, resumed = null, readyBasis = null, lastHeader = null, lastSavedHeight = 0, keysChain = false;
let keyProofBlocks = [];
// True once this worker's verifier holds a state it verified (a genesis
// start, a cache resume, a handover the wasm accepted, its own replay).
let synced = false;
// Tab state.
let role = "solo", chan = null, myId = "", tabKey = "", leaderId = null, lastBeat = 0;
let lockAbort = null, leaderRelease = null, beatTimer = null, watchTimer = null, claimTimer = null;
let claiming = false, betterClaim = false, leading = false;
let pendingBatches = [], needSync = false, lastResync = 0, stateTimer = null, lastState = 0;
// What a leader hands a tab that joins late, besides its state: the raw
// anchor list and the evidence of a fault it found (each re-checked there).
let lastAnchorsJson = null, faultEvidenceJson = null;
// Wake state.
let es = null, wakeResolve = null, woken = false, lastWake = 0, wakeErrors = 0, wakeOpenedAt = 0, wakeGaveUp = false;

function captureEnv() {
  const g = globalThis;
  let idb = null;
  try { idb = g.indexedDB || null; } catch { idb = null; } // a SecurityError in some contexts
  return {
    fetch: g.fetch.bind(g),
    post: g.postMessage.bind(g),
    setTimeout: g.setTimeout.bind(g),
    clearTimeout: g.clearTimeout.bind(g),
    idb,
    Channel: typeof g.BroadcastChannel === "function" ? g.BroadcastChannel : null,
    locks: (g.navigator && g.navigator.locks && typeof g.navigator.locks.request === "function") ? g.navigator.locks : null,
    EventSource: typeof g.EventSource === "function" ? g.EventSource : null,
  };
}

const say = (m) => {
  env.post(m);
  // Display-only notes reach follower tabs as notes; nothing they could take
  // for verified data (progress, anchors, faults are re-checked there).
  if (role === "leader" && (m.type === "node_fault" || (m.type === "error" && m.transient))) tabSend({ t: "note", m });
};

// Everything fetched here goes into the wasm, so it is parsed losslessly:
// r.json() would round every u64 above 2^53 and break honest blocks.
async function getJson(path) {
  const r = await env.fetch(api + path, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return json.parseJson(await r.text());
}

const isRotationBlock = (b) => !!(b && Array.isArray(b.txs) && b.txs.some((t) => t && t.tx && t.tx.type === "rotate_sequencer"));

// Push one batch. Returns "ok", "stop" (sequencer fault: reported, worker
// stops) or a node-fault reply (not yet reported; the caller retries).
function push(blocks) {
  if (!blocks.length) return "ok";
  // The wasm answers the blocks in order and stops at the first fault, so its
  // i-th checkpoint is blocks[i]. A height at or below the replay's tip (the
  // poll's one-block overlap, or a node repeating a height) is answered on
  // its HEADER alone: that body was never checked, so it is not shown,
  // counted, kept or relayed. Only strictly new heights are.
  let top = Number(v.call("verifier.status").height);
  const r = v.call("verifier.push", { blocks });
  if (r.checkpoints.length) {
    const last = r.checkpoints[r.checkpoints.length - 1];
    const fresh = [];
    r.checkpoints.forEach((c, i) => {
      const b = blocks[i];
      const h = Number(c.height);
      if (!b || !b.header || Number(b.header.height) !== h || h <= top) return;
      top = h;
      fresh.push([c, b]);
    });
    for (const [c, b] of fresh) {
      if (keysChain && isRotationBlock(b) && !keyProofBlocks.some((k) => Number(k.header.height) === Number(c.height))) keyProofBlocks.push(b);
    }
    if (fresh.length) lastHeader = fresh[fresh.length - 1][1].header;
    const verified = fresh.map(([c, b]) => [c.height, c.block_hash, c.state_root, Array.isArray(b.txs) ? b.txs.length : 0]);
    say({
      type: "progress",
      height: r.height,
      block_hash: last.block_hash,
      state_root: last.state_root,
      verified,
      blocks: r.blocks || [],
      tip: tipSeen,
    });
    // Follower tabs push these same blocks through their own wasm.
    if (role === "leader" && fresh.length) tabSend({ t: "blocks", blocks_json: json.stringifyJson(fresh.map(([, b]) => b)) });
  }
  if (!r.fault) return "ok";
  if (r.sequencer_fault && r.evidence) {
    // Check the evidence exactly as `pointcast-node evidence check` would.
    let check = null;
    try { check = v.call("evidence.check", { evidence: r.evidence, params }); } catch {}
    if (check && check.valid) {
      halted = true;
      const evidence_json = json.stringifyJson(r.evidence, 2);
      say({ type: "fault", fault: r.fault, height: r.at_height, reason: r.reason, evidence: r.evidence, evidence_json, verdict: check.verdict });
      // Follower tabs check the evidence themselves before they show it.
      faultEvidenceJson = evidence_json;
      if (role === "leader") tabSend({ t: "fault", evidence_json });
      return "stop";
    }
  }
  return r;
}

// The node served something that does not extend the replay (unsealed or
// edited body, a gap, another branch). Ask once for exactly the next height;
// if that fails too, report it and try again next poll.
async function recover(fault) {
  const want = v.call("verifier.status").height + 1;
  try {
    const block = await getJson(`/raw/block/${want}`);
    const r = push([block]);
    if (r === "ok" || r === "stop") return r;
    fault = r;
  } catch (e) {
    if (fault.fault === "out_of_order") fault = { ...fault, reason: `${fault.reason}; /raw/block/${want}: ${e.message || e}` };
  }
  say({ type: "node_fault", fault: fault.fault, height: fault.at_height, reason: fault.reason });
  return "retry";
}

async function syncOnce() {
  let height = v.call("verifier.status").height;
  // Overlap one block so a re-sealed tip (equivocation) is noticed.
  let from = Math.max(1, height);
  for (let pages = 0; pages < MAX_PAGES_PER_SYNC; pages++) {
    const page = await getJson(`/raw/blocks?from=${from}&limit=${PAGE}`);
    if (stopped || !leading) return;
    tipSeen = Number(page.tip) || 0;
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    let r = push(blocks);
    if (r !== "ok" && r !== "stop") r = await recover(r);
    await maybeSave();
    if (r !== "ok") return;
    const before = height;
    height = v.call("verifier.status").height;
    if (blocks.length < PAGE || height >= tipSeen) return;
    if (height <= before) {
      // A full page that did not advance the replay: the node is not
      // honouring `from`. Stop this pass; the next poll tries again.
      say({ type: "node_fault", fault: "no_progress", height: height + 1, reason: `the node answered from=${from} with ${blocks.length} blocks that do not advance the replay` });
      return;
    }
    from = height + 1;
  }
}

// Tally signed anchors against this worker's own replay.
function tallyAnchors(list) {
  const out = { type: "anchors", match: 0, total: 0, ahead: 0, bad_sig: 0, foreign: 0, unknown: 0, mismatch: [] };
  for (const a of Array.isArray(list) ? list : []) {
    if (!a || typeof a !== "object" || !a.seq_sig || !a.payload) continue;
    const input = a.cast_body ? { body_hex: a.cast_body } : { payload: a.payload, seq_sig: a.seq_sig };
    let r;
    try { r = v.call("anchor.check", input); } catch { out.bad_sig++; continue; }
    if (r.result === "ahead") { out.ahead++; continue; }
    if (r.result === "bad_sig") { out.bad_sig++; continue; }
    if (r.result === "foreign") { out.foreign++; continue; }
    if (r.result === "before_checkpoint") { out.unknown++; continue; }
    out.total++;
    if (r.result === "match") out.match++;
    else out.mismatch.push(r.height);
  }
  return out;
}

async function checkAnchors() {
  let list;
  try { list = (await getJson("/anchors")).anchors || []; } catch { return; }
  env.post(tallyAnchors(list));
  // Follower tabs tally the same list against their own replay.
  lastAnchorsJson = json.stringifyJson(list);
  if (role === "leader") tabSend({ t: "anchors", list_json: lastAnchorsJson });
}

// The node's newest snapshot: the manifest, then every chunk (same node,
// bounded), joined and parsed losslessly. Checked by the wasm, not here.
async function fetchSnapshot() {
  const m = await getJson("/snapshot/latest");
  const total = Number(m.state_bytes), size = Number(m.chunk_bytes), n = Number(m.chunks);
  if (!(total >= 0 && total <= MAX_SNAPSHOT_BYTES && size > 0 && n === Math.ceil(total / size))) throw new Error("bad snapshot manifest");
  if (!/^\/snapshot\/[0-9]+\/chunk\/$/.test(String(m.chunk_path))) throw new Error("bad snapshot chunk path");
  const bytes = new Uint8Array(total);
  for (let i = 0; i < n; i++) {
    const r = await env.fetch(`${api}${m.chunk_path}${i}?chunk_bytes=${size}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`${r.status} snapshot chunk ${i}`);
    const part = new Uint8Array(await r.arrayBuffer());
    if (part.length !== Math.min(size, total - i * size)) throw new Error(`snapshot chunk ${i} has the wrong size`);
    bytes.set(part, i * size);
  }
  return { ...m, state: json.parseJson(new TextDecoder().decode(bytes)) };
}

function basisNow() {
  try { return v.call("verifier.basis"); } catch { return null; } // an older wasm has no basis op
}

// Sleep until the next poll, or until a wake event, whichever comes first.
function nap() {
  return new Promise((resolve) => {
    if (woken) { woken = false; return resolve(); }
    wakeResolve = resolve;
    env.setTimeout(() => { if (wakeResolve === resolve) { wakeResolve = null; resolve(); } }, POLL_MS);
  });
}

async function loop() {
  let lastAnchors = 0;
  while (!stopped && !halted && leading) {
    try {
      await syncOnce();
      if (!stopped && !halted && leading && Date.now() - lastAnchors > 15000) {
        lastAnchors = Date.now();
        await checkAnchors();
      }
    } catch (e) {
      say({ type: "error", message: `sync: ${e.message || e}`, transient: true });
    }
    if (stopped || halted) {
      // Still report the anchor tally once, for the status strip.
      await checkAnchors().catch(() => {});
      break;
    }
    if (!leading) break;
    await nap();
  }
}

// ------------------------------------------------------------ the cache

function withTimeout(p, ms, what) {
  return new Promise((resolve, reject) => {
    const t = env.setTimeout(() => reject(new Error(what)), ms);
    p.then((x) => { env.clearTimeout(t); resolve(x); }, (e) => { env.clearTimeout(t); reject(e); });
  });
}

function idbOpen() {
  return withTimeout(new Promise((resolve, reject) => {
    let req;
    try { req = env.idb.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of [CP_STORE, OUTBOX_STORE]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB would not open"));
  }), IDB_TIMEOUT_MS, "IndexedDB did not answer");
}

// One transaction on the checkpoint store. `fn(store, done)` issues requests;
// the transaction's result is whatever was passed to `done`.
async function idbRun(mode, fn) {
  const db = await idbOpen();
  try {
    return await withTimeout(new Promise((resolve, reject) => {
      let out;
      const tx = db.transaction(CP_STORE, mode);
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
      fn(tx.objectStore(CP_STORE), (x) => { out = x; });
    }), IDB_TIMEOUT_MS, "IndexedDB did not answer");
  } finally {
    try { db.close(); } catch {}
  }
}

const idbAll = () => idbRun("readonly", (s, done) => {
  const req = s.getAll();
  req.onsuccess = () => done(Array.isArray(req.result) ? req.result : []);
});

const idbWrite = (deletes, put) => idbRun("readwrite", (s) => {
  for (const id of deletes) s.delete(id);
  if (put) s.put(put, put.id);
});

const validRecord = (r) => !!(r && typeof r === "object" && typeof r.id === "string" && typeof r.genesis === "string"
  && typeof r.wasm_sha256 === "string" && Number.isSafeInteger(r.height) && r.height > 0
  && typeof r.state_json === "string" && typeof r.header_json === "string");
// What an entry really takes, from its strings (never its own `bytes` field).
const strLen = (x) => (typeof x === "string" ? x.length : 0);
const recBytes = (r) => (r && typeof r === "object" ? strLen(r.state_json) + strLen(r.header_json) + strLen(r.key_proof_json) + strLen(r.recent_json) : 0);
// Saved by exactly the verifier code running now (the wasm, this worker, verify.js).
const sameCode = (r) => r.wasm_sha256 === wasmSha && (r.worker_sha256 || "") === workerSha && (r.verify_js_sha256 || "") === verifyJsSha;

function cacheEvent(event, extra = {}) {
  env.post({ type: "cache", event, ...extra });
}

// The newest-first entries this chain can resume from. Entries of this genesis
// saved by other verifier code (or malformed) are deleted here: new code
// invalidates every checkpoint the old code made.
async function cacheCandidates() {
  const all = await idbAll();
  const doomed = all.filter((r) => !validRecord(r) || (r.genesis === genesisPin && !sameCode(r))).map((r) => (r && r.id) || null).filter((id) => typeof id === "string");
  if (doomed.length) {
    await idbWrite(doomed, null);
    cacheEvent("invalidated", { removed: doomed.length, reason: "saved by other verifier code (or unreadable)" });
  }
  return all.filter((r) => validRecord(r) && r.genesis === genesisPin && sameCode(r)).sort((a, b) => b.height - a.height);
}

// "Verified in this browser earlier": the tier of a state the wasm re-checked
// (seal, key proof, state root) but whose replay below it this run did not
// do. Never green, never "verified_from_genesis", whatever the entry says.
function selfBasis(via, height, init, extra = {}) {
  return {
    kind: "self_verified",
    tier: "self_verified",
    via,
    label: via === "tab"
      ? `from another tab's replay at #${height} (this tab re-checked its seal and state root)`
      : `resumed from your checkpoint #${height} (verified in this browser earlier)`,
    verified_from_genesis: false,
    verified_locally: true,
    height: Number(init.height),
    block_hash: init.block_hash,
    state_root: init.state_root,
    trusts: `${via === "tab" ? "another tab of this browser" : "this browser's storage"} for the replay below #${height} (any script on this site could have written it); the wasm re-checked the sequencer's seal and the state root`,
    ...extra,
  };
}

// After a resume, the page learns only what the wasm just re-checked: the
// checkpoint block's hash and root (its tx count is unknown: null).
function resumedTail(init) {
  return [[Number(init.height), init.block_hash, init.state_root, null]];
}

// Resume from this browser's newest usable checkpoint of this chain, or null.
async function resumeFromCache() {
  let list;
  try { list = await cacheCandidates(); } catch (e) {
    useCache = false;
    cacheEvent("unavailable", { reason: String((e && e.message) || e) });
    return null;
  }
  for (const rec of list) {
    try {
      const snapshot = { format: SNAPSHOT_FORMAT, genesis_hash: genesisPin, header: json.parseJson(rec.header_json), state: json.parseJson(rec.state_json) };
      let kp = null;
      if (keysChain) {
        kp = typeof rec.key_proof_json === "string" ? json.parseJson(rec.key_proof_json) : { blocks: [] };
        snapshot.key_proof = kp;
      }
      const init = v.call("verifier.from_checkpoint", { params, genesis: genesisPin, snapshot });
      if (Number(init.height) !== rec.height || (rec.block_hash && init.block_hash !== rec.block_hash)) {
        throw new Error(`the entry says #${rec.height}, the checkpoint is #${init.height}`);
      }
      keyProofBlocks = kp && Array.isArray(kp.blocks) ? kp.blocks : [];
      lastHeader = snapshot.header;
      lastSavedHeight = rec.height;
      origin = rec.origin && typeof rec.origin === "object" ? rec.origin : null;
      resumed = { height: rec.height, saved_at: rec.saved_at, via: "cache" };
      cacheEvent("resumed", { height: rec.height, saved_at: rec.saved_at });
      return { init, basis: selfBasis("cache", rec.height, init, { saved_at: rec.saved_at, rests_on: origin }) };
    } catch (e) {
      // Refused by the wasm (tampered, foreign, wrong seal...) or unreadable:
      // never used again. The next entry, or genesis, takes over.
      try { await idbWrite([rec.id], null); } catch {}
      cacheEvent("refused", { height: rec.height, reason: String((e && e.message) || e) });
    }
  }
  return null;
}

// Save this replay's state at its tip as a checkpoint of this chain.
async function saveCheckpoint() {
  if (!useCache || !v || !genesisPin || !synced) return null;
  let st;
  try { st = v.call("verifier.status"); } catch { return null; }
  const h = Number(st.height);
  if (!(h > 0) || h === lastSavedHeight || !lastHeader || Number(lastHeader.height) !== h) return null;
  let state_json;
  try { state_json = json.stringifyJson(v.call("verifier.state").state); } catch { return null; } // an older wasm
  const header_json = json.stringifyJson(lastHeader);
  const key_proof_json = keysChain ? json.stringifyJson({ blocks: keyProofBlocks }) : null;
  const rec = {
    v: 2,
    id: `${genesisPin}:${wasmSha}:${workerSha.slice(0, 16)}:${verifyJsSha.slice(0, 16)}:${String(h).padStart(20, "0")}`,
    genesis: genesisPin,
    wasm_sha256: wasmSha,
    worker_sha256: workerSha,
    verify_js_sha256: verifyJsSha,
    api,
    height: h,
    block_hash: st.block_hash,
    state_root: st.state_root,
    header_json,
    state_json,
    key_proof_json,
    // How the run that saved it started: shown as `rests_on`, never trusted.
    origin,
    saved_at: Date.now(),
  };
  rec.bytes = recBytes(rec);
  if (rec.bytes > cacheMax) {
    lastSavedHeight = h;
    cacheEvent("too_big", { height: h, bytes: rec.bytes, reason: `over the ${cacheMax}-character budget for this browser` });
    return null;
  }
  try {
    const all = await idbAll();
    const doomed = new Set();
    for (const r of all) {
      if (!validRecord(r)) { if (r && typeof r.id === "string") doomed.add(r.id); continue; }
      if (r.id === rec.id) continue;
      // New verifier code invalidates this chain's old entries; a new
      // genesis at the same node retires the old chain's.
      if ((r.genesis === rec.genesis && !sameCode(r)) || (r.api === rec.api && r.genesis !== rec.genesis)) doomed.add(r.id);
    }
    const kept = all.filter((r) => validRecord(r) && r.id !== rec.id && !doomed.has(r.id));
    kept.filter((r) => r.genesis === rec.genesis && sameCode(r)).sort((a, b) => b.height - a.height)
      .slice(CACHE_MAX_CHECKPOINTS - 1).forEach((r) => doomed.add(r.id));
    // Then the budget, oldest first, across every chain this browser keeps.
    const rest = kept.filter((r) => !doomed.has(r.id)).sort((a, b) => (Number(a.saved_at) || 0) - (Number(b.saved_at) || 0));
    let total = rec.bytes + rest.reduce((n, r) => n + recBytes(r), 0);
    for (const r of rest) {
      if (total <= cacheMax) break;
      doomed.add(r.id);
      total -= recBytes(r);
    }
    await idbWrite([...doomed], rec);
    lastSavedHeight = h;
    cacheEvent("saved", { height: h, saved_at: rec.saved_at, bytes: rec.bytes });
    return h;
  } catch (e) {
    cacheEvent("error", { height: h, reason: String((e && e.message) || e) });
    return null;
  }
}

async function maybeSave() {
  if (!useCache || role === "follower") return;
  let h;
  try { h = Number(v.call("verifier.status").height); } catch { return; }
  if (h - lastSavedHeight >= saveEvery) await saveCheckpoint();
}

async function forgetChain(genesis) {
  if (!env.idb) return 0;
  const all = await idbAll();
  const ids = all.filter((r) => r && typeof r.id === "string" && r.genesis === genesis).map((r) => r.id);
  if (ids.length) await idbWrite(ids, null);
  return ids.length;
}

// ------------------------------------------------------------ starting

async function initVerifier() {
  resumed = null;
  if (startMsg.checkpoint) {
    const snapshot = startMsg.checkpoint === "latest" ? await fetchSnapshot() : startMsg.checkpoint;
    const init = v.call("verifier.from_checkpoint", { params, genesis: startMsg.genesis || null, snapshot });
    origin = init.basis || basisNow();
    if (keysChain && snapshot && snapshot.key_proof && Array.isArray(snapshot.key_proof.blocks)) keyProofBlocks = snapshot.key_proof.blocks.slice();
    if (snapshot && snapshot.header) lastHeader = snapshot.header;
    return { init, basis: origin };
  }
  if (useCache) {
    const got = await resumeFromCache();
    if (got) return got;
  }
  return genesisStart();
}

function genesisStart() {
  const init = v.call("verifier.new", { params, genesis: startMsg.genesis || null });
  keyProofBlocks = [];
  lastHeader = null;
  lastSavedHeight = 0;
  origin = basisNow() || { kind: "genesis", label: "verified from genesis", verified_from_genesis: true };
  return { init, basis: init.basis || basisNow() };
}

// Run the sync: solo, or as the tabs' leader (first start or a takeover).
async function lead(takeover) {
  leading = true;
  if (role !== "solo") {
    role = "leader";
    env.post({ type: "role", role: "leader", takeover: !!takeover });
    startBeats();
  }
  const carryOn = synced;
  try {
    let init, basis;
    if (carryOn) {
      // A follower that took over carries on from the state it verified.
      init = v.call("verifier.status");
      basis = readyBasis;
    } else {
      ({ init, basis } = await initVerifier());
      if (stopped) return;
      synced = true;
      needSync = false;
    }
    readyBasis = basis;
    env.post({ type: "ready", genesis_hash: init.genesis_hash, chain_id: init.chain_id, wasm_sha256: wasmSha, basis, resumed, role });
    // Tabs that joined while this one was starting get its state now.
    if (role === "leader") { lastState = Date.now(); tabSend(stateMsg("*")); }
    if (resumed && !carryOn) {
      // The page learns the resumed height (and badges the checkpoint
      // block) now, not at the next new block.
      const st = v.call("verifier.status");
      env.post({ type: "progress", height: st.height, block_hash: st.block_hash, state_root: st.state_root, verified: resumedTail(st), blocks: [], tip: tipSeen, resumed: true });
    }
    openWake();
    loop();
  } catch (e) {
    say({ type: "error", message: e.message || String(e) });
    stop(false);
  }
}

onmessage = async (ev) => {
  const msg = ev.data || {};
  if (msg.stop) { if (env) await stop(msg.save !== false); else stopped = true; return; }
  if (msg.forget) {
    if (!env) env = captureEnv();
    const g = String(msg.genesis || genesisPin || "").toLowerCase();
    if (g === genesisPin) {
      useCache = false; // this session saves nothing more
      if (role === "follower") tabSend({ t: "forget" });
    }
    let removed = 0;
    try { removed = await forgetChain(g); } catch {}
    env.post({ type: "forgotten", genesis: g, removed });
    return;
  }
  if (msg.save) { if (env && v && role !== "follower") await saveCheckpoint(); return; }
  if (started) return; // already running
  started = true;
  startMsg = msg;
  env = captureEnv();
  try {
    api = String(msg.api || "").replace(/\/$/, "");
    if (!msg.verifyJsUrl || !(msg.wasm instanceof ArrayBuffer) || !msg.wasmSha256) {
      throw new Error("start the worker with the page's pinned verify.js and wasm");
    }
    const { PointcastVerifier, sha256Hex, parseJson, stringifyJson } = await import(msg.verifyJsUrl);
    json = { parseJson, stringifyJson };
    const bytes = new Uint8Array(msg.wasm);
    // Defence in depth: the page already checked these bytes against its pin.
    const wasm_sha256 = await sha256Hex(bytes);
    if (wasm_sha256 !== msg.wasmSha256) throw new Error("verifier wasm does not match the pinned sha256");
    wasmSha = wasm_sha256;
    const hex64 = (x) => (typeof x === "string" && /^[0-9a-fA-F]{64}$/.test(x) ? x.toLowerCase() : "");
    workerSha = hex64(msg.workerSha256);
    verifyJsSha = hex64(msg.verifyJsSha256);
    v = await PointcastVerifier.load(bytes);
    let status;
    [params, status] = await Promise.all([getJson("/params"), getJson("/status")]);
    tipSeen = Number(status.height) || 0;
    keysChain = !!(params && params.launch && params.launch.keys !== undefined && params.launch.keys !== null);
    genesisPin = hex64(msg.genesis) || null;
    // A node checkpoint start is its own basis: the cache is not consulted.
    useCache = msg.cache === true && !msg.checkpoint && !!genesisPin;
    if (useCache && !env.idb) {
      useCache = false;
      cacheEvent("unavailable", { reason: "this browser gives the page no IndexedDB" });
    }
    if (Number.isSafeInteger(msg.cacheMaxBytes) && msg.cacheMaxBytes > 0) cacheMax = Math.min(CACHE_MAX_BYTES - OUTBOX_RESERVE_BYTES, msg.cacheMaxBytes);
    if (Number.isSafeInteger(msg.saveEvery) && msg.saveEvery > 0) saveEvery = msg.saveEvery;
    if (msg.share === true && genesisPin && env.Channel && !msg.checkpoint) joinTabs(msg.election === "channel" ? "channel" : "auto");
    else await lead(false);
  } catch (e) {
    stopped = true;
    say({ type: "error", message: e.message || String(e) });
  }
};

async function stop(save) {
  if (stopped && !leading && !chan) { env.post({ type: "stopped", saved: null }); return; }
  stopped = true;
  const wasLeading = leading;
  leading = false;
  closeWake();
  let saved = null;
  if (wasLeading && save) saved = await saveCheckpoint().catch(() => null);
  leaveTabs();
  env.post({ type: "stopped", saved });
}

// ------------------------------------------------------------ waking early

function openWake() {
  const url = typeof startMsg.wake === "string" ? startMsg.wake : "";
  if (!url || !env.EventSource || es || wakeGaveUp) return;
  let u;
  try { u = new URL(url); } catch { return; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return;
  try {
    es = new env.EventSource(u.toString());
    const poke = () => wake();
    es.onmessage = poke;
    for (const name of ["block", "tip", "hello"]) es.addEventListener(name, poke);
    es.onopen = () => { wakeOpenedAt = Date.now(); };
    // The browser reconnects by itself, at a pace the server may set: after
    // WAKE_MAX_ERRORS failures this worker stops listening for good (a
    // connection that stayed up a minute earns its budget back). The poll
    // goes on regardless.
    es.onerror = () => {
      if (!es) return;
      if (wakeOpenedAt && Date.now() - wakeOpenedAt > 60000) wakeErrors = 0;
      wakeOpenedAt = 0;
      if (++wakeErrors >= WAKE_MAX_ERRORS || es.readyState === 2) {
        wakeGaveUp = wakeErrors >= WAKE_MAX_ERRORS;
        try { es.close(); } catch {}
        es = null;
      }
    };
  } catch { es = null; }
}

function wake() {
  const now = Date.now();
  if (now - lastWake < WAKE_MIN_MS) return;
  lastWake = now;
  if (wakeResolve) { const r = wakeResolve; wakeResolve = null; r(); } else woken = true;
}

function closeWake() {
  if (es) { try { es.close(); } catch {} es = null; }
  if (wakeResolve) { const r = wakeResolve; wakeResolve = null; r(); }
}

// ------------------------------------------------------------ tab sharing
//
// Channel messages carry {t, key, from}. A leader sends: beat, bye, state
// (its state for joining tabs, at most once a second: {to: "*", cp,
// anchors_json, fault_json}), blocks
// (the blocks its wasm just applied), anchors (the raw list), fault (the
// evidence it checked) and note (node_fault / transient error text, shown as
// such). A follower sends hello, claim and forget. Any script on this origin
// can post any of them, so a follower re-checks everything it shows with its
// own wasm, and only takes a state while it has none (or is behind).

function randomId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function tabSend(m) {
  if (!chan) return;
  try { chan.postMessage({ ...m, key: tabKey, from: myId }); } catch {}
}

// The leader's state for a joining tab, as a snapshot its wasm re-checks.
function handover() {
  if (!v || !synced) return null;
  let st;
  try { st = v.call("verifier.status"); } catch { return null; }
  const h = Number(st.height);
  if (h === 0) return { height: 0 }; // at genesis: the tab starts from genesis itself
  if (!lastHeader || Number(lastHeader.height) !== h) return null;
  let state;
  try { state = v.call("verifier.state").state; } catch { return null; } // an older wasm
  return {
    height: h,
    header_json: json.stringifyJson(lastHeader),
    state_json: json.stringifyJson(state),
    key_proof_json: keysChain ? json.stringifyJson({ blocks: keyProofBlocks }) : null,
  };
}

function stateMsg(to) {
  return { t: "state", to, cp: handover(), anchors_json: lastAnchorsJson, fault_json: faultEvidenceJson };
}

// Broadcast this leader's state to every tab still waiting for one, at most
// once per STATE_MIN_MS (a burst of hellos, honest or not, costs one).
function sendState() {
  if (role !== "leader") return;
  const wait = lastState + STATE_MIN_MS - Date.now();
  if (wait > 0) {
    if (!stateTimer) stateTimer = env.setTimeout(() => { stateTimer = null; sendState(); }, wait);
    return;
  }
  lastState = Date.now();
  tabSend(stateMsg("*"));
}

function joinTabs(mode) {
  myId = randomId();
  tabKey = `${wasmSha}|${workerSha}|${verifyJsSha}|${api}`;
  role = "follower";
  chan = new env.Channel(`pcc:${genesisPin}`);
  chan.onmessage = (e) => onTab(e.data);
  if (mode !== "channel" && env.locks) {
    lockAbort = new AbortController();
    env.locks.request(`pcc:${genesisPin}|${tabKey}`, { signal: lockAbort.signal }, () => new Promise((release) => {
      leaderRelease = release;
      if (stopped) { release(); return; }
      // Granted at once (no other tab) or after the leader let go (a takeover).
      lead(leaderId !== null);
    })).catch(() => {});
    tabSend({ t: "hello" });
  } else {
    tabSend({ t: "hello" });
    claimTimer = env.setTimeout(() => { claimTimer = null; if (!leaderId) claim(); }, CLAIM_MS);
    watchTimer = env.setTimeout(watch, BEAT_MS);
  }
}

// BroadcastChannel election: claim, wait CLAIM_MS, lead unless a live leader
// or a claimant with a smaller id spoke up in the meantime.
function claim() {
  if (stopped || role !== "follower" || claiming) return;
  claiming = true;
  betterClaim = false;
  tabSend({ t: "claim" });
  env.setTimeout(() => {
    claiming = false;
    if (stopped || role !== "follower") return;
    if (betterClaim || (leaderId && Date.now() - lastBeat < LEADER_TIMEOUT_MS)) return;
    lead(leaderId !== null);
  }, CLAIM_MS);
}

function watch() {
  watchTimer = null;
  if (stopped || !chan || lockAbort) return;
  if (role === "follower" && !claiming && (!leaderId || Date.now() - lastBeat > LEADER_TIMEOUT_MS)) claim();
  watchTimer = env.setTimeout(watch, BEAT_MS);
}

function startBeats() {
  if (!chan || lockAbort) return; // Web Locks need no heartbeat
  const beat = () => {
    beatTimer = null;
    if (stopped || role !== "leader" || !chan) return;
    tabSend({ t: "beat" });
    beatTimer = env.setTimeout(beat, BEAT_MS);
  };
  beat();
}

// Ask the leader for its state again (behind, a gap, a batch that does not
// extend this replay), at most every RESYNC_MIN_MS.
function resync() {
  needSync = true;
  const now = Date.now();
  if (now - lastResync < RESYNC_MIN_MS) return;
  lastResync = now;
  tabSend({ t: "hello" });
}

// A state on the channel: taken only through verifier.from_checkpoint (the
// wasm re-checks the seal, key proof and state root), only while this tab
// has none, or is behind it.
function acceptState(cp) {
  if (role !== "follower" || halted || !cp || typeof cp !== "object") return;
  const h = Number(cp.height);
  if (!Number.isSafeInteger(h) || h < 0) return;
  let mine = -1;
  if (synced) {
    if (!needSync) return;
    try { mine = Number(v.call("verifier.status").height); } catch { return; }
    if (h <= mine) return;
  }
  let init, basis;
  try {
    if (h === 0) {
      ({ init, basis } = genesisStart());
    } else {
      if (typeof cp.header_json !== "string" || typeof cp.state_json !== "string") return;
      const snapshot = { format: SNAPSHOT_FORMAT, genesis_hash: genesisPin, header: json.parseJson(cp.header_json), state: json.parseJson(cp.state_json) };
      let kp = null;
      if (keysChain) {
        kp = typeof cp.key_proof_json === "string" ? json.parseJson(cp.key_proof_json) : { blocks: [] };
        snapshot.key_proof = kp;
      }
      init = v.call("verifier.from_checkpoint", { params, genesis: genesisPin, snapshot });
      if (Number(init.height) !== h) throw new Error(`the state says #${h}, the checkpoint is #${init.height}`);
      keyProofBlocks = kp && Array.isArray(kp.blocks) ? kp.blocks : [];
      lastHeader = snapshot.header;
      lastSavedHeight = 0;
      basis = selfBasis("tab", h, init);
      origin = basis;
      resumed = { height: h, saved_at: Date.now(), via: "tab" };
    }
  } catch (e) {
    env.post({ type: "tab", event: "refused", reason: String((e && e.message) || e) });
    return;
  }
  synced = true;
  needSync = false;
  readyBasis = basis;
  const st = v.call("verifier.status");
  env.post({ type: "ready", genesis_hash: st.genesis_hash, chain_id: st.chain_id, wasm_sha256: wasmSha, basis, resumed: h > 0 ? resumed : null, role: "follower" });
  if (h > 0) env.post({ type: "progress", height: st.height, block_hash: st.block_hash, state_root: st.state_root, verified: resumedTail(st), blocks: [], tip: tipSeen, resumed: true });
  const queued = pendingBatches;
  pendingBatches = [];
  for (const text of queued) onBlocks(text);
}

// Blocks a leader relayed: pushed through this tab's own wasm, like a fetch.
function onBlocks(text) {
  if (halted || typeof text !== "string") return;
  if (!synced) {
    pendingBatches.push(text);
    if (pendingBatches.length > PENDING_BATCHES_MAX) pendingBatches.shift();
    return;
  }
  let blocks;
  try { blocks = json.parseJson(text); } catch { return; }
  if (!Array.isArray(blocks)) return;
  let h;
  try { h = Number(v.call("verifier.status").height); } catch { return; }
  // Heights below this replay's tip were verified already; the tip itself is
  // pushed again, so another sealed block there is caught.
  const next = blocks.filter((b) => b && b.header && Number(b.header.height) >= h);
  if (!next.length) return;
  if (Number(next[0].header.height) > h + 1) { resync(); return; }
  let r;
  try { r = push(next); } catch { r = null; }
  if (r === "ok") needSync = false;
  else if (r !== "stop") resync();
}

// Fault evidence a leader relayed: shown only if this tab's evidence.check
// accepts it for this genesis (valid evidence is proof, whoever carried it).
function onFault(text) {
  if (halted || typeof text !== "string") return;
  let evidence, check;
  try {
    evidence = json.parseJson(text);
    check = v.call("evidence.check", { evidence, params });
  } catch { return; }
  if (!check || !check.valid || !check.verdict || String(check.verdict.genesis || "").toLowerCase() !== genesisPin) return;
  halted = true;
  faultEvidenceJson = text;
  const vd = check.verdict;
  env.post({ type: "fault", fault: String(vd.kind || "fault"), height: Number(vd.height) || 0, reason: String(vd.detail || vd.kind || ""), evidence, evidence_json: json.stringifyJson(evidence, 2), verdict: vd, checked_here: true });
}

function onAnchors(text) {
  if (!synced || typeof text !== "string") return;
  let list;
  try { list = json.parseJson(text); } catch { return; }
  env.post(tallyAnchors(list));
}

// Notes a leader relayed: display text only, never a stop.
function onNote(m) {
  if (!m || typeof m !== "object") return;
  if (m.type === "node_fault") {
    const known = ["garbage", "out_of_order", "fork", "no_progress"];
    env.post({ type: "node_fault", fault: known.includes(m.fault) ? m.fault : "garbage", height: Number(m.height) || 0, reason: String(m.reason ?? "").slice(0, 500) });
  } else if (m.type === "error") {
    env.post({ type: "error", message: String(m.message ?? "").slice(0, 500), transient: true });
  }
}

function onTab(d) {
  if (!d || typeof d !== "object" || d.key !== tabKey || d.from === myId || stopped) return;
  if (role === "leader") {
    if (d.t === "hello") sendState();
    else if (d.t === "claim" && !lockAbort) tabSend({ t: "beat" });
    else if (d.t === "forget") { useCache = false; forgetChain(genesisPin).catch(() => {}); }
    else if (d.t === "beat" && !lockAbort && String(d.from) < myId) stepDown(d.from);
    return;
  }
  // A follower: track who leads (for the election), re-check what it sends.
  if (d.t === "beat" || d.t === "state" || d.t === "blocks" || d.t === "anchors" || d.t === "fault" || d.t === "note") {
    if (leaderId !== d.from) leaderId = d.from;
    lastBeat = Date.now();
  }
  if (d.t === "claim" && String(d.from) < myId) betterClaim = true;
  if (d.t === "bye" && d.from === leaderId) {
    lastBeat = 0;
    if (!lockAbort) claim(); // with Web Locks the lock itself hands over
    return;
  }
  if (d.t === "state" && (d.to === myId || d.to === "*")) {
    acceptState(d.cp);
    if (typeof d.fault_json === "string") onFault(d.fault_json);
    if (typeof d.anchors_json === "string") onAnchors(d.anchors_json);
    return;
  }
  if (d.t === "blocks") onBlocks(d.blocks_json);
  else if (d.t === "fault") onFault(d.evidence_json);
  else if (d.t === "anchors") onAnchors(d.list_json);
  else if (d.t === "note") onNote(d.m);
}

// Two leaders (a split election): the one with the larger id hands over and
// follows, from the state it verified itself.
async function stepDown(to) {
  leading = false;
  role = "follower";
  leaderId = to;
  lastBeat = Date.now();
  for (const t of [beatTimer, stateTimer]) if (t) env.clearTimeout(t);
  beatTimer = stateTimer = null;
  closeWake();
  await saveCheckpoint().catch(() => null);
  env.post({ type: "role", role: "follower" });
  resync();
}

function leaveTabs() {
  for (const t of [beatTimer, watchTimer, claimTimer, stateTimer]) if (t) env.clearTimeout(t);
  beatTimer = watchTimer = claimTimer = stateTimer = null;
  if (chan) {
    try { if (role === "leader") tabSend({ t: "bye" }); } catch {}
    try { chan.close(); } catch {}
    chan = null;
  }
  if (lockAbort) { lockAbort.abort(); lockAbort = null; }
  if (leaderRelease) { const r = leaderRelease; leaderRelease = null; r(); }
}
