// Chain Observatory: /chain/observatory (src/pages/chain/observatory.astro),
// the logic public/chain/apps/observatory.js (no DOM), the DOM side
// public/chain/apps/observatory-view.js and the shared toolbox chain-kit.js.
//
// What this suite holds:
//   - the numbers are right: a window of recorded blocks (recorded from a
//     local devnet-2 and from the live devnet, GET reads only) is summarised
//     and every count is checked against a plain recount, the genesis block
//     (timestamp 0) never poisons a time axis, and every reader survives
//     garbage without throwing;
//   - nothing from the devnet is ever markup: a static scan of the browser
//     code, and a run against hostile replies in jsdom;
//   - it only reads: no POST anywhere, the genesis is checked before any
//     number is shown, a reset stops it with GENESIS CHANGED, and ?devnet= is
//     honoured only for localhost and 127.0.0.1;
//   - it is lazy, it degrades when a part cannot be read, and it polls
//     /status only until the height moves;
//   - the copy is honest: devnet · no value · may reset, a dated and recorded
//     reset, and none of the words a fundraising page would use;
//   - against a local devnet-2 and the live devnet (both GET), the dashboard's
//     own counts match a recount of the raw blocks (skipped when unreachable).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import { APP, CHART_NOTES, HONESTY_LINE, NOT_LIST, READS } from '../src/data/chain-app-observatory.ts';
import { CHAIN_APPS } from '../src/data/chain-apps.ts';
import * as O from '../public/chain/apps/observatory.js';
import * as view from '../public/chain/apps/observatory-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import { assertNoSinks, assertReadOnly, bannedHits, BANNED, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/observatory.js',
  view: 'public/chain/apps/observatory-view.js',
  kit: 'public/chain/apps/chain-kit.js',
  page: 'src/pages/chain/observatory.astro',
  data: 'src/data/chain-app-observatory.ts',
  styles: 'src/styles/chain-apps.css',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(FILES), 'tests/chain-app-observatory.test.mjs', 'scripts/e2e-chain-app-observatory.mjs'].filter((p) => existsSync(new URL(p, root)));
const FIX = JSON.parse(read('tests/fixtures/chain-app-observatory.json'));
const HEX = (c) => c.repeat(64);

/** The fixture as a fetch: the recorded replies of one devnet, paged like the Worker pages them. */
function fakeFetch(name, { overrides = {}, log = [] } = {}) {
  const fx = FIX[name];
  return async (url) => {
    const u = new URL(String(url));
    log.push(u.pathname + u.search);
    const send = (obj, status = 200) => ({ ok: status < 400, status, headers: { get: () => null }, text: async () => JSON.stringify(obj) });
    if (overrides[u.pathname]) return overrides[u.pathname](u);
    switch (u.pathname) {
      case '/status': return send({ ...fx.status, network: 'devnet' });
      case '/raw/blocks': {
        const from = Number(u.searchParams.get('from')), limit = Number(u.searchParams.get('limit'));
        const first = fx.blocks[0].header.height;
        const blocks = fx.blocks.filter((b) => b.header.height >= from).slice(0, limit);
        return send({ tip: fx.status.height, from: Math.max(from, first), blocks });
      }
      case '/daily': return send(fx.daily);
      case '/net': return send(fx.net);
      case '/checkpoints': return send(fx.checkpoints);
      case '/capsules': return send(fx.capsules);
      case '/editions': return send(fx.editions);
      case '/stations': return send(fx.stations);
      case '/bots': return send(fx.bots);
      default: return send({ error: 'no such route on the devnet' }, 404);
    }
  };
}
const netFor = (name, opts) => K.makeNet('http://127.0.0.1:8799', { fetch: fakeFetch(name, opts) });
const blocksOf = (name) => FIX[name].blocks.map((b) => O.readRawBlock(b));

// ================================================================ reading blocks

test('readRawBlock accepts the recorded blocks and skips anything that is not one', () => {
  for (const name of ['local', 'live']) {
    const list = blocksOf(name);
    assert.ok(list.length >= 60, name + ' fixture has blocks');
    assert.ok(list.every((b) => b && Number.isSafeInteger(b.height) && Array.isArray(b.txs)), name);
    FIX[name].blocks.forEach((raw, i) => assert.equal(list[i].txCount, raw.txs.length, 'the tx count is the reply’s own'));
  }
  for (const bad of [null, undefined, 3, 'x', [], {}, { header: {}, txs: [] }, { header: { height: 0, timestamp: 1, prev_hash: HEX('a') }, txs: [] },
    { header: { height: 5, timestamp: -1, prev_hash: HEX('a') }, txs: [] }, { header: { height: 5, timestamp: 1.5, prev_hash: HEX('a') }, txs: [] },
    { header: { height: 5, timestamp: 1, prev_hash: 'xyz' }, txs: [] }, { header: { height: 5, timestamp: 1, prev_hash: HEX('a') }, txs: 'no' }]) {
    assert.equal(O.readRawBlock(bad), null, JSON.stringify(bad));
  }
  // a transaction that is not shaped like one is dropped, the block stays
  const b = O.readRawBlock({ header: { height: 9, timestamp: 5, prev_hash: HEX('b') }, txs: [{ tx: { type: 'tap', sender: 'tz1x' } }, 7, { tx: {} }, { tx: { type: 5, sender: 'x' } }] });
  assert.equal(b.txs.length, 1);
  assert.equal(b.txCount, 4, 'the count still says how many the block carries');
});

test('hostile kinds, channels and senders are cut to one safe line each', () => {
  const evil = '<img src=x onerror=alert(1)>\u202e\u200b' + 'z'.repeat(500);
  const b = O.readRawBlock({ header: { height: 9, timestamp: 5, prev_hash: HEX('b') }, txs: [{ tx: { type: evil, sender: evil, channel: evil } }] });
  assert.ok(b.txs[0].type.length <= 40 && b.txs[0].sender.length <= 80 && b.txs[0].channel.length <= 16);
  for (const f of ['type', 'sender', 'channel']) assert.doesNotMatch(b.txs[0][f], /[\u202e\u200b]/);
});

