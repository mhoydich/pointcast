// The Desk — Risk Gate, kill switch, sealing. Every test here tries to break
// one limit and asserts the gate holds. Paper mode, fake market data, a real
// SQLite ledger built from migrations/auth/0029_the_desk.sql. No network.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import rawConfig from '../src/data/the-desk.json' with { type: 'json' };
import { loadConfig } from '../functions/_lib/the-desk/config.mjs';
import { REFUSALS } from '../functions/_lib/the-desk/gate.mjs';
import { deskBroadcast } from '../functions/_lib/the-desk/public.mjs';
import { verifyReveal } from '../functions/_lib/the-desk/seal.mjs';
import { wireDesk } from '../functions/_lib/the-desk/wire.mjs';

const MIGRATION = readFileSync(new URL('../migrations/auth/0029_the_desk.sql', import.meta.url), 'utf8');
const T0 = Date.parse('2026-10-05T17:00:00Z'); // Monday, 10:00 in Los Angeles
const HOUR = 3_600_000;

/** D1's prepare/bind/first/all/run over node:sqlite. */
function d1(sqlite) {
  return {
    prepare(sql) {
      const st = sqlite.prepare(sql);
      let args = [];
      const api = {
        bind: (...a) => ((args = a), api),
        all: async () => ({ results: st.all(...args) }),
        first: async () => st.get(...args) ?? null,
        run: async () => ({ meta: { changes: Number(st.run(...args).changes) } }),
      };
      return api;
    },
  };
}

/** Controllable markets. Kalshi books are set per ticker; both sides derive from them. */
function fakeMarkets() {
  const quotes = new Map();
  const markets = [];
  const closes = new Map();
  const quote = async (inst, now) => {
    const q = quotes.get(inst);
    return q ? { instrument: inst, at: now, category: '', closeTime: null, result: null, status: 'open', ...q } : null;
  };
  return {
    quotes, markets, closes,
    setKalshi(ticker, { yesBid, yesAsk, depth = 1000, title = `Market ${ticker}`, status = 'open', result = null }) {
      const noBid = +(1 - yesAsk).toFixed(2);
      const noAsk = +(1 - yesBid).toFixed(2);
      quotes.set(`${ticker}:yes`, { title, status, result, bid: yesBid, ask: yesAsk, bids: [[yesBid, depth]], asks: [[yesAsk, depth]] });
      quotes.set(`${ticker}:no`, { title, status, result, bid: noBid, ask: noAsk, bids: [[noBid, depth]], asks: [[noAsk, depth]] });
    },
    setEquity(symbol, { bid, ask, at }) {
      quotes.set(symbol, { title: symbol, category: 'equity', bid, ask, bids: [[bid, Infinity]], asks: [[ask, Infinity]], ...(at ? { at } : {}) });
    },
    data() {
      return {
        kalshi: { listOpen: async () => markets, quote },
        alpaca: { configured: true, quote, dailyCloses: async (sym) => closes.get(sym) || [] },
      };
    },
  };
}

async function setup({ config = rawConfig, overrides = {} } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(MIGRATION);
  const clock = { t: T0 };
  const notes = [];
  const m = fakeMarkets();
  const wired = await wireDesk({
    rawConfig: config, db: d1(sqlite), data: m.data(), now: () => clock.t,
    notify: async (msg) => void notes.push(msg),
    overrides: { lockRetries: 2, sleep: async () => {}, ...overrides },
  });
  return { ...wired, sqlite, clock, notes, m };
}

const buy = (o = {}) => ({ agent: 'fade', venue: 'kalshi', instrument: 'ABC:no', action: 'buy', qty: 10, limitPrice: 0.96, reasoning: 'test', ...o });

// ─── config cannot be loosened ─────────────────────────────────────────────

test('config: the 2% cap is hard; live venues cannot sneak into a paper desk; the loaded config is frozen', () => {
  const loose = structuredClone(rawConfig);
  loose.limits.maxPositionPctOfBankroll = 0.05;
  assert.throws(() => loadConfig(loose), /maxPositionPctOfBankroll/);
  const live = structuredClone(rawConfig);
  live.venues.kalshi.mode = 'live';
  assert.throws(() => loadConfig(live), /live while the desk is in paper mode/);
  const noLoss = structuredClone(rawConfig);
  noLoss.limits.dailyLossLimitUsd = 0;
  assert.throws(() => loadConfig(noLoss), /dailyLossLimitUsd/);
  const c = loadConfig(rawConfig);
  assert.throws(() => { c.limits.maxPositionPctOfBankroll = 1; }, TypeError);
  assert.throws(() => { c.venues.kalshi.bankrollUsd = 1e9; }, TypeError);
});

