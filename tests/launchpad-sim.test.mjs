import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runScenario, createSim, checkRecord } from '../src/lib/launchpad/sim.mjs';
import { SUPPLY, POOL_BASE, RULES } from '../src/lib/launchpad/config.mjs';
import { eventsHash } from '../src/lib/launchpad/engine.mjs';

const load = (id) => JSON.parse(readFileSync(new URL(`../src/data/launchpad/scenarios/${id}.json`, import.meta.url), 'utf8'));
const IDS = ['quiet-launch', 'snipe-war', 'dev-dump', 'graduation-run'];

// Pinned event-log hashes, one per scenario under each rule set the board offers. A change here means the
// engine, a strategy, the gate or a scenario changed behavior: re-pin on purpose.
const PINNED = {
  'quiet-launch': { naked: '150a4a131a7122b0', auction: 'e311f6e8a05c6fd7', 'sniper-fee': '3c946d3a88578214', fair: '00c2851e027dd21d' },
  'snipe-war': { naked: '5fec2a1e43691582', auction: '24ec1bfb0837f1a1', 'sniper-fee': 'c7b799bc220bf1d5', fair: '806b96bafead9e85' },
  'dev-dump': { naked: '3a9e27d90d4f1380', auction: 'ff5bc4f5c6c2ea0c', 'sniper-fee': 'a681f585777e6629', fair: '697bfebf1f44733c' },
  'graduation-run': { naked: '39b6dc0fae4a5560', auction: 'aeff42a1c1f7322d', 'sniper-fee': '0b2903b8f134a943', fair: '524787e22a161c7e' },
};

test('every scenario under every rule set is deterministic, conserves credits and tokens, and matches its pinned hash', () => {
  assert.deepEqual(Object.keys(PINNED['quiet-launch']).sort(), Object.keys(RULES).sort(), 'every rule set the board offers is pinned');
  for (const id of IDS) {
    for (const rules of Object.keys(RULES)) {
      const a = runScenario({ scenario: load(id), rules });
      const b = runScenario({ scenario: load(id), rules });
      assert.equal(a.summary.logHash, b.summary.logHash, `${id}/${rules} is deterministic`);
      assert.equal(a.summary.logHash, PINNED[id][rules], `${id}/${rules} hash is pinned`);
      assert.equal(a.summary.quoteConserved, true, `${id}/${rules} conserves credits`);
      assert.equal(a.summary.approvals, 'deny');
      for (const coin of a.sim.world.coins.values()) {
        const held = [...coin.holders.values()].reduce((s, x) => s + x, 0n);
        assert.equal(held + (coin.pool ? coin.pool.base : coin.curve.R + POOL_BASE), SUPPLY, `${id}/${rules} ${coin.symbol} conserves tokens`);
      }
    }
  }
});

// The live board asks the viewer about trades above a bot's approval line by default ('queue'), so those runs are pinned
// too: a board run with no presses ends on these hashes. quiet-launch has no such trades, so its hashes match 'deny'.
const PINNED_QUEUE = {
  'quiet-launch': { naked: '150a4a131a7122b0', auction: 'e311f6e8a05c6fd7', 'sniper-fee': '3c946d3a88578214', fair: '00c2851e027dd21d' },
  'snipe-war': { naked: '030d3a92aa90222d', auction: '5ea373ab5e62ab0f', 'sniper-fee': 'ad58c2e61c1a430a', fair: 'd06d29d0cf96105f' },
  'dev-dump': { naked: '6dd7968b52f5718c', auction: '0c6f7f4137adf25b', 'sniper-fee': 'edf9366f32270d4e', fair: '561208729b47078f' },
  'graduation-run': { naked: '9dbf2b32ca85342a', auction: '8ec4602ec3c9f02f', 'sniper-fee': 'b840d1639ead6319', fair: '0f69d69188d2448b' },
};