test('readWindow pages through GET /raw/blocks, resumes when a page is cut short, and never returns a block twice or beyond the tip', async () => {
  const log = [];
  const net = netFor('live', { log });
  const tip = FIX.live.status.height;
  const w = await O.readWindow(net, tip, 50);
  assert.equal(w.blocks.length, 50);
  assert.equal(w.blocks[0].height, tip - 49);
  assert.equal(w.blocks.at(-1).height, tip);
  assert.deepEqual(w.blocks.map((b) => b.height), Array.from({ length: 50 }, (_, i) => tip - 49 + i));
  assert.equal(log.length, 1);
  // a devnet that cuts pages at 20 blocks (its byte budget) still gives the whole window, in order
  const cut = async (u) => {
    const from = Number(u.searchParams.get('from'));
    const blocks = FIX.live.blocks.filter((b) => b.header.height >= from).slice(0, 20);
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ tip, from, blocks }) };
  };
  const w2 = await O.readWindow(netFor('live', { overrides: { '/raw/blocks': cut } }), tip, 70);
  assert.equal(w2.blocks.length, 70);
  assert.ok(w2.requests >= 4);
  assert.deepEqual(w2.blocks.map((b) => b.height), Array.from({ length: 70 }, (_, i) => tip - 69 + i));
  // a page that repeats blocks, or runs past the tip, adds nothing twice
  const noisy = async (u) => {
    const from = Number(u.searchParams.get('from'));
    const blocks = [...FIX.live.blocks.slice(0, 5), ...FIX.live.blocks.filter((b) => b.header.height >= from)];
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ tip, from, blocks }) };
  };
  const w3 = await O.readWindow(netFor('live', { overrides: { '/raw/blocks': noisy } }), tip, 30);
  const heights = w3.blocks.map((b) => b.height);
  assert.equal(new Set(heights).size, heights.length);
  assert.ok(heights.every((h, i) => i === 0 || h > heights[i - 1]));
  // an empty page ends the read
  const empty = async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ blocks: [] }) });
  const w4 = await O.readWindow(netFor('live', { overrides: { '/raw/blocks': empty } }), tip, 30);
  assert.deepEqual(w4.blocks, []);
});

// ================================================================ the numbers

/** A recount that shares no code with summarize(). */
function recount(blocks) {
  const kinds = {}, channels = {};
  let tx = 0, busy = 0;
  for (const b of blocks) {
    tx += b.txCount;
    if (b.txCount > 0) busy += 1;
    for (const t of b.txs) { kinds[t.type] = (kinds[t.type] || 0) + 1; if (t.channel) channels[t.channel] = (channels[t.channel] || 0) + 1; }
  }
  return { tx, busy, kinds, channels };
}

for (const name of ['local', 'live']) {
  test('summarize(' + name + ' fixture): every count agrees with a plain recount, and the genesis block has no time', () => {
    const blocks = blocksOf(name);
    const s = O.summarize(blocks);
    const r = recount(blocks);
    assert.equal(s.count, blocks.length);
    assert.equal(s.txTotal, r.tx);
    assert.equal(s.busyBlocks, r.busy);
    assert.equal(s.emptyBlocks, blocks.length - r.busy);
    assert.equal(s.from, blocks[0].height);
    assert.equal(s.to, blocks.at(-1).height);
    // kinds: the tally of the rows equals the recount (the tail folded into "other" keeps the sum)
    assert.equal(s.kinds.reduce((n, k) => n + k.n, 0), Object.values(r.kinds).reduce((n, v) => n + v, 0));
    for (const k of s.kinds.filter((x) => x.kind !== 'other')) assert.equal(k.n, r.kinds[k.kind], k.kind);
    for (const k of s.channels.filter((x) => x.channel !== 'other')) assert.equal(k.n, r.channels[k.channel], k.channel);
    assert.equal(s.channels.reduce((n, k) => n + k.n, 0), Object.values(r.channels).reduce((n, v) => n + v, 0));
    const ranked = s.kinds.filter((x) => x.kind !== 'other').map((k) => k.n);
    assert.deepEqual(ranked, [...ranked].sort((a, b) => b - a), 'ranked high to low');
    // time: no timestamp 0 anywhere on an axis
    const timed = blocks.filter((b) => b.timestamp > 0);
    assert.equal(s.firstTs, timed[0].timestamp);
    assert.equal(s.lastTs, timed.at(-1).timestamp);
    assert.equal(s.spanMs, s.lastTs - s.firstTs);
    assert.ok(s.spanMs < 86400000 * 365, 'a span of decades means the genesis block leaked in');
    assert.equal(s.gaps.length, timed.length - 1);
    assert.ok(s.gaps.every((g) => g.ms >= 0 && g.ms < 86400000 * 365));
    assert.equal(s.buckets.items.reduce((n, b) => n + b.tx, 0), timed.reduce((n, b) => n + b.txCount, 0));
    assert.equal(s.buckets.items.reduce((n, b) => n + b.blocks, 0), timed.length);
    assert.ok(s.perHour > 0 && Number.isFinite(s.perHour));
    assert.ok(s.txTotal === 0 ? s.senders.length === 0 : s.senders.length >= 1);
    assert.ok(s.senders.every((x) => x.n > 0));
  });
}

test('the local fixture starts at block 1, whose timestamp is 0: it counts as a block and sits on no axis', () => {
  const blocks = blocksOf('local');
  assert.equal(blocks[0].height, 1);
  assert.equal(blocks[0].timestamp, 0);
  const s = O.summarize(blocks);
  assert.equal(s.count, blocks.length);
  assert.equal(s.gaps.length, blocks.length - 2);
  assert.ok(s.gaps.every((g) => g.height > 2));
  assert.ok(s.buckets.items.every((b) => b.at > 0));
});

test('summarize of nothing, of one block and of junk does not throw and says zero', () => {
  for (const x of [[], null, undefined, [null], [{}], [{ height: 1 }]]) {
    const s = O.summarize(x);
    assert.equal(s.txTotal, 0);
    assert.deepEqual(s.gaps, []);
    assert.deepEqual(s.buckets.items, []);
  }
  const one = O.summarize([{ height: 5, timestamp: 1000, txCount: 2, txs: [{ type: 'tap', sender: 'tz1a', channel: '' }, { type: 'tap', sender: 'tz1a', channel: '' }] }]);
  assert.equal(one.txTotal, 2);
  assert.equal(one.perHour, 12, 'one block has no rate: the heartbeat is the fallback');
  assert.deepEqual(one.kinds, [{ kind: 'tap', n: 2, folded: 0 }]);
});

test('tally ranks by count then name, and folds a long tail into one honest "other" row that keeps the total', () => {
  const items = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j <= 12 - i; j++) items.push('k' + String(i).padStart(2, '0'));
  const rows = O.tally(items, 5);
  assert.equal(rows.length, 5);
  assert.equal(rows[0].name, 'k00');
  assert.deepEqual(rows.slice(0, 4).map((r) => r.name), ['k00', 'k01', 'k02', 'k03']);
  const other = rows.at(-1);
  assert.equal(other.name, 'other');
  assert.equal(other.folded, 12 - 4);
  assert.equal(rows.reduce((n, r) => n + r.n, 0), items.length);
  // equal counts break by name, not by arrival order
  assert.deepEqual(O.tally(['b', 'a', 'b', 'a'], 5).map((r) => r.name), ['a', 'b']);
  assert.deepEqual(O.tally([], 5), []);
});

