// The Desk — venue market data and paper fills.
//
// Every venue exposes the same adapter interface to the Risk Gate, and only
// the gate holds adapters:
//   quote(instrument) → Quote | null
//   place(order)      → { filledQty, avgPrice, fees }   (paper: IOC against the live book)
//   cancel(orderId)   → { ok }                          (paper orders never rest; always ok)
//   positions/balance live in the desk's own ledger (store.mjs) while in paper mode.
//
// Quote: { instrument, title, category, closeTime, status: 'open'|'closed'|'settled',
//          result: 'yes'|'no'|null, bid, ask, bids: [[price, qty]] best first, asks: [[price, qty]] best first, at }
//
// Live adapters are deliberately not built yet (VENUES.md, paper first). A
// venue in live mode has no adapter, so the gate refuses with `live-not-built`.
import { cents } from './util.mjs';

export const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
export const ALPACA_DATA_BASE = 'https://data.alpaca.markets/v2';

async function getJson(fetchImpl, url, headers = {}, timeoutMs = 8000) {
  const res = await fetchImpl(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return res.json();
}

// ─── Kalshi ────────────────────────────────────────────────────────────────

/** Kalshi instruments are `TICKER:yes` or `TICKER:no`. */
export function parseKalshiInstrument(instrument) {
  const m = /^([A-Z0-9][A-Z0-9._-]{1,99}):(yes|no)$/.exec(String(instrument || ''));
  return m ? { ticker: m[1], side: m[2] } : null;
}

/** A price field in dollars, from either the `_dollars` string or the cents integer. */
function kPrice(obj, field) {
  const d = obj?.[`${field}_dollars`];
  if (d != null && d !== '' && Number.isFinite(Number(d))) return Number(d);
  const c = obj?.[field];
  return Number.isFinite(c) ? c / 100 : null;
}

function kLevels(book, side) {
  const dollars = book?.[`${side}_dollars`];
  if (Array.isArray(dollars)) return dollars.map(([p, q]) => [Number(p), Number(q)]).filter(([p, q]) => p > 0 && q > 0);
  const centsArr = book?.[side];
  if (Array.isArray(centsArr)) return centsArr.map(([p, q]) => [p / 100, Number(q)]).filter(([p, q]) => p > 0 && q > 0);
  return [];
}

const SETTLED = new Set(['settled', 'finalized', 'determined']);
const OPEN = new Set(['open', 'active']);

export function parseKalshiMarket(m) {
  const result = m.result === 'yes' || m.result === 'no' ? m.result : null;
  return {
    ticker: m.ticker,
    title: [m.title, m.yes_sub_title || m.subtitle].filter(Boolean).join(' — '),
    category: m.category || m.event_ticker || '',
    eventTicker: m.event_ticker || '',
    closeTime: m.close_time ? Date.parse(m.close_time) : null,
    status: SETTLED.has(m.status) || result ? 'settled' : OPEN.has(m.status) ? 'open' : 'closed',
    result,
    yesBid: kPrice(m, 'yes_bid'), yesAsk: kPrice(m, 'yes_ask'),
    noBid: kPrice(m, 'no_bid'), noAsk: kPrice(m, 'no_ask'),
  };
}

/**
 * Kalshi books list bids only. Asks for one side are the other side's bids:
 * a NO bid at p is a YES offer at 1 − p.
 */
export function kalshiSideBook(orderbook, side) {
  const own = kLevels(orderbook, side);
  const other = kLevels(orderbook, side === 'yes' ? 'no' : 'yes');
  const bids = [...own].sort((a, b) => b[0] - a[0]);
  const asks = other.map(([p, q]) => [cents(1 - p), q]).sort((a, b) => a[0] - b[0]);
  return { bids, asks };
}

/** Kalshi taker fee: 0.07 × C × P × (1 − P), rounded up to the cent. */
export function kalshiFee(contracts, price) {
  return Math.ceil(0.07 * contracts * price * (1 - price) * 100 - 1e-9) / 100;
}

export function kalshiData(fetchImpl = fetch, base = KALSHI_BASE) {
  return {
    async listOpen({ minCloseMs, maxCloseMs, limit = 500 }) {
      const q = new URLSearchParams({ status: 'open', limit: String(limit) });
      if (minCloseMs) q.set('min_close_ts', String(Math.floor(minCloseMs / 1000)));
      if (maxCloseMs) q.set('max_close_ts', String(Math.floor(maxCloseMs / 1000)));
      const body = await getJson(fetchImpl, `${base}/markets?${q}`);
      return (body.markets || []).map(parseKalshiMarket);
    },
    async quote(instrument, now = Date.now()) {
      const inst = parseKalshiInstrument(instrument);
      if (!inst) return null;
      const t = encodeURIComponent(inst.ticker);
      const [mBody, bBody] = await Promise.all([
        getJson(fetchImpl, `${base}/markets/${t}`),
        getJson(fetchImpl, `${base}/markets/${t}/orderbook`),
      ]);
      const m = parseKalshiMarket(mBody.market || mBody);
      const { bids, asks } = kalshiSideBook(bBody.orderbook || bBody, inst.side);
      return {
        instrument, title: m.title, category: m.category, closeTime: m.closeTime, status: m.status, result: m.result,
        bid: bids[0]?.[0] ?? null, ask: asks[0]?.[0] ?? null, bids, asks, at: now,
      };
    },
  };
}

// ─── Alpaca (market data only; paper fills are simulated here) ─────────────

export function parseAlpacaInstrument(instrument) {
  return /^[A-Z]{1,5}$/.test(String(instrument || '')) ? { symbol: instrument } : null;
}

export function parseAlpacaQuote(symbol, body, now) {
  const q = body?.quote || {};
  const ask = Number(q.ap) > 0 ? Number(q.ap) : null;
  const bid = Number(q.bp) > 0 ? Number(q.bp) : null;
  const at = q.t ? Date.parse(q.t) : null;
  // Thin IEX sizes say little about depth for a $20 order: treat the top as deep enough.
  return {
    instrument: symbol, title: symbol, category: 'equity', closeTime: null, status: 'open', result: null,
    bid, ask, bids: bid ? [[bid, Infinity]] : [], asks: ask ? [[ask, Infinity]] : [], at: at ?? now,
  };
}

export function alpacaData({ keyId, secret, fetchImpl = fetch, base = ALPACA_DATA_BASE }) {
  const headers = keyId && secret ? { 'APCA-API-KEY-ID': keyId, 'APCA-API-SECRET-KEY': secret } : null;
  return {
    configured: Boolean(headers),
    async quote(instrument, now = Date.now()) {
      if (!headers || !parseAlpacaInstrument(instrument)) return null;
      const body = await getJson(fetchImpl, `${base}/stocks/${instrument}/quotes/latest?feed=iex`, headers);
      return parseAlpacaQuote(instrument, body, now);
    },
    async dailyCloses(symbol, days = 30, now = Date.now()) {
      if (!headers) return [];
      const start = new Date(now - (days * 2 + 10) * 86400000).toISOString();
      const q = new URLSearchParams({ timeframe: '1Day', start, limit: String(days * 2), feed: 'iex', adjustment: 'all' });
      const body = await getJson(fetchImpl, `${base}/stocks/${symbol}/bars?${q}`, headers);
      return (body.bars || []).map((b) => Number(b.c)).filter((c) => c > 0).slice(-days);
    },
  };
}

// ─── Paper fills ───────────────────────────────────────────────────────────

/**
 * Immediate-or-cancel fill against real book levels: buys walk the asks up to
 * the limit, sells walk the bids down to it. Never fills at the midpoint.
 */
export function fillAgainstBook({ action, qty, limitPrice, quote, wholeUnits }) {
  const levels = action === 'buy' ? quote.asks : quote.bids;
  const ok = action === 'buy' ? (p) => p <= limitPrice + 1e-9 : (p) => p >= limitPrice - 1e-9;
  let left = qty;
  let filled = 0;
  let cost = 0;
  for (const [p, q] of levels || []) {
    if (left <= 1e-9 || !ok(p)) break;
    let take = Math.min(left, q);
    if (wholeUnits) take = Math.floor(take);
    if (take <= 0) break;
    filled += take;
    cost += take * p;
    left -= take;
  }
  return { filledQty: filled, avgPrice: filled > 0 ? cost / filled : null };
}

/** Quotes older than this do not fill (stale after-hours equities, a dead feed). */
export const MAX_QUOTE_AGE_MS = 15 * 60 * 1000;

/**
 * Paper adapter for a venue: live quotes from `data`, simulated fills.
 * `kind` decides whole contracts vs fractional shares; `fee(qty, price)` is
 * the venue's taker fee (Kalshi's formula; $0 commission on Alpaca).
 */
export function paperAdapter({ venue, kind, data, fee = () => 0 }) {
  return {
    venue,
    mode: 'paper',
    quote: (instrument, now) => data.quote(instrument, now),
    async place(order, quote, now) {
      if (!quote || quote.status !== 'open') return { filledQty: 0, avgPrice: null, fees: 0, note: 'market-not-open' };
      if (now - quote.at > MAX_QUOTE_AGE_MS) return { filledQty: 0, avgPrice: null, fees: 0, note: 'stale-quote' };
      const { filledQty, avgPrice } = fillAgainstBook({ ...order, quote, wholeUnits: kind === 'event' });
      const fees = filledQty > 0 ? fee(filledQty, avgPrice) : 0;
      return { filledQty, avgPrice, fees, note: filledQty > 0 ? null : 'no-liquidity-at-limit' };
    },
    async cancel() {
      return { ok: true };
    },
  };
}
