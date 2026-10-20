import test from 'node:test';
import assert from 'node:assert/strict';
import { units } from '../src/lib/launchpad/units.mjs';
import { SUPPLY } from '../src/lib/launchpad/config.mjs';
import { GATE_REASONS, DEFAULT_POLICY, loadPolicy, patchPolicy, newGateState, check, record, auctionFilled } from '../src/lib/launchpad/gate.mjs';
import { prng } from '../src/lib/launchpad/prng.mjs';
import { createWorld, addWallet, launch, estimateOut, eventsHash } from '../src/lib/launchpad/engine.mjs';
import { createSim, checkRecord } from '../src/lib/launchpad/sim.mjs';

const ctx = (over = {}) => ({ tick: 10, credits: units('1000'), held: 0n, estOut: 1_000_000n, supply: SUPPLY, coinCreator: 'dev', killed: false, ...over });
const buyIntent = (over = {}) => ({ side: 'buy', coin: 'c1', quoteIn: units('10'), maxSlippageBps: 300, priorityFeeBps: 0, ...over });
const SNIPER_POLICY = { maxPerTrade: '100', maxPositionBps: 350, maxSlippageBps: 3000, approvalAbove: '100' };

test('every reason code fires, in the documented order', () => {
  const fired = new Set();
  const cases = [
    ['KILLED', loadPolicy({ killed: true }), buyIntent(), ctx()],
    ['KILLED', loadPolicy(), buyIntent(), ctx({ killed: true })],
    ['EXPIRED', loadPolicy({ expiresAtTick: 10 }), buyIntent(), ctx()],
    ['BLOCKED_COIN', loadPolicy({ blockedCoins: ['c1'], permittedCoins: ['c2'] }), buyIntent(), ctx()],
    ['NOT_PERMITTED', loadPolicy({ permittedCoins: ['c2'] }), buyIntent(), ctx()],
    ['NOT_PERMITTED', loadPolicy({ permittedCreators: ['someone'] }), buyIntent(), ctx()],
    ['PER_TRADE', loadPolicy(), buyIntent({ quoteIn: units('50.000001') }), ctx()],
    ['POSITION', loadPolicy(), buyIntent(), ctx({ held: SUPPLY / 50n })],
    ['SLIPPAGE', loadPolicy(), buyIntent({ maxSlippageBps: 801 }), ctx()],
    ['PRIORITY_FEE', loadPolicy(), buyIntent({ priorityFeeBps: 51 }), ctx()],
    ['PRIORITY_FEE', loadPolicy(), buyIntent({ priorityFeeBps: 1.5 }), ctx()],
    ['CREDITS', loadPolicy(), buyIntent(), ctx({ credits: units('9.999999') })],
    ['NEEDS_APPROVAL', loadPolicy(), buyIntent({ quoteIn: units('30') }), ctx()],
  ];
  for (const [want, policy, intent, c] of cases) {
    assert.equal(check(policy, newGateState(), intent, c), want);
    fired.add(want);
  }
  const p = loadPolicy();
  const cooled = newGateState();
  record(p, cooled, 6, units('10'));
  assert.equal(check(p, cooled, buyIntent(), ctx()), 'COOLDOWN', 'a grant 4 ticks ago is inside the 5-tick cooldown');
  assert.equal(check(p, cooled, buyIntent(), ctx({ tick: 11 })), null, 'and 5 ticks later it is not');
  fired.add('COOLDOWN');
  const busy = newGateState();
  const rate = loadPolicy({ maxTradesPerWindow: 2, cooldownTicks: 0 });
  record(rate, busy, 1, 0n); record(rate, busy, 2, 0n);
  assert.equal(check(rate, busy, { side: 'sell', coin: 'c1', baseIn: 5n, maxSlippageBps: 300 }, ctx()), 'RATE', 'sells count toward the rate too');
  fired.add('RATE');
  const spender = newGateState();
  const window = loadPolicy({ cooldownTicks: 0, windowCap: { amount: '25', ticks: 100 } });
  record(window, spender, 1, units('20'));
  assert.equal(check(window, spender, buyIntent(), ctx()), 'WINDOW_CAP');
  assert.equal(check(window, spender, buyIntent(), ctx({ tick: 101 })), null, 'the window rolls: (tick − ticks, tick]');
  fired.add('WINDOW_CAP');
  assert.deepEqual([...fired].sort(), [...GATE_REASONS].sort());
  assert.equal(check(loadPolicy({ killed: true, expiresAtTick: 1, blockedCoins: ['c1'] }), newGateState(), buyIntent({ quoteIn: units('999'), priorityFeeBps: 999 }), ctx({ credits: 0n })), 'KILLED', 'the first failing check wins');
  assert.equal(check(loadPolicy(), newGateState(), buyIntent({ quoteIn: units('25') }), ctx()), null, '“above” is strictly greater: 25 cr needs no approval');
  assert.equal(check(loadPolicy(), newGateState(), buyIntent({ quoteIn: units('30') }), ctx({ approved: true })), null, 'an approved intent skips NEEDS_APPROVAL');
});

