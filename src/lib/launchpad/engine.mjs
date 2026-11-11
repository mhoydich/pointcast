/**
 * The launchpad engine: one state machine for every coin, a ledger of play
 * credits and coin holdings, and an append-only event log.
 *
 *   auction ──clear──► curve ──sells out──► complete ──migrate (same call)──► migrated
 *
 * Pure and deterministic: no clock, no network, no randomness. The simulator
 * decides who acts and in what order; the engine only applies actions and
 * returns { ok, reason } for each. Amounts are BigInt micro-units; fee rates
 * are millionths of D (1 bps = 100).
 *
 * One gross: a buy's `quoteIn` holds every fee (tier, sniper, priority), so
 * net = floor(gross·D/(D+r)) and fee = gross − net. The fee then splits into
 * lines that sum exactly: sniper and priority first (to the house), and the
 * rest is the tier fee, split creator/LP rounded down with the house taking
 * the remainder.
 */
import { ONE, ceilDiv, min } from './units.mjs';
import { CONFIG, D } from './config.mjs';
import { hashString } from './prng.mjs';
import { newCurve, netOfRate, buyOut, netForOut, sellOut, marketCap, graduationRaise, applyBuy, applySell } from './curve.mjs';
import { newPool, poolBuyOut, poolSellOut, poolMarketCap, overflowOut } from './pool.mjs';

export const REASONS = Object.freeze([
  'NO_COIN', 'NO_WALLET', 'BAD_AMOUNT', 'INSUFFICIENT_CREDITS', 'INSUFFICIENT_TOKENS', 'SLIPPAGE',
  'CURVE_COMPLETE', 'NOT_COMPLETE', 'AUCTION_OPEN', 'AUCTION_CAP', 'EARLY_CAP', 'DEV_LOCKED', 'DEV_BUY_CAP', 'POSITION',
  'BAD_NAME', 'BAD_SYMBOL', 'BAD_NOUN', 'BAD_PRESET', 'BAD_RULES', 'NOT_CREATOR', 'SPLIT_LOCKED', 'BAD_SPLIT',
]);

/**
 * Hashed event types and their field order, declared once. The hash input is
 * `seq, tick, type`, then these fields; anything else on an event (such as the
 * float `priceAfter` the page draws) is left out. On TRADE, `quote` is the
 * wallet's side (paid on a buy, received on a sell) and `net` the venue's
 * side (into the curve or pool on a buy, out of it on a sell).
 */
export const EVENT_FIELDS = Object.freeze({
  WALLET: ['wallet', 'role', 'credits', 'fundedBy'],
  CREATE: ['coin', 'symbol', 'name', 'nounId', 'creator', 'preset', 'rules', 'openTick', 'viewerMade'],
  TRADE: ['coin', 'wallet', 'side', 'venue', 'quote', 'net', 'fee', 'sniperFee', 'priorityFee', 'base', 'heldAfter', 'reason'],
  COMPLETE: ['coin', 'raised'],
  MIGRATE: ['coin', 'quote', 'base', 'lpBurned'],
  POST_COMPLETE_BUY: ['coin', 'wallet', 'quote', 'net', 'fee', 'base', 'heldAfter'],
  AUCTION_ORDER: ['coin', 'wallet', 'quote', 'refused', 'priorityFee', 'reason'],
  AUCTION_CANCEL: ['coin', 'wallet', 'quote', 'priorityFee'],
  AUCTION_FILL: ['coin', 'wallet', 'quote', 'refund', 'base', 'orderTick', 'heldAfter'],
  AUCTION_CLEAR: ['coin', 'quote', 'base', 'bidders'],
  FEE_SPLIT: ['coin', 'split'],
  SWEEP: ['coin', 'quote', 'recipients'],
  // Emitted by the simulator (sim.mjs) into the same log.
  GATE_REFUSE: ['bot', 'intent', 'coin', 'side', 'reason'],
  ENGINE_REFUSE: ['actor', 'wallet', 'intent', 'coin', 'side', 'reason'],
  QUEUED: ['bot', 'intent', 'coin', 'side', 'amount'],
  APPROVED: ['intent'],
  DECLINED: ['intent'],
  VOID: ['intent', 'reason'],
  KILL: ['bot', 'on'],
  POLICY: ['bot', 'rev', 'patch'],
});

export function createWorld({ config = CONFIG } = {}) {
  return {
    config,
    tick: 0,
    seq: 0,
    coins: new Map(),
    wallets: new Map(),
    events: [],
    house: { fees: 0n, sniperFees: 0n, priorityFees: 0n, migration: 0n },
  };
}