test('with approvals queued for a person, every run is pinned too, conserves credits, and queues instead of refusing', () => {
  for (const id of IDS) {
    for (const rules of Object.keys(RULES)) {
      const { sim, summary } = runScenario({ scenario: load(id), rules, approvals: 'queue' });
      assert.equal(summary.logHash, PINNED_QUEUE[id][rules], `${id}/${rules} queue hash is pinned`);
      assert.equal(summary.quoteConserved, true);
      assert.ok(!sim.world.events.some((e) => e.type === 'GATE_REFUSE' && e.reason === 'NEEDS_APPROVAL'), `${id}/${rules}: nothing is refused for want of approval`);
    }
  }
});

test('A/B: fair rules cut the snipers’ share of first-minute supply by at least half', () => {
  const naked = runScenario({ scenario: load('snipe-war'), rules: 'naked' });
  const fair = runScenario({ scenario: load('snipe-war'), rules: 'fair' });
  const n = naked.summary.coins[0].sniperShare, f = fair.summary.coins[0].sniperShare;
  assert.ok(n > 0.3, `snipers take a large share under naked rules (${n})`);
  assert.ok(f <= n * 0.5, `fair rules at least halve it (${n} → ${f})`);
  for (const b of naked.summary.bots.filter((x) => x.strategy === 'sniper')) {
    assert.ok(b.fills >= 1, `${b.id} trades unattended under its own policy`);
    assert.deepEqual(b.rejects, {}, `${b.id} passes its gate`);
    assert.equal(b.engineRejects.SLIPPAGE ?? 0, 0, `${b.id} makes its 3000 bps floor`);
  }
});

test('headless runs deny approvals: Momentum’s 30 cr buys record NEEDS_APPROVAL refusals under the defaults', () => {
  const { sim, summary } = runScenario({ scenario: load('dev-dump') });
  const refusals = sim.world.events.filter((e) => e.type === 'GATE_REFUSE' && e.reason === 'NEEDS_APPROVAL');
  assert.ok(refusals.length > 0);
  assert.ok(refusals.every((e) => /^momentum-\d:\d+:\d+$/.test(e.intent)), 'intent ids are bot:tick:n');
  assert.ok(summary.bots.filter((b) => b.strategy === 'momentum').every((b) => b.rejects.NEEDS_APPROVAL > 0 && b.fills === 0));
  const grad = runScenario({ scenario: load('graduation-run') }).summary;
  assert.ok(grad.bots.find((b) => b.id === 'momentum-1').fills > 0, 'graduation-run raises momentum-1’s approval line so its copy-trader has something to follow');
});

test('graduation-run: the busy coin graduates into a burned-LP pool and keeps trading there', () => {
  const { sim, summary } = runScenario({ scenario: load('graduation-run') });
  const moon = summary.coins.find((c) => c.symbol === 'MOON');
  assert.equal(moon.status, 'migrated');
  const coin = sim.world.coins.get(moon.id);
  assert.equal(coin.pool.lpBurned, coin.pool.lpSupply);
  assert.ok(sim.index.trades.get(moon.id).some((t) => t.tick > moon.completeTick && t.kind === 'TRADE'), 'trades continue in the pool');
  assert.ok(sim.index.trades.get(moon.id).some((t) => t.wallet === 'copy-1'), 'the copy-trader follows its leader');
  assert.equal(moon.raised, sim.world.events.find((e) => e.type === 'COMPLETE' && e.coin === moon.id).raised, 'credits raised is the curve raise, not the pool depth');
  const crossing = sim.world.events.findIndex((e) => e.type === 'COMPLETE');
  assert.deepEqual(sim.world.events.slice(crossing - 1, crossing + 2).map((e) => e.type), ['TRADE', 'COMPLETE', 'MIGRATE']);
});