test('config: the desk API has no way to change limits, and proposals cannot smuggle any', async () => {
  const { desk, m, config } = await setup();
  assert.deepEqual(Object.keys(desk).sort(), ['approve', 'equity', 'kill', 'propose', 'rearm', 'tick']);
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const r = await desk.propose(buy({ qty: 30, limits: { maxPositionPctOfBankroll: 1 }, config: { limits: {} } }));
  assert.equal(r.refusal, 'position-limit');
  assert.equal(config.limits.maxPositionPctOfBankroll, 0.02);
});

// ─── happy path, sealed before placed ──────────────────────────────────────

test('a valid order is sealed, then filled against the book, and the ledger moves', async () => {
  const { desk, m, store } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const r = await desk.propose(buy());
  assert.equal(r.status, 'filled');
  assert.equal(r.avgPrice, 0.96); // NO ask = 1 − YES bid; never the midpoint
  assert.equal(r.fees, 0.03); // 0.07 × 10 × .96 × .04 = 2.688¢, rounded up
  const o = await store.order(r.id);
  assert.ok(o.commitment && o.chain && o.sealed_at);
  assert.ok(o.sealed_at <= o.filled_at);
  assert.equal(o.revealed_at, null);
  assert.equal(await store.cash('kalshi', 1000), 990.37);
  const [pos] = await store.positions();
  assert.deepEqual([pos.agent, pos.instrument, pos.qty, pos.cost], ['fade', 'ABC:no', 10, 9.6]);
  assert.equal((await store.events()).filter((e) => e.kind === 'fill').length, 1);
});

test('seal happens before the venue is touched; a failed seal is a refused trade', async () => {
  const calls = [];
  const m = fakeMarkets();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const spy = {
    quote: (i, now) => m.data().kalshi.quote(i, now),
    place: async () => { calls.push('place'); return { filledQty: 10, avgPrice: 0.96, fees: 0 }; },
    cancel: async () => ({ ok: true }),
  };
  const failing = { name: 'broken', witness: async () => { calls.push('witness'); throw new Error('witness down'); } };
  const { desk, store } = await setup({ overrides: { sealer: failing, adapters: { kalshi: spy } } });
  const r = await desk.propose(buy());
  assert.deepEqual(r, { id: r.id, status: 'refused', refusal: 'seal-failed' });
  assert.deepEqual(calls, ['witness'], 'place() never ran');
  assert.equal((await store.positions()).length, 0);
});

// ─── every refusal ─────────────────────────────────────────────────────────

test('position limit: 2% of the venue bankroll per instrument, across agents and across orders', async () => {
  const { desk, m } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  assert.equal((await desk.propose(buy({ qty: 21, limitPrice: 0.96 }))).refusal, 'position-limit'); // $20.16 > $20
  assert.equal((await desk.propose(buy({ qty: 15, limitPrice: 0.96 }))).status, 'filled'); // $14.40
  assert.equal((await desk.propose(buy({ qty: 6, limitPrice: 0.96 }))).refusal, 'position-limit'); // +$5.76 → $20.16
  assert.equal((await desk.propose(buy({ agent: 'guest', qty: 6, limitPrice: 0.96 }))).refusal, 'position-limit', 'another agent cannot stack the same position');
  assert.equal((await desk.propose(buy({ qty: 5, limitPrice: 0.96 }))).status, 'filled'); // $19.20 total, still under
});

test('venue cap and cash: the venue bankroll is the ceiling', async () => {
  const { desk, m, store } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  for (let i = 0; i < 50; i++) await store.setPosition('fade', 'kalshi', `T${i}:yes`, null, 20, 19.95, T0);
  assert.equal((await desk.propose(buy({ qty: 10 }))).refusal, 'venue-cap'); // 997.50 + 9.50 > 1000
  const fresh = await setup();
  fresh.m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  await fresh.store.setCash('kalshi', 5, T0);
  assert.equal((await fresh.desk.propose(buy({ qty: 10 }))).refusal, 'insufficient-cash');
});

