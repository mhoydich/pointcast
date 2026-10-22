import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE, units, fmt, ceilDiv } from '../src/lib/launchpad/units.mjs';
import { PRESETS, SUPPLY, D, POOL_TIERS } from '../src/lib/launchpad/config.mjs';
import { prng } from '../src/lib/launchpad/prng.mjs';
import {
  createWorld, addWallet, launch, buy, sell, tick, sweep, setFeeSplit, migrate, emit, cancelOrder, quoteInSystem, quoteBuy, quoteSell,
  sniperFeeBps, poolTier, orderRoom, estimateOut, eventLine, eventsHash, EVENT_FIELDS,
} from '../src/lib/launchpad/engine.mjs';
import { graduationRaise, netForOut, newCurve, netOfRate } from '../src/lib/launchpad/curve.mjs';
import { newPool, overflowOut } from '../src/lib/launchpad/pool.mjs';

const classic = PRESETS['classic-x100'];
const R_CURVE = 12_500n;

function world(rules = 'naked', wallets = 6, credits = '20000', preset = 'classic-x100') {
  const w = createWorld();
  addWallet(w, { id: 'dev', role: 'dev', credits: units(credits) });
  for (let i = 1; i <= wallets; i++) addWallet(w, { id: `w${i}`, credits: units(credits) });
  const res = launch(w, { creator: 'dev', symbol: 'TEST', name: 'Test Coin', nounId: 7, rules, preset });
  return { w, coin: res.coin };
}

const tokensTotal = (w, coin) => [...coin.holders.values()].reduce((s, b) => s + b, 0n) + (coin.pool ? coin.pool.base : coin.curve.R + PRESETS[coin.preset].poolBase);
const lastOf = (w, type) => w.events.filter((e) => e.type === type).at(-1);
/** The house and creator deltas of one action, to check that fee lines sum to the fee. */
function feeDelta(w, coin, fn) {
  const before = { ...w.house, held: coin.feesHeld, lp: coin.pool ? coin.pool.quote : 0n };
  const res = fn();
  return { res, creator: coin.feesHeld - before.held, house: w.house.fees - before.fees, sniper: w.house.sniperFees - before.sniperFees, priority: w.house.priorityFees - before.priorityFees };
}

test('launch validates names, symbols, Nouns, presets and rules', () => {
  const w = createWorld();
  addWallet(w, { id: 'dev', credits: units('5000') });
  assert.equal(launch(w, { creator: 'nobody', symbol: 'OK', name: 'x', nounId: 1 }).reason, 'NO_WALLET');
  assert.equal(launch(w, { creator: 'dev', symbol: 'lower', name: 'x', nounId: 1 }).reason, 'BAD_SYMBOL');
  assert.equal(launch(w, { creator: 'dev', symbol: 'ABCDEFGHIJKLMN', name: 'x', nounId: 1 }).reason, 'BAD_SYMBOL');
  assert.equal(launch(w, { creator: 'dev', symbol: 'OK', name: 'x'.repeat(33), nounId: 1 }).reason, 'BAD_NAME');
  assert.equal(launch(w, { creator: 'dev', symbol: 'OK', name: 'Fine', nounId: 100 }).reason, 'BAD_NOUN');
  assert.equal(launch(w, { creator: 'dev', symbol: 'OK', name: 'Fine', nounId: 1, preset: 'nope' }).reason, 'BAD_PRESET');
  assert.equal(launch(w, { creator: 'dev', symbol: 'OK', name: 'Fine', nounId: 1, rules: 'nope' }).reason, 'BAD_RULES');
  const ok = launch(w, { creator: 'dev', symbol: 'OK', name: 'Fine', nounId: 1, viewerMade: true });
  assert.equal(ok.coin.id, 'c1', 'coins are numbered in launch order');
  assert.equal(lastOf(w, 'CREATE').viewerMade, true);
});

