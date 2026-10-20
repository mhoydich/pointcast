// End-to-end run of Time Capsules against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-capsules.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799. WRITES GO
// ONLY TO A LOCAL DEVNET: capsules are sealed and opened there, with throwaway keys, and
// a few throwaway posts seal the blocks that carry the wait. The public devnet is only
// ever read (GET), and --live repeats the read checks on it. What it does, in order,
// printing one line per result:
//   1. seals a capsule four blocks ahead with only a commitment on chain, and checks the
//      devnet lists it as waiting, that nothing of the message or the salt is on the
//      devnet, and that the capsule file hashes to the id the chain holds;
//   2. tries to open it early: refused, nothing sent (the open and the body are not on chain);
//   3. seals blocks until it is due, opens it with ANOTHER key, and checks it airs: the
//      wall joins the open to its seal and the message hashes to what was sealed;
//   4. a changed capsule file is refused; the capsule is gone from the list once opened;
//   5. the Worker's GET /capsule/{id} (when this node has it) agrees with the list;
//   6. runs the "same steps, in code" script from the page: seal, then open;
//   7. the page's view over the built page (dist/): seal, wait, open;
//   8. --live: the list and the wall on the public devnet, read only.
// Exit status 1 on any mismatch.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEVNET } from '../src/data/chain-home.ts';
import { codeSnippet } from '../src/data/chain-app-capsules.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as C from '../public/chain/apps/capsules.js';
import * as view from '../public/chain/apps/capsules-view.js';
import { advance, builtSection, harness, root, reach, sleep, sturdyFetch, until } from './lib/e2e-chain-apps.mjs';

const h = harness('Time Capsules', 'e2e-chain-app-capsules');
const { say, check } = h;
const api = h.api;
const isLocal = api.startsWith('http://127.0.0.1');
const status = await reach(api);
if (!status) { say('FAIL no devnet answers at ' + api); process.exit(1); }
say('node ' + api + ' · ' + status.chain_id + ' · tip ' + status.height + ' · genesis ' + status.genesis_hash.slice(0, 12) + '…');
const net = K.makeNet(api, { fetch: sturdyFetch });
const pinned = isLocal ? status.genesis_hash : DEVNET.genesis;
const list = async () => C.readCapsules(await net.get('/capsules'));
const tip = async () => (await net.get('/status')).height;

