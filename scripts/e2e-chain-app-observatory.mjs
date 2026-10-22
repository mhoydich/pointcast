// End-to-end run of the Chain Observatory against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-observatory.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799. The
// dashboard itself only reads (GET). The one write here is a throwaway post to a
// LOCAL devnet, to seal a block so the dashboard can be seen picking it up; the
// public devnet is only ever read, and --live repeats the read checks on it.
// What it does, in order, printing one line per result:
//   1. refreshes everything the page reads and recounts the raw blocks by hand;
//   2. mounts the dashboard's view over the built page (dist/) in jsdom, reads, and
//      compares what it drew with the recount;
//   3. seals a block on the local devnet and checks Live notices the new height and
//      reads the window again, and reads /status alone while the height holds;
//   4. checks the dashboard stops at GENESIS CHANGED for a wrong pin;
//   5. --live: the same read checks on the public devnet, pinned from chain-home.
// Exit status 1 on any mismatch.
import { DEVNET } from '../src/data/chain-home.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as O from '../public/chain/apps/observatory.js';
import * as view from '../public/chain/apps/observatory-view.js';
import { advance, builtSection, harness, reach, sleep, sturdyFetch } from './lib/e2e-chain-apps.mjs';

const h = harness('Chain Observatory', 'e2e-chain-app-observatory');
const { say, check } = h;

async function recount(api, tip, count) {
  const from = Math.max(1, tip - count + 1);
  const blocks = [];
  for (let at = from; at <= tip; ) {
    const page = await (await sturdyFetch(api + '/raw/blocks?from=' + at + '&limit=500')).json();
    for (const b of page.blocks) if (b.header.height <= tip) blocks.push(b);
    at = page.blocks.at(-1).header.height + 1;
  }
  const kinds = {};
  const channels = {};
  let tx = 0;
  for (const b of blocks) for (const t of b.txs) { tx += 1; kinds[t.tx.type] = (kinds[t.tx.type] || 0) + 1; if (t.tx.channel) channels[t.tx.channel] = (channels[t.tx.channel] || 0) + 1; }
  return { blocks, tx, kinds, channels };
}

async function readChecks(label, api, pinned) {
  const net = K.makeNet(api, { fetch: sturdyFetch });
  const r = await O.refresh(net, { pinned, windowSize: 200 });
  check(r.missing.length === 0, label + ': every part readable (' + r.requests + ' requests): height ' + r.status.height + ', window #' + r.summary.from + ' to #' + r.summary.to);
  const rc = await recount(api, r.summary.to, r.summary.count);
  check(r.summary.txTotal === rc.tx, label + ': ' + r.summary.txTotal + ' transactions in the window, recounted ' + rc.tx);
  check(r.summary.kinds.filter((k) => k.kind !== 'other').every((k) => k.n === rc.kinds[k.kind]), label + ': every kind count agrees (' + r.summary.kinds.map((k) => k.kind + ' ' + k.n).join(', ') + ')');
  check(r.summary.channels.filter((k) => k.channel !== 'other').every((k) => k.n === rc.channels[k.channel]), label + ': every channel count agrees (' + (r.summary.channels.map((k) => k.channel + ' ' + k.n).join(', ') || 'none') + ')');
  const timed = rc.blocks.filter((b) => b.header.timestamp > 0);
  check(r.summary.gaps.length === timed.length - 1 && r.summary.spanMs === timed.at(-1).header.timestamp - timed[0].header.timestamp, label + ': ' + r.summary.gaps.length + ' gaps and a span of ' + K.duration(r.summary.spanMs) + ' (block 1 has no time and is left out)');
  check(O.healthOf(r.status.tipTimestamp, Date.now() + O.clockSkew(r.daily, r.readAt)).state !== 'unknown', label + ': the newest block’s age is known');
  return r;
}

const local = h.api.startsWith('http://127.0.0.1') ? await reach(h.api) : null;
const target = h.api.startsWith('http://127.0.0.1') ? local : await reach(h.api);
if (!target) { say('FAIL no devnet answers at ' + h.api); process.exit(1); }
say('node ' + h.api + ' · ' + target.chain_id + ' · tip ' + target.height + ' · genesis ' + target.genesis_hash.slice(0, 12) + '…');

const r1 = await readChecks('local', h.api, target.genesis_hash);