/** Append an event of a declared type to the log. */
export function emit(world, type, data) {
  if (!EVENT_FIELDS[type]) throw new Error(`undeclared event type: ${type}`);
  const event = { seq: world.seq++, tick: world.tick, type, ...data };
  world.events.push(event);
  return event;
}

const fail = (reason, extra = {}) => ({ ok: false, reason, ...extra });

/* ---------- wallets ---------- */

export function addWallet(world, { id, label = id, role = 'human', credits = 0n, fundedBy = null, strategy = null }) {
  if (world.wallets.has(id)) throw new Error(`wallet exists: ${id}`);
  const wallet = { id, label, role, credits, fundedBy, strategy, positions: new Map(), realized: 0n, feesReceived: 0n };
  world.wallets.set(id, wallet);
  emit(world, 'WALLET', { wallet: id, role, credits, fundedBy });
  return wallet;
}

function position(wallet, coinId) {
  let p = wallet.positions.get(coinId);
  if (!p) { p = { base: 0n, cost: 0n, bought: 0n, sold: 0n, maxBase: 0n }; wallet.positions.set(coinId, p); }
  return p;
}

function addHolding(coin, wallet, base, cost) {
  const p = position(wallet, coin.id);
  p.base += base;
  p.cost += cost;
  p.bought += base;
  if (p.base > p.maxBase) p.maxBase = p.base;
  if (p.base > 0n) coin.holders.set(wallet.id, p.base);
}

function removeHolding(coin, wallet, base, proceeds) {
  const p = position(wallet, coin.id);
  const costPart = p.base ? (p.cost * base) / p.base : 0n;
  p.base -= base;
  p.cost -= costPart;
  p.sold += base;
  wallet.realized += proceeds - costPart;
  if (p.base === 0n) coin.holders.delete(wallet.id);
  else coin.holders.set(wallet.id, p.base);
}

/* ---------- coins and fees ---------- */

export function presetOf(world, coin) { return world.config.presets[coin.preset]; }
export function rulesOf(world, coin) { return world.config.rules[coin.rules]; }

/** Market cap in quote micro-units at the coin's current venue. */
export function coinMarketCap(world, coin) {
  const p = presetOf(world, coin);
  return coin.pool ? poolMarketCap(coin.pool, p.supply) : marketCap(coin.curve, p.supply);
}

/** Price in quote per whole token, as a Number (for charts and signals). */
export function coinPrice(coin) {
  return coin.pool ? Number(coin.pool.quote) / Number(coin.pool.base) : Number(coin.curve.Q) / Number(coin.curve.B);
}

/** The sniper fee in whole basis points at the current tick: floor(start·(T−t)²/T²), 0 when the rule is off or has decayed. */
export function sniperFeeBps(world, coin) {
  const rule = rulesOf(world, coin).sniperFee;
  if (!rule || coin.status !== 'curve') return 0;
  const t = world.tick - coin.openTick;
  if (t < 0 || t >= rule.ticks) return 0;
  const left = BigInt(rule.ticks - t);
  return Number((BigInt(rule.startBps) * left * left) / BigInt(rule.ticks * rule.ticks));
}

/** A tier's total rate in millionths. */
const rateOf = (shares) => BigInt(shares.creator + shares.house + shares.lp);
const bpsRate = (bps) => BigInt(bps) * 100n;

/** The pool fee tier for the pool's market cap: the last tier whose threshold (scaled by the preset) it has reached. */
export function poolTier(world, coin) {
  const p = presetOf(world, coin);
  const mcap = poolMarketCap(coin.pool, p.supply);
  let tier = world.config.poolTiers[0];
  for (const t of world.config.poolTiers) if (mcap >= t.from * ONE * p.scale) tier = t;
  return tier;
}

/**
 * One leg of a trade with its fee lines. `x` is what the priority line is
 * measured on (net on a buy, grossOut on a sell); the sniper line is
 * measured on net and applies to buys only.
 */
function feeLines(fee, net, x, { rTier, rSniper, rPriority, shares }) {
  const sniper = (net * rSniper) / D;
  const priority = (x * rPriority) / D;
  const tierFee = fee - sniper - priority;
  const creator = rTier ? (tierFee * BigInt(shares.creator)) / rTier : 0n;
  const lp = rTier ? (tierFee * BigInt(shares.lp)) / rTier : 0n;
  return { fee, sniper, priority, creator, lp, house: tierFee - creator - lp };
}

const buyLeg = (gross, net, out, rates) => ({ gross, net, out, ...feeLines(gross - net, net, net, rates) });

/** Book a leg's fee lines: creator fees are held on the coin, LP fees stay in a pool's reserves (on the curve the LP line is 0). */
function bookFees(world, coin, leg, venue) {
  coin.feesHeld += leg.creator;
  world.house.fees += leg.house + (venue === 'pool' ? 0n : leg.lp);
  world.house.sniperFees += leg.sniper;
  world.house.priorityFees += leg.priority;
}