if (isLocal) {
  h.localOnly(api);
  const chain = await K.connectPinned(api, { pinned });
  const author = await K.keyFromSeed(K.newSeedHex());
  const opener = await K.keyFromSeed(K.newSeedHex());
  // 1. seal
  const message = 'e2e capsule ' + Math.random() + '\nsecond line of the message';
  const t0 = await tip();
  const plan = C.planSeal({ channel: 'BOT', title: 'e2e capsule', body: message, label: 'e2e seal', delay: 4, tip: t0, sender: author.sender });
  check(plan.ok && plan.fields.openAt === t0 + 4, 'the plan is clean: opens at block ' + plan.fields.openAt + ' (tip ' + t0 + ' + 4)');
  const sealed = await C.sealCapsule({ chain, net, key: author, plan });
  const f = C.readCapsuleFile(sealed.file);
  check(Number.isInteger(sealed.height) && f.openAt === plan.fields.openAt, 'sealed in block ' + sealed.height + ', capsule ' + f.capsule.slice(0, 12) + '…, opens at block ' + f.openAt);
  const l1 = await list();
  const row = l1.rows.find((r) => r.id === f.capsule);
  check(Boolean(row) && row.author === author.sender && row.label === 'e2e seal' && C.stateOf(row, l1.height) === 'waiting', 'GET /capsules lists it, waiting: opens at ' + (row && row.openAt) + ', devnet at ' + l1.height);
  const rawBlock = JSON.stringify(await (await sturdyFetch(api + '/raw/block/' + sealed.height)).json());
  check(!rawBlock.includes(message.slice(0, 20)) && !rawBlock.includes(f.salt), 'the sealed block holds neither the message nor the salt');
  check((await sturdyFetch(api + '/body/' + K.pcc.bodyHash(message))).status === 404, 'and the devnet’s body store does not hold the message yet (GET /body/HASH is 404)');
  // 2. an early open is refused and sends nothing
  const mempoolBefore = (await reach(api)).mempool;
  let early = null;
  try { await C.openCapsule({ chain, net, key: opener, file: f }); } catch (e) { early = e; }
  check(Boolean(early) && early.code === 'early', 'an early open is refused: ' + (early && early.message.slice(0, 90)));
  check((await sturdyFetch(api + '/body/' + K.pcc.bodyHash(message))).status === 404 && (await reach(api)).mempool === mempoolBefore, 'nothing was sent: no body stored, nothing waiting in the mempool');
  // 4a. a changed file is refused
  let edited = null;
  try { C.readCapsuleFile({ ...sealed.file, body: sealed.file.body + ' (edited)' }); } catch (e) { edited = e; }
  check(Boolean(edited) && /changed after sealing/.test(edited.message), 'a capsule file edited by one word is refused: ' + (edited && edited.message.slice(0, 80)));
  // 3. seal blocks until due, open with another key
  let due = null;
  for (let i = 0; i < 8 && !due; i++) {
    await advance(K, api, 1, h.localOnly);
    const l = await list();
    const r = l.rows.find((x) => x.id === f.capsule);
    if (r && C.stateOf(r, l.height) === 'due') due = l;
  }
  check(Boolean(due), 'after throwaway posts sealed blocks, the devnet lists it due (devnet at ' + (due && due.height) + ')');
  const route = await sturdyFetch(api + '/capsule/' + f.capsule);
  if (route.status === 200) {
    const j = await route.json();
    check(j.capsule === f.capsule && j.open === true && j.author === author.sender && j.open_at === f.openAt, 'GET /capsule/{id} (this node has the Worker route) agrees with the list: open ' + j.open + ', opens at ' + j.open_at);
  } else say('note GET /capsule/{id} answers ' + route.status + ' on this node: it has not got the Worker route yet (pointcast-chain branch cc/devnet-capsule-route-20261020); the page does not need it');
  const opened = await C.openCapsule({ chain, net, key: opener, file: f });
  check(Number.isInteger(opened.height) && opened.height >= f.openAt, 'opened by ANOTHER key in block ' + opened.height + ' (tx ' + opened.txHash.slice(0, 12) + '…)');
  const wall = await C.readWall(net);
  const item = wall.items.find((x) => x.capsule === f.capsule);
  check(Boolean(item) && item.bodyVerified && item.body === message, 'the wall shows the message, and it hashes to what was sealed');
  check(Boolean(item && item.seal) && item.seal.author === author.sender && item.seal.height === sealed.height && item.seal.label === 'e2e seal' && item.opener === opener.sender, 'the wall joins the open to its seal: sealed by the author in block ' + (item && item.seal && item.seal.height) + ', opened by someone else in block ' + (item && item.height) + ', waited ' + (item && item.seal && item.height - item.seal.height) + ' blocks');
  const l2 = await list();
  check(!l2.rows.some((r) => r.id === f.capsule), 'once opened, the capsule is gone from the list');
  let again = null;
  try { await C.openCapsule({ chain, net, key: opener, file: f }); } catch (e) { again = e; }
  check(Boolean(again) && again.code === 'gone', 'a second open is refused: ' + (again && again.message.slice(0, 60)) + '…');
  // 6. the script on the page
  const dir = mkdtempSync(join(tmpdir(), 'capsule-e2e-'));
  try {
    copyFileSync(new URL('public/chain/first-mints/lib/pointcast-chain.js', root), join(dir, 'pointcast-chain.js'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'capsule.mjs'), codeSnippet(api, status.genesis_hash));
    const env = { ...process.env, SEED: K.newSeedHex() };
    const seal = spawnSync(process.execPath, [join(dir, 'capsule.mjs'), 'seal', 'from a script', 'sealed by the page’s script', '4'], { encoding: 'utf8', cwd: dir, env });
    check(seal.status === 0 && /^sealed: [0-9a-f]{64}/.test(seal.stdout), 'the script from the page seals a capsule: ' + seal.stdout.trim().slice(0, 30) + '…' + (seal.status ? seal.stderr.slice(0, 200) : ''));
    const early2 = spawnSync(process.execPath, [join(dir, 'capsule.mjs'), 'open', join(dir, 'capsule.json')], { encoding: 'utf8', cwd: dir, env });
    check(early2.status !== 0 && /not open yet/.test(early2.stderr), 'and its open refuses while the capsule waits (nothing sent, so the salt stays secret)');
    await advance(K, api, 5, h.localOnly);
    await sleep(500);
    const open = spawnSync(process.execPath, [join(dir, 'capsule.mjs'), 'open', join(dir, 'capsule.json')], { encoding: 'utf8', cwd: dir, env });
    check(open.status === 0 && /^opened: [0-9a-f]{64}/.test(open.stdout), 'once due, the script opens it: ' + open.stdout.trim().slice(0, 30) + '…' + (open.status ? open.stderr.slice(0, 200) : ''));
    // the script returns as soon as POST /tx accepts the open (pending); the next block carries it
    const shown = await until(async () => (await C.readWall(net)).items.some((x) => x.title === 'from a script' && x.body === 'sealed by the page’s script' && x.bodyVerified), 20000, 600);
    check(Boolean(shown), 'and, a block later, the wall shows its message');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  // 7. the page's view over the built page
  const sec = builtSection('dist/chain/capsules/index.html', '[data-capsules-app]', 'http://localhost/chain/capsules/?devnet=' + api);
  if (!sec) say('note dist/chain/capsules is absent: build the site to run the page checks (npm run build:bare)');
  else {
    const c = view.mount(sec.section, { window: sec.dom.window, fetch: sturdyFetch, storage: null, now: () => Date.now() });
    await c.begin();
    c.stop();
    const $ = (s) => sec.section.querySelector(s);
    check(sec.section.dataset.state === 'ready' && /sealing about/.test($('[data-cp-rate]').textContent), 'the built page reads the devnet: ' + $('[data-cp-count]').textContent);
    check(sec.section.querySelectorAll('[data-cp-wall] li').length >= 2, 'the wall shows the opened capsules (' + sec.section.querySelectorAll('[data-cp-wall] li').length + ')');
    await c.keys.setSeed(K.newSeedHex());
    await sleep(100);
    $('[data-cp-title]').value = 'sealed in the page';
    $('[data-cp-body]').value = 'page capsule ' + Math.random();
    $('[data-cp-label]').value = 'page seal';
    $('[data-cp-delay]').value = '3';
    $('[data-cp-review]').click();
    check($('[data-cp-confirm]').hidden === false && sec.section.querySelectorAll('[data-cp-confirm-list] li').length === 2, 'Review lists what goes on chain and what does not, and sends nothing');
    $('[data-cp-send]').click();
    const sentOk = await until(() => $('[data-cp-result]').dataset.state === 'ok' || $('[data-cp-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(sentOk) && $('[data-cp-result]').dataset.state === 'ok' && !$('[data-cp-download]').hidden, 'Send: ' + $('[data-cp-result-text]').textContent.slice(0, 70) + '…');
    check(c.state.mine.length === 1 && c.state.mine[0].title === 'sealed in the page', 'the capsule file is under “your capsules” (' + $('[data-cp-mine-count]').textContent + ')');
    await advance(K, api, 4, h.localOnly);
    await c.refresh({ wall: false });
    const openBtn = [...sec.section.querySelectorAll('[data-cp-mine] button')].find((b) => b.textContent === 'Open it');
    check(Boolean(openBtn) && !openBtn.disabled, 'once due, “Open it” is on');
    openBtn.click();
    $('[data-cp-open-send]').click();
    const openedOk = await until(() => $('[data-cp-open-result]').dataset.state === 'ok' || $('[data-cp-open-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(openedOk) && $('[data-cp-open-result]').dataset.state === 'ok', 'Open: ' + $('[data-cp-open-result-text]').textContent.slice(0, 70) + '…');
    check([...sec.section.querySelectorAll('[data-cp-wall] li')].some((li) => li.textContent.includes('sealed in the page')), 'and the wall shows the message the page sealed');
    const wrong = builtSection('dist/chain/capsules/index.html', '[data-capsules-app]', 'http://localhost/chain/capsules/?devnet=' + api + '&genesis=' + '9'.repeat(64));
    const c2 = view.mount(wrong.section, { window: wrong.dom.window, fetch: sturdyFetch, storage: null });
    await c2.begin();
    c2.stop();
    check(wrong.section.dataset.state === 'changed', 'a wrong pin stops the page at GENESIS CHANGED');
  }
}

// 8. the public devnet, read only
if (h.flag('--live')) {
  const live = await reach(DEVNET.url);
  if (!live) say('note the public devnet is not reachable');
  else if (live.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + live.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else {
    const ln = K.makeNet(DEVNET.url, { fetch: sturdyFetch });
    const ll = C.readCapsules(await ln.get('/capsules'));
    check(Boolean(ll && ll.enabled), 'live: GET /capsules reads: ' + ll.rows.length + ' sealed, devnet at ' + ll.height);
    const lw = await C.readWall(ln);
    check(lw.complete && lw.items.every((x) => x.bodyVerified), 'live: the wall reads ' + lw.items.length + ' opened capsule(s) in ' + lw.scannedBlocks + ' blocks, each message hashing to what was sealed');
    check(Number.isFinite(await C.readRate(ln, live.height)), 'live: the seal rate is ' + (Math.round((await C.readRate(ln, live.height)) * 10) / 10) + ' blocks an hour');
  }
}
h.finish();
