import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ONE, units } from '../src/lib/launchpad/units.mjs';
import { SUPPLY, RULES, configHash } from '../src/lib/launchpad/config.mjs';
import { createWorld, addWallet, launch, buy, sell, tick, sweep, previewBuy, previewSell, quoteBuy, quoteSell, eventsHash, coinPrice } from '../src/lib/launchpad/engine.mjs';
import { createSim, runScenario, checkRecord } from '../src/lib/launchpad/sim.mjs';
import { screen, holdersTable, candles, tradesIn, TABS, createIndex, ingest } from '../src/lib/launchpad/screener.mjs';
import { portfolio, standings } from '../src/lib/launchpad/portfolio.mjs';
import { encodeReplay, decodeReplay, REPLAY_LIMITS, REPLAY_VERSION } from '../src/lib/launchpad/replay.mjs';
import { previewSVG, previewPath } from '../src/lib/launchpad/coin-art.mjs';

// The pure pieces behind the full live board (plan §3, roadmap A1): trade previews, screener tabs,
// holders, portfolio, creator payout splits and replay links.
const load = (id) => JSON.parse(readFileSync(new URL(`../src/data/launchpad/scenarios/${id}.json`, import.meta.url), 'utf8'));
const SCENARIOS = Object.fromEntries(['quiet-launch', 'snipe-war', 'dev-dump', 'graduation-run'].map((id) => [id, load(id)]));

function world(rules = 'naked') {
  const w = createWorld();
  addWallet(w, { id: 'dev', credits: units('20000') });
  addWallet(w, { id: 'w1', credits: units('20000') });
  const { coin } = launch(w, { creator: 'dev', symbol: 'TEST', name: 'Test Coin', nounId: 7, rules });
  return { w, coin };
}

test('a buy preview is the fill: tokens, minimum out, fee lines that sum to the fee, and impact', () => {
  const { w, coin } = world();
  const pv = previewBuy(w, coin.id, units('100'), { priorityFeeBps: 30, slippageBps: 500 });
  assert.equal(pv.out, quoteBuy(w, coin.id, units('100'), 30));
  assert.equal(pv.minOut, (pv.out * 9_500n) / 10_000n);
  const l = pv.lines;
  assert.equal(l.creator + l.house + l.lp + l.sniper + l.priority, l.fee);
  assert.equal(pv.net + l.fee, units('100'));
  assert.ok(pv.impactBps > 0 && pv.impactBps < 400, `impact ${pv.impactBps}`);
  const res = buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100'), priorityFeeBps: 30, minOut: pv.minOut });
  assert.equal(res.out, pv.out, 'the quote equals the fill');
  assert.equal(res.fee, l.fee);
  const sp = previewSell(w, coin.id, res.out / 2n, { slippageBps: 100 });
  assert.equal(sp.out, quoteSell(w, coin.id, res.out / 2n));
  assert.equal(sp.lines.creator + sp.lines.house + sp.lines.lp + sp.lines.priority, sp.lines.fee);
  assert.equal(sp.out + sp.lines.fee, sp.grossOut);
  assert.ok(sp.impactBps > 0);
  assert.equal(sell(w, { wallet: 'w1', coin: coin.id, baseIn: res.out / 2n, minOut: sp.minOut }).out, sp.out);
  assert.equal(previewBuy(w, coin.id, 0n), null);
  assert.equal(previewBuy(w, coin.id, units('1'), { slippageBps: 9000 }), null, 'slippage over the 5,000 bps maximum');
  const big = previewBuy(w, coin.id, units('9000'));
  assert.equal(big.graduates, true, 'a buy past the graduation raise says it graduates the coin');
});