test("no shorting: sells need a position, the agent's own, and no more than it holds", async () => {
  const { desk, m } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  assert.equal((await desk.propose(buy({ action: 'sell', limitPrice: 0.5 }))).refusal, 'no-shorting');
  await desk.propose(buy({ qty: 10 }));
  assert.equal((await desk.propose(buy({ action: 'sell', qty: 11, limitPrice: 0.9 }))).refusal, 'no-shorting');
  assert.equal((await desk.propose(buy({ agent: 'guest', action: 'sell', qty: 5, limitPrice: 0.9 }))).refusal, 'no-shorting');
  assert.equal((await desk.propose(buy({ action: 'sell', qty: 10, limitPrice: 0.9 }))).status, 'filled');
});

test('malformed and out-of-bounds proposals are refused before any market call', async () => {
  const { desk, m } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const cases = [
    [{ agent: 'mallory' }, 'unknown-agent'],
    [{ agent: 'drift' }, 'agent-venue'],
    [{ venue: 'polymarket-us', agent: 'guest' }, 'venue-disabled'],
    [{ venue: 'binance', agent: 'guest' }, 'venue-disabled'],
    [{ instrument: 'abc' }, 'bad-instrument'],
    [{ instrument: 'ABC:maybe' }, 'bad-instrument'],
    [{ action: 'short' }, 'bad-action'],
    [{ qty: -5 }, 'bad-qty'],
    [{ qty: 0 }, 'bad-qty'],
    [{ qty: 2.5 }, 'bad-qty'],
    [{ qty: Infinity }, 'bad-qty'],
    [{ qty: 'lots' }, 'bad-qty'],
    [{ limitPrice: 1.5 }, 'bad-price'],
    [{ limitPrice: 0 }, 'bad-price'],
    [{ limitPrice: NaN }, 'bad-price'],
    [{ reasoning: '   ' }, 'no-reasoning'],
    [{ reasoning: undefined }, 'no-reasoning'],
  ];
  for (const [patch, reason] of cases) {
    assert.equal((await desk.propose(buy(patch))).refusal, reason, JSON.stringify(patch));
  }
  for (const r of cases.map((c) => c[1])) assert.ok(REFUSALS.includes(r));
});

test('excluded markets, closed markets and missing quotes are refused', async () => {
  const { desk, m } = await setup();
  m.setKalshi('POT', { yesBid: 0.04, yesAsk: 0.05, title: 'Will federal cannabis rescheduling happen by Dec?' });
  assert.equal((await desk.propose(buy({ instrument: 'POT:no' }))).refusal, 'excluded-market');
  m.setKalshi('SHUT', { yesBid: 0.04, yesAsk: 0.05, status: 'closed' });
  assert.equal((await desk.propose(buy({ instrument: 'SHUT:no' }))).refusal, 'market-not-open');
  assert.equal((await desk.propose(buy({ instrument: 'NOPE:no' }))).refusal, 'no-quote');
});

test('a limit below the book does not fill, and the reasoning is revealed at once', async () => {
  const { desk, m, store } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const r = await desk.propose(buy({ limitPrice: 0.9 }));
  assert.equal(r.status, 'unfilled');
  assert.equal((await store.positions()).length, 0);
  await desk.tick();
  assert.ok((await store.order(r.id)).revealed_at);
});

// ─── human approval ────────────────────────────────────────────────────────

test('orders above the approval threshold wait for Mike, push a notification, and re-run every check on approval', async () => {
  const { desk, m, store, notes, clock } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const r = await desk.propose(buy({ qty: 18, limitPrice: 0.96 })); // $17.28 > $15
  assert.equal(r.status, 'awaiting-approval');
  assert.equal(notes.at(-1).kind, 'approval');
  assert.equal(notes.at(-1).order.id, r.id);
  assert.equal((await store.positions()).length, 0, 'nothing executes before approval');
  // The book moved past the limit while it waited: approval re-quotes, and the limit still binds.
  m.setKalshi('ABC', { yesBid: 0.03, yesAsk: 0.05 }); // NO ask 97¢ > 96¢ limit
  assert.equal((await desk.approve(r.id)).status, 'unfilled');
  assert.equal((await desk.approve(r.id)).refusal, 'not-awaiting-approval', 'no double approval');
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const again = await desk.propose(buy({ qty: 18, limitPrice: 0.96 }));
  assert.equal((await desk.approve(again.id)).status, 'filled');
  assert.equal((await desk.approve('o_forged')).refusal, 'not-awaiting-approval');
  // Expiry.
  m.setKalshi('XYZ', { yesBid: 0.04, yesAsk: 0.05 });
  const late = await desk.propose(buy({ instrument: 'XYZ:no', qty: 17, limitPrice: 0.96 }));
  clock.t += 31 * 60_000;
  assert.equal((await desk.approve(late.id)).refusal, 'approval-expired');
});

