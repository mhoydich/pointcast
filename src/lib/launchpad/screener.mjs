/**
 * Screener math over the engine's event log: per-coin trade index, price
 * series, candles, window metrics, concentration risk and trending.
 *
 * Wallets are grouped into clusters by who funded them (fundedBy); the curve
 * and the pool are not holders, so they never count toward concentration.
 */
import { WINDOWS } from './config.mjs';
import { coinPrice, coinMarketCap, presetOf } from './engine.mjs';
import { progress } from './curve.mjs';

export function createIndex() {
  return { lastSeq: 0, trades: new Map(), prices: new Map(), holderCounts: new Map() };
}

const TRADE_TYPES = new Set(['TRADE', 'AUCTION_FILL', 'POST_COMPLETE_BUY']);

/** Read new events into the index, then extend every coin's per-tick price and holder series to the current tick. */
export function ingest(index, world) {
  for (let i = index.lastSeq; i < world.events.length; i++) {
    const e = world.events[i];
    if (e.type === 'CREATE') {
      index.trades.set(e.coin, []);
      index.prices.set(e.coin, []);
      index.holderCounts.set(e.coin, []);
    } else if (TRADE_TYPES.has(e.type)) {
      const side = e.type === 'TRADE' ? e.side : 'buy';
      index.trades.get(e.coin).push({ tick: e.tick, seq: e.seq, kind: e.type, side, wallet: e.wallet, quote: e.quote, base: e.base, heldAfter: e.heldAfter ?? 0n, orderTick: e.orderTick ?? e.tick, price: e.priceAfter ?? null, reason: e.reason ?? '' });
    }
  }
  index.lastSeq = world.events.length;
  for (const coin of world.coins.values()) {
    const prices = index.prices.get(coin.id);
    const holders = index.holderCounts.get(coin.id);
    const offset = world.tick - coin.createdTick;
    while (prices.length <= offset) prices.push(coinPrice(coin));
    prices[offset] = coinPrice(coin);
    while (holders.length <= offset) holders.push(coin.holders.size);
    holders[offset] = coin.holders.size;
  }
}

/** Price `n` ticks ago (clamped to the coin's first tick). */
export function priceAgo(index, world, coin, n) {
  const prices = index.prices.get(coin.id);
  const at = Math.max(0, world.tick - coin.createdTick - n);
  return prices[Math.min(at, prices.length - 1)];
}

export function highOver(index, world, coin, n) {
  const prices = index.prices.get(coin.id);
  const end = prices.length;
  let high = 0;
  for (let i = Math.max(0, end - 1 - n); i < end; i++) high = Math.max(high, prices[i]);
  return high;
}

export function emaOver(index, coin, n) {
  const prices = index.prices.get(coin.id);
  const a = 2 / (n + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) ema = a * prices[i] + (1 - a) * ema;
  return ema;
}

export function holdersAgo(index, world, coin, n) {
  const counts = index.holderCounts.get(coin.id);
  const at = Math.max(0, world.tick - coin.createdTick - n);
  return counts[Math.min(at, counts.length - 1)];
}

/** Index of the first trade at or after `tick` (trades are appended in tick order). */
function firstAt(trades, tick) {
  let lo = 0, hi = trades.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (trades[mid].tick < tick) lo = mid + 1; else hi = mid; }
  return lo;
}

/** Trades in the last `n` ticks: the same span priceAgo(n) measures. */
export function tradesIn(index, world, coin, n) {
  const trades = index.trades.get(coin.id);
  return trades.slice(firstAt(trades, world.tick - n));
}

/**
 * OHLC candles of `size` ticks from the trades themselves: each candle opens
 * at the previous close (the first at the launch price, before any trade) and
 * takes its high, low and close from the prices after each trade inside it.
 * Quote volume is summed in whole credits.
 */
