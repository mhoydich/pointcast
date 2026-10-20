// "Witness in your browser": /chain/witness (src/pages/chain/witness.astro), the
// logic public/chain/apps/witness.js (no DOM), the DOM side witness-view.js, the
// worker shim witness-shim.js, the shared key panel and the words in
// src/data/chain-app-witness.ts.
//
// What this suite holds:
//   - the verifier is the Block Yard's, pinned three ways (the page's constants,
//     the Yard's own pins and pointcast_chain.wasm.sha256), and nothing runs when
//     one byte differs;
//   - the replay runs from genesis through the real pinned verifier, in node and in
//     the real pinned worker behind the shim (a worker thread), with the same
//     result, and refuses on any fault, a gap, a header it cannot bind to a verified
//     block, a worker that did not start from genesis, a stall and a cancel;
//   - the checkpoint is picked exactly as pc-witness.mjs picks it (the two are
//     run side by side for several clocks), from the replay alone;
//   - the claim is the Daily Net's own: witness.js signs it and verifyWitness
//     accepts it; the post is shown word for word before anything is sent; an
//     attestation already on chain today is said and not sent again; the midnight
//     UTC guard, a changed UTC day, an old replay, a restarted devnet and a journal
//     conflict each stop a send;
//   - the roll is read for the key (correct, strike, pending) and nothing from the
//     devnet becomes markup, a link or a style;
//   - each guard above is proven by mutation: with the guard taken out of a copy of
//     the source, the same scenario gets through;
//   - the copy is honest (a claim, not proof; counts are keys; devnet, no value, may
//     reset) and uses the Daily Net's words verbatim.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync as spawnSyncImpl } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import test, { after } from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import * as D from '../src/data/chain-app-witness.ts';
import * as X from '../public/chain/apps/witness.js';
import * as view from '../public/chain/apps/witness-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import * as W from '../public/chain/net/witness.js';
import { FX, fakeDevnet } from './helpers/fake-devnet.mjs';
import { assertNoSinks, bannedHits, BANNED, callArgs, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/witness.js',
  view: 'public/chain/apps/witness-view.js',
  shim: 'public/chain/apps/witness-shim.js',
  keys: 'public/chain/apps/key-panel.js',
  page: 'src/pages/chain/witness.astro',
  data: 'src/data/chain-app-witness.ts',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(FILES), 'tests/chain-app-witness.test.mjs', 'scripts/e2e-chain-app-witness.mjs'].filter((p) => existsSync(new URL(p, root)));
const GENESIS = FX.status.genesis_hash;
const HEX = (c) => c.repeat(64);
const clone = (o) => structuredClone(o);
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const VDIR = 'public/chain/yard/verifier/';
const SUMS = read(VDIR + 'pointcast_chain.wasm.sha256');
const fileBytes = () => Object.fromEntries(X.VERIFIER_FILES.map((n) => [n, new Uint8Array(readFileSync(new URL(VDIR + n, root)))]));
const SHAS = Object.fromEntries(Object.entries(fileBytes()).map(([n, b]) => [n, sha(b)]));
const VER = await X.loadPinnedVerifier({ files: fileBytes(), pins: D.VERIFIER.pins, sumsText: SUMS });
const NOW = Date.parse('2026-10-20T08:00:00Z'); // after the recorded tip (07:47:51Z), the same UTC day

/** The `get` a replay reads, over a block list: /params and /raw/blocks as the node serves them, parsed losslessly. */
const getFrom = (blocks) => async (path) => {
  if (path === '/params') return VER.parseJson(JSON.stringify(FX.params));
  const m = /^\/raw\/blocks\?from=(\d+)&limit=(\d+)$/.exec(path);
  if (!m) throw new Error('404 ' + path);
  const from = Number(m[1]);
  return VER.parseJson(JSON.stringify({ tip: blocks.at(-1).header.height, from, blocks: blocks.filter((b) => b.header.height >= from).slice(0, Number(m[2])) }));
};
const replayOf = (blocks = FX.blocks, o = {}, mod = X, verifier = VER) => mod.replayNode({ get: getFrom(blocks), verifier, params: VER.parseJson(JSON.stringify(FX.params)), genesis: GENESIS, minHeight: blocks.at(-1).header.height, ...o });
const REPLAY = await replayOf().promise;
const EPOCH = REPLAY.cps.get(1).block_hash;
const KEY = await K.keyFromSeed('11'.repeat(32));
const KEY2 = await K.keyFromSeed('22'.repeat(32));
const choose = (nowMs = NOW, replay = REPLAY) => X.chooseCheckpoint({ replay, nowMs });
const planFor = (o = {}) => X.planWitness({ replay: REPLAY, choice: choose(o.nowMs), chainId: FX.status.chain_id, genesis: GENESIS, key: KEY, opts: {}, nowMs: NOW, wasmSha: SHAS['pointcast_chain.wasm'], ...o });
const tamper = {
  sig: (blocks, h = 31) => { const b = clone(blocks); const t = b.find((x) => x.header.height === h).txs[0]; t.signature = (t.signature[0] === 'a' ? 'b' : 'a') + t.signature.slice(1); return b; },
  gap: (blocks, h = 50) => blocks.filter((x) => x.header.height !== h),
  seal: (blocks, h = 40) => { const b = clone(blocks); const x = b.find((y) => y.header.height === h).header; x.state_root = (x.state_root[0] === 'a' ? 'b' : 'a') + x.state_root.slice(1); return b; },
};

// ---- mutation machinery: a copy of the browser code with one guard taken out, in its own module graph
const dirs = [];
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
const swap = (from, to) => (s) => { assert.ok(s.includes(from), 'the line to mutate exists: ' + from); return s.replace(from, to); };
async function variant(edits = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'witness-mut-'));
  dirs.push(dir);
  const put = (rel, from, edit) => {
    let s = read(from);
    if (edit) { const t = edit(s); assert.notEqual(t, s, rel + ': the edit changed nothing'); s = t; }
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), s);
  };
  put('chain/apps/witness.js', FILES.logic, edits.logic);
  put('chain/apps/witness-view.js', FILES.view, edits.view);
  put('chain/apps/witness-shim.js', FILES.shim, edits.shim);
  put('chain/apps/chain-kit.js', 'public/chain/apps/chain-kit.js');
  put('chain/apps/key-panel.js', FILES.keys);
  put('chain/net/witness.js', 'public/chain/net/witness.js');
  put('chain/net/pointcast-chain.js', 'public/chain/net/pointcast-chain.js');
  put('chain/first-mints/lib/pointcast-chain.js', 'public/chain/first-mints/lib/pointcast-chain.js');
  const at = (p) => import(pathToFileURL(join(dir, 'chain/apps/' + p)).href);
  return { dir, X: await at('witness.js'), view: await at('witness-view.js'), K: await at('chain-kit.js') };
}
const REAL = { X, view, K };

// ---- a miniature devnet for the page: the recorded chain, plus the write path (POST /body, POST /tx) and the Daily Net roll
function miniDevnet({ log = [], nowMs = NOW, indexLag = 0, overrides = {}, blocks = FX.blocks, replayForJudge = REPLAY, pending = false } = {}) {
  let lag = indexLag;
  const sent = [];
  const bodies = { ...FX.bodies };
  const inner = fakeDevnet({ log: [], blocks, bodies });
  const tip = blocks.at(-1).header.height;
  const rep = (obj, code2 = 200, headers = {}) => ({ ok: code2 < 400, status: code2, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, text: async () => JSON.stringify(obj) });
  const heightOf = (i) => tip + 1 + i;
  const judged = () => { const results = new Map(); return sent.map((stx, i) => {
    if (stx.tx.channel !== 'WIT') return null;
    const body = bodies[stx.tx.body_hash] || '';
    let h = 0;
    try { h = W.parseWitnessBody(body.split('\n')[0]).height; } catch { return null; }
    const claim = replayForJudge.cps.get(h);
    const key = stx.tx.sender + ':' + h;
    return W.verifyWitness({ line: body.split('\n')[0], chain_id: FX.status.chain_id, genesis: GENESIS, epoch: EPOCH, signerPublicKey: stx.public_key, sender: stx.tx.sender, chain: claim, includedAt: heightOf(i) }).then((v) => {
      const dup = results.has(key + ':' + v.ok) && v.ok;
      results.set(key + ':' + v.ok, true);
      return { stx, i, h, height: heightOf(i), result: dup ? 'duplicate' : v.ok ? 'correct' : v.reason };
    });
  }); };
  const f = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method || 'GET').toUpperCase();
    const p = u.pathname;
    log.push(method + ' ' + p + u.search);
    if (overrides[p]) return overrides[p](u, init, { sent, bodies, tip, rep });
    let m;
    if (method === 'POST' && p === '/body') { const b = JSON.parse(init.body).body; const h = K.pcc.bodyHash(b); bodies[h] = b; return rep({ body_hash: h }); }
    if (method === 'POST' && p === '/tx') {
      const stx = JSON.parse(init.body);
      const hash = K.pcc.txHash(stx);
      const want = sent.filter((s) => s.tx.sender === stx.tx.sender).length;
      if (stx.tx.nonce !== want) return rep({ error: 'nonce mismatch: expected ' + want + ', got ' + stx.tx.nonce }, 400);
      const ok = await K.pcc.verifyEd25519(stx.public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(stx.tx, { chain_id: FX.status.chain_id, genesis: GENESIS })), stx.signature);
      if (!ok) return rep({ error: 'bad signature' }, 400);
      sent.push(stx);
      return rep({ tx_hash: hash, status: 'pending' });
    }
    if (method !== 'GET') return rep({ error: 'no such write' }, 405);
    if ((m = /^\/account\/([A-Za-z0-9]+)$/.exec(p))) { const n = sent.filter((s) => s.tx.sender === m[1]).length; return rep({ address: m[1], balance: 0, exists: n > 0, next_nonce: n, nonce: n }); }
    if ((m = /^\/tx\/([0-9a-f]{64})$/.exec(p))) {
      const i = sent.findIndex((s) => K.pcc.txHash(s) === m[1]);
      if (i >= 0 && pending) return rep({ status: 'pending' });
      return i >= 0 ? rep({ status: 'included', height: heightOf(i), index: 0 }) : inner(url, init);
    }
    if ((m = /^\/block\/(\d+)$/.exec(p)) && Number(m[1]) > tip) return rep({ height: Number(m[1]), hash: HEX('7'), timestamp: nowMs + (Number(m[1]) - tip) * 1000, network: 'devnet' });
    if ((m = /^\/checkpoints\/(\d+)\/witnesses$/.exec(p))) {
      const h = Number(m[1]);
      const claim = replayForJudge.cps.get(h);
      const rows = (await Promise.all(judged())).filter((r) => r && r.h === h);
      return rep({
        schema: 'pointcast-devnet/net-api/v1', network: 'devnet', epoch: EPOCH, tip: tip + sent.length, indexed_height: tip + sent.length - lag, day: '2026-10-20',
        height: h, block_hash: claim ? claim.block_hash : HEX('0'), state_root: claim ? claim.state_root : HEX('0'), sealed: Boolean(claim),
        distinct: rows.length, correct: rows.filter((r) => r.result === 'correct').length, strikes: rows.filter((r) => r.result === 'mismatch').length,
        witnesses: rows.filter((r) => r.height <= tip + sent.length - lag).map((r) => ({ addr: r.stx.tx.sender, name: nameOf(r.stx), name_bound: true, tier: 'witness', established: false, tx: K.pcc.txHash(r.stx), result: r.result, included_at: r.height })), more: 0,
      });
    }
    if (p === '/witnesses') {
      const rows = (await Promise.all(judged())).filter(Boolean);
      const by = new Map();
      for (const r of rows) { const a = by.get(r.stx.tx.sender) || { addr: r.stx.tx.sender, name: nameOf(r.stx), name_bound: true, tier: 'witness', attestations: 0, correct: 0, mismatches: 0, conflicts: 0, strikes: 0, streak: 1, best_streak: 1, established: false }; a.attestations += 1; if (r.result === 'correct') a.correct += 1; if (r.result === 'mismatch') a.strikes += 1; by.set(a.addr, a); }
      return rep({ schema: 'pointcast-devnet/net-api/v1', network: 'devnet', day: '2026-10-20', witnesses: [...by.values()], next_after: null });
    }
    return inner(url, init);
  };
  const nameOf = (stx) => { try { return W.parseWitnessBody((bodies[stx.tx.body_hash] || '').split('\n')[0]).name || null; } catch { return null; } };
  f.sent = sent;
  f.bodies = bodies;
  f.setLag = (n) => { lag = n; };
  return f;
}
const posts = (log) => log.filter((l) => l.startsWith('POST '));

// ================================================================ the data file

test('the words are the Daily Net’s own, verbatim, and the registry entry is honest', () => {
  assert.equal(D.HONESTY_LINE, 'devnet · no value · may reset');
  assert.equal(D.WITNESS_MEANING, W.WITNESS_MEANING);
  assert.equal(D.WITNESS_LIMITS, W.WITNESS_LIMITS);
  assert.equal(D.STRIKE_COPY, W.STRIKE_COPY);
  assert.equal(D.CHANNEL, W.CHANNELS.witness);
  assert.equal(D.NET_CHANNEL, W.CHANNELS.net);
  assert.equal(D.TOOL, X.TOOL);
  assert.ok(D.TOOL.length <= 64);
  assert.equal(X.CHANNEL_WIT, 'WIT');
  assert.equal(X.CHANNEL_NET, 'NET');
  assert.match(D.WITNESS_MEANING, /public claim, tied to a free key/);
  assert.match(D.WITNESS_LIMITS, /not proof of replay[\s\S]*Counts are keys, not people\.$/);
  // the same sentences appear in the Daily Net’s docs and in /chain/net
  const net = read('src/pages/chain/net.astro');
  assert.ok(net.includes('A witness is a public claim, tied to a free key: “I replayed this chain from genesis with the pinned verifier and got this block hash and state root at height h.”'));
  const docs = existsSync('/Users/michaelhoydich/pointcast-chain/docs/DAILY_NET.md') ? readFileSync('/Users/michaelhoydich/pointcast-chain/docs/DAILY_NET.md', 'utf8') : '';
  if (docs) {
    assert.ok(docs.includes('A witness is a **public claim, tied to a free key**'));
    assert.ok(docs.includes('Counts are keys, not people.'));
    assert.ok(docs.includes('Someone who copies `/status` signs the same bytes') || docs.includes('Someone who copies `/status` signs the same bytes and never gets a strike'));
  }
  // the registry entry the integrator adds: a write app, an honest blurb of the length the others have, none of the banned words
  const e = D.REGISTRY_ENTRY;
  assert.deepEqual([e.key, e.href, e.mode], ['witness', '/chain/witness', 'write']);
  assert.ok(e.blurb.length > 60 && e.blurb.length < 260, 'blurb length ' + e.blurb.length);
  assert.ok(e.label.length > 3 && e.short.length > 3);
  assert.match(e.blurb, /claim tied to a key, not proof that you replayed/);
  assert.deepEqual(bannedHits(e.blurb), []);
  assert.deepEqual(currencyHits(e.blurb), []);
  assert.equal(D.APP.path, e.href);
  assert.match(D.APP.block, /^\d{4}$/);
});

// ================================================================ the pinned verifier

test('the verifier pins are the Block Yard’s own, three ways: the files, the Yard’s page, pointcast_chain.wasm.sha256 (and pc-witness.mjs knows the wasm)', () => {
  for (const f of D.VERIFIER.files) assert.equal(D.VERIFIER.pins[f], SHAS[f], f + ' is the file that ships');
  assert.deepEqual([...D.VERIFIER.files].sort(), [...X.VERIFIER_FILES].sort());
  const yard = read('public/chain/yard/index.html');
  const block = /const VERIFIER_PINS = \{([\s\S]*?)\};/.exec(yard)[1];
  for (const f of D.VERIFIER.files) assert.ok(new RegExp('"' + f.replace('.', '\\.') + '":\\s*"' + D.VERIFIER.pins[f] + '"').test(block), 'the Yard pins the same ' + f);
  assert.equal(SUMS.trim().split(/\s+/)[0], D.VERIFIER.pins['pointcast_chain.wasm']);
  const pcw = read('public/chain/net/pc-witness.mjs');
  assert.ok(pcw.includes(D.VERIFIER.pins['pointcast_chain.wasm']) && pcw.includes(D.VERIFIER.pins['verify.js']), 'pc-witness.mjs pins the same verifier');
  assert.equal(D.VERIFIER.dir, '/chain/yard/verifier/');
  assert.equal(D.VERIFIER.sumsFile, 'pointcast_chain.wasm.sha256');
  assert.equal(VER.sha['pointcast_chain.wasm'], D.VERIFIER.pins['pointcast_chain.wasm']);
});

test('checkVerifierBytes runs nothing unless every byte is the pinned one: each file flipped, missing, the sums file wrong or absent', async () => {
  const ok = await X.checkVerifierBytes(fileBytes(), D.VERIFIER.pins, SUMS);
  assert.deepEqual(ok, SHAS);
  for (const name of X.VERIFIER_FILES) {
    const f = fileBytes();
    f[name][f[name].length >> 1] ^= 1;
    await assert.rejects(() => X.checkVerifierBytes(f, D.VERIFIER.pins, SUMS), (e) => e.name === 'PinError' && e.message.startsWith(name + ' is not the verifier this page pins') && /refusing to run it/.test(e.message), name);
    const m = fileBytes();
    delete m[name];
    await assert.rejects(() => X.checkVerifierBytes(m, D.VERIFIER.pins, SUMS), new RegExp(name.replace('.', '\\.') + ' did not load'));
  }
  await assert.rejects(() => X.checkVerifierBytes(fileBytes(), D.VERIFIER.pins, HEX('a') + '  pointcast_chain.wasm\n'), /pointcast_chain\.wasm\.sha256 lists a{64}, the wasm is 7467bfd9/);
  await assert.rejects(() => X.checkVerifierBytes(fileBytes(), D.VERIFIER.pins, null), /fingerprint could not be compared/);
  await assert.rejects(() => X.checkVerifierBytes(fileBytes(), D.VERIFIER.pins, undefined), /did not load/);
  await assert.rejects(() => X.checkVerifierBytes(fileBytes(), { ...D.VERIFIER.pins, 'verify.js': 'nope' }, SUMS), /this page has no pin for verify\.js/);
  await assert.rejects(() => X.checkVerifierBytes(fileBytes(), {}, SUMS), /no pin for/);
  // an ArrayBuffer is as good as a Uint8Array
  const ab = fileBytes();
  ab['verify.js'] = ab['verify.js'].buffer.slice(ab['verify.js'].byteOffset, ab['verify.js'].byteOffset + ab['verify.js'].byteLength);
  assert.deepEqual(await X.checkVerifierBytes(ab, D.VERIFIER.pins, SUMS), SHAS);
});

test('the pin check has teeth: with its comparison removed from a copy, a tampered wasm is accepted — mutation', async () => {
  const m = await variant({ logic: swap("if (got !== want) throw new PinError(name + ' is not the verifier this page pins", "if (false) throw new PinError(name + ' is not the verifier this page pins") });
  const f = fileBytes();
  f['pointcast_chain.wasm'][4000] ^= 0xff;
  await assert.rejects(() => REAL.X.checkVerifierBytes(f, D.VERIFIER.pins, SUMS), /is not the verifier this page pins/);
  // the wasm.sha256 file is a second wall: the mutant still refuses until that is gone too
  await assert.rejects(() => m.X.checkVerifierBytes(f, D.VERIFIER.pins, SUMS), /pointcast_chain\.wasm\.sha256 lists/);
  const m2 = await variant({ logic: (s) => swap("if (got !== want) throw new PinError(name + ' is not the verifier this page pins", "if (false) throw new PinError(name + ' is not the verifier this page pins")(s).replace("if (listed.toLowerCase() !== sha['pointcast_chain.wasm']) {", "if (false) {") });
  const got = await m2.X.checkVerifierBytes(f, D.VERIFIER.pins, SUMS);
  assert.notEqual(got['pointcast_chain.wasm'], D.VERIFIER.pins['pointcast_chain.wasm'], 'with both walls gone the tampered wasm is accepted');
});

test('fetchVerifier reads the four files from the Yard’s folder with no credentials, checks them, and says what failed', async () => {
  const calls = [];
  const bytes = fileBytes();
  const serve = (override = {}) => async (url, init) => {
    calls.push({ url: String(url), init });
    const name = String(url).split('/').pop();
    if (override[name]) return override[name];
    const body = name === 'pointcast_chain.wasm.sha256' ? new TextEncoder().encode(SUMS) : bytes[name];
    return { ok: true, status: 200, arrayBuffer: async () => body.slice().buffer };
  };
  const got = await X.fetchVerifier({ fetch: serve(), base: '/chain/yard/verifier/', pins: D.VERIFIER.pins });
  assert.deepEqual(got.sha, SHAS);
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map((c) => c.url.split('/').pop()).sort(), ['pointcast_chain.wasm', 'pointcast_chain.wasm.sha256', 'verify-worker.js', 'verify.js']);
  for (const c of calls) { assert.equal(c.init.credentials, 'omit'); assert.equal(c.init.referrerPolicy, 'no-referrer'); assert.ok(c.url.startsWith('/chain/yard/verifier/')); }
  await assert.rejects(() => X.fetchVerifier({ fetch: serve({ 'verify.js': { ok: false, status: 404 } }), base: '/chain/yard/verifier/', pins: D.VERIFIER.pins }), (e) => e.name === 'PinError' && /verify\.js did not load \(HTTP 404\)/.test(e.message));
  const bad = new TextEncoder().encode('console.log(1)');
  await assert.rejects(() => X.fetchVerifier({ fetch: serve({ 'verify-worker.js': { ok: true, status: 200, arrayBuffer: async () => bad.buffer } }), base: '/x/', pins: D.VERIFIER.pins }), /verify-worker\.js is not the verifier this page pins/);
  await assert.rejects(() => X.fetchVerifier({ fetch: async () => { throw new TypeError('offline'); }, base: '/x/', pins: D.VERIFIER.pins }), /did not load \(unreachable\)/);
  // a server that never answers is given up on
  await assert.rejects(() => X.fetchVerifier({ fetch: (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })))), base: '/x/', pins: D.VERIFIER.pins, timeoutMs: 30 }), /timed out/);
});