test('an approved order still cannot exceed the position limit if the book was filled meanwhile', async () => {
  const { desk, m } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  const wait = await desk.propose(buy({ qty: 17, limitPrice: 0.96 })); // $16.32, awaits
  assert.equal(wait.status, 'awaiting-approval');
  assert.equal((await desk.propose(buy({ agent: 'guest', qty: 10, limitPrice: 0.96 }))).status, 'filled'); // $9.60 lands first
  assert.equal((await desk.approve(wait.id)).refusal, 'position-limit');
});

// ─── daily loss limit ──────────────────────────────────────────────────────

test('daily loss limit: marks fall, the bell rings, all trading halts until the next desk day', async () => {
  const { desk, m, store, notes, clock } = await setup();
  for (const t of ['A1', 'A2', 'A3', 'A4']) {
    m.setKalshi(t, { yesBid: 0.5, yesAsk: 0.5 });
    assert.equal((await desk.propose(buy({ agent: 'guest', instrument: `${t}:yes`, qty: 20, limitPrice: 0.5 }))).status, 'filled');
  }
  assert.equal((await desk.tick()).ran, 'strategies');
  // Every market collapses: 80 contracts × 50¢ = $40 gone, past the $30 limit.
  for (const t of ['A1', 'A2', 'A3', 'A4']) m.setKalshi(t, { yesBid: 0.01, yesAsk: 0.02 });
  assert.equal((await desk.tick()).ran, 'halted');
  const events = await store.events();
  assert.equal(events.filter((e) => e.kind === 'halt').length, 1, 'the bell rings once');
  assert.equal(notes.filter((n) => n.kind === 'halt').length, 1);
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  assert.equal((await desk.propose(buy())).refusal, 'daily-loss-halt');
  assert.equal((await desk.propose(buy({ agent: 'guest', instrument: 'A1:yes', action: 'sell', qty: 5, limitPrice: 0.01 }))).refusal, 'daily-loss-halt', 'halt means all trading');
  assert.equal((await desk.tick()).ran, 'halted');
  assert.equal((await store.events()).filter((e) => e.kind === 'halt').length, 1, 'no second bell the same day');
  // Next LA day: a new start equity, trading resumes.
  clock.t += 24 * HOUR;
  assert.equal((await desk.propose(buy())).status, 'filled');
});

test('nobody can dress an order up as a kill-switch flatten to slip past the halt or the exclusions', async () => {
  const { desk, m, store, view } = await setup();
  m.setKalshi('POT', { yesBid: 0.04, yesAsk: 0.05, title: 'Cannabis rescheduling?' });
  assert.equal((await desk.propose(buy({ instrument: 'POT:no', flatten: true }))).refusal, 'excluded-market');
  await store.setHalted('2026-10-05', T0);
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  assert.equal((await desk.propose(buy({ flatten: true }))).refusal, 'daily-loss-halt');
  await store.setHalted(null, T0);
  const sneaky = { id: 'fade', run: async () => [{ ...buy({ instrument: 'POT:no' }), flatten: true }] };
  const t = await desk.tick([sneaky], view);
  assert.deepEqual(t.results.map((r) => r.refusal), ['excluded-market']);
});

test('daily loss is checked at proposal time too, not only on the cron', async () => {
  const { desk, m, store } = await setup();
  for (const t of ['B1', 'B2', 'B3', 'B4']) {
    m.setKalshi(t, { yesBid: 0.5, yesAsk: 0.5 });
    await desk.propose(buy({ agent: 'guest', instrument: `${t}:yes`, qty: 20, limitPrice: 0.5 }));
  }
  // Marks collapse between ticks; no cron runs before the next proposal.
  for (const t of ['B1', 'B2', 'B3', 'B4']) await store.setMark('kalshi', `${t}:yes`, 0.01, T0);
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  assert.equal((await desk.propose(buy())).refusal, 'daily-loss-halt');
  assert.equal((await store.state()).halted_day, '2026-10-05');
});