test('dev buys by rule set: 50M tokens cost 148.460411 gross under naked and 221.774194 under sniper-fee', () => {
  const cap = (SUPPLY * 500n) / 10_000n;
  const netC = netForOut(newCurve(classic), cap);
  assert.equal(fmt(netC, 6), '146.627566');
  for (const [rules, gross, r] of [['naked', '148.460411', R_CURVE], ['sniper-fee', '221.774194', R_CURVE + 500_000n]]) {
    assert.equal(fmt(netC + ceilDiv(netC * r, D), 6), gross, `${rules}: exact-out cost of the cap`);
    const w = createWorld();
    addWallet(w, { id: 'dev', credits: units('1000') });
    const res = launch(w, { creator: 'dev', symbol: 'DEV', name: 'Dev', nounId: 3, rules, devBuy: units(gross) });
    assert.equal(res.devBuy, undefined, `${rules}: the maximum dev buy goes through`);
    const held = res.coin.holders.get('dev');
    assert.ok(held >= cap && held - cap < ONE / 100n, `${rules}: about 5% of supply (${held})`);
    assert.equal(lastOf(w, 'TRADE').reason, 'dev buy');
    const over = launch(w, { creator: 'dev', symbol: 'OVER', name: 'Over', nounId: 4, rules, devBuy: units(gross) + units('0.01') });
    assert.equal(over.devBuy.reason, 'DEV_BUY_CAP', `${rules}: a cent more is refused`);
  }
  for (const rules of ['auction', 'fair']) {
    const w = createWorld();
    addWallet(w, { id: 'dev', credits: units('1000') });
    const res = launch(w, { creator: 'dev', symbol: 'DEV', name: 'Dev', nounId: 3, rules, devBuy: units('148') });
    const order = lastOf(w, 'AUCTION_ORDER');
    assert.equal(res.coin.status, 'auction');
    assert.equal(order.wallet, 'dev');
    assert.equal(order.quote, units('30'), `${rules}: the dev buy is an ordinary auction order, capped at 30 cr`);
    assert.equal(order.refused, units('118'));
  }
});

test('buys and sells conserve credits and tokens, and quotes equal fills', () => {
  const { w, coin } = world();
  const start = quoteInSystem(w);
  const q = quoteBuy(w, coin.id, units('123.45'));
  const res = buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('123.45') });
  assert.equal(res.out, q, 'buy quote equals fill');
  const qs = quoteSell(w, coin.id, res.out / 3n);
  const s = sell(w, { wallet: 'w1', coin: coin.id, baseIn: res.out / 3n });
  assert.equal(s.out, qs, 'sell quote equals fill');
  assert.equal(quoteInSystem(w), start);
  assert.equal(tokensTotal(w, coin), SUPPLY);
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: units('1'), minOut: q }).reason, 'SLIPPAGE');
  assert.equal(sell(w, { wallet: 'w2', coin: coin.id, baseIn: 1n }).reason, 'INSUFFICIENT_TOKENS');
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: units('999999') }).reason, 'INSUFFICIENT_CREDITS');
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: 0n }).reason, 'BAD_AMOUNT');
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: units('1'), priorityFeeBps: 1.5 }).reason, 'BAD_AMOUNT');
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: units('1'), priorityFeeBps: 10_001 }).reason, 'BAD_AMOUNT');
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: 1n }).reason, 'BAD_AMOUNT', 'a buy that returns no tokens is refused');
  assert.equal(buy(w, { wallet: 'w2', coin: 'c9', quoteIn: units('1') }).reason, 'NO_COIN');
  assert.equal(buy(w, { wallet: 'nobody', coin: coin.id, quoteIn: units('1') }).reason, 'NO_WALLET');
});