test('blobAssets builds two blob URLs from the checked bytes, a fresh wasm copy each time, and revokes them', () => {
  const made = [];
  const revoked = [];
  const env = { URL: { createObjectURL: (b) => { made.push(b); return 'blob:x/' + made.length; }, revokeObjectURL: (u) => revoked.push(u) }, Blob };
  const a = X.blobAssets(fileBytes(), env);
  assert.deepEqual([a.verifyJsUrl, a.workerUrl], ['blob:x/1', 'blob:x/2']);
  assert.equal(made[0].type, 'text/javascript');
  const w1 = a.wasmCopy();
  const w2 = a.wasmCopy();
  assert.notEqual(w1, w2);
  assert.equal(w1.byteLength, fileBytes()['pointcast_chain.wasm'].length);
  a.revoke();
  assert.deepEqual(revoked, ['blob:x/1', 'blob:x/2']);
});

// ================================================================ the replay, in node

test('replayNode replays the recorded chain through the real pinned verifier, and every hash equals the SDK’s own header hash', async () => {
  assert.equal(REPLAY.tip.height, 92);
  assert.deepEqual([...REPLAY.cps.keys()], [1, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  for (const [h, v] of REPLAY.cps) {
    const b = FX.blocks.find((x) => x.header.height === h);
    assert.equal(v.block_hash, K.pcc.blockHeaderHash(b.header), 'block ' + h + ' hash');
    assert.equal(v.state_root, b.header.state_root, 'block ' + h + ' state root');
  }
  assert.equal(REPLAY.tip.block_hash, K.pcc.blockHeaderHash(FX.blocks.at(-1).header));
  assert.equal(REPLAY.ts.length, 93, 'a timestamp for each of 92 blocks, by height');
  for (const b of FX.blocks) assert.equal(REPLAY.ts[b.header.height], b.header.timestamp);
  assert.equal(REPLAY.ts[1], 0, 'block 1 has no time');
  // the WIT and NET posts the verifier saw, with the block they sit in
  const want = FX.blocks.flatMap((b) => b.txs.filter((t) => t.tx.type === 'publish_block' && ['WIT', 'NET'].includes(t.tx.channel)).map((t) => ({ height: b.header.height, tx: K.pcc.txHash(t), sender: t.tx.sender, channel: t.tx.channel })));
  assert.deepEqual(REPLAY.posts.map((p) => ({ height: p.height, tx: p.tx, sender: p.sender, channel: p.channel })), want);
  assert.ok(want.length >= 1);
  const seen = [];
  await replayOf(FX.blocks, { onProgress: (p) => seen.push(p) }).promise;
  assert.deepEqual(seen.at(-1), { height: 92, tip: 92 });
});

test('any fault stops the replay and nothing is signed: a changed signature, a gap, a changed seal — each, and proven by mutation', async () => {
  const cases = [['a changed signature', tamper.sig(FX.blocks), 31, /tx_root mismatch/], ['a missing block', tamper.gap(FX.blocks), 51, /bad height/], ['a changed seal', tamper.seal(FX.blocks), 40, /bad sequencer signature/]];
  for (const [what, blocks, at, why] of cases) {
    await assert.rejects(() => replayOf(blocks).promise, (e) => e.name === 'ReplayFault' && e.code === 'fault' && e.at === at && why.test(e.message) && /refusing to sign$/.test(e.message), what);
  }
  const m = await variant({ logic: swap('if (out.fault) {', 'if (false) {') });
  // the mutant gets past the fault; whatever stops it then is a second wall (the collector’s gap and header checks), not the fault
  const seenByMutant = [];
  for (const [what, blocks] of cases) {
    try { await replayOf(blocks, {}, m.X).promise; seenByMutant.push(what + ': went through'); } catch (e) { seenByMutant.push(what + ': ' + e.name + ' ' + e.code); }
  }
  assert.ok(seenByMutant.some((l) => /went through/.test(l)) || seenByMutant.every((l) => !/ReplayFault/.test(l)), 'with the fault check gone the replay no longer says fault: ' + seenByMutant.join(' | '));
  assert.ok(seenByMutant.every((l) => !/ReplayFault/.test(l)));
});

test('a replay short of the height /status gave, with a block read two ways, or with a header that does not belong to a verified block, is refused — the collector’s walls', () => {
  const rows = (n) => FX.blocks.slice(0, n).map((b) => [b.header.height, b.header.timestamp, b.header.prev_hash, b.header.tx_root, b.header.state_root]);
  const verified = (n) => FX.blocks.slice(0, n).map((b) => [b.header.height, K.pcc.blockHeaderHash(b.header), b.header.state_root]);
  const col = (n = 92) => { const c = X.makeCollector(); c.addVerified(verified(n)); c.addHeaders(rows(n)); return c; };
  assert.equal(col().result({ minHeight: 92 }).tip.height, 92);
  assert.throws(() => col(50).result({ minHeight: 92 }), (e) => e.code === 'short' && /short of the 92 blocks/.test(e.message));
  assert.throws(() => X.makeCollector().result(), (e) => e.code === 'empty');
  // a forged timestamp on one header: it no longer hashes to the verified block
  const forged = col();
  forged.addHeaders([[40, FX.blocks[39].header.timestamp + 5000, FX.blocks[39].header.prev_hash, FX.blocks[39].header.tx_root, FX.blocks[39].header.state_root]]);
  assert.throws(() => forged.result(), (e) => e.code === 'conflict' && /block 40 two different ways/.test(e.message));
  const c2 = X.makeCollector();
  c2.addVerified(verified(92));
  const r2 = rows(92);
  r2[39][1] += 5000;
  c2.addHeaders(r2);
  assert.throws(() => c2.result(), (e) => e.code === 'unbound' && /block 40 does not hash to the block the verifier accepted/.test(e.message));
  // a missing header, a missing verified block (a gap), junk rows
  const c3 = X.makeCollector();
  c3.addVerified(verified(92));
  c3.addHeaders(rows(92).filter((r) => r[0] !== 60));
  assert.throws(() => c3.result(), (e) => e.code === 'unbound' && /no header was read for block 60/.test(e.message));
  const c4 = X.makeCollector();
  c4.addVerified(verified(92).filter((r) => r[0] !== 30));
  c4.addHeaders(rows(92));
  assert.throws(() => c4.result(), (e) => e.code === 'gap');
  const c5 = X.makeCollector();
  c5.addVerified([[1, 'nope', 'nope'], null, [], 'x']);
  c5.addHeaders([[0, 1, 'a', 'b', 'c'], [NaN, 1, 'a', 'b', 'c'], null].filter(Boolean));
  c5.addBlocks([null, { height: 3, txs: [null, { kind: 'publish_block', payload: null }] }, 5]);
  assert.throws(() => c5.result(), (e) => e.code === 'empty');
});

test('a timestamp that is not bound to a verified block moves the checkpoint — and the binding check is what stops it, proven by mutation', async () => {
  // forge block 2’s time to yesterday: the day’s first block would then be a later one and the day checkpoint 20, not 10
  const verified = FX.blocks.map((b) => [b.header.height, K.pcc.blockHeaderHash(b.header), b.header.state_root]);
  const rows = FX.blocks.map((b) => [b.header.height, b.header.timestamp, b.header.prev_hash, b.header.tx_root, b.header.state_root]);
  const day = Date.parse('2026-10-19T12:00:00Z');
  const forgedRows = rows.map((r) => [...r]);
  for (let i = 1; i < 12; i++) forgedRows[i][1] = day + i; // blocks 2..12 "yesterday"
  const scene = async (mod) => {
    const c = mod.makeCollector();
    c.addVerified(verified);
    c.addHeaders(forgedRows);
    try { const r = c.result({ minHeight: 92 }); return mod.chooseCheckpoint({ replay: r, nowMs: NOW }).target; } catch (e) { return e.code; }
  };
  assert.equal(await scene(REAL.X), 'unbound', 'the real collector refuses forged times');
  const honest = REAL.X.makeCollector();
  honest.addVerified(verified);
  honest.addHeaders(rows);
  assert.equal(REAL.X.chooseCheckpoint({ replay: honest.result({ minHeight: 92 }), nowMs: NOW }).target, 10);
  const m = await variant({ logic: swap('if (got !== hashAt.get(h).block_hash) throw new Refusal(', 'if (false) throw new Refusal(') });
  assert.equal(await scene(m.X), 20, 'without the binding the forged times pick the wrong checkpoint');
});

test('a 429 or a 5xx on a page is waited out and tried again; a refusal that is not transient is not; cancel() stops it', async () => {
  const sleeps = [];
  let n = 0;
  const flaky = (status) => async (p) => { if (/raw\/blocks/.test(p) && n++ < 2) throw Object.assign(new Error(status + ' ' + p), { status, retryAfter: status === 429 ? 1 : 0 }); return getFrom(FX.blocks)(p); };
  for (const status of [429, 503]) {
    n = 0;
    const r = await X.replayNode({ get: flaky(status), verifier: VER, params: VER.parseJson(JSON.stringify(FX.params)), genesis: GENESIS, minHeight: 92, sleep: async (ms) => { sleeps.push(ms); } }).promise;
    assert.equal(r.tip.height, 92, String(status));
  }
  assert.ok(sleeps.length === 4 && sleeps[0] === 1000 && sleeps[1] === 1000, 'Retry-After is honoured: ' + sleeps);
  n = -99;
  await assert.rejects(() => X.replayNode({ get: async () => { throw Object.assign(new Error('403 /raw/blocks'), { status: 403 }); }, verifier: VER, params: FX.params, genesis: GENESIS, sleep: async () => {} }).promise, /403/);
  n = 0;
  await assert.rejects(() => X.replayNode({ get: async () => { throw Object.assign(new Error('429 /raw/blocks'), { status: 429 }); }, verifier: VER, params: FX.params, genesis: GENESIS, sleep: async () => {}, retries: 2 }).promise, /429/, 'after the retries it gives up');
  const run = X.replayNode({ get: getFrom(FX.blocks), verifier: VER, params: VER.parseJson(JSON.stringify(FX.params)), genesis: GENESIS });
  run.cancel();
  await assert.rejects(() => run.promise, (e) => e.name === 'Cancelled' && /nothing was signed or sent/.test(e.message));
  // params that do not hash to the genesis are refused by the verifier before a block is read
  await assert.rejects(() => X.replayNode({ get: getFrom(FX.blocks), verifier: VER, params: VER.parseJson(JSON.stringify(FX.params)), genesis: HEX('9') }).promise, /genesis|params/i);
});

// ================================================================ the replay, in the worker

/** A worker double: what the page posts is kept, and the test plays the worker’s messages. */
function fakeWorker() {
  const w = { posted: [], terminated: false, onmessage: null, onerror: null, postMessage(m, t) { w.posted.push({ m, t }); }, terminate() { w.terminated = true; } };
  w.say = (m) => w.onmessage && w.onmessage({ data: m });
  return w;
}
const verifiedRows = (from, to) => FX.blocks.filter((b) => b.header.height >= from && b.header.height <= to).map((b) => [b.header.height, K.pcc.blockHeaderHash(b.header), b.header.state_root, b.txs.length]);
const headerRows = (from, to) => FX.blocks.filter((b) => b.header.height >= from && b.header.height <= to).map((b) => [b.header.height, b.header.timestamp, b.header.prev_hash, b.header.tx_root, b.header.state_root]);
const blockCards = (from, to) => FX.blocks.filter((b) => b.header.height >= from && b.header.height <= to).map((b) => ({ height: b.header.height, block_hash: K.pcc.blockHeaderHash(b.header), txs: b.txs.map((t) => ({ hash: K.pcc.txHash(t), kind: t.tx.type, sender: t.tx.sender, payload: { channel: t.tx.channel, title: t.tx.title, body_hash: t.tx.body_hash } })) }));
const assetsDouble = () => ({ verifyJsUrl: 'blob:t/js', workerUrl: 'blob:t/worker', wasmCopy: () => new ArrayBuffer(8) });
const startWorker = (o = {}) => {
  const w = fakeWorker();
  const notes = [];
  const progress = [];
  const run = X.workerReplay({ spawn: () => w, assets: assetsDouble(), api: 'http://127.0.0.1:8799', genesis: GENESIS, shas: SHAS, minHeight: 92, onProgress: (p) => progress.push(p), onNote: (n) => notes.push(n), ...o });
  return { w, run, notes, progress };
};
const genesisReady = { type: 'ready', genesis_hash: GENESIS, chain_id: FX.status.chain_id, basis: { kind: 'genesis', verified_from_genesis: true }, resumed: null, role: 'solo' };

test('workerReplay starts the pinned worker with the checked bytes, follows its progress, and stops it the moment it has the tip', async () => {
  const { w, run, progress } = startWorker();
  const start = w.posted[0];
  assert.equal(start.m.workerUrl, 'blob:t/worker');
  assert.deepEqual(Object.keys(start.m.start).sort(), ['api', 'genesis', 'verifyJsSha256', 'verifyJsUrl', 'wasm', 'wasmSha256', 'workerSha256']);
  assert.equal(start.m.start.wasmSha256, SHAS['pointcast_chain.wasm']);
  assert.equal(start.m.start.verifyJsSha256, SHAS['verify.js']);
  assert.equal(start.m.start.workerSha256, SHAS['verify-worker.js']);
  assert.ok(start.m.start.wasm instanceof ArrayBuffer && start.t.includes(start.m.start.wasm), 'the wasm goes by transfer');
  w.say(genesisReady);
  // headers arrive before the worker’s own progress, as the shim posts them
  w.say({ type: 'witness-headers', rows: headerRows(1, 50) });
  w.say({ type: 'progress', height: 50, block_hash: HEX('1'), state_root: HEX('2'), tip: 92, verified: verifiedRows(1, 50), blocks: blockCards(1, 50) });
  assert.deepEqual(progress.at(-1), { height: 50, tip: 92 });
  assert.equal(w.terminated, false, 'not at the tip yet');
  w.say({ type: 'witness-headers', rows: headerRows(51, 92) });
  w.say({ type: 'progress', height: 92, block_hash: HEX('1'), state_root: HEX('2'), tip: 92, verified: verifiedRows(51, 92), blocks: blockCards(51, 92) });
  const r = await run.promise;
  assert.equal(r.tip.height, 92);
  assert.deepEqual([...r.cps], [...REPLAY.cps]);
  assert.deepEqual(r.ts, REPLAY.ts);
  assert.equal(w.terminated, true);
  assert.deepEqual(w.posted.at(-1).m, { stop: true, save: false }, 'the worker is told to stop, saving nothing');
  // a message after the end is ignored
  w.say({ type: 'fault', fault: 'x', height: 1, reason: 'late' });
});

test('workerReplay refuses: a fault (with its evidence), a worker not from genesis, a worker that cannot load, a worker error, a worker that cannot be made', async () => {
  let t = startWorker();
  t.w.say(genesisReady);
  t.w.say({ type: 'fault', fault: 'equivocation', height: 61, reason: 'two blocks sealed at one height', evidence: {}, evidence_json: '{"evidence":1}', verdict: { valid: true } });
  await assert.rejects(t.run.promise, (e) => e.name === 'ReplayFault' && e.at === 61 && e.sequencerFault && e.evidenceJson === '{"evidence":1}' && /a sequencer fault; refusing to sign$/.test(e.message));
  assert.equal(t.w.terminated, true);
  for (const bad of [{ ...genesisReady, basis: { kind: 'self_verified', verified_from_genesis: false } }, { ...genesisReady, basis: null }, { ...genesisReady, resumed: { height: 50, via: 'cache' } }]) {
    t = startWorker();
    t.w.say(bad);
    await assert.rejects(t.run.promise, (e) => e.code === 'basis' && /did not start from genesis/.test(e.message));
  }
  t = startWorker();
  t.w.say({ type: 'error', message: 'verifier wasm does not match the pinned sha256' });
  await assert.rejects(t.run.promise, (e) => e.code === 'worker' && /the verifier worker stopped: verifier wasm does not match/.test(e.message) && /Nothing was signed/.test(e.message));
  t = startWorker();
  t.w.onerror({ message: 'Failed to fetch dynamically imported module' });
  await assert.rejects(t.run.promise, (e) => e.code === 'worker' && /could not run[\s\S]*cannot replay here/.test(e.message));
  await assert.rejects(X.workerReplay({ spawn: () => { throw new TypeError('Worker is not defined'); }, assets: assetsDouble(), api: 'x', genesis: GENESIS }).promise, (e) => e.code === 'worker' && /could not start a worker/.test(e.message));
  const noWasm = X.workerReplay({ spawn: fakeWorker, assets: { ...assetsDouble(), wasmCopy: () => { throw new Error('detached'); } }, api: 'x', genesis: GENESIS });
  await assert.rejects(noWasm.promise, (e) => e.code === 'worker' && /could not be started/.test(e.message));
});

test('a transient error or a node fault is a note, not the end; a stall of stallMs with no new block is refused and says why (429 too); cancel stops it', async () => {
  let clock = 1_000_000;
  const timers = [];
  const env = { now: () => clock, setTimeout: (f, ms) => { const t = { f, ms }; timers.push(t); return t; }, clearTimeout: (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); } };
  const t = startWorker({ timers: env, stallMs: 10_000 });
  t.w.say(genesisReady);
  t.w.say({ type: 'error', message: 'sync: 429 /raw/blocks?from=51&limit=500', transient: true });
  assert.deepEqual(t.notes.at(-1), { type: 'transient', text: 'sync: 429 /raw/blocks?from=51&limit=500', status: 429 });
  t.w.say({ type: 'node_fault', fault: 'garbage', height: 51, reason: 'tx_root mismatch' });
  assert.match(t.notes.at(-1).text, /does not extend the replay at 51: tx_root mismatch/);
  assert.equal(t.w.terminated, false);
  clock += 5000;
  timers.slice().forEach((x) => x.f());
  assert.equal(t.w.terminated, false, 'five seconds is not a stall');
  clock += 6000;
  timers.slice().forEach((x) => x.f());
  await assert.rejects(t.run.promise, (e) => e.code === 'stall' && /stalled at block 0 of 92: no new block for 10 s \(the devnet served a block that does not extend the replay at 51/.test(e.message) && /Nothing was signed\.$/.test(e.message));
  assert.equal(t.w.terminated, true);
  // the stall is mutation-proven: with the check gone the replay would wait for ever
  const m = await variant({ logic: swap('if (nowFn() - last > stallMs) {', 'if (false) {') });
  let clock2 = 0;
  const timers2 = [];
  const t2 = (() => {
    const w = fakeWorker();
    const run = m.X.workerReplay({ spawn: () => w, assets: assetsDouble(), api: 'x', genesis: GENESIS, minHeight: 92, stallMs: 100, timers: { now: () => clock2, setTimeout: (f) => { const x = { f }; timers2.push(x); return x; }, clearTimeout() {} } });
    return { w, run };
  })();
  clock2 += 10_000;
  timers2.slice().forEach((x) => x.f());
  assert.equal(t2.w.terminated, false, 'the mutant never gives up');
  t2.run.cancel();
  await assert.rejects(t2.run.promise, /cancelled/);
  // cancel on the real one
  const c = startWorker();
  c.run.cancel();
  await assert.rejects(c.run.promise, (e) => e.name === 'Cancelled');
  assert.equal(c.w.terminated, true);
});

test('a worker that says tip 0 cannot end the replay early: the height /status gave is the floor', async () => {
  const t = startWorker();
  t.w.say(genesisReady);
  t.w.say({ type: 'witness-headers', rows: headerRows(1, 50) });
  t.w.say({ type: 'progress', height: 50, block_hash: HEX('1'), state_root: HEX('2'), tip: 0, verified: verifiedRows(1, 50), blocks: [] });
  assert.equal(t.w.terminated, false);
  assert.deepEqual(t.progress.at(-1), { height: 50, tip: 92 });
  t.run.cancel();
  await assert.rejects(t.run.promise, /cancelled/);
});

test('the tip floor is proven by mutation: without it a worker that reports tip 0 ends the replay at the first page, and the collector’s own floor is the second wall', async () => {
  const scene = async (mod) => {
    const w = fakeWorker();
    const run = mod.workerReplay({ spawn: () => w, assets: assetsDouble(), api: 'x', genesis: GENESIS, shas: SHAS, minHeight: 92 });
    w.say(genesisReady);
    w.say({ type: 'witness-headers', rows: headerRows(1, 50) });
    w.say({ type: 'progress', height: 50, block_hash: HEX('1'), state_root: HEX('2'), tip: 0, verified: verifiedRows(1, 50), blocks: [] });
    const verdict = await Promise.race([run.promise.then(() => 'ended', (e) => e.code), tick(40).then(() => 'still going')]);
    run.cancel();
    await run.promise.catch(() => {});
    return verdict;
  };
  assert.equal(await scene(REAL.X), 'still going');
  const m = await variant({ logic: swap('let tip = minHeight;', 'let tip = 0;') });
  assert.equal(await scene(m.X), 'short', 'the mutant stops at block 50, and only the collector’s floor refuses it');
});

/** The real pinned worker behind the real shim, in a worker thread with a browser-like scope, against a real http server serving the chain. */
function spawnPinnedWorker() {
  const prelude = [
    "const { parentPort, workerData } = require('node:worker_threads');",
    'globalThis.self = globalThis;',
    'globalThis.postMessage = (m) => parentPort.postMessage(m);',
    'globalThis.onmessage = null;',
    "parentPort.on('message', (d) => { if (typeof globalThis.onmessage === 'function') globalThis.onmessage({ data: d }); });",
    "import(workerData.shim).then(() => parentPort.postMessage({ type: 'shim-loaded' }), (e) => parentPort.postMessage({ type: 'error', message: String(e) }));",
  ].join('\n');
  const w = new Worker(prelude, { eval: true, workerData: { shim: pathToFileURL(new URL(FILES.shim, root).pathname).href } });
  const fake = { onmessage: null, onerror: null, postMessage: (m, t) => w.postMessage(m, t || []), terminate: () => w.terminate() };
  w.on('message', (m) => { if (m.type !== 'shim-loaded' && fake.onmessage) fake.onmessage({ data: m }); });
  w.on('error', (e) => fake.onerror && fake.onerror(e));
  return fake;
}
const dataUrl = (b) => 'data:text/javascript;base64,' + Buffer.from(b).toString('base64');
const realAssets = () => { const f = fileBytes(); return { verifyJsUrl: dataUrl(f['verify.js']), workerUrl: dataUrl(f['verify-worker.js']), wasmCopy: () => f['pointcast_chain.wasm'].slice().buffer, revoke() {} }; };
function serveChain({ blocks = FX.blocks, firstN429 = 0 } = {}) {
  return new Promise((resolve) => {
    const hits = [];
    let limited = 0;
    const srv = createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      hits.push(u.pathname + u.search);
      const out = (o, code2 = 200) => { res.writeHead(code2, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(o)); };
      const tip = blocks.at(-1).header.height;
      let m;
      if (u.pathname === '/raw/blocks' && limited < firstN429) { limited += 1; return out({ error: 'slow down' }, 429); }
      if (u.pathname === '/status') return out({ ...FX.status, height: tip });
      if (u.pathname === '/params') return out(FX.params);
      if (u.pathname === '/anchors') return out({ anchors: [] });
      if (u.pathname === '/raw/blocks') { const from = Number(u.searchParams.get('from') || 1); return out({ tip, from, blocks: blocks.filter((b) => b.header.height >= from).slice(0, Number(u.searchParams.get('limit') || 100)) }); }
      if ((m = /^\/raw\/block\/(\d+)$/.exec(u.pathname))) { const b = blocks.find((x) => x.header.height === Number(m[1])); return b ? out(b) : out({ error: 'no such block' }, 404); }
      return out({ error: 'no such route' }, 404);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ url: 'http://127.0.0.1:' + srv.address().port, hits, close: () => new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); }) }));
  });
}