test('buckets sit on round edges, never more than 200, and pickBucketMs steps up with the span', () => {
  assert.equal(O.pickBucketMs(0), 60000);
  assert.equal(O.pickBucketMs(24 * 60000), 60000);
  assert.equal(O.pickBucketMs(2 * 3600000), 300000);
  assert.equal(O.pickBucketMs(10 * 86400000), 86400000);
  const ms = [60000, 300000, 600000, 1800000, 3600000, 7200000, 21600000, 86400000];
  let last = 0;
  for (const span of [1, 60000, 600000, 3600000, 14400000, 86400000, 5 * 86400000, 50 * 86400000]) {
    const b = O.pickBucketMs(span);
    assert.ok(ms.includes(b) && b >= last);
    last = b;
  }
  const list = Array.from({ length: 500 }, (_, i) => ({ height: i + 2, timestamp: 1_700_000_000_000 + i * 60000, txCount: 1, txs: [] }));
  const b = O.bucketTxs(list, 60000);
  assert.ok(b.items.length <= 200);
  assert.ok(b.items.every((x) => x.at % 60000 === 0));
  assert.deepEqual(O.bucketTxs([], 1000), { ms: 0, items: [] });
});

test('healthOf: live, late, stalled and unknown, on the heartbeat the devnet keeps', () => {
  const t = 1_700_000_000_000;
  assert.equal(O.healthOf(t, t + 1000).state, 'live');
  assert.equal(O.healthOf(t, t + 300000).state, 'live', 'a heartbeat is not late');
  assert.equal(O.healthOf(t, t + 360000).state, 'live');
  assert.equal(O.healthOf(t, t + 361000).state, 'late');
  assert.equal(O.healthOf(t, t + 900000).state, 'late');
  assert.equal(O.healthOf(t, t + 900001).state, 'stalled');
  assert.equal(O.healthOf(t, t - 5000).ageMs, 0, 'a clock that is behind never gives a negative age');
  for (const bad of [[0, 5], [NaN, 5], [t, NaN], [undefined, undefined]]) assert.equal(O.healthOf(...bad).state, 'unknown');
  assert.match(O.healthOf(t, t + 1).words, /heartbeat/);
});

test('paceWords says busy, mixed or quiet without claiming more than the number shows', () => {
  assert.match(O.paceWords(1200), /busy/);
  assert.match(O.paceWords(42), /bursts/);
  assert.match(O.paceWords(12), /quiet/);
  assert.match(O.paceWords(NaN), /unknown/);
});

// ================================================================ the other reads

test('the other readers take the recorded replies, and survive garbage', () => {
  const d = O.readDaily(FIX.local.daily);
  assert.equal(d.status, 'on');
  assert.ok(d.lot && Number.isSafeInteger(d.lot.n));
  assert.equal(d.lot.bids, FIX.local.daily.lot.bids);
  assert.equal(d.lot.minBid, FIX.local.daily.lot.min_bid);
  assert.equal(d.violations, 0);
  const n = O.readNet(FIX.live.net);
  assert.match(n.day, /^2026-/);
  assert.equal(n.checkins, FIX.live.net.counts.checkins);
  assert.equal(O.readCheckpoints(FIX.live.checkpoints).length, FIX.live.checkpoints.checkpoints.length);
  const c = O.readCapsules(FIX.live.capsules);
  assert.deepEqual({ stored: c.stored, due: c.due }, { stored: 0, due: 0 });
  const e = O.readEditions(FIX.local.editions);
  assert.equal(e[0].id, 'daily-mint');
  assert.equal(e[0].supply, 3650);
  const s = O.readStations(FIX.local.stations);
  assert.deepEqual({ total: s.total, house: s.house, claimed: s.claimed }, { total: 6, house: 6, claimed: 0 });
  const b = O.readBots(FIX.local.bots);
  assert.ok(b.total >= 1 && b.busiest.length <= 3);
  // garbage in, null or empty out, never a throw
  for (const junk of [null, undefined, 4, 'x', [], {}, { counts: 'x' }, { capsules: 'x' }, { editions: [{}, null, 3] }, { stations: [1, 2] }, { bots: [null] }]) {
    assert.doesNotThrow(() => { O.readDaily(junk); O.readNet(junk); O.readCheckpoints(junk); O.readCapsules(junk); O.readEditions(junk); O.readStations(junk); O.readBots(junk); });
  }
  assert.equal(O.readNet({}), null);
  assert.deepEqual(O.readEditions({ editions: [{}, null, 3] }), []);
  // capsule counts: due ones are counted, the next to open is the soonest waiting
  const cc = O.readCapsules({ enabled: true, capsules: [{ open_at: 5, due: true }, { open_at: 90, due: false, blocks_until_open: 30 }, { open_at: 70, due: false, blocks_until_open: 10 }] });
  assert.deepEqual({ stored: cc.stored, due: cc.due, waiting: cc.waiting, next: cc.nextInBlocks }, { stored: 3, due: 1, waiting: 2, next: 10 });
});

test('clockSkew works the devnet’s own now out of the open lot, and ignores a lot that cannot say', () => {
  const d = O.readDaily({ status: 'on', lot: { n: 3, day: '2026-10-20', close: 2_000_000, closes_in_ms: 600_000, bids: 0, min_bid: 1 } });
  assert.equal(O.clockSkew(d, 1_400_000), 0);
  assert.equal(O.clockSkew(d, 1_100_000), 300_000, 'this browser is five minutes behind');
  assert.equal(O.clockSkew(d, 1_700_000), -300_000);
  assert.equal(O.clockSkew(d, 1_400_000_000_000), 0, 'a skew of more than a week is not believed');
  for (const bad of [null, {}, { lot: null }, { lot: { closeAt: 1 } }, d]) assert.equal(O.clockSkew(bad, NaN), 0);
});

// ================================================================ one refresh

test('refresh reads everything once, checks the genesis first, and counts its requests', async () => {
  const log = [];
  const net = netFor('local', { log });
  const r = await O.refresh(net, { pinned: FIX.local.status.genesis_hash, windowSize: 50, now: () => 123 });
  assert.equal(log[0], '/status', 'the genesis check comes before any other read');
  assert.equal(r.status.genesis, FIX.local.status.genesis_hash);
  assert.equal(r.summary.count, 50);
  assert.equal(r.window.blocks.at(-1).height, FIX.local.status.height);
  assert.deepEqual(r.missing, []);
  assert.equal(r.requests, log.length);
  assert.ok(r.requests <= 10, 'about nine requests a refresh, as the page says');
  assert.equal(r.readAt, 123);
  assert.ok(log.every((p) => !p.startsWith('/tx') && !p.startsWith('/bot/') && !p.startsWith('/mcp')));
});