test('one gross: the priority fee is inside quoteIn, and the Sniper’s 100 cr buy takes 34,101,382.389096 tokens', () => {
  const { w, coin } = world();
  const before = w.wallets.get('w1').credits;
  const quoted = quoteBuy(w, coin.id, units('100'), 30);
  const { res, creator, house, sniper, priority } = feeDelta(w, coin, () => buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100'), priorityFeeBps: 30 }));
  assert.equal(fmt(res.out, 6), '34,101,382.389096');
  assert.equal(res.out, quoted);
  assert.equal(before - w.wallets.get('w1').credits, units('100'), 'the wallet pays exactly the gross');
  const trade = lastOf(w, 'TRADE');
  assert.equal(trade.quote, units('100'));
  assert.equal(trade.net, netOfRate(units('100'), R_CURVE + 3_000n));
  assert.equal(trade.priorityFee, (trade.net * 3_000n) / D, 'priority = floor(net·rPriority/D)');
  assert.equal(priority, trade.priorityFee);
  assert.equal(sniper, 0n);
  assert.equal(creator + house + priority, trade.fee, 'the lines sum exactly to the fee');
});

test('fee lines: 100 cr pays 296,296 + 938,272 + 0 = 1,234,568 µcr, and lines sum exactly with sniper and priority fees', () => {
  const { w, coin } = world();
  const { res, creator, house, sniper, priority } = feeDelta(w, coin, () => buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100') }));
  assert.equal(res.fee, 1_234_568n);
  assert.equal(creator, 296_296n);
  assert.equal(house, 938_272n);
  assert.equal(sniper + priority, 0n);

  const s = world('sniper-fee');
  for (let i = 0; i < 10; i++) tick(s.w);
  assert.equal(sniperFeeBps(s.w, s.coin), 3472, 'f(10) = floor(5000·50²/3600)');
  const d = feeDelta(s.w, s.coin, () => buy(s.w, { wallet: 'w1', coin: s.coin.id, quoteIn: units('77.7'), priorityFeeBps: 45 }));
  const trade = lastOf(s.w, 'TRADE');
  assert.equal(trade.sniperFee, (trade.net * 347_200n) / D, 'sniper = floor(net·rSniper/D)');
  assert.equal(d.sniper, trade.sniperFee);
  assert.equal(d.priority, trade.priorityFee);
  assert.equal(d.creator + d.house + d.sniper + d.priority, trade.fee);
  assert.equal(d.creator, ((trade.fee - trade.sniperFee - trade.priorityFee) * 3_000n) / R_CURVE, 'creator = floor(tierFee·rCreator/rTier)');

  const sd = feeDelta(s.w, s.coin, () => sell(s.w, { wallet: 'w1', coin: s.coin.id, baseIn: s.coin.holders.get('w1') / 2n, priorityFeeBps: 20 }));
  const st = lastOf(s.w, 'TRADE');
  assert.equal(st.fee, ceilDiv(st.net * (R_CURVE + 2_000n), D), 'sell fee = ceil(grossOut·r/D)');
  assert.equal(st.priorityFee, (st.net * 2_000n) / D, 'sell priority is measured on grossOut');
  assert.equal(st.sniperFee, 0n, 'sells pay no sniper fee');
  assert.equal(sd.creator + sd.house + sd.priority, st.fee);
  assert.equal(sell(s.w, { wallet: 'w1', coin: s.coin.id, baseIn: ONE, priorityFeeBps: 10_000 }).reason, 'BAD_AMOUNT', 'a sell whose fee would exceed its proceeds is refused');
});

test('the crossing buy splits into curve and overflow legs at the same rate, then migrates with LP burned', () => {
  const { w, coin } = world('naked', 2, '50000');
  const start = quoteInSystem(w);
  buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('8000') });
  const { R, realQuote } = coin.curve;
  const netC = netForOut(coin.curve, R);
  const grossC = netC + ceilDiv(netC * R_CURVE, D);
  const gross = units('2000');
  const netO = netOfRate(gross - grossC, R_CURVE);
  const outO = overflowOut(realQuote + netC - classic.migrationFee, classic.poolBase, netO);
  const houseBefore = w.house.migration;
  const before = w.events.length;
  const d = feeDelta(w, coin, () => buy(w, { wallet: 'w2', coin: coin.id, quoteIn: gross }));
  assert.ok(d.res.ok);
  assert.deepEqual(w.events.slice(before).map((e) => e.type), ['TRADE', 'COMPLETE', 'MIGRATE', 'POST_COMPLETE_BUY']);
  const [trade, , mig, post] = w.events.slice(before);
  assert.equal(trade.quote, grossC, 'curve leg: gross_c = net_c + ceil(net_c·r/D)');
  assert.equal(trade.net, netC);
  assert.equal(trade.base, R);
  assert.equal(post.quote, gross - grossC, 'overflow leg: gross_o = gross − gross_c');
  assert.equal(post.net, netO, 'net_o = floor(gross_o·D/(D+r))');
  assert.equal(post.base, outO, 'out = floor((net_o−1)·base/(quote+net_o−1))');
  assert.equal(d.res.out, R + outO);
  // Both legs split like the curve (creator 30 / house 95 / LP 0), so the pool seed is exactly realQuote − fee + net_o.
  assert.equal(d.creator, (trade.fee * 3_000n) / R_CURVE + (post.fee * 3_000n) / R_CURVE);
  assert.equal(d.creator + d.house, trade.fee + post.fee);
  assert.equal(coin.pool.quote, mig.quote + netO);
  assert.equal(coin.pool.base, classic.poolBase - outO);
  assert.equal(mig.quote, coin.curve.realQuote - classic.migrationFee);
  assert.equal(w.house.migration - houseBefore, classic.migrationFee, 'the migration fee lands in the house sink');
  assert.equal(coin.status, 'migrated');
  assert.equal(coin.curve.R, 0n);
  assert.equal(coin.pool.lpBurned, coin.pool.lpSupply, 'all LP is burned');
  assert.equal(quoteInSystem(w), start);
  assert.equal(tokensTotal(w, coin), SUPPLY);
  // After migration the pool trades both ways, and LP fees deepen the pool. The 2,000 cr overflow lifted the pool past 42,000 cr, into tier 2.
  const tier = poolTier(w, coin);
  assert.equal(tier, POOL_TIERS[1]);
  const q0 = coin.pool.quote;
  const sold = sell(w, { wallet: 'w1', coin: coin.id, baseIn: coin.holders.get('w1') / 10n });
  assert.ok(sold.ok);
  assert.equal(sold.fee, ceilDiv(lastOf(w, 'TRADE').net * 12_000n, D), 'tier 2: 120 bps');
  assert.equal(coin.pool.quote, q0 - lastOf(w, 'TRADE').net + (sold.fee * 2_000n) / 12_000n, 'the LP line stays in the reserves');
  assert.ok(buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('10'), priorityFeeBps: 30 }).ok);
  assert.equal(quoteInSystem(w), start);
  assert.equal(tokensTotal(w, coin), SUPPLY);
});