test('defaults follow the plan: approval at 25 cr under a 50 cr trade cap, and buys are valued at their gross', () => {
  assert.equal(DEFAULT_POLICY.approvalAbove, '25');
  assert.equal(DEFAULT_POLICY.rev, 0);
  const p = loadPolicy();
  assert.ok(p.approvalAbove < p.maxPerTrade, 'approval can fire before the trade cap');
  // A priority fee is inside quoteIn, so a 50 cr buy with a fee sits exactly at the cap, not over it.
  assert.equal(check(loadPolicy({ approvalAbove: '50' }), newGateState(), buyIntent({ quoteIn: units('50'), priorityFeeBps: 50 }), ctx()), null);
  assert.equal(check(p, newGateState(), buyIntent({ quoteIn: units('100') }), ctx({ gross: units('30'), estOut: 0n })), 'NEEDS_APPROVAL', 'an auction order is valued at what it can still place');
});

test('the Sniper’s own policy admits its 100 cr buy (30 bps priority fee inside) with 3000 bps slippage; the defaults do not', () => {
  const w = createWorld();
  addWallet(w, { id: 'dev', credits: units('100') });
  addWallet(w, { id: 'snipe', credits: units('1000') });
  const { coin } = launch(w, { creator: 'dev', symbol: 'BOLT', name: 'Lightning Bolt', nounId: 82 });
  const intent = buyIntent({ coin: coin.id, quoteIn: units('100'), priorityFeeBps: 30, maxSlippageBps: 3000 });
  const estOut = estimateOut(w, coin.id, 'snipe', intent.quoteIn, 30);
  assert.equal(estOut, 34_101_382_389_096n, '3.41% of supply at curve start');
  assert.equal(check(loadPolicy(SNIPER_POLICY), newGateState(), intent, ctx({ estOut })), null);
  assert.equal(check(loadPolicy({ ...SNIPER_POLICY, maxPositionBps: 341 }), newGateState(), intent, ctx({ estOut })), 'POSITION', '342 bps is the smallest cap that admits it');
  assert.equal(check(loadPolicy({ ...SNIPER_POLICY, maxPositionBps: 342 }), newGateState(), intent, ctx({ estOut })), null);
  assert.equal(check(loadPolicy(), newGateState(), intent, ctx({ estOut })), 'PER_TRADE');
});

test('policies refuse unknown keys and bad values; edits bump rev and may not set it', () => {
  assert.throws(() => loadPolicy({ v: 2 }));
  assert.throws(() => loadPolicy({ cooldownTicks: -1 }));
  assert.throws(() => loadPolicy({ windowCap: { ticks: 0 } }));
  assert.throws(() => loadPolicy({ windowCap: { amont: '5' } }), /windowCap\.amont/);
  assert.throws(() => loadPolicy({ permittedCoins: 'c1' }));
  assert.throws(() => loadPolicy({ maxPerTrade: 'lots' }));
  assert.throws(() => loadPolicy({ killed: 'yes' }));
  assert.throws(() => loadPolicy({ maxPositoinBps: 10 }), /unknown policy key/);
  assert.equal(loadPolicy({ rev: 3 }).rev, 3);
  const edit = patchPolicy({ maxPerTrade: '40' }, { approvalAbove: '30', windowCap: { amount: '100' } });
  assert.equal(edit.policy.rev, 1);
  assert.equal(edit.policy.windowCap.ticks, 3600);
  assert.equal(edit.policy.windowCap.amount, units('100'));
  assert.equal(patchPolicy(edit.raw, { cooldownTicks: 1 }).policy.rev, 2);
  assert.throws(() => patchPolicy({}, { rev: 9 }));
  assert.throws(() => patchPolicy({}, { v: 1 }));
  assert.throws(() => patchPolicy({}, { cooldownTicks: -2 }));
});