test('a reset stops it at the pin: GENESIS CHANGED, one request, no numbers', async () => {
  const log = [];
  const net = netFor('local', { log });
  await assert.rejects(() => O.refresh(net, { pinned: HEX('7') }), (e) => e.name === 'GenesisChanged' && e.want === HEX('7') && e.got === FIX.local.status.genesis_hash);
  assert.deepEqual(log, ['/status']);
  assert.match(K.describeError(new K.GenesisChanged('a'.repeat(64), 'b'.repeat(64))), /GENESIS CHANGED[\s\S]*reset[\s\S]*Nothing was sent/);
});

test('a part that cannot be read is named and the rest still draw', async () => {
  const down = async () => { throw new Error('boom'); };
  const net = netFor('local', { overrides: { '/daily': down, '/capsules': async () => ({ ok: false, status: 500, headers: { get: () => null }, text: async () => '{"error":"no"}' }) } });
  const r = await O.refresh(net, { pinned: null });
  assert.deepEqual(r.missing.sort(), ['capsules', 'daily']);
  assert.equal(r.daily, null);
  assert.equal(r.capsules, null);
  assert.ok(r.summary.count > 0);
  assert.ok(r.net && r.editions.length);
  // a /status that is not the shape the page reads is an error for the whole read
  const odd = netFor('local', { overrides: { '/status': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => '{"chain_id":5}' }) } });
  await assert.rejects(() => O.refresh(odd, {}), /not the shape/);
});

// ================================================================ chart geometry

test('niceMax and niceTicks give round axes', () => {
  assert.deepEqual([0, 1, 1.2, 2, 3, 7, 11, 99, 101, 5000, 1e6].map(O.niceMax), [1, 1, 2, 2, 5, 10, 20, 100, 200, 5000, 1e6]);
  for (const m of [1, 2, 5, 10, 20, 50, 100, 1000, 12000]) {
    const t = O.niceTicks(m);
    assert.equal(t[0], 0);
    assert.equal(t.at(-1), O.niceMax(m));
    assert.ok(t.length >= 2 && t.length <= 6, m + ': ' + t.join());
    assert.ok(t.every((v, i) => i === 0 || v > t[i - 1]));
  }
  assert.equal(O.tickLabel(0), '0');
  assert.equal(O.tickLabel(1500), '1.5K');
  assert.equal(O.tickLabel(20000), '20K');
});

test('columns are at most 24px thick, 2px apart, inside the plot and grow from one baseline', () => {
  for (const values of [[0], [5], [1, 0, 3, 0, 50], Array.from({ length: 24 }, (_, i) => i % 7), Array.from({ length: 200 }, (_, i) => (i % 5 ? 0 : 3))]) {
    const g = O.columnsGeom(values, { width: 640, height: 200 });
    assert.equal(g.bars.length, values.length);
    const base = g.plot.y + g.plot.h;
    for (const b of g.bars) {
      assert.ok(b.w >= 1 && b.w <= 24, 'bar width ' + b.w);
      assert.ok(b.h >= 0 && b.y + b.h <= base + 1e-9 && b.y >= g.plot.y - 1e-9);
      assert.ok(b.x >= g.plot.x - 1e-9 && b.x + b.w <= g.plot.x + g.plot.w + 1e-9);
      if (b.v > 0) assert.ok(b.h >= 2, 'a non-zero value is always visible');
      else assert.equal(b.h, 0);
    }
    for (let i = 1; i < g.bars.length; i++) {
      const gap = g.bars[i].x - (g.bars[i - 1].x + g.bars[i - 1].w);
      assert.ok(gap >= 1.99 - 1e-9 || g.bars[i].w <= 1.0000001, 'a 2px gap between neighbours (or 1px bars when crowded)');
    }
    assert.ok(g.yMax >= Math.max(1, ...values));
  }
  const g = O.columnsGeom([1, 4], { width: 640, height: 200 });
  assert.ok(g.bars[1].h > g.bars[0].h * 3.9 && g.bars[1].h < g.bars[0].h * 4.1, 'heights are proportional');
});

test('the log line puts a decade at equal heights, clamps what is off the axis and never leaves the plot', () => {
  const g = O.logLineGeom([1, 10, 100, 1000, 0.01, 5000, 3, 300], { width: 640, height: 200, min: 1, max: 1000 });
  const ys = g.ticks.map((t) => t.y);
  assert.equal(g.ticks.length, 4);
  const d1 = ys[0] - ys[1], d2 = ys[1] - ys[2], d3 = ys[2] - ys[3];
  assert.ok(Math.abs(d1 - d2) < 1e-6 && Math.abs(d2 - d3) < 1e-6, 'a decade is a constant height');
  for (const p of g.points) assert.ok(p.y >= g.plot.y - 1e-9 && p.y <= g.plot.y + g.plot.h + 1e-9 && p.x >= g.plot.x - 1e-9 && p.x <= g.plot.x + g.plot.w + 1e-9);
  assert.ok(g.points[3].y < g.points[0].y, 'larger is higher');
  assert.ok(g.points[3].y <= g.points[5].y + 1e-9 && Math.abs(g.points[3].y - g.points[5].y) < 1e-9, 'beyond the axis is clamped');
  assert.match(g.d, /^M[0-9. ]+(L[0-9. ]+)+$/);
  assert.ok(g.y(3) < g.y(1) && g.y(300) < g.y(3));
  assert.equal(O.logLineGeom([], {}).d, '');
  assert.doesNotThrow(() => O.logLineGeom([NaN, undefined, -4], {}));
});

test('horizontal bars: the longest fills the room, each is at least 2px, and rows do not overlap', () => {
  const g = O.hbarsGeom([{ n: 57 }, { n: 12 }, { n: 1 }], { width: 248, valueW: 40 });
  assert.equal(g.bars[0].w, 208);
  assert.ok(g.bars[2].w >= 2);
  assert.ok(g.bars.every((b, i) => i === 0 || b.y > g.bars[i - 1].y + g.bars[i - 1].h - 1e-9));
  assert.equal(g.height, 3 * 28);
});

// ================================================================ the view (jsdom)