export function candles(index, world, coin, size = 60, limit = Infinity) {
  const trades = index.trades.get(coin.id);
  const prices = index.prices.get(coin.id);
  // Finished ticks, plus the current one once it has trades: an opening auction clears as the tick advances, so its fills carry the new tick.
  const span = Math.max(1, world.tick - coin.createdTick + (trades.at(-1)?.tick >= world.tick ? 1 : 0));
  const count = Math.ceil(span / size);
  // With a limit, start at the first kept candle: it opens on the close of the tick before it.
  const skip = Math.max(0, count - limit);
  const start = coin.createdTick + skip * size;
  const p = presetOf(world, coin);
  let close = skip ? prices[Math.min(start - coin.createdTick - 1, prices.length - 1)] : Number(p.Q0) / Number(p.B0);
  let i = skip ? firstAt(trades, start) : 0;
  const out = [];
  for (let from = start; from < coin.createdTick + span; from += size) {
    const to = from + size;
    const open = close;
    let h = open, l = open, v = 0;
    while (i < trades.length && trades[i].tick < to) {
      const t = trades[i++];
      v += Number(t.quote) / 1e6;
      if (t.price == null) continue;
      h = Math.max(h, t.price); l = Math.min(l, t.price); close = t.price;
    }
    out.push({ t: from, o: open, h, l, c: close, v });
  }
  return out;
}

export const clusterOf = (world, walletId) => world.wallets.get(walletId)?.fundedBy ?? walletId;

/* ---------- risk ---------- */

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Whether a sorted list of ticks has one within `span` of `tick` (binary search). */
function nearWithin(sorted, tick, span) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < tick - span) lo = mid + 1; else hi = mid; }
  return lo < sorted.length && sorted[lo] <= tick + span;
}

/**
 * Concentration and rug heuristics (plan §4.8). Denominators are total
 * supply unless named. The creator's set is the creator wallet plus every
 * wallet it funded; clusters group wallets by who funded them. One paint
 * asks for the same coin's risk from the screener, the coin drawer and the
 * creator view, so the result is kept until the tick, the coin's trades or
 * the wallets change.
 */
const riskMemo = new WeakMap();
export function risk(index, world, coin) {
  let byCoin = riskMemo.get(index);
  if (!byCoin) riskMemo.set(index, (byCoin = new Map()));
  const key = `${world.tick}|${index.trades.get(coin.id)?.length}|${world.wallets.size}`;
  const hit = byCoin.get(coin.id);
  if (hit && hit.key === key) return hit.value;
  const value = computeRisk(index, world, coin);
  byCoin.set(coin.id, { key, value });
  return value;
}