test('fuzz: over 5,000 ticks no bot exceeds a cap, counting pending grants in the same tick', () => {
  const rng = prng('gate-fuzz');
  const policy = loadPolicy({ maxPerTrade: '40', windowCap: { amount: '200', ticks: 300 }, maxTradesPerWindow: 15, cooldownTicks: 0, approvalAbove: '40' });
  const state = newGateState();
  let credits = units('400');
  const fills = [];
  for (let t = 0; t < 5000; t++) {
    let pending = 0n;
    const granted = [];
    for (let k = 0; k < 1 + rng.int(4); k++) {
      const intent = buyIntent({ quoteIn: units(String(1 + rng.int(60))) });
      if (check(policy, state, intent, ctx({ tick: t, credits: credits - pending })) !== null) continue;
      const undo = record(policy, state, t, intent.quoteIn);
      pending += intent.quoteIn;
      granted.push({ t, q: intent.quoteIn, undo });
    }
    assert.ok(pending <= credits, `pending grants never exceed credits held (tick ${t})`);
    for (const g of granted) {
      if (rng.chance(0.2)) g.undo(); // the engine refused it
      else { credits -= g.q; fills.push(g); }
    }
    if (t % 400 === 0) credits += units('300');
  }
  assert.ok(fills.length > 100, `${fills.length} fills`);
  for (const { t, q } of fills) {
    assert.ok(q <= policy.maxPerTrade);
    const inWindow = fills.filter((x) => x.t <= t && t - x.t < 300);
    assert.ok(inWindow.reduce((s, x) => s + x.q, 0n) <= policy.windowCap.amount, `window cap at ${t}`);
    assert.ok(inWindow.length <= policy.maxTradesPerWindow, `rate at ${t}`);
  }
  const cooled = loadPolicy({ cooldownTicks: 3 });
  const cs = newGateState();
  const ticks = [];
  for (let t = 0; t < 500; t++) if (check(cooled, cs, buyIntent(), ctx({ tick: t })) === null) { record(cooled, cs, t, units('10')); ticks.push(t); }
  for (let i = 1; i < ticks.length; i++) assert.ok(ticks[i] - ticks[i - 1] >= 3, 'cooldown respected');
});

test('an auction fill counts for COOLDOWN and RATE at the clearing tick; an undone grant does not count', () => {
  const p = loadPolicy({ cooldownTicks: 5, maxTradesPerWindow: 1, windowCap: { amount: '500', ticks: 20 } });
  const s = newGateState();
  record(p, s, 2, units('30'), { coin: 'c1', auction: true });
  auctionFilled(s, 'c1', 15);
  assert.equal(s.lastTick, 15);
  assert.equal(check(p, s, buyIntent(), ctx({ tick: 19 })), 'COOLDOWN');
  assert.equal(check(p, s, buyIntent(), ctx({ tick: 30 })), 'RATE', 'the fill sits in the window from the clearing tick');
  const u = newGateState();
  record(p, u, 1, units('10'));
  record(p, u, 4, units('10'))();
  assert.equal(u.lastTick, 1);
  assert.equal(u.trades.length, 1);
});

const killScenario = {
  id: 'kill', seed: 'k', ticks: 50, launches: [{ tick: 1, symbol: 'KILL', name: 'Kill Switch', nounId: 3 }],
  bots: [{ id: 'a', strategy: 'sniper', credits: '500', policy: SNIPER_POLICY }, { id: 'b', strategy: 'sniper', credits: '500', policy: SNIPER_POLICY }],
};

