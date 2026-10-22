/**
 * The deterministic launchpad simulator. A scenario (launches, bots, retail
 * noise, copy-traders), a seed and a human action log always produce the same
 * event log and the same logHash. One tick is one simulated second.
 *
 * Each tick (plan §5.1):
 *   1. launches due this tick (scenario, then viewer `launch` records), with dev buys and same-tick bundles
 *   2. the human log's control records, in log order: approvals, kills, policy edits; viewer trades are queued
 *   3. proposals: approved intents (re-gated), bot intents (each through its gate as proposed), scenario actors
 *   4. ordering: priority fee, highest first, then a seeded shuffle
 *   5. the engine fills or refuses each proposal in that order
 *   6. sweeps every 600 ticks; 7. the screener ingests; 8. the tick advances and due auctions clear
 *
 * Gate and engine refusals, queued and voided approvals, kills and policy
 * edits are all hashed events, so the pinned hashes cover them.
 */
import { prng } from './prng.mjs';
import { units, min } from './units.mjs';
import { CONFIG, LIMITS, configHash } from './config.mjs';
import { createWorld, addWallet, launch, buy, sell, tick as advance, sweep, emit, quoteBuy, quoteSell, estimateOut, orderRoom, cancelOrder, sniperFeeBps, eventsHash, quoteInSystem, unrealized, coinPrice, coinMarketCap, presetOf } from './engine.mjs';
import { loadPolicy, patchPolicy, newGateState, check, record, auctionFilled, auctionCancelled } from './gate.mjs';
import { STRATEGIES, copyIntents } from './strategies.mjs';
import { createIndex, ingest, risk, priceAgo, highOver, emaOver, holdersAgo, tradesIn } from './screener.mjs';
import { progress } from './curve.mjs';
import { copyProblems } from './copy-rules.mjs';

const SWEEP_EVERY = 600;
const QUEUE_TICKS = 30;

/** Human action log records (plan §8.4). */
export const RECORD_TYPES = Object.freeze(['launch', 'trade', 'approve', 'decline', 'kill', 'unkill', 'policy']);
const CONTROL = new Set(['approve', 'decline', 'kill', 'unkill', 'policy']);

const isText = (x) => typeof x === 'string' && x.length > 0;
const isAmount = (x) => { try { return isText(x) && units(x) >= 0n; } catch { return false; } };
const isSlippage = (x) => x === undefined || (Number.isInteger(x) && x >= 0 && x <= LIMITS.maxSlippageBps);

/** Check a record's shape; throws on a malformed one. Returns a frozen copy. */
export function checkRecord(rec) {
  if (!rec || typeof rec !== 'object') throw new Error('a log record must be an object');
  if (!Number.isInteger(rec.tick) || rec.tick < 0) throw new Error('a log record needs a whole tick');
  if (!RECORD_TYPES.includes(rec.type)) throw new Error(`unknown log record type: ${rec.type}`);
  const need = {
    launch: () => isText(rec.wallet) && isText(rec.symbol) && typeof rec.name === 'string' && Number.isInteger(rec.nounId) && (rec.devBuy === undefined || isAmount(rec.devBuy)),
    trade: () => isText(rec.wallet) && isText(rec.coin) && isSlippage(rec.slippageBps) && (rec.side === 'buy' ? isAmount(rec.quote) : rec.side === 'sell' && isAmount(rec.base)),
    approve: () => isText(rec.intent) && isText(rec.runKey),
    decline: () => isText(rec.intent) && isText(rec.runKey),
    kill: () => isText(rec.bot),
    unkill: () => isText(rec.bot),
    policy: () => isText(rec.bot) && rec.patch && typeof rec.patch === 'object' && !Array.isArray(rec.patch),
  }[rec.type];
  if (!need()) throw new Error(`malformed ${rec.type} record`);
  return Object.freeze({ ...rec });
}