test('an overflow with net_o ≤ 1 buys nothing, and an exact graduating buy has no overflow leg', () => {
  for (const extra of [0n, 1n, 2n]) {
    const { w, coin } = world('naked', 1, '50000');
    const netC = netForOut(coin.curve, coin.curve.R);
    const grossC = netC + ceilDiv(netC * R_CURVE, D);
    const before = w.events.length;
    assert.ok(buy(w, { wallet: 'w1', coin: coin.id, quoteIn: grossC + extra }).ok);
    const types = w.events.slice(before).map((e) => e.type);
    if (extra === 0n) assert.deepEqual(types, ['TRADE', 'COMPLETE', 'MIGRATE']);
    else {
      assert.equal(types.at(-1), 'POST_COMPLETE_BUY');
      assert.equal(lastOf(w, 'POST_COMPLETE_BUY').base, 0n, `gross_o = ${extra} buys 0 tokens`);
    }
  }
  const { w, coin } = world('naked', 1, '50000');
  assert.ok(buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('8606.792604') }).ok);
  assert.equal(coin.status, 'curve', 'one µcr short of 8,606.792605 does not graduate');
  assert.ok(coin.curve.R > 0n, 'it leaves tokens on the curve');
});

test('price is continuous across migration for every preset: −0.0244% on pool reserves before overflow', () => {
  for (const id of Object.keys(PRESETS)) {
    const p = PRESETS[id];
    const { w, coin } = world('naked', 1, '100000', id);
    const netC = netForOut(coin.curve, p.R0);
    buy(w, { wallet: 'w1', coin: coin.id, quoteIn: netC + ceilDiv(netC * R_CURVE, D) });
    const curveEnd = Number(coin.curve.Q) / Number(coin.curve.B);
    const mig = lastOf(w, 'MIGRATE');
    const gap = (mig.priceAfter / curveEnd - 1) * 100;
    assert.equal(gap.toFixed(4), '-0.0244', `${id}: ${gap}`);
    assert.ok(Math.abs(gap) < 0.1);
  }
});

test('a coin left complete refuses trades, and migrate() needs a complete coin', () => {
  const { w, coin } = world();
  buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100') });
  assert.equal(migrate(w, coin).reason, 'NOT_COMPLETE');
  coin.status = 'complete';
  assert.equal(buy(w, { wallet: 'w2', coin: coin.id, quoteIn: units('1') }).reason, 'CURVE_COMPLETE');
  assert.equal(sell(w, { wallet: 'w1', coin: coin.id, baseIn: 1n }).reason, 'CURVE_COMPLETE');
  assert.equal(quoteBuy(w, coin.id, units('1')), 0n);
});

