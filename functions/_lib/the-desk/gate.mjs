// The Desk — the Risk Gate.
//
// Strategies and external agents get `propose()` and a read-only market view.
// Only this module holds the venue adapters, so every order passes the same
// checks, in this order, before anything is sealed or placed:
//
//   killed → daily-loss halt → agent → venue → instrument/qty/price → reasoning
//   → live quote → excluded market → market open → no shorting
//   → 2% position limit → venue bankroll cap → cash → daily loss (fresh)
//   → human approval above $X (buys) → seal (fail closed) → place
//
// Limits come from the frozen config (config.mjs). Nothing here writes config.
import { maxPositionUsd } from './config.mjs';
import { commit } from './seal.mjs';
import { cents, deskDay, iso, nextSettlementMs, qty6, randomHex } from './util.mjs';

export const REFUSALS = Object.freeze([
  'killed', 'daily-loss-halt', 'unknown-agent', 'agent-venue', 'venue-disabled', 'live-not-built', 'venue-unavailable',
  'bad-instrument', 'bad-action', 'bad-qty', 'bad-price', 'no-reasoning', 'no-quote', 'excluded-market', 'market-not-open',
  'no-shorting', 'position-limit', 'venue-cap', 'insufficient-cash', 'seal-failed', 'approval-expired', 'not-awaiting-approval', 'busy',
]);

const LOCK_TTL_MS = 60_000;

/**
 * @param {object} o
 * @param {object} o.config        frozen config from loadConfig()
 * @param {string} o.configHash
 * @param {ReturnType<import('./store.mjs').deskStore>} o.store
 * @param {Record<string, object>} o.adapters  venue → paper adapter (only the gate sees these)
 * @param {{name: string, witness: Function}} o.sealer
 * @param {Record<string, {parse: Function}>} o.instruments venue → instrument parser
 * @param {(msg: object) => Promise<void>} [o.notify]  approval/halt/kill pushes
 * @param {() => number} [o.now]
 * @param {number} [o.lockRetries]
 */
