// End-to-end run of "Verify a block by hand" against a devnet over HTTP (GET only):
//
//   node scripts/e2e-chain-app-verify.mjs [http://127.0.0.1:8799] [--page dist/chain/verify-a-block/index.html] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799. It never
// writes to any devnet. What it does, in order, printing one line per result:
//   1. reads /status and /params and pins the node's own genesis (a local node has no
//      outside pin; the live devnet is pinned from src/data/chain-home.ts);
//   2. runs the five steps on every block and expects every check to pass;
//   3. for each tamper kind, on blocks that carry transactions and on empty ones, expects
//      exactly the checks the lesson says go red;
//   4. walks the headers from block 1 to the newest block with a next block;
//   5. mounts the lesson's view in jsdom over the built page (--page) or a hook skeleton,
//      opens a block, flips a byte with the TAMPER toggle and walks;
//   6. runs the "same steps, in code" file from the page against the node.
// --live repeats 2, 3 and 4 against the live devnet (a short walk), pinned from chain-home.
// Exit status 1 on any mismatch.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { DEVNET } from '../src/data/chain-home.ts';
import { snippet } from '../src/data/chain-app-verify.ts';
import * as V from '../public/chain/apps/verify.js';
import * as view from '../public/chain/apps/verify-view.js';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const api = args.find((a) => /^https?:\/\//.test(a)) || 'http://127.0.0.1:8799';
const pagePath = opt('--page') || (existsSync(new URL('dist/chain/verify-a-block/index.html', root)) ? 'dist/chain/verify-a-block/index.html' : null);

const out = [];
let bad = 0;
const say = (line) => { out.push(line); console.log(line); };
const check = (ok, line) => { say((ok ? 'ok   ' : 'FAIL ') + line); if (!ok) bad += 1; };

async function sturdyFetch(u, o) {
  for (let i = 0; ; i++) {
    try { return await fetch(u, o); } catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 200)); }
  }
}
const env = { fetch: sturdyFetch };
const EXPECT = {
  title: ['sig:0', 'tx_root'],
  tx_signature: ['sig:0', 'tx_root'],
  tx_drop: ['tx_root'],
  seal: ['seal'],
  prev_hash: ['link_back', 'link_forward', 'seal'],
  state_root: ['link_forward', 'seal'],
};