// ─── kill switch ───────────────────────────────────────────────────────────

test('kill switch: one call flattens every venue, cancels pending approvals, refuses everything after', async () => {
  const { desk, m, store, notes } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  m.setKalshi('DEF', { yesBid: 0.94, yesAsk: 0.95 });
  m.setEquity('SPY', { bid: 600, ask: 600.1 });
  await desk.propose(buy({ qty: 10 }));
  await desk.propose(buy({ agent: 'closer', instrument: 'DEF:yes', qty: 10, limitPrice: 0.95 }));
  await desk.propose({ agent: 'drift', venue: 'alpaca', instrument: 'SPY', action: 'buy', qty: 0.016, limitPrice: 601, reasoning: 'trend' });
  const pending = await desk.propose(buy({ agent: 'guest', instrument: 'DEF:no', qty: 17, limitPrice: 0.96 }));
  assert.equal(pending.status, 'awaiting-approval');
  assert.equal((await store.positions()).length, 3);

  const k = await desk.kill('mike', 'test');
  assert.equal(k.killed, true);
  assert.equal((await store.positions()).length, 0, 'flat on every venue');
  assert.ok(k.flattened.every((f) => f.status === 'filled'));
  const st = await store.state();
  assert.equal(st.killed, 1);
  assert.equal(st.keys_disabled, 1);
  assert.ok(notes.some((n) => n.kind === 'kill'), 'Mike is paged');
  assert.equal((await store.order(pending.id)).status, 'canceled');
  assert.equal((await desk.approve(pending.id)).refusal, 'not-awaiting-approval');

  // Everything after is refused: agents, approvals, the cron's strategies.
  assert.equal((await desk.propose(buy())).refusal, 'killed');
  const ran = [];
  const tick = await desk.tick([{ id: 'fade', run: async () => (ran.push(1), [buy()]) }], {});
  assert.equal(tick.ran, 'flatten');
  assert.deepEqual(ran, [], 'strategies do not run while killed');
  assert.ok((await store.events()).some((e) => e.kind === 'kill'));
});

test('kill switch with a closed market: the position stays queued and the cron keeps flattening; re-arm waits until flat', async () => {
  const { desk, m, store } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  await desk.propose(buy());
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05, status: 'closed' });
  await desk.kill('mike', 'closed market');
  assert.equal((await store.positions()).length, 1);
  assert.deepEqual(await desk.rearm('mike'), { rearmed: false, reason: 'positions-still-open' });
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  assert.equal((await desk.tick()).ran, 'flatten');
  assert.equal((await store.positions()).length, 0);
  assert.deepEqual(await desk.rearm('mike'), { rearmed: true });
  assert.equal((await desk.propose(buy())).status, 'filled');
});

test('kill lands even while the cron holds the lock; the pending flatten runs next tick', async () => {
  const { desk, m, store } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  await desk.propose(buy());
  await store.acquireLock('someone-else', T0, 60_000);
  const k = await desk.kill('mike', 'during tick');
  assert.equal(k.flattened, 'pending-next-tick');
  assert.equal((await store.state()).killed, 1, 'the flag is set without waiting for the lock');
  assert.equal((await desk.propose(buy())).refusal, 'busy');
  await store.releaseLock('someone-else');
  assert.equal((await desk.propose(buy())).refusal, 'killed');
  await desk.tick();
  assert.equal((await store.positions()).length, 0);
});

// ─── settlement, reveal, broadcast ─────────────────────────────────────────