test('pool tiers follow the pool’s market cap, thresholds scaled by the preset', () => {
  const { w, coin } = world();
  coin.status = 'migrated';
  const at = (mcapCr) => { coin.pool = newPool((mcapCr * classic.poolBase) / SUPPLY, classic.poolBase); return poolTier(w, coin); };
  assert.equal(at(41_088n * ONE), POOL_TIERS[0]);
  assert.equal(at(42_000n * ONE - 10n), POOL_TIERS[0], 'just under 42,000 cr is still tier 1');
  assert.equal(at(42_000n * ONE), POOL_TIERS[1], '420 SOL × 100');
  assert.equal(at(7_368_100n * ONE), POOL_TIERS[19], '73,681 × 100');
  assert.equal(at(100_000_000n * ONE), POOL_TIERS[24]);
  coin.pool = newPool((5_500_000n * ONE * classic.poolBase) / SUPPLY, classic.poolBase);
  addWallet(w, { id: 'big', credits: units('100') });
  const d = feeDelta(w, coin, () => buy(w, { wallet: 'big', coin: coin.id, quoteIn: units('100') }));
  const trade = lastOf(w, 'TRADE');
  assert.equal(trade.fee, units('100') - netOfRate(units('100'), 5_250n), 'tier 16: 52.5 bps in millionths');
  assert.equal(d.creator, (trade.fee * 2_750n) / 5_250n);
});

test('the opening auction caps each wallet at 30 cr gross (priority fee inside), refunds the excess and clears at one price', () => {
  const { w, coin } = world('auction', 5);
  const start = quoteInSystem(w);
  const cap = classic.Q0 / 100n;
  assert.equal(orderRoom(w, coin.id, 'w1'), cap);
  const est = estimateOut(w, coin.id, 'w1', units('100'), 50);
  const first = buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100'), priorityFeeBps: 50 });
  assert.equal(first.order, cap, 'capped at 30 cr gross');
  assert.equal(first.refused, units('70'));
  assert.equal(first.priorityFee, cap - netOfRate(cap, 5_000n), 'the priority fee is inside the 30 cr');
  assert.equal(w.wallets.get('w1').credits, units('20000') - cap, 'only the accepted gross leaves the wallet');
  assert.equal(orderRoom(w, coin.id, 'w1'), 0n);
  assert.equal(buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('5') }).reason, 'AUCTION_CAP');
  buy(w, { wallet: 'w2', coin: coin.id, quoteIn: units('10') });
  buy(w, { wallet: 'w3', coin: coin.id, quoteIn: units('20') });
  assert.equal(sell(w, { wallet: 'w1', coin: coin.id, baseIn: 1n }).reason, 'AUCTION_OPEN');
  assert.equal(quoteInSystem(w), start);
  for (let i = 0; i < 9; i++) tick(w);
  assert.equal(coin.status, 'auction', 'orders collect for 10 ticks');
  tick(w);
  assert.equal(coin.status, 'curve');
  const fills = w.events.filter((e) => e.type === 'AUCTION_FILL');
  assert.equal(fills.length, 3);
  const prices = fills.map((f) => Number(f.quote) / Number(f.base));
  assert.ok(Math.max(...prices) / Math.min(...prices) - 1 < 1e-6, 'one average price for every bidder');
  assert.ok(fills[0].base <= est, 'the estimate is an upper bound on the fill');
  assert.ok(fills[0].base * 10_000n > SUPPLY * 100n && fills[0].base * 10_000n < SUPPLY * 106n, 'a capped bidder gets about 1% of supply');
  const clear = lastOf(w, 'AUCTION_CLEAR');
  assert.equal(clear.quote, fills.reduce((s, f) => s + f.quote, 0n));
  assert.equal(quoteInSystem(w), start);
  assert.equal(tokensTotal(w, coin), SUPPLY);
});

