/**
 * The policy gate every bot intent passes before the engine sees it. A policy
 * is plain, versioned JSON, frozen once loaded. The gate returns the first
 * check that fails, in a fixed order, so every refusal has one reason code:
 *
 *   KILLED → EXPIRED → BLOCKED_COIN / NOT_PERMITTED → COOLDOWN → RATE → PER_TRADE →
 *   WINDOW_CAP → POSITION → SLIPPAGE → PRIORITY_FEE → CREDITS → NEEDS_APPROVAL
 *
 * A buy is valued at its gross (`quoteIn`, every fee inside). Grants are
 * recorded when the gate passes them, so a bot's second intent in a tick is
 * checked against its first; a grant the engine then refuses is undone.
 */
import { units } from './units.mjs';

export const GATE_REASONS = Object.freeze(['KILLED', 'EXPIRED', 'BLOCKED_COIN', 'NOT_PERMITTED', 'COOLDOWN', 'RATE', 'PER_TRADE', 'WINDOW_CAP', 'POSITION', 'SLIPPAGE', 'PRIORITY_FEE', 'CREDITS', 'NEEDS_APPROVAL']);

export const DEFAULT_POLICY = Object.freeze({
  v: 1,
  rev: 0,
  maxPerTrade: '50',
  windowCap: Object.freeze({ amount: '500', ticks: 3600 }),
  maxTradesPerWindow: 120,
  cooldownTicks: 5,
  maxPositionBps: 200,
  maxSlippageBps: 800,
  maxPriorityFeeBps: 50,
  permittedCoins: null,
  blockedCoins: Object.freeze([]),
  permittedCreators: null,
  expiresAtTick: 86_400,
  approvalAbove: '25',
  killed: false,
});

const KEYS = new Set(Object.keys(DEFAULT_POLICY));
const WINDOW_KEYS = new Set(['amount', 'ticks']);

/**
 * Validate and freeze a policy; amounts become BigInt micro-units. Throws on
 * a malformed policy, including any key it does not know, so a typo can never
 * silently leave a limit at its default.
 */
export function loadPolicy(input = {}) {
  for (const k of Object.keys(input)) if (!KEYS.has(k)) throw new Error(`unknown policy key: ${k}`);
  for (const k of Object.keys(input.windowCap ?? {})) if (!WINDOW_KEYS.has(k)) throw new Error(`unknown policy key: windowCap.${k}`);
  const p = { ...DEFAULT_POLICY, ...input, windowCap: { ...DEFAULT_POLICY.windowCap, ...(input.windowCap ?? {}) } };
  if (p.v !== 1) throw new Error('policy version must be 1');
  if (typeof p.killed !== 'boolean') throw new Error('policy.killed must be true or false');
  for (const k of ['permittedCoins', 'blockedCoins', 'permittedCreators']) if (Array.isArray(p[k]) && !p[k].every((x) => typeof x === 'string')) throw new Error(`policy.${k} must list strings`);
  const ints = ['rev', 'maxTradesPerWindow', 'cooldownTicks', 'maxPositionBps', 'maxSlippageBps', 'maxPriorityFeeBps', 'expiresAtTick'];
  for (const k of ints) if (!Number.isInteger(p[k]) || p[k] < 0) throw new Error(`policy.${k} must be a non-negative integer`);
  if (!Number.isInteger(p.windowCap.ticks) || p.windowCap.ticks <= 0) throw new Error('policy.windowCap.ticks must be positive');
  for (const k of ['permittedCoins', 'permittedCreators']) if (p[k] !== null && !Array.isArray(p[k])) throw new Error(`policy.${k} must be null or a list`);
  if (!Array.isArray(p.blockedCoins)) throw new Error('policy.blockedCoins must be a list');
  for (const [k, v] of [['maxPerTrade', p.maxPerTrade], ['approvalAbove', p.approvalAbove], ['windowCap.amount', p.windowCap.amount]]) if (typeof v !== 'string') throw new Error(`policy.${k} must be a decimal string`);
  return Object.freeze({
    ...p,
    maxPerTrade: units(p.maxPerTrade),
    approvalAbove: units(p.approvalAbove),
    windowCap: Object.freeze({ amount: units(p.windowCap.amount), ticks: p.windowCap.ticks }),
    permittedCoins: p.permittedCoins ? Object.freeze([...p.permittedCoins]) : null,
    blockedCoins: Object.freeze([...p.blockedCoins]),
    permittedCreators: p.permittedCreators ? Object.freeze([...p.permittedCreators]) : null,
  });
}