async function steps(label, chain, pin, apiUrl, opts = {}) {
  const tip = (await V.loadStatus(apiUrl, env)).height;
  const last = Math.min(tip - 1, opts.cap || 300);
  let checks = 0;
  let blocksWithTxs = [];
  for (let n = 1; n <= last; n++) {
    const blocks = await V.fetchBlockSet(apiUrl, n, env);
    const r = await V.runSteps({ n, params: chain.params, genesis: pin, pinSource: 'pinned', chain, paths: blocks.paths, ...blocks });
    checks += r.checks.length;
    if (r.verdict !== 'pass') check(false, label + ' block ' + n + ': ' + r.summary);
    if (blocks.block.txs.length) blocksWithTxs.push(n);
  }
  check(true, label + ': five steps on blocks 1 to ' + last + ' (' + checks + ' checks), every one passes');
  // the newest block has no next block: partial, nothing failed
  const newest = await V.fetchBlockSet(apiUrl, tip, env);
  const rn = await V.runSteps({ n: tip, params: chain.params, genesis: pin, pinSource: 'pinned', chain, paths: newest.paths, ...newest });
  check(rn.failed.length === 0 && (rn.verdict === 'pass' || rn.verdict === 'partial'), label + ': newest block ' + tip + ' (' + rn.verdict + ', forward link ' + (newest.next ? 'present' : 'not sealed yet') + ')');
  // tamper
  let runs = 0;
  const pickTx = [...blocksWithTxs].slice(-3);
  const pickEmpty = [];
  for (let n = last; n >= 1 && pickEmpty.length < 2; n--) if (!blocksWithTxs.includes(n)) pickEmpty.push(n);
  for (const n of [...pickTx, ...pickEmpty]) {
    const blocks = await V.fetchBlockSet(apiUrl, n, env);
    const avail = V.tamperAvailable(blocks.block);
    for (const kind of Object.keys(EXPECT)) {
      if (!avail[kind]) continue;
      const t = V.tamperSet(blocks, kind);
      const r = await V.runSteps({ n, params: chain.params, genesis: pin, pinSource: 'pinned', chain, paths: blocks.paths, ...t.set, tamper: t.note });
      const want = EXPECT[kind].map((id) => (kind === 'title' && id === 'sig:0' ? 'sig:' + t.note.txIndex : id)).filter((id) => id !== 'link_forward' || blocks.next);
      const got = [...r.failed].sort();
      const same = JSON.stringify(got) === JSON.stringify([...want].sort());
      runs += 1;
      if (!same) check(false, label + ' block ' + n + ' tamper ' + kind + ': red ' + got.join(',') + ', wanted ' + want.join(','));
    }
  }
  check(true, label + ': ' + runs + ' tamper runs (blocks ' + [...pickTx, ...pickEmpty].join(', ') + '), each turned exactly the right checks red');
  // walk
  const upTo = opts.walkTo || last;
  const set1 = await V.fetchBlockSet(apiUrl, upTo, env);
  const w = await V.walkToGenesis({ api: apiUrl, params: chain.params, genesis: pin, upTo, expectHash: V.headerHashOf(set1.block.header), env });
  check(!w.fault && w.checked === upTo && w.links === upTo && w.seals === upTo && w.matchesBlock === true, label + ': walk ' + V.walkSummary(w));
  return { tip, last, blocksWithTxs };
}

async function lessonInJsdom(label, apiUrl, genesis, isLocal, tip) {
  let html = '<!doctype html><html><body><section data-verify-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + DEVNET.genesis + '" data-wasm="/w.wasm" data-wasm-sha256="00"></section></body></html>';
  let source = 'a hook skeleton';
  if (pagePath) { html = readFileSync(new URL(pagePath, root), 'utf8'); source = 'the built page ' + pagePath; }
  const dom = new JSDOM(html, { url: 'http://localhost/chain/verify-a-block/' + (isLocal ? '?devnet=' + apiUrl : '') });
  const rootEl = dom.window.document.querySelector('[data-verify-app]');
  const hooks = ['data-vb-input', 'data-vb-go', 'data-vb-tamper', 'data-vb-kind', 'data-vb-banner', 'data-vb-walk', 'data-vb-status', 'data-vb-wasm'];
  const have = hooks.filter((h) => rootEl.querySelector('[' + h + ']'));
  if (pagePath) check(have.length === hooks.length, label + ': ' + source + ' carries the controls (' + have.length + ' of ' + hooks.length + ' hooks)');
  if (!pagePath) { say('skip ' + label + ': no built page (pass --page dist/chain/verify-a-block/index.html); nothing to mount the lesson on'); return; }
  const c = view.mount(rootEl, { window: dom.window, fetch: sturdyFetch });
  check(c.api === apiUrl, label + ': the lesson reads ' + c.api + (isLocal ? ' (the ?devnet= override)' : ''));
  const until = async (cond, ms = 30000) => { const t0 = Date.now(); while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 30)); return cond(); };
  const states = () => [...rootEl.querySelectorAll('[data-step]')].map((x) => x.dataset.state).join(',');
  await c.begin();
  check(states() === 'pass,pass,pass,pass,pass', label + ': opens on block ' + c.state.n + ', a few behind the tip ' + c.state.tip + ': ' + states());
  const box = rootEl.querySelector('[data-vb-tamper]');
  box.checked = true;
  box.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const red = await until(() => states() === 'pass,fail,fail,pass,pass');
  check(red, label + ': TAMPER on (prev_hash): ' + states() + ' · ' + rootEl.querySelector('[data-vb-banner-caught]').textContent);
  const kind = rootEl.querySelector('[data-vb-kind]');
  const short = Math.max(1, Math.min(40, tip - 2));
  rootEl.querySelector('[data-vb-input]').value = String(short);
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(() => rootEl.dataset.busy === 'no' && rootEl.querySelector('[data-vb-block]').textContent.startsWith('Block ' + short + ' '));
  kind.value = 'seal';
  kind.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  check(await until(() => states() === 'pass,pass,fail,pass,pass'), label + ': tamper the seal on block ' + short + ': ' + states());
  box.checked = false;
  box.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  check(await until(() => states() === 'pass,pass,pass,pass,pass'), label + ': TAMPER off: ' + states());
  rootEl.querySelector('[data-vb-walk]').click();
  check(await until(() => /^Walked blocks 1 to |^The walk/.test(rootEl.querySelector('[data-vb-walk-result]').textContent)), label + ': ' + rootEl.querySelector('[data-vb-walk-result]').textContent);
  const shown = rootEl.querySelectorAll('[data-vb-groups] *').length;
  check(shown > 100 && rootEl.querySelectorAll('[data-vb-groups] img, [data-vb-groups] script, [data-vb-groups] iframe, [data-vb-groups] a, [data-vb-checks] a').length === 0, label + ': ' + shown + ' elements drawn in the steps, none of them an image, script, frame or link');
}