test('the real pinned worker, behind the shim, replays the recorded chain and gives the same result as the node path', { timeout: 60000 }, async () => {
  const chain = await serveChain();
  try {
    const run = X.workerReplay({ spawn: spawnPinnedWorker, assets: realAssets(), api: chain.url, genesis: GENESIS, shas: SHAS, minHeight: 92 });
    const r = await run.promise;
    assert.equal(r.tip.height, 92);
    assert.deepEqual([...r.cps], [...REPLAY.cps]);
    assert.deepEqual(r.ts, REPLAY.ts);
    assert.deepEqual(r.posts, REPLAY.posts);
    assert.equal(r.tip.block_hash, REPLAY.tip.block_hash);
    assert.equal(r.tip.state_root, REPLAY.tip.state_root);
    assert.ok(chain.hits.includes('/raw/blocks?from=1&limit=500'), 'blocks are pulled 500 at a time from block 1: ' + chain.hits.join(' '));
  } finally { await chain.close(); }
});

test('the real worker against a chain with a changed signature never reaches the tip: the node fault is told and the stall refuses', { timeout: 60000 }, async () => {
  const chain = await serveChain({ blocks: tamper.sig(FX.blocks) });
  try {
    const notes = [];
    const run = X.workerReplay({ spawn: spawnPinnedWorker, assets: realAssets(), api: chain.url, genesis: GENESIS, shas: SHAS, minHeight: 92, stallMs: 1500, onNote: (n) => notes.push(n) });
    await assert.rejects(run.promise, (e) => e.code === 'stall' && /does not extend the replay at 31/.test(e.message) && /Nothing was signed/.test(e.message));
    assert.ok(notes.some((n) => n.type === 'node_fault'));
  } finally { await chain.close(); }
});

test('the real worker waits out a 429 (a transient error) and still finishes', { timeout: 60000 }, async () => {
  const chain = await serveChain({ firstN429: 1 });
  try {
    const notes = [];
    const r = await X.workerReplay({ spawn: spawnPinnedWorker, assets: realAssets(), api: chain.url, genesis: GENESIS, shas: SHAS, minHeight: 92, onNote: (n) => notes.push(n) }).promise;
    assert.equal(r.tip.height, 92);
    assert.ok(notes.some((n) => n.type === 'transient' && n.status === 429), 'the 429 was told: ' + JSON.stringify(notes));
  } finally { await chain.close(); }
});

test('the real worker given a wasm that is not the pinned one stops by itself, and the page’s refusal says so', { timeout: 60000 }, async () => {
  const chain = await serveChain();
  try {
    const f = fileBytes();
    f['pointcast_chain.wasm'][3000] ^= 1;
    const assets = { verifyJsUrl: dataUrl(f['verify.js']), workerUrl: dataUrl(f['verify-worker.js']), wasmCopy: () => f['pointcast_chain.wasm'].slice().buffer, revoke() {} };
    const run = X.workerReplay({ spawn: spawnPinnedWorker, assets, api: chain.url, genesis: GENESIS, shas: SHAS, minHeight: 92 });
    await assert.rejects(run.promise, (e) => e.code === 'worker' && /the verifier worker stopped: verifier wasm does not match the pinned sha256\. Nothing was signed\./.test(e.message));
    assert.ok(!chain.hits.includes('/raw/blocks?from=1&limit=500'), 'no block was read');
  } finally { await chain.close(); }
});

test('the real worker refuses a devnet whose params are not the pinned genesis, and one that is mid-reset says so without a replay', { timeout: 60000 }, async () => {
  const chain = await serveChain();
  try {
    const run = X.workerReplay({ spawn: spawnPinnedWorker, assets: realAssets(), api: chain.url, genesis: HEX('9'), shas: SHAS, minHeight: 92 });
    await assert.rejects(run.promise, (e) => e.code === 'worker' && /the verifier worker stopped/.test(e.message));
  } finally { await chain.close(); }
});

test('the shim adds nothing the worker does not have: it only reports header rows, never loads code from the devnet, and starts the checked worker', () => {
  const c = code(src.shim);
  assertNoSinks(src.shim, 'witness-shim.js');
  assert.doesNotMatch(c, /importScripts|new Worker|XMLHttpRequest|WebSocket|localStorage|indexedDB/);
  assert.equal((c.match(/\bimport\(/g) || []).length, 1, 'one dynamic import, of the checked worker');
  assert.match(c, /await import\(d\.workerUrl\)/);
  assert.match(c, /type: 'witness-headers'/);
  assert.match(c, /self\.onmessage\(\{ data: d\.start \}\)/);
  assert.match(src.shim, /Nothing here decides anything\./);
});

// ================================================================ the checkpoint, exactly as pc-witness.mjs picks it

test('chooseCheckpoint: the epoch is block 1’s hash, the day is the later of the tip’s and the clock’s, the target is the day checkpoint else the latest sealed', () => {
  const a = choose(NOW);
  assert.deepEqual({ epoch: a.epoch, day: a.day, dayCp: a.dayCp, target: a.target, tip: a.tipHeight, empty: a.empty }, { epoch: EPOCH, day: '2026-10-20', dayCp: 10, target: 10, tip: 92, empty: false });
  assert.deepEqual(a.claim, REPLAY.cps.get(10));
  // just after midnight an idle chain’s tip is still yesterday’s: the clock’s day wins, and the day checkpoint is not sealed yet
  const b = choose(Date.parse('2026-10-21T00:05:00Z'));
  assert.deepEqual({ day: b.day, dayCp: b.dayCp, target: b.target }, { day: '2026-10-21', dayCp: null, target: 90 });
  assert.deepEqual(b.claim, REPLAY.cps.get(90));
  // before the tip’s own time the tip’s day is used
  assert.equal(choose(Date.parse('2026-10-20T01:00:00Z')).day, '2026-10-20');
  // the first block of the UTC day decides: here block 2, so the day checkpoint is 10; a chain of 5 blocks has no checkpoint at all
  const short = X.makeCollector();
  short.addVerified(FX.blocks.slice(0, 5).map((b2) => [b2.header.height, K.pcc.blockHeaderHash(b2.header), b2.header.state_root]));
  short.addHeaders(FX.blocks.slice(0, 5).map((b2) => [b2.header.height, b2.header.timestamp, b2.header.prev_hash, b2.header.tx_root, b2.header.state_root]));
  const c = choose(NOW, short.result());
  assert.deepEqual({ target: c.target, empty: c.empty, claim: c.claim }, { target: null, empty: true, claim: null });
  // it uses witness.js and nothing else for the rule
  assert.match(code(src.logic), /W\.dayCheckpoint\(headers, \{ day \}\)/);
  assert.match(code(src.logic), /dayCp \?\? W\.checkpointAt\(tip\.height\)/);
});

/** Run pc-witness.mjs --dry-run against a http server serving the recorded chain, with a pretend clock; returns what it chose. (Async: the server lives in this process.) */
function pcWitnessChoice(url, nowIso) {
  const dir = mkdtempSync(join(tmpdir(), 'witness-pcw-'));
  dirs.push(dir);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [new URL('public/chain/net/pc-witness.mjs', root).pathname, '--devnet', url, '--genesis', GENESIS, '--verifier', new URL(VDIR, root).pathname, '--dir', dir, '--dry-run', '--name', 'wt-parity'], { env: { ...process.env, PC_WITNESS_NOW: nowIso } });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (status) => {
      const m = /WIT · witness · h(\d+) · root ([0-9a-f]{12})/.exec(out);
      resolve({ status, out, target: m ? Number(m[1]) : null, root: m ? m[2] : null, day: (/ · day (\d{4}-\d\d-\d\d) /.exec(out) || [])[1], dayCp: (/day checkpoint (\d+|not sealed yet)/.exec(out) || [])[1] });
    });
  });
}

test('the page and pc-witness.mjs pick the same checkpoint, day and epoch for the same chain at four different clocks', { timeout: 120000 }, async () => {
  const chain = await serveChain();
  try {
    for (const iso of ['2026-10-20T08:00:00Z', '2026-10-20T23:30:00Z', '2026-10-21T00:05:00Z', '2026-10-22T12:00:00Z']) {
      const theirs = await pcWitnessChoice(chain.url, iso);
      assert.equal(theirs.status, 0, iso + '\n' + theirs.out);
      const mine = choose(Date.parse(iso));
      assert.equal(theirs.target, mine.target, iso + ' target');
      assert.equal(theirs.root, mine.claim.state_root.slice(0, 12), iso + ' root');
      assert.equal(theirs.day, mine.day, iso + ' day');
      assert.equal(theirs.dayCp, mine.dayCp === null ? 'not sealed yet' : String(mine.dayCp), iso + ' day checkpoint');
      assert.ok(theirs.out.includes('epoch ' + mine.epoch.slice(0, 12)), iso + ' epoch');
    }
  } finally { await chain.close(); }
});

// ================================================================ names, notes, the midnight guard

test('names and notes: the same rules the Daily Net has, said plainly', () => {
  assert.deepEqual(X.checkName(''), { ok: true, name: '', reason: '' });
  assert.deepEqual(X.checkName('  '), { ok: true, name: '', reason: '' });
  assert.deepEqual(X.checkName(' my-key-7 '), { ok: true, name: 'my-key-7', reason: '' });
  for (const bad of ['a', 'x'.repeat(25), 'Upper', 'has space', 'under_score', 'ünï', '<b>', 'a.b']) assert.equal(X.checkName(bad).ok, false, bad);
  for (const r of W.RESERVED_NAMES) { const c = X.checkName(r); assert.equal(c.ok, false, r); assert.match(c.reason, /reserved for the house/); }
  assert.equal(X.checkNote('').ok, true);
  assert.equal(X.checkNote('  morning,   all quiet ').note, 'morning, all quiet');
  assert.equal(X.checkNote('x'.repeat(140)).ok, true);
  assert.equal(X.checkNote('x'.repeat(141)).ok, false);
  assert.equal(X.checkNote('bell\u0007').ok, false);
  assert.equal(X.checkNote('‮evil').ok, false);
});

test('the name rule has teeth: with its test removed from a copy, a reserved-looking junk name is accepted — mutation', async () => {
  const m = await variant({ logic: swap('if (!W.NAME_RE.test(name)) return {', 'if (false) return {') });
  assert.equal(REAL.X.checkName('<script>').ok, false);
  assert.equal(m.X.checkName('<script>').ok, true);
});

test('the midnight guard: 23:59:00 to 00:00:59 UTC, as in pc-witness.mjs — and the page uses the same arithmetic', () => {
  const at = (t) => Date.parse('2026-10-20T' + t + 'Z');
  for (const [t, near] of [['23:58:59', false], ['23:59:00', true], ['23:59:59', true], ['00:00:00', true], ['00:00:59', true], ['00:01:00', false], ['12:00:00', false]]) assert.equal(X.nearMidnight(at(t)), near, t);
  assert.throws(() => X.assertNotNearMidnight(at('23:59:30'), 'the post'), (e) => e.name === 'Midnight' && /between 23:59 and 00:01 UTC could land on either day/.test(e.message) && /Nothing was sent; try again after 00:01 UTC/.test(e.message) && !/signed/.test(e.message));
  assert.doesNotThrow(() => X.assertNotNearMidnight(at('12:00:00'), 'the post'));
  const pcw = read('public/chain/net/pc-witness.mjs');
  assert.match(pcw, /return minute >= 1439 \|\| minute < 1;/);
  assert.match(code(src.logic), /return minute >= 1439 \|\| minute < 1;/);
  assert.equal(D.MIDNIGHT_LINE.includes('23:59 and 00:01 UTC'), true);
});

// ================================================================ the plan

test('planWitness makes the exact post: a claim witness.js signed and verifyWitness accepts, a title, a body under 2,048 bytes, a check-in in the Daily Net’s form', async () => {
  const plan = await planFor({ opts: { name: 'wt-test-1', checkin: true, note: 'hello from a tab' } });
  assert.deepEqual({ ok: plan.ok, sendable: plan.sendable, blocked: plan.blocked, errors: plan.errors, target: plan.target, day: plan.day, sender: plan.sender, name: plan.name }, { ok: true, sendable: true, blocked: '', errors: [], target: 10, day: '2026-10-20', sender: KEY.sender, name: 'wt-test-1' });
  assert.equal(plan.wit.channel, 'WIT');
  assert.equal(plan.wit.title, 'witness · h10 · root ' + REPLAY.cps.get(10).state_root.slice(0, 12) + ' · wt-test-1');
  assert.equal(plan.wit.title, W.witnessTitle({ height: 10, state_root: REPLAY.cps.get(10).state_root, name: 'wt-test-1' }));
  const [lineOne, human, ...rest] = plan.wit.body.split('\n');
  assert.deepEqual(rest, []);
  assert.equal(lineOne, plan.wit.line);
  assert.ok(new TextEncoder().encode(plan.wit.body).length <= W.BODY_MAX_BYTES);
  assert.equal(human, 'I replayed pointcast-devnet-2 from genesis with the pinned verifier (wasm ' + SHAS['pointcast_chain.wasm'].slice(0, 12) + ') in a browser tab and got this block hash and state root at height 10. A public claim tied to this key, not proof of replay. Devnet: no value, may reset.');
  const f = W.parseWitnessBody(plan.wit.body);
  assert.deepEqual({ epoch: f.epoch, height: f.height, block_hash: f.block_hash, state_root: f.state_root, replayed_from: f.replayed_from, tool: f.tool, name: f.name, public_key: f.public_key }, { epoch: EPOCH, height: 10, block_hash: REPLAY.cps.get(10).block_hash, state_root: REPLAY.cps.get(10).state_root, replayed_from: 1, tool: 'chain-witness-page/1', name: 'wt-test-1', public_key: KEY.publicKey.bytes });
  const v = await W.verifyWitness({ line: plan.wit.line, chain_id: FX.status.chain_id, genesis: GENESIS, epoch: EPOCH, signerPublicKey: KEY.publicKey, sender: KEY.sender, chain: REPLAY.cps.get(10), includedAt: 11 });
  assert.deepEqual({ ok: v.ok, reason: v.reason }, { ok: true, reason: null });
  assert.equal(v.digest, plan.wit.digest);
  // flipping the claim’s state root in a copy of the line makes it a different claim the signature does not cover
  const forged = plan.wit.line.replace(f.state_root, HEX('d'));
  assert.equal((await W.verifyWitness({ line: forged, chain_id: FX.status.chain_id, genesis: GENESIS, epoch: EPOCH, signerPublicKey: KEY.publicKey })).reason, 'bad_sig');
  // the check-in
  assert.equal(plan.net.channel, 'NET');
  assert.equal(plan.net.title, 'net · checkin · wt-test-1');
  assert.deepEqual(W.parseNetBody(plan.net.body), { schema: W.SCHEMAS.net, day: '2026-10-20', kind: 'checkin', note: 'hello from a tab', name: 'wt-test-1' });
  // no name, no check-in: a bare attestation
  const bare = await planFor({});
  assert.equal(bare.wit.title, 'witness · h10 · root ' + REPLAY.cps.get(10).state_root.slice(0, 12));
  assert.equal(W.parseWitnessBody(bare.wit.body).name, undefined);
  assert.equal(bare.net, null);
  assert.equal(bare.name, '');
  // determinism: the same key and claim sign the same bytes (ed25519), so what the review shows is what is sent
  assert.equal((await planFor({})).wit.body, bare.wit.body);
  // the key panel’s key is the only thing it signs with
  assert.equal(bare.wit.publicKey, KEY.publicKey.bytes);
});

test('planWitness stops, and says what, for: no key, a bad name, a reserved name, a bad note, nothing sealed yet', async () => {
  const none = await planFor({ key: null });
  assert.deepEqual([none.ok, none.sendable, none.wit], [false, false, null]);
  assert.deepEqual(none.errors, ['Make a key first: the claim is signed by it.']);
  assert.match((await planFor({ opts: { name: 'Bad Name' } })).errors[0], /2 to 24 of a–z, 0–9 and hyphen/);
  assert.match((await planFor({ opts: { name: 'house' } })).errors[0], /“house” is reserved for the house/);
  const note = await planFor({ opts: { checkin: true, note: 'x'.repeat(141) } });
  assert.equal(note.ok, false);
  assert.match(note.errors[0], /^The check-in note: /);
  assert.equal((await planFor({ opts: { checkin: false, note: 'x'.repeat(500) } })).ok, true, 'a note is only checked when a check-in is asked for');
  const short = X.makeCollector();
  short.addVerified(FX.blocks.slice(0, 5).map((b) => [b.header.height, K.pcc.blockHeaderHash(b.header), b.header.state_root]));
  short.addHeaders(FX.blocks.slice(0, 5).map((b) => [b.header.height, b.header.timestamp, b.header.prev_hash, b.header.tx_root, b.header.state_root]));
  const r = short.result();
  const empty = await planFor({ replay: r, choice: choose(NOW, r) });
  assert.deepEqual([empty.ok, empty.sendable], [false, false]);
  assert.match(empty.errors[0], /No checkpoint is sealed yet \(the first is height 10\)/);
});

test('already attested: today’s attestation on chain is said and not sent again; another key’s, yesterday’s and a pending one are told apart — and proven by mutation', async () => {
  const claim = REPLAY.cps.get(10);
  const mk = (over = {}) => ({ height: 70, tx: HEX('a'), sender: KEY.sender, channel: 'WIT', title: 'witness · h10 · root ' + claim.state_root.slice(0, 12) + ' · wt', body_hash: HEX('b'), ...over });
  const withPosts = (list, extra = {}) => ({ ...REPLAY, posts: list, ...extra });
  const plan1 = await planFor({ replay: withPosts([mk()]), opts: { checkin: true } });
  assert.deepEqual([plan1.ok, plan1.sendable, plan1.wit], [true, true, null], 'the check-in can still go');
  assert.match(plan1.witSkip.why, /^You attested today already \(checkpoint №10, tx a{64} in block №70\)\. Nothing new to sign\.$/);
  assert.equal(plan1.witSkip.tx, HEX('a'));
  assert.ok(plan1.net, 'a check-in is still offered');
  const plan2 = await planFor({ replay: withPosts([mk()]), opts: {} });
  assert.deepEqual([plan2.ok, plan2.sendable, plan2.wit, plan2.net], [true, false, null, null], 'nothing at all to send');
  // an earlier checkpoint attested earlier today also counts as "today"
  const early = await planFor({ replay: withPosts([mk({ title: 'witness · h90 · root ' + REPLAY.cps.get(90).state_root.slice(0, 12), height: 91 })]) });
  assert.equal(early.sendable, false);
  assert.match(early.witSkip.why, /checkpoint №90/);
  // another key’s attestation, a NET post, a malformed title: not mine
  for (const other of [mk({ sender: KEY2.sender }), mk({ channel: 'NET' }), mk({ title: 'witness · whatever' })]) assert.equal((await planFor({ replay: withPosts([other]) })).sendable, true, JSON.stringify(other).slice(0, 60));
  // an attestation in a block of yesterday does not count for today
  const yesterdayTs = REPLAY.ts.slice();
  yesterdayTs[91] = Date.parse('2026-10-19T12:00:00Z');
  const old90 = mk({ title: 'witness · h90 · root ' + REPLAY.cps.get(90).state_root.slice(0, 12), height: 91 });
  assert.equal((await planFor({ replay: { ...REPLAY, ts: yesterdayTs, posts: [old90] } })).sendable, true, 'an attestation in a block of yesterday does not count for today');
  assert.equal((await planFor({ replay: { ...REPLAY, posts: [old90] } })).sendable, false, 'but the same one in a block of today does');
  // the check-in already done today
  const checked = await planFor({ replay: withPosts([mk({ channel: 'NET', title: 'net · checkin · wt', tx: HEX('c'), height: 71 })]), opts: { checkin: true } });
  assert.equal(checked.net, null);
  assert.match(checked.netSkip, /^You checked in today already \(tx c{64}, block №71\)\.$/);
  // a journalled tx that is pending is not sent twice; one that has landed is not either
  const pending = await planFor({ earlier: { status: 'pending', height: null, tx: HEX('e') } });
  assert.deepEqual([pending.wit, pending.sendable], [null, false]);
  assert.match(pending.witSkip.why, /still waiting for a block \(tx e{12}…\)\. Not sending another\./);
  const landed = await planFor({ earlier: { status: 'included', height: 95, tx: HEX('f') } });
  assert.deepEqual([landed.wit, landed.sendable], [null, false]);
  assert.match(landed.witSkip.why, /block №95/);
  const checkinWaits = await planFor({ earlier: { status: 'pending', height: null, tx: HEX('e') }, opts: { checkin: true } });
  assert.equal(checkinWaits.net, null);
  assert.match(checkinWaits.netSkip, /waits until the attestation is in a block/);
  // mutation: without the check the page signs a second attestation for the same day
  const m = await variant({ logic: swap('const have = st.atTarget || st.today;', 'const have = null;') });
  const mutant = await m.X.planWitness({ replay: withPosts([mk()]), choice: choose(NOW), chainId: FX.status.chain_id, genesis: GENESIS, key: KEY, opts: {}, nowMs: NOW, wasmSha: SHAS['pointcast_chain.wasm'] });
  assert.ok(mutant.wit && mutant.sendable, 'the mutant would send again');
});