// 2. the view over the built page
const sec = builtSection('dist/chain/observatory/index.html', '[data-observatory-app]', 'http://localhost/chain/observatory/?devnet=' + h.api);
if (!sec) say('note dist/chain/observatory is absent: build the site to run the page checks (npm run build:bare)');
else {
  const c = view.mount(sec.section, { window: sec.dom.window, fetch: sturdyFetch, now: () => Date.now() });
  check(Boolean(c), 'the built page mounts and honours ?devnet= for 127.0.0.1');
  await c.begin();
  c.stop();
  const txt = (s) => (sec.section.querySelector(s) || {}).textContent;
  check(sec.section.dataset.state === 'ready', 'the dashboard reads and says ready');
  check(txt('[data-ob-v="height"]') === '#' + K.groups(r1.status.height), 'the height tile shows #' + r1.status.height);
  check(txt('[data-ob-v="tx"]') === K.groups(r1.summary.txTotal), 'the transactions tile shows ' + r1.summary.txTotal);
  check(sec.section.querySelectorAll('svg.ob-svg').length >= 3 || r1.summary.txTotal === 0, 'the charts are drawn: ' + sec.section.querySelectorAll('svg.ob-svg').length + ' of five (a quiet window draws fewer)');
  check(sec.section.querySelectorAll('[data-ob-chart] :is(script, iframe, img, a, [onerror]), [data-ob-table] :is(script, iframe, img, a, [onerror]), [data-ob-cp] :is(script, iframe, img, a, [onerror])').length === 0, 'everything drawn from devnet text (the charts, their tables, the checkpoints) holds no script, frame, image or link');
  // 2b. who signed today's txs: the tiles show the devnet's split, and the split is a recount of today's raw blocks
  const nj = await (await sturdyFetch(h.api + '/net')).json();
  if (!nj.classes) say('note this devnet does not split house, keyless and outside yet: the tiles say "not split yet"');
  else {
    const sc = await (await sturdyFetch(h.api + '/stats/classes?days=1')).json();
    const house = new Set(sc.house_keys.map((k) => k.address));
    const bots = new Set((await (await sturdyFetch(h.api + '/bots')).json()).bots.map((b) => b.agent));
    const per = { house: [0, new Set()], keyless: [0, new Set()], outside: [0, new Set()] };
    const tipNow = (await (await sturdyFetch(h.api + '/status')).json()).height;
    for (let at = 1; at <= tipNow; ) {
      const page = await (await sturdyFetch(h.api + '/raw/blocks?from=' + at + '&limit=500')).json();
      for (const b of page.blocks) {
        if (new Date(b.header.timestamp).toISOString().slice(0, 10) !== nj.day || b.header.height > nj.indexed_height) continue;
        for (const t of b.txs) { const k = house.has(t.tx.sender) ? 'house' : bots.has(t.tx.sender) ? 'keyless' : 'outside'; per[k][0] += 1; per[k][1].add(t.tx.sender); }
      }
      at = page.blocks.at(-1).header.height + 1;
    }
    for (const k of O.CLASSES) {
      check(nj.classes.day[k].txs === per[k][0] && nj.classes.day[k].keys === per[k][1].size, k + ': the devnet says ' + nj.classes.day[k].txs + ' txs from ' + nj.classes.day[k].keys + ' keys today; a recount of the raw blocks says ' + per[k][0] + ' from ' + per[k][1].size);
      check(txt('[data-ob-v="class-' + k + '"]') === K.plural(nj.classes.day[k].txs, 'tx', 'txs'), 'the ' + k + ' tile shows ' + txt('[data-ob-v="class-' + k + '"]'));
    }
    check(/^House activity is the chain checking itself, not use\. Outside keys signed /.test(txt('[data-ob-s="classes"]') || ''), 'the line under the tiles: ' + txt('[data-ob-s="classes"]'));
  }
  // 3. Live: seal a block on the local devnet and watch it land
  if (h.api.startsWith('http://127.0.0.1')) {
    const c2 = view.mount(sec.section, { window: sec.dom.window, fetch: sturdyFetch, now: () => Date.now() });
    await c2.begin();
    c2.stop();
    const before = c2.state.lastHeight;
    const reads = c2.net.count;
    await c2.poll();
    check(c2.net.count === reads + 1, 'with the height unchanged, a poll costs one request (/status)');
    const sealed = await advance(K, h.api, 1, h.localOnly);
    await sleep(500);
    await c2.poll();
    check(c2.state.lastHeight >= sealed && c2.state.lastHeight > before, 'after a throwaway post sealed block ' + sealed + ', Live saw height ' + c2.state.lastHeight);
    check(txt('[data-ob-v="height"]') === '#' + K.groups(c2.state.lastHeight), 'and the tile follows: ' + txt('[data-ob-v="height"]'));
    check(c2.net.count > reads + 5, 'the window and the other parts were read again (' + (c2.net.count - reads) + ' requests)');
  }
  // 4. a wrong pin
  const wrong = builtSection('dist/chain/observatory/index.html', '[data-observatory-app]', 'http://localhost/chain/observatory/?devnet=' + h.api + '&genesis=' + '9'.repeat(64));
  const c3 = view.mount(wrong.section, { window: wrong.dom.window, fetch: sturdyFetch });
  await c3.begin();
  c3.stop();
  check(wrong.section.dataset.state === 'changed' && /GENESIS CHANGED/.test((wrong.section.querySelector('[data-ob-genesis]') || {}).textContent || ''), 'a wrong pin stops the dashboard at GENESIS CHANGED, with nothing drawn');
}

// 5. the public devnet, read only
if (h.flag('--live')) {
  const live = await reach(DEVNET.url);
  if (!live) say('note the public devnet is not reachable');
  else if (live.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + live.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else { await sleep(300); await readChecks('live', DEVNET.url, DEVNET.genesis); }
}
h.finish();
