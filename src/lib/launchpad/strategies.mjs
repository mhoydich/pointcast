/**
 * Bot strategies for the simulator. A strategy only proposes intents; the
 * simulator orders them, runs each through the bot's policy gate, and lets
 * the engine fill or refuse it. Each bot draws from its own random stream.
 *
 *   strategy = { id, label, defaults, init(params) → state, onTick(view, state, params, rng) → Intent[] }
 *   Intent   = { side: 'buy' | 'sell', coin, quoteIn? | baseIn?, maxSlippageBps, priorityFeeBps?, reason }
 *
 * The view is read-only: prices are plain numbers (quote per whole token),
 * amounts are BigInt micro-units.
 */
import { units } from './units.mjs';

const live = (c) => c.status === 'curve' || c.status === 'migrated';
const share = (amount, fraction) => (amount * BigInt(Math.round(fraction * 10_000))) / 10_000n;

export const STRATEGIES = Object.freeze({
  'market-maker': Object.freeze({
    id: 'market-maker',
    label: 'Market maker',
    description: 'Keeps a ±4% band around the 60-tick average on the busiest coin: sells 2% of its holdings above the band, buys 20 cr below it.',
    defaults: Object.freeze({ band: 0.04, emaTicks: 60, sellShare: 0.02, buySize: '20' }),
    init: () => ({ coin: null }),
    onTick(view, state, params) {
      if (!state.coin || !view.coin(state.coin) || !live(view.coin(state.coin))) {
        const busiest = view.coins.filter(live).sort((a, b) => view.trades(b.id, 300) - view.trades(a.id, 300) || a.id.localeCompare(b.id))[0];
        state.coin = busiest ? busiest.id : null;
      }
      if (!state.coin) return [];
      const c = view.coin(state.coin);
      const ema = view.ema(c.id, params.emaTicks);
      const held = view.me.held(c.id);
      if (c.price > ema * (1 + params.band) && held > 0n) return [{ side: 'sell', coin: c.id, baseIn: share(held, params.sellShare) || held, maxSlippageBps: 300, reason: 'above band' }];
      if (c.price < ema * (1 - params.band)) return [{ side: 'buy', coin: c.id, quoteIn: units(params.buySize), maxSlippageBps: 300, reason: 'below band' }];
      return [];
    },
  }),
  momentum: Object.freeze({
    id: 'momentum',
    label: 'Momentum',
    description: 'Buys 30 cr when price is up 8% over 30 ticks with buys outnumbering sells 1.5 to 1; exits on a 12% trailing stop. Its buys sit above the default approval line of 25 cr.',
    defaults: Object.freeze({ lookback: 30, threshold: 0.08, ratio: 1.5, size: '30', trail: 0.12 }),
    init: () => ({ peaks: {} }),
    onTick(view, state, params) {
      const out = [];
      for (const c of view.coins.filter(live)) {
        const held = view.me.held(c.id);
        if (held > 0n) {
          state.peaks[c.id] = Math.max(state.peaks[c.id] ?? c.price, c.price);
          if (c.price < state.peaks[c.id] * (1 - params.trail)) out.push({ side: 'sell', coin: c.id, baseIn: held, maxSlippageBps: 800, reason: 'trailing stop' });
          continue;
        }
        delete state.peaks[c.id];
        if (c.age < params.lookback) continue;
        const change = c.price / view.priceAgo(c.id, params.lookback) - 1;
        const ratio = view.buys(c.id, params.lookback) / Math.max(1, view.sells(c.id, params.lookback));
        if (change > params.threshold && ratio > params.ratio) out.push({ side: 'buy', coin: c.id, quoteIn: units(params.size), maxSlippageBps: 500, reason: `up ${Math.round(change * 100)}%` });
      }
      return out.slice(0, 1);
    },
  }),
  sniper: Object.freeze({
    id: 'sniper',
    label: 'Sniper',
    description: 'Buys 100 cr once per coin, its priority fee inside: as an order during an opening auction, or within 60 ticks after trading opens while any sniper fee is at most 10%. Sells at 2.5× or after 300 ticks.',
    defaults: Object.freeze({ size: '100', priorityFeeBps: 30, maxFeeBps: 1000, window: 60, exitMultiple: 2.5, maxHold: 300 }),
    init: () => ({ tried: {}, since: {} }),
    onTick(view, state, params) {
      const out = [];
      for (const c of view.coins) {
        const held = view.me.held(c.id);
        if (held > 0n) {
          state.since[c.id] ??= view.tick;
          const target = c.price >= view.me.entry(c.id) * params.exitMultiple;
          if (live(c) && (target || view.tick - state.since[c.id] >= params.maxHold)) out.push({ side: 'sell', coin: c.id, baseIn: held, maxSlippageBps: 1500, reason: target ? 'sell at 2.5×' : 'time out' });
          continue;
        }
        if (state.tried[c.id]) continue;
        const early = c.status === 'auction' || (c.status === 'curve' && c.age >= 0 && c.age < params.window);
        if (!early || c.sniperFeeBps > params.maxFeeBps) continue;
        state.tried[c.id] = true;
        out.push({ side: 'buy', coin: c.id, quoteIn: units(params.size), maxSlippageBps: 3000, priorityFeeBps: params.priorityFeeBps, reason: c.status === 'auction' ? 'auction order' : 'first block' });
      }
      return out;
    },
  }),
  'dip-buyer': Object.freeze({
    id: 'dip-buyer',
    label: 'Dip buyer',
    description: 'Buys 20 cr when price sits 20% under its 300-tick high while holders still grow; sells at +30% over its average price.',
    defaults: Object.freeze({ drop: 0.2, lookback: 300, size: '20', takeProfit: 0.3 }),
    init: () => ({}),
    onTick(view, state, params) {
      const out = [];
      for (const c of view.coins.filter(live)) {
        const held = view.me.held(c.id);
        if (held > 0n) {
          if (c.price >= view.me.entry(c.id) * (1 + params.takeProfit)) out.push({ side: 'sell', coin: c.id, baseIn: held, maxSlippageBps: 800, reason: 'sell at +30%' });
          continue;
        }
        if (c.age < 60) continue;
        if (c.price <= view.high(c.id, params.lookback) * (1 - params.drop) && c.holders > view.holdersAgo(c.id, 60)) {
          out.push({ side: 'buy', coin: c.id, quoteIn: units(params.size), maxSlippageBps: 500, reason: 'dip with growing holders' });
        }
      }
      // Sells first: a position that reached its target is never starved by a new buy.
      return out.sort((a, b) => (a.side === b.side ? 0 : a.side === 'sell' ? -1 : 1)).slice(0, 1);
    },
  }),
  holder: Object.freeze({
    id: 'holder',
    label: 'Holder',
    description: 'Buys 20 cr of coins with a risk score under 25 once they are 30 ticks old, holds to graduation, then sells half.',
    defaults: Object.freeze({ maxRisk: 25, minAge: 30, size: '20' }),
    init: () => ({}),
    onTick(view, state, params) {
      const out = [];
      for (const c of view.coins) {
        const held = view.me.held(c.id);
        if (c.status === 'migrated' && held > 0n && view.me.sold(c.id) === 0n) {
          out.push({ side: 'sell', coin: c.id, baseIn: held / 2n, maxSlippageBps: 800, reason: 'half after graduation' });
        } else if (c.status === 'curve' && view.me.bought(c.id) === 0n && c.age >= params.minAge && c.risk < params.maxRisk) {
          out.push({ side: 'buy', coin: c.id, quoteIn: units(params.size), maxSlippageBps: 500, reason: `risk ${c.risk}` });
        }
      }
      return out;
    },
  }),
});

/** Copy-trader actor: mirrors a leader wallet's buys at a fixed size, and its sells in the same proportion, after a delay. */
export function copyIntents(view, leaderTrades, params) {
  return leaderTrades.map((t) => (t.side === 'buy'
    ? { side: 'buy', coin: t.coin, quoteIn: units(params.size), maxSlippageBps: 1500, reason: `copy ${t.wallet}` }
    : { side: 'sell', coin: t.coin, baseIn: t.fraction >= 1 ? view.me.held(t.coin) : share(view.me.held(t.coin), t.fraction), maxSlippageBps: 1500, reason: `copy ${t.wallet}` }))
    .filter((i) => i.side === 'buy' || i.baseIn > 0n);
}