test('during an opening auction the preview describes the order: accepted under the cap, refused, priority fee, an upper bound', () => {
  const { w, coin } = world('auction');
  const pv = previewBuy(w, coin.id, units('100'), { priorityFeeBps: 50, walletId: 'w1' });
  assert.equal(pv.venue, 'auction');
  assert.equal(pv.accepted, units('30'));
  assert.equal(pv.refused, units('70'));
  const res = buy(w, { wallet: 'w1', coin: coin.id, quoteIn: units('100'), priorityFeeBps: 50 });
  assert.equal(res.priorityFee, pv.priorityFee);
  assert.equal(previewBuy(w, coin.id, 1n, { priorityFeeBps: 50, walletId: 'w1' }).accepted, 0n, 'a wallet at its cap still sees the refusal');
  for (let i = 0; i < 10; i++) tick(w);
  assert.ok(coin.holders.get('w1') <= pv.estOut);
  assert.equal(previewBuy(w, coin.id, units('100'), { walletId: 'w1' }).venue, 'curve');

  // A 1 µcr order with a priority fee would be all fee and could never fill: refused, and the preview says it cannot fill.
  const dust = world('auction');
  assert.equal(previewBuy(dust.w, dust.coin.id, 1n, { priorityFeeBps: 50, walletId: 'w1' }), null);
  assert.equal(buy(dust.w, { wallet: 'w1', coin: dust.coin.id, quoteIn: 1n, priorityFeeBps: 50 }).reason, 'BAD_AMOUNT');
  assert.equal(dust.coin.orders.size, 0, 'nothing is escrowed');
  assert.equal(buy(dust.w, { wallet: 'w1', coin: dust.coin.id, quoteIn: 2n, priorityFeeBps: 50 }).ok, true, '2 µcr leaves 1 µcr to fill');
  assert.ok(buy(dust.w, { wallet: 'dev', coin: dust.coin.id, quoteIn: units('10') }).ok);
  for (let i = 0; i < 10; i++) tick(dust.w);
  assert.ok(dust.coin.holders.get('w1') > 0n);
  const index = createIndex();
  ingest(index, dust.w);
  assert.equal(portfolio(dust.w, index, 'w1', { withRank: false }).ledgerDrift, 0n);
  // A lone 1 µcr order pays in and takes no token: it is booked as a realized loss, so the ledger still adds up.
  const lone = world('auction');
  assert.ok(buy(lone.w, { wallet: 'w1', coin: lone.coin.id, quoteIn: 1n }).ok);
  for (let i = 0; i < 10; i++) tick(lone.w);
  const loneIndex = createIndex();
  ingest(loneIndex, lone.w);
  assert.equal(lone.w.events.find((e) => e.type === 'AUCTION_FILL').base, 0n);
  assert.equal(portfolio(lone.w, loneIndex, 'w1', { withRank: false }).ledgerDrift, 0n);
});

test('screener tabs: every tab answers, rows carry the plan’s columns, and the tabs filter as named', () => {
  const { sim } = runScenario({ scenario: SCENARIOS['graduation-run'] });
  const { index, world: w } = sim;
  for (const tab of TABS) assert.ok(Array.isArray(screen(index, w, { tab, ids: ['c1'] })), tab);
  const rows = screen(index, w, { tab: 'new' });
  assert.deepEqual(rows.map((r) => r.symbol), ['GRID', 'MOON']);
  for (const k of ['age', 'price', 'mcap', 'liquidity', 'volume', 'buys', 'sells', 'makers', 'holders', 'change', 'progress', 'risk', 'botShare']) assert.ok(k in rows[0], k);
  assert.deepEqual(screen(index, w, { tab: 'graduated' }).map((r) => r.symbol), ['MOON']);
  assert.deepEqual(screen(index, w, { tab: 'trending' }).map((r) => r.symbol), ['GRID'], 'trending ranks live coins only');
  assert.ok(screen(index, w, { tab: 'graduating' }).every((r) => r.status === 'curve' && r.progress.creditsBps >= 7000));
  assert.ok(screen(index, w, { tab: 'bots' }).every((r) => r.botShare > 0.5));
  assert.deepEqual(screen(index, w, { tab: 'watchlist', ids: ['c1'] }).map((r) => r.id), ['c1']);
  assert.throws(() => screen(index, w, { tab: 'gainers' }), /unknown screener tab/);
});