export function createSim({ scenario, seed = scenario.seed ?? scenario.id, rules = scenario.rules ?? 'naked', preset = scenario.preset ?? 'classic-x100', config = CONFIG, humanLog = [], approvals = 'deny' }) {
  if (approvals !== 'deny' && approvals !== 'queue') throw new Error("approvals must be 'deny' or 'queue'");
  const log = humanLog.map(checkRecord);
  const runKey = `${scenario.id}|${seed}|${rules}|${configHash(config)}`;
  const world = createWorld({ config });
  const rng = prng(seed);
  const orderRng = rng.fork('order');
  const retailRng = rng.fork('retail');
  const index = createIndex();

  const r = scenario.retail;
  const retail = r ? Array.from({ length: r.wallets }, (_, i) => addWallet(world, { id: `r${i + 1}`, role: 'retail', credits: units(r.credits) })) : [];

  const bots = (scenario.bots ?? []).map((b) => {
    const strategy = STRATEGIES[b.strategy];
    if (!strategy) throw new Error(`unknown strategy: ${b.strategy}`);
    const params = { ...strategy.defaults, ...(b.params ?? {}) };
    addWallet(world, { id: b.id, role: b.role ?? (b.strategy === 'sniper' ? 'sniper' : 'bot'), credits: units(b.credits), strategy: b.strategy });
    const raw = { ...(b.policy ?? {}) };
    return { id: b.id, label: b.label ?? strategy.label, strategy, params, raw, policy: loadPolicy(raw), gate: newGateState(), state: strategy.init(params), rng: rng.fork(`bot:${b.id}`), killed: false, pending: 0n, pendingBase: new Map(), rejects: {}, engineRejects: {}, queued: 0, fills: 0 };
  });
  const botById = new Map(bots.map((b) => [b.id, b]));

  const copiers = (scenario.copyTraders ?? []).map((c) => {
    addWallet(world, { id: c.id, role: 'copy', credits: units(c.credits) });
    return { ...c };
  });

  const launches = scenario.launches.map((l, i) => {
    const devId = l.dev ?? `dev${i + 1}`;
    if (!world.wallets.has(devId)) addWallet(world, { id: devId, role: 'dev', credits: units(l.devCredits ?? '1000') });
    const bundlers = Array.from({ length: l.bundlers ?? 0 }, (_, k) => addWallet(world, { id: `${devId}-L${i + 1}-b${k + 1}`, role: 'bundler', credits: units(l.bundleCredits ?? l.bundleSize ?? '0'), fundedBy: devId }).id);
    return { ...l, devId, bundlers, coinId: null };
  });

  /** Viewer wallets appear when their first record runs, with the scenario's human credits. */
  function humanWallet(id) {
    const w = world.wallets.get(id);
    if (w && w.role !== 'human') return null;
    return w ?? addWallet(world, { id, role: 'human', credits: units(scenario.humanCredits ?? '1000') });
  }

  /** The last tick a wallet bought a coin (retail waits a while before selling, as people do). */
  function lastBuyTick(walletId, coinId) {
    const trades = index.trades.get(coinId) ?? [];
    for (let i = trades.length - 1; i >= 0; i--) if (trades[i].wallet === walletId && trades[i].side === 'buy') return trades[i].tick;
    return -Infinity;
  }

  const humanRejects = [];
  const reject = (rec, reason) => humanRejects.push({ tick: world.tick, type: rec.type, reason });
  const queue = new Map();
  let killedAll = false;
  const riskCache = new Map();
  const riskOf = (coin) => {
    const key = `${coin.id}@${world.tick}`;
    if (!riskCache.has(key)) { riskCache.clear(); riskCache.set(key, risk(index, world, coin)); }
    return riskCache.get(key);
  };

  function summaries() {
    return [...world.coins.values()].map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      status: coin.status,
      creator: coin.creator,
      age: world.tick - coin.openTick,
      price: coinPrice(coin),
      sniperFeeBps: sniperFeeBps(world, coin),
      progressBps: coin.status === 'migrated' ? 10_000 : progress(coin.curve, presetOf(world, coin)).creditsBps,
      holders: coin.holders.size,
      get risk() { return riskOf(coin).score; },
    }));
  }

  function viewFor(walletId, coins) {
    const w = world.wallets.get(walletId);
    const byId = new Map(coins.map((c) => [c.id, c]));
    const coinOf = (id) => world.coins.get(id);
    return {
      tick: world.tick,
      coins,
      coin: (id) => byId.get(id),
      priceAgo: (id, n) => priceAgo(index, world, coinOf(id), n),
      high: (id, n) => highOver(index, world, coinOf(id), n),
      ema: (id, n) => emaOver(index, coinOf(id), n),
      holdersAgo: (id, n) => holdersAgo(index, world, coinOf(id), n),
      trades: (id, n) => tradesIn(index, world, coinOf(id), n).length,
      buys: (id, n) => tradesIn(index, world, coinOf(id), n).filter((t) => t.side === 'buy').length,
      sells: (id, n) => tradesIn(index, world, coinOf(id), n).filter((t) => t.side === 'sell').length,
      me: {
        credits: w.credits,
        held: (id) => w.positions.get(id)?.base ?? 0n,
        cost: (id) => w.positions.get(id)?.cost ?? 0n,
        /** Average price paid per whole coin (fees included), or 0 with no position. */
        entry: (id) => { const p = w.positions.get(id); return p && p.base > 0n ? Number(p.cost) / Number(p.base) : 0; },
        bought: (id) => w.positions.get(id)?.bought ?? 0n,
        sold: (id) => w.positions.get(id)?.sold ?? 0n,
      },
    };
  }

  /** Turn an intent into a proposal with a slippage floor quoted now (before ordering moves the price). */
  function propose(actor, wallet, intent, extra = {}) {
    const fee = intent.priorityFeeBps ?? 0;
    const quoted = intent.side === 'buy' ? quoteBuy(world, intent.coin, intent.quoteIn, fee) : quoteSell(world, intent.coin, intent.baseIn, fee);
    const minOut = (quoted * BigInt(10_000 - (intent.maxSlippageBps ?? 500))) / 10_000n;
    return { actor, wallet, intent, minOut, id: null, bot: null, ...extra };
  }

  /** Run a bot intent through its gate. Passed intents reserve their grant and become proposals; NEEDS_APPROVAL queues under 'queue'. */
  function gateIntent(bot, intent, id, proposals, approved = false) {
    const t = world.tick;
    const coin = world.coins.get(intent.coin);
    const wallet = world.wallets.get(bot.id);
    const buying = intent.side === 'buy';
    // Holdings plus the tokens this bot's earlier grants this tick are expected to take.
    const held = (wallet.positions.get(intent.coin)?.base ?? 0n) + (bot.pendingBase.get(intent.coin) ?? 0n);
    const gross = buying ? (coin.status === 'auction' ? min(intent.quoteIn, orderRoom(world, coin.id, bot.id)) : intent.quoteIn) : 0n;
    const estOut = buying ? estimateOut(world, intent.coin, bot.id, intent.quoteIn, intent.priorityFeeBps ?? 0) : 0n;
    const supply = presetOf(world, coin).supply;
    const reason = check(bot.policy, bot.gate, intent, { tick: t, credits: wallet.credits - bot.pending, held, estOut, supply, coinCreator: coin.creator, killed: bot.killed || killedAll, gross, approved });
    if (reason === 'NEEDS_APPROVAL' && approvals === 'queue') {
      queue.set(id, { id, bot: bot.id, intent, tick: t, rev: bot.policy.rev, credits: wallet.credits });
      bot.queued += 1;
      emit(world, 'QUEUED', { bot: bot.id, intent: id, coin: intent.coin, side: intent.side, amount: gross });
      return;
    }
    if (reason) {
      bot.rejects[reason] = (bot.rejects[reason] ?? 0) + 1;
      emit(world, 'GATE_REFUSE', { bot: bot.id, intent: id, coin: intent.coin, side: intent.side, reason });
      return;
    }
    // Reserve the grant now, so the bot's next intent this tick is checked against it.
    const undo = record(bot.policy, bot.gate, t, gross, { coin: coin.id, auction: coin.status === 'auction' });
    bot.pending += gross;
    if (buying) bot.pendingBase.set(intent.coin, (bot.pendingBase.get(intent.coin) ?? 0n) + estOut);
    proposals.push(propose(bot.id, bot.id, intent, { id, bot, undo }));
  }

  /** Tokens a bot may still take in a coin under its position cap. */
  function botRoom(bot, coinId) {
    const coin = world.coins.get(coinId);
    const room = (presetOf(world, coin).supply * BigInt(bot.policy.maxPositionBps)) / 10_000n - (world.wallets.get(bot.id).positions.get(coinId)?.base ?? 0n);
    return room > 0n ? room : 0n;
  }

  function refuseEngine(p, res) {
    emit(world, 'ENGINE_REFUSE', { actor: p.actor, wallet: p.wallet, intent: p.id, coin: p.intent.coin, side: p.intent.side, reason: res.reason });
  }

  /** Phase 1 for a viewer `launch` record: the name and symbol must pass the copy rules first. */
  function viewerLaunch(rec) {
    const refuse = (reason, coin = null, side = 'launch') => emit(world, 'ENGINE_REFUSE', { actor: 'human', wallet: rec.wallet, intent: null, coin, side, reason });
    const wallet = humanWallet(rec.wallet);
    if (!wallet) return reject(rec, 'NOT_HUMAN');
    if (copyProblems(`${rec.name}\n${rec.symbol}`, { viewer: true }).length) return refuse('FILTERED');
    const devBuy = rec.devBuy ? units(rec.devBuy) : 0n;
    const res = launch(world, { creator: wallet.id, symbol: rec.symbol, name: rec.name, nounId: rec.nounId, preset: rec.preset ?? preset, rules: rec.rules ?? rules, devBuy, viewerMade: true });
    if (!res.ok) return refuse(res.reason);
    if (res.devBuy) refuse(res.devBuy.reason, res.coin.id, 'buy');
  }

  function setKill(bot, on) {
    if (bot === '*') killedAll = on;
    else botById.get(bot).killed = on;
    emit(world, 'KILL', { bot, on });
  }

  /** After a tick's control records: a bot that ends them stopped has its open auction orders withdrawn, and their grants undone. */
  function withdrawStopped() {
    for (const b of bots) {
      if (!b.killed && !killedAll) continue;
      for (const coin of world.coins.values()) {
        if (cancelOrder(world, coin.id, b.id).refunded > 0n) auctionCancelled(b.gate, coin.id);
      }
    }
  }

  function voidIntent(id, reason) {
    queue.delete(id);
    emit(world, 'VOID', { intent: id, reason });
  }

  /** Phase 2: one control record. Trades are returned as proposals. */
  function control(rec, approved, proposals) {
    if (rec.type === 'trade') {
      const wallet = humanWallet(rec.wallet);
      if (!wallet) return reject(rec, 'NOT_HUMAN');
      if (!world.coins.has(rec.coin)) return reject(rec, 'NO_COIN');
      const intent = rec.side === 'buy'
        ? { side: 'buy', coin: rec.coin, quoteIn: units(rec.quote), maxSlippageBps: rec.slippageBps ?? 500, reason: 'viewer' }
        : { side: 'sell', coin: rec.coin, baseIn: units(rec.base), maxSlippageBps: rec.slippageBps ?? 500, reason: 'viewer' };
      proposals.push(propose('human', wallet.id, intent));
      return;
    }
    if (rec.type === 'approve' || rec.type === 'decline') {
      if (rec.runKey !== runKey) return reject(rec, 'RUN_KEY');
      const queued = queue.get(rec.intent);
      if (!queued) return reject(rec, 'NOT_QUEUED');
      queue.delete(rec.intent);
      emit(world, rec.type === 'approve' ? 'APPROVED' : 'DECLINED', { intent: rec.intent });
      if (rec.type === 'approve') approved.push(queued);
      return;
    }
    if (rec.type === 'kill' || rec.type === 'unkill') {
      if (rec.bot !== '*' && !botById.has(rec.bot)) return reject(rec, 'NO_BOT');
      setKill(rec.bot, rec.type === 'kill');
      return;
    }
    // policy
    const bot = botById.get(rec.bot);
    if (!bot) return reject(rec, 'NO_BOT');
    let next;
    try { next = patchPolicy(bot.raw, rec.patch); } catch { return reject(rec, 'BAD_POLICY'); }
    bot.raw = next.raw;
    bot.policy = next.policy;
    emit(world, 'POLICY', { bot: bot.id, rev: bot.policy.rev, patch: rec.patch });
    for (const q of [...queue.values()]) if (q.bot === bot.id) voidIntent(q.id, 'POLICY');
  }

  function step() {
    const t = world.tick;
    // 1. Launches.
    for (const l of launches) {
      if (l.tick !== t) continue;
      const res = launch(world, { creator: l.devId, symbol: l.symbol, name: l.name, nounId: l.nounId, preset, rules, devBuy: units(l.devBuy ?? '0') });
      if (!res.ok) throw new Error(`launch ${l.symbol} failed: ${res.reason}`);
      l.coinId = res.coin.id;
      if (res.devBuy) emit(world, 'ENGINE_REFUSE', { actor: 'dev', wallet: l.devId, intent: null, coin: l.coinId, side: 'buy', reason: res.devBuy.reason });
      for (const id of l.bundlers) {
        const b = buy(world, { wallet: id, coin: l.coinId, quoteIn: units(l.bundleSize), reason: 'bundle' });
        if (!b.ok) emit(world, 'ENGINE_REFUSE', { actor: 'bundler', wallet: id, intent: null, coin: l.coinId, side: 'buy', reason: b.reason });
      }
    }
    for (const rec of log) if (rec.tick === t && rec.type === 'launch') viewerLaunch(rec);
    ingest(index, world);

    // 2. Control records. Stale approvals are void first, so an approval cannot revive one.
    for (const q of [...queue.values()]) {
      if (t - q.tick >= QUEUE_TICKS) voidIntent(q.id, 'EXPIRED');
      else if (world.wallets.get(q.bot).credits !== q.credits) voidIntent(q.id, 'CREDITS');
    }
    const proposals = [];
    const approved = [];
    for (const rec of log) if (rec.tick === t && rec.type !== 'launch') control(rec, approved, proposals);
    if (log.some((rec) => rec.tick === t && (rec.type === 'kill' || rec.type === 'unkill'))) withdrawStopped();

    // 3. Proposals.
    const coins = summaries();
    for (const bot of bots) { bot.pending = 0n; bot.pendingBase = new Map(); }
    for (const l of launches) {
      if (!l.coinId || !l.dump || t !== l.tick + l.dump.after) continue;
      const held = world.wallets.get(l.devId).positions.get(l.coinId)?.base ?? 0n;
      const baseIn = (held * BigInt(Math.round(l.dump.share * 10_000))) / 10_000n;
      if (baseIn > 0n) proposals.push(propose('dev', l.devId, { side: 'sell', coin: l.coinId, baseIn, maxSlippageBps: 5000, reason: 'dev sells' }));
    }
    for (const q of approved) gateIntent(botById.get(q.bot), q.intent, q.id, proposals, true);
    for (const bot of bots) {
      const view = viewFor(bot.id, coins);
      bot.strategy.onTick(view, bot.state, bot.params, bot.rng).forEach((intent, n) => gateIntent(bot, intent, `${bot.id}:${t}:${n}`, proposals));
    }
    for (const c of copiers) {
      const leaderTrades = [];
      for (const coin of world.coins.values()) {
        for (const tr of index.trades.get(coin.id)) if (tr.wallet === c.leader && tr.kind === 'TRADE' && tr.tick === t - c.delay) leaderTrades.push({ ...tr, coin: coin.id, fraction: tr.side === 'sell' ? Number(tr.base) / Number(tr.base + tr.heldAfter) : 1 });
      }
      for (const intent of copyIntents(viewFor(c.id, coins), leaderTrades, c)) proposals.push(propose(c.id, c.id, intent));
    }
    if (r && retail.length) {
      const open = coins.filter((c) => c.status !== 'complete');
      const n = retailRng.poisson(r.rate);
      for (let k = 0; k < n && open.length; k++) {
        const wallet = retailRng.pick(retail);
        const weights = open.map((c) => 1 + tradesIn(index, world, world.coins.get(c.id), 60).length * (r.attention ?? 0.5));
        let pick = retailRng.next() * weights.reduce((s, x) => s + x, 0);
        const c = open.find((_, i) => (pick -= weights[i]) < 0) ?? open[open.length - 1];
        const held = wallet.positions.get(c.id)?.base ?? 0n;
        const lastBuy = lastBuyTick(wallet.id, c.id);
        const canSell = held > 0n && c.status !== 'auction' && t - lastBuy >= (r.minHoldTicks ?? 180);
        if (canSell && !retailRng.chance(r.buyBias ?? 0.6)) {
          const baseIn = (held * BigInt(Math.round(retailRng.range(0.25, 1) * 10_000))) / 10_000n;
          if (baseIn > 0n) proposals.push(propose('retail', wallet.id, { side: 'sell', coin: c.id, baseIn, maxSlippageBps: 500, reason: 'retail' }));
        } else {
          const lo = Number(r.minSize), hi = Number(r.maxSize);
          const size = String(lo + retailRng.int(hi - lo + 1));
          proposals.push(propose('retail', wallet.id, { side: 'buy', coin: c.id, quoteIn: units(size), maxSlippageBps: 500, reason: 'retail' }));
        }
      }
    }

    // 4–5. Order, then execute.
    const ordered = orderRng.fork(`t${t}`).shuffle(proposals).sort((a, b) => (b.intent.priorityFeeBps ?? 0) - (a.intent.priorityFeeBps ?? 0));
    for (const p of ordered) {
      const { intent } = p;
      const priorityFeeBps = intent.priorityFeeBps ?? 0;
      // A bot's position cap is checked again on the actual fill, against what it holds now.
      const maxBase = p.bot && intent.side === 'buy' ? botRoom(p.bot, intent.coin) : undefined;
      const res = intent.side === 'buy'
        ? buy(world, { wallet: p.wallet, coin: intent.coin, quoteIn: intent.quoteIn, minOut: p.minOut, priorityFeeBps, maxBase, reason: intent.reason })
        : sell(world, { wallet: p.wallet, coin: intent.coin, baseIn: intent.baseIn, minOut: p.minOut, priorityFeeBps, reason: intent.reason });
      if (!res.ok) refuseEngine(p, res);
      if (!p.bot) continue;
      if (res.ok) p.bot.fills += 1;
      else { p.undo(); p.bot.engineRejects[res.reason] = (p.bot.engineRejects[res.reason] ?? 0) + 1; }
    }

    // 6–8. Sweeps, screener, advance. An auction that clears now counts as a fill for its bots at the clearing tick.
    if (t > 0 && t % SWEEP_EVERY === 0) for (const coin of world.coins.values()) sweep(world, coin.id);
    ingest(index, world);
    const seen = world.events.length;
    advance(world);
    for (let i = seen; i < world.events.length; i++) {
      const e = world.events[i];
      if (e.type === 'AUCTION_FILL' && e.base > 0n && botById.has(e.wallet)) auctionFilled(botById.get(e.wallet).gate, e.coin, world.tick);
    }
    ingest(index, world);
  }

  /** Add a record to the human log for the current tick (or later): this is how a live viewer acts, so replays reproduce it. */
  function addRecord(rec) {
    const full = checkRecord({ tick: world.tick, ...rec });
    if (full.tick < world.tick) throw new Error('a record cannot be added for a tick that already ran');
    log.push(full);
    return full;
  }

  return {
    world,
    index,
    bots,
    humanRejects,
    scenario,
    seed,
    rules,
    preset,
    approvals,
    runKey,
    get log() { return log.slice(); },
    get queue() { return [...queue.values()]; },
    record: addRecord,
    step,
    run(n) { for (let i = 0; i < n; i++) step(); },
    runToEnd() { while (world.tick < scenario.ticks) step(); },
    /** Kill toggles go through the human log, so a replay reproduces them. They take effect in the next tick that runs. */
    kill(botId, on = true) { return addRecord({ type: on ? 'kill' : 'unkill', bot: botId }); },
    killAll(on = true) { return addRecord({ type: on ? 'kill' : 'unkill', bot: '*' }); },
    approve(intent) { return addRecord({ type: 'approve', intent, runKey }); },
    decline(intent) { return addRecord({ type: 'decline', intent, runKey }); },
    editPolicy(bot, patch) { return addRecord({ type: 'policy', bot, patch }); },
    get killedAll() { return killedAll; },
  };
}