/** A page skeleton made from the hooks the view reads, so the view and the skeleton cannot drift (a test below holds the page to the same list). */
function hooks() {
  const all = [...new Set(src.view.match(/data-ob-[a-z-]+(?:="[a-z-]+")?/g))];
  return all;
}
function skeleton() {
  const parts = [];
  for (const h of hooks()) {
    const attr = h.includes('=') ? h : h;
    if (/data-ob-window$/.test(h)) parts.push('<select ' + attr + ' disabled></select>');
    else if (/data-ob-live$/.test(h)) parts.push('<input type="checkbox" ' + attr + ' disabled>');
    else if (/data-ob-go$/.test(h)) parts.push('<button ' + attr + ' disabled>go</button>');
    else if (/data-ob-chart|data-ob-table/.test(h)) parts.push('<div ' + attr + '></div>');
    else if (/data-ob-cp$/.test(h)) parts.push('<ul>' + '<li ' + attr + ' hidden></li>'.repeat(5) + '</ul>');
    else if (/data-ob-genesis$/.test(h)) parts.push('<p ' + attr + ' hidden></p>');
    else parts.push('<span ' + attr + '></span>');
  }
  return parts.join('\n');
}
function mountView({ name = 'local', search = '', overrides = {}, log = [], now = () => FIX[name].status.tip_timestamp + 1000, extra = {} } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><section data-observatory-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + FIX[name].status.genesis_hash + '" data-chain-id="x">' + skeleton() + '</section></body></html>', { url: 'http://localhost/chain/observatory/' + search });
  const rootEl = dom.window.document.querySelector('[data-observatory-app]');
  const base = fakeFetch(name, { overrides, log });
  const c = view.mount(rootEl, { window: dom.window, fetch: async (u) => base(String(u).replace(DEVNET.url, 'http://127.0.0.1:8799')), now, ...extra });
  return { dom, rootEl, c, log };
}
const $$ = (rootEl, sel) => [...rootEl.querySelectorAll(sel)];
const txt = (rootEl, sel) => (rootEl.querySelector(sel) || {}).textContent;

test('the view draws the dashboard from the recorded devnet: numbers, five charts, tables and today', async () => {
  const { rootEl, c, dom } = mountView({ name: 'local' });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  const st = FIX.local.status;
  assert.equal(txt(rootEl, '[data-ob-v="height"]'), '#' + String(st.height).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  assert.equal(txt(rootEl, '[data-ob-v="mempool"]'), String(st.mempool));
  assert.equal(txt(rootEl, '[data-ob-v="accounts"]'), String(st.accounts));
  assert.equal(txt(rootEl, '[data-ob-v="supply"]'), '1,000,000');
  assert.match(txt(rootEl, '[data-ob-v="age"]'), /^\d+ s ago$|^\d+ min/);
  assert.equal(txt(rootEl, '[data-ob-health-word]'), 'LIVE');
  assert.equal(rootEl.dataset.health, 'live');
  const sum = O.summarize(blocksOf('local').slice(-O.DEFAULT_WINDOW));
  assert.equal(txt(rootEl, '[data-ob-v="tx"]'), String(sum.txTotal).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  assert.match(txt(rootEl, '[data-ob-window-note]'), /^Window: the newest 65 blocks/);
  for (const id of ['cadence', 'activity', 'kinds', 'channels']) {
    assert.ok(rootEl.querySelector('[data-ob-chart="' + id + '"] svg'), id + ' chart drawn');
    assert.ok(rootEl.querySelector('[data-ob-table="' + id + '"] table tbody tr'), id + ' table view has rows');
  }
  assert.ok(rootEl.querySelector('[data-ob-chart="senders"] table'));
  assert.match(txt(rootEl, '[data-ob-v="net"]'), /check-in/);
  assert.match(txt(rootEl, '[data-ob-v="lot"]'), /^Lot \d{4} · \d+ bids?$/);
  assert.match(txt(rootEl, '[data-ob-v="capsules"]'), /capsules? sealed/);
  assert.match(txt(rootEl, '[data-ob-meta]'), /^Read \d+ requests so far · last read \d\d:\d\d:\d\dZ · http:\/\/127\.0\.0\.1:8799|^Read \d+ requests so far · last read \d\d:\d\d:\d\dZ · https:\/\/pointcast-devnet/);
  // the kinds bars are as long as their counts say
  const bars = $$(rootEl, '[data-ob-chart="kinds"] .ob-bar').map((r) => Number(r.getAttribute('width')));
  const kinds = O.summarize(blocksOf('local')).kinds;
  assert.equal(bars.length, kinds.length);
  const hb = O.hbarsGeom(kinds.map((k) => ({ n: k.n })), { width: 248, valueW: 40 }).bars.map((b) => Math.round(b.w * 100) / 100);
  assert.deepEqual(bars.map((w) => Math.round(w * 100) / 100), hb);
  assert.ok(dom.window.document.querySelectorAll('script, iframe, img, a[href]').length === 0, 'nothing but text and shapes was made');
});

test('every chart mark can be reached by keyboard and says its value in words', async () => {
  const { rootEl, c } = mountView({ name: 'local' });
  await c.begin();
  c.stop();
  const hits = $$(rootEl, '.ob-hit');
  assert.ok(hits.length > 30);
  for (const h of hits) {
    assert.equal(h.getAttribute('tabindex'), '0');
    assert.ok((h.getAttribute('aria-label') || '').length > 5, 'a label');
  }
  for (const svg of $$(rootEl, 'svg.ob-svg')) {
    assert.equal(svg.getAttribute('role'), 'img');
    assert.ok((svg.getAttribute('aria-label') || '').length > 20, 'each chart has a text summary');
  }
  // the tooltip shows the value first, then what it is, and hides again
  const tip = rootEl.querySelector('.ob-tip');
  const first = rootEl.querySelector('[data-ob-chart="kinds"] .ob-hit');
  first.dispatchEvent(new rootEl.ownerDocument.defaultView.Event('focus'));
  assert.equal(rootEl.querySelector('[data-ob-chart="kinds"] .ob-tip').hidden, false);
  assert.match(rootEl.querySelector('[data-ob-chart="kinds"] .ob-tip__v').textContent, /^\d+ transactions?$/);
  first.dispatchEvent(new rootEl.ownerDocument.defaultView.Event('blur'));
  assert.equal(rootEl.querySelector('[data-ob-chart="kinds"] .ob-tip').hidden, true);
  assert.ok(tip);
});

test('hostile text from the devnet is shown as plain text and makes no element', async () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const blocks = FIX.local.blocks.map((b, i) => (i === 40 ? { header: b.header, txs: [{ tx: { type: evil, sender: 'pca1' + evil, channel: evil } }, { tx: { type: evil, sender: evil, channel: 'BOT' } }] } : b));
  const bots = { bots: [{ bot: evil, posts: 99, paused: false }] };
  const editions = { editions: [{ id: evil, minted: 3, terms: { supply: 10 } }] };
  const daily = { status: 'on', lot: { n: 4, day: evil, leader: evil, min_bid: 1, bids: 2, closes_in_ms: 5000, close: 9999999 }, recent: [], violations: 0, held: 0 };
  const status = { ...FIX.local.status, chain_id: evil, label: evil };
  const overrides = {
    '/raw/blocks': async (u) => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ blocks: blocks.filter((b) => b.header.height >= Number(u.searchParams.get('from'))) }) }),
    '/bots': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(bots) }),
    '/editions': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(editions) }),
    '/daily': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(daily) }),
    '/status': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(status) }),
  };
  const { rootEl, c } = mountView({ overrides });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  assert.equal(rootEl.querySelectorAll('img, script, iframe, object, embed, a[href], [onerror], [onload], style').length, 0, 'no element the devnet could have asked for');
  const all = rootEl.textContent;
  assert.ok(all.includes('<img') || all.includes('alert'), 'the text is there, as text (' + all.length + ' chars)');
  for (const el of rootEl.querySelectorAll('*')) for (const a of el.attributes) {
    assert.ok(!/^(on|href|src|srcdoc|style|action|formaction)/i.test(a.name), 'attribute ' + a.name);
    if (/[<>]|javascript:/i.test(a.value)) assert.equal(a.name, 'aria-label', 'devnet text reaches only aria-label (' + a.name + ')');
  }
});