test('auction rounding never overcharges, orders past the room are refunded, and a cancel returns order and priority fee', () => {
  const { w, coin } = world('auction', 0);
  for (let i = 0; i < 400; i++) addWallet(w, { id: `b${i}`, credits: units('40') });
  addWallet(w, { id: 'tiny', credits: 5n });
  const start = quoteInSystem(w);
  for (let i = 0; i < 400; i++) buy(w, { wallet: `b${i}`, coin: coin.id, quoteIn: units('29.999999'), priorityFeeBps: i % 3 });
  assert.ok(buy(w, { wallet: 'tiny', coin: coin.id, quoteIn: 1n }).ok);
  for (let i = 0; i < 10; i++) tick(w);
  const fills = w.events.filter((e) => e.type === 'AUCTION_FILL');
  for (const f of fills) assert.ok(f.refund >= 0n, 'no bidder pays more than its order');
  assert.ok(fills.some((f) => f.refund > 0n), 'orders past 90% of the raise are refunded pro rata');
  assert.ok(w.wallets.get('tiny').credits >= 0n);
  assert.equal(quoteInSystem(w), start);
  assert.equal(coin.status, 'curve');

  const c = world('auction', 1);
  const before = c.w.wallets.get('w1').credits;
  buy(c.w, { wallet: 'w1', coin: c.coin.id, quoteIn: units('12'), priorityFeeBps: 100 });
  assert.equal(cancelOrder(c.w, c.coin.id, 'w1').refunded, units('12'));
  assert.equal(c.w.wallets.get('w1').credits, before);
  assert.equal(c.w.house.priorityFees, 0n);
});

test('the sniper fee decays from 50% to zero over 60 ticks after trading opens, and goes to the house', () => {
  const { w, coin } = world('sniper-fee');
  assert.equal(sniperFeeBps(w, coin), 5000);
  for (let i = 0; i < 30; i++) tick(w);
  assert.equal(sniperFeeBps(w, coin), 1250);
  const res = buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100') });
  assert.ok(res.ok && w.house.sniperFees > 0n);
  for (let i = 0; i < 4; i++) tick(w);
  assert.equal(sniperFeeBps(w, coin), 938, 'f(34) = 938 bps, the Sniper’s first chance under its 10% guard');
  for (let i = 0; i < 26; i++) tick(w);
  assert.equal(sniperFeeBps(w, coin), 0);
  const fair = world('fair');
  assert.equal(sniperFeeBps(fair.w, fair.coin), 0, 'no sniper fee during the auction');
  for (let i = 0; i < 10; i++) tick(fair.w);
  assert.equal(sniperFeeBps(fair.w, fair.coin), 5000, 'the clock starts when trading opens');
});

test('fair rules: the early cap and the dev lock apply to the creator too', () => {
  const { w, coin } = world('fair', 3);
  for (let i = 0; i < 10; i++) tick(w);
  assert.equal(buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('2000') }).reason, 'EARLY_CAP');
  assert.equal(buy(w, { wallet: 'dev', coin: coin.id, quoteIn: units('2000') }).reason, 'EARLY_CAP');
  assert.ok(buy(w, { wallet: 'dev', coin: coin.id, quoteIn: units('20') }).ok);
  assert.equal(sell(w, { wallet: 'dev', coin: coin.id, baseIn: coin.holders.get('dev') }).reason, 'DEV_LOCKED');
  for (let i = 0; i < 120; i++) tick(w);
  assert.ok(buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('2000') }).ok, 'the early cap lifts after 120 ticks');
});