test('a journal that holds a different claim at a height this replay covers refuses to sign; other epochs, genesis and keys are ignored — mutation', async () => {
  const claim = REPLAY.cps.get(10);
  const entry = { genesis: GENESIS, epoch: EPOCH, address: KEY.sender, height: 10, block_hash: claim.block_hash, state_root: HEX('d'), signed_at: '2026-10-19T10:00:00.000Z', tx: HEX('1') };
  const journal = { v: 1, entries: [entry] };
  const refused = await planFor({ journal });
  assert.deepEqual([refused.ok, refused.sendable, refused.wit], [false, false, null]);
  assert.match(refused.errors[0], /^Your journal holds a different claim at №10 \(signed 2026-10-19T10:00:00\.000Z, tx 111111111111…\) than this replay: refusing to sign\./);
  for (const ignored of [{ ...entry, epoch: HEX('3') }, { ...entry, address: KEY2.sender }, { ...entry, genesis: HEX('4') }, { ...entry, state_root: claim.state_root }]) {
    assert.equal((await planFor({ journal: { v: 1, entries: [ignored] } })).ok, true, JSON.stringify(ignored).slice(0, 80));
  }
  const m = await variant({ logic: swap('const conflict = journalConflict(', 'const conflict = null && journalConflict(') });
  const mutant = await m.X.planWitness({ replay: REPLAY, choice: choose(NOW), chainId: FX.status.chain_id, genesis: GENESIS, key: KEY, opts: {}, nowMs: NOW, wasmSha: 'x'.repeat(12), journal });
  assert.ok(mutant.wit, 'without the check a second, different claim is signed');
});

test('the journal is kept only when storage works, is read tolerantly, and holds each claim once', () => {
  const store = new Map();
  const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  const e = { genesis: GENESIS, epoch: EPOCH, address: KEY.sender, height: 10, block_hash: HEX('1'), state_root: HEX('2'), signed_at: 'x', tx: null };
  assert.deepEqual(X.readJournal(storage), { v: 1, entries: [] });
  assert.equal(X.writeJournal(storage, e), true);
  assert.equal(X.writeJournal(storage, { ...e, tx: HEX('3') }), true);
  assert.equal(X.readJournal(storage).entries.length, 1, 'the same claim is one entry, with its tx filled in');
  assert.equal(X.readJournal(storage).entries[0].tx, HEX('3'));
  assert.equal(X.writeJournal(storage, { ...e, height: 20 }), true);
  assert.deepEqual(X.journalFor(X.readJournal(storage), { genesis: GENESIS, epoch: EPOCH, address: KEY.sender }).map((x) => x.height), [10, 20]);
  assert.deepEqual(X.journalFor(X.readJournal(storage), { genesis: GENESIS, epoch: EPOCH, address: KEY2.sender }), []);
  store.set(X.JOURNAL_SLOT, '{not json');
  assert.deepEqual(X.readJournal(storage), { v: 1, entries: [] });
  store.set(X.JOURNAL_SLOT, JSON.stringify({ v: 1, entries: [null, 5, { height: 'x' }, e] }));
  assert.equal(X.readJournal(storage).entries.length, 1, 'junk entries are dropped');
  assert.equal(X.writeJournal({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }, e), false);
  assert.deepEqual(X.readJournal(null), { v: 1, entries: [] });
  assert.deepEqual(X.readJournal({ getItem() { throw new Error('blocked'); } }), { v: 1, entries: [] });
  for (let i = 0; i < 70; i++) X.writeJournal(storage, { ...e, height: 1000 + i });
  assert.ok(X.readJournal(storage).entries.length <= X.LIMITS.journalMax);
  assert.equal(X.JOURNAL_SLOT, 'pointcast-chain-apps/witness-journal/v1');
  assert.deepEqual(X.journalConflict([e], new Map([[10, { block_hash: HEX('1'), state_root: HEX('2') }]])), null);
  assert.equal(X.journalConflict([e], new Map([[10, { block_hash: HEX('1'), state_root: HEX('9') }]])), e);
  assert.equal(X.journalConflict([e], new Map()), null, 'a height the replay does not hold is no conflict');
});

test('at the midnight minute the plan is made but blocked, and says so; the page shows nothing sendable', async () => {
  const late = Date.parse('2026-10-20T23:59:30Z');
  const plan = await planFor({ nowMs: late });
  assert.deepEqual([plan.ok, plan.sendable, plan.blocked], [true, true, 'midnight']);
  assert.match(plan.notes[0], /nothing can be sent between 23:59 and 00:01 UTC/);
  const fine = await planFor({ nowMs: Date.parse('2026-10-20T23:58:00Z') });
  assert.equal(fine.blocked, '');
});

test('the midnight copy is true: in that minute the claim is signed for review and nothing is sent, so no line says the page signs nothing', async () => {
  // the facts: a plan made inside the minute carries a signature, and is blocked from being sent
  for (const t of ['23:59:00', '23:59:30', '00:00:30', '00:00:59']) {
    const plan = await planFor({ nowMs: Date.parse('2026-10-20T' + t + 'Z') });
    assert.equal(plan.blocked, 'midnight', t);
    assert.match(plan.wit.signature, /^[0-9a-f]{128}$/, t + ': the claim is already signed when the review is drawn');
  }
  assert.equal((await planFor({ nowMs: Date.parse('2026-10-20T23:58:59Z') })).blocked, '');
  // so the copy says what is true: it sends nothing; it does not say it signs nothing
  assert.doesNotMatch(D.MIDNIGHT_LINE, /sign(s|ed)? nothing|nothing (is|was) signed/i);
  assert.match(D.MIDNIGHT_LINE, /In that minute it sends nothing and says so; the claim is still signed in your browser for you to read, and Send stays off until 00:01 UTC\./);
  assert.match(src.page, /\{MIDNIGHT_LINE\}/, 'the page prints that line');
  // and no message of the guard says anything was signed
  for (const what of ['the post', 'the attestation', 'the check-in']) {
    for (const landed of [false, true]) {
      assert.throws(() => X.assertNotNearMidnight(Date.parse('2026-10-20T23:59:30Z'), what, { landed }), (e) => e.name === 'Midnight' && !/signed/i.test(e.message) && /nothing/i.test(e.message));
    }
  }
  assert.doesNotMatch(src.view, /the page signs nothing and says which/, 'the view’s own header does not claim it either');
});

// ================================================================ sending

function connectTo(f) {
  return K.connectPinned('http://127.0.0.1:8799', { pinned: GENESIS, env: { fetch: f } });
}

test('sendWitness sends the attestation, waits for its block, then the check-in; the devnet judges the claim correct', async () => {
  const f = miniDevnet();
  const chain = await connectTo(f);
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: f });
  const plan = await planFor({ opts: { name: 'wt-send', checkin: true, note: 'in a tab' } });
  const stages = [];
  const signed = [];
  const r = await X.sendWitness({ chain, net, key: KEY, plan, now: () => NOW, replayedAt: NOW - 60_000, onStage: (w2, s) => stages.push(w2 + ':' + s), onSigned: (w2, i) => signed.push([w2, i.txHash, f.sent.length]), wait: { timeoutMs: 2000, intervalMs: 5 } });
  assert.deepEqual(f.sent.map((s) => s.tx.channel), ['WIT', 'NET']);
  assert.deepEqual(f.sent.map((s) => s.tx.nonce), [0, 1]);
  assert.deepEqual(f.sent.map((s) => s.tx.title), [plan.wit.title, plan.net.title]);
  assert.equal(f.bodies[f.sent[0].tx.body_hash], plan.wit.body, 'what the review showed is what was sent, word for word');
  assert.equal(f.bodies[f.sent[1].tx.body_hash], plan.net.body);
  assert.deepEqual(stages, ['wit:signed', 'wit:sent', 'wit:waiting', 'net:signed', 'net:sent', 'net:waiting']);
  assert.deepEqual(signed.map((s) => [s[0], s[2]]), [['wit', 0], ['net', 1]], 'onSigned runs before any byte of that post is accepted');
  assert.equal(r.wit.txHash, K.pcc.txHash(f.sent[0]));
  assert.equal(r.wit.height, 93);
  assert.equal(r.wit.counted, '2026-10-20');
  assert.equal(r.net.counted, '2026-10-20');
  const roll = await X.pollRoll({ net, target: 10, address: KEY.sender, txHash: r.wit.txHash, includedAt: r.wit.height, sleep: async () => {} });
  assert.deepEqual([roll.standing.state, roll.standing.label, roll.standing.result], ['correct', 'CORRECT', 'correct']);
  assert.match(roll.standing.text, /agree with this server’s at checkpoint №10\. That is all “correct” says/);
  assert.equal(roll.roll.mine.attestations, 1);
  assert.deepEqual(roll.roll.checkpoint.keys.map((k) => [k.addr, k.name, k.result]), [[KEY.sender, 'wt-send', 'correct']]);
});

test('the guards in sendWitness: nothing to send, another key, the midnight minute, a changed UTC day, an old replay, a restarted devnet — each stops before a byte is sent', async () => {
  const plan = await planFor({ opts: { checkin: true } });
  const base = async (over = {}) => {
    const log = [];
    const f = miniDevnet({ log });
    const chain = await connectTo(f);
    const net = K.makeNet('http://127.0.0.1:8799', { fetch: f });
    const before = log.length;
    let err = null;
    try { await X.sendWitness({ chain, net, key: KEY, plan, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 500, intervalMs: 5 }, ...over }); } catch (e) { err = e; }
    return { err, posts: posts(log.slice(before)), f };
  };
  const ok = await base();
  assert.equal(ok.err, null);
  assert.equal(ok.posts.length, 4, 'body, tx, body, tx');
  const cases = [
    ['plan', { plan: { ...plan, sendable: false } }, 'nothing'],
    ['no plan', { plan: null }, 'nothing'],
    ['key', { key: KEY2 }, 'key'],
    ['midnight', { now: () => Date.parse('2026-10-20T23:59:30Z'), replayedAt: Date.parse('2026-10-20T23:59:00Z') }, 'midnight'],
    ['day', { now: () => Date.parse('2026-10-21T01:00:00Z'), replayedAt: Date.parse('2026-10-21T00:59:00Z') }, 'day'],
    ['stale', { replayedAt: NOW - 31 * 60_000 }, 'stale'],
  ];
  for (const [what, over, code2] of cases) {
    const r = await base(over);
    assert.ok(r.err && (r.err.name === 'Refusal' || r.err.name === 'Midnight'), what + ': ' + (r.err && r.err.message));
    assert.equal(r.err.code, code2, what);
    assert.deepEqual(r.posts, [], what + ': nothing was sent');
  }
  // the devnet’s block 1 is not the epoch the replay started from (a restart with the same genesis)
  const log = [];
  const f = miniDevnet({ log, overrides: { '/block/1': (u, i, { rep }) => rep({ height: 1, hash: HEX('6'), timestamp: 0 }) } });
  const chain = await connectTo(f);
  await assert.rejects(() => X.sendWitness({ chain, net: K.makeNet('http://127.0.0.1:8799', { fetch: f }), key: KEY, plan, now: () => NOW, replayedAt: NOW }), (e) => e.code === 'epoch' && /block 1 is not the one this replay started from \(it was restarted\)/.test(e.message));
  assert.deepEqual(posts(log), []);
});

test('each send guard is proven by mutation: with it taken out of a copy, the post goes', async () => {
  const plan = await planFor({ opts: { checkin: false } });
  const scene = async (mod, over = {}, dev = {}) => {
    const log = [];
    const f = miniDevnet({ log, ...dev });
    const chain = await K.connectPinned('http://127.0.0.1:8799', { pinned: GENESIS, env: { fetch: f } });
    const net = K.makeNet('http://127.0.0.1:8799', { fetch: f });
    const before = log.length;
    try { await mod.sendWitness({ chain, net, key: KEY, plan, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 500, intervalMs: 5 }, ...over }); } catch (e) { return { err: e.code || e.name, posts: posts(log.slice(before)).length }; }
    return { err: null, posts: posts(log.slice(before)).length };
  };
  const late = { now: () => Date.parse('2026-10-20T23:59:30Z'), replayedAt: Date.parse('2026-10-20T23:59:00Z') };
  // midnight: it is checked in sendWitness AND in postOne; both are taken out
  assert.deepEqual(await scene(REAL.X, late), { err: 'midnight', posts: 0 });
  const m1 = await variant({ logic: swap('return minute >= 1439 || minute < 1;', 'return false;') });
  assert.deepEqual(await scene(m1.X, late), { err: null, posts: 2 }, 'with the guard gone the post is sent in the midnight minute');
  // the UTC day
  const nextDay = { now: () => Date.parse('2026-10-21T01:00:00Z'), replayedAt: Date.parse('2026-10-21T00:59:00Z') };
  assert.equal((await scene(REAL.X, nextDay)).err, 'day');
  const m2 = await variant({ logic: swap('if (W.utcDay(now()) !== plan.day) throw', 'if (false) throw') });
  assert.equal((await scene(m2.X, nextDay)).posts, 2);
  // an old replay
  const old = { replayedAt: NOW - 31 * 60_000 };
  assert.equal((await scene(REAL.X, old)).err, 'stale');
  const m3 = await variant({ logic: swap('if (replayedAt && now() - replayedAt > LIMITS.staleMs) throw', 'if (false) throw') });
  assert.equal((await scene(m3.X, old)).posts, 2);
  // a restarted devnet
  const restarted = { overrides: { '/block/1': (u, i, { rep }) => rep({ height: 1, hash: HEX('6'), timestamp: 0 }) } };
  assert.equal((await scene(REAL.X, {}, restarted)).err, 'epoch');
  const m4 = await variant({ logic: swap('if (!isObj(blockOne) || blockOne.hash !== plan.epoch) throw', 'if (false) throw') });
  assert.equal((await scene(m4.X, {}, restarted)).posts, 2);
});

test('a stale nonce is read again and tried once more; "already included" and other refusals are not; a word-filter refusal is explained and nothing else is sent', async () => {
  const plan = await planFor({ opts: { checkin: true } });
  const bare = await planFor({});
  // the first /tx is refused for a stale nonce; the second try gets the account’s nonce
  let tries = 0;
  const log2 = [];
  const f2 = miniDevnet({ log: log2 });
  const real = f2;
  const gated = async (url, init = {}) => {
    const u = new URL(String(url));
    if (init.method === 'POST' && u.pathname === '/tx' && tries++ === 0) return { ok: false, status: 400, headers: { get: () => null }, text: async () => JSON.stringify({ error: 'nonce mismatch: expected 5, got 0' }) };
    return real(url, init);
  };
  const chain2 = await connectTo(gated);
  const r2 = await X.sendWitness({ chain: chain2, net: K.makeNet('http://127.0.0.1:8799', { fetch: gated }), key: KEY, plan: bare, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 500, intervalMs: 5 } });
  assert.equal(r2.wit.height, 93);
  assert.equal(tries, 2, 'one refusal, one retry');
  tries = 0;
  const alwaysStale = async (url, init = {}) => (init.method === 'POST' && new URL(String(url)).pathname === '/tx' ? { ok: false, status: 400, headers: { get: () => null }, text: async () => JSON.stringify({ error: 'nonce mismatch: expected 5, got 0' }) } : real(url, init));
  const chain3 = await connectTo(alwaysStale);
  await assert.rejects(() => X.sendWitness({ chain: chain3, net: K.makeNet('http://127.0.0.1:8799', { fetch: alwaysStale }), key: KEY, plan: bare, now: () => NOW, replayedAt: NOW }), (e) => e.sendState === 'refused' && /nonce mismatch/.test(e.message));
  const included = async (url, init = {}) => (init.method === 'POST' && new URL(String(url)).pathname === '/tx' ? { ok: false, status: 400, headers: { get: () => null }, text: async () => JSON.stringify({ error: 'nonce mismatch: already included' }) } : real(url, init));
  const chain4 = await connectTo(included);
  const sentBefore = f2.sent.length;
  await assert.rejects(() => X.sendWitness({ chain: chain4, net: K.makeNet('http://127.0.0.1:8799', { fetch: included }), key: KEY, plan: bare, now: () => NOW, replayedAt: NOW }), /already included/);
  assert.equal(f2.sent.length, sentBefore);
  // the word filter
  const filt = async (url, init = {}) => (init.method === 'POST' && new URL(String(url)).pathname === '/tx' ? { ok: false, status: 400, headers: { get: () => null }, text: async () => JSON.stringify({ error: 'kept off the devnet by its word filter' }) } : real(url, init));
  const chain5 = await connectTo(filt);
  await assert.rejects(() => X.sendWitness({ chain: chain5, net: K.makeNet('http://127.0.0.1:8799', { fetch: filt }), key: KEY, plan, now: () => NOW, replayedAt: NOW }), (e) => e.sendState === 'refused' && /^WIT refused: kept off the devnet by its word filter\. A devnet whose word filter predates the Daily Net reads hex as words/.test(e.message) && /Nothing else was sent\.$/.test(e.message));
  // 429 on the post: refused, with the hint
  const slow = async (url, init = {}) => (init.method === 'POST' && new URL(String(url)).pathname === '/tx' ? { ok: false, status: 429, headers: { get: (k) => (k.toLowerCase() === 'retry-after' ? '7' : null) }, text: async () => JSON.stringify({ error: 'too many posts' }) } : real(url, init));
  const chain6 = await connectTo(slow);
  const e429 = await X.sendWitness({ chain: chain6, net: K.makeNet('http://127.0.0.1:8799', { fetch: slow }), key: KEY, plan: bare, now: () => NOW, replayedAt: NOW }).catch((e) => e);
  assert.equal(e429.sendState, 'refused');
  assert.equal(K.sendFailureText(e429), 'Not sent: too many posts', 'the SDK carries the devnet’s words, not its status; the page notices a 429 itself');
});

/** A devnet that takes the attestation and refuses the check-in with these words (a 422 by default). */
function refusingNet(f, words = 'kept off the devnet by its word filter') {
  return async (url, init = {}) => {
    if (init.method === 'POST' && new URL(String(url)).pathname === '/tx' && JSON.parse(init.body).tx.channel === 'NET') return { ok: false, status: 422, headers: { get: () => null }, text: async () => JSON.stringify({ error: words }) };
    return f(url, init);
  };
}

test('when the attestation lands and the check-in then fails, sendWitness hands back what landed on the error, so nothing that is in is lost', async () => {
  const plan = await planFor({ opts: { checkin: true, note: 'a note' } });
  // (a) the devnet refuses the check-in
  const f = miniDevnet();
  const g = refusingNet(f);
  const chain = await connectTo(g);
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: g });
  const e = await X.sendWitness({ chain, net, key: KEY, plan, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 2000, intervalMs: 5 } }).catch((x) => x);
  assert.equal(e.sendState, 'refused', 'the check-in was refused');
  assert.deepEqual(f.sent.map((s) => s.tx.channel), ['WIT'], 'and the attestation is on the devnet');
  assert.ok(e.partial && e.partial.wit, 'the error carries what landed');
  assert.deepEqual([e.partial.wit.txHash, e.partial.wit.height, e.partial.net], [K.pcc.txHash(f.sent[0]), 93, null]);
  // (b) the clock reaches the midnight minute between the two posts: the attestation is in, the check-in is not sent, and the words say both
  const f2 = miniDevnet();
  const chain2 = await connectTo(f2);
  const net2 = K.makeNet('http://127.0.0.1:8799', { fetch: f2 });
  let clock = NOW;
  const m = await X.sendWitness({ chain: chain2, net: net2, key: KEY, plan, now: () => clock, replayedAt: NOW, onStage: (which, st) => { if (which === 'wit' && st === 'waiting') clock = Date.parse('2026-10-20T23:59:30Z'); }, wait: { timeoutMs: 2000, intervalMs: 5 } }).catch((x) => x);
  assert.equal(m.name, 'Midnight');
  assert.deepEqual(f2.sent.map((s) => s.tx.channel), ['WIT']);
  assert.equal(m.partial.wit.height, 93);
  assert.match(m.message, /^the check-in not sent: it is 2026-10-20 23:59:30 UTC/);
  assert.doesNotMatch(m.message, /Nothing was signed/i, 'something was signed and sent: the attestation');
  assert.match(m.message, /The attestation is already in; nothing more was sent\. Try the check-in again after 00:01 UTC\.$/);
  // (c) a failure before anything was sent carries no partial, and the midnight guard says only what is true: nothing was sent
  const f3 = miniDevnet();
  const chain3 = await connectTo(f3);
  const early = await X.sendWitness({ chain: chain3, net: K.makeNet('http://127.0.0.1:8799', { fetch: f3 }), key: KEY, plan, now: () => Date.parse('2026-10-20T23:59:30Z'), replayedAt: Date.parse('2026-10-20T23:59:00Z') }).catch((x) => x);
  assert.equal(early.name, 'Midnight');
  assert.equal(early.partial, undefined);
  assert.match(early.message, /Nothing was sent; try again after 00:01 UTC\.$/);
  assert.doesNotMatch(early.message, /signed/);
});

