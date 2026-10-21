// observatory.js: the logic behind the Chain Observatory (/chain/observatory),
// a live dashboard of the PointCast devnet.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-observatory.test.mjs, scripts/e2e-chain-app-observatory.mjs).
// It turns what GET /status, /raw/blocks, /net, /daily, /capsules, /editions
// and /stations send into plain numbers and chart geometry. The view
// (observatory-view.js) draws those as text and SVG shapes: nothing read from
// the devnet ever becomes markup, an href, a src or a style value.
//
// What it shows is a window of recent blocks, not the whole chain: every
// number says which window it came from. devnet: no value, may reset.

import { cleanText, isHex64, isObj, isWhole, makeNet, blocksPerHour, pinnedStatus } from './chain-kit.js';

export const WINDOWS = Object.freeze([50, 200, 500]);
export const DEFAULT_WINDOW = 200;
export const PAGE_LIMIT = 500;
/** The devnet seals one heartbeat block every five minutes when nothing is posted (GET /status heartbeat_ms). */
export const HEARTBEAT_MS = 300000;

// ---------------------------------------------------------------- reading blocks

/** A raw block checked for the shape this dashboard relies on; null if it is not one (it is then skipped, never trusted). */
export function readRawBlock(json) {
  if (!isObj(json) || !isObj(json.header) || !Array.isArray(json.txs)) return null;
  const h = json.header;
  if (!isWhole(h.height) || h.height < 1 || !isWhole(h.timestamp)) return null;
  if (!isHex64(h.prev_hash)) return null;
  const txs = [];
  for (const t of json.txs.slice(0, 1000)) {
    if (!isObj(t) || !isObj(t.tx) || typeof t.tx.type !== 'string' || typeof t.tx.sender !== 'string') continue;
    txs.push({
      type: cleanText(t.tx.type, 40),
      sender: cleanText(t.tx.sender, 80),
      channel: typeof t.tx.channel === 'string' ? cleanText(t.tx.channel, 16) : '',
    });
  }
  return { height: h.height, timestamp: h.timestamp, txCount: json.txs.length, txs };
}

/**
 * The newest `count` blocks, oldest first: GET /raw/blocks pages, resuming from
 * the last height received when the devnet cuts a page short (it stops a page
 * early past a byte budget). Returns { blocks, tip, requests }.
 */
export async function readWindow(net, tip, count = DEFAULT_WINDOW) {
  const want = Math.max(1, Math.min(count, tip));
  let from = Math.max(1, tip - want + 1);
  const out = [];
  let requests = 0;
  while (from <= tip && requests < 12) {
    const page = await net.get('/raw/blocks?from=' + from + '&limit=' + Math.min(PAGE_LIMIT, tip - from + 1));
    requests += 1;
    if (!isObj(page) || !Array.isArray(page.blocks) || page.blocks.length === 0) break;
    let last = from - 1;
    for (const raw of page.blocks) {
      const b = readRawBlock(raw);
      if (!b || b.height <= last || b.height > tip) continue;
      out.push(b);
      last = b.height;
    }
    if (last < from) break;
    from = last + 1;
  }
  return { blocks: out, tip, requests };
}

// ---------------------------------------------------------------- the numbers

const kindOfSender = (s) => (s.startsWith('pca1') ? 'agent' : s.startsWith('pcp1') ? 'passkey' : s.startsWith('tz') ? 'key' : 'other');

/** Count rows { name, n } sorted by count (high first) then name, cut to `limit` with the rest folded into 'other'. */
export function tally(items, limit = 8) {
  const m = new Map();
  for (const it of items) m.set(it, (m.get(it) || 0) + 1);
  const rows = [...m.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || (a.name < b.name ? -1 : 1));
  if (rows.length <= limit) return rows;
  const head = rows.slice(0, limit - 1);
  const rest = rows.slice(limit - 1).reduce((s, r) => s + r.n, 0);
  return [...head, { name: 'other', n: rest, folded: rows.length - head.length }];
}

/**
 * Everything the dashboard says about a window of blocks (oldest first):
 * counts, the gaps between blocks, transactions per time bucket, kinds,
 * channels and senders, and the rate the devnet is actually sealing at.
 */