test('holders show clusters: a creator’s bundled wallets share its cluster, largest first', () => {
  const { sim } = runScenario({ scenario: SCENARIOS['dev-dump'] });
  const coin = sim.world.coins.get('c1');
  const rows = holdersTable(sim.world, coin, 50);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].base >= rows[i].base);
  const bundlers = rows.filter((r) => r.role === 'bundler');
  assert.ok(bundlers.length > 0 && bundlers.every((r) => r.cluster === coin.creator));
  assert.ok(rows.every((r) => r.share > 0 && r.share < 1));
  assert.equal(rows.reduce((s, r) => s + r.base, 0n) <= SUPPLY, true);
});

test('limited candles equal the tail of the full series, at 1s, 1m, 5m and 1h, and an opening auction’s clear moves the chart', () => {
  const { sim } = runScenario({ scenario: SCENARIOS['graduation-run'] });
  const coin = sim.world.coins.get('c1');
  for (const size of [1, 60, 300, 3600]) {
    const all = candles(sim.index, sim.world, coin, size);
    for (const limit of [1, 5, 40]) assert.deepEqual(candles(sim.index, sim.world, coin, size, limit), all.slice(-limit), `size ${size}, limit ${limit}`);
  }
  // Under auction and fair rules, the clearing buy is a trade with a price: from the clear on, the 1s chart's last close is the coin's price.
  for (const rules of ['auction', 'fair']) {
    for (const id of ['quiet-launch', 'dev-dump', 'graduation-run']) {
      const live = createSim({ scenario: SCENARIOS[id], rules });
      let checked = 0;
      while (live.world.tick < live.scenario.ticks) {
        live.step();
        for (const c of live.world.coins.values()) {
          if (c.status === 'auction' || live.world.tick > c.openTick + 40) continue;
          assert.equal(candles(live.index, live.world, c, 1, 40).at(-1).c, coinPrice(c), `${id}/${rules} ${c.symbol} at tick ${live.world.tick}`);
          for (const size of [1, 60]) {
            const all = candles(live.index, live.world, c, size);
            for (const limit of [1, 5, 40]) assert.deepEqual(candles(live.index, live.world, c, size, limit), all.slice(-limit), `${id}/${rules} ${c.symbol} at tick ${live.world.tick}, size ${size}, limit ${limit}`);
          }
          checked++;
        }
      }
      assert.ok(checked >= 41, `${id}/${rules}: ${checked} ticks checked after a clear`);
    }
  }
  const t = tradesIn(sim.index, sim.world, coin, 300);
  assert.ok(t.every((x) => x.tick >= sim.world.tick - 300));
  assert.equal(t.length, sim.index.trades.get('c1').filter((x) => x.tick >= sim.world.tick - 300).length);
});

test('portfolio: net credits match the ledger to the micro-credit for every wallet in every scenario', () => {
  for (const scenario of Object.values(SCENARIOS)) {
    for (const rules of ['naked', 'fair']) {
      const { sim } = runScenario({ scenario, rules });
      for (const id of sim.world.wallets.keys()) {
        const p = portfolio(sim.world, sim.index, id, { withRank: false });
        assert.equal(p.ledgerDrift, 0n, `${scenario.id}/${rules} ${id}`);
        assert.equal(p.totals.net, p.totals.realized + p.totals.unrealized);
      }
    }
  }
  const { sim } = runScenario({ scenario: SCENARIOS['graduation-run'] });
  const table = standings(sim.world);
  for (let i = 1; i < table.length; i++) assert.ok(table[i - 1].net >= table[i].net);
  const dev = portfolio(sim.world, sim.index, 'dev1');
  assert.equal(dev.rank, table.findIndex((r) => r.wallet === 'dev1') + 1);
  assert.equal(dev.createdCoins[0].symbol, 'MOON');
  assert.ok(dev.totals.feesReceived > 0n, 'swept creator fees reach the creator');
});

