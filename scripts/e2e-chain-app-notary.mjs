// End-to-end run of the Notary against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-notary.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799. WRITES GO
// ONLY TO A LOCAL DEVNET: the stamps are made there, with a throwaway key. The public
// devnet is only ever read (GET), and --live repeats the read checks on it. What it
// does, in order, printing one line per result:
//   1. hashes a file (bytes of its own) and stamps it: a signed post on NOTARY whose
//      body is the five lines;
//   2. finds the stamp by the file's hash alone, then checks it from its block: the five
//      Verify a block steps and the Notary's own checks, STAMPED;
//   3. checks a different file against the same stamp (NOT STAMPED, the file check red)
//      and a hash nobody stamped (not found, with how far the scan looked);
//   4. checks from the receipt, and reads the receipt back strictly;
//   5. runs the "same check, in code" script from the page against the node;
//   6. the page's view over the built page (dist/): hash text, key, review, send, check;
//   7. --live: finds nothing for an unstamped hash, and checks any stamps the public
//      devnet holds, read only.
// Exit status 1 on any mismatch.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEVNET } from '../src/data/chain-home.ts';
import { checkSnippet } from '../src/data/chain-app-notary.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as N from '../public/chain/apps/notary.js';
import * as view from '../public/chain/apps/notary-view.js';
import { builtSection, harness, root, reach, sleep, sturdyFetch, until } from './lib/e2e-chain-apps.mjs';

const h = harness('Notary', 'e2e-chain-app-notary');
const { say, check } = h;
const api = h.api;
const isLocal = api.startsWith('http://127.0.0.1');
const status = await reach(api);
if (!status) { say('FAIL no devnet answers at ' + api); process.exit(1); }
say('node ' + api + ' · ' + status.chain_id + ' · tip ' + status.height + ' · genesis ' + status.genesis_hash.slice(0, 12) + '…');
const net = K.makeNet(api, { fetch: sturdyFetch });
const pinned = isLocal ? status.genesis_hash : DEVNET.genesis;
const env = { fetch: sturdyFetch };

