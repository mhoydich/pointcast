/**
 * Build-time exhibits for the launchpad case study page and its JSON twin:
 * every scenario run under naked and fair rules, the curve's key numbers, and
 * chart points. Everything returned is plain JSON (BigInt amounts become
 * whole-credit numbers rounded to cents, or strings where exactness matters).
 */
import { PRESETS, RULES, CURVE_FEES, POOL_TIERS, SUPPLY, R0, POOL_BASE, CREDIT_WORD, CREDIT_LINE, NOUNS_LINE, configHash } from './config.mjs';
import { newCurve, marketCap, graduationRaise, buyOut, applyBuy, netForOut, netOfRate } from './curve.mjs';
import { runScenario } from './sim.mjs';
import { STRATEGIES } from './strategies.mjs';
import { GATE_REASONS } from './gate.mjs';
import { coinPath } from './coin-art.mjs';
import quietLaunch from '../../data/launchpad/scenarios/quiet-launch.json' with { type: 'json' };
import snipeWar from '../../data/launchpad/scenarios/snipe-war.json' with { type: 'json' };
import devDump from '../../data/launchpad/scenarios/dev-dump.json' with { type: 'json' };
import graduationRun from '../../data/launchpad/scenarios/graduation-run.json' with { type: 'json' };

export const SCENARIOS = Object.freeze([quietLaunch, snipeWar, devDump, graduationRun]);
export const CASE_PATH = '/case-studies/launchpad/';
export const PLAN_DOC = 'docs/plans/2026-10-19-launchpad-case-study.md';
export const AUTHOR = 'Claude Code for PointCast';

const cr = (micro) => Math.round(Number(micro) / 1e4) / 100;
const pct = (x) => Math.round(x * 1000) / 10;
/** Fee rates are stored in millionths; these read them in basis points. */
const bpsOf = (millionths) => millionths / 100;
const CURVE_RATE = CURVE_FEES.creator + CURVE_FEES.house + CURVE_FEES.lp;

/** The curve's headline numbers for a preset. */
export function curveFacts(presetId = 'classic-x100') {
  const p = PRESETS[presetId];
  const raise = graduationRaise(p);
  const start = marketCap(newCurve(p), SUPPLY);
  const end = marketCap({ Q: p.Q0 + raise, B: p.B0 - p.R0 }, SUPPLY);
  const half = newCurve(p);
  applyBuy(half, netForOut(half, R0 / 2n), R0 / 2n);
  return {
    preset: p.id,
    label: p.label,
    quote: p.quote,
    supply: Number(SUPPLY / 1_000_000n),
    soldOnCurve: Number(R0 / 1_000_000n),
    heldForPool: Number(POOL_BASE / 1_000_000n),
    startMarketCap: cr(start),
    raiseToGraduate: cr(raise),
    endMarketCap: cr(end),
    priceRise: Math.round((Number(end) / Number(start)) * 10) / 10,
    firstBuy: { quote: cr(p.Q0 / 30n), tokens: Number(buyOut(newCurve(p), netOfRate(p.Q0 / 30n, CURVE_RATE)) / 1_000_000n), afterFee: true },
    creditsAtHalfTokens: cr(half.realQuote),
    curveFeeBps: bpsOf(CURVE_RATE),
    creatorFeeBps: bpsOf(CURVE_FEES.creator),
    houseFeeBps: bpsOf(CURVE_FEES.house),
    migrationFee: cr(p.migrationFee),
  };
}

/** Points along the curve: credits raised against price and market cap, for the chart. */
export function curvePoints(presetId = 'classic-x100', steps = 48) {
  const p = PRESETS[presetId];
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const sold = (p.R0 * BigInt(i)) / BigInt(steps);
    const c = newCurve(p);
    if (sold > 0n) applyBuy(c, netForOut(c, sold), sold);
    out.push({ raised: cr(c.realQuote), price: Number(c.Q) / Number(c.B), marketCap: cr(marketCap(c, SUPPLY)), soldPct: pct(Number(sold) / Number(p.R0)) });
  }
  return out;
}