/** Share of the tokens bought in a coin's first `window` open ticks (auction fills included) that went to sniper wallets. */
export function sniperShare(sim, coin, window = 60) {
  let snipers = 0n, all = 0n;
  for (const t of sim.index.trades.get(coin.id)) {
    if (t.side !== 'buy' || t.tick < coin.openTick || t.tick >= coin.openTick + window) continue;
    all += t.base;
    if (sim.world.wallets.get(t.wallet)?.role === 'sniper') snipers += t.base;
  }
  return all ? Number((snipers * 1_000_000n) / all) / 1_000_000 : 0;
}

/** Credits every wallet started with: the only credits ever created. */
const startingCredits = (world) => world.events.reduce((s, e) => (e.type === 'WALLET' ? s + e.credits : s), 0n);

/** End-of-run summary for exhibits, the JSON twin and tests. */
export function summarize(sim) {
  const { world } = sim;
  return {
    scenario: sim.scenario.id,
    seed: sim.seed,
    rules: sim.rules,
    preset: sim.preset,
    approvals: sim.approvals,
    runKey: sim.runKey,
    ticks: world.tick,
    events: world.events.length,
    logHash: eventsHash(world.events),
    configHash: configHash(world.config),
    quoteConserved: quoteInSystem(world) === startingCredits(world),
    coins: [...world.coins.values()].map((coin) => {
      const trades = sim.index.trades.get(coin.id);
      const rk = risk(sim.index, world, coin);
      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        nounId: coin.nounId,
        status: coin.status,
        completeTick: coin.completeTick,
        raised: coin.curve.realQuote,
        mcap: coinMarketCap(world, coin),
        price: coinPrice(coin),
        holders: coin.holders.size,
        trades: trades.length,
        volume: trades.reduce((s, t) => s + t.quote, 0n),
        creatorFees: coin.feesHeld + coin.feesSwept,
        risk: { score: rk.score, badge: rk.badge, flags: rk.flags, parts: rk.parts },
        sniperShare: sniperShare(sim, coin),
      };
    }),
    bots: sim.bots.map((b) => {
      const w = world.wallets.get(b.id);
      return { id: b.id, label: b.label, strategy: b.strategy.id, fills: b.fills, rejects: b.rejects, engineRejects: b.engineRejects, queued: b.queued, credits: w.credits, netCredits: w.realized + unrealized(world, w) };
    }),
    house: { ...world.house },
  };
}

/** Run a scenario to its end and summarize it. */
export function runScenario(options) {
  const sim = createSim(options);
  sim.runToEnd();
  return { sim, summary: summarize(sim) };
}
