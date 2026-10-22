// End-to-end run of "Witness in your browser" against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-witness.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799. WRITES GO
// ONLY TO A LOCAL DEVNET: the attestations are made there, with throwaway keys. The
// public devnet is only ever read (GET), and --live repeats the read checks on it
// (a full replay, the checkpoint, a plan that is never sent). What it does, in order,
// printing one line per result:
//   1. loads the Block Yard's verifier from this repo and checks it against the pins
//      (the page's three, and pointcast_chain.wasm.sha256);
//   2. replays the whole chain from genesis in node (the node verifier path), with
//      progress, no fault, every header bound to a verified block;
//   3. picks the checkpoint, and runs pc-witness.mjs --dry-run beside it: the same
//      epoch, UTC day, day checkpoint and target;
//   4. replays again in the REAL pinned worker behind the shim (a worker thread) and
//      compares: the same checkpoints and times;
//   5. makes a throwaway key, plans the attestation and a check-in, verifies the claim
//      offline with witness.js, sends both, waits for the blocks, and reads the local
//      devnet's own /checkpoints/{h}/witnesses, /witness/{addr} and /witnesses: the
//      attestation must be judged CORRECT;
//   6. plans again with the same key and the same chain: "already attested today",
//      nothing to send, no POST made;
//   7. the page's view over the built page (dist/): replay, review (the post word for
//      word, nothing sent), Send, the roll says CORRECT; a second replay says it
//      already attested and sends nothing; a wrong pin stops at GENESIS CHANGED;
//   8. --live: replays the public chain read only, picks the checkpoint, builds a plan
//      for a fresh key and verifies it offline, reads the roll, sends nothing.
// Exit status 1 on any mismatch.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { DEVNET } from '../src/data/chain-home.ts';
import * as D from '../src/data/chain-app-witness.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as X from '../public/chain/apps/witness.js';
import * as view from '../public/chain/apps/witness-view.js';
import * as W from '../public/chain/net/witness.js';
import { builtSection, harness, root, reach, sleep, sturdyFetch, until } from './lib/e2e-chain-apps.mjs';

const h = harness('Witness in your browser', 'e2e-chain-app-witness');
const { say, check } = h;
const api = h.api;
const isLocal = api.startsWith('http://127.0.0.1');
const status = await reach(api);
if (!status) { say('FAIL no devnet answers at ' + api); process.exit(1); }
say('node ' + api + ' · ' + status.chain_id + ' · tip ' + status.height + ' · genesis ' + status.genesis_hash.slice(0, 12) + '…');
const pinned = isLocal ? status.genesis_hash : DEVNET.genesis;
const net = K.makeNet(api, { fetch: sturdyFetch });
const VDIR = new URL('public/chain/yard/verifier/', root);
const files = () => Object.fromEntries(X.VERIFIER_FILES.map((n) => [n, new Uint8Array(readFileSync(new URL(n, VDIR)))]));
const sums = readFileSync(new URL('pointcast_chain.wasm.sha256', VDIR), 'utf8');

// 1. the verifier, pinned
const verifier = await X.loadPinnedVerifier({ files: files(), pins: D.VERIFIER.pins, sumsText: sums });
check(X.VERIFIER_FILES.every((n) => verifier.sha[n] === D.VERIFIER.pins[n]), 'the Block Yard’s verifier matches the page’s three pins and pointcast_chain.wasm.sha256 (wasm ' + verifier.sha['pointcast_chain.wasm'].slice(0, 12) + '…)');
const tampered = files();
tampered['pointcast_chain.wasm'][1234] ^= 1;
let refused = '';
try { await X.checkVerifierBytes(tampered, D.VERIFIER.pins, sums); } catch (e) { refused = e.name; }
check(refused === 'PinError', 'one flipped byte in the wasm is refused (' + refused + ')');