function computeRisk(index, world, coin) {
  const cfg = world.config.risk;
  const supply = Number(presetOf(world, coin).supply);
  const trades = index.trades.get(coin.id);
  const creatorSet = new Set([...world.wallets.values()].filter((w) => w.id === coin.creator || w.fundedBy === coin.creator).map((w) => w.id));
  // Holdings by cluster; the creator's set is one cluster.
  const clusters = new Map();
  for (const [id, b] of coin.holders) {
    const c = creatorSet.has(id) ? coin.creator : clusterOf(world, id);
    clusters.set(c, (clusters.get(c) ?? 0) + Number(b));
  }
  // dev%: the creator wallet only (its funded wallets count in bundle%).
  const dev = Number(coin.holders.get(coin.creator) ?? 0n) / supply;
  // bundle%: curve buys in the creation tick by wallets the creator funded. Auction fills never count.
  const bundle = trades.filter((t) => t.kind === 'TRADE' && t.side === 'buy' && t.wallet !== coin.creator && creatorSet.has(t.wallet) && t.tick === coin.createdTick)
    .reduce((s, t) => s + Number(t.base), 0) / supply;
  // sniper%: continuous-trading buys by wallets outside the creator's set in the first ticks after trading opens.
  const sniper = trades.filter((t) => t.kind === 'TRADE' && t.side === 'buy' && !creatorSet.has(t.wallet) && t.tick >= coin.openTick && t.tick < coin.openTick + cfg.sniperTicks)
    .reduce((s, t) => s + Number(t.base), 0) / supply;
  const sizes = [...clusters.values()].sort((a, b) => b - a);
  const circ = sizes.reduce((s, b) => s + b, 0) || 1;
  const top10 = sizes.slice(0, 10).reduce((s, b) => s + b, 0) / supply;
  const hhi = sizes.reduce((s, b) => s + (b / circ) ** 2, 0);
  // devSold%: tokens the creator wallet sold over its peak holdings.
  const devPos = world.wallets.get(coin.creator).positions.get(coin.id);
  const devSold = devPos && devPos.maxBase ? Number(devPos.sold) / Number(devPos.maxBase) : 0;
  // DEV_DUMP looks only inside its window, so a later buyback cannot erase a dump that happened.
  const windowEnd = coin.createdTick + cfg.devDump.ticks;
  let devPeak = 0, devSoldEarly = 0;
  for (const t of trades) {
    if (t.wallet !== coin.creator || t.tick >= windowEnd) continue;
    if (t.side === 'buy') devPeak = Math.max(devPeak, Number(t.heldAfter));
    else devSoldEarly += Number(t.base);
  }
  // Wash: volume from a cluster that traded the other way within the wash window.
  let washVol = 0, vol = 0;
  const byCluster = new Map();
  for (const t of trades) {
    const c = clusterOf(world, t.wallet);
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c).push(t);
  }
  for (const list of byCluster.values()) {
    const ticks = { buy: list.filter((t) => t.side === 'buy').map((t) => t.tick), sell: list.filter((t) => t.side === 'sell').map((t) => t.tick) };
    for (const t of list) {
      const q = Number(t.quote);
      vol += q;
      if (nearWithin(ticks[t.side === 'buy' ? 'sell' : 'buy'], t.tick, cfg.washTicks)) washVol += q;
    }
  }
  const washShare = vol ? washVol / vol : 0;
  const w = cfg.weights, sc = cfg.scales;
  const score = Math.round(w.dev * clamp01(dev / sc.dev) + w.bundle * clamp01(bundle / sc.bundle) + w.sniper * clamp01(sniper / sc.sniper)
    + w.top10 * clamp01((top10 - sc.top10Floor) / sc.top10Span) + w.devSold * clamp01(devSold));
  const flags = [];
  if (devPeak && devSoldEarly > cfg.devDump.share * devPeak) flags.push('DEV_DUMP');
  if (bundle > cfg.bundled) flags.push('BUNDLED');
  if (sizes.some((b) => b / supply > cfg.whale)) flags.push('WHALE');
  if (washShare > cfg.wash) flags.push('WASH');
  // Hard flags raise the badge: a flagged coin never reads as low risk.
  const fromScore = score > cfg.badges.high ? 'high' : score >= cfg.badges.caution ? 'caution' : 'low';
  const badge = flags.includes('DEV_DUMP') || flags.length >= 2 ? 'high' : flags.length && fromScore === 'low' ? 'caution' : fromScore;
  return { score, badge, flags, parts: { dev, bundle, sniper, top10, hhi, devSold, washShare } };
}

/* ---------- window metrics ---------- */

export function metrics(index, world, coin, windowTicks = WINDOWS['5m']) {
  const p = presetOf(world, coin);
  const recent = tradesIn(index, world, coin, windowTicks);
  const buys = recent.filter((t) => t.side === 'buy');
  const price = coinPrice(coin);
  const before = priceAgo(index, world, coin, windowTicks);
  const prog = progress(coin.curve, p);
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    nounId: coin.nounId,
    status: coin.status,
    age: world.tick - coin.createdTick,
    price,
    mcap: coinMarketCap(world, coin),
    liquidity: coin.pool ? coin.pool.quote * 2n : coin.curve.realQuote,
    volume: recent.reduce((s, t) => s + t.quote, 0n),
    buys: buys.length,
    sells: recent.length - buys.length,
    makers: new Set(recent.map((t) => t.wallet)).size,
    holders: coin.holders.size,
    change: before ? price / before - 1 : 0,
    progress: coin.status === 'migrated' ? { tokensBps: 10_000, creditsBps: 10_000 } : prog,
    risk: risk(index, world, coin),
  };
}