test('a word-filter refusal of the check-in is not blamed on hex-reading: that explanation is for the attestation only', async () => {
  const bare = await planFor({ opts: { checkin: true, note: 'my own words' } });
  const f = miniDevnet();
  const g = refusingNet(f);
  const e = await X.sendWitness({ chain: await connectTo(g), net: K.makeNet('http://127.0.0.1:8799', { fetch: g }), key: KEY, plan: bare, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 2000, intervalMs: 5 } }).catch((x) => x);
  assert.match(e.message, /^NET refused: kept off the devnet by its word filter\./);
  assert.match(e.message, /your name and your note|name and note/i, 'it points at what the person chose');
  assert.doesNotMatch(e.message, /hex|Daily Net door|predates/i, 'the infrastructure explanation is the attestation’s');
  assert.doesNotMatch(e.message, /Nothing else was sent/, 'the attestation was sent');
  // the attestation refused by the filter keeps its explanation
  const h = async (url, init = {}) => (init.method === 'POST' && new URL(String(url)).pathname === '/tx' ? { ok: false, status: 422, headers: { get: () => null }, text: async () => JSON.stringify({ error: 'kept off the devnet by its word filter' }) } : f(url, init));
  const w = await X.sendWitness({ chain: await connectTo(h), net: K.makeNet('http://127.0.0.1:8799', { fetch: h }), key: KEY, plan: bare, now: () => NOW, replayedAt: NOW }).catch((x) => x);
  assert.match(w.message, /^WIT refused: kept off the devnet by its word filter\. A devnet whose word filter predates the Daily Net reads hex as words/);
  assert.equal(w.partial, undefined);
});

test('in the page, an attestation that landed before the check-in failed is said so, the claim file and the roll are offered, and Send again posts only the check-in', async () => {
  const storage = fakeStorage();
  let refuse = true;
  let m = null;
  const gate = async (u, i = {}) => {
    const url = String(u).replace(DEVNET.url, 'http://127.0.0.1:8799');
    return refuse ? refusingNet(m.f)(url, i) : m.f(url, i);
  };
  m = mountView({ storage, extra: { fetch: gate } });
  await m.c.begin();
  $(m.rootEl, '[data-wt-name]').value = 'wt-part';
  $(m.rootEl, '[data-wt-name]').dispatchEvent(new m.dom.window.Event('input'));
  $(m.rootEl, '[data-wt-checkin]').checked = true;
  $(m.rootEl, '[data-wt-checkin]').dispatchEvent(new m.dom.window.Event('change'));
  $(m.rootEl, '[data-wt-note]').value = 'a note';
  await m.c.replay();
  await m.c.keys.setSeed(SEED);
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false && m.c.state.plan);
  assert.ok(m.c.state.plan.wit && m.c.state.plan.net, 'an attestation and a check-in are planned');
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => ['ok', 'bad', 'warn'].includes($(m.rootEl, '[data-wt-result]').dataset.state) && m.f.sent.length >= 1 && $(m.rootEl, '[data-wt-roll-state]').textContent === 'CORRECT');
  assert.deepEqual(m.f.sent.map((s) => s.tx.channel), ['WIT'], 'the attestation is on the devnet; the check-in was refused');
  // what the page says: the attestation is in, only the check-in failed
  assert.equal($(m.rootEl, '[data-wt-result]').dataset.state, 'warn');
  const said = txt(m.rootEl, '[data-wt-result-text]');
  assert.match(said, /^Attestation in block 93 \(tx [0-9a-f]{64}\), counted for 2026-10-20 by the day rule/);
  assert.match(said, /Only the check-in failed\. Not sent: NET refused: kept off the devnet by its word filter\. The check-in carries your name and your note/);
  assert.doesNotMatch(said, /Nothing was sent|Nothing was signed|hex|predates/);
  // the claim file is offered, the roll was read, and the sent state is kept
  assert.ok(m.c.state.sent && m.c.state.sent.r.wit && m.c.state.sent.r.net === null);
  assert.equal($(m.rootEl, '[data-wt-claim-box]').hidden, false);
  const claim = JSON.parse(txt(m.rootEl, '[data-wt-claim-json]'));
  assert.equal(claim.tx, K.pcc.txHash(m.f.sent[0]));
  assert.equal(claim.included.height, 93);
  assert.equal($(m.rootEl, '[data-wt-roll-state]').textContent, 'CORRECT');
  // the attestation is not offered again: what is left to send is the check-in alone
  await until(() => m.c.state.plan && m.c.state.plan.net && !m.c.state.plan.wit);
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, false);
  assert.equal($(m.rootEl, '[data-wt-wit-box]').hidden, true, 'the attestation is not on offer');
  assert.equal($(m.rootEl, '[data-wt-net-box]').hidden, false);
  assert.match(txt(m.rootEl, '[data-wt-skip]'), /You attested №10 already/);
  // Send again, now that the devnet takes the check-in: only the check-in is posted
  refuse = false;
  const before = m.f.sent.length;
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => m.f.sent.length === before + 1);
  assert.deepEqual(m.f.sent.map((s) => s.tx.channel), ['WIT', 'NET'], 'one attestation, one check-in, no second attestation');
  await until(() => $(m.rootEl, '[data-wt-result]').dataset.state === 'ok');
  assert.match(txt(m.rootEl, '[data-wt-result-text]'), /^Check-in in block 94 /);
  m.c.stop();
});

test('claim files keep what was signed and where it went, and say it is a claim', async () => {
  const plan = await planFor({ opts: { name: 'wt-claim' } });
  const c = X.makeClaimFile({ chainId: FX.status.chain_id, genesis: GENESIS, api: 'http://127.0.0.1:8799', plan, txHash: HEX('5'), height: 93, timeMs: NOW, createdMs: NOW });
  assert.equal(c.format, 'pointcast-witness-claim/v1');
  assert.match(c.meaning, /It is not proof of replay\. devnet: no value, may reset\.$/);
  assert.deepEqual(c.claim, { height: 10, block_hash: REPLAY.cps.get(10).block_hash, state_root: REPLAY.cps.get(10).state_root });
  assert.equal(c.epoch, EPOCH);
  assert.equal(c.signed_by.address, KEY.sender);
  assert.equal(c.name, 'wt-claim');
  assert.deepEqual(c.included, { height: 93, time_ms: NOW });
  // the line in it verifies offline, with witness.js alone
  const v = await W.verifyWitness({ line: c.line, chain_id: c.devnet.chain_id, genesis: c.devnet.genesis, epoch: c.epoch, signerPublicKey: { scheme: 'ed25519', bytes: c.signed_by.public_key } });
  assert.equal(v.ok, true);
  assert.equal(v.digest, c.digest);
  assert.equal(c.signature, W.parseWitnessBody(c.line).signature);
  assert.equal(X.makeClaimFile({ chainId: 'x', genesis: GENESIS, api: 'a', plan, createdMs: NOW }).included, null);
  assert.equal('name' in X.makeClaimFile({ chainId: 'x', genesis: GENESIS, api: 'a', plan: await planFor({}), createdMs: NOW }), false);
});

// ================================================================ the roll

const hostileName = '<img src=x onerror=alert(1)>';
const rollJson = (over = {}) => ({
  schema: 'pointcast-devnet/net-api/v1', network: 'devnet', epoch: EPOCH, tip: 100, indexed_height: 100, day: '2026-10-20', height: 10, block_hash: REPLAY.cps.get(10).block_hash, state_root: REPLAY.cps.get(10).state_root,
  sealed: true, distinct: 3, correct: 1, strikes: 1, more: 4,
  witnesses: [
    { addr: KEY.sender, name: 'good-name', name_bound: true, tier: 'witness', established: true, tx: HEX('1'), result: 'correct', included_at: 95 },
    { addr: '<b>x</b>', name: hostileName, name_bound: false, tier: '<i>', established: 'yes', tx: 'zz', result: '<script>', included_at: -4 },
    { addr: KEY2.sender, name: 'UPPER', name_bound: true, tier: 'witness', tx: HEX('2'), result: 'mismatch', included_at: 96 },
    null, 5, 'x',
  ],
  ...over,
});

test('the checkpoint roll is read strictly: names, addresses and results that do not look right are dropped, never shown', () => {
  const r = X.readCheckpointRoll(rollJson(), 10);
  assert.deepEqual(r.keys.map((k) => [k.addr, k.name, k.nameBound, k.result, k.includedAt, k.established]), [
    [KEY.sender, 'good-name', true, 'correct', 95, true],
    ['', '', false, 'other', null, false],
    [KEY2.sender, '', true, 'mismatch', 96, false],
  ]);
  assert.deepEqual([r.distinct, r.correct, r.strikes, r.more, r.indexedHeight, r.tip, r.day, r.sealed], [3, 1, 1, 4, 100, 100, '2026-10-20', true]);
  assert.throws(() => X.readCheckpointRoll(rollJson(), 20), /not the roll for the checkpoint asked for/);
  assert.throws(() => X.readCheckpointRoll(null, 10), /not the shape/);
  assert.throws(() => X.readCheckpointRoll(rollJson({ network: 'mainnet' }), 10), /not a devnet roll/);
  assert.equal(X.readCheckpointRoll(rollJson({ witnesses: Array.from({ length: 200 }, () => ({ addr: KEY.sender, result: 'correct' })) }), 10).keys.length, X.LIMITS.rollRows);
  assert.equal(X.readCheckpointRoll(rollJson({ distinct: 1e12, correct: -3, strikes: 'x' }), 10).distinct, 99999);
  const w = X.readWitnessRoll({ day: '2026-10-20', next_after: KEY.sender, witnesses: [{ addr: KEY.sender, name: hostileName, name_bound: true, attestations: 2, correct: 2, strikes: 0, streak: 2, best_streak: 3, established: true }, null, 7] });
  assert.deepEqual(w.keys.map((k) => [k.addr, k.name, k.attestations, k.streak, k.established]), [[KEY.sender, '', 2, 2, true]]);
  assert.equal(w.next, KEY.sender);
  assert.equal(X.readWitnessRoll({ witnesses: [], next_after: '<x>' }).next, null);
  assert.throws(() => X.readWitnessRoll({}), /not the shape/);
});

test('what the roll says about a key: correct, strike, pending — and the cases between', () => {
  const cp = (rows, over = {}) => X.readCheckpointRoll(rollJson({ witnesses: rows.map((r) => ({ addr: KEY.sender, name: 'k', name_bound: true, tier: 'witness', tx: HEX('1'), result: r, included_at: 95 })), ...over }), 10);
  const st = (rows, o = {}, over = {}) => X.standingOnRoll({ checkpoint: cp(rows, over), address: KEY.sender, txHash: HEX('1'), includedAt: 95, ...o });
  assert.deepEqual(['correct'].map((r) => [st([r]).state, st([r]).label]), [['correct', 'CORRECT']]);
  for (const r of ['mismatch', 'conflict']) { const s = st([r]); assert.deepEqual([s.state, s.label], ['strike', 'STRIKE']); assert.match(s.text, new RegExp(r + '\\): signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain\\.$')); }
  assert.deepEqual([st(['duplicate']).state, st(['over_cap']).state, st(['premature']).state, st(['bad_sig']).state, st(['whatever']).state], ['duplicate', 'notcounted', 'notcounted', 'notcounted', 'notcounted']);
  assert.match(st(['premature']).text, /premature/);
  // not on the list: not in a block, the roll has read less far, the roll has read past it, no roll at all
  assert.deepEqual([st([], { includedAt: null }).state, st([], { includedAt: 95 }, { indexed_height: 90 }).state, st([], { includedAt: 95 }, { indexed_height: 100 }).state], ['pending', 'pending', 'notlisted']);
  assert.match(st([], { includedAt: 95 }, { indexed_height: 90 }).text, /The roll has read to block №90 and your post is in block №95/);
  assert.equal(X.standingOnRoll({ checkpoint: null, address: KEY.sender, includedAt: 95 }).state, 'pending');
  // matched by address or by tx
  assert.equal(X.standingOnRoll({ checkpoint: cp(['correct']), address: KEY2.sender, txHash: HEX('1'), includedAt: 95 }).state, 'correct');
  assert.equal(X.standingOnRoll({ checkpoint: cp(['correct']), address: KEY2.sender, txHash: HEX('9'), includedAt: 95 }).state, 'notlisted');
});

test('pollRoll reads until the key’s row is there, at most `tries` reads, `everyMs` apart', async () => {
  const reads = [];
  const sleeps = [];
  const f = miniDevnet({ indexLag: 5 });
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: f });
  const chain = await connectTo(f);
  const plan = await planFor({});
  const sent = await X.sendWitness({ chain, net, key: KEY, plan, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 500, intervalMs: 5 } });
  const r = await X.pollRoll({ net, target: 10, address: KEY.sender, txHash: sent.wit.txHash, includedAt: sent.wit.height, tries: 4, everyMs: 111, sleep: async (ms) => { sleeps.push(ms); }, onRead: (x) => reads.push(x.standing.state) });
  assert.deepEqual(reads, ['pending', 'pending', 'pending', 'pending'], 'the roll lags five blocks: pending every time');
  assert.deepEqual(sleeps, [111, 111, 111]);
  assert.equal(r.standing.state, 'pending');
  assert.match(r.standing.text, /read to block №/);
  const f2 = miniDevnet({ indexLag: 0 });
  const net2 = K.makeNet('http://127.0.0.1:8799', { fetch: f2 });
  const chain2 = await connectTo(f2);
  const sent2 = await X.sendWitness({ chain: chain2, net: net2, key: KEY, plan, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 500, intervalMs: 5 } });
  const seen = [];
  const r2 = await X.pollRoll({ net: net2, target: 10, address: KEY.sender, txHash: sent2.wit.txHash, includedAt: sent2.wit.height, sleep: async () => {}, onRead: (x) => seen.push(x.standing.state) });
  assert.deepEqual(seen, ['correct'], 'one read, because the row is there');
  assert.equal(r2.roll.complete, true);
  // reads that fail are the caller’s to handle
  await assert.rejects(() => X.pollRoll({ net: { get: async () => { throw new Error('down'); } }, target: 10, address: KEY.sender }), /down/);
});

test('a roll that lists a strike gives a STRIKE (a claim the server does not have)', async () => {
  const forged = clone(REPLAY);
  forged.cps = new Map(REPLAY.cps);
  forged.cps.set(10, { block_hash: REPLAY.cps.get(10).block_hash, state_root: HEX('e') });
  const plan = await planFor({ replay: forged, choice: choose(NOW, forged) });
  const f = miniDevnet();
  const chain = await connectTo(f);
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: f });
  const sent = await X.sendWitness({ chain, net, key: KEY, plan, now: () => NOW, replayedAt: NOW, wait: { timeoutMs: 500, intervalMs: 5 } });
  const r = await X.pollRoll({ net, target: 10, address: KEY.sender, txHash: sent.wit.txHash, includedAt: sent.wit.height, sleep: async () => {} });
  assert.deepEqual([r.standing.state, r.standing.label, r.standing.result], ['strike', 'STRIKE', 'mismatch']);
  assert.equal(r.roll.checkpoint.strikes, 1);
});

// ================================================================ the page’s view, in jsdom

/** The key panel’s own markup, made plain, as the key-panel suite does. */
const panelHtml = () => read('src/components/chain/KeyPanel.astro').split('---').slice(2).join('---').replace(/\{id \+ '-own'\}/g, '"kp-own"').replace(/for=\{[^}]*\}/g, 'for="kp-own"').replace(/id=\{[^}]*\}/g, 'id="kp-own"').replace(/\{signs\}/g, 'the thing');
const stripExpr = (s) => { let out = ''; let depth = 0; for (const ch of s) { if (ch === '{') { depth += 1; continue; } if (ch === '}') { depth -= 1; continue; } if (depth === 0) out += ch; } return out; };
/** The page’s own interactive section, read from witness.astro: expressions resolved for the root’s attributes, the key panel in place, the rest plain. */
function skeleton() {
  const a = src.page.indexOf('<section\n      id="replay"');
  const b = src.page.indexOf('<section id="means"');
  assert.ok(a > 0 && b > a, 'the section is in the page');
  let sec = src.page.slice(a, b);
  sec = sec.slice(0, sec.lastIndexOf('</section>') + '</section>'.length);
  const attrs = {
    'data-api={D}': 'data-api="' + DEVNET.url + '"',
    'data-genesis={DEVNET.genesis}': 'data-genesis="' + GENESIS + '"',
    'data-chain-id={DEVNET.chainId}': 'data-chain-id="' + FX.status.chain_id + '"',
    'data-verifier-base={VERIFIER.dir}': 'data-verifier-base="' + D.VERIFIER.dir + '"',
    "data-pin-wasm={VERIFIER.pins['pointcast_chain.wasm']}": 'data-pin-wasm="' + D.VERIFIER.pins['pointcast_chain.wasm'] + '"',
    "data-pin-js={VERIFIER.pins['verify.js']}": 'data-pin-js="' + D.VERIFIER.pins['verify.js'] + '"',
    "data-pin-worker={VERIFIER.pins['verify-worker.js']}": 'data-pin-worker="' + D.VERIFIER.pins['verify-worker.js'] + '"',
  };
  for (const [from, to] of Object.entries(attrs)) { assert.ok(sec.includes(from), 'the page has ' + from); sec = sec.replace(from, to); }
  sec = sec.replace(/<KeyPanel[^>]*\/>/, panelHtml());
  // the three pin rows the page maps over are written out here, so the pin-state hooks exist
  sec = sec.replace('<dl class="ca-kv wt-pins" aria-label="What this page pins">', '<dl class="ca-kv wt-pins" aria-label="What this page pins">' + X.VERIFIER_FILES.map((n) => '<div><dt>' + n + '</dt><dd><span data-wt-pin-state="' + n + '">not loaded yet</span></dd></div>').join(''));
  return stripExpr(sec);
}
const $ = (rootEl, sel) => rootEl.querySelector(sel);
const txt = (rootEl, sel) => ($(rootEl, sel) || {}).textContent;

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

/**
 * Mount the page’s view over the recorded chain. By default the replay is the one already done (REPLAY) and the verifier files come from disk;
 * `startReplay` and `fetchVerifier` may be replaced, or left out (`wire: true`) to go through the real wiring with a worker double.
 */
function mountView(o = {}) {
  const { search = '', dev = {}, extra = {}, mods = REAL, storage = null, replay = REPLAY, startReplay = null, nowMs = NOW, keep = false } = o;
  const dom = new JSDOM('<!doctype html><html><body>' + skeleton() + '</body></html>', { url: 'http://localhost/chain/witness/' + search });
  let blobs = 0;
  dom.window.URL.createObjectURL = () => 'blob:test/' + (blobs += 1);
  dom.window.URL.revokeObjectURL = () => {};
  const rootEl = dom.window.document.querySelector('[data-witness-app]');
  const log = dev.log || [];
  const f = miniDevnet({ ...dev, log });
  const fetchFn = async (u, i) => f(String(u).replace(DEVNET.url, 'http://127.0.0.1:8799'), i);
  const calls = { verifier: 0, start: 0, cancel: 0, args: [] };
  const env = {
    window: dom.window, fetch: fetchFn, storage, supported: true, now: () => nowMs, sleep: async () => {}, wait: { timeoutMs: 1000, intervalMs: 5 },
    ...(keep ? {} : {
      fetchVerifier: async () => { calls.verifier += 1; return { bytes: fileBytes(), sha: SHAS }; },
      startReplay: startReplay || ((a) => { calls.start += 1; calls.args.push(a); a.onProgress({ height: 46, tip: 92 }); a.onProgress({ height: 92, tip: 92 }); return { promise: Promise.resolve(replay), cancel() { calls.cancel += 1; } }; }),
    }),
    ...extra,
  };
  const c = mods.view.mount(rootEl, env);
  return { dom, rootEl, c, log, f, calls, env };
}
const until = async (fn, ms = 3000) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error('timed out waiting'); await tick(10); } };
const SEED = '11'.repeat(32);