export function summarize(blocks, { bucketMs = null } = {}) {
  const list = (blocks || []).filter((b) => b && isWhole(b.height) && isWhole(b.timestamp));
  // The genesis block carries timestamp 0: it counts as a block but has no time, so no gap, span or bucket uses it.
  const timed = list.filter((b) => b.timestamp > 0);
  const n = list.length;
  const out = {
    count: n,
    from: n ? list[0].height : 0,
    to: n ? list[n - 1].height : 0,
    firstTs: timed.length ? timed[0].timestamp : 0,
    lastTs: timed.length ? timed[timed.length - 1].timestamp : 0,
    spanMs: 0,
    txTotal: 0,
    busyBlocks: 0,
    emptyBlocks: 0,
    gaps: [],
    // null until two timed blocks a second or more apart make a rate: a made-up 12 an hour is not a measurement.
    perHour: null,
    untimedTx: 0,
    txPerHour: 0,
    busiest: null,
    kinds: [],
    channels: [],
    senders: [],
    buckets: { ms: 0, items: [] },
    longestGapMs: 0,
    typicalGapMs: 0,
  };
  if (!n) return out;
  out.spanMs = out.lastTs - out.firstTs;
  const kinds = [];
  const channels = [];
  const senders = [];
  for (let i = 0; i < n; i++) {
    const b = list[i];
    const c = Number.isInteger(b.txCount) ? b.txCount : (b.txs || []).length;
    out.txTotal += c;
    if (c > 0) out.busyBlocks += 1; else out.emptyBlocks += 1;
    if (!out.busiest || c > out.busiest.n) out.busiest = { height: b.height, n: c };
    const prev = i > 0 ? list[i - 1] : null;
    if (prev && prev.timestamp > 0 && b.timestamp > 0) out.gaps.push({ height: b.height, ms: Math.max(0, b.timestamp - prev.timestamp) });
    for (const t of b.txs || []) {
      kinds.push(t.type);
      if (t.channel) channels.push(t.channel);
      senders.push(t.sender);
    }
  }
  if (out.busiest && out.busiest.n === 0) out.busiest = null;
  out.perHour = blocksPerHour(timed.map((b) => b.timestamp), null);
  out.untimedTx = list.filter((b) => b.timestamp === 0).reduce((n, b) => n + (Number.isInteger(b.txCount) ? b.txCount : (b.txs || []).length), 0);
  const timedTx = timed.reduce((s, b) => s + (Number.isInteger(b.txCount) ? b.txCount : (b.txs || []).length), 0);
  out.txPerHour = out.spanMs >= 60000 ? (timedTx * 3600000) / out.spanMs : timedTx;
  const g = out.gaps.map((x) => x.ms).sort((a, b) => a - b);
  out.longestGapMs = g.length ? g[g.length - 1] : 0;
  out.typicalGapMs = g.length ? g[Math.floor(g.length / 2)] : 0;
  out.kinds = tally(kinds, 10).map((r) => ({ kind: r.name, n: r.n, folded: r.folded || 0 }));
  out.channels = tally(channels, 8).map((r) => ({ channel: r.name, n: r.n, folded: r.folded || 0 }));
  out.senders = tally(senders, 8).map((r) => ({ sender: r.name, n: r.n, who: r.name === 'other' ? 'other' : kindOfSender(r.name), folded: r.folded || 0 }));
  out.buckets = bucketTxs(timed, bucketMs);
  return out;
}

/** The bucket width a span deserves: about 24 columns, on a round number of minutes. */
export function pickBucketMs(spanMs) {
  const steps = [60000, 300000, 600000, 1800000, 3600000, 7200000, 21600000, 86400000];
  const target = Math.max(1, spanMs) / 24;
  return steps.find((s) => s >= target) || steps[steps.length - 1];
}

/** Transactions per time bucket, oldest first, on bucket edges aligned to the epoch (so a refresh keeps the columns still). */
export function bucketTxs(list, bucketMs = null) {
  if (!list.length) return { ms: 0, items: [] };
  const first = list[0].timestamp;
  const last = list[list.length - 1].timestamp;
  const ms = bucketMs || pickBucketMs(last - first);
  const start = Math.floor(first / ms) * ms;
  const count = Math.min(200, Math.floor((last - start) / ms) + 1);
  const items = Array.from({ length: count }, (_, i) => ({ at: start + i * ms, tx: 0, blocks: 0 }));
  for (const b of list) {
    const i = Math.min(count - 1, Math.floor((b.timestamp - start) / ms));
    if (i < 0) continue;
    items[i].tx += Number.isInteger(b.txCount) ? b.txCount : (b.txs || []).length;
    items[i].blocks += 1;
  }
  return { ms, items };
}