test('a kill takes effect in the same tick, only for that bot, enters the human log and changes the hash', () => {
  const sim = createSim({ scenario: killScenario });
  sim.step();
  sim.kill('a');
  sim.step();
  const a = sim.bots.find((x) => x.id === 'a');
  const b = sim.bots.find((x) => x.id === 'b');
  assert.equal(a.fills, 0);
  assert.equal(a.rejects.KILLED, 1);
  assert.equal(b.fills, 1);
  const kill = sim.world.events.find((e) => e.type === 'KILL');
  assert.deepEqual([kill.tick, kill.bot, kill.on], [1, 'a', true]);
  assert.ok(sim.world.events.findIndex((e) => e.type === 'KILL') < sim.world.events.findIndex((e) => e.type === 'GATE_REFUSE' && e.bot === 'a'));
  sim.killAll();
  sim.run(5);
  assert.equal(b.fills, 1, 'the global switch stops every bot');
  assert.deepEqual(sim.log.map((r) => [r.tick, r.type, r.bot]), [[1, 'kill', 'a'], [2, 'kill', '*']]);
  const replay = createSim({ scenario: killScenario, humanLog: sim.log });
  replay.run(7);
  const plain = createSim({ scenario: killScenario });
  plain.run(7);
  assert.equal(eventsHash(replay.world.events), eventsHash(sim.world.events), 'a replay of the log reproduces the run');
  assert.notEqual(eventsHash(plain.world.events), eventsHash(sim.world.events));
  assert.throws(() => sim.record({ tick: 0, type: 'kill', bot: 'a' }), /already ran/);
});

const queueScenario = {
  id: 'queue', seed: 'q', ticks: 80, launches: [{ tick: 1, symbol: 'LINE', name: 'Approval Line', nounId: 9 }],
  bots: [{ id: 'holder-1', strategy: 'holder', credits: '400', params: { minAge: 0, size: '30' } }],
};