test('a reset shows GENESIS CHANGED and reads nothing else', async () => {
  const { rootEl, c, log } = mountView({ name: 'local', overrides: { '/status': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ ...FIX.local.status, genesis_hash: HEX('9') }) }) } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'changed');
  assert.equal(rootEl.querySelector('[data-ob-genesis]').hidden, false);
  assert.match(rootEl.querySelector('[data-ob-genesis]').textContent, /GENESIS CHANGED/);
  assert.match(txt(rootEl, '[data-ob-status]'), /GENESIS CHANGED/);
  assert.deepEqual(log, ['/status']);
  assert.equal(txt(rootEl, '[data-ob-v="height"]'), '', 'no number was painted');
});

test('an unreachable devnet is said so, once, and the page does not throw', async () => {
  const { rootEl, c } = mountView({ overrides: { '/status': async () => { throw new TypeError('Failed to fetch'); } } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'down');
  assert.match(txt(rootEl, '[data-ob-status]'), /devnet did not answer[\s\S]*unreachable/);
  assert.equal(rootEl.dataset.busy, 'no');
});

test('a reply whose body stalls is cut by the same timer as a silent server: the reader fails and the dashboard does not hang', { timeout: 20000 }, async () => {
  const stall = async () => ({ ok: true, status: 200, headers: { get: () => null }, text: () => new Promise(() => {}) });
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: stall, timeoutMs: 30 });
  await assert.rejects(() => net.get('/status'), (e) => e.code === 'unreachable' && /timed out/.test(e.message));
  // the header-only stall (a fetch that never resolves) is still cut
  const silent = K.makeNet('http://127.0.0.1:8799', { fetch: () => new Promise(() => {}), timeoutMs: 30 });
  await assert.rejects(() => silent.get('/status'), /timed out/);
  // a normal reply is not cut, and its timer does not outlive it
  const ok = K.makeNet('http://127.0.0.1:8799', { fetch: async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => '{"a":1}' }), timeoutMs: 30 });
  assert.deepEqual(await ok.get('/x'), { a: 1 });
  // in the page: the window's body stalls, the read still finishes, the part is named as not readable and the rest draws
  const { rootEl, c } = mountView({ name: 'local', overrides: { '/raw/blocks': stall }, extra: { timeoutMs: 40 } });
  const done = await Promise.race([c.begin().then(() => 'done'), new Promise((r) => setTimeout(() => r('hung'), 3000))]);
  c.stop();
  assert.equal(done, 'done', 'the first read must end even when one body never finishes');
  assert.equal(rootEl.dataset.state, 'ready');
  assert.match(txt(rootEl, '[data-ob-meta]'), /not readable: blocks/);
  assert.equal(rootEl.dataset.busy, 'no');
  // the SDK client the writing pages use is bounded the same way
  assert.match(src.kit, /timedFetch\(/, 'connectPinned and makeNet both use the bounded fetch');
});

test('?devnet= is honoured only for localhost and 127.0.0.1, and the page says when it ignored one', () => {
  assert.deepEqual(K.devnetOverride('?devnet=http://127.0.0.1:8799'), { api: 'http://127.0.0.1:8799', genesis: null });
  assert.deepEqual(K.devnetOverride('?devnet=http://localhost:8799&genesis=' + HEX('a')), { api: 'http://localhost:8799', genesis: HEX('a') });
  for (const bad of ['', '?devnet=', '?devnet=https://pointcast-devnet.mhoydich.workers.dev', '?devnet=http://localhost@evil.example', '?devnet=http://user:pw@127.0.0.1:8799', '?devnet=http://127.0.0.2:8799',
    '?devnet=http://0.0.0.0:8799', '?devnet=http://[::1]:8799', '?devnet=javascript:alert(1)', '?devnet=file:///etc/passwd', '?devnet=//127.0.0.1:8799', '?devnet=evil.example', '?x=http://127.0.0.1:8799',
    '?devnet=http://127.0.0.1:8799@evil.example', '?devnet=data:text/html,x', '?devnet=http://127.0.0.1.evil.example']) {
    assert.equal(K.devnetOverride(bad), null, bad);
  }
  assert.equal(K.ignoredOverride('?devnet=https://evil.example'), true);
  assert.equal(K.ignoredOverride('?devnet=http://127.0.0.1:8799'), false);
  assert.equal(K.ignoredOverride(''), false);
  const a = mountView({ search: '?devnet=https://evil.example' });
  assert.equal(a.c.where.api, DEVNET.url, 'the page keeps the devnet it was built with');
  assert.equal(a.c.where.override, false);
  const b = mountView({ search: '?devnet=http://127.0.0.1:8799' });
  assert.equal(b.c.where.api, 'http://127.0.0.1:8799');
  assert.equal(b.c.where.genesis, null, 'a local override takes the node’s own genesis, and says so');
});

test('it is lazy: nothing is read until the page is loaded, idle, near the viewport and visible', async () => {
  const log = [];
  const { c } = mountView({ log });
  assert.deepEqual(log, [], 'mount reads nothing');
  assert.equal(c.state.begun, false);
  // whenReady with a stand-in window: it waits for idle, then the observer, then fires once
  const calls = [];
  const queue = [];
  let io = null;
  const doc = { readyState: 'complete', visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  const win = { document: doc, requestIdleCallback: (f) => queue.push(f), setTimeout: () => 0, addEventListener() {}, IntersectionObserver: class { constructor(f) { io = this; this.f = f; } observe() {} disconnect() {} } };
  K.whenReady({}, () => calls.push('go'), { window: win });
  assert.deepEqual(calls, [], 'not before idle');
  queue.shift()();
  assert.deepEqual(calls, [], 'not before the section is near the viewport');
  io.f([{ isIntersecting: false }]);
  assert.deepEqual(calls, []);
  io.f([{ isIntersecting: true }]);
  io.f([{ isIntersecting: true }]);
  assert.deepEqual(calls, ['go'], 'once');
  // a hidden tab waits for the tab to show
  const calls2 = [];
  const q2 = [];
  const handlers = [];
  const doc2 = { readyState: 'complete', visibilityState: 'hidden', addEventListener: (_, f) => handlers.push(f), removeEventListener() {} };
  K.whenReady({}, () => calls2.push('go'), { window: { document: doc2, requestIdleCallback: (f) => q2.push(f), setTimeout: () => 0, addEventListener() {} } });
  q2.shift()();
  assert.deepEqual(calls2, [], 'hidden: not yet');
  doc2.visibilityState = 'visible';
  handlers.forEach((f) => f());
  assert.deepEqual(calls2, ['go']);
});

test('Live polls /status alone while the height holds, reads the window again when a block lands, and stops when switched off', async () => {
  const log = [];
  let height = FIX.local.status.height;
  const status = async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ ...FIX.local.status, height }) });
  const { c, rootEl } = mountView({ log, overrides: { '/status': status } });
  await c.begin();
  c.stop();
  const afterBegin = log.length;
  await c.poll();
  assert.deepEqual(log.slice(afterBegin), ['/status'], 'an unchanged height costs one request');
  height += 1;
  await c.poll();
  assert.ok(log.length - afterBegin > 5, 'a new height reads the window and the rest again');
  assert.ok(log.slice(afterBegin).some((p) => p.startsWith('/raw/blocks')));
  const before = log.length;
  c.state.live = false;
  await c.poll();
  assert.equal(log.length, before, 'Live off: no poll');
  assert.equal(rootEl.dataset.state, 'ready');
});