/** The seal rate in words: the devnet seals within seconds when something is posted and otherwise once every five minutes. */
export function paceWords(perHour) {
  if (!Number.isFinite(perHour)) return 'pace unknown';
  if (perHour >= 600) return 'busy: blocks seconds apart';
  if (perHour > 18) return 'bursts of posts between heartbeat blocks';
  return 'quiet: about one heartbeat block every five minutes';
}

// ---------------------------------------------------------------- health

/**
 * Is the sequencer sealing? The devnet seals when there is traffic and every
 * five minutes otherwise, so a tip older than about six minutes is "late" and
 * older than fifteen is "stalled". `now` and `tipTs` are in ms.
 */
export function healthOf(tipTs, now, heartbeatMs = HEARTBEAT_MS, { clockChecked = true, stillMs = null } = {}) {
  if (!Number.isFinite(tipTs) || tipTs <= 0 || !Number.isFinite(now)) return { state: 'unknown', ageMs: null, words: 'The age of the newest block is not known.' };
  const ageMs = Math.max(0, now - tipTs);
  const state = ageMs <= heartbeatMs * 1.2 ? 'live' : ageMs <= heartbeatMs * 3 ? 'late' : 'stalled';
  const words = {
    live: 'Sealing on schedule: an idle devnet seals one heartbeat block every five minutes, a busy one every three seconds.',
    late: 'The newest block is older than a heartbeat. The sequencer may be restarting.',
    stalled: 'No block for a long while. The devnet may be paused or down; it is a single server and may reset.',
  };
  if (clockChecked) return { state, ageMs, words: words[state] };
  // No open lot, so this browser's clock cannot be checked against the devnet's (clockSkew has nothing to work from). A visitor
  // clock minutes fast would turn a live devnet LATE. LATE and STALLED are claimed only if the page's own reads agree: it has watched
  // the same newest block stand for as long as that state needs (a span on one clock, so an offset cancels out).
  const note = ' This is judged by your own clock, which cannot be checked against the devnet’s while no lot is open.';
  if (state === 'live') return { state, ageMs, words: words.live + note };
  const needed = heartbeatMs * (state === 'late' ? 1.2 : 3);
  if (Number.isFinite(stillMs) && stillMs > needed) return { state, ageMs, words: words[state] + note + ' This page has also watched the same newest block stand still for ' + Math.round(stillMs / 60000) + ' min.' };
  return { state: 'unknown', ageMs, words: 'By your clock the newest block is old, but that clock cannot be checked against the devnet’s while no lot is open, and this page has not watched the newest block stand still long enough to say the devnet is ' + state + '. No claim is made.' };
}

/** Can this browser's clock be checked against the devnet's? Only through the open lot's close time (see clockSkew). */
export function clockChecked(daily, readAtClient) {
  const lot = daily && daily.lot;
  if (!lot || !Number.isFinite(lot.closeAt) || !Number.isFinite(lot.closesInMs) || !Number.isFinite(readAtClient)) return false;
  return Math.abs(lot.closeAt - lot.closesInMs - readAtClient) < 7 * 86400000;
}

// ---------------------------------------------------------------- the other reads

/** GET /daily -> the open lot and the house's own tally, or null when the Daily Mint is off or not that shape. */
export function readDaily(json) {
  if (!isObj(json)) return null;
  const lot = isObj(json.lot) ? json.lot : null;
  const recent = Array.isArray(json.recent) ? json.recent.filter(isObj) : [];
  return {
    status: cleanText(String(json.status || ''), 20),
    lot: lot && isWhole(lot.n)
      ? {
        n: lot.n,
        day: cleanText(String(lot.day || ''), 10),
        // GET /daily gives the leader as { sender, amount, words, to, height }; GET /daily/N gives just the sender.
        leader: typeof lot.leader === 'string' ? cleanText(lot.leader, 80) : isObj(lot.leader) && typeof lot.leader.sender === 'string' ? cleanText(lot.leader.sender, 80) : '',
        leaderAmount: isObj(lot.leader) && Number.isFinite(lot.leader.amount) ? lot.leader.amount : null,
        minBid: Number.isFinite(lot.min_bid) ? lot.min_bid : null,
        bids: isWhole(lot.bids) ? lot.bids : 0,
        closesInMs: Number.isFinite(lot.closes_in_ms) ? Math.max(0, lot.closes_in_ms) : null,
        closeAt: Number.isFinite(lot.close) ? lot.close : null,
      }
      : null,
    settled: recent.filter((r) => isWhole(r.settled_height)).length,
    sold: recent.filter((r) => Number.isFinite(r.price) && r.price > 0).length,
    violations: isWhole(json.violations) ? json.violations : null,
    held: isWhole(json.held) ? json.held : null,
  };
}