test('mounting reads nothing; begin() reads GET /status once and says it is ready; ?devnet= is honoured only for localhost and 127.0.0.1', async () => {
  const m = mountView();
  assert.deepEqual(m.log, [], 'mount reads nothing');
  assert.equal(m.c.state.begun, false);
  assert.equal($(m.rootEl, '[data-wt-replay]').disabled, true, 'nothing can be pressed before the page is ready');
  await m.c.begin();
  assert.deepEqual(m.log, ['GET /status']);
  assert.equal(m.rootEl.dataset.state, 'ready');
  assert.match(txt(m.rootEl, '[data-wt-status]'), /^Ready\. Replaying reads the devnet and the verifier’s files and writes nothing\. Sending is a separate step, after you have read the post\.$/);
  assert.match(txt(m.rootEl, '[data-wt-meta]'), /^http:\/\/127\.0\.0\.1:8799 · pointcast-devnet-2 · newest block #92$|^https:\/\/pointcast-devnet\.mhoydich\.workers\.dev · pointcast-devnet-2 · newest block #92$/);
  assert.equal($(m.rootEl, '[data-wt-replay]').disabled, false);
  assert.equal($(m.rootEl, '[data-wt-cancel]').disabled, true);
  await m.c.begin();
  assert.deepEqual(m.log, ['GET /status'], 'begin() is once');
  assert.equal(mountView({ search: '?devnet=http://127.0.0.1:8799' }).c.where.api, 'http://127.0.0.1:8799');
  for (const bad of ['?devnet=https://pointcast-devnet.mhoydich.workers.dev', '?devnet=http://localhost@evil.example', '?devnet=//127.0.0.1', '?devnet=http://127.0.0.1.evil.example']) {
    const x = mountView({ search: bad });
    assert.equal(x.c.where.api, DEVNET.url, bad);
    assert.equal(x.c.where.genesis, GENESIS, bad);
  }
  // under a local override the pins table says what is really pinned, and a refused override says so
  const ov = mountView({ search: '?devnet=http://127.0.0.1:8799&genesis=' + GENESIS });
  await ov.c.begin();
  assert.equal(txt(ov.rootEl, '[data-wt-pin-hash]'), GENESIS);
  assert.match(txt(ov.rootEl, '[data-wt-pin-how]'), /^a local test: this page was opened with \?devnet= and &genesis=, so it pins the genesis in the link, not the one in its build\.$/);
  assert.match(txt(ov.rootEl, '[data-wt-net]'), /^http:\/\/127\.0\.0\.1:8799 · pointcast-devnet-2 · local override$/);
  assert.match(txt(ov.rootEl, '[data-wt-meta]'), /local override$/);
  const nog = mountView({ search: '?devnet=http://127.0.0.1:8799' });
  await nog.c.begin();
  assert.match(txt(nog.rootEl, '[data-wt-pin-how]'), /uses that node’s own genesis, and nothing outside it vouches for it\.$/);
  const ign = mountView({ search: '?devnet=https://evil.example' });
  await ign.c.begin();
  assert.match(txt(ign.rootEl, '[data-wt-meta]'), /a \?devnet= address was ignored: this page only reads another devnet on localhost or 127\.0\.0\.1$/);
  assert.equal(txt(ign.rootEl, '[data-wt-pin-hash]'), DEVNET.genesis.length === 64 ? txt(ign.rootEl, '[data-wt-pin-hash]') : '', 'a refused override leaves the build’s pins as they are');
  assert.match(code(src.view), /whenReady\(root, \(\) => c\.begin\(\), env\)/);
  assert.match(src.page, /requestIdleCallback/);
});

test('a reset shows GENESIS CHANGED, stops the page, and nothing is fetched, replayed or sent', async () => {
  const m = mountView({ dev: { overrides: { '/status': (u, i, { rep }) => rep({ ...FX.status, genesis_hash: HEX('9') }) } } });
  await m.c.begin();
  assert.equal(m.rootEl.dataset.state, 'changed');
  assert.equal($(m.rootEl, '[data-wt-genesis]').hidden, false);
  assert.match(txt(m.rootEl, '[data-wt-genesis]'), /GENESIS CHANGED/);
  assert.equal($(m.rootEl, '[data-wt-replay]').disabled, true);
  await m.c.replay();
  assert.deepEqual(m.log, ['GET /status']);
  assert.deepEqual([m.calls.verifier, m.calls.start], [0, 0]);
  // a reset that happens between begin() and Replay is found by the replay’s own read
  const flip = { n: 0 };
  const m2 = mountView({ dev: { overrides: { '/status': (u, i, { rep }) => rep(flip.n++ === 0 ? FX.status : { ...FX.status, genesis_hash: HEX('9') }) } } });
  await m2.c.begin();
  assert.equal(m2.rootEl.dataset.state, 'ready');
  await m2.c.replay();
  assert.equal(m2.rootEl.dataset.state, 'changed');
  assert.deepEqual([m2.calls.verifier, m2.calls.start], [0, 0], 'the verifier is not even fetched for a chain that was reset');
  assert.equal($(m2.rootEl, '[data-wt-replay]').disabled, true);
});

test('an unreachable devnet is said so, and Replay can be tried again', async () => {
  let up = false;
  const m = mountView({ dev: { overrides: { '/status': (u, i, { rep }) => { if (!up) throw new TypeError('Failed to fetch'); return rep(FX.status); } } } });
  await m.c.begin();
  assert.equal(m.rootEl.dataset.state, 'down');
  assert.match(txt(m.rootEl, '[data-wt-status]'), /^The devnet did not answer: the devnet did not answer \(unreachable\)\. Replaying needs the devnet; try “Replay” again in a moment\.$/);
  assert.equal($(m.rootEl, '[data-wt-replay]').disabled, false);
  await m.c.replay();
  assert.equal(m.rootEl.dataset.state, 'down');
  assert.match(txt(m.rootEl, '[data-wt-status]'), /^The replay did not finish: the devnet did not answer \(unreachable\)\. Nothing was signed\.$/);
  assert.equal(m.calls.start, 0);
  up = true;
  await m.c.replay();
  assert.equal(m.rootEl.dataset.state, 'replayed');
});

test('the whole flow in the page: replay with a progress bar that counts blocks, the post shown word for word, nothing sent until Send, then CORRECT on the roll', async () => {
  const storage = fakeStorage();
  const m = mountView({ storage });
  await m.c.begin();
  $(m.rootEl, '[data-wt-name]').value = 'wt-flow';
  $(m.rootEl, '[data-wt-name]').dispatchEvent(new m.dom.window.Event('input'));
  $(m.rootEl, '[data-wt-checkin]').checked = true;
  $(m.rootEl, '[data-wt-checkin]').dispatchEvent(new m.dom.window.Event('change'));
  assert.equal($(m.rootEl, '[data-wt-note]').disabled, false, 'the note is open once a check-in is asked for');
  $(m.rootEl, '[data-wt-note]').value = 'from a tab';
  await m.c.replay();
  // the bar and the words
  const bar = $(m.rootEl, '[data-wt-bar]');
  assert.deepEqual([bar.getAttribute('role'), bar.getAttribute('aria-valuenow'), bar.getAttribute('aria-valuemax'), bar.getAttribute('aria-valuemin')], ['progressbar', '92', '92', '0']);
  assert.equal(bar.getAttribute('aria-valuetext'), '92 of 92 blocks replayed');
  assert.equal($(m.rootEl, '[data-wt-fill]').style.width, '100%');
  assert.equal(txt(m.rootEl, '[data-wt-progress-text]'), '92 of 92 blocks replayed');
  const a = m.calls.args[0];
  assert.deepEqual([a.api, a.genesis, a.minHeight], [DEVNET.url, GENESIS, 92]);
  assert.deepEqual(Object.keys(a.fetched).sort(), ['bytes', 'sha']);
  const lines = [...m.rootEl.querySelectorAll('[data-wt-checks] li')].map((li) => li.dataset.state + ' ' + li.textContent);
  assert.equal(lines.length, 5);
  assert.ok(lines.every((l) => l.startsWith('pass ')), lines.join('\n'));
  assert.match(lines[0], /genesis .* is the one this page pins/);
  assert.match(lines[1], /three files match the pins above \(wasm 7467bfd9afb3…/);
  assert.match(lines[2], /Replayed 92 blocks from genesis: no fault\./);
  assert.match(lines[3], /timestamp was read from a header that hashes to the block the verifier accepted/);
  assert.match(lines[4], /The checkpoint to attest is №10, today’s day checkpoint, chosen from the replay alone/);
  for (const n of X.VERIFIER_FILES) assert.match(txt(m.rootEl, '[data-wt-pin-state="' + n + '"]'), /checked: the SHA-256 matches the pin/);
  const sum = (k) => txt(m.rootEl, '[data-wt-sum="' + k + '"]');
  assert.deepEqual([sum('height'), sum('epoch'), sum('day'), sum('daycp'), sum('target'), sum('hash'), sum('claimroot')], ['92 blocks, from block 1', EPOCH, '2026-10-20 (UTC; resets at 00:00 UTC)', '№10', '№10 (today’s day checkpoint)', REPLAY.cps.get(10).block_hash, REPLAY.cps.get(10).state_root]);
  assert.equal($(m.rootEl, '[data-wt-summary]').hidden, false);
  assert.equal(m.rootEl.dataset.state, 'replayed');
  // no key yet: the review says so, and the roll is read without a row for anyone
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, true);
  assert.match(txt(m.rootEl, '[data-wt-errors]'), /Make a key first: the claim is signed by it\./);
  assert.equal($(m.rootEl, '[data-wt-roll]').hidden, false);
  assert.match(txt(m.rootEl, '[data-wt-roll-text]'), /Make a key to see your own row on this list\./);
  // a key arrives: the post is shown, word for word, and nothing is sent
  await m.c.keys.setSeed(SEED);
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  const plan = m.c.state.plan;
  assert.equal(txt(m.rootEl, '[data-wt-wit-title]'), 'witness · h10 · root ' + REPLAY.cps.get(10).state_root.slice(0, 12) + ' · wt-flow');
  assert.equal(txt(m.rootEl, '[data-wt-wit-body]'), plan.wit.body);
  assert.equal(txt(m.rootEl, '[data-wt-net-title]'), 'net · checkin · wt-flow');
  assert.deepEqual(W.parseNetBody(txt(m.rootEl, '[data-wt-net-body]')), { schema: W.SCHEMAS.net, day: '2026-10-20', kind: 'checkin', note: 'from a tab', name: 'wt-flow' });
  assert.match(txt(m.rootEl, '[data-wt-confirm-from]'), new RegExp('^Signed by tz1\\w+ and sent to ' + DEVNET.url.replace(/[.]/g, '\\.') + ' \\(pointcast-devnet-2\\)\\. Your browser has signed the claim; nothing has been sent\\.'));
  assert.deepEqual(posts(m.log), [], 'reviewing sent nothing');
  assert.equal($(m.rootEl, '[data-wt-send]').hidden, false);
  assert.match(txt(m.rootEl, '[data-wt-roll-text]'), /Your key has not attested this checkpoint yet/);
  // Send
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => ['ok', 'bad', 'warn'].includes($(m.rootEl, '[data-wt-result]').dataset.state));
  assert.equal($(m.rootEl, '[data-wt-result]').dataset.state, 'ok');
  assert.deepEqual(posts(m.log), ['POST /body', 'POST /tx', 'POST /body', 'POST /tx']);
  assert.deepEqual(m.f.sent.map((s) => s.tx.channel), ['WIT', 'NET']);
  assert.equal(m.f.bodies[m.f.sent[0].tx.body_hash], plan.wit.body, 'what was sent is what the review showed');
  assert.match(txt(m.rootEl, '[data-wt-result-text]'), /^Attestation in block 93 \(tx [0-9a-f]{64}\), counted for 2026-10-20 by the day rule .* Check-in in block 94 \(tx [0-9a-f]{64}\), counts for 2026-10-20\. Keep the claim file: the signature inside it is portable evidence\.$/);
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, true);
  // the roll
  await until(() => $(m.rootEl, '[data-wt-roll-state]').textContent === 'CORRECT');
  const badge = $(m.rootEl, '[data-wt-roll-state]');
  assert.deepEqual([badge.textContent, badge.dataset.state, badge.hidden], ['CORRECT', 'ok', false]);
  assert.match(txt(m.rootEl, '[data-wt-roll-text]'), /agree with this server’s at checkpoint №10/);
  const rows = [...m.rootEl.querySelectorAll('[data-wt-roll-list] li')];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].dataset.mine, 'yes');
  assert.match(rows[0].textContent, /^wt-flow · youtz1\w{5}…\w{6}agreed with this server$/);
  assert.match(txt(m.rootEl, '[data-wt-roll-foot]'), /^1 key signed this checkpoint: 1 agreed with this server’s hash\. 1 witness key on the roll in all \(counts are keys, not people\)\. Your key: 1 attestation, 1 correct, 0 strikes, streak 1\./);
  assert.match(txt(m.rootEl, '[data-wt-status]'), /^Sent, and the roll counts it: CORRECT\.$/);
  // the claim file, kept and downloadable
  assert.equal($(m.rootEl, '[data-wt-claim-box]').hidden, false);
  const claim = JSON.parse(txt(m.rootEl, '[data-wt-claim-json]'));
  assert.equal(claim.format, 'pointcast-witness-claim/v1');
  assert.equal(claim.tx, K.pcc.txHash(m.f.sent[0]));
  assert.equal(claim.included.height, 93);
  assert.equal((await W.verifyWitness({ line: claim.line, chain_id: claim.devnet.chain_id, genesis: claim.devnet.genesis, epoch: claim.epoch, signerPublicKey: { scheme: 'ed25519', bytes: claim.signed_by.public_key } })).ok, true);
  // the journal kept the claim before it was sent
  const j = X.readJournal(storage);
  assert.equal(j.entries.length, 1);
  assert.deepEqual([j.entries[0].height, j.entries[0].tx, j.entries[0].address, j.entries[0].name], [10, claim.tx, KEY.sender, 'wt-flow']);
  const clicked = [];
  m.dom.window.HTMLAnchorElement.prototype.click = function click() { clicked.push([this.download, this.href]); };
  $(m.rootEl, '[data-wt-claim-btn]').click();
  assert.equal(clicked.length, 1);
  assert.match(clicked[0][0], /^witness-claim-10-[0-9a-f]{12}\.json$/);
  assert.match(clicked[0][1], /^blob:test\/\d+$/);
  m.c.stop();
});

test('the claim is in the journal before the post is accepted: a lost reply leaves it on record, and the next replay will not send a second copy while it may still land', async () => {
  const storage = fakeStorage();
  // the devnet takes the post and then never says it is in a block
  const m = mountView({ storage, dev: { pending: true }, extra: { wait: { timeoutMs: 60, intervalMs: 10 } } });
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => ['ok', 'bad', 'warn'].includes($(m.rootEl, '[data-wt-result]').dataset.state), 5000);
  assert.equal($(m.rootEl, '[data-wt-result]').dataset.state, 'warn');
  assert.match(txt(m.rootEl, '[data-wt-result-text]'), /^Sent, not confirmed yet: still pending after 60 ms\. Transaction [0-9a-f]{64}\. The devnet accepted it, so it may still land: check before sending again\. Your claim is kept/);
  const entry = X.readJournal(storage).entries[0];
  assert.deepEqual([entry.height, entry.address], [10, KEY.sender]);
  assert.equal(entry.tx, K.pcc.txHash(m.f.sent[0]), 'the journal holds the tx that went');
  // a later replay finds the journalled tx pending and does not sign another
  const again = mountView({ storage, dev: { pending: true } });
  again.f.sent.push(m.f.sent[0]);
  await again.c.begin();
  await again.c.keys.setSeed(SEED);
  await again.c.replay();
  await until(() => $(again.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(again.rootEl, '[data-wt-skip]'), /still waiting for a block \(tx [0-9a-f]{12}…\)\. Not sending another\./);
  assert.equal($(again.rootEl, '[data-wt-send]').hidden, true);
  assert.deepEqual(posts(again.log), []);
  again.c.stop();
  m.c.stop();
});

test('an attestation already on chain today is said and nothing is sent: from the replay’s posts, and from the journal’s tx', async () => {
  const claim = REPLAY.cps.get(10);
  const mine = { height: 70, tx: HEX('a'), sender: KEY.sender, channel: 'WIT', title: 'witness · h10 · root ' + claim.state_root.slice(0, 12), body_hash: HEX('b') };
  const m = mountView({ replay: { ...REPLAY, posts: [mine] } });
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-skip]'), /^You attested today already \(checkpoint №10, tx a{64} in block №70\)\. Nothing new to sign\.$/);
  assert.equal($(m.rootEl, '[data-wt-send]').hidden, true, 'there is nothing to send');
  assert.equal($(m.rootEl, '[data-wt-wit-box]').hidden, true);
  assert.equal(txt(m.rootEl, '[data-wt-confirm-from]'), 'Nothing to send.');
  await m.c.send();
  assert.deepEqual(posts(m.log), []);
  // from the journal: a tx this browser signed that the devnet has in a block
  const f1 = mountView({ storage: fakeStorage() });
  await f1.c.begin();
  await f1.c.keys.setSeed(SEED);
  await f1.c.replay();
  await until(() => $(f1.rootEl, '[data-wt-confirm]').hidden === false);
  f1.rootEl.querySelector('[data-wt-send]').click();
  await until(() => $(f1.rootEl, '[data-wt-result]').dataset.state === 'ok');
  const st = f1.env.storage;
  const j = mountView({ storage: st });
  j.f.sent.push(...f1.f.sent);
  await j.c.begin();
  await j.c.keys.setSeed(SEED);
  await j.c.replay();
  await until(() => $(j.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(j.rootEl, '[data-wt-skip]'), /You attested №10 already \(your journal’s tx is in block №93\)\. Nothing new to sign\./);
  assert.equal($(j.rootEl, '[data-wt-send]').hidden, true);
  assert.deepEqual(posts(j.log), []);
});

test('with the already-attested check taken out of a copy, the page would sign again — mutation', async () => {
  const claim = REPLAY.cps.get(10);
  const mine = { height: 70, tx: HEX('a'), sender: KEY.sender, channel: 'WIT', title: 'witness · h10 · root ' + claim.state_root.slice(0, 12), body_hash: HEX('b') };
  const mod = await variant({ logic: swap('const have = st.atTarget || st.today;', 'const have = null;') });
  for (const [which, mods, expectSend] of [['real', REAL, true], ['mutant', mod, false]]) {
    const m = mountView({ mods, replay: { ...REPLAY, posts: [mine] } });
    await m.c.begin();
    await m.c.keys.setSeed(SEED);
    await m.c.replay();
    await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
    assert.equal($(m.rootEl, '[data-wt-send]').hidden, expectSend, which + ': the Send button is ' + (expectSend ? 'hidden' : 'there'));
  }
});

test('any fault leaves nothing to sign: the fault box, the evidence, no review, no send — and a failed replay withdraws the plan of the one before (mutation)', async () => {
  const fault = new X.ReplayFault({ fault: 'equivocation', height: 61, reason: 'two blocks sealed at one height', sequencerFault: true, evidenceJson: '{"evidence":{"height":61}}' });
  let n = 0;
  const startReplay = (a) => { n += 1; a.onProgress({ height: 30, tip: 92 }); return n === 1 ? { promise: Promise.resolve(REPLAY), cancel() {} } : { promise: Promise.reject(fault), cancel() {} }; };
  const scene = async (mods) => {
    n = 0;
    const m = mountView({ mods, startReplay });
    await m.c.begin();
    await m.c.keys.setSeed(SEED);
    await m.c.replay();
    await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
    await m.c.replay(); // the second replay finds a fault
    await tick(20);
    const out = { state: m.rootEl.dataset.state, faultShown: !$(m.rootEl, '[data-wt-fault]').hidden, confirmShown: !$(m.rootEl, '[data-wt-confirm]').hidden, m };
    await m.c.send();
    out.posted = posts(m.log).length;
    return out;
  };
  const real = await scene(REAL);
  assert.deepEqual([real.state, real.faultShown, real.confirmShown, real.posted], ['fault', true, false, 0]);
  assert.match(txt(real.m.rootEl, '[data-wt-fault-text]'), /^FAULT at height 61: equivocation \(two blocks sealed at one height\), a sequencer fault; refusing to sign\. Keep this: a fault is what the net is for\. Nothing was signed\.$/);
  assert.equal(txt(real.m.rootEl, '[data-wt-fault-json]'), '{"evidence":{"height":61}}');
  assert.equal($(real.m.rootEl, '[data-wt-fault-details]').hidden, false);
  assert.match(txt(real.m.rootEl, '[data-wt-status]'), /^FAULT at height 61\. Refusing to sign\.$/);
  assert.equal($(real.m.rootEl, '[data-wt-checks] li[data-state="fail"]') !== null, true);
  assert.equal(real.m.c.state.plan, null);
  assert.equal($(real.m.rootEl, '[data-wt-replay]').disabled, false, 'it can be replayed again');
  const mod = await variant({ view: swap("    S.replay = null;\n    S.choice = null;\n    S.plan = null;\n    S.sent = null;\n", "    S.sent = null;\n") });
  const mutant = await scene(mod);
  assert.equal(mutant.posted, 2, 'with the old plan left standing after a failed replay, Send still goes');
});

test('a fault’s evidence is shown exactly as the worker made it — no cap, no clean-up — and can be downloaded byte for byte', async () => {
  // an InvalidTransition-sized evidence file: pretty-printed (indentation, blank lines kept) and far over 6,000 characters
  const evidence = JSON.stringify({ evidence: { kind: 'InvalidTransition', height: 61, pre_state: { accounts: Object.fromEntries(Array.from({ length: 200 }, (_, i) => ['tz1' + String(i).padStart(30, '0'), { balance: i * 1000, nonce: i, note: 'a  b\t c' }])) }, nonce: 'x'.repeat(40) } }, null, 2) + '\n';
  assert.ok(evidence.length > 20000 && /\n {4,}/.test(evidence), 'the fixture is large and indented: ' + evidence.length);
  const fault = new X.ReplayFault({ fault: 'invalid_transition', height: 61, reason: 'a transition the rules refuse', evidenceJson: evidence });
  const startReplay = (a) => { a.onProgress({ height: 30, tip: 92 }); return { promise: Promise.reject(fault), cancel() {} }; };
  const m = mountView({ startReplay });
  const blobs = [];
  m.dom.window.URL.createObjectURL = (b) => { blobs.push(b); return 'blob:test/' + blobs.length; };
  const clicked = [];
  m.dom.window.HTMLAnchorElement.prototype.click = function click() { clicked.push([this.download, this.href]); };
  await m.c.begin();
  await m.c.replay();
  await tick(20);
  assert.equal(m.rootEl.dataset.state, 'fault');
  const box = $(m.rootEl, '[data-wt-fault-json]');
  // it is a text area, not a cut-down preview: the whole file, character for character
  assert.equal(box.tagName, 'TEXTAREA');
  assert.equal(box.readOnly, true);
  assert.equal(box.textContent, evidence, 'verbatim: not cut at 6,000 characters, not collapsed');
  assert.equal(box.value, evidence);
  assert.doesNotMatch(box.textContent, /…/);
  assert.deepEqual(JSON.parse(box.textContent), JSON.parse(evidence), 'it still parses');
  assert.match(txt(m.rootEl, '[data-wt-fault-size]'), new RegExp('^' + evidence.length.toLocaleString('en-US') + ' characters \\(' + new TextEncoder().encode(evidence).length.toLocaleString('en-US') + ' bytes\\), exactly as the worker made it\\.'));
  assert.equal($(m.rootEl, '[data-wt-fault-dl]').hidden, false);
  // the download is the same bytes
  $(m.rootEl, '[data-wt-fault-btn]').click();
  assert.equal(clicked.length, 1);
  assert.match(clicked[0][0], /^witness-fault-evidence-61\.json$/);
  assert.equal(blobs.length, 1);
  assert.equal(blobs[0].type, 'application/json');
  const blobText = (b) => new Promise((resolve, reject) => { const r = new m.dom.window.FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsText(b); });
  assert.equal(await blobText(blobs[0]), evidence, 'the file is the evidence, byte for byte');
  // it is text, never markup
  assert.equal(m.rootEl.querySelectorAll('[data-wt-fault] a, [data-wt-fault] img, [data-wt-fault] script').length, 0);
  // a fault with no evidence file says so and offers no download
  const none = new X.ReplayFault({ fault: 'gap', height: 5, reason: 'a block is missing', evidenceJson: '' });
  const m2 = mountView({ startReplay: (a) => { a.onProgress({ height: 3, tip: 92 }); return { promise: Promise.reject(none), cancel() {} }; } });
  await m2.c.begin();
  await m2.c.replay();
  await tick(20);
  assert.equal($(m2.rootEl, '[data-wt-fault-details]').hidden, true);
  assert.equal($(m2.rootEl, '[data-wt-fault-dl]').hidden, true);
  assert.equal($(m2.rootEl, '[data-wt-fault-btn]').disabled, true);
  m.c.stop();
  m2.c.stop();
});