/* ---------- screener tabs, holders ---------- */

export const TABS = Object.freeze(['trending', 'new', 'graduating', 'graduated', 'movers', 'holders', 'bots', 'watchlist']);
const BOT_ROLES = new Set(['bot', 'sniper']);

/**
 * Screener rows for one tab (plan §3): Trending (live coins by score), New,
 * About to graduate (credits progress at least 70%), Graduated, Movers
 * (largest price change in the window), Most holders, Bot favorites (bots
 * over half the window's volume) and the viewer's watchlist (`ids`).
 */
export function screen(index, world, { tab = 'trending', windowTicks = WINDOWS['5m'], ids = [] } = {}) {
  if (!TABS.includes(tab)) throw new Error(`unknown screener tab: ${tab}`);
  const rows = [...world.coins.values()].map((coin) => {
    const m = metrics(index, world, coin, windowTicks);
    const recent = tradesIn(index, world, coin, windowTicks);
    const vol = recent.reduce((s, t) => s + t.quote, 0n);
    const botVol = recent.filter((t) => BOT_ROLES.has(world.wallets.get(t.wallet)?.role)).reduce((s, t) => s + t.quote, 0n);
    return { ...m, createdTick: coin.createdTick, openTick: coin.openTick, completeTick: coin.completeTick, viewerMade: Boolean(coin.viewerMade), creator: coin.creator, botShare: vol ? Number((botVol * 10_000n) / vol) / 10_000 : 0 };
  });
  const byId = (a, b) => a.id.localeCompare(b.id);
  if (tab === 'trending') {
    const ranked = trending(index, world, windowTicks);
    const row = new Map(rows.map((r) => [r.id, r]));
    return ranked.map((t) => ({ ...row.get(t.id), trend: t }));
  }
  if (tab === 'new') return rows.sort((a, b) => b.createdTick - a.createdTick || byId(a, b));
  if (tab === 'graduating') return rows.filter((r) => r.status === 'curve' && r.progress.creditsBps >= 7000).sort((a, b) => b.progress.creditsBps - a.progress.creditsBps || byId(a, b));
  if (tab === 'graduated') return rows.filter((r) => r.status === 'migrated').sort((a, b) => b.completeTick - a.completeTick || byId(a, b));
  if (tab === 'movers') return rows.filter((r) => r.status !== 'auction').sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || byId(a, b));
  if (tab === 'holders') return rows.sort((a, b) => b.holders - a.holders || byId(a, b));
  if (tab === 'bots') return rows.filter((r) => r.botShare > 0.5).sort((a, b) => b.botShare - a.botShare || byId(a, b));
  const keep = new Set(ids);
  return rows.filter((r) => keep.has(r.id)).sort((a, b) => b.createdTick - a.createdTick || byId(a, b));
}

/** The largest holders of a coin with their cluster (who funded them), share of supply and role. */
export function holdersTable(world, coin, limit = 20) {
  const supply = Number(presetOf(world, coin).supply);
  return [...coin.holders.entries()]
    .map(([id, base]) => {
      const w = world.wallets.get(id);
      return { wallet: id, role: w?.role ?? 'human', cluster: clusterOf(world, id), creator: id === coin.creator, base, share: Number(base) / supply };
    })
    .sort((a, b) => (b.base > a.base ? 1 : b.base < a.base ? -1 : a.wallet.localeCompare(b.wallet)))
    .slice(0, limit);
}

/* ---------- trending ---------- */

function zscores(values) {
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  return values.map((v) => (sd > 0 ? (v - mean) / sd : 0));
}