test('the window selector and Read now each read again, and the selector offers 50, 200 and 500', async () => {
  const log = [];
  const { c, rootEl, dom } = mountView({ name: 'local', log });
  await c.begin();
  c.stop();
  const sel = rootEl.querySelector('[data-ob-window]');
  assert.deepEqual([...sel.options].map((o) => o.value), ['50', '200', '500']);
  assert.equal(sel.disabled, false);
  assert.equal(sel.value, '200');
  const n0 = log.length;
  sel.value = '50';
  sel.dispatchEvent(new dom.window.Event('change'));
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(log.slice(n0).some((p) => /^\/raw\/blocks\?from=\d+&limit=50$/.test(p)), log.slice(n0).join(' '));
  assert.match(txt(rootEl, '[data-ob-window-note]'), /^Window: the newest 50 blocks/);
  const n1 = log.length;
  rootEl.querySelector('[data-ob-go]').dispatchEvent(new dom.window.Event('click'));
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(log.length > n1);
});

// ================================================================ rules read off the sources

test('nothing from the devnet becomes markup, a link, a source or a style: a scan of the browser code, proven by mutation', () => {
  assertNoSinks(src.view, 'observatory-view.js');
  assertNoSinks(src.logic, 'observatory.js');
  assertNoSinks(src.kit, 'chain-kit.js');
  const inline = (src.page.match(/<script is:inline[\s\S]*?<\/script>/) || [''])[0];
  assert.ok(inline.length > 100);
  assertNoSinks(inline, 'the page script');
  // the scanner trips on each kind of sink
  assert.throws(() => assertNoSinks(src.view + '\nn.innerHTML = x;', 'view'), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.view + '\ndoc.write(x); document.write(x);', 'view'), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.view + '\na.href = row.v;', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.setAttribute("style", row.v);', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.setAttribute("onclick", row.v);', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.style.background = row.v;', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.logic + '\neval(text);', 'logic'), /an HTML sink/);
  assert.doesNotThrow(() => assertNoSinks('tip.style.left = Math.round(x) + "px";', 'tooltip'));
});

