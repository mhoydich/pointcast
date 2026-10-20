import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRENDING } from '../src/lib/launchpad/config.mjs';
import { prng } from '../src/lib/launchpad/prng.mjs';
import { runScenario, createSim } from '../src/lib/launchpad/sim.mjs';
import { candles, metrics, trending, scoreTrending, kingOfTheHill, risk, isLive, ingest } from '../src/lib/launchpad/screener.mjs';
import { buy, sell } from '../src/lib/launchpad/engine.mjs';
import { units } from '../src/lib/launchpad/units.mjs';

const load = (id) => JSON.parse(readFileSync(new URL(`../src/data/launchpad/scenarios/${id}.json`, import.meta.url), 'utf8'));
const CLEAN = { dev: 0, bundle: 0, top10: 0.2 };

function randomRow(rng, id) {
  return {
    id, symbol: id, age: 120 + rng.int(40_000), boosts: 0, parts: { ...CLEAN },
    inputs: { breadth: rng.range(0, 5), organic: rng.range(0, 4), txns: rng.int(60), change: rng.range(-0.5, 2), holders: rng.range(-0.2, 1), liquidity: rng.range(0, 9), reactions: 0 },
  };
}

test('candles: OHLC comes from the trades, opens on the previous close and closes on the last trade', () => {
  const { sim } = runScenario({ scenario: load('graduation-run') });
  const coin = sim.world.coins.get('c1');
  const cs = candles(sim.index, sim.world, coin, 60);
  const prices = sim.index.prices.get('c1');
  const trades = sim.index.trades.get('c1').filter((t) => t.price != null);
  assert.equal(cs[0].o, prices[0]);
  assert.equal(cs.at(-1).c, prices.at(-1));
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (i) assert.equal(c.o, cs[i - 1].c, 'each candle opens at the previous close');
    assert.ok(c.l <= Math.min(c.o, c.c) && c.h >= Math.max(c.o, c.c));
    const inside = trades.filter((t) => t.tick >= c.t && t.tick < c.t + 60);
    if (inside.length) {
      assert.equal(c.c, inside.at(-1).price);
      assert.equal(c.h, Math.max(c.o, ...inside.map((t) => t.price)));
      assert.equal(c.l, Math.min(c.o, ...inside.map((t) => t.price)));
    }
  }
});

test('trending is deterministic, ranks live coins only, and z is 0 with one live coin', () => {
  const a = runScenario({ scenario: load('graduation-run') }).sim;
  const b = runScenario({ scenario: load('graduation-run') }).sim;
  const ra = trending(a.index, a.world), rb = trending(b.index, b.world);
  assert.deepEqual(ra, rb);
  assert.deepEqual(ra.map((r) => r.symbol), ['GRID'], 'MOON graduated, so it is listed under Graduated, not ranked');
  assert.ok([...a.world.coins.values()].filter(isLive).every((c) => ra.some((r) => r.id === c.id)));
  assert.equal(ra[0].base, 0, 'one live coin: every z is 0');
  assert.equal(ra[0].strength, Math.log(2));
  for (const k of ['breadth', 'organic', 'txns', 'change', 'holders', 'liquidity']) assert.ok(Number.isFinite(ra[0].inputs[k]), `logs ${k}`);
  assert.equal(ra[0].age, a.world.tick - a.world.coins.get(ra[0].id).openTick, 'age counts from trading open');
  const early = createSim({ scenario: load('graduation-run') });
  early.run(1600);
  assert.equal(trending(early.index, early.world).length, 1, 'only the coin still on its curve');
});

test('a flagged coin never outranks an otherwise identical clean coin; scores stay positive', () => {
  const rng = prng('trust');
  for (let i = 0; i < 300; i++) {
    const others = Array.from({ length: 1 + rng.int(6) }, (_, k) => randomRow(rng, `o${k}`));
    const clean = randomRow(rng, 'clean');
    const flagged = { ...clean, id: 'flagged', symbol: 'flagged', parts: { dev: rng.chance(0.5) ? 0.15 : 0, bundle: 0.25, top10: rng.chance(0.5) ? 0.7 : 0.2 } };
    const ranked = scoreTrending([...others, clean, flagged], TRENDING);
    const pos = (id) => ranked.findIndex((r) => r.id === id);
    assert.ok(pos('clean') < pos('flagged'));
    for (const r of ranked) assert.ok(r.score > 0 && r.strength > 0);
  }
});