function runSnippet(label, apiUrl, genesis, n) {
  const dir = mkdtempSync(join(tmpdir(), 'pc-verify-e2e-'));
  try {
    copyFileSync(new URL('public/chain/first-mints/lib/pointcast-chain.js', root), join(dir, 'pointcast-chain.js'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'verify-a-block.mjs'), snippet(apiUrl, genesis) + '\n');
    const r = spawnSync(process.execPath, [join(dir, 'verify-a-block.mjs'), String(n)], { cwd: dir, encoding: 'utf8', timeout: 60000 });
    const lines = r.stdout.trim().split('\n').filter(Boolean);
    check(r.status === 0 && lines.length >= 4 && lines.every((l) => l.startsWith('ok ')), label + ': the snippet on the page, block ' + n + ': ' + lines.length + ' lines, ' + lines.filter((l) => l.startsWith('ok ')).length + ' ok');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

say('e2e: Verify a block by hand · ' + new Date().toISOString().slice(0, 16) + 'Z · reads only (GET) · devnet: no value, may reset');
const chain = await V.loadChain(api, env);
check(chain.paramsHash === chain.status.genesis, 'node ' + api + ' · ' + chain.status.chainId + ' · tip ' + chain.status.height + ' · /params hash to its own genesis ' + chain.status.genesis.slice(0, 12) + '…');
const local = await steps('local', chain, chain.status.genesis, api);
await lessonInJsdom('local', api, chain.status.genesis, api !== DEVNET.url, local.tip);
const sn = local.blocksWithTxs.filter((h) => h >= 2 && h <= local.tip - 1);
runSnippet('local', api, chain.status.genesis, sn.length ? sn[sn.length - 1] : V.defaultBlock(local.tip));

if (flag('--live')) {
  const liveChain = await V.loadChain(DEVNET.url, env);
  check(liveChain.paramsHash === DEVNET.genesis, 'live ' + DEVNET.url + ' · tip ' + liveChain.status.height + ' · /params hash to the genesis pinned in chain-home ' + DEVNET.genesis.slice(0, 12) + '…');
  if (liveChain.paramsHash === DEVNET.genesis) {
    await steps('live', liveChain, DEVNET.genesis, DEVNET.url, { cap: 60, walkTo: liveChain.status.height - 3 });
    runSnippet('live', DEVNET.url, DEVNET.genesis, V.defaultBlock(liveChain.status.height));
  }
}

say(bad ? 'e2e: ' + bad + ' FAILED' : 'e2e: all checks passed');
process.exit(bad ? 1 : 0);