test('event contracts settle at resolution; the seal reveals and verifies; the chain links', async () => {
  const { desk, m, store, config, configHash, clock } = await setup();
  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05 });
  m.setKalshi('GHI', { yesBid: 0.04, yesAsk: 0.05 });
  const a = await desk.propose(buy({ reasoning: 'longshot fade on ABC' }));
  const b = await desk.propose(buy({ instrument: 'GHI:no', reasoning: 'second' }));
  let pub = await deskBroadcast({ config, configHash, store, now: clock.t });
  const sealed = pub.trades.find((t) => t.id === a.id);
  assert.equal(sealed.reasoning, null, 'reasoning hidden while sealed');
  assert.equal(sealed.salt, null);
  assert.ok(sealed.commitment);

  m.setKalshi('ABC', { yesBid: 0.04, yesAsk: 0.05, status: 'settled', result: 'no' });
  clock.t += HOUR;
  await desk.tick();
  assert.equal((await store.positions()).filter((p) => p.instrument === 'ABC:no').length, 0);
  const oa = await store.order(a.id);
  assert.ok(oa.revealed_at);
  assert.equal(await verifyReveal(oa), true);
  assert.equal(await verifyReveal({ ...oa, reasoning: 'rewritten after the fact' }), false);
  const ob = await store.order(b.id);
  assert.equal(ob.revealed_at, null, 'GHI is unresolved, still sealed');

  pub = await deskBroadcast({ config, configHash, store, now: clock.t });
  const shown = pub.trades.find((t) => t.id === a.id);
  assert.equal(shown.reasoning, 'longshot fade on ABC');
  const fade = pub.agents.find((x) => x.id === 'fade');
  assert.equal(fade.realized, 0.4); // NO paid $1 × 10 against $9.60 cost
  assert.equal(pub.banner.startsWith('Not investment advice'), true);
  assert.ok((await store.events()).some((e) => e.kind === 'settle'));
});

test('equity orders reveal after T+1', async () => {
  const { desk, m, store, clock } = await setup();
  m.setEquity('SPY', { bid: 600, ask: 600.1 });
  const r = await desk.propose({ agent: 'drift', venue: 'alpaca', instrument: 'SPY', action: 'buy', qty: 0.016, limitPrice: 601, reasoning: 'trend' });
  assert.equal(r.status, 'filled');
  await desk.tick();
  assert.equal((await store.order(r.id)).revealed_at, null);
  clock.t += 30 * HOUR; // Tuesday afternoon UTC, past 21:00 settlement
  m.setEquity('SPY', { bid: 600, ask: 600.1 });
  await desk.tick();
  assert.ok((await store.order(r.id)).revealed_at);
});

test('stale equity quotes (market closed) never fill', async () => {
  const { desk, m } = await setup();
  m.setEquity('SPY', { bid: 600, ask: 600.1, at: T0 - 2 * HOUR });
  const r = await desk.propose({ agent: 'drift', venue: 'alpaca', instrument: 'SPY', action: 'buy', qty: 0.016, limitPrice: 601, reasoning: 'trend' });
  assert.equal(r.status, 'unfilled');
});

// ─── strategies go through the gate ────────────────────────────────────────

test('the cron runs the house strategies, and their orders meet the same gate', async () => {
  const { desk, m, store, view, strategies } = await setup();
  m.markets.push(
    { ticker: 'LONG', title: 'Longshot', closeTime: T0 + 24 * HOUR, yesBid: 0.04, yesAsk: 0.05, noBid: 0.95, noAsk: 0.96 },
    { ticker: 'WEED', title: 'Hemp bill passes?', closeTime: T0 + 24 * HOUR, yesBid: 0.04, yesAsk: 0.05, noBid: 0.95, noAsk: 0.96 },
    { ticker: 'FAV', title: 'Favorite', closeTime: T0 + 6 * HOUR, yesBid: 0.94, yesAsk: 0.95, noBid: 0.05, noAsk: 0.06 },
  );
  m.setKalshi('LONG', { yesBid: 0.04, yesAsk: 0.05 });
  m.setKalshi('WEED', { yesBid: 0.04, yesAsk: 0.05, title: 'Hemp bill passes?' });
  m.setKalshi('FAV', { yesBid: 0.94, yesAsk: 0.95 });
  m.closes.set('SPY', Array.from({ length: 25 }, (_, i) => 580 + i));
  m.setEquity('SPY', { bid: 604, ask: 604.2 });
  const t = await desk.tick(strategies, view);
  assert.equal(t.ran, 'strategies');
  assert.equal(t.results.filter((r) => r.status === 'filled').length, 3, JSON.stringify(t.results));
  assert.ok(t.results.some((r) => r.refusal === 'excluded-market'), 'the hemp market was refused by the gate');
  const held = (await store.positions()).map((p) => `${p.agent}:${p.instrument}`).sort();
  assert.deepEqual(held, ['closer:FAV:yes', 'drift:SPY', 'fade:LONG:no']);
  // Second tick: nothing doubles up.
  const t2 = await desk.tick(strategies, view);
  assert.deepEqual(t2.results.map((r) => r.refusal), ['excluded-market'], 'only the excluded market is re-proposed, and refused again');
  assert.equal((await store.positions()).length, 3);
});