/**
 * Apply an edit to a policy's JSON form. The edit may not set `v` or `rev`:
 * every accepted edit bumps `rev` by one. Returns { raw, policy }; throws on
 * an edit loadPolicy would refuse.
 */
export function patchPolicy(raw, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('a policy edit must be an object');
  if ('v' in patch || 'rev' in patch) throw new Error('a policy edit may not set v or rev');
  const next = { ...raw, ...patch, rev: (raw.rev ?? 0) + 1 };
  if (patch.windowCap) next.windowCap = { ...(raw.windowCap ?? {}), ...patch.windowCap };
  return { raw: next, policy: loadPolicy(next) };
}

export const newGateState = () => ({ trades: [], lastTick: -Infinity });

/** What a buy counts against the caps: its gross. Sells count 0. */
export const grossOf = (intent) => (intent.side === 'buy' ? intent.quoteIn : 0n);

/**
 * Check one intent. ctx: { tick, credits, held, estOut, supply, coinCreator,
 * killed, gross?, approved? }. `credits` is what the bot holds less its
 * pending grants this tick; `gross` overrides the intent's own (an auction
 * order is valued at what it can still place); `approved` skips
 * NEEDS_APPROVAL for an intent a person approved.
 * intent: { side, coin, quoteIn?, baseIn?, maxSlippageBps, priorityFeeBps? }.
 */
export function check(policy, state, intent, ctx) {
  const buying = intent.side === 'buy';
  const fee = intent.priorityFeeBps ?? 0;
  if (policy.killed || ctx.killed) return 'KILLED';
  if (ctx.tick >= policy.expiresAtTick) return 'EXPIRED';
  if (policy.blockedCoins.includes(intent.coin)) return 'BLOCKED_COIN';
  if ((policy.permittedCoins && !policy.permittedCoins.includes(intent.coin)) || (policy.permittedCreators && !policy.permittedCreators.includes(ctx.coinCreator))) return 'NOT_PERMITTED';
  if (ctx.tick - state.lastTick < policy.cooldownTicks) return 'COOLDOWN';
  const recent = state.trades.filter((t) => ctx.tick - t.tick < policy.windowCap.ticks);
  if (recent.length >= policy.maxTradesPerWindow) return 'RATE';
  const gross = buying ? ctx.gross ?? grossOf(intent) : 0n;
  if (buying) {
    if (gross > policy.maxPerTrade) return 'PER_TRADE';
    if (recent.reduce((s, t) => s + t.gross, 0n) + gross > policy.windowCap.amount) return 'WINDOW_CAP';
    if ((ctx.held + ctx.estOut) * 10_000n > ctx.supply * BigInt(policy.maxPositionBps)) return 'POSITION';
  }
  if ((intent.maxSlippageBps ?? 0) > policy.maxSlippageBps) return 'SLIPPAGE';
  if (!Number.isInteger(fee) || fee < 0 || fee > policy.maxPriorityFeeBps) return 'PRIORITY_FEE';
  if (buying && gross > ctx.credits) return 'CREDITS';
  if (buying && !ctx.approved && gross > policy.approvalAbove) return 'NEEDS_APPROVAL';
  return null;
}

/**
 * Record a grant (`gross` is what it counts against the caps; 0 for sells)
 * and drop entries older than the policy's window. `coin` and `auction` tag
 * an auction order, whose fill later counts at the clearing tick. Returns an
 * undo function for a grant the engine then refuses.
 */
export function record(policy, state, tick, gross, { coin = null, auction = false } = {}) {
  const entry = { tick, gross, coin, auction };
  const lastTick = state.lastTick;
  state.trades = state.trades.filter((t) => tick - t.tick < policy.windowCap.ticks);
  state.trades.push(entry);
  state.lastTick = Math.max(lastTick, tick);
  return () => {
    const i = state.trades.indexOf(entry);
    if (i >= 0) state.trades.splice(i, 1);
    state.lastTick = Math.max(lastTick, ...state.trades.map((t) => t.tick));
  };
}

/** An auction order was withdrawn (a kill): its grants no longer count. */
export function auctionCancelled(state, coin) {
  state.trades = state.trades.filter((t) => !(t.auction && t.coin === coin));
  state.lastTick = Math.max(-Infinity, ...state.trades.map((t) => t.tick));
}

/** An auction order filled: its grants count for COOLDOWN and RATE at the clearing tick. */
export function auctionFilled(state, coin, tick) {
  for (const t of state.trades) if (t.auction && t.coin === coin) { t.tick = tick; t.auction = false; }
  state.lastTick = Math.max(state.lastTick, tick);
}