test('a viewer launches a coin, sets its payout split once, trades it, and a replay link reproduces all of it', () => {
  const scenario = SCENARIOS['quiet-launch'];
  const sim = createSim({ scenario, approvals: 'queue' });
  sim.run(3);
  sim.record({ type: 'launch', wallet: 'you', symbol: 'KITE', name: 'Kite Day', nounId: 12, devBuy: '20' });
  sim.step();
  const kite = [...sim.world.coins.values()].find((c) => c.symbol === 'KITE');
  assert.equal(kite.viewerMade, true);
  assert.equal(kite.createdTick, 3, 'the coin exists in the tick its record names');
  sim.record({ type: 'split', wallet: 'you', coin: kite.id, shares: [{ wallet: 'you', bps: 7000 }, { wallet: 'dev1', bps: 3000 }] });
  sim.record({ type: 'trade', wallet: 'you', side: 'buy', coin: kite.id, quote: '15' });
  sim.step();
  assert.ok(kite.feeSplitLocked);
  sim.record({ type: 'split', wallet: 'you', coin: kite.id, shares: [{ wallet: 'you', bps: 10000 }] });
  sim.step();
  assert.deepEqual(sim.humanRejects.map((r) => r.reason), ['SPLIT_LOCKED']);
  sim.run(40);
  const link = encodeReplay({ scenario: scenario.id, seed: sim.seed, rules: sim.rules, approvals: sim.approvals, configHash: configHash(), log: sim.log });
  const back = decodeReplay(link, { scenarios: SCENARIOS, rules: Object.keys(RULES), configHash: configHash() });
  const replay = createSim({ scenario: SCENARIOS[back.scenario], seed: back.seed, rules: back.rules, approvals: back.approvals, humanLog: back.log });
  replay.run(sim.world.tick);
  assert.equal(eventsHash(replay.world.events), eventsHash(sim.world.events));
  assert.equal(portfolio(replay.world, replay.index, 'you').ledgerDrift, 0n);
});