test('age: past the warm-up the older coin never outranks the younger, and the age factor only lowers a score', () => {
  const rng = prng('age');
  for (let i = 0; i < 300; i++) {
    const others = Array.from({ length: 1 + rng.int(5) }, (_, k) => randomRow(rng, `o${k}`));
    const young = randomRow(rng, 'young');
    const a = 120 + rng.int(20_000);
    const b = a + 1 + rng.int(60_000);
    young.age = a;
    const old = { ...young, id: 'old', symbol: 'old', age: b };
    const ranked = scoreTrending([...others, young, old], TRENDING);
    assert.ok(ranked.findIndex((r) => r.id === 'young') < ranked.findIndex((r) => r.id === 'old'));
    for (const age of [0, 5, 30, 119, 120, 3600, 86_400]) {
      const [row] = scoreTrending([{ ...young, age }], TRENDING);
      assert.ok(row.score <= row.boost * row.trust * row.strength, `age ${age}`);
    }
  }
});

test('boosts never lower a coin’s rank, and the boost factor is capped at 2', () => {
  const rng = prng('boost');
  for (let i = 0; i < 300; i++) {
    const rows = Array.from({ length: 2 + rng.int(6) }, (_, k) => randomRow(rng, `c${k}`));
    const target = rows[rng.int(rows.length)].id;
    const before = scoreTrending(rows, TRENDING).findIndex((r) => r.id === target);
    const boosted = rows.map((r) => (r.id === target ? { ...r, boosts: 1 + rng.int(100) } : r));
    const after = scoreTrending(boosted, TRENDING).findIndex((r) => r.id === target);
    assert.ok(after <= before);
  }
  assert.equal(scoreTrending([{ ...randomRow(prng('b'), 'x'), boosts: 10_000 }], TRENDING)[0].boost, 2);
});

test('dev-dump: DEV_DUMP and BUNDLED fire under naked rules; dev% is the creator wallet only and devSold is over peak holdings', () => {
  const { sim, summary } = runScenario({ scenario: load('dev-dump'), rules: 'naked' });
  const coin = sim.world.coins.get('c1');
  const r = risk(sim.index, sim.world, coin);
  assert.ok(r.flags.includes('DEV_DUMP') && r.flags.includes('BUNDLED'), `flags: ${r.flags}`);
  assert.equal(summary.coins[0].risk.badge, 'high', 'hard flags raise the badge');
  assert.equal(r.parts.dev, Number(coin.holders.get(coin.creator) ?? 0n) / 1e15, 'dev% counts the creator wallet only');
  assert.equal(r.parts.dev, 0, 'the creator sold everything');
  assert.equal(r.parts.devSold, 1, 'it sold all of its peak holdings');
  assert.ok(r.parts.bundle > 0.05 && r.parts.bundle < 0.2, `bundle% ${r.parts.bundle}`);
  // Before the dump, the bundle is already visible and the dev holds about 5%.
  const early = createSim({ scenario: load('dev-dump') });
  early.run(60);
  const m = metrics(early.index, early.world, early.world.coins.get('c1'));
  assert.ok(m.risk.flags.includes('BUNDLED') && !m.risk.flags.includes('DEV_DUMP'));
  assert.ok(m.risk.parts.dev > 0.04 && m.risk.parts.dev <= 0.05001);
  // Under fair rules the bundle becomes capped auction orders, which never count, and the dev cannot sell.
  const fair = runScenario({ scenario: load('dev-dump'), rules: 'fair' }).summary.coins[0].risk;
  assert.deepEqual(fair.flags.filter((f) => f === 'BUNDLED' || f === 'DEV_DUMP'), []);
  assert.equal(fair.parts.bundle, 0);
});

test('king of the hill is a coin still on its curve with at least half the raise in', () => {
  const sim = createSim({ scenario: load('graduation-run') });
  let seen = 0;
  for (let t = 0; t < 2400; t += 50) {
    sim.run(50);
    const king = kingOfTheHill(sim.index, sim.world);
    if (!king) continue;
    seen += 1;
    const coin = sim.world.coins.get(king.id);
    assert.equal(coin.status, 'curve');
    assert.ok(metrics(sim.index, sim.world, coin).progress.creditsBps >= 5000);
  }
  assert.ok(seen > 0, 'MOON holds the hill on its way to graduation');
});

test('devSold is measured against peak holdings, not against everything bought', () => {
  const sim = createSim({ scenario: { id: 'peak', seed: 'p', ticks: 10, launches: [{ tick: 0, symbol: 'PEAK', name: 'Peak', nounId: 5, devBuy: '50' }] } });
  sim.step();
  const { world, index } = sim;
  const first = world.wallets.get('dev1').positions.get('c1').base;
  assert.ok(sell(world, { wallet: 'dev1', coin: 'c1', baseIn: first / 2n }).ok);
  assert.ok(buy(world, { wallet: 'dev1', coin: 'c1', quoteIn: units('50') }).ok);
  ingest(index, world);
  const p = world.wallets.get('dev1').positions.get('c1');
  const r = risk(index, world, world.coins.get('c1'));
  assert.equal(r.parts.devSold, Number(p.sold) / Number(p.maxBase));
  assert.notEqual(r.parts.devSold, Number(p.sold) / Number(p.bought));
  assert.ok(!r.flags.includes('DEV_DUMP'), 'selling half of the peak is not a dump');
});