test('approvals: deny by default, queue on request; an approved intent is re-gated and re-quoted when it runs', () => {
  const denied = createSim({ scenario: queueScenario });
  denied.run(3);
  assert.ok(denied.world.events.some((e) => e.type === 'GATE_REFUSE' && e.reason === 'NEEDS_APPROVAL' && e.intent === 'holder-1:1:0'), 'headless runs deny, as a hashed event');

  const sim = createSim({ scenario: queueScenario, approvals: 'queue', humanLog: [{ tick: 1, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1', quote: '600' }] });
  sim.run(2);
  assert.deepEqual(sim.queue.map((q) => q.id), ['holder-1:1:0']);
  const queued = sim.world.events.find((e) => e.type === 'QUEUED');
  assert.equal(queued.amount, units('30'));
  // The viewer's 600 cr buy at tick 1 moved the price far past the intent's 500 bps slippage; a stale quote would miss minOut.
  sim.approve('holder-1:1:0');
  sim.step();
  const types = sim.world.events.filter((e) => e.tick === 2).map((e) => e.type);
  assert.ok(types.includes('APPROVED'));
  const fill = sim.world.events.find((e) => e.type === 'TRADE' && e.wallet === 'holder-1');
  assert.equal(fill.tick, 2, 'the approved intent fills, at a fresh quote');
  assert.equal(sim.bots[0].fills, 1);
});

test('approvals: void after a policy rev change, after 30 ticks, and refused under another run key', () => {
  const sim = createSim({ scenario: queueScenario, approvals: 'queue' });
  sim.run(2);
  sim.editPolicy('holder-1', { approvalAbove: '40' });
  sim.approve('holder-1:1:0');
  sim.step();
  assert.ok(sim.world.events.some((e) => e.type === 'POLICY' && e.rev === 1));
  assert.ok(sim.world.events.some((e) => e.type === 'VOID' && e.intent === 'holder-1:1:0' && e.reason === 'POLICY'));
  assert.deepEqual(sim.humanRejects.map((r) => r.reason), ['NOT_QUEUED']);
  assert.equal(sim.bots[0].policy.rev, 1);

  const old = createSim({ scenario: queueScenario, approvals: 'queue' });
  old.run(2);
  old.record({ type: 'approve', intent: 'holder-1:1:0', runKey: 'queue|another-seed|naked|0000000000000000' });
  old.step();
  assert.deepEqual(old.humanRejects.map((r) => r.reason), ['RUN_KEY']);
  assert.ok(!old.world.events.some((e) => e.type === 'APPROVED'));
  old.run(30);
  assert.ok(old.world.events.some((e) => e.type === 'VOID' && e.intent === 'holder-1:1:0' && e.reason === 'EXPIRED' && e.tick === 31));
  assert.match(old.runKey, /^queue\|q\|naked\|[0-9a-f]{16}$/);
});

test('an approved intent is re-gated when it runs: a kill in between refuses it', () => {
  const sim = createSim({ scenario: queueScenario, approvals: 'queue' });
  sim.run(2);
  sim.approve('holder-1:1:0');
  sim.kill('holder-1');
  sim.step();
  assert.ok(sim.world.events.some((e) => e.type === 'APPROVED' && e.intent === 'holder-1:1:0'));
  assert.ok(sim.world.events.some((e) => e.type === 'GATE_REFUSE' && e.intent === 'holder-1:1:0' && e.reason === 'KILLED'));
  assert.equal(sim.bots[0].fills, 0);
});

test('two grants in one tick never take a bot past its position cap', () => {
  const scenario = { id: 'pos', seed: 'p', ticks: 10, launches: [{ tick: 1, symbol: 'AAA', name: 'Aaa', nounId: 1 }],
    bots: [{ id: 'h', strategy: 'holder', credits: '400', params: { minAge: 0, size: '30' }, policy: { cooldownTicks: 0, maxPositionBps: 150 } }] };
  const sim = createSim({ scenario, approvals: 'queue' });
  sim.run(3);
  assert.deepEqual(sim.queue.map((q) => q.id), ['h:1:0', 'h:2:0']);
  sim.approve('h:1:0');
  sim.approve('h:2:0');
  sim.step();
  const held = sim.world.wallets.get('h').positions.get('c1')?.base ?? 0n;
  assert.ok(held * 10_000n <= SUPPLY * 150n, `held ${held}`);
  assert.equal(sim.bots[0].fills, 1, 'the second grant is refused (POSITION), counting the first as pending');
});

test('stop then run again before the next tick leaves auction orders alone', () => {
  const sim = createSim({ scenario: killScenario, rules: 'fair' });
  sim.run(3);
  const coin = sim.world.coins.get('c1');
  assert.ok(coin.orders.has('a'));
  sim.kill('a');
  sim.kill('a', false);
  sim.step();
  assert.ok(coin.orders.has('a'), 'the order survives a kill that is undone in the same tick');
  sim.kill('a');
  sim.step();
  assert.ok(!coin.orders.has('a'), 'a kill that stands withdraws it');
  assert.equal(sim.bots[0].gate.trades.length, 0, 'and the withdrawn order’s grant no longer counts');
});

test('malformed log records are refused before they can reach a hashed event', () => {
  assert.throws(() => checkRecord({ tick: 1, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1', quote: '5', slippageBps: 12.5 }), /malformed/);
  assert.throws(() => checkRecord({ tick: 1, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1', quote: 'five' }), /malformed/);
  assert.throws(() => checkRecord({ tick: 1, type: 'launch', wallet: 'you', symbol: 'OK', name: 'Ok', nounId: 1, devBuy: 'lots' }), /malformed/);
  assert.throws(() => checkRecord({ tick: 1, type: 'policy', bot: 'a', patch: [] }), /malformed/);
  assert.throws(() => loadPolicy({ approvalAbove: 25.5 }), /decimal string/);
  const sim = createSim({ scenario: queueScenario, humanLog: [{ tick: 2, type: 'policy', bot: 'holder-1', patch: { approvalAbove: 25.5 } }, { tick: 2, type: 'launch', wallet: 'holder-1', symbol: 'MINE', name: 'Mine', nounId: 2 }] });
  sim.run(4);
  assert.deepEqual(sim.humanRejects.map((r) => r.reason).sort(), ['BAD_POLICY', 'NOT_HUMAN']);
  assert.ok(!sim.world.events.some((e) => e.type === 'POLICY' || e.type === 'ENGINE_REFUSE'), 'neither refusal is hashed');
  assert.match(eventsHash(sim.world.events), /^[0-9a-f]{16}$/);
});