test('the human log: kills withdraw auction orders, replays reproduce viewer actions, records are validated', () => {
  const fair = createSim({ scenario: load('snipe-war'), rules: 'fair' });
  fair.run(7);
  const coin = fair.world.coins.get('c1');
  assert.ok(coin.orders.has('snipe-1'), 'the sniper ordered into the auction');
  const before = fair.world.wallets.get('snipe-1').credits;
  fair.kill('snipe-1');
  fair.step();
  assert.ok(!coin.orders.has('snipe-1'));
  assert.ok(fair.world.wallets.get('snipe-1').credits > before, 'order and priority fee refunded');
  fair.run(20);
  assert.equal(coin.holders.get('snipe-1') ?? 0n, 0n, 'no fill after the kill');

  const log = [
    { tick: 3, type: 'launch', wallet: 'you', symbol: 'PUMP', name: 'Pump It', nounId: 12 },
    { tick: 4, type: 'launch', wallet: 'you', symbol: 'KITE', name: 'Kite Day', nounId: 12, devBuy: '10' },
    { tick: 6, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1', quote: '25', slippageBps: 800 },
    { tick: 9, type: 'trade', wallet: 'you', side: 'sell', coin: 'c1', base: '1000000' },
    { tick: 9, type: 'kill', bot: '*' },
  ];
  const live = createSim({ scenario: load('quiet-launch') });
  for (const rec of log) { while (live.world.tick < rec.tick) live.step(); live.record(rec); }
  live.run(40);
  const replay = createSim({ scenario: load('quiet-launch'), humanLog: log });
  replay.run(live.world.tick);
  assert.equal(eventsHash(replay.world.events), eventsHash(live.world.events), 'a replay of the human log reproduces the live run');
  const refused = live.world.events.find((e) => e.type === 'ENGINE_REFUSE' && e.side === 'launch');
  assert.equal(refused.reason, 'FILTERED', 'a coin called PUMP never renders');
  const kite = [...live.world.coins.values()].find((c) => c.symbol === 'KITE');
  assert.equal(kite.id, 'c1', 'the viewer’s coin launches before the scenario’s PORCH at tick 10');
  assert.equal(live.world.events.find((e) => e.type === 'CREATE' && e.coin === 'c1').viewerMade, true);
  assert.equal(live.world.events.find((e) => e.type === 'CREATE' && e.coin === 'c2').viewerMade, false);
  assert.ok(live.world.events.some((e) => e.type === 'TRADE' && e.wallet === 'you' && e.side === 'sell'));
  assert.ok(live.killedAll);
  assert.throws(() => checkRecord({ tick: 1, type: 'tip', bot: 'x' }), /unknown/);
  assert.throws(() => checkRecord({ tick: -1, type: 'kill', bot: 'x' }));
  assert.throws(() => checkRecord({ tick: 1, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1' }), /malformed/);
  assert.throws(() => createSim({ scenario: load('quiet-launch'), approvals: 'maybe' }));
  const hijack = createSim({ scenario: load('quiet-launch'), humanLog: [{ tick: 20, type: 'trade', wallet: 'mm-1', side: 'buy', coin: 'c1', quote: '5' }] });
  hijack.run(25);
  assert.deepEqual(hijack.humanRejects.map((r) => r.reason), ['NOT_HUMAN'], 'a viewer record cannot trade from a bot’s wallet');
});

test('several intents from one bot in one tick are checked one after another', () => {
  const multi = { id: 'multi', seed: 'm', ticks: 5, launches: ['AAA', 'BBB', 'CCC'].map((symbol, i) => ({ tick: 1, symbol, name: symbol, nounId: i + 1 })),
    bots: [{ id: 's', strategy: 'sniper', credits: '1000', policy: { maxPerTrade: '150', maxSlippageBps: 3000, maxPositionBps: 900, maxTradesPerWindow: 1, cooldownTicks: 0, approvalAbove: '150', windowCap: { amount: '150', ticks: 3600 } } }] };
  const m = createSim({ scenario: multi });
  m.run(3);
  assert.equal(m.bots[0].fills, 1, 'one grant per window, not one per intent');
  assert.equal(m.bots[0].rejects.RATE, 2);
});