test('every attribute the view sets on an SVG shape is a fixed geometry or aria name: devnet text only ever reaches aria-label, cleaned', () => {
  const c = code(src.view);
  const calls = [...c.matchAll(/\bsv\(doc, '([a-z]+)', \{([^}]*)\}/g)];
  assert.ok(calls.length >= 20, 'found ' + calls.length + ' shapes');
  const allowed = new Set(['viewBox', 'class', 'role', 'aria-label', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'width', 'height', 'd', 'tabindex', 'text-anchor']);
  for (const [, tag, body] of calls) {
    assert.ok(['svg', 'line', 'text', 'path', 'circle', 'rect'].includes(tag), tag);
    for (const k of body.matchAll(/(?:^|,)\s*'?([A-Za-z-]+)'?\s*:/g)) assert.ok(allowed.has(k[1]), 'attribute ' + k[1] + ' on ' + tag);
  }
  // every setAttribute outside sv() names a fixed attribute
  for (const m of c.matchAll(/setAttribute\(\s*([^,]+),/g)) assert.ok(/^['"](role|[a-z-]+)['"]$|^k$/.test(m[1].trim()), m[1]);
  // and the devnet-derived words that reach an aria-label went through cleanText in observatory.js, never straight from a reply
  assert.match(src.logic, /cleanText\(t\.tx\.type, 40\)/);
  assert.match(src.logic, /cleanText\(t\.tx\.sender, 80\)/);
  assert.match(src.logic, /cleanText\(t\.tx\.channel, 16\)/);
});

test('the Observatory only reads: no POST, no write route, no key handling, in any of its files', () => {
  assertReadOnly(src.logic, 'observatory.js');
  assertReadOnly(src.view, 'observatory-view.js');
  assertReadOnly(src.page, 'observatory.astro');
  for (const f of [src.logic, src.view]) {
    assert.doesNotMatch(code(f), /\.post\(|\/tx['"\/]|\/bot\/|\/mcp|\/body['"]|keyFromSeed|signAndSend|localStorage|sessionStorage|indexedDB|document\.cookie/, 'no write route and nothing stored');
  }
  assert.match(src.page, /It reads\. It never writes\./);
  // GET only on the wire: every request the suite saw above went through makeNet.get
  assert.match(src.logic, /net\.get\(/);
});

test('the view reads only through makeNet, with no credentials and no referrer, and never builds a URL from devnet text', () => {
  assert.doesNotMatch(code(src.view), /\bfetch\s*\(/, 'the view never calls fetch itself');
  assert.doesNotMatch(code(src.logic), /\bfetch\s*\(/, 'nor the logic');
  assert.match(src.kit, /credentials: 'omit'[\s\S]*referrerPolicy: 'no-referrer'/);
  const c = code(src.logic);
  let at = c.indexOf('net.get(');
  let seen = 0;
  while (at >= 0) {
    let depth = 0, i = at + 7;
    for (; i < c.length; i++) { if (c[i] === '(') depth++; else if (c[i] === ')') { depth--; if (depth === 0) break; } }
    const arg = c.slice(at + 8, i).trim();
    assert.ok(/^'\/[a-z]+'$/.test(arg) || arg === "'/raw/blocks?from=' + from + '&limit=' + Math.min(PAGE_LIMIT, tip - from + 1)", 'a fixed route or numbers only: ' + arg);
    seen += 1;
    at = c.indexOf('net.get(', i);
  }
  assert.ok(seen >= 8, 'found ' + seen + ' reads');
});

test('the page and the view agree on every hook, and the page uses the registry key', () => {
  for (const h of hooks()) {
    const m = /^(data-ob-[a-z-]+)(?:="([a-z-]+)")?$/.exec(h);
    const [, name, value] = m;
    if (!value) assert.ok(src.page.includes(name), h + ' is in the page');
    else if (src.page.includes(h)) assert.ok(true);
    else assert.ok(src.page.includes(name + '={') && new RegExp("id: '" + value + "'").test(src.page), h + ' is in the page (generated from its table)');
  }
  assert.match(src.page, /<ChainHeader current="observatory"/);
  assert.ok(CHAIN_APPS.some((a) => a.key === 'observatory' && a.href === APP.path));
  assert.match(src.page, /import\('\/chain\/apps\/observatory-view\.js'\)/);
  assert.match(src.page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(src.page, /assertDevnetLaunchPinned\(\)/);
});

test('the page is honest: devnet-2, no value, may reset, a dated and recorded reset, and what the numbers are and are not', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const para = (src.page.match(/<p class="ca-honest"[\s\S]*?<\/p>/) || [''])[0];
  for (const needle of ['{HONESTY_LINE}', '{DEVNET.chainId}', 'reset is dated and recorded, never silent', '{DEVNET_PREVIOUS.path}', '{notYet(RESET.date)}', 'what that one server says']) assert.ok(para.includes(needle), needle);
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.equal(DEVNET.chainId, 'pointcast-devnet-2');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  assert.ok(NOT_LIST.length >= 5);
  assert.ok(NOT_LIST.some((l) => /does not check anything/i.test(l)) && NOT_LIST.some((l) => /Keys are not people/.test(l)) && NOT_LIST.some((l) => /no value, may reset/.test(l)));
  assert.equal(READS.length, 6);
  for (const k of ['cadence', 'activity', 'kinds', 'channels', 'senders']) assert.ok(CHART_NOTES[k].length > 20);
  assert.match(src.page, /A dashboard is one server’s word\./);
});

test('no banned word and no currency sign anywhere in the app’s files, and the scanner catches each one', () => {
  assert.ok(MY_FILES.length >= 6);
  for (const f of MY_FILES) {
    const text = read(f);
    assert.deepEqual(bannedHits(text), [], f + ' carries a banned word');
    assert.deepEqual(currencyHits(text), [], f + ' carries a price');
  }
  for (const w of BANNED) {
    assert.ok(bannedHits('some ' + w + ' here').length, w);
    assert.ok(bannedHits(w.toUpperCase()).length, w + ' upper');
  }
  for (const ok of ['learn', 'mistake', 'a nearby block', 'the genesis hash']) assert.deepEqual(bannedHits(ok), [], ok);
  assert.ok(currencyHits('costs ' + String.fromCharCode(36) + '5 today').length === 1);
  assert.deepEqual(currencyHits('a template ' + String.fromCharCode(36) + '{x} and a regex /a' + String.fromCharCode(36) + '/'), []);
});

test('the page is accessible and responsive by construction: labelled controls, status regions, a table view for every chart, no fixed widths', () => {
  assert.match(src.page, /<label class="ca-label" for="ob-window">/);
  assert.match(src.page, /data-ob-status role="status" aria-live="polite"/);
  assert.equal((src.page.match(/<details class="ob-tv"><summary>Table view<\/summary>/g) || []).length, 1, 'one template, mapped over every chart');
  assert.match(src.page, /charts\.map\(/);
  assert.match(src.styles, /@media \(max-width:760px\)/);
  assert.match(src.styles, /prefers-reduced-motion: reduce/);
  assert.match(src.styles, /prefers-color-scheme: dark/);
  assert.match(src.page, /\.ob-svg\{display:block;width:100%;height:auto/);
  // 44px touch targets on the controls
  assert.match(src.styles, /\.ca-input,\.chn \.ca-select,\.chn \.ca-textarea\{min-height:44px/);
  assert.match(src.styles, /\.ca-toggle\{[^}]*min-height:44px/);
});

// ================================================================ the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/observatory/index.html', root);
test('the built page carries the hooks, the honesty line and the pinned genesis, and loads no outside script', { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
  const html = readFileSync(builtPath, 'utf8');
  for (const h of hooks()) assert.ok(html.includes(h), h + ' in the built page');
  assert.ok(html.includes(HONESTY_LINE));
  assert.ok(html.includes('data-genesis="' + DEVNET.genesis + '"'));
  assert.match(html, /<h1>Watch the devnet breathe\.<\/h1>/);
  assert.match(html, /aria-current="page"[^>]*>Observatory</);
  assert.ok(!/<script[^>]+src="https?:\/\/(?!pointcast\.xyz)/.test(html), 'no script from another origin');
});

// ================================================================ the real devnets (GET reads only; skipped when unreachable)

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

for (const [label, ep, pinned] of [['local devnet-2 at 127.0.0.1:8799', LOCAL, () => (LOCAL ? LOCAL.status.genesis_hash : '')], ['the live devnet', LIVE, () => DEVNET.genesis]]) {
  test('against ' + label + ': the dashboard’s counts equal a recount of the raw blocks it read', async (t) => {
    if (!ep) return t.skip(label + ' is not reachable');
    if (ep.status.genesis_hash !== pinned()) return t.skip(label + ' has a different genesis from the one pinned here');
    const net = K.makeNet(ep.base);
    const r = await O.refresh(net, { pinned: pinned(), windowSize: 200 });
    assert.deepEqual(r.missing, [], 'every part readable');
    assert.ok(r.requests <= 10);
    // a recount from the raw replies, sharing no code with the dashboard
    const tip = r.status.height;
    const from = Math.max(1, tip - r.summary.count + 1);
    const raw = [];
    for (let at = from; at <= tip; ) {
      const page = await (await fetch(ep.base + '/raw/blocks?from=' + at + '&limit=500')).json();
      for (const b of page.blocks) if (b.header.height <= tip) raw.push(b);
      at = page.blocks.at(-1).header.height + 1;
    }
    const upTo = raw.filter((b) => b.header.height <= r.summary.to);
    const kinds = {};
    let tx = 0;
    for (const b of upTo) for (const x of b.txs) { tx += 1; kinds[x.tx.type] = (kinds[x.tx.type] || 0) + 1; }
    assert.equal(r.summary.txTotal, tx);
    for (const k of r.summary.kinds.filter((x) => x.kind !== 'other')) assert.equal(k.n, kinds[k.kind], k.kind);
    assert.equal(r.summary.to, upTo.at(-1).header.height);
    assert.equal(r.summary.count, upTo.length);
    assert.ok(r.status.height >= r.summary.to && r.status.height - r.summary.to < 50, 'the window ends at (or just behind) the tip');
    assert.equal(r.daily && r.daily.status, 'on');
    assert.ok(Number.isSafeInteger(O.readDaily(await (await fetch(ep.base + '/daily')).json()).lot.n));
  });
}