/**
 * How far this browser's clock is from the devnet's, in ms (server minus client),
 * worked out from the open lot: the devnet says when it closes and how long from
 * now that is, so its own "now" is the difference. 0 when the lot cannot say.
 * The devnet sends no Date header a page may read, so this is the one probe.
 */
export function clockSkew(daily, readAtClient) {
  const lot = daily && daily.lot;
  if (!lot || !Number.isFinite(lot.closeAt) || !Number.isFinite(lot.closesInMs) || !Number.isFinite(readAtClient)) return 0;
  const skew = lot.closeAt - lot.closesInMs - readAtClient;
  return Math.abs(skew) < 7 * 86400000 ? skew : 0;
}

/** The three classes of who signed a tx, in the order every view shows them (GET /net `classes`). */
export const CLASSES = Object.freeze(['house', 'keyless', 'outside']);
/** This site's own copy of the devnet's line about them. */
export const CLASS_LINE = 'House activity is the chain checking itself, not use.';
const ROLE_RE = /^[a-z0-9][a-z0-9/-]{1,31}$/;
const BOT_RE = /^[a-z0-9-]{2,24}$/;
const ADDR_RE = /^(?:tz[1-4]|pc[ap]1)[1-9A-HJ-NP-Za-km-z]{20,60}$/;

/**
 * GET /net `classes` -> { day, chain, share } or null when the devnet does not
 * send it. Each class is { txs, keys }; today's also names up to five keys as
 * { label, txs }: a house role, a bot name, or an address, each checked
 * against its own alphabet (anything else becomes a plain word).
 */
export function readClasses(c) {
  if (!isObj(c) || !isObj(c.day) || !isObj(c.chain)) return null;
  const num = (v) => (isWhole(v) ? v : 0);
  const label = (cls, w) => {
    if (cls === 'house') return typeof w.label === 'string' && ROLE_RE.test(w.label) ? w.label : 'a house key';
    if (cls === 'keyless') return typeof w.label === 'string' && BOT_RE.test(w.label) ? w.label : 'a keyless bot';
    return typeof w.addr === 'string' && ADDR_RE.test(w.addr) ? cleanText(w.addr, 64) : 'a key';
  };
  const one = (o, cls, who) => {
    const x = isObj(o) ? o : {};
    const out = { txs: num(x.txs), keys: num(x.keys) };
    if (who) out.who = (Array.isArray(x.who) ? x.who : []).filter(isObj).slice(0, 5).map((w) => ({ label: label(cls, w), txs: num(w.txs) }));
    return out;
  };
  const share = (v) => (Number.isFinite(v) && v >= 0 && v <= 1 ? v : null);
  const s = isObj(c.outside_share) ? c.outside_share : {};
  return {
    day: Object.fromEntries(CLASSES.map((k) => [k, one(c.day[k], k, true)])),
    chain: Object.fromEntries(CLASSES.map((k) => [k, one(c.chain[k], k, false)])),
    share: { day: share(s.day), chain: share(s.chain) },
  };
}

/** GET /net -> today's Daily Net counts, the newest checkpoint, and who signed today's txs. */
export function readNet(json) {
  if (!isObj(json) || !isObj(json.counts)) return null;
  const c = json.counts;
  const num = (v) => (isWhole(v) ? v : 0);
  const cp = isObj(json.checkpoint) && isObj(json.checkpoint.latest) && isWhole(json.checkpoint.latest.height) ? json.checkpoint.latest.height : null;
  return {
    classes: readClasses(json.classes),
    day: cleanText(String(json.day || ''), 10),
    resetsAt: cleanText(String(json.resets_at || ''), 24),
    checkins: num(c.checkins),
    witnesses: num(c.witnesses),
    reviews: num(c.reviews),
    observes: num(c.observes),
    crosschecks: num(c.crosschecks),
    digests: num(c.digests),
    signals: num(c.signals),
    strikes: num(c.strikes),
    participants: num(c.participants),
    latestCheckpoint: cp,
  };
}