/**
 * Plan a buy of `gross` credits without changing anything. On the curve, a
 * buy that would take the last tokens splits into a curve leg (the exact-out
 * cost of what is left, fee inside) and an overflow leg that buys from the
 * pool's opening reserves at the same rate (Pump's synthetic migration).
 */
function planBuy(world, coin, gross, priorityFeeBps) {
  const rPriority = bpsRate(priorityFeeBps);
  if (coin.status === 'migrated') {
    const tier = poolTier(world, coin);
    const rates = { rTier: rateOf(tier), rSniper: 0n, rPriority, shares: tier };
    const net = netOfRate(gross, rates.rTier + rPriority);
    const leg = buyLeg(gross, net, poolBuyOut(coin.pool, net), rates);
    return { venue: 'pool', leg, overflow: null, total: leg.out };
  }
  const p = presetOf(world, coin);
  const shares = world.config.curveFees;
  const rates = { rTier: rateOf(shares), rSniper: bpsRate(sniperFeeBps(world, coin)), rPriority, shares };
  const r = rates.rTier + rates.rSniper + rPriority;
  const net = netOfRate(gross, r);
  const out = buyOut(coin.curve, net);
  if (out < coin.curve.R) return { venue: 'curve', leg: buyLeg(gross, net, out, rates), overflow: null, total: out };
  const netC = netForOut(coin.curve, coin.curve.R);
  const grossC = netC + ceilDiv(netC * r, D);
  const leg = buyLeg(grossC, netC, coin.curve.R, rates);
  const grossO = gross - grossC;
  const netO = netOfRate(grossO, r);
  const outO = overflowOut(coin.curve.realQuote + netC - p.migrationFee, p.poolBase, netO);
  const overflow = grossO > 0n ? buyLeg(grossO, netO, outO, rates) : null;
  return { venue: 'curve', leg, overflow, total: leg.out + outO };
}

/** Plan a sell of `baseIn` tokens without changing anything: fee = ceil(grossOut·r/D), r = tier + priority. */
function planSell(world, coin, baseIn, priorityFeeBps) {
  const pool = coin.status === 'migrated';
  const shares = pool ? poolTier(world, coin) : world.config.curveFees;
  const rates = { rTier: rateOf(shares), rSniper: 0n, rPriority: bpsRate(priorityFeeBps), shares };
  const grossOut = pool ? poolSellOut(coin.pool, baseIn) : sellOut(coin.curve, baseIn);
  const fee = ceilDiv(grossOut * (rates.rTier + rates.rPriority), D);
  return { venue: pool ? 'pool' : 'curve', grossOut, ...feeLines(fee, grossOut, grossOut, rates) };
}

export function launch(world, { creator, symbol, name, nounId, preset = 'classic-x100', rules = 'naked', devBuy = 0n, viewerMade = false }) {
  const { limits } = world.config;
  const wallet = world.wallets.get(creator);
  if (!wallet) return fail('NO_WALLET');
  // Control and text-direction characters, and blank fillers that may draw as nothing or as a gap (Hangul fillers, the
  // braille blank), can make a name read differently from what is scanned. Other invisible characters (an emoji
  // joiner, say) are allowed: the copy rules drop them before they scan, so they hide nothing.
  if (typeof name !== 'string' || !name.trim() || name.length > limits.nameMax || /[\p{Cc}\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069\u115F\u1160\u3164\uFFA0\u2800\u{1D159}]/u.test(name)) return fail('BAD_NAME');
  if (typeof symbol !== 'string' || !/^[A-Z0-9]{1,13}$/.test(symbol) || symbol.length > limits.symbolMax) return fail('BAD_SYMBOL');
  if (!Number.isInteger(nounId) || nounId < 0 || nounId > 99) return fail('BAD_NOUN');
  // Own keys only: a name like "toString" must not find an Object.prototype member.
  if (!Object.hasOwn(world.config.presets, preset)) return fail('BAD_PRESET');
  const p = world.config.presets[preset];
  if (!Object.hasOwn(world.config.rules, rules)) return fail('BAD_RULES');
  const r = world.config.rules[rules];
  const id = `c${world.coins.size + 1}`;
  const coin = {
    id, symbol, name, nounId, creator, preset, rules,
    createdTick: world.tick,
    openTick: world.tick + (r.auction ? r.auction.ticks : 0),
    status: r.auction ? 'auction' : 'curve',
    curve: newCurve(p),
    pool: null,
    feesHeld: 0n,
    feesSwept: 0n,
    feeSplit: [{ wallet: creator, bps: 10_000 }],
    feeSplitLocked: false,
    holders: new Map(),
    orders: new Map(),
    completeTick: null,
    viewerMade: Boolean(viewerMade),
  };
  world.coins.set(id, coin);
  emit(world, 'CREATE', { coin: id, symbol, name, nounId, creator, preset, rules, openTick: coin.openTick, viewerMade: Boolean(viewerMade) });
  if (devBuy > 0n) {
    const res = buy(world, { wallet: creator, coin: id, quoteIn: devBuy, reason: 'dev buy', devBuy: true });
    if (!res.ok) return { ok: true, coin, devBuy: res };
  }
  return { ok: true, coin };
}