// 2. the replay, in node
const get = async (path) => {
  const r = await sturdyFetch(api + path, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw Object.assign(new Error(r.status + ' ' + path), { status: r.status });
  return verifier.parseJson(await r.text());
};
const st0 = await get('/status');
const progress = [];
const t0 = Date.now();
const replay = await X.replayNode({ get, verifier, params: await get('/params'), genesis: pinned, minHeight: Number(st0.height), onProgress: (p) => progress.push(p) }).promise;
check(replay.tip.height >= Number(st0.height) && progress.length >= 1 && progress.at(-1).height === replay.tip.height, 'replayed ' + replay.tip.height + ' blocks from genesis in ' + (Date.now() - t0) + ' ms, no fault (' + progress.length + ' progress report' + (progress.length === 1 ? '' : 's') + ', the last ' + progress.at(-1).height + ' of ' + progress.at(-1).tip + ')');
check(replay.ts.filter((t) => Number.isFinite(t)).length === replay.tip.height, 'every block’s time is bound to a block the verifier accepted (' + replay.tip.height + ' headers re-hashed)');
const epochNow = replay.cps.get(1).block_hash;
const live = await get('/block/1');
check(live.hash === epochNow, 'the epoch from the replay (block 1’s hash ' + epochNow.slice(0, 12) + '…) is the one the devnet shows');

// 3. the checkpoint, beside pc-witness.mjs
const nowMs = Date.now();
const choice = X.chooseCheckpoint({ replay, nowMs });
say('day ' + choice.day + ' · day checkpoint ' + (choice.dayCp === null ? 'not sealed yet' : choice.dayCp) + ' · target ' + choice.target);
check(!choice.empty && W.isCheckpoint(choice.target) && choice.target <= replay.tip.height, 'a sealed checkpoint to attest: №' + choice.target + ', root ' + (choice.claim && choice.claim.state_root.slice(0, 12)));
async function pcWitness() {
  const dir = mkdtempSync(join(tmpdir(), 'witness-e2e-pcw-'));
  try {
    return await new Promise((resolve) => {
      const c = spawn(process.execPath, [new URL('public/chain/net/pc-witness.mjs', root).pathname, '--devnet', api, '--genesis', pinned, '--verifier', new URL('public/chain/yard/verifier/', root).pathname, '--dir', dir, '--dry-run', '--name', 'wt-e2e-parity']);
      let out = '';
      c.stdout.on('data', (d) => { out += d; });
      c.stderr.on('data', (d) => { out += d; });
      c.on('close', (code) => resolve({ code, out }));
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const theirs = await pcWitness();
const m1 = /WIT · witness · h(\d+) · root ([0-9a-f]{12})/.exec(theirs.out);
if (theirs.code !== 0 || !m1) say('note pc-witness.mjs --dry-run did not answer as expected (exit ' + theirs.code + '): ' + theirs.out.split('\n').slice(0, 3).join(' | '));
else {
  // other runs post to the local devnet while this one goes: a later checkpoint is possible when the day checkpoint is not sealed yet
  const same = Number(m1[1]) === choice.target && m1[2] === choice.claim.state_root.slice(0, 12);
  const laterOnly = choice.dayCp === null && Number(m1[1]) >= choice.target;
  check(same || laterOnly, 'pc-witness.mjs --dry-run picks the same checkpoint: №' + m1[1] + ' root ' + m1[2] + (same ? '' : ' (the chain moved on while this ran)'));
  check(theirs.out.includes('epoch ' + choice.epoch.slice(0, 12)) && theirs.out.includes('day ' + choice.day + ' '), 'and the same epoch and UTC day (' + choice.epoch.slice(0, 12) + '…, ' + choice.day + ')');
}

// 4. the real worker
function spawnPinnedWorker() {
  const prelude = [
    "const { parentPort, workerData } = require('node:worker_threads');",
    'globalThis.self = globalThis;',
    'globalThis.postMessage = (m) => parentPort.postMessage(m);',
    'globalThis.onmessage = null;',
    "parentPort.on('message', (d) => { if (typeof globalThis.onmessage === 'function') globalThis.onmessage({ data: d }); });",
    "import(workerData.shim).then(() => parentPort.postMessage({ type: 'shim-loaded' }), (e) => parentPort.postMessage({ type: 'error', message: String(e) }));",
  ].join('\n');
  const w = new Worker(prelude, { eval: true, workerData: { shim: pathToFileURL(new URL('public/chain/apps/witness-shim.js', root).pathname).href } });
  const fake = { onmessage: null, onerror: null, postMessage: (m, t) => w.postMessage(m, t || []), terminate: () => w.terminate() };
  w.on('message', (m) => { if (m.type !== 'shim-loaded' && fake.onmessage) fake.onmessage({ data: m }); });
  w.on('error', (e) => fake.onerror && fake.onerror(e));
  return fake;
}
const f = files();
const dataUrl = (b) => 'data:text/javascript;base64,' + Buffer.from(b).toString('base64');
const assets = { verifyJsUrl: dataUrl(f['verify.js']), workerUrl: dataUrl(f['verify-worker.js']), wasmCopy: () => f['pointcast_chain.wasm'].slice().buffer, revoke() {} };
const wprog = [];
const worker = await X.workerReplay({ spawn: spawnPinnedWorker, assets, api, genesis: pinned, shas: verifier.sha, minHeight: Number(st0.height), onProgress: (p) => wprog.push(p) }).promise;
const upTo = Math.min(worker.tip.height, replay.tip.height);
let same = true;
for (const [hh, v] of replay.cps) if (hh <= upTo && (worker.cps.get(hh) || {}).block_hash !== v.block_hash) same = false;
for (let hh = 1; hh <= upTo; hh++) if (worker.ts[hh] !== replay.ts[hh]) same = false;
check(same && worker.tip.height >= Number(st0.height), 'the real pinned worker, behind the shim (a worker thread), replays to ' + worker.tip.height + ' and agrees with the node path on every checkpoint and every block time (' + wprog.length + ' progress report' + (wprog.length === 1 ? '' : 's') + ')');

// 5. a throwaway key attests on the local devnet
let postsMade = 0;
const countingFetch = (u, o = {}) => { if ((o.method || 'GET') === 'POST') postsMade += 1; return sturdyFetch(u, o); };
if (isLocal) {
  h.localOnly(api);
  if (X.nearMidnight(Date.now())) say('note it is the midnight UTC minute: the page would refuse to send, so the write checks are skipped (run again after 00:01 UTC)');
  else {
    const key = await K.keyFromSeed(K.newSeedHex());
    const name = 'wt-e2e-' + Math.random().toString(36).slice(2, 8);
    const plan = await X.planWitness({ replay, choice, chainId: status.chain_id, genesis: pinned, key, opts: { name, checkin: true, note: 'witness e2e' }, nowMs: Date.now(), wasmSha: verifier.sha['pointcast_chain.wasm'] });
    check(plan.ok && plan.sendable && plan.wit && plan.net, 'planned: ' + plan.wit.title + ' · ' + plan.net.title);
    const offline = await W.verifyWitness({ line: plan.wit.line, chain_id: status.chain_id, genesis: pinned, epoch: choice.epoch, signerPublicKey: key.publicKey, sender: key.sender, chain: choice.claim, includedAt: replay.tip.height + 1 });
    check(offline.ok, 'the claim verifies offline with witness.js: signature, epoch, checkpoint and the replay’s own block hash and state root (digest ' + offline.digest.slice(0, 12) + '…)');
    const chain = await K.connectPinned(api, { pinned, env: { fetch: countingFetch } });
    const before = postsMade;
    const sent = await X.sendWitness({ chain, net, key, plan, now: () => Date.now(), replayedAt: Date.now() });
    check(postsMade - before === 4 && sent.wit.height > 0 && sent.net.height > sent.wit.height, 'sent: attestation in block ' + sent.wit.height + ' (tx ' + sent.wit.txHash.slice(0, 12) + '…, counts for ' + sent.wit.counted + '), check-in in block ' + sent.net.height + ' (counts for ' + sent.net.counted + ')');
    const polled = await X.pollRoll({ net, target: choice.target, address: key.sender, txHash: sent.wit.txHash, includedAt: sent.wit.height, everyMs: 700, tries: 30, sleep });
    check(polled.standing.state === 'correct', 'the local devnet’s /checkpoints/' + choice.target + '/witnesses judges it ' + polled.standing.label + (polled.roll.checkpoint ? ' (' + polled.roll.checkpoint.distinct + ' key' + (polled.roll.checkpoint.distinct === 1 ? '' : 's') + ' at this checkpoint, ' + polled.roll.checkpoint.correct + ' correct, ' + polled.roll.checkpoint.strikes + ' strikes)' : ''));
    const raw = await net.get('/checkpoints/' + choice.target + '/witnesses');
    const row = raw.witnesses.find((w) => w.addr === key.sender);
    check(Boolean(row) && row.result === 'correct' && row.tx === sent.wit.txHash && row.name === name && row.name_bound === true, 'its own row: result ' + (row && row.result) + ', name ' + (row && row.name) + ' bound ' + (row && row.name_bound) + ', tx matches');
    const one = await net.get('/witness/' + key.sender);
    check(one && one.witness.correct === 1 && one.witness.strikes === 0 && one.witness.attestations === 1 && one.witness.name === name, 'GET /witness/{addr}: ' + one.witness.attestations + ' attestation, ' + one.witness.correct + ' correct, ' + one.witness.strikes + ' strikes, streak ' + one.witness.streak);
    const roll = await X.fetchRoll(net, { target: choice.target, address: key.sender });
    check(Boolean(roll.mine) && roll.mine.correct === 1 && roll.keys.length >= 1, 'GET /witnesses lists the key (' + roll.keys.length + ' witness key' + (roll.keys.length === 1 ? '' : 's') + ' on the roll)');
    // 6. again, same key, same chain: already attested today
    const replay2 = await X.replayNode({ get, verifier, params: await get('/params'), genesis: pinned, minHeight: Number(st0.height) }).promise;
    const choice2 = X.chooseCheckpoint({ replay: replay2, nowMs: Date.now() });
    const again = await X.planWitness({ replay: replay2, choice: choice2, chainId: status.chain_id, genesis: pinned, key, opts: { name, checkin: true }, nowMs: Date.now(), wasmSha: verifier.sha['pointcast_chain.wasm'] });
    check(again.ok && !again.sendable && again.wit === null && again.net === null && /You attested today already/.test(again.witSkip.why) && /You checked in today already/.test(again.netSkip), 'plans again: “' + again.witSkip.why.slice(0, 70) + '…” and nothing to send');
    const postsBefore = postsMade;
    let refusedAgain = '';
    try { await X.sendWitness({ chain, net, key, plan: again, now: () => Date.now(), replayedAt: Date.now() }); } catch (e) { refusedAgain = e.code; }
    check(refusedAgain === 'nothing' && postsMade === postsBefore, 'sending that plan is refused (nothing to send) and no POST was made');

    // 7. the page’s view over the built page
    const url = 'http://localhost/chain/witness/?devnet=' + api + '&genesis=' + pinned;
    const sec = builtSection('dist/chain/witness/index.html', '[data-witness-app]', url);
    if (!sec) say('note dist/chain/witness is absent: build the site to run the page checks (npm run build:bare)');
    else {
      const $ = (s) => sec.section.querySelector(s);
      const win = sec.dom.window;
      let blob = 0;
      win.URL.createObjectURL = () => 'blob:e2e/' + (blob += 1);
      win.URL.revokeObjectURL = () => {};
      const served = async (u) => { const n = String(u).split('/').pop(); const body = n === 'pointcast_chain.wasm.sha256' ? new TextEncoder().encode(sums) : files()[n]; return { ok: true, status: 200, arrayBuffer: async () => body.slice().buffer }; };
      const store = new Map();
      const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
      const viewPosts = [];
      const logFetch = (u, o = {}) => { if ((o.method || 'GET') === 'POST') viewPosts.push(new URL(String(u)).pathname); return sturdyFetch(u, o); };
      // the replay the page asks for is the node path over this devnet: the same code, with the pinned verifier loaded above
      const params = await get('/params');
      const start = ({ genesis, minHeight, onProgress }) => X.replayNode({ get, verifier, params, genesis, minHeight, onProgress });
      const c2 = view.mount(sec.section, { window: win, fetch: logFetch, storage, now: () => Date.now(), sleep, verifierFetch: served, startReplay: start });
      await c2.begin();
      check(sec.section.dataset.state === 'ready', 'the built page reads the devnet and says ready');
      const k2 = await K.keyFromSeed(K.newSeedHex());
      await c2.keys.setSeed(k2.seedHex);
      const name2 = 'wt-page-' + Math.random().toString(36).slice(2, 8);
      $('[data-wt-name]').value = name2;
      $('[data-wt-name]').dispatchEvent(new win.Event('input'));
      $('[data-wt-checkin]').checked = true;
      $('[data-wt-checkin]').dispatchEvent(new win.Event('change'));
      $('[data-wt-note]').value = 'from the built page';
      await c2.replay();
      check(sec.section.dataset.state === 'replayed' && $('[data-wt-bar]').getAttribute('aria-valuenow') === $('[data-wt-bar]').getAttribute('aria-valuemax') && /blocks replayed$/.test($('[data-wt-progress-text]').textContent), 'Replay: ' + $('[data-wt-progress-text]').textContent + ' · ' + [...sec.section.querySelectorAll('[data-wt-checks] li')].map((li) => li.dataset.state).join(' '));
      await until(() => !$('[data-wt-confirm]').hidden, 8000, 100);
      const posted0 = viewPosts.length;
      check(!$('[data-wt-confirm]').hidden && $('[data-wt-wit-title]').textContent.includes(' · ' + name2) && posted0 === 0, 'Review shows the post word for word (' + $('[data-wt-wit-title]').textContent + ') and sends nothing');
      $('[data-wt-send]').click();
      const done = await until(() => ['ok', 'bad', 'warn'].includes($('[data-wt-result]').dataset.state), 40000, 300);
      check(Boolean(done) && $('[data-wt-result]').dataset.state === 'ok' && viewPosts.length === 4, 'Send: ' + $('[data-wt-result-text]').textContent.slice(0, 90) + '…');
      const correct = await until(() => $('[data-wt-roll-state]').textContent === 'CORRECT', 40000, 300);
      check(Boolean(correct) && sec.section.querySelector('[data-wt-roll-list] [data-mine="yes"]') !== null, 'the page’s roll says CORRECT and marks the key’s own row: ' + $('[data-wt-roll-foot]').textContent.slice(0, 100));
      const raw2 = await net.get('/checkpoints/' + (c2.state.choice.target) + '/witnesses');
      check(raw2.witnesses.some((w) => w.addr === k2.sender && w.result === 'correct' && w.name === name2), 'and the devnet’s own roll agrees (name ' + name2 + ', correct)');
      // again: the page’s second replay finds the attestation and sends nothing
      await c2.replay();
      await until(() => !$('[data-wt-confirm]').hidden, 8000, 100);
      check(/You attested today already/.test($('[data-wt-skip]').textContent) && $('[data-wt-send]').hidden && viewPosts.length === 4, 'a second Replay: “' + $('[data-wt-skip]').textContent.slice(0, 60) + '…” and Send is not offered');
      c2.stop();
      // the wrong pin
      const wrong = builtSection('dist/chain/witness/index.html', '[data-witness-app]', 'http://localhost/chain/witness/?devnet=' + api + '&genesis=' + '9'.repeat(64));
      const c3 = view.mount(wrong.section, { window: wrong.dom.window, fetch: sturdyFetch, storage: null });
      await c3.begin();
      check(wrong.section.dataset.state === 'changed', 'a wrong pin stops the page at GENESIS CHANGED');
    }
  }
}

// 8. the public devnet, read only
if (h.flag('--live')) {
  const lv = await reach(DEVNET.url);
  if (!lv) say('note the public devnet is not reachable');
  else if (lv.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + lv.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else {
    const lget = async (p) => { const r = await sturdyFetch(DEVNET.url + p, { signal: AbortSignal.timeout(60000) }); if (!r.ok) throw Object.assign(new Error(r.status + ' ' + p), { status: r.status }); return verifier.parseJson(await r.text()); };
    const ls = await lget('/status');
    const t1 = Date.now();
    const lr = await X.replayNode({ get: lget, verifier, params: await lget('/params'), genesis: DEVNET.genesis, minHeight: Number(ls.height) }).promise;
    check(lr.tip.height >= Number(ls.height), 'live: replayed ' + lr.tip.height + ' blocks from genesis in ' + (Date.now() - t1) + ' ms, no fault');
    const lc = X.chooseCheckpoint({ replay: lr, nowMs: Date.now() });
    const key = await K.keyFromSeed(K.newSeedHex());
    const lp = await X.planWitness({ replay: lr, choice: lc, chainId: ls.chain_id, genesis: DEVNET.genesis, key, opts: { name: 'wt-live-read' }, nowMs: Date.now(), wasmSha: verifier.sha['pointcast_chain.wasm'] });
    const ok = lp.ok ? await W.verifyWitness({ line: lp.wit.line, chain_id: ls.chain_id, genesis: DEVNET.genesis, epoch: lc.epoch, signerPublicKey: key.publicKey, sender: key.sender, chain: lc.claim, includedAt: lr.tip.height + 1 }) : { ok: false };
    check(lp.ok && ok.ok, 'live: checkpoint №' + lc.target + ' (day ' + lc.day + ', day checkpoint ' + (lc.dayCp === null ? 'not sealed yet' : lc.dayCp) + ') makes a claim that verifies offline; it is not sent');
    const lroll = await X.fetchRoll(K.makeNet(DEVNET.url, { fetch: sturdyFetch }), { target: lc.target, address: key.sender });
    say('live: ' + (lroll.checkpoint ? lroll.checkpoint.distinct + ' key(s) signed №' + lc.target : 'no roll for №' + lc.target + ' yet') + ' · ' + lroll.keys.length + ' witness key(s) on the roll');
    check(true, 'live: nothing was written (every request above was a GET)');
  }
}
h.finish();
