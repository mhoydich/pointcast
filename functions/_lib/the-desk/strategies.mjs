// The Desk — the three house strategies. Each is an agent with a thesis
// (src/data/the-desk.json) that reads a read-only market view and returns
// proposals. None of them can place, size past, or route around the gate:
// they only ever return { venue, instrument, action, qty, limitPrice, reasoning }.
//
// The view: { kalshi: { listOpen }, quote(venue, instrument), alpaca: { dailyCloses }, symbols }
import { MAX_QUOTE_AGE_MS } from './venues.mjs';
import { cents, qty6 } from './util.mjs';

const HOUR = 3_600_000;
/** Target spend per idea, under the 2% cap and the approval threshold. */
export const TARGET_USD = 10;

const held = (positions, instrument) => positions.some((p) => p.instrument === instrument);
const pct = (p) => `${Math.round(p * 100)}¢`;

export const fade = {
  id: 'fade',
  async run(view, { positions, now }) {
    const markets = await view.kalshi.listOpen({ minCloseMs: now + HOUR, maxCloseMs: now + 72 * HOUR });
    return markets
      .filter((m) => m.yesAsk > 0 && m.yesAsk <= 0.08 && m.noAsk >= 0.9 && m.noAsk <= 0.97)
      .filter((m) => !held(positions, `${m.ticker}:no`))
      .sort((a, b) => a.closeTime - b.closeTime)
      .slice(0, 2)
      .map((m) => ({
        venue: 'kalshi',
        instrument: `${m.ticker}:no`,
        action: 'buy',
        qty: Math.floor(TARGET_USD / m.noAsk),
        limitPrice: m.noAsk,
        reasoning:
          `"${m.title}" closes ${new Date(m.closeTime).toISOString()}. YES is offered at ${pct(m.yesAsk)}; ` +
          `longshots this cheap resolve YES less often than their price implies, so buy NO at ${pct(m.noAsk)} and hold to resolution.`,
      }))
      .filter((p) => p.qty >= 1);
  },
};

export const closer = {
  id: 'closer',
  async run(view, { positions, now }) {
    const markets = await view.kalshi.listOpen({ minCloseMs: now + HOUR / 4, maxCloseMs: now + 12 * HOUR });
    return markets
      .filter((m) => m.yesAsk >= 0.92 && m.yesAsk <= 0.97)
      .filter((m) => !held(positions, `${m.ticker}:yes`))
      .sort((a, b) => b.yesAsk - a.yesAsk)
      .slice(0, 2)
      .map((m) => ({
        venue: 'kalshi',
        instrument: `${m.ticker}:yes`,
        action: 'buy',
        qty: Math.floor(TARGET_USD / m.yesAsk),
        limitPrice: m.yesAsk,
        reasoning:
          `"${m.title}" closes within 12 hours with YES at ${pct(m.yesAsk)}. ` +
          `Late favorites tend to be slightly underpriced; buy YES and hold to resolution.`,
      }))
      .filter((p) => p.qty >= 1);
  },
};

export function sma(values, n) {
  if (values.length < n) return null;
  const tail = values.slice(-n);
  return tail.reduce((s, v) => s + v, 0) / n;
}

export const drift = {
  id: 'drift',
  async run(view, { positions, now }) {
    const out = [];
    for (const symbol of view.symbols) {
      const closes = await view.alpaca.dailyCloses(symbol, 30, now);
      const avg = sma(closes, 20);
      if (avg == null) continue;
      const last = closes[closes.length - 1];
      const quote = await view.quote('alpaca', symbol);
      if (!quote || now - quote.at > MAX_QUOTE_AGE_MS) continue; // market closed: don't spam unfillable orders
      const pos = positions.find((p) => p.instrument === symbol);
      if (!pos && last > avg && quote.ask) {
        out.push({
          venue: 'alpaca', instrument: symbol, action: 'buy',
          qty: qty6(TARGET_USD / quote.ask), limitPrice: cents(quote.ask * 1.002),
          reasoning: `${symbol} closed at ${last.toFixed(2)}, above its 20-day average of ${avg.toFixed(2)}. Trend is up: buy about $${TARGET_USD}.`,
        });
      } else if (pos && last < avg && quote.bid) {
        out.push({
          venue: 'alpaca', instrument: symbol, action: 'sell',
          qty: pos.qty, limitPrice: cents(quote.bid * 0.998),
          reasoning: `${symbol} closed at ${last.toFixed(2)}, below its 20-day average of ${avg.toFixed(2)}. Trend broke: sell the whole position.`,
        });
      }
    }
    return out;
  },
};

export const STRATEGIES = [fade, closer, drift];