/* ---------- buying ---------- */

const validPriority = (world, bps) => Number.isInteger(bps) && bps >= 0 && bps <= world.config.limits.maxPriorityFeeBps;

/**
 * Buy with `quoteIn` credits gross: every fee, including an optional priority
 * fee (`priorityFeeBps`, whole bps, to the house), comes out of it. Optional
 * `minOut`, and `maxBase` (refuse a fill that would take more tokens than
 * this). During an opening auction the buy becomes an order, capped per
 * wallet, cleared later by tick(). A dev buy may spend at most the exact-out
 * cost of the dev-buy cap (5% of supply); rounding can hand it a few
 * µtokens more.
 */
export function buy(world, { wallet: walletId, coin: coinId, quoteIn, minOut = 0n, priorityFeeBps = 0, maxBase, reason = '', devBuy = false }) {
  const coin = world.coins.get(coinId);
  if (!coin) return fail('NO_COIN');
  const wallet = world.wallets.get(walletId);
  if (!wallet) return fail('NO_WALLET');
  if (typeof quoteIn !== 'bigint' || quoteIn <= 0n) return fail('BAD_AMOUNT');
  if (!validPriority(world, priorityFeeBps)) return fail('BAD_AMOUNT');
  if (coin.status === 'auction') return placeOrder(world, coin, wallet, quoteIn, priorityFeeBps, reason);
  if (coin.status === 'complete') return fail('CURVE_COMPLETE');
  if (wallet.credits < quoteIn) return fail('INSUFFICIENT_CREDITS');

  const plan = planBuy(world, coin, quoteIn, priorityFeeBps);
  const p = presetOf(world, coin);
  if (plan.total === 0n) return fail('BAD_AMOUNT');
  if (devBuy && plan.venue === 'curve' && plan.leg.net > netForOut(coin.curve, (p.supply * BigInt(world.config.limits.devBuyMaxBps)) / 10_000n)) return fail('DEV_BUY_CAP');
  if (plan.total < minOut) return fail('SLIPPAGE', { quotedOut: plan.total });
  if (maxBase !== undefined && plan.total > maxBase) return fail('POSITION');
  if (overEarlyCap(world, coin, wallet, plan.total)) return fail('EARLY_CAP');

  const { leg, overflow } = plan;
  wallet.credits -= quoteIn;
  bookFees(world, coin, leg, plan.venue);
  if (plan.venue === 'pool') {
    coin.pool.quote += leg.net + leg.lp;
    coin.pool.base -= leg.out;
  } else {
    applyBuy(coin.curve, leg.net, leg.out);
  }
  addHolding(coin, wallet, leg.out, leg.gross);
  emit(world, 'TRADE', { coin: coin.id, wallet: wallet.id, side: 'buy', venue: plan.venue, quote: leg.gross, net: leg.net, fee: leg.fee, sniperFee: leg.sniper, priorityFee: leg.priority, base: leg.out, heldAfter: position(wallet, coin.id).base, reason, priceAfter: coinPrice(coin) });

  if (plan.venue === 'curve' && coin.curve.R === 0n) {
    coin.status = 'complete';
    coin.completeTick = world.tick;
    emit(world, 'COMPLETE', { coin: coin.id, raised: coin.curve.realQuote });
    migrate(world, coin);
    if (overflow) {
      // The overflow leg's tier fee splits like the curve's (no LP line), and its net goes into the pool seed.
      bookFees(world, coin, overflow, 'curve');
      coin.pool.quote += overflow.net;
      coin.pool.base -= overflow.out;
      addHolding(coin, wallet, overflow.out, overflow.gross);
      emit(world, 'POST_COMPLETE_BUY', { coin: coin.id, wallet: wallet.id, quote: overflow.gross, net: overflow.net, fee: overflow.fee, base: overflow.out, heldAfter: position(wallet, coin.id).base, priceAfter: coinPrice(coin) });
    }
  }
  const fee = leg.fee + (overflow ? overflow.fee : 0n);
  const priorityFee = leg.priority + (overflow ? overflow.priority : 0n);
  return { ok: true, out: plan.total, fee, priorityFee };
}