/** GET /checkpoints -> { height, distinct, correct, strikes }[] (newest last). */
export function readCheckpoints(json) {
  if (!isObj(json) || !Array.isArray(json.checkpoints)) return [];
  return json.checkpoints
    .filter((c) => isObj(c) && isWhole(c.height))
    .map((c) => ({ height: c.height, distinct: isWhole(c.distinct) ? c.distinct : 0, correct: isWhole(c.correct) ? c.correct : 0, strikes: isWhole(c.strikes) ? c.strikes : 0 }))
    .slice(-12);
}

/** GET /capsules -> sealed capsules still stored, how many may be opened now, the next one to open. */
export function readCapsules(json) {
  if (!isObj(json) || !Array.isArray(json.capsules)) return null;
  const list = json.capsules.filter((c) => isObj(c) && isWhole(c.open_at));
  const due = list.filter((c) => c.due === true).length;
  const waiting = list.filter((c) => c.due !== true && isWhole(c.blocks_until_open) && c.blocks_until_open > 0);
  const next = waiting.length ? Math.min(...waiting.map((c) => c.blocks_until_open)) : null;
  return { stored: list.length, due, waiting: waiting.length, nextInBlocks: next, enabled: json.enabled === true };
}

/** GET /editions -> { id, minted, supply }[]. */
export function readEditions(json) {
  if (!isObj(json) || !Array.isArray(json.editions)) return [];
  return json.editions
    .filter((e) => isObj(e) && typeof e.id === 'string')
    .map((e) => ({
      id: cleanText(e.id, 64),
      minted: isWhole(e.minted) ? e.minted : 0,
      supply: isObj(e.terms) && isWhole(e.terms.supply) ? e.terms.supply : isWhole(e.minted) && isWhole(e.remaining) ? e.minted + e.remaining : 0,
    }))
    .slice(0, 12);
}

/** GET /stations -> house and claimed station counts. */
export function readStations(json) {
  if (!isObj(json) || !Array.isArray(json.stations)) return null;
  const list = json.stations.filter(isObj);
  const house = list.filter((s) => s.house === true).length;
  return { total: list.length, house, claimed: list.length - house, crew: list.filter((s) => s.mode === 'crew').length };
}

/** GET /bots -> how many keyless bots, and the three busiest by posts. */
export function readBots(json) {
  if (!isObj(json) || !Array.isArray(json.bots)) return null;
  const list = json.bots.filter((b) => isObj(b) && typeof b.bot === 'string');
  const busiest = list
    .map((b) => ({ bot: cleanText(b.bot, 24), posts: isWhole(b.posts) ? b.posts : 0, paused: b.paused === true }))
    .sort((a, b) => b.posts - a.posts || (a.bot < b.bot ? -1 : 1))
    .slice(0, 3);
  return { total: list.length, paused: list.filter((b) => b.paused === true).length, busiest };
}

// ---------------------------------------------------------------- one refresh

/**
 * Read everything the dashboard shows, with the genesis checked first. Each
 * part fails on its own: a part that cannot be read is null and named in
 * `missing`, and the rest still draw. Returns { status, window, daily, net,
 * checkpoints, capsules, editions, stations, bots, missing, requests, readAt }.
 */
export async function refresh(net, { pinned = null, windowSize = DEFAULT_WINDOW, now = () => Date.now(), parts = null } = {}) {
  const startedAt = net.count;
  const st = await pinnedStatus(net, pinned);
  const missing = [];
  const guard = async (name, f, fallback = null) => {
    try { return await f(); } catch { missing.push(name); return fallback; }
  };
  const want = (k) => !parts || parts.includes(k);
  // The clock probe is the lot's close time against the moment GET /daily was answered, not the moment the last of nine reads ended.
  let dailyAt = null;
  const [win, daily, netj, cps, caps, eds, sts, bots] = await Promise.all([
    want('window') ? guard('blocks', () => readWindow(net, st.height, windowSize)) : null,
    want('daily') ? guard('daily', async () => { const j = await net.get('/daily'); dailyAt = now(); return readDaily(j); }) : null,
    want('net') ? guard('net', async () => readNet(await net.get('/net'))) : null,
    want('net') ? guard('checkpoints', async () => readCheckpoints(await net.get('/checkpoints'))) : null,
    want('capsules') ? guard('capsules', async () => readCapsules(await net.get('/capsules'))) : null,
    want('editions') ? guard('editions', async () => readEditions(await net.get('/editions'))) : null,
    want('stations') ? guard('stations', async () => readStations(await net.get('/stations'))) : null,
    want('bots') ? guard('bots', async () => readBots(await net.get('/bots'))) : null,
  ]);
  return {
    status: st,
    window: win,
    summary: win ? summarize(win.blocks) : null,
    daily,
    net: netj,
    checkpoints: cps || [],
    capsules: caps,
    editions: eds || [],
    stations: sts,
    bots,
    missing,
    requests: net.count - startedAt,
    readAt: dailyAt !== null ? dailyAt : now(),
  };
}