export function createDesk({ config, configHash, store, adapters, sealer, instruments, notify = async () => {}, now = Date.now, lockRetries = 10, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const L = config.limits;
  const agentsById = new Map(config.agents.map((a) => [a.id, a]));
  const today = () => deskDay(now(), config.timezone);
  const newId = () => `o_${now().toString(36)}_${randomHex(4)}`;

  async function safeNotify(msg) {
    try {
      await notify(msg);
    } catch (err) {
      console.log(JSON.stringify({ at: 'the-desk.notify', ok: false, error: String(err?.message || err) }));
    }
  }

  async function withLock(fn) {
    const owner = randomHex(8);
    for (let i = 0; i < lockRetries; i++) {
      if (await store.acquireLock(owner, now(), LOCK_TTL_MS)) {
        try {
          return await fn();
        } finally {
          await store.releaseLock(owner);
        }
      }
      if (i < lockRetries - 1) await sleep(300);
    }
    return null;
  }

  // ─── equity & daily loss ───

  async function equity() {
    const [positions, marks] = await Promise.all([store.positions(), store.marks()]);
    const markOf = new Map(marks.map((m) => [`${m.venue}|${m.instrument}`, m.price]));
    const byVenue = {};
    for (const [venue, v] of Object.entries(config.venues)) byVenue[venue] = { cash: await store.cash(venue, v.bankrollUsd), value: 0, cost: 0 };
    for (const p of positions) {
      const v = (byVenue[p.venue] ||= { cash: 0, value: 0, cost: 0 });
      const mark = markOf.get(`${p.venue}|${p.instrument}`);
      v.value += p.qty * (mark ?? p.cost / p.qty);
      v.cost += p.cost;
    }
    let total = 0;
    for (const v of Object.values(byVenue)) {
      v.equity = cents(v.cash + v.value);
      total += v.equity;
    }
    return { total: cents(total), byVenue, positions, markOf };
  }

  /** Records today's equity; trips the halt (and rings the bell) at the daily-loss limit. Returns true when halted. */
  async function checkDailyLoss() {
    const day = today();
    const st = await store.state();
    const { total } = await equity();
    const row = await store.day(day);
    const start = row ? row.start_equity : total;
    const pnl = cents(total - start);
    const tripped = pnl <= -L.dailyLossLimitUsd;
    await store.putDay(day, start, total, total, tripped || st.halted_day === day);
    if (tripped && st.halted_day !== day) {
      await store.setHalted(day, now());
      await store.event(now(), 'halt', { detail: `Daily loss ${pnl.toFixed(2)} hit the ${L.dailyLossLimitUsd} limit. Trading halted for ${day}.` });
      await safeNotify({ kind: 'halt', day, pnl });
    }
    return tripped || st.halted_day === day;
  }

  // ─── judging ───

  function normalize(p) {
    return {
      agent: String(p.agent || ''),
      venue: String(p.venue || ''),
      instrument: String(p.instrument || ''),
      action: p.action,
      qty: Number(p.qty),
      limit_price: Number(p.limitPrice ?? p.limit_price),
      reasoning: typeof p.reasoning === 'string' ? p.reasoning.trim().slice(0, 2000) : '',
      flatten: false, // only the kill switch builds flatten orders (flattenUnlocked); callers can never claim one
    };
  }

  /** Static checks that need no market data. Returns a refusal or null. */
  async function staticRefusal(o, st) {
    if (st.killed) return 'killed';
    if (st.halted_day === today() && !o.flatten) return 'daily-loss-halt';
    const agent = agentsById.get(o.agent);
    if (!agent) return 'unknown-agent';
    if (agent.venue !== 'any' && agent.venue !== o.venue) return 'agent-venue';
    const venue = config.venues[o.venue];
    if (!venue || !venue.enabled) return 'venue-disabled';
    if (venue.mode === 'live') return 'live-not-built';
    if (!adapters[o.venue]) return 'venue-unavailable';
    if (!instruments[o.venue]?.parse(o.instrument)) return 'bad-instrument';
    if (o.action !== 'buy' && o.action !== 'sell') return 'bad-action';
    if (!Number.isFinite(o.qty) || o.qty <= 0) return 'bad-qty';
    if (venue.kind === 'event' && !Number.isInteger(o.qty)) return 'bad-qty';
    if (!Number.isFinite(o.limit_price)) return 'bad-price';
    if (venue.kind === 'event' && (o.limit_price < 0.01 || o.limit_price > 0.99)) return 'bad-price';
    if (venue.kind === 'equity' && o.limit_price <= 0) return 'bad-price';
    if (!o.reasoning) return 'no-reasoning';
    return null;
  }

  function excluded(quote, instrument) {
    const hay = `${quote?.title || ''} ${quote?.category || ''} ${instrument}`.toLowerCase();
    return config.excluded.keywords.some((k) => hay.includes(k));
  }

  /** Market and money checks. Returns { refusal, quote }. */
  async function marketRefusal(o, { skipApproval = false } = {}) {
    let quote = null;
    try {
      quote = await adapters[o.venue].quote(o.instrument, now());
    } catch {
      quote = null;
    }
    if (!quote) return { refusal: 'no-quote', quote };
    o.title = quote.title || null;
    if (excluded(quote, o.instrument) && !o.flatten) return { refusal: 'excluded-market', quote };
    if (quote.status !== 'open') return { refusal: 'market-not-open', quote };

    if (o.action === 'sell') {
      const pos = await store.position(o.agent, o.venue, o.instrument);
      if (!pos || pos.qty + 1e-9 < o.qty) return { refusal: 'no-shorting', quote };
      return { refusal: null, quote };
    }

    // Buys only below: they add risk.
    const venue = config.venues[o.venue];
    const positions = await store.positions();
    const sameInstrument = positions.filter((p) => p.venue === o.venue && p.instrument === o.instrument).reduce((s, p) => s + p.cost, 0);
    if (sameInstrument + o.notional > maxPositionUsd(config, o.venue) + 1e-9) return { refusal: 'position-limit', quote };
    const venueCost = positions.filter((p) => p.venue === o.venue).reduce((s, p) => s + p.cost, 0);
    if (venueCost + o.notional > venue.bankrollUsd + 1e-9) return { refusal: 'venue-cap', quote };
    const cash = await store.cash(o.venue, venue.bankrollUsd);
    if (o.notional > cash + 1e-9) return { refusal: 'insufficient-cash', quote };
    if (await checkDailyLoss()) return { refusal: 'daily-loss-halt', quote };
    if (!skipApproval && o.notional > L.approvalAboveUsd) return { refusal: null, quote, needsApproval: true };
    return { refusal: null, quote };
  }

  async function refuse(o, reason) {
    // Record what was asked, but never let a malformed field break the ledger write.
    const num = (x) => (Number.isFinite(x) ? x : 0);
    await store.insertOrder({
      ...o, action: String(o.action ?? '').slice(0, 16), qty: num(o.qty), limit_price: num(o.limit_price), notional: num(o.notional),
      instrument: o.instrument.slice(0, 120), agent: o.agent.slice(0, 64), venue: o.venue.slice(0, 64), status: 'refused', refusal: reason,
    });
    await store.event(now(), 'refused', { agent: o.agent, venue: o.venue, orderId: o.id, detail: reason });
    return { id: o.id, status: 'refused', refusal: reason };
  }

  // ─── execution ───

  async function applyFill(o, fill) {
    const ms = now();
    const venue = config.venues[o.venue];
    const pos = await store.position(o.agent, o.venue, o.instrument);
    let cash = await store.cash(o.venue, venue.bankrollUsd);
    const gross = fill.filledQty * fill.avgPrice;
    if (o.action === 'buy') {
      cash -= gross + fill.fees;
      await store.setPosition(o.agent, o.venue, o.instrument, o.title, (pos?.qty || 0) + fill.filledQty, (pos?.cost || 0) + gross, ms);
      await store.addAgentPnl(o.agent, o.venue, 0, fill.fees);
    } else {
      const costOut = pos.cost * (fill.filledQty / pos.qty);
      cash += gross - fill.fees;
      await store.setPosition(o.agent, o.venue, o.instrument, o.title, pos.qty - fill.filledQty, pos.cost - costOut, ms);
      await store.addAgentPnl(o.agent, o.venue, gross - costOut, fill.fees);
    }
    await store.setCash(o.venue, cash, ms);
  }

  /** Seal, then place. A failed seal refuses the order; nothing reaches the venue unsealed. */
  async function execute(o, quote) {
    const venue = config.venues[o.venue];
    try {
      const seal = await commit(o, await store.lastChain());
      await sealer.witness({ commitment: seal.commitment, chain: seal.chain, orderId: o.id });
      await store.updateOrder(o.id, { salt: seal.salt, commitment: seal.commitment, chain: seal.chain, sealed_at: iso(now()) });
    } catch (err) {
      await store.updateOrder(o.id, { status: 'refused', refusal: 'seal-failed' });
      await store.event(now(), 'refused', { agent: o.agent, venue: o.venue, orderId: o.id, detail: `seal-failed: ${String(err?.message || err).slice(0, 120)}` });
      return { id: o.id, status: 'refused', refusal: 'seal-failed' };
    }
    // The kill switch may have flipped while we sealed.
    const st = await store.state();
    if (st.killed && !o.flatten) {
      await store.updateOrder(o.id, { status: 'refused', refusal: 'killed', reveal_after: iso(now()) });
      return { id: o.id, status: 'refused', refusal: 'killed' };
    }
    const fill = await adapters[o.venue].place({ action: o.action, qty: o.qty, limitPrice: o.limit_price, instrument: o.instrument }, quote, now());
    const ms = now();
    const status = fill.filledQty <= 0 ? 'unfilled' : qty6(fill.filledQty) < qty6(o.qty) ? 'partial' : 'filled';
    // Event contracts reveal when the market resolves; equities after T+1; nothing filled reveals now.
    const revealAfter = status === 'unfilled' ? iso(ms) : venue.kind === 'equity' ? iso(nextSettlementMs(ms)) : null;
    await store.updateOrder(o.id, {
      status, filled_qty: qty6(fill.filledQty), avg_price: fill.avgPrice, fees: fill.fees,
      filled_at: fill.filledQty > 0 ? iso(ms) : null, reveal_after: revealAfter,
    });
    if (fill.filledQty > 0) {
      await applyFill(o, fill);
      await store.event(ms, 'fill', {
        agent: o.agent, venue: o.venue, orderId: o.id,
        detail: `${o.action} ${qty6(fill.filledQty)} ${o.instrument} @ ${fill.avgPrice.toFixed(4)}`,
      });
      if (!o.flatten) await checkDailyLoss();
    } else {
      await store.event(ms, 'unfilled', { agent: o.agent, venue: o.venue, orderId: o.id, detail: fill.note || 'no fill' });
    }
    return { id: o.id, status, filledQty: qty6(fill.filledQty), avgPrice: fill.avgPrice, fees: fill.fees };
  }

  async function proposeUnlocked(p) {
    const o = { ...normalize(p), id: newId(), created_at: iso(now()), mode: 'paper', config_hash: configHash };
    o.notional = Number.isFinite(o.qty * o.limit_price) ? cents(o.qty * o.limit_price) : 0;
    const st = await store.state();
    const r1 = await staticRefusal(o, st);
    if (r1) return refuse(o, r1);
    const { refusal, quote, needsApproval } = await marketRefusal(o);
    if (refusal) return refuse(o, refusal);
    if (needsApproval) {
      await store.insertOrder({ ...o, status: 'awaiting-approval' });
      await store.event(now(), 'approval', { agent: o.agent, venue: o.venue, orderId: o.id, detail: `$${o.notional.toFixed(2)} > $${L.approvalAboveUsd}` });
      await safeNotify({ kind: 'approval', order: { id: o.id, agent: o.agent, venue: o.venue, instrument: o.instrument, title: o.title, action: o.action, qty: o.qty, limitPrice: o.limit_price, notional: o.notional } });
      return { id: o.id, status: 'awaiting-approval' };
    }
    await store.insertOrder({ ...o, status: 'unfilled' });
    return execute(o, quote);
  }

  // ─── kill switch ───

  async function flattenUnlocked(reason) {
    for (const ord of await store.ordersByStatus('awaiting-approval')) {
      await store.updateOrder(ord.id, { status: 'canceled', refusal: 'killed', reveal_after: iso(now()) });
    }
    const results = [];
    for (const pos of await store.positions()) {
      const venue = config.venues[pos.venue];
      const adapter = adapters[pos.venue];
      if (!adapter) {
        results.push({ instrument: pos.instrument, status: 'no-adapter' });
        continue;
      }
      let quote = null;
      try {
        quote = await adapter.quote(pos.instrument, now());
      } catch {
        quote = null;
      }
      // Sell into whatever bid exists: the floor price for event contracts, 5% under the bid for equities.
      const limit = venue.kind === 'event' ? 0.01 : quote?.bid ? cents(quote.bid * 0.95) : 0.01;
      const o = {
        agent: pos.agent, venue: pos.venue, instrument: pos.instrument, title: pos.title, action: 'sell', qty: pos.qty, limit_price: limit,
        reasoning: `Kill switch flatten: ${reason}`, flatten: true, id: newId(), created_at: iso(now()), mode: 'paper', config_hash: configHash,
      };
      o.notional = cents(o.qty * o.limit_price);
      if (!quote || quote.status !== 'open') {
        await refuse(o, quote ? 'market-not-open' : 'no-quote');
        results.push({ instrument: pos.instrument, status: 'retry-next-tick' });
        continue;
      }
      await store.insertOrder({ ...o, status: 'unfilled' });
      results.push({ instrument: pos.instrument, ...(await execute(o, quote)) });
    }
    return results;
  }

  // ─── settlement & reveal ───

  async function markAndSettle() {
    const ms = now();
    for (const pos of await store.positions()) {
      const adapter = adapters[pos.venue];
      if (!adapter) continue;
      let quote = null;
      try {
        quote = await adapter.quote(pos.instrument, ms);
      } catch {
        continue;
      }
      if (!quote) continue;
      if (quote.status === 'settled' && quote.result) {
        const side = pos.instrument.split(':').pop();
        const payout = side === quote.result ? 1 : 0;
        const proceeds = pos.qty * payout;
        const venue = config.venues[pos.venue];
        await store.setCash(pos.venue, (await store.cash(pos.venue, venue.bankrollUsd)) + proceeds, ms);
        await store.addAgentPnl(pos.agent, pos.venue, proceeds - pos.cost, 0);
        await store.setPosition(pos.agent, pos.venue, pos.instrument, pos.title, 0, 0, ms);
        await store.setMark(pos.venue, pos.instrument, payout, ms);
        await store.event(ms, 'settle', { agent: pos.agent, venue: pos.venue, detail: `${pos.instrument} resolved ${quote.result}: ${cents(proceeds - pos.cost).toFixed(2)}` });
        for (const ord of await store.unrevealed()) {
          if (ord.venue === pos.venue && ord.instrument === pos.instrument && !ord.reveal_after) {
            await store.updateOrder(ord.id, { reveal_after: iso(ms) });
          }
        }
      } else if (quote.bid != null) {
        await store.setMark(pos.venue, pos.instrument, quote.bid, ms);
      }
    }
  }

  async function revealDue() {
    const ms = now();
    for (const ord of await store.unrevealed()) {
      if (ord.reveal_after && Date.parse(ord.reveal_after) <= ms) {
        await store.updateOrder(ord.id, { revealed_at: iso(ms) });
        await store.event(ms, 'reveal', { agent: ord.agent, venue: ord.venue, orderId: ord.id });
      }
    }
  }

  async function expireApprovals() {
    const cutoff = now() - L.approvalTtlMinutes * 60_000;
    for (const ord of await store.ordersByStatus('awaiting-approval')) {
      if (Date.parse(ord.created_at) < cutoff) {
        await store.updateOrder(ord.id, { status: 'expired', refusal: 'approval-expired', reveal_after: iso(now()) });
      }
    }
  }

  // ─── public surface ───

  return {
    /** Agents' only way to trade. */
    async propose(p) {
      return (await withLock(() => proposeUnlocked(p))) ?? { status: 'refused', refusal: 'busy' };
    },

    /** Mike approves an order above the threshold. All checks run again against a fresh quote. */
    async approve(id) {
      const out = await withLock(async () => {
        const ord = await store.order(id);
        if (!ord || ord.status !== 'awaiting-approval') return { id, status: 'refused', refusal: 'not-awaiting-approval' };
        if (Date.parse(ord.created_at) < now() - L.approvalTtlMinutes * 60_000) {
          await store.updateOrder(id, { status: 'expired', refusal: 'approval-expired', reveal_after: iso(now()) });
          return { id, status: 'refused', refusal: 'approval-expired' };
        }
        const o = { ...ord, flatten: false };
        const fail = async (reason) => {
          await store.updateOrder(id, { status: 'refused', refusal: reason, reveal_after: iso(now()) });
          return { id, status: 'refused', refusal: reason };
        };
        const r1 = await staticRefusal(o, await store.state());
        if (r1) return fail(r1);
        const { refusal, quote } = await marketRefusal(o, { skipApproval: true });
        if (refusal) return fail(refusal);
        await store.event(now(), 'approved', { agent: o.agent, venue: o.venue, orderId: id });
        await store.updateOrder(id, { status: 'unfilled' });
        return execute(o, quote);
      });
      return out ?? { id, status: 'refused', refusal: 'busy' };
    },

    /** One command: stop everything, flatten, stop using keys. Re-arming is a separate, deliberate call. */
    async kill(by = 'mike', reason = 'manual') {
      await store.setKilled(by, now());
      await store.event(now(), 'kill', { detail: `Kill switch by ${by}: ${reason}` });
      await safeNotify({ kind: 'kill', by, reason });
      const flattened = await withLock(() => flattenUnlocked(reason));
      return { killed: true, flattened: flattened ?? 'pending-next-tick' };
    },

    async rearm(by = 'mike') {
      const st = await store.state();
      if (!st.killed) return { rearmed: false, reason: 'not-killed' };
      if ((await store.positions()).length) return { rearmed: false, reason: 'positions-still-open' };
      await store.rearm(now());
      await store.event(now(), 'rearm', { detail: `Re-armed by ${by}` });
      return { rearmed: true };
    },

    /** The cron: marks, settlements, reveals, the daily-loss check, then each strategy's proposals. */
    async tick(strategies = [], view = null) {
      const out = await withLock(async () => {
        await expireApprovals();
        await markAndSettle();
        await revealDue();
        const st = await store.state();
        if (st.killed) return { ran: 'flatten', results: await flattenUnlocked('retry') };
        if (await checkDailyLoss()) return { ran: 'halted' };
        const results = [];
        let budget = L.maxOrdersPerTick;
        for (const s of strategies) {
          if (budget <= 0) break;
          let proposals = [];
          try {
            proposals = await s.run(view, { positions: (await store.positions()).filter((p) => p.agent === s.id), now: now() });
          } catch (err) {
            await store.event(now(), 'strategy-error', { agent: s.id, detail: String(err?.message || err).slice(0, 200) });
            continue;
          }
          for (const p of proposals.slice(0, budget)) {
            budget--;
            results.push(await proposeUnlocked({ ...p, agent: s.id }));
          }
        }
        return { ran: 'strategies', results };
      });
      return out ?? { ran: 'busy' };
    },

    equity,
  };
}