/** Fair rules: no wallet may hold more than the early cap during the first ticks after opening, on any venue. */
function overEarlyCap(world, coin, wallet, extra) {
  const r = rulesOf(world, coin);
  if (!r.earlyCap || world.tick >= coin.openTick + r.earlyCap.ticks) return false;
  const held = coin.holders.get(wallet.id) ?? 0n;
  return (held + extra) * 10_000n > presetOf(world, coin).supply * BigInt(r.earlyCap.bps);
}

const auctionCap = (world, coin) => presetOf(world, coin).Q0 / rulesOf(world, coin).auction.capDivisor;

/** Gross credits a wallet can still order in a coin's opening auction (the cap counts priority fees); 0 outside an auction. */
export function orderRoom(world, coinId, walletId) {
  const coin = world.coins.get(coinId);
  if (!coin || coin.status !== 'auction') return 0n;
  const order = coin.orders.get(walletId);
  const room = auctionCap(world, coin) - (order ? order.amount + order.priorityFee : 0n);
  return room > 0n ? room : 0n;
}

/**
 * Place (or add to) an auction order. Up to the wallet's room under the cap
 * is accepted and escrowed; the rest is refused and never leaves the wallet.
 * A priority fee is inside the accepted gross and goes to the house at once.
 * An order the priority fee would take whole adds nothing to fill: BAD_AMOUNT.
 */
function placeOrder(world, coin, wallet, quoteIn, priorityFeeBps, reason) {
  const accepted = min(quoteIn, orderRoom(world, coin.id, wallet.id));
  if (accepted <= 0n) return fail('AUCTION_CAP');
  if (wallet.credits < accepted) return fail('INSUFFICIENT_CREDITS');
  const priorityFee = accepted - netOfRate(accepted, bpsRate(priorityFeeBps));
  if (priorityFee === accepted) return fail('BAD_AMOUNT');
  wallet.credits -= accepted;
  world.house.priorityFees += priorityFee;
  const order = coin.orders.get(wallet.id) ?? { wallet: wallet.id, amount: 0n, priorityFee: 0n, seq: world.seq, tick: world.tick };
  order.amount += accepted - priorityFee;
  order.priorityFee += priorityFee;
  coin.orders.set(wallet.id, order);
  const refused = quoteIn - accepted;
  emit(world, 'AUCTION_ORDER', { coin: coin.id, wallet: wallet.id, quote: accepted, refused, priorityFee, reason });
  return { ok: true, out: 0n, order: accepted, refused, priorityFee };
}

/** Withdraw a wallet's open auction order: the order and its priority fee go back to the wallet. */
export function cancelOrder(world, coinId, walletId) {
  const coin = world.coins.get(coinId);
  if (!coin) return fail('NO_COIN');
  const order = coin.orders.get(walletId);
  if (!order || coin.status !== 'auction') return { ok: true, refunded: 0n };
  const wallet = world.wallets.get(walletId);
  wallet.credits += order.amount + order.priorityFee;
  world.house.priorityFees -= order.priorityFee;
  coin.orders.delete(walletId);
  emit(world, 'AUCTION_CANCEL', { coin: coin.id, wallet: walletId, quote: order.amount, priorityFee: order.priorityFee });
  return { ok: true, refunded: order.amount + order.priorityFee };
}

/**
 * Estimated tokens for a buy, for limits. An auction order is valued at the
 * part it can still place, at today's curve price: an upper bound on its fill.
 */
export function estimateOut(world, coinId, walletId, quoteIn, priorityFeeBps = 0) {
  const coin = world.coins.get(coinId);
  if (!coin || quoteIn <= 0n) return 0n;
  if (coin.status !== 'auction') return quoteBuy(world, coinId, quoteIn, priorityFeeBps);
  const accepted = min(quoteIn, orderRoom(world, coinId, walletId));
  if (accepted <= 0n) return 0n;
  const amount = netOfRate(accepted, bpsRate(priorityFeeBps));
  return buyOut(coin.curve, netOfRate(amount, rateOf(world.config.curveFees)));
}

/** Tokens a buy would return right now, without changing anything (0 during an auction or on a bad amount). */
export function quoteBuy(world, coinId, quoteIn, priorityFeeBps = 0) {
  const coin = world.coins.get(coinId);
  if (!coin || typeof quoteIn !== 'bigint' || quoteIn <= 0n || coin.status === 'auction' || coin.status === 'complete') return 0n;
  if (!validPriority(world, priorityFeeBps)) return 0n;
  return planBuy(world, coin, quoteIn, priorityFeeBps).total;
}