test('a viewer trade can carry a priority fee: it reaches the fill, and 0 or omitted are the same record', () => {
  const run = (fee) => {
    const sim = createSim({ scenario: SCENARIOS['snipe-war'], approvals: 'queue' });
    while (!sim.world.coins.size) sim.step();
    const coin = sim.world.coins.keys().next().value;
    for (let i = 0; i < 30; i++) sim.step();
    sim.record({ type: 'trade', wallet: 'you', side: 'buy', coin, quote: '10', ...(fee === undefined ? {} : { priorityFeeBps: fee }) });
    sim.step();
    const fill = sim.world.events.find((e) => e.type === 'TRADE' && e.wallet === 'you');
    return { fill, hash: eventsHash(sim.world.events) };
  };
  const none = run(undefined);
  assert.equal(none.fill.priorityFee, 0n);
  assert.equal(run(0).hash, none.hash, 'a 0 bps priority fee is the same run as none');
  const paid = run(40);
  assert.ok(paid.fill.priorityFee > 0n, 'the priority fee is a line on the fill');
  assert.ok(paid.fill.base < none.fill.base, 'and it comes out of the same 10 cr');
  for (const bad of [-1, 1.5, 10_001, '40']) assert.throws(() => checkRecord({ tick: 1, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1', quote: '10', priorityFeeBps: bad }), /malformed trade/);
});

test('replay links refuse what they cannot replay', () => {
  const ctx = { scenarios: SCENARIOS, rules: Object.keys(RULES), configHash: configHash() };
  const ok = { scenario: 'snipe-war', seed: 'snipe-war-1', rules: 'fair', approvals: 'deny', configHash: configHash(), log: [] };
  assert.equal(decodeReplay(encodeReplay(ok), ctx).rules, 'fair');
  const code = (payload) => { try { decodeReplay(typeof payload === 'string' ? payload : encodeReplay(payload), ctx); return 'OK'; } catch (e) { return e.code; } };
  assert.equal(code(''), 'BAD_LINK');
  assert.equal(code('not base64!'), 'BAD_LINK');
  assert.equal(code('x'.repeat(REPLAY_LIMITS.chars + 1)), 'TOO_LONG');
  assert.equal(code({ ...ok, scenario: 'nope' }), 'SCENARIO');
  assert.equal(code({ ...ok, rules: 'chaos' }), 'RULES');
  assert.equal(code({ ...ok, approvals: 'maybe' }), 'APPROVALS');
  assert.equal(code({ ...ok, configHash: '0000000000000000' }), 'CONFIG');
  // Links are base64url JSON; `raw` packs a payload as is (encodeReplay would sort its log).
  const raw = (payload) => Buffer.from(JSON.stringify({ v: REPLAY_VERSION, ...payload })).toString('base64url');
  assert.equal(code(raw({ ...ok, log: [{ tick: 3, type: 'kill', bot: '*' }, { tick: 1, type: 'unkill', bot: '*' }] })), 'RECORD', 'out of tick order');
  assert.equal(code({ ...ok, log: [{ tick: 1, type: 'trade', wallet: 'you', side: 'buy', coin: 'c1', quote: 'lots' }] }), 'RECORD');
  assert.equal(code({ ...ok, name: 'Ünïcode ✓', log: [{ tick: 1, type: 'launch', wallet: 'you', symbol: 'UNI', name: 'Ünïcode ✓', nounId: 3 }] }), 'OK', 'non-ASCII names survive the link');
  assert.throws(() => checkRecord({ tick: 1, type: 'split', wallet: 'you', coin: 'c1', shares: 'all' }), /malformed/);

  // A launch names a preset and rule set by their own keys only; inherited names never reach the engine.
  const launchWith = (extra) => ({ ...ok, log: [{ tick: 1, type: 'launch', wallet: 'you', symbol: 'X', name: 'X', nounId: 1, ...extra }] });
  for (const preset of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'nope']) assert.equal(code(launchWith({ preset })), 'RECORD', `preset ${preset}`);
  for (const rules of ['toString', 'constructor', 'nope']) assert.equal(code(launchWith({ rules })), 'RECORD', `rules ${rules}`);
  assert.equal(code(launchWith({ preset: 'town', rules: 'fair' })), 'OK');
  const w = createWorld();
  addWallet(w, { id: 'a', credits: units('10') });
  assert.equal(launch(w, { creator: 'a', symbol: 'X', name: 'X', nounId: 1, preset: 'toString' }).reason, 'BAD_PRESET');
  assert.equal(launch(w, { creator: 'a', symbol: 'X', name: 'X', nounId: 1, rules: 'constructor' }).reason, 'BAD_RULES');

  // A policy patch holds only the fields the console edits, with plain values: no coin lists, no text, no nesting.
  const policy = (patch, bot = 'momentum-1') => ({ ...ok, log: [{ tick: 1, type: 'policy', bot, patch }] });
  assert.equal(code(policy({ maxPerTrade: '40', approvalAbove: '20', maxPositionBps: 150, cooldownTicks: 3, maxSlippageBps: 600, windowCap: { amount: '300', ticks: 600 } })), 'OK');
  assert.equal(code(policy({ approvalAbove: 25.5 })), 'OK', 'a bad value is the run’s BAD_POLICY refusal, not the link’s');
  for (const patch of [{ blockedCoins: ['Official airdrop'] }, { permittedCoins: ['c1'] }, { permittedCreators: ['dev1'] }, { rev: 9 }, { maxPerTrade: ['40'] }, { windowCap: { amount: '1', ticks: 1, note: 'x' } }, { windowCap: ['1'] }]) {
    assert.equal(code(policy(patch)), 'RECORD', JSON.stringify(patch));
  }
  const deep = `${'['.repeat(40_000)}${']'.repeat(40_000)}`;
  const deepLink = Buffer.from(`{"v":${REPLAY_VERSION},"scenario":"snipe-war","seed":"s","rules":"naked","approvals":"deny","configHash":"${configHash()}","log":[{"tick":1,"type":"policy","bot":"momentum-1","patch":{"maxPerTrade":${deep}}}]}`).toString('base64url');
  assert.equal(code(deepLink), 'RECORD', 'deep nesting never reaches the run, so re-encoding cannot overflow');
  // Bot and intent ids are the scenario's: a link cannot make them say anything else.
  for (const bot of ['*', 'snipe-1']) assert.equal(code({ ...ok, log: [{ tick: 1, type: 'kill', bot }] }), 'OK', bot);
  for (const type of ['kill', 'unkill']) assert.equal(code({ ...ok, log: [{ tick: 1, type, bot: 'invest now, returns guaranteed' }] }), 'RECORD', type);
  assert.equal(code(policy({ cooldownTicks: 1 }, 'buy official')), 'RECORD');
  const vote = (type, intent) => code({ ...ok, log: [{ tick: 1, type, intent, runKey: 'k' }] });
  assert.equal(vote('approve', 'snipe-1:12:0'), 'OK');
  for (const intent of ['claim your airdrop at pump.example', 'nobody:12:0', 'snipe-1:12:0 guaranteed', 'snipe-1:x:0']) {
    assert.equal(vote('approve', intent), 'RECORD', intent);
    assert.equal(vote('decline', intent), 'RECORD', intent);
  }
  assert.throws(() => checkRecord({ tick: 1, type: 'policy', bot: 'a', patch: { blockedCoins: ['x'] } }), /malformed/, 'the live path refuses it too');
  // The wallet a launch, trade or split creates shows in the tape and holders, so it is a plain id that passes the copy rules.
  const trade = (wallet) => code({ ...ok, log: [{ tick: 1, type: 'trade', wallet, side: 'buy', coin: 'c1', quote: '5' }] });
  assert.equal(trade('you'), 'OK');
  for (const wallet of ['Official airdrop guaranteed profit', 'guaranteed-profit', 'x'.repeat(33)]) assert.equal(trade(wallet), 'RECORD', wallet);
  assert.equal(code(launchWith({ wallet: 'redeem-desk' })), 'RECORD');
});

test('acting during a replay gives a link that opens and replays the same run', () => {
  const ctx = { scenarios: SCENARIOS, rules: Object.keys(RULES), configHash: configHash() };
  const scenario = SCENARIOS['snipe-war'];
  const replay = createSim({ scenario, humanLog: [{ tick: 40, type: 'kill', bot: '*' }, { tick: 60, type: 'unkill', bot: '*' }] });
  replay.run(5);
  replay.killAll();
  replay.run(35);
  replay.killAll(false);
  // The viewer's records sit behind the replay's later ones; tick 40 runs its kill, then the viewer's unkill.
  assert.deepEqual(replay.log.map((r) => `${r.tick}:${r.type}`), ['40:kill', '60:unkill', '5:kill', '40:unkill']);
  const link = encodeReplay({ scenario: scenario.id, seed: replay.seed, rules: replay.rules, approvals: replay.approvals, configHash: configHash(), log: replay.log });
  const back = decodeReplay(link, ctx);
  assert.deepEqual(back.log.map((r) => `${r.tick}:${r.type}`), ['5:kill', '40:kill', '40:unkill', '60:unkill'], 'sorted by tick, stable within a tick');
  const again = createSim({ scenario: SCENARIOS[back.scenario], seed: back.seed, rules: back.rules, approvals: back.approvals, humanLog: back.log });
  replay.runToEnd();
  again.runToEnd();
  assert.equal(eventsHash(again.world.events), eventsHash(replay.world.events));
});

test('a name with invisible characters never launches: the copy rules read through them, and launch refuses control and text-direction characters', () => {
  const names = ['Off\u200dicial Nouns', 'PU\u200bMP', '\u202elaiciffo snuoN', 'P\u00adUMP', '\uff2f\uff46\uff46\uff49\uff43\uff49\uff41\uff4c Nouns'];
  const sim = createSim({ scenario: SCENARIOS['quiet-launch'], humanLog: names.map((name, i) => ({ tick: 1, type: 'launch', wallet: 'you', symbol: `X${i}`, name, nounId: i })) });
  sim.run(2);
  assert.equal([...sim.world.coins.values()].filter((c) => c.viewerMade).length, 0);
  assert.deepEqual(sim.world.events.filter((e) => e.type === 'ENGINE_REFUSE' && e.actor === 'human').map((e) => e.reason), ['FILTERED', 'FILTERED', 'BAD_NAME', 'FILTERED', 'FILTERED']);
  const w = createWorld();
  addWallet(w, { id: 'a', credits: 0n });
  assert.equal(launch(w, { creator: 'a', symbol: 'TAB', name: 'Tab\there', nounId: 1 }).reason, 'BAD_NAME');
  assert.equal(launch(w, { creator: 'a', symbol: 'GAP', name: 'Cash\u3164Out', nounId: 1 }).reason, 'BAD_NAME', 'a blank filler may draw as nothing or as a gap');
  assert.equal(launch(w, { creator: 'a', symbol: 'KITE', name: 'Kite Day', nounId: 1 }).ok, true);
  assert.equal(launch(w, { creator: 'a', symbol: 'FAM', name: 'Family \u{1f468}\u200d\u{1f469}\u200d\u{1f467}', nounId: 2 }).ok, true, 'an emoji joiner hides nothing, so it may stay');
});

test('Noun preview faces exist for #0–99 and say play credits', () => {
  assert.equal(previewPath(12), '/case-studies/launchpad/nouns/12.svg');
  for (const id of [0, 42, 99]) assert.match(previewSVG(id), new RegExp(`aria-label="Preview of a simulated coin showing actual Noun #${id}\\. Play credits only; no value\\."`));
  assert.throws(() => previewSVG(100));
});

test('compute budget: a one-hour run with 20 bots stays well inside the phone budget (plan A1: under 5 s)', () => {
  const strategies = ['market-maker', 'momentum', 'dip-buyer', 'holder', 'sniper'];
  const scenario = {
    id: 'bench', seed: 'bench-1', ticks: 3600,
    launches: [{ tick: 5, symbol: 'AAA', name: 'Alpha', nounId: 1, devBuy: '30' }, { tick: 600, symbol: 'BBB', name: 'Beta', nounId: 2, devBuy: '30' }, { tick: 1500, symbol: 'CCC', name: 'Gamma', nounId: 3, devBuy: '30' }],
    bots: Array.from({ length: 20 }, (_, i) => ({ id: `b${i + 1}`, strategy: strategies[i % 5], credits: '800', policy: strategies[i % 5] === 'sniper' ? { maxPerTrade: '100', maxPositionBps: 350, maxSlippageBps: 3000, approvalAbove: '100' } : { approvalAbove: '50' } })),
    retail: { wallets: 120, credits: '400', rate: 1.0, minSize: '5', maxSize: '40', buyBias: 0.65, attention: 0.5, minHoldTicks: 240 },
  };
  const t0 = performance.now();
  const { summary } = runScenario({ scenario });
  const ms = performance.now() - t0;
  assert.equal(summary.quoteConserved, true);
  assert.ok(ms < 5_000, `${Math.round(ms)} ms for 3,600 ticks`);
});
