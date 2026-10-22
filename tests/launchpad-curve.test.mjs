import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE, fmt, ceilDiv } from '../src/lib/launchpad/units.mjs';
import { PRESETS, SUPPLY, POOL_BASE, POOL_TIERS, CURVE_FEES, D, CONFIG, configHash } from '../src/lib/launchpad/config.mjs';
import { newCurve, netOfRate, buyOut, netForOut, sellOut, marketCap, graduationRaise, progress, applyBuy, applySell } from '../src/lib/launchpad/curve.mjs';
import { prng } from '../src/lib/launchpad/prng.mjs';

const classic = PRESETS['classic-x100'];
const town = PRESETS.town;
const R_CURVE = BigInt(CURVE_FEES.creator + CURVE_FEES.house + CURVE_FEES.lp);
const grossFor = (net, r = R_CURVE) => net + ceilDiv(net * r, D);
const sellNet = (grossOut, r = R_CURVE) => grossOut - ceilDiv(grossOut * r, D);
const absDiff = (a, b) => (a > b ? a - b : b - a);

test('classic-x100 reproduces Pump’s curve scaled by 100, to the micro-credit', () => {
  const c = newCurve(classic);
  assert.equal(fmt(marketCap(c, SUPPLY), 6), '2,795.899347');
  const raise = graduationRaise(classic);
  assert.equal(fmt(raise, 6), '8,500.535906');
  assert.equal(fmt(marketCap({ Q: classic.Q0 + raise, B: classic.B0 - classic.R0 }, SUPPLY), 6), '41,088.016813');
  assert.equal(buyOut(c, 100n * ONE), 34_612_903_225_806n, 'a 100 cr first buy, before fees');
  assert.equal(buyOut(c, netOfRate(100n * ONE, R_CURVE)), 34_199_203_154_141n, 'after the 125 bps fee');
  assert.equal(buyOut(c, 1000n * ONE), 268_250_000_000_000n, 'a Q0/3 first buy takes 26.825% of supply');
  assert.equal(POOL_BASE, 206_900_000n * ONE);
  assert.equal(fmt(grossFor(netForOut(c, classic.R0)), 6), '8,606.792605', 'one buy to graduate, fee inside');
});

test('town is the same curve at a tenth of the quote', () => {
  const c = newCurve(town);
  assert.equal(fmt(marketCap(c, SUPPLY), 6), '279.589934');
  const raise = graduationRaise(town);
  assert.equal(fmt(raise, 6), '850.053591');
  assert.equal(fmt(marketCap({ Q: town.Q0 + raise, B: town.B0 - town.R0 }, SUPPLY), 6), '4,108.801682');
  assert.equal(fmt(grossFor(netForOut(c, town.R0)), 6), '860.679261', 'one holder can graduate town with 860.679261 (861 whole ATTN)');
  assert.equal(town.migrationFee, 150_000n, 'town’s migration fee is 0.15');
});

test('town against classic-x100 divided by 10, at fresh and proportional states', () => {
  // Proportional states: Q_classic = 10·Q_town with the same B. Independently rounded paths are not compared.
  const states = [0n, 7n, 200n, 600n].map((millions) => {
    const Bt = town.B0 - millions * 1_000_000n * ONE;
    return { Bt, Qt: (town.Q0 * town.B0) / Bt };
  });
  for (const { Bt, Qt } of states) {
    const t = { Q: Qt, B: Bt }, c = { Q: Qt * 10n, B: Bt };
    for (const out of [1n * ONE, 12_345n * ONE, 3_000_000n * ONE, 90_000_000n * ONE]) {
      const nc = netForOut(c, out), nt = netForOut(t, out);
      assert.ok(absDiff(nc, nt * 10n) <= 10n, 'buy exact-out net within 1 µcr (pre-fee)');
      assert.ok(absDiff(grossFor(nc), grossFor(nt) * 10n) <= 20n, 'buy gross within 2 µcr (fee inside)');
      const gc = sellOut(c, out), gt = sellOut(t, out);
      assert.ok(absDiff(gc, gt * 10n) <= 10n, 'sell grossOut within 1 µcr (pre-fee)');
      assert.ok(absDiff(sellNet(gc), sellNet(gt) * 10n) <= 20n, 'sell net within 2 µcr (fee inside)');
    }
    assert.ok(absDiff(marketCap(c, SUPPLY), marketCap(t, SUPPLY) * 10n) <= 10n, 'market cap within 1 µcr');
    for (const amount of [1n, 37n, 250n, 999n]) {
      assert.equal(buyOut(c, amount * 10n * ONE), buyOut(t, amount * ONE), 'exact-in outputs are equal before fees');
    }
  }
});