/** Credits a sell would return right now, after fees, without changing anything. */
export function quoteSell(world, coinId, baseIn, priorityFeeBps = 0) {
  const coin = world.coins.get(coinId);
  if (!coin || typeof baseIn !== 'bigint' || baseIn <= 0n || coin.status === 'auction' || coin.status === 'complete') return 0n;
  if (!validPriority(world, priorityFeeBps)) return 0n;
  const plan = planSell(world, coin, baseIn, priorityFeeBps);
  return plan.fee > plan.grossOut ? 0n : plan.grossOut - plan.fee;
}

/** Sum a plan's fee lines across its legs. */
function lineTotals(...legs) {
  const t = { fee: 0n, creator: 0n, house: 0n, lp: 0n, sniper: 0n, priority: 0n };
  for (const leg of legs) if (leg) for (const k of Object.keys(t)) t[k] += leg[k];
  return t;
}

/** Price (quote per token, as a Number) at the coin's venue before a trade. */
const venuePrice = (coin) => (coin.pool ? Number(coin.pool.quote) / Number(coin.pool.base) : Number(coin.curve.Q) / Number(coin.curve.B));
const minOutAt = (out, slippageBps) => (out * BigInt(10_000 - slippageBps)) / 10_000n;
const validSlippage = (world, bps) => Number.isInteger(bps) && bps >= 0 && bps <= world.config.limits.maxSlippageBps;

/**
 * Everything a buy panel shows, without changing anything: tokens out, the
 * minimum out at a slippage, the fee lines (they sum to the fee), and the
 * price impact before fees, (net/out)/p − 1 (plan §4.3). During an opening
 * auction it describes the order instead: what is accepted under the cap,
 * its priority fee, and an upper bound on the fill. Null when the coin
 * cannot take a buy of this size.
 */
export function previewBuy(world, coinId, quoteIn, { priorityFeeBps = 0, slippageBps = world.config.limits.defaultSlippageBps, walletId = null } = {}) {
  const coin = world.coins.get(coinId);
  if (!coin || typeof quoteIn !== 'bigint' || quoteIn <= 0n || coin.status === 'complete') return null;
  if (!validPriority(world, priorityFeeBps) || !validSlippage(world, slippageBps)) return null;
  if (coin.status === 'auction') {
    const room = walletId ? orderRoom(world, coinId, walletId) : auctionCap(world, coin);
    const accepted = min(quoteIn, room);
    const priority = accepted - netOfRate(accepted, bpsRate(priorityFeeBps));
    if (accepted > 0n && priority === accepted) return null;
    return { venue: 'auction', gross: quoteIn, accepted, refused: quoteIn - accepted, priorityFee: priority, estOut: accepted > 0n ? estimateOut(world, coinId, walletId, quoteIn, priorityFeeBps) : 0n };
  }
  const plan = planBuy(world, coin, quoteIn, priorityFeeBps);
  if (plan.total === 0n) return null;
  const net = plan.leg.net + (plan.overflow ? plan.overflow.net : 0n);
  const p = venuePrice(coin);
  return {
    venue: plan.venue,
    gross: quoteIn,
    net,
    out: plan.total,
    minOut: minOutAt(plan.total, slippageBps),
    lines: lineTotals(plan.leg, plan.overflow),
    impactBps: Math.round(((Number(net) / Number(plan.total)) / p - 1) * 10_000),
    graduates: plan.venue === 'curve' && plan.leg.out === coin.curve.R,
  };
}

/** Everything a sell panel shows: credits out after fees, the minimum out, fee lines and price impact before fees, 1 − (grossOut/in)/p. */
export function previewSell(world, coinId, baseIn, { priorityFeeBps = 0, slippageBps = world.config.limits.defaultSlippageBps } = {}) {
  const coin = world.coins.get(coinId);
  if (!coin || typeof baseIn !== 'bigint' || baseIn <= 0n || coin.status === 'auction' || coin.status === 'complete') return null;
  if (!validPriority(world, priorityFeeBps) || !validSlippage(world, slippageBps)) return null;
  const plan = planSell(world, coin, baseIn, priorityFeeBps);
  if (plan.fee > plan.grossOut) return null;
  const out = plan.grossOut - plan.fee;
  return {
    venue: plan.venue,
    grossOut: plan.grossOut,
    out,
    minOut: minOutAt(out, slippageBps),
    lines: lineTotals(plan),
    impactBps: Math.round((1 - (Number(plan.grossOut) / Number(baseIn)) / venuePrice(coin)) * 10_000),
  };
}

/* ---------- selling ---------- */