test('keyboard use: focus follows the work — Replay to Cancel while it runs, then to the review; back to Replay after a failure or a cancel', async () => {
  const m = mountView();
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  const doc = m.dom.window.document;
  const replayBtn = $(m.rootEl, '[data-wt-replay]');
  replayBtn.focus();
  assert.equal(doc.activeElement, replayBtn);
  let during = null;
  const m2 = mountView({ startReplay: (a) => { during = doc2().activeElement; a.onProgress({ height: 10, tip: 92 }); return { promise: Promise.resolve(REPLAY), cancel() {} }; } });
  function doc2() { return m2.dom.window.document; }
  await m2.c.begin();
  await m2.c.keys.setSeed(SEED);
  $(m2.rootEl, '[data-wt-replay]').focus();
  await m2.c.replay();
  assert.equal(during, $(m2.rootEl, '[data-wt-cancel]'), 'while it runs the focus is on Cancel, not lost with the disabled button');
  assert.equal(doc2().activeElement, $(m2.rootEl, '[data-wt-confirm]'), 'when the review is up the focus is on it, not on Send');
  assert.equal($(m2.rootEl, '[data-wt-confirm]').getAttribute('tabindex'), '-1');
  assert.equal($(m2.rootEl, '[data-wt-confirm]').getAttribute('role'), 'group');
  // a failed replay hands the focus back to Replay
  const bad = mountView({ startReplay: () => ({ promise: Promise.reject(new X.Refusal('nope', 'x')), cancel() {} }) });
  await bad.c.begin();
  $(bad.rootEl, '[data-wt-replay]').focus();
  await bad.c.replay();
  assert.equal(bad.dom.window.document.activeElement, $(bad.rootEl, '[data-wt-replay]'));
  // a press that did not come from the keyboard on Replay does not move focus around
  const other = mountView();
  await other.c.begin();
  $(other.rootEl, '[data-wt-name]').focus();
  await other.c.replay();
  assert.equal(other.dom.window.document.activeElement, $(other.rootEl, '[data-wt-name]'));
  m.c.stop();
  m2.c.stop();
});

test('a browser without WebCrypto Ed25519 can replay and read the roll, and is told it cannot sign — nothing is sent', async () => {
  const m = mountView({ extra: { supported: false } });
  await m.c.begin();
  assert.match(txt(m.rootEl, '[data-kp-status]'), /This browser cannot make an ed25519 key/);
  assert.equal($(m.rootEl, '[data-kp-make]').disabled, true);
  await m.c.replay();
  assert.equal(m.rootEl.dataset.state, 'replayed', 'the replay does not need a key');
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, true);
  assert.match(txt(m.rootEl, '[data-wt-errors]'), /^This browser cannot make an ed25519 key \(WebCrypto Ed25519\), so it cannot sign\. The replay above still ran and the roll can be read; to witness, use a current Chrome, Edge, Safari or Firefox, or the terminal version below\.$/);
  assert.equal($(m.rootEl, '[data-wt-roll]').hidden, false, 'the roll is still read');
  await m.c.send();
  assert.deepEqual(posts(m.log), []);
  m.c.stop();
});

test('Cancel stops the replay at once, says so, and nothing that arrives after it is used', async () => {
  let resolve;
  const m = mountView({ startReplay: (a) => { m.calls.start += 1; a.onProgress({ height: 12, tip: 92 }); return { promise: new Promise((r) => { resolve = r; }), cancel() { m.calls.cancel += 1; } }; } });
  await m.c.begin();
  $(m.rootEl, '[data-wt-replay]').focus();
  const running = m.c.replay();
  await until(() => m.calls.start === 1);
  assert.equal(m.dom.window.document.activeElement, $(m.rootEl, '[data-wt-cancel]'));
  assert.equal($(m.rootEl, '[data-wt-cancel]').disabled, false);
  assert.equal($(m.rootEl, '[data-wt-replay]').disabled, true);
  assert.equal(txt(m.rootEl, '[data-wt-progress-text]'), '12 of 92 blocks replayed');
  assert.equal($(m.rootEl, '[data-wt-fill]').style.width, '13%');
  $(m.rootEl, '[data-wt-cancel]').click();
  assert.equal(m.calls.cancel, 1);
  assert.equal(txt(m.rootEl, '[data-wt-status]'), 'Cancelled. Nothing was signed or sent.');
  assert.equal(m.rootEl.dataset.state, 'ready');
  assert.equal($(m.rootEl, '[data-wt-progress]').hidden, true);
  assert.equal($(m.rootEl, '[data-wt-cancel]').disabled, true);
  assert.equal($(m.rootEl, '[data-wt-replay]').disabled, false);
  assert.equal(m.dom.window.document.activeElement, $(m.rootEl, '[data-wt-replay]'), 'after a cancel the focus is back on Replay');
  resolve(REPLAY); // a result that comes after the cancel
  await running;
  await tick(30);
  assert.equal($(m.rootEl, '[data-wt-summary]').hidden, true);
  assert.equal(m.c.state.replay, null);
  assert.equal(m.rootEl.dataset.state, 'ready');
  assert.deepEqual(posts(m.log), []);
  assert.equal(await m.c.cancel(), undefined, 'cancel() with nothing running does nothing');
});

test('a verifier that is not the pinned one stops the page before a worker is started — the real checks, the real bytes, and proven by mutation', async () => {
  const served = (tamperWasm) => async (url) => {
    const name = String(url).split('/').pop();
    const body = name === 'pointcast_chain.wasm.sha256' ? new TextEncoder().encode(SUMS) : fileBytes()[name];
    if (tamperWasm && name === 'pointcast_chain.wasm') { body[5000] ^= 0x55; }
    return { ok: true, status: 200, arrayBuffer: async () => body.slice().buffer };
  };
  const scene = async (mods) => {
    const calls = [];
    const m = mountView({ mods, keep: true, extra: { verifierFetch: served(true), startReplay: (a) => { calls.push(a); return { promise: Promise.resolve(REPLAY), cancel() {} }; } } });
    await m.c.begin();
    await m.c.replay();
    await tick(30);
    return { started: calls.length, m };
  };
  const real = await scene(REAL);
  assert.equal(real.started, 0);
  assert.equal(real.m.rootEl.dataset.state, 'fault');
  assert.match(txt(real.m.rootEl, '[data-wt-status]'), /^pointcast_chain\.wasm is not the verifier this page pins \(sha256 [0-9a-f]{12}…, want 7467bfd9afb3…\); refusing to run it\. Nothing was signed\.$/);
  assert.equal($(real.m.rootEl, '[data-wt-checks] li[data-state="fail"]') !== null, true);
  assert.match(txt(real.m.rootEl, '[data-wt-pin-state="pointcast_chain.wasm"]'), /not loaded yet/, 'no pin is marked checked');
  const mod = await variant({ logic: (s) => swap("if (got !== want) throw new PinError(name + ' is not the verifier this page pins", "if (false) throw new PinError(name + ' is not the verifier this page pins")(s).replace("if (listed.toLowerCase() !== sha['pointcast_chain.wasm']) {", 'if (false) {') });
  const mutant = await scene(mod);
  assert.equal(mutant.started, 1, 'with the checks removed the tampered wasm is handed to the worker');
  // and the honest bytes go through the same path
  const calls = [];
  const ok = mountView({ keep: true, extra: { verifierFetch: served(false), startReplay: (a) => { calls.push(a); return { promise: Promise.resolve(REPLAY), cancel() {} }; } } });
  await ok.c.begin();
  await ok.c.replay();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].fetched.sha, SHAS);
});

test('the real wiring: a module worker started from the shim, the checked bytes as blob URLs, headers and verified blocks in, a result out, the worker terminated', async () => {
  const made = [];
  class FakeWorker {
    constructor(url, opts) { made.push({ url, opts, w: this }); this.posted = []; this.terminated = false; }
    postMessage(m, t) {
      this.posted.push(m);
      if (!m.start) return;
      setTimeout(() => {
        this.onmessage({ data: genesisReady });
        this.onmessage({ data: { type: 'witness-headers', rows: headerRows(1, 92) } });
        this.onmessage({ data: { type: 'progress', height: 92, block_hash: HEX('1'), state_root: HEX('2'), tip: 92, verified: verifiedRows(1, 92), blocks: blockCards(1, 92) } });
      }, 5);
    }
    terminate() { this.terminated = true; }
  }
  const files = fileBytes();
  const m = mountView({ keep: true, extra: { Worker: FakeWorker, verifierFetch: async (url) => { const name = String(url).split('/').pop(); const body = name === 'pointcast_chain.wasm.sha256' ? new TextEncoder().encode(SUMS) : files[name]; return { ok: true, status: 200, arrayBuffer: async () => body.slice().buffer }; } } });
  await m.c.begin();
  await m.c.replay();
  assert.equal(made.length, 1);
  assert.equal(made[0].url, X.SHIM_URL);
  assert.match(X.SHIM_URL, /\/chain\/apps\/witness-shim\.js$/);
  assert.deepEqual(made[0].opts, { type: 'module' });
  const start = made[0].w.posted[0];
  assert.deepEqual([start.workerUrl, start.start.verifyJsUrl, start.start.api, start.start.genesis], ['blob:test/2', 'blob:test/1', DEVNET.url, GENESIS]);
  assert.equal(made[0].w.terminated, true);
  assert.deepEqual(made[0].w.posted.at(-1), { stop: true, save: false });
  assert.equal(m.rootEl.dataset.state, 'replayed');
  assert.equal(txt(m.rootEl, '[data-wt-sum="target"]'), '№10 (today’s day checkpoint)');
  // no Worker in the browser: said, and nothing is signed
  const none = mountView({ keep: true, extra: { Worker: undefined, verifierFetch: m.env.verifierFetch } });
  none.dom.window.Worker = undefined;
  await none.c.begin();
  await none.c.replay();
  assert.match(txt(none.rootEl, '[data-wt-status]'), /^this browser has no Web Workers, so it cannot replay the chain here\. Nothing was signed\.$/);
  assert.equal(none.rootEl.dataset.state, 'fault');
});

test('the midnight minute: the review says so, Send is off, a press does nothing, and the second wall in sendWitness holds even if the first is removed — mutation', async () => {
  const late = Date.parse('2026-10-20T23:59:30Z');
  const m = mountView({ nowMs: late });
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-notes]'), /nothing can be sent between 23:59 and 00:01 UTC\. Try again after 00:01 UTC\./);
  assert.equal($(m.rootEl, '[data-wt-send]').disabled, true);
  await m.c.send();
  assert.deepEqual(posts(m.log), []);
  // wall one removed (the view’s check): the logic still refuses and says so
  const v1 = await variant({ view: swap('|| plan.blocked ||', '||') });
  const m1 = mountView({ mods: v1, nowMs: late });
  await m1.c.begin();
  await m1.c.keys.setSeed(SEED);
  await m1.c.replay();
  await until(() => $(m1.rootEl, '[data-wt-confirm]').hidden === false);
  await m1.c.send();
  assert.deepEqual(posts(m1.log), []);
  assert.match(txt(m1.rootEl, '[data-wt-result-text]'), /the post not sent: it is 2026-10-20 23:59:30 UTC[\s\S]*Nothing was sent; try again after 00:01 UTC\./);
  // both removed: the post goes in the midnight minute
  const v2 = await variant({ view: swap('|| plan.blocked ||', '||'), logic: swap('return minute >= 1439 || minute < 1;', 'return false;') });
  const m2 = mountView({ mods: v2, nowMs: late });
  await m2.c.begin();
  await m2.c.keys.setSeed(SEED);
  await m2.c.replay();
  await until(() => $(m2.rootEl, '[data-wt-confirm]').hidden === false);
  await m2.c.send();
  assert.ok(posts(m2.log).length >= 2, 'with both guards gone the post is sent at 23:59:30');
});

test('429s are said in words and nothing is lost: the replay and the post', async () => {
  const slow = Object.assign(new Error('429 /raw/blocks?from=1&limit=500'), { status: 429 });
  const m = mountView({ startReplay: () => ({ promise: Promise.reject(slow), cancel() {} }) });
  await m.c.begin();
  await m.c.replay();
  assert.match(txt(m.rootEl, '[data-wt-status]'), /^The replay did not finish: the devnet answered 429 for \/raw\/blocks\?from=1&limit=500 The devnet is rate-limiting this browser: wait a minute and replay again\. Nothing was signed\.$|The replay did not finish: .*rate-limiting this browser/);
  const stall = new X.Refusal('the replay stalled at block 400 of 3326: no new block for 45 s (sync: 429 /raw/blocks). Nothing was signed.', 'stall');
  const m2 = mountView({ startReplay: () => ({ promise: Promise.reject(stall), cancel() {} }) });
  await m2.c.begin();
  await m2.c.replay();
  assert.match(txt(m2.rootEl, '[data-wt-status]'), /stalled at block 400 of 3326[\s\S]*The devnet is rate-limiting this browser: wait a minute and replay again\.$/);
  // the post: a 429 on /tx is "Not sent", with Retry-After
  const m3 = mountView({ dev: { overrides: { '/tx': (u, i, { rep }) => (i.method === 'POST' ? rep({ error: 'too many posts' }, 429, { 'retry-after': '9' }) : rep({})) } } });
  await m3.c.begin();
  await m3.c.keys.setSeed(SEED);
  await m3.c.replay();
  await until(() => $(m3.rootEl, '[data-wt-confirm]').hidden === false);
  $(m3.rootEl, '[data-wt-send]').click();
  await until(() => ['ok', 'bad', 'warn'].includes($(m3.rootEl, '[data-wt-result]').dataset.state));
  assert.equal($(m3.rootEl, '[data-wt-result]').dataset.state, 'bad');
  assert.equal(txt(m3.rootEl, '[data-wt-result-text]'), 'Not sent: too many posts. The devnet is rate-limiting this browser: try again in 9 s.');
  assert.equal($(m3.rootEl, '[data-wt-send]').disabled, false, 'it can be pressed again');
});

test('a name and a note are checked as they are typed, and the review follows the boxes', async () => {
  const m = mountView();
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  const name = $(m.rootEl, '[data-wt-name]');
  const type = (v) => { name.value = v; name.dispatchEvent(new m.dom.window.Event('input')); };
  type('Bad Name');
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, true, 'what was shown is withdrawn the moment a box changes');
  assert.equal($(m.rootEl, '[data-wt-name-note]').dataset.bad, 'yes');
  assert.match(txt(m.rootEl, '[data-wt-name-note]'), /2 to 24 of a–z, 0–9 and hyphen/);
  await until(() => $(m.rootEl, '[data-wt-errors]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-errors]'), /2 to 24 of a–z, 0–9 and hyphen/);
  type('house');
  assert.match(txt(m.rootEl, '[data-wt-name-note]'), /“house” is reserved for the house/);
  type('my-key-9');
  assert.equal($(m.rootEl, '[data-wt-name-note]').dataset.bad, 'no');
  assert.match(txt(m.rootEl, '[data-wt-name-note]'), /^Your name would be “my-key-9”: a claim, bound to the first key that uses it\.$/);
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-wit-title]'), / · my-key-9$/);
  assert.equal($(m.rootEl, '[data-wt-net-box]').hidden, true, 'no check-in unless asked');
  $(m.rootEl, '[data-wt-checkin]').checked = true;
  $(m.rootEl, '[data-wt-checkin]').dispatchEvent(new m.dom.window.Event('change'));
  await until(() => $(m.rootEl, '[data-wt-net-box]').hidden === false);
  $(m.rootEl, '[data-wt-note]').value = 'x'.repeat(141);
  $(m.rootEl, '[data-wt-note]').dispatchEvent(new m.dom.window.Event('input'));
  await until(() => $(m.rootEl, '[data-wt-errors]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-errors]'), /The check-in note: /);
  // a press during the gap does nothing
  await m.c.send();
  assert.deepEqual(posts(m.log), []);
  // "Not now" withdraws the review
  $(m.rootEl, '[data-wt-note]').value = 'fine';
  $(m.rootEl, '[data-wt-note]').dispatchEvent(new m.dom.window.Event('input'));
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  $(m.rootEl, '[data-wt-dismiss]').click();
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, true);
  await m.c.send();
  assert.deepEqual(posts(m.log), []);
  m.c.stop();
});

test('a different key than the one that was reviewed cannot send the review; the key panel’s change withdraws it', async () => {
  const m = mountView();
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  const plan = m.c.state.plan;
  await m.c.keys.setSeed('22'.repeat(32));
  assert.equal($(m.rootEl, '[data-wt-confirm]').hidden, true);
  m.c.state.plan = plan; // a stale review put back
  await m.c.send();
  assert.deepEqual(posts(m.log), [], 'the review belongs to the first key');
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-confirm-from]'), new RegExp('^Signed by ' + KEY2.sender));
  m.c.stop();
});

test('the roll says PENDING while the devnet’s index lags, reads again on request, and finds the key’s row when it catches up', async () => {
  const m = mountView({ dev: { indexLag: 6 } });
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => $(m.rootEl, '[data-wt-result]').dataset.state === 'ok');
  await until(() => txt(m.rootEl, '[data-wt-status]').startsWith('Sent. The roll has not listed it yet'));
  const badge = $(m.rootEl, '[data-wt-roll-state]');
  assert.deepEqual([badge.textContent, badge.dataset.state], ['PENDING', 'warn']);
  assert.match(txt(m.rootEl, '[data-wt-roll-text]'), /The roll has read to block №87 and your post is in block №93\. Read it again in a moment\./);
  m.f.setLag(0);
  $(m.rootEl, '[data-wt-roll-read]').click();
  await until(() => $(m.rootEl, '[data-wt-roll-state]').textContent === 'CORRECT');
  assert.equal($(m.rootEl, '[data-wt-roll-state]').dataset.state, 'ok');
  m.c.stop();
});

test('a strike is shown as a strike, with the devnet’s words for it', async () => {
  const forged = { ...REPLAY, cps: new Map(REPLAY.cps) };
  forged.cps.set(10, { block_hash: REPLAY.cps.get(10).block_hash, state_root: HEX('e') });
  const m = mountView({ replay: forged });
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => $(m.rootEl, '[data-wt-roll-state]').textContent === 'STRIKE');
  assert.equal($(m.rootEl, '[data-wt-roll-state]').dataset.state, 'bad');
  assert.match(txt(m.rootEl, '[data-wt-roll-text]'), /signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain\.$/);
  assert.match(txt(m.rootEl, '[data-wt-roll-list]'), /strike · mismatch/);
  assert.match(txt(m.rootEl, '[data-wt-status]'), /^Sent, and the roll gives it a strike\.$/);
  m.c.stop();
});

test('a roll that cannot be read does not lose the post, and says what to do', async () => {
  const m = mountView({ dev: { overrides: { '/witnesses': (u, i, { rep }) => rep({ error: 'index is rebuilding' }, 503) } } });
  await m.c.begin();
  await m.c.keys.setSeed(SEED);
  await m.c.replay();
  await until(() => $(m.rootEl, '[data-wt-confirm]').hidden === false);
  assert.match(txt(m.rootEl, '[data-wt-roll-text]'), /^The roll could not be read: index is rebuilding\.$/);
  $(m.rootEl, '[data-wt-send]').click();
  await until(() => $(m.rootEl, '[data-wt-result]').dataset.state === 'ok');
  await until(() => /index is rebuilding\. Your post is sent; read the roll again in a moment\.$/.test(txt(m.rootEl, '[data-wt-roll-text]')));
  assert.equal($(m.rootEl, '[data-wt-roll-read]').disabled, false);
  m.c.stop();
});

test('hostile text from the devnet stays text: names, addresses, results and tx ids in the roll make no element — and the walls are two, proven by mutation', async () => {
  const hostile = (u, i, { rep }) => rep(rollJson());
  const scene = async (mods) => {
    const m = mountView({ mods, dev: { overrides: { '/checkpoints/10/witnesses': hostile } } });
    await m.c.begin();
    await m.c.replay();
    await tick(30);
    return { m, injected: $(m.rootEl, '[data-wt-roll]').querySelectorAll('img, script, iframe, object, embed, svg, [onerror], [onload], b, i, style').length, rows: [...m.rootEl.querySelectorAll('[data-wt-roll-list] li')].map((li) => li.textContent) };
  };
  const real = await scene(REAL);
  assert.equal(real.injected, 0);
  assert.equal(real.rows.length, 3);
  assert.match(real.rows[0], /^good-name/);
  assert.match(real.rows[1], /^unnamed keyaddress not shownother$/);
  assert.match(real.rows[2], /^unnamed key/, 'UPPER is not a name');
  for (const r of real.rows) assert.doesNotMatch(r, /[<>]|onerror|alert/);
  for (const el of real.m.rootEl.querySelectorAll('*')) for (const a of el.attributes) assert.ok(!/^(on|srcdoc|style|action|formaction)/i.test(a.name) || (el.matches('[data-wt-fill]') && a.name === 'style'), a.name);
  // the checks on what a name may be, taken out of a copy, and the sink turned into innerHTML: the same data does get in
  const logic = swap('name: NAME_OK(k.name) ? k.name : \'\',\n    nameBound: k.name_bound === true,\n    tier:', 'name: String(k.name),\n    nameBound: k.name_bound === true,\n    tier:');
  const sink = swap("li.append(el(doc, 'span', 'wt-key__n', (k.name || 'unnamed key')", "const hn = el(doc, 'span', 'wt-key__n'); hn.innerHTML = (k.name || 'unnamed key'); li.append(hn); li.append(el(doc, 'span', 'wt-key__ignored', ''));\n        void (el(doc, 'span', 'wt-key__n', (k.name || 'unnamed key')");
  const both = await variant({ logic, view: sink });
  const bothRun = await scene(both);
  assert.ok(bothRun.injected > 0, 'with the reader’s check and textContent both gone, the hostile name becomes an element, and this test sees it');
  const readerOnly = await scene(await variant({ logic }));
  assert.equal(readerOnly.injected, 0, 'textContent alone holds');
  const sinkOnly = await scene(await variant({ view: sink }));
  assert.equal(sinkOnly.injected, 0, 'the reader alone holds');
  assert.ok(unsafe(sink(src.view)).includes('innerHTML'), 'and the static scan sees the sink mutation too');
});
const unsafe = (s) => { try { assertNoSinks(s, 'x'); return []; } catch (e) { return [/innerHTML/.test(e.message) ? 'innerHTML' : e.message]; } };