test('the token bar reads half full when only about a fifth of the credits are in; the credits bar is clamped at 100%', () => {
  const c = newCurve(classic);
  const out = classic.R0 / 2n;
  applyBuy(c, netForOut(c, out), out);
  const p = progress(c, classic);
  assert.equal(p.tokensBps, 5000);
  assert.equal(fmt(c.realQuote, 6), '1,758.666569', 'the plan’s 1,758.666569 of 8,500.535906');
  assert.equal(p.creditsBps, 2068);
  const over = { ...newCurve(classic), R: 0n, realQuote: graduationRaise(classic) + 1_050n };
  assert.equal(progress(over, classic).creditsBps, 10_000, 'rounding creep past Qgrad still reads 100%');
});

test('10,000 seeded trades: k never falls, round trips lose at least the fees, reserves stay sound', () => {
  const rng = prng('curve-fuzz');
  const c = newCurve(classic);
  const held = [];
  let k = c.Q * c.B;
  for (let i = 0; i < 10_000; i++) {
    if (held.length && rng.chance(0.45)) {
      const j = rng.int(held.length);
      const baseIn = held[j];
      applySell(c, baseIn, sellOut(c, baseIn));
      held.splice(j, 1);
    } else {
      const net = netOfRate(BigInt(1 + rng.int(400)) * ONE, R_CURVE);
      const out = buyOut(c, net);
      if (out >= c.R) continue;
      applyBuy(c, net, out);
      held.push(out);
    }
    assert.ok(c.Q * c.B >= k, `k never decreases (trade ${i})`);
    k = c.Q * c.B;
    assert.ok(c.R >= 0n && c.R <= classic.R0);
    // The curve always holds enough to buy back every outstanding token at curve prices.
    const outstanding = held.reduce((s, x) => s + x, 0n);
    assert.ok(c.realQuote >= sellOut({ ...c }, outstanding) - 1n, `curve stays solvent (trade ${i})`);
  }
  // Round trip: buy then sell at once returns at most the gross less both fees.
  for (const quote of [1n * ONE, 200n * ONE, 5_000n * ONE]) {
    const fresh = newCurve(classic);
    const net = netOfRate(quote, R_CURVE);
    const out = buyOut(fresh, net);
    applyBuy(fresh, net, out);
    const grossOut = sellOut(fresh, out);
    const sellFee = ceilDiv(grossOut * R_CURVE, D);
    assert.ok(grossOut <= net, 'the curve never pays back more than it took, so a round trip loses at least both fees');
    assert.ok(sellFee > 0n);
  }
});

test('fee config: 25 pool tiers in millionths with half-bps rows, thresholds rising from 0', () => {
  assert.equal(D, 1_000_000n);
  assert.equal(CONFIG.feeDenominator, D);
  assert.deepEqual({ ...CURVE_FEES }, { creator: 3000, house: 9500, lp: 0 });
  assert.equal(POOL_TIERS.length, 25);
  assert.deepEqual({ ...POOL_TIERS[0] }, { from: 0n, creator: 3000, house: 9300, lp: 200 });
  assert.deepEqual({ ...POOL_TIERS[1] }, { from: 420n, creator: 9500, house: 500, lp: 2000 });
  assert.equal(POOL_TIERS[15].creator, 2750, 'tier 16: 27.5 bps');
  assert.equal(POOL_TIERS[19].from, 73_681n, 'tier 20 threshold copied as printed');
  assert.deepEqual({ ...POOL_TIERS[24] }, { from: 98_240n, creator: 500, house: 500, lp: 2000 });
  for (let i = 1; i < POOL_TIERS.length; i++) assert.ok(POOL_TIERS[i].from > POOL_TIERS[i - 1].from);
  const end = marketCap({ Q: classic.Q0 + graduationRaise(classic), B: classic.B0 - classic.R0 }, SUPPLY);
  assert.ok(end < POOL_TIERS[1].from * ONE * classic.scale, 'a new pool opens in tier 1, as on Pump');
});

test('the configuration hash is a 64-bit hex digest and covers the fee table', () => {
  assert.match(configHash(), /^[0-9a-f]{16}$/);
  const edited = { ...CONFIG, poolTiers: POOL_TIERS.map((t, i) => (i === 15 ? { ...t, creator: 2700 } : t)) };
  assert.notEqual(configHash(edited), configHash());
});