export function sell(world, { wallet: walletId, coin: coinId, baseIn, minOut = 0n, priorityFeeBps = 0, reason = '' }) {
  const coin = world.coins.get(coinId);
  if (!coin) return fail('NO_COIN');
  const wallet = world.wallets.get(walletId);
  if (!wallet) return fail('NO_WALLET');
  if (typeof baseIn !== 'bigint' || baseIn <= 0n) return fail('BAD_AMOUNT');
  if (!validPriority(world, priorityFeeBps)) return fail('BAD_AMOUNT');
  if (coin.status === 'auction') return fail('AUCTION_OPEN');
  if (coin.status === 'complete') return fail('CURVE_COMPLETE');
  const held = coin.holders.get(wallet.id) ?? 0n;
  if (held < baseIn) return fail('INSUFFICIENT_TOKENS');
  if (rulesOf(world, coin).devLock && wallet.id === coin.creator && coin.status !== 'migrated') return fail('DEV_LOCKED');

  const plan = planSell(world, coin, baseIn, priorityFeeBps);
  if (plan.fee > plan.grossOut) return fail('BAD_AMOUNT');
  const proceeds = plan.grossOut - plan.fee;
  if (proceeds < minOut) return fail('SLIPPAGE', { quotedOut: proceeds });
  if (plan.venue === 'pool') {
    coin.pool.quote -= plan.grossOut - plan.lp;
    coin.pool.base += baseIn;
  } else {
    applySell(coin.curve, baseIn, plan.grossOut);
  }
  bookFees(world, coin, plan, plan.venue);
  wallet.credits += proceeds;
  removeHolding(coin, wallet, baseIn, proceeds);
  emit(world, 'TRADE', { coin: coin.id, wallet: wallet.id, side: 'sell', venue: plan.venue, quote: proceeds, net: plan.grossOut, fee: plan.fee, sniperFee: 0n, priorityFee: plan.priority, base: baseIn, heldAfter: position(wallet, coin.id).base, reason, priceAfter: coinPrice(coin) });
  return { ok: true, out: proceeds, fee: plan.fee, priorityFee: plan.priority };
}

/* ---------- auction clearing, migration, fees ---------- */

/**
 * Close a coin's opening auction: one curve buy of all accepted orders (less
 * their priority fees) at the curve fee only, split pro rata so every bidder
 * pays the same average price. Each bidder pays floor(gross · order / total)
 * and never more than its order; the rounding dust is simply not spent.
 * Token dust goes one micro-unit at a time to the earliest orders. The
 * cleared amount is held below the graduation raise.
 */
function clearAuction(world, coin) {
  const p = presetOf(world, coin);
  const orders = [...coin.orders.values()].sort((a, b) => a.seq - b.seq);
  const total = orders.reduce((s, o) => s + o.amount, 0n);
  coin.status = 'curve';
  if (!total) { emit(world, 'AUCTION_CLEAR', { coin: coin.id, quote: 0n, base: 0n, bidders: 0 }); return; }
  const shares = world.config.curveFees;
  const rTier = rateOf(shares);
  const room = (graduationRaise(p) * 9n) / 10n;
  const target = min(total, room + ceilDiv(room * rTier, D));
  const spent = orders.map((o) => (target * o.amount) / total);
  const gross = spent.reduce((s, x) => s + x, 0n);
  const net = netOfRate(gross, rTier);
  const out = buyOut(coin.curve, net);
  bookFees(world, coin, buyLeg(gross, net, out, { rTier, rSniper: 0n, rPriority: 0n, shares }), 'curve');
  applyBuy(coin.curve, net, out);
  const fills = spent.map((x) => (gross ? (out * x) / gross : 0n));
  let dust = out - fills.reduce((s, x) => s + x, 0n);
  for (let i = 0; dust > 0n && i < fills.length; i++) if (spent[i] > 0n) { fills[i] += 1n; dust -= 1n; }
  orders.forEach((o, i) => {
    const wallet = world.wallets.get(o.wallet);
    wallet.credits += o.amount - spent[i];
    if (fills[i] > 0n) addHolding(coin, wallet, fills[i], spent[i] + o.priorityFee);
    // A lone dust order can pay in and take no token (the curve fee rounds its net to 0): a realized loss, so the ledger still adds up.
    else wallet.realized -= spent[i] + o.priorityFee;
    emit(world, 'AUCTION_FILL', { coin: coin.id, wallet: o.wallet, quote: spent[i], refund: o.amount - spent[i], base: fills[i], orderTick: o.tick, heldAfter: position(wallet, coin.id).base, priceAfter: coinPrice(coin) });
  });
  coin.orders.clear();
  emit(world, 'AUCTION_CLEAR', { coin: coin.id, quote: gross, base: out, bidders: orders.length, priceAfter: coinPrice(coin) });
}