export { makeNet };

// ---------------------------------------------------------------- chart geometry (numbers only)

/** A round axis maximum at or above v: 1, 2, 5 times a power of ten (at least 1). */
export function niceMax(v) {
  if (!Number.isFinite(v) || v <= 1) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Axis tick values from 0 to max: three or four round numbers, no more. */
export function niceTicks(max) {
  const top = niceMax(max);
  const step = top <= 4 ? 1 : top / (top % 4 === 0 ? 4 : top % 3 === 0 ? 3 : top % 5 === 0 ? 5 : 2);
  const ticks = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks.length > 6 ? [0, top / 2, top] : ticks;
}

/** A compact tick label: 0, 12, 1.5K, 20K. */
export function tickLabel(v) {
  if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return String(Math.round(v * 10) / 10);
}

/**
 * Columns for a bar chart: at most `maxBar` px thick, a 2px gap between
 * neighbours, growing from a baseline. Returns { bars, ticks, yMax, plot }.
 */
export function columnsGeom(values, { width = 640, height = 200, left = 36, right = 8, top = 10, bottom = 22, maxBar = 24, gap = 2 } = {}) {
  const n = values.length;
  const plot = { x: left, y: top, w: Math.max(1, width - left - right), h: Math.max(1, height - top - bottom) };
  const yMax = niceMax(Math.max(1, ...values));
  const slot = n ? plot.w / n : plot.w;
  const bw = Math.max(1, Math.min(maxBar, slot - gap));
  const bars = values.map((v, i) => {
    const h = v > 0 ? Math.max(2, (v / yMax) * plot.h) : 0;
    return { i, v, x: plot.x + i * slot + (slot - bw) / 2, y: plot.y + plot.h - h, w: bw, h, hit: { x: plot.x + i * slot, w: slot } };
  });
  const ticks = niceTicks(yMax).map((v) => ({ v, y: plot.y + plot.h - (v / yMax) * plot.h, label: tickLabel(v) }));
  return { bars, ticks, yMax, plot };
}

/**
 * A line on a log axis (seconds between blocks run from 3 to 300, so a straight
 * axis would flatten the busy half). `values` are positive numbers; ticks are
 * decades. Returns { points, d, ticks, plot, min, max }.
 */
export function logLineGeom(values, { width = 640, height = 200, left = 44, right = 12, top = 10, bottom = 22, min = 1, max = 1000 } = {}) {
  const plot = { x: left, y: top, w: Math.max(1, width - left - right), h: Math.max(1, height - top - bottom) };
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  const ys = (v) => {
    const c = Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
    return plot.y + plot.h - ((Math.log10(c) - lo) / (hi - lo)) * plot.h;
  };
  const n = values.length;
  const points = values.map((v, i) => ({ i, v, x: plot.x + (n <= 1 ? plot.w / 2 : (i / (n - 1)) * plot.w), y: ys(v) }));
  const d = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join('');
  const ticks = [];
  for (let e = Math.ceil(lo); e <= Math.floor(hi); e++) ticks.push({ v: Math.pow(10, e), y: ys(Math.pow(10, e)), label: tickLabel(Math.pow(10, e)) });
  return { points, d, ticks, plot, min, max, y: ys };
}

/** Horizontal bars for a short ranked list: the longest fills `width` minus a value gutter. */
export function hbarsGeom(rows, { width = 320, rowH = 28, bar = 14, valueW = 44 } = {}) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const room = Math.max(10, width - valueW);
  return {
    height: rows.length * rowH,
    bars: rows.map((r, i) => ({ i, n: r.n, y: i * rowH + (rowH - bar) / 2, w: Math.max(2, (r.n / max) * room), h: bar, textY: i * rowH + rowH / 2 })),
  };
}