if (isLocal) {
  h.localOnly(api);
  const chain = await K.connectPinned(api, { pinned });
  const key = await K.keyFromSeed(K.newSeedHex());
  // 1. stamp a file
  const bytes = new TextEncoder().encode('e2e notary file ' + Math.random() + '\n' + 'x'.repeat(2000));
  const file = await N.hashFile(bytes);
  say('file: ' + file.bytes + ' bytes, SHA-256 ' + file.sha256.slice(0, 16) + '…');
  const stamped = await N.stampHash({ chain, net, key, sha256: file.sha256, bytes: file.bytes, name: 'e2e.txt', note: 'notary e2e' });
  check(Number.isInteger(stamped.height) && stamped.receipt.stamp.sender === key.sender, 'stamped in block ' + stamped.height + ' by ' + K.shortAddr(key.sender) + ' (tx ' + stamped.txHash.slice(0, 12) + '…)');
  check(stamped.receipt.stamp.block_hash.length === 64 && stamped.receipt.stamp.time_ms > 1.7e12, 'the receipt names the block hash and its time (' + K.utc(stamped.receipt.stamp.time_ms) + ')');
  // 2. find and check
  const found = await N.findStamps(net, file.sha256);
  check(found.stamps.length === 1 && found.stamps[0].txHash === stamped.txHash && found.stamps[0].stamp.name === 'e2e.txt' && found.stamps[0].stamp.note === 'notary e2e', 'found by the hash alone: block ' + (found.stamps[0] && found.stamps[0].height) + ', scanned ' + found.scannedBlocks + ' blocks in ' + found.pages + ' pages' + (found.complete ? ' (all of them)' : ''));
  const ref = { height: stamped.height, txHash: stamped.txHash };
  const ok = await N.checkStamp({ api, genesis: null, pinSource: 'node', ref, sha256: file.sha256, env });
  check(ok.checks.every((c) => c.state === 'pass' || c.id === 'pin') && ok.verdict === 'PARTLY' && ok.checks.some((c) => c.id === 'pin' && c.state === 'skip'), 'checked against the node’s own genesis (a local test): ' + ok.verdict + ', every check passes and the pin says it is unpinned');
  const pinnedCheck = await N.checkStamp({ api, genesis: pinned, pinSource: 'pinned', ref, sha256: file.sha256, env });
  check(pinnedCheck.verdict === 'STAMPED', 'checked with the genesis pinned: ' + pinnedCheck.verdict + (pinnedCheck.newest ? ' (the newest block: its forward link waits for the next one)' : '') + ' · ' + pinnedCheck.checks.map((c) => c.id + ' ' + c.state).join(', '));
  // 3. the wrong file, and a hash nobody stamped
  const wrong = await N.checkStamp({ api, genesis: pinned, pinSource: 'pinned', ref, sha256: (await N.hashText('another file')).sha256, env });
  check(wrong.verdict === 'NOT STAMPED' && wrong.checks.find((c) => c.id === 'file').state === 'fail', 'a different file against the same stamp: ' + wrong.verdict + ' (the file check is red)');
  const none = await N.findStamps(net, (await N.hashText('nobody stamped this ' + Math.random())).sha256);
  check(none.stamps.length === 0 && none.complete, 'a hash nobody stamped is not found, and the scan says it read every block that carries transactions (' + none.scannedBlocks + ')');
  // 4. the receipt
  const back = N.readReceipt(JSON.stringify(stamped.receipt));
  check(back.txHash === stamped.txHash && back.height === stamped.height && back.sha256 === file.sha256 && back.genesis === status.genesis_hash, 'the receipt reads back strictly and names this devnet’s genesis');
  const tx = await N.lookupTx(net, stamped.txHash);
  check(tx.status === 'included' && tx.height === stamped.height, 'GET /tx/HASH says included at block ' + tx.height);
  // 5. the script on the page
  const dir = mkdtempSync(join(tmpdir(), 'notary-e2e-'));
  try {
    copyFileSync(new URL('public/chain/first-mints/lib/pointcast-chain.js', root), join(dir, 'pointcast-chain.js'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'notary-check.mjs'), checkSnippet(api, status.genesis_hash));
    writeFileSync(join(dir, 'file.bin'), bytes);
    const run = spawnSync(process.execPath, [join(dir, 'notary-check.mjs'), join(dir, 'file.bin'), String(stamped.height), stamped.txHash], { encoding: 'utf8', cwd: dir });
    check(run.status === 0 && /tx_root: true\nbody hashes to the signed body_hash: true\nbody names your file: true/.test(run.stdout), 'the script from the page, run under Node: ' + run.stdout.trim().split('\n').join(' · '));
    writeFileSync(join(dir, 'other.bin'), 'not the file');
    const other = spawnSync(process.execPath, [join(dir, 'notary-check.mjs'), join(dir, 'other.bin'), String(stamped.height), stamped.txHash], { encoding: 'utf8', cwd: dir });
    check(/body names your file: false/.test(other.stdout), 'and with another file it says so: body names your file: false');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  // 6. the page's view over the built page
  const sec = builtSection('dist/chain/notary/index.html', '[data-notary-app]', 'http://localhost/chain/notary/?devnet=' + api);
  if (!sec) say('note dist/chain/notary is absent: build the site to run the page checks (npm run build:bare)');
  else {
    const c = view.mount(sec.section, { window: sec.dom.window, fetch: sturdyFetch, storage: null, now: () => Date.now() });
    await c.begin();
    const $ = (s) => sec.section.querySelector(s);
    check(sec.section.dataset.state === 'ready', 'the built page reads the devnet and says ready');
    const text = 'page e2e ' + Math.random();
    $('[data-nt-text]').value = text;
    $('[data-nt-text-go]').click();
    await sleep(100);
    const want = await N.hashText(text);
    check($('[data-nt-hash]').textContent === want.sha256, 'the page hashed the text in the browser: ' + want.sha256.slice(0, 16) + '…');
    await c.keys.setSeed(K.newSeedHex());
    await sleep(100);
    $('[data-nt-note]').value = 'from the page';
    $('[data-nt-review]').click();
    check($('[data-nt-confirm]').hidden === false && $('[data-nt-confirm-body]').textContent === N.stampBody({ sha256: want.sha256, bytes: want.bytes, note: 'from the page' }), 'Review shows the post, word for word, and sends nothing');
    const before = (await reach(api)).height;
    $('[data-nt-send]').click();
    const sent = await until(() => $('[data-nt-result]').dataset.state === 'ok' || $('[data-nt-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(sent) && $('[data-nt-result]').dataset.state === 'ok', 'Send: ' + $('[data-nt-result-text]').textContent.slice(0, 80) + '…');
    check((await reach(api)).height > before && !$('[data-nt-receipt]').hidden, 'the post is on the chain and the receipt is offered');
    $('[data-nt-c-hash]').value = want.sha256;
    $('[data-nt-c-run]').click();
    await until(() => $('[data-nt-c-out]').dataset.state !== 'busy' && $('[data-nt-c-out]').dataset.state !== 'idle', 30000, 400);
    check($('[data-nt-c-out]').dataset.state === 'warn' || $('[data-nt-c-out]').dataset.state === 'ok', 'Check this file: ' + $('[data-nt-c-verdict]').textContent + ' · ' + $('[data-nt-c-detail]').textContent.slice(0, 90));
    // the wrong pin
    const wrong = builtSection('dist/chain/notary/index.html', '[data-notary-app]', 'http://localhost/chain/notary/?devnet=' + api + '&genesis=' + '9'.repeat(64));
    const c2 = view.mount(wrong.section, { window: wrong.dom.window, fetch: sturdyFetch, storage: null });
    await c2.begin();
    check(wrong.section.dataset.state === 'changed', 'a wrong pin stops the page at GENESIS CHANGED');
  }
}

// 7. the public devnet, read only
if (h.flag('--live')) {
  const live = await reach(DEVNET.url);
  if (!live) say('note the public devnet is not reachable');
  else if (live.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + live.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else {
    const ln = K.makeNet(DEVNET.url, { fetch: sturdyFetch });
    const nothing = await N.findStamps(ln, (await N.hashText('nobody stamped this ' + Math.random())).sha256);
    check(nothing.stamps.length === 0 && nothing.complete, 'live: a hash nobody stamped is not found; scanned ' + nothing.scannedBlocks + ' blocks that carry transactions in ' + nothing.pages + ' pages');
    let seen = 0;
    let before = null;
    for (let i = 0; i < 20; i++) {
      const page = await ln.get('/feed?limit=100' + (before === null ? '' : '&before=' + before));
      for (const b of page.blocks) for (const x of b.txs) if (x.kind === 'publish_block' && x.payload.channel === 'NOTARY') {
        const want = N.parseStamp(x.payload.body);
        if (!want) continue;
        const r = await N.checkStamp({ api: DEVNET.url, genesis: DEVNET.genesis, pinSource: 'pinned', ref: { height: b.height, txHash: x.hash }, sha256: want.sha256, env });
        check(['STAMPED', 'PARTLY'].includes(r.verdict), 'live: stamp in block ' + b.height + ' checks ' + r.verdict);
        seen += 1;
      }
      if (!page.blocks.length || !page.next_before) break;
      before = page.next_before;
    }
    say('live: ' + seen + ' stamp(s) on the public devnet');
  }
}
h.finish();