/** Move a sold-out curve into a pool with burned LP. Called in the same step as the crossing buy. */
export function migrate(world, coin) {
  if (coin.status !== 'complete') return fail('NOT_COMPLETE');
  const p = presetOf(world, coin);
  const quote = coin.curve.realQuote - p.migrationFee;
  coin.pool = newPool(quote, p.poolBase);
  world.house.migration += p.migrationFee;
  coin.status = 'migrated';
  emit(world, 'MIGRATE', { coin: coin.id, quote, base: p.poolBase, lpBurned: coin.pool.lpBurned, priceAfter: coinPrice(coin) });
  return { ok: true };
}

/**
 * Pay held creator fees to the payout split: each recipient gets
 * floor(swept·bps/10000) and the first takes the remainder. Anyone may call
 * it; calling twice pays nothing twice.
 */
export function sweep(world, coinId) {
  const coin = world.coins.get(coinId);
  if (!coin) return fail('NO_COIN');
  const amount = coin.feesHeld;
  if (!amount) return { ok: true, paid: 0n };
  const parts = coin.feeSplit.map((s) => (amount * BigInt(s.bps)) / 10_000n);
  parts[0] += amount - parts.reduce((sum, x) => sum + x, 0n);
  coin.feeSplit.forEach((s, i) => {
    const w = world.wallets.get(s.wallet);
    w.credits += parts[i];
    w.feesReceived += parts[i];
  });
  coin.feesHeld = 0n;
  coin.feesSwept += amount;
  emit(world, 'SWEEP', { coin: coin.id, quote: amount, recipients: coin.feeSplit.length });
  return { ok: true, paid: amount };
}

/** Set the creator fee split once: up to 10 known wallets, summing to exactly 10,000 bps. */
export function setFeeSplit(world, coinId, by, shares) {
  const coin = world.coins.get(coinId);
  if (!coin) return fail('NO_COIN');
  if (by !== coin.creator) return fail('NOT_CREATOR');
  if (coin.feeSplitLocked) return fail('SPLIT_LOCKED');
  const ok = Array.isArray(shares) && shares.length >= 1 && shares.length <= world.config.limits.feeSplitMax
    && shares.every((s) => world.wallets.has(s.wallet) && Number.isInteger(s.bps) && s.bps > 0)
    && new Set(shares.map((s) => s.wallet)).size === shares.length
    && shares.reduce((sum, s) => sum + s.bps, 0) === 10_000;
  if (!ok) return fail('BAD_SPLIT');
  coin.feeSplit = shares.map((s) => ({ wallet: s.wallet, bps: s.bps }));
  coin.feeSplitLocked = true;
  emit(world, 'FEE_SPLIT', { coin: coin.id, split: coin.feeSplit });
  return { ok: true };
}

/** Advance one tick and close any opening auction whose time is up. */
export function tick(world) {
  world.tick += 1;
  for (const coin of world.coins.values()) {
    if (coin.status === 'auction' && world.tick >= coin.openTick) clearAuction(world, coin);
  }
}

/* ---------- accounting ---------- */

/** Total quote in the system: wallet credits, curve and pool quote, held fees, escrowed orders and house sinks. Constant unless credits are created. */
export function quoteInSystem(world) {
  let total = world.house.fees + world.house.sniperFees + world.house.priorityFees + world.house.migration;
  for (const w of world.wallets.values()) total += w.credits;
  for (const c of world.coins.values()) {
    total += c.feesHeld + (c.pool ? c.pool.quote : c.curve.realQuote);
    for (const o of c.orders.values()) total += o.amount;
  }
  return total;
}

/** A wallet's unrealized change in credits: what selling each position now would return, after fees, less its cost. */
export function unrealized(world, wallet) {
  let total = 0n;
  for (const [coinId, p] of wallet.positions) {
    if (!p.base) continue;
    total += quoteSell(world, coinId, p.base) - p.cost;
  }
  return total;
}

/* ---------- canonical log ---------- */

/** A value in canonical form: BigInt as a decimal string, object keys sorted, and no floats. */
function canonical(value) {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error(`non-integer number in a hashed event: ${value}`);
    return value;
  }
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  return value;
}

/** One event as one canonical line: seq, tick, type, then the type's declared fields. */
export function eventLine(event) {
  const fields = EVENT_FIELDS[event.type];
  if (!fields) throw new Error(`undeclared event type: ${event.type}`);
  return JSON.stringify([event.seq, event.tick, event.type, ...fields.map((f) => canonical(event[f]))]);
}

/** The run's log hash (non-cryptographic, 64-bit): it pins regressions and replays, not integrity. */
export const eventsHash = (events) => hashString(events.map(eventLine).join('\n'));