function plainSummary(summary) {
  return {
    rules: summary.rules,
    approvals: summary.approvals,
    logHash: summary.logHash,
    events: summary.events,
    ticks: summary.ticks,
    coins: summary.coins.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      nounId: c.nounId,
      status: c.status,
      graduatedAtTick: c.completeTick,
      creditsRaised: cr(c.raised),
      marketCap: cr(c.mcap),
      holders: c.holders,
      trades: c.trades,
      volume: cr(c.volume),
      creatorFees: cr(c.creatorFees),
      risk: { score: c.risk.score, badge: c.risk.badge, flags: c.risk.flags, devPct: pct(c.risk.parts.dev), bundlePct: pct(c.risk.parts.bundle), sniperPct: pct(c.risk.parts.sniper), top10Pct: pct(c.risk.parts.top10) },
      sniperShareFirstMinute: pct(c.sniperShare),
    })),
    bots: summary.bots.map((b) => ({
      id: b.id,
      strategy: b.strategy,
      label: b.label,
      fills: b.fills,
      refusedByPolicy: Object.values(b.rejects).reduce((s, n) => s + n, 0),
      refusedReasons: b.rejects,
      refusedByEngine: b.engineRejects,
      queuedForApproval: b.queued,
      netCredits: cr(b.netCredits),
    })),
    houseFees: cr(summary.house.fees),
    sniperFees: cr(summary.house.sniperFees),
    priorityFees: cr(summary.house.priorityFees),
    creditsConserved: summary.quoteConserved,
  };
}

let cache = null;

/** Every scenario under naked and fair rules (computed once per build). */
export function exhibits() {
  if (cache) return cache;
  cache = SCENARIOS.map((scenario) => {
    const naked = runScenario({ scenario, rules: 'naked' }).summary;
    const fair = runScenario({ scenario, rules: 'fair' }).summary;
    return {
      id: scenario.id,
      title: scenario.title,
      summary: scenario.summary,
      seed: scenario.seed,
      ticks: scenario.ticks,
      coins: scenario.launches.map((l) => ({ symbol: l.symbol, name: l.name, nounId: l.nounId, launchTick: l.tick, image: coinPath(scenario.id, l.symbol) })),
      naked: plainSummary(naked),
      fair: plainSummary(fair),
    };
  });
  return cache;
}

export function rulesTable() {
  return Object.values(RULES).map((r) => ({
    id: r.id,
    label: r.label,
    openingAuctionTicks: r.auction ? r.auction.ticks : 0,
    sniperFee: r.sniperFee ? { startBps: r.sniperFee.startBps, ticks: r.sniperFee.ticks } : null,
    earlyCap: r.earlyCap ? { bps: r.earlyCap.bps, ticks: r.earlyCap.ticks } : null,
    devLock: r.devLock,
  }));
}

export function strategyTable() {
  return Object.values(STRATEGIES).map((s) => ({ id: s.id, label: s.label, description: s.description }));
}

export const POLICY_CHECKS = GATE_REASONS;

/** Pool fee tiers for a preset, in basis points, from each tier's market-cap threshold. */
export function poolTierTable(presetId = 'classic-x100') {
  const p = PRESETS[presetId];
  return POOL_TIERS.map((t, i) => ({ tier: i + 1, fromMarketCap: Number(t.from * p.scale), creatorBps: bpsOf(t.creator), houseBps: bpsOf(t.house), lpBps: bpsOf(t.lp), totalBps: bpsOf(t.creator + t.house + t.lp) }));
}

/** Sources the page and the JSON twin cite. Each was checked when this was written (see the plan's verification appendix). */
export const SOURCES = Object.freeze([
  Object.freeze({ title: 'pump-fun/pump-public-docs, program README', url: 'https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md', note: 'the curve constants copied here: 30 of virtual quote liquidity, 1,073,000,000 virtual coins, 793,100,000 coins sold on the curve' }),
]);

export function machineEdition() {
  return {
    schema: 'pointcast.launchpad-case-study/v1',
    title: 'Launchpad case study: a simulated coin launchpad',
    human: `https://pointcast.xyz${CASE_PATH}`,
    status: 'case study · simulation only',
    author: AUTHOR,
    unit: CREDIT_WORD,
    standing: `${CREDIT_LINE} Nothing here is an offer or a market.`,
    nouns: NOUNS_LINE,
    simulation: {
      realFunds: false,
      paymentProcessing: false,
      protocolComplianceClaim: false,
      network: 'none: the simulation runs in the page and sends nothing',
      storage: 'in-memory in this page; reset or reload clears it',
      approvals: 'headless runs and the live board deny trades above a bot’s approval line',
    },
    plan: `https://github.com/mhoydich/pointcast/blob/main/${PLAN_DOC}`,
    configHash: configHash(),
    curve: curveFacts(),
    poolFeeTiers: poolTierTable(),
    rules: rulesTable(),
    strategies: strategyTable(),
    policyChecks: POLICY_CHECKS,
    scenarios: exhibits(),
    sources: SOURCES,
    code: 'https://github.com/mhoydich/pointcast/tree/main/src/lib/launchpad',
  };
}