/** Live coins are ranked; graduated (pool) coins are listed under Graduated instead. */
export const isLive = (coin) => coin.status === 'auction' || coin.status === 'curve';

/**
 * Score trending rows (plan §4.6). Each row is { id, symbol, inputs, parts,
 * age, boosts }: z-scored inputs across the rows, weighted, made positive
 * with a softplus, then scaled by boost, trust (concentration), warm-up and
 * age decay. z is 0 with fewer than 2 rows. Pure, so a page can explain any
 * rank from the returned factors.
 */
export function scoreTrending(rows, t) {
  if (!rows.length) return [];
  const keys = Object.keys(t.weights);
  const z = Object.fromEntries(keys.map((k) => [k, rows.length < 2 ? rows.map(() => 0) : zscores(rows.map((row) => row.inputs[k]))]));
  return rows.map((row, i) => {
    const base = keys.reduce((s, k) => s + t.weights[k] * z[k][i], 0);
    const p = row.parts;
    const trust = Math.max(0.1, 1 - 0.3 * (p.dev > 0.1) - 0.3 * (p.bundle > 0.2) - 0.5 * (p.top10 > 0.6));
    const boost = Math.min(1 + 0.15 * Math.log2(1 + (row.boosts ?? 0)), 2);
    const warm = Math.max(0, Math.min(1, row.age / t.warmupTicks));
    const decay = 0.5 ** (Math.max(0, row.age) / t.halfLifeTicks);
    // Softplus turns the z-scored base into a positive strength, so trust, warm-up and decay can only lower a score and a boost can only raise it.
    const strength = Math.log1p(Math.exp(base));
    return { id: row.id, symbol: row.symbol, score: boost * trust * strength * warm * decay, base, strength, boost, trust, warm, decay, age: row.age, inputs: row.inputs };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/**
 * Trending over a window, across live coins. Age counts from when trading
 * opened. Stage A has no boost purchases, so `boosts` is empty unless a
 * caller passes counts by coin id.
 */
export function trending(index, world, windowTicks = WINDOWS['5m'], { boosts = {} } = {}) {
  const rows = [...world.coins.values()].filter(isLive).map((coin) => {
    const recent = tradesIn(index, world, coin, windowTicks);
    const r = risk(index, world, coin);
    const volByCluster = new Map();
    for (const tr of recent) {
      const c = clusterOf(world, tr.wallet);
      volByCluster.set(c, (volByCluster.get(c) ?? 0) + Number(tr.quote) / 1e6);
    }
    const breadth = [...volByCluster.values()].reduce((s, v) => s + Math.sqrt(v), 0);
    const organic = volByCluster.size * (1 - r.parts.washShare);
    const price = coinPrice(coin);
    const before = priceAgo(index, world, coin, windowTicks);
    const change = Math.max(-0.5, Math.min(2, before ? price / before - 1 : 0));
    const h0 = holdersAgo(index, world, coin, windowTicks);
    const holdersGrowth = (coin.holders.size - h0) / Math.max(h0, 10);
    const liquidity = Number(coin.pool ? coin.pool.quote * 2n : coin.curve.realQuote) / 1e6;
    return {
      id: coin.id, symbol: coin.symbol, parts: r.parts, age: world.tick - coin.openTick, boosts: boosts[coin.id] ?? 0,
      inputs: { breadth: Math.log1p(breadth), organic: Math.log1p(organic), txns: recent.length, change, holders: holdersGrowth, liquidity: Math.log1p(liquidity), reactions: 0 },
    };
  });
  return scoreTrending(rows, world.config.trending);
}

/** The highest-scoring coin still on its curve with at least half the raise in. */
export function kingOfTheHill(index, world, ranked = trending(index, world)) {
  for (const row of ranked) {
    const coin = world.coins.get(row.id);
    if (coin.status === 'curve' && progress(coin.curve, presetOf(world, coin)).creditsBps >= 5000) return row;
  }
  return null;
}