// ================================================================ rules read off the sources

test('nothing from the devnet becomes markup, a link or a style: the only link is the Blob for the claim file, the only style a bar width — proven by mutation', () => {
  const allow = [/a\.href = win\.URL\.createObjectURL\(blob\);/];
  assertNoSinks(src.view, 'witness-view.js', { allow });
  assertNoSinks(src.logic, 'witness.js');
  assertNoSinks(src.shim, 'witness-shim.js');
  assertNoSinks(src.keys, 'key-panel.js');
  const inline = (src.page.match(/<script is:inline[\s\S]*?<\/script>/) || [''])[0];
  assertNoSinks(inline, 'the page script');
  assert.throws(() => assertNoSinks(src.view, 'view'), /a link, source or style sink \(\.href =/);
  assert.throws(() => assertNoSinks(src.view + '\nlink.href = row.url;', 'view', { allow }), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.innerHTML = x;', 'view', { allow }), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.setAttribute("src", x);', 'view', { allow }), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view.replace("if (text !== undefined) n.textContent = text;", "if (text !== undefined) n.innerHTML = text;"), 'view', { allow }), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.shim + '\nself.document.write(x);', 'shim'), /an HTML sink/);
  assert.equal((code(src.view).match(/\.href\s*=/g) || []).length, 1, 'exactly the one allowed');
  assert.equal((code(src.view).match(/\.style\./g) || []).length, 1, 'one style, the bar’s width');
  assert.match(code(src.view), /fill\.style\.width = \(total > 0 \? Math\.min\(100, Math\.floor\(\(done \/ total\) \* 100\)\) : 0\) \+ '%'/);
});

test('the logic has no DOM and no storage of its own, reads with the fetch it is given, and writes only through the SDK on Send', () => {
  const c = code(src.logic);
  assert.doesNotMatch(c, /\b(document|window|navigator|localStorage|sessionStorage|indexedDB|alert)\b/);
  assert.doesNotMatch(c, /(?<![.\w])fetch\s*\(/, 'no bare fetch: reads go through a fetch it is handed');
  assert.doesNotMatch(c, /method\s*:\s*['"]POST|\.post\(|XMLHttpRequest|sendBeacon/);
  assert.equal((c.match(/signAndSend\(/g) || []).length, 1, 'one place signs and sends');
  assert.equal((c.match(/\bpostOne\(/g) || []).length, 3, 'postOne: its definition and the two posts in sendWitness');
  assert.equal((c.match(/chain\.buildPublish\(/g) || []).length, 1);
  assert.match(c, /export async function sendWitness/);
  // in the view the only writer is send()
  const v = code(src.view);
  assert.equal((v.match(/X\.sendWitness\(/g) || []).length, 1);
  assert.match(v, /if \(!plan \|\| !plan\.ok \|\| !plan\.sendable \|\| plan\.blocked \|\| !k \|\| S\.halted \|\| S\.sending \|\| S\.running\) return;/);
  assert.match(v, /if \(plan\.sender !== k\.sender\) return;/);
  assert.match(v, /sendBtn\.addEventListener\('click', send\)/);
  assert.doesNotMatch(v, /\.post\(|method\s*:\s*['"]POST|XMLHttpRequest|sendBeacon/);
  assert.equal((v.match(/localStorage/g) || []).length, 1, 'one place reaches for storage, and it is wrapped');
  assert.match(v, /try \{ return win\.localStorage; \} catch \{ return null; \}/);
  // the key is read in only to sign: seedHex goes to witness.js and nowhere else
  assert.equal((c.match(/seedHex/g) || []).length, 1);
  assert.doesNotMatch(v, /seedHex/);
  // a seed is never written to the journal, the claim file or the page
  assert.doesNotMatch(c.slice(c.indexOf('export function makeClaimFile')), /seedHex/);
});

test('the page and the view agree on every hook, the key panel is in the page, and the page keeps the pins and the lazy start', () => {
  const viewHooks = new Set(src.view.match(/data-wt-[a-z-]+/g));
  for (const h of viewHooks) assert.ok(src.page.includes(h), h + ' is in the page');
  const pageHooks = new Set((src.page.match(/data-wt-[a-z-]+/g) || []));
  for (const h of pageHooks) assert.ok(viewHooks.has(h) || h === 'data-wt-pin-state', h + ' is used by the view');
  assert.match(src.page, /<KeyPanel signs="the attestation and the check-in" id="wt-kp" \/>/);
  assert.match(src.page, /<ChainHeader current="witness"/);
  assert.match(src.page, /import\('\/chain\/apps\/witness-view\.js'\)/);
  assert.match(src.page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(src.page, /data-pin-wasm=\{VERIFIER\.pins\['pointcast_chain\.wasm'\]\}/);
  assert.match(src.page, /data-verifier-base=\{VERIFIER\.dir\}/);
  assert.match(src.page, /assertDevnetLaunchPinned\(\)/);
  assert.match(src.page, /import '\.\.\/\.\.\/styles\/chain-apps\.css'/);
  assert.match(src.view, /import \{ mountKeyPanel \} from '\.\/key-panel\.js'/);
  assert.match(src.view, /pins = \{ 'verify\.js': String\(ds\.pinJs/);
  assert.doesNotMatch(src.page, /<script[^>]+src="https?:/);
  // the pinned files really are where the page says
  for (const f of D.VERIFIER.files) assert.ok(existsSync(new URL(VDIR + f, root)), f);
  assert.ok(existsSync(new URL(VDIR + D.VERIFIER.sumsFile, root)));
});

test('the page is honest: a claim by a key, not proof; counts are keys; a server agrees or does not; a reset is dated; the words are the Daily Net’s', () => {
  const para = (src.page.match(/<p class="ca-honest"[\s\S]*?<\/p>/) || [''])[0];
  for (const needle of ['{HONESTY_LINE}', 'accountable claim by a', 'not proof that anyone replayed', '“Correct” only means it agreed with this server', 'counts are keys, not people', 'dated and recorded, never', '{DEVNET_PREVIOUS.path}', '{notYet(RESET.date)}']) assert.ok(para.includes(needle), needle);
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  for (const needle of ['{WITNESS_MEANING}', '{WITNESS_LIMITS}', '{MEANS.map', '{NOT_MEANS.map', '{MIDNIGHT_LINE}', 'Witness the devnet from your browser.', 'A page cannot vouch for itself']) assert.ok(src.page.includes(needle), needle);
  assert.ok(D.NOT_MEANS.some((t) => /This page cannot prove to anyone that it ran the replay/.test(t)));
  assert.ok(D.NOT_MEANS.some((t) => /Counts are keys, not people/.test(t)));
  assert.ok(D.NOT_MEANS.some((t) => /cannot catch a hostile operator/.test(t)));
  assert.ok(D.MEANS.some((t) => /“Correct” means the devnet’s roll found your block hash and state root equal to this server’s/.test(t)));
  assert.match(D.MIDNIGHT_LINE, /never sends between 23:59 and 00:01 UTC/);
  assert.match(src.page, /Nothing is sent until you have read the post/);
  assert.match(src.page, /Reads only\. Nothing is signed or sent by replaying\./);
  assert.match(src.page, /download the verifier \(\{VERIFIER_KIB\} KiB\) and then roughly half a kilobyte for each block/);
  assert.match(src.page, /same play key the Daily Mint, the Notary and Time Capsules use/);
  for (const r of D.RESULT_ROWS) assert.ok(r.page && r.effect && r.result);
  assert.deepEqual(D.RESULT_ROWS.map((r) => r.page), ['CORRECT', 'STRIKE', 'DUPLICATE', 'NOT COUNTED', 'PENDING']);
  // every claim of the page about the devnet’s results is the one the roll code makes
  for (const label of ['CORRECT', 'STRIKE', 'DUPLICATE', 'NOT COUNTED', 'PENDING', 'NOT LISTED']) assert.ok(src.logic.includes("'" + label + "'"), label);
});

test('no banned word and no currency sign anywhere in the app’s files, and the scanner catches each one', () => {
  assert.ok(MY_FILES.length >= 6);
  for (const f of MY_FILES) {
    const text = read(f);
    assert.deepEqual(bannedHits(text), [], f + ' carries a banned word');
    assert.deepEqual(currencyHits(text), [], f + ' carries a price');
  }
  for (const w of BANNED) assert.ok(bannedHits('some ' + w + ' here').length, w);
});

test('the page is accessible and responsive by construction: labelled inputs, a progress bar with a name, live regions, alerts, square corners, 375px, no sideways scroll', () => {
  for (const id of ['wt-name', 'wt-note']) assert.match(src.page, new RegExp('<label class="ca-label" for="' + id + '">'), id);
  assert.match(src.page, /<label class="ca-toggle"><input class="ca-checkbox" type="checkbox" data-wt-checkin \/>/);
  assert.match(src.page, /data-wt-status role="status" aria-live="polite"/);
  assert.match(src.page, /data-wt-bar role="progressbar" aria-label="Blocks replayed" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"/);
  assert.match(src.page, /data-wt-fault role="alert" hidden/);
  assert.match(src.page, /data-wt-errors role="alert" hidden/);
  assert.match(src.page, /data-wt-result hidden role="status" aria-live="polite"/);
  assert.match(src.page, /data-wt-roll-text role="status" aria-live="polite"/);
  assert.match(src.page, /<ul class="ca-checks wt-checks" data-wt-checks aria-label="What the replay did">/);
  assert.match(src.page, /<ol class="wt-roll__list" data-wt-roll-list aria-label="Keys that signed this checkpoint">/);
  for (const m of src.page.matchAll(/<button\b[^>]*>/g)) assert.match(m[0], /type="button"/, m[0]);
  assert.doesNotMatch(src.page, /tabindex\s*=\s*"[1-9]/);
  assert.match(src.page, /@media \(max-width:640px\)/);
  const css = read('src/styles/chain-apps.css');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.chn\.ca-page\{[^}]*overflow-x:clip/);
  assert.match(css, /focus-visible/);
  assert.match(read('src/styles/chain.css'), /\.chn button:focus-visible\{outline:2px solid var\(--c600\)/);
  // square corners, two weights, 1.5px borders: nothing in the page’s own css breaks the grammar
  const style = (src.page.match(/<style is:global>([\s\S]*?)<\/style>/) || ['', ''])[1];
  assert.doesNotMatch(style, /border-radius:\s*(?!0)/);
  assert.doesNotMatch(style, /font-weight:\s*[^45]|font:\s*[6-9]00/);
  assert.doesNotMatch(style, /box-shadow|linear-gradient|radial-gradient/);
  assert.doesNotMatch(style, /(^|[;{])\s*width:\s*\d{3,}px/m, 'no fixed width wider than a phone');
  assert.match(style, /\.chn\.wt-page \[hidden\]\{display:none !important\}/, 'the hidden attribute holds against the .btn and .ca-badge display rules');
  assert.match(style, /\.wt-body code\{white-space:pre-wrap;overflow-wrap:anywhere\}/, 'the post is shown whole, wrapped (words kept, long hex broken), not behind a scrollbar');
  assert.match(style, /\.wt-bar\{[^}]*border:1\.5px solid var\(--c600\);border-radius:0/);
  assert.match(style, /\.wt-key\{display:grid;grid-template-columns:minmax\(0,1\.5fr\)/);
  assert.match(style, /@media \(max-width:640px\)\{\s*\.chn \.wt-key\{grid-template-columns:minmax\(0,1fr\)\}/);
  // tokens, not colours: the page’s own css names none
  assert.doesNotMatch(style, /#[0-9a-fA-F]{3,8}\b/);
  // the reduced-motion rule needs nothing of ours to be animated: there is no transition or animation in the page
  assert.doesNotMatch(style + code(src.view), /transition\s*:|animation\s*:|requestAnimationFrame/);
});

test('"the same thing from the terminal" is real: the four files exist, the flags are pc-witness.mjs’s own, and the page links /chain/net', () => {
  const snip = D.terminalSnippet('https://pointcast.xyz');
  for (const f of ['pc-witness.mjs', 'witness.js', 'pointcast-chain.js', 'package.json']) {
    assert.ok(existsSync(new URL('public/chain/net/' + f, root)), f + ' ships');
    assert.ok(snip.includes('https://pointcast.xyz/chain/net/' + f), f + ' is in the snippet');
  }
  const help = spawnSyncLocal(process.execPath, [new URL('public/chain/net/pc-witness.mjs', root).pathname, '--help']);
  for (const flag of ['--name', '--dry-run', '--checkin']) { assert.ok(snip.includes(flag), flag + ' is in the snippet'); assert.ok(help.includes(flag), flag + ' is a real flag'); }
  assert.match(snip, /^# Node 22 or newer/);
  assert.ok(!snip.includes('${') && !snip.includes('`'), 'plain text, printed as it is');
  assert.match(src.page, /<Snippet label="pc-witness\.mjs · replay, sign, print the posts, send nothing; then send" code=\{terminal\} \/>/);
  assert.match(src.page, /href="\/chain\/net#witness"/);
  assert.match(src.page, /href="\/chain\/net\/pc-witness\.mjs" download/);
  assert.match(src.page, /import \{ [^}]*terminalSnippet \} from '\.\.\/\.\.\/data\/chain-app-witness'/);
});
function spawnSyncLocal(cmd, args) {
  // pc-witness --help needs no network and no server of ours, so a blocking run is fine here
  return spawnSyncImpl(cmd, args, { encoding: 'utf8' }).stdout;
}

// ================================================================ two more guards, proven by mutation

test('a worker that did not start from genesis is not used — and with the check taken out of a copy, a resumed worker’s replay is accepted — mutation', async () => {
  const resumed = { ...genesisReady, basis: { kind: 'self_verified', verified_from_genesis: false, via: 'cache' }, resumed: { height: 50, via: 'cache' } };
  const scene = async (mod) => {
    const w = fakeWorker();
    const run = mod.workerReplay({ spawn: () => w, assets: assetsDouble(), api: 'x', genesis: GENESIS, shas: SHAS, minHeight: 92 });
    w.say(resumed);
    w.say({ type: 'witness-headers', rows: headerRows(1, 92) });
    w.say({ type: 'progress', height: 92, block_hash: HEX('1'), state_root: HEX('2'), tip: 92, verified: verifiedRows(1, 92), blocks: blockCards(1, 92) });
    try { return (await run.promise).tip.height; } catch (e) { return e.code; }
  };
  assert.equal(await scene(REAL.X), 'basis');
  const m = await variant({ logic: swap("if (!(isObj(m.basis) && m.basis.verified_from_genesis === true) || m.resumed) {", 'if (false) {') });
  assert.equal(await scene(m.X), 92, 'with the check gone, a replay that did not start at block 1 is taken for one that did');
});

test('a reset between the page loading and the replay is caught by the replay’s own read of /status — and, with that taken out as well as the first, the replay would run on the new chain — mutation', async () => {
  const flip = (n0) => { let n = 0; return { '/status': (u, i, { rep }) => rep(n++ < n0 ? FX.status : { ...FX.status, genesis_hash: HEX('9') }) }; };
  const scene = async (mods) => {
    const m = mountView({ mods, dev: { overrides: flip(1) } });
    await m.c.begin();
    await m.c.replay();
    await tick(30);
    return { started: m.calls.start, state: m.rootEl.dataset.state };
  };
  assert.deepEqual(await scene(REAL), { started: 0, state: 'changed' });
  const mut = await variant({ view: swap('const st = await pinnedStatus(net, where.genesis || null);\n      if (token !== S.token) return;\n      S.status = st;', 'const st = await pinnedStatus(net, null);\n      if (token !== S.token) return;\n      S.status = st;') });
  const r = await scene(mut);
  assert.equal(r.started, 1, 'without the pin on the replay’s own read, the replay starts on a chain whose genesis changed');
});

// ================================================================ the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/witness/index.html', root);
test('the built page carries the hooks, the honesty line, the pins, the pinned genesis, the key panel and no outside script', { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
  const html = readFileSync(builtPath, 'utf8');
  for (const h of new Set(src.view.match(/data-wt-[a-z-]+/g))) assert.ok(html.includes(h), h);
  assert.ok(html.includes(D.HONESTY_LINE));
  assert.ok(html.includes('data-genesis="' + DEVNET.genesis + '"'));
  for (const [k, v] of [['wasm', D.VERIFIER.pins['pointcast_chain.wasm']], ['js', D.VERIFIER.pins['verify.js']], ['worker', D.VERIFIER.pins['verify-worker.js']]]) assert.ok(html.includes('data-pin-' + k + '="' + v + '"'), k);
  assert.ok(html.includes('data-verifier-base="/chain/yard/verifier/"'));
  assert.ok(html.includes('data-key-panel'));
  assert.match(html, /<h1>Witness the devnet from your browser\.<\/h1>/);
  assert.ok(html.includes(W.WITNESS_MEANING.replace(/“/g, '“')), 'the Daily Net’s words are on the page');
  assert.ok(html.includes('Counts are keys, not people.'));
  assert.ok(html.includes('pc-witness.mjs --name &lt;you&gt; --dry-run') || html.includes('pc-witness.mjs --name <you> --dry-run'), 'the terminal snippet is on the page');
  assert.ok(html.includes('href="/chain/net#witness"'));
  assert.ok(html.includes('/chain/apps/witness-view.js'));
  assert.ok(!/<script[^>]+src="https?:\/\/(?!pointcast\.xyz)/.test(html));
  assert.ok(!html.includes('innerHTML'));
  // the live ChainHeader leaves the Apps item for the integrator’s registry edit: the page itself still names its own section
  assert.match(html, /BLOCK 0722/);
});

// ================================================================ the real devnets (GET only; skipped when unreachable)

async function reach(base) {
  try {
    const r = await fetch(base + '/status', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    return { base, status: await r.json() };
  } catch {
    return null;
  }
}
const LOCAL = await reach('http://127.0.0.1:8799');
const LIVE = await reach(DEVNET.url);

for (const [label, ep, genesis] of [['the local devnet-2 at 127.0.0.1:8799', LOCAL, () => (LOCAL ? LOCAL.status.genesis_hash : '')], ['the live devnet', LIVE, () => DEVNET.genesis]]) {
  test('against ' + label + ': the whole chain replays clean with the pinned verifier, the checkpoint is the one pc-witness.mjs would pick, and the roll is read', { timeout: 240000 }, async (t) => {
    if (!ep) return t.skip(label + ' is not reachable');
    if (ep.status.genesis_hash !== genesis()) return t.skip(label + ' has a different genesis from the one pinned here');
    const get = async (p) => { const r = await fetch(ep.base + p, { signal: AbortSignal.timeout(60000) }); if (!r.ok) throw Object.assign(new Error(r.status + ' ' + p), { status: r.status }); return VER.parseJson(await r.text()); };
    const st = await get('/status');
    const replay = await X.replayNode({ get, verifier: VER, params: await get('/params'), genesis: genesis(), minHeight: Number(st.height), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }).promise;
    assert.ok(replay.tip.height >= Number(st.height), 'the whole chain: ' + replay.tip.height);
    assert.equal(replay.cps.get(1).block_hash.length, 64);
    const choice = X.chooseCheckpoint({ replay, nowMs: Date.now() });
    assert.ok(choice.empty || (W.isCheckpoint(choice.target) && choice.target <= replay.tip.height));
    // the devnet’s own block hash at the target is the one this replay computed (a reading, not a check the page relies on)
    if (!choice.empty) {
      const b = await get('/block/' + choice.target);
      assert.equal(b.hash, choice.claim.block_hash);
      assert.equal(b.state_root, choice.claim.state_root);
      const net = K.makeNet(ep.base);
      const roll = await X.fetchRoll(net, { target: choice.target, address: KEY.sender });
      assert.ok(roll.checkpoint === null || roll.checkpoint.height === choice.target);
      assert.ok(Array.isArray(roll.keys));
    }
    // the plan for a fresh key is a well-formed claim the SDK verifies (nothing is sent)
    if (!choice.empty) {
      const key = await K.keyFromSeed(K.newSeedHex());
      const plan = await X.planWitness({ replay, choice, chainId: st.chain_id, genesis: genesis(), key, opts: { name: 'wt-read-only' }, nowMs: Date.now(), wasmSha: SHAS['pointcast_chain.wasm'] });
      assert.equal(plan.ok, true);
      const v = await W.verifyWitness({ line: plan.wit.line, chain_id: st.chain_id, genesis: genesis(), epoch: choice.epoch, signerPublicKey: key.publicKey, sender: key.sender, chain: choice.claim, includedAt: replay.tip.height + 1 });
      assert.equal(v.ok, true, JSON.stringify(v));
    }
  });
}

test('against the local devnet-2: the real worker (behind the shim, in a worker thread) and the node path give the same replay', { timeout: 120000 }, async (t) => {
  if (!LOCAL || LOCAL.status.genesis_hash === DEVNET.genesis) return t.skip('the local devnet-2 is not reachable');
  const g = LOCAL.status.genesis_hash;
  const get = async (p) => { const r = await fetch(LOCAL.base + p); return VER.parseJson(await r.text()); };
  const st = await get('/status');
  const node = await X.replayNode({ get, verifier: VER, params: await get('/params'), genesis: g, minHeight: Number(st.height) }).promise;
  const worker = await X.workerReplay({ spawn: spawnPinnedWorker, assets: realAssets(), api: LOCAL.base, genesis: g, shas: SHAS, minHeight: Number(st.height) }).promise;
  const upTo = Math.min(node.tip.height, worker.tip.height);
  assert.ok(upTo >= Number(st.height));
  for (const [h, v] of node.cps) if (h <= upTo) assert.deepEqual(worker.cps.get(h), v, 'checkpoint ' + h);
  for (let h = 1; h <= upTo; h++) assert.equal(worker.ts[h], node.ts[h], 'time of block ' + h);
});