test('sweeps are idempotent, and each sweep’s payouts sum to the swept amount under a validated, locked split', () => {
  const { w, coin } = world();
  buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100') });
  assert.equal(setFeeSplit(w, coin.id, 'w1', [{ wallet: 'w1', bps: 10000 }]).reason, 'NOT_CREATOR');
  assert.equal(setFeeSplit(w, coin.id, 'dev', [{ wallet: 'dev', bps: 9000 }]).reason, 'BAD_SPLIT');
  assert.equal(setFeeSplit(w, coin.id, 'dev', [{ wallet: 'dev', bps: 5000 }, { wallet: 'dev', bps: 5000 }]).reason, 'BAD_SPLIT');
  assert.equal(setFeeSplit(w, coin.id, 'dev', Array.from({ length: 11 }, (_, i) => ({ wallet: i ? `w${(i % 6) + 1}` : 'dev', bps: 909 }))).reason, 'BAD_SPLIT');
  assert.ok(setFeeSplit(w, coin.id, 'dev', [{ wallet: 'dev', bps: 3333 }, { wallet: 'w2', bps: 3333 }, { wallet: 'w3', bps: 3334 }]).ok);
  assert.equal(setFeeSplit(w, coin.id, 'dev', [{ wallet: 'dev', bps: 10000 }]).reason, 'SPLIT_LOCKED');
  assert.equal(coin.feeSplit.reduce((s, x) => s + x.bps, 0), 10_000);
  const held = coin.feesHeld;
  const credits = () => ['dev', 'w2', 'w3'].reduce((s, id) => s + w.wallets.get(id).credits, 0n);
  const before = credits();
  const w3 = w.wallets.get('w3').credits;
  const dev = w.wallets.get('dev').credits;
  assert.equal(sweep(w, coin.id).paid, held);
  assert.equal(credits() - before, held, 'payouts sum exactly to the swept amount');
  assert.equal(w.wallets.get('w3').credits - w3, (held * 3334n) / 10_000n, 'each recipient gets its share rounded down');
  assert.equal(w.wallets.get('dev').credits - dev, held - (held * 3333n) / 10_000n - (held * 3334n) / 10_000n, 'the first recipient takes its share plus the remainder');
  assert.equal(sweep(w, coin.id).paid, 0n, 'a second sweep pays nothing');
  assert.equal(coin.feesSwept, held);
});

test('quotes equal fills over 3,000 seeded trades with priority fees, across graduation, and credits are conserved', () => {
  const rng = prng('engine-fuzz');
  const { w, coin } = world('sniper-fee', 12, '4000');
  const start = quoteInSystem(w);
  for (let i = 0; i < 3_000; i++) {
    if (i % 7 === 0) tick(w);
    const id = `w${1 + rng.int(12)}`;
    const held = coin.holders.get(id) ?? 0n;
    const fee = rng.int(60);
    if (held && rng.chance(0.25)) {
      const baseIn = held / BigInt(2 + rng.int(3));
      const q = quoteSell(w, coin.id, baseIn, fee);
      const res = sell(w, { wallet: id, coin: coin.id, baseIn, priorityFeeBps: fee });
      if (res.ok) assert.equal(res.out, q, `sell ${i}`);
    } else {
      const quoteIn = BigInt(1 + rng.int(300)) * ONE;
      const q = quoteBuy(w, coin.id, quoteIn, fee);
      const res = buy(w, { wallet: id, coin: coin.id, quoteIn, priorityFeeBps: fee });
      if (res.ok) assert.equal(res.out, q, `buy ${i}`);
    }
    if (i % 250 === 0) assert.equal(quoteInSystem(w), start);
  }
  assert.equal(coin.status, 'migrated', 'the fuzz graduates the coin and keeps trading in the pool');
  assert.equal(quoteInSystem(w), start);
  assert.equal(tokensTotal(w, coin), SUPPLY);
});

test('the log hash is canonical: declared fields in order, BigInt as strings, no floats, priceAfter left out', () => {
  const { w, coin } = world();
  buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('10') });
  const trade = lastOf(w, 'TRADE');
  const line = JSON.parse(eventLine(trade));
  assert.deepEqual(line.slice(0, 3), [trade.seq, trade.tick, 'TRADE']);
  assert.equal(line.length, 3 + EVENT_FIELDS.TRADE.length);
  assert.equal(line[3 + EVENT_FIELDS.TRADE.indexOf('quote')], '10000000');
  assert.ok(!eventLine(trade).includes(String(trade.priceAfter)), 'the float price is not hashed');
  const reordered = w.events.map((e) => Object.fromEntries(Object.entries(e).reverse()));
  assert.equal(eventsHash(reordered), eventsHash(w.events), 'key order on the object does not matter');
  const nudged = w.events.map((e) => (e === trade ? { ...e, priceAfter: 1 } : e));
  assert.equal(eventsHash(nudged), eventsHash(w.events));
  const changed = w.events.map((e) => (e === trade ? { ...e, base: e.base + 1n } : e));
  assert.notEqual(eventsHash(changed), eventsHash(w.events));
  assert.throws(() => eventLine({ seq: 0, tick: 0, type: 'NOPE' }), /undeclared/);
  assert.throws(() => emit(w, 'NOPE', {}), /undeclared/);
  assert.throws(() => eventLine({ ...trade, base: 0.5 }), /non-integer/);
  assert.match(eventsHash(w.events), /^[0-9a-f]{16}$/);
});
