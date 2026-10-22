/**
 * Frozen configuration for the launchpad case study: curve presets, fee
 * tiers, launch rules, trending and risk weights. Every number the engine
 * uses lives here, and configHash() pins the whole set.
 *
 * Presets scale Pump.fun's published constant-product curve (30 quote of
 * virtual reserve, 1.073B virtual tokens, 793.1M real tokens, 1B supply) by a
 * factor: quote amounts scale, token percentages do not.
 */
import { ONE } from './units.mjs';
import { hashString } from './prng.mjs';

const MILLION = 1_000_000n * ONE;
export const SUPPLY = 1000n * MILLION;
export const B0 = 1073n * MILLION;
export const R0 = 7931n * MILLION / 10n;
export const POOL_BASE = SUPPLY - R0;

function preset(id, label, quote, scale, migrationFee) {
  const s = BigInt(scale);
  return Object.freeze({ id, label, quote, scale: s, Q0: 30n * ONE * s, B0, R0, supply: SUPPLY, poolBase: POOL_BASE, migrationFee });
}

export const PRESETS = Object.freeze({
  'classic-x100': preset('classic-x100', 'Classic ×100', 'cr', 100, 1_500_000n),
  town: preset('town', 'Town', 'ATTN', 10, 150_000n),
});

/** Fee rates are in millionths (D = 1,000,000): 1 bps = 100. Half-bps pool tiers need the extra digits. */
export const D = 1_000_000n;
export const bps = (n) => Math.round(n * 100);

/** Curve fees: 125 bps in all, 30 to the creator and 95 to the house. */
export const CURVE_FEES = Object.freeze({ creator: bps(30), house: bps(95), lp: 0 });

/**
 * Pool fees by market cap, transcribed from Pump's published fee tiers
 * (pump-public-docs, docs/fees.png). `from` is the tier's lower bound in
 * Pump's quote units; presets scale it by `s`. The picture's 73,681 is copied
 * as printed.
 */
const TIER_ROWS = [
  [0, 30, 93, 2], [420, 95, 5, 20], [1470, 90, 5, 20], [2460, 85, 5, 20], [3440, 80, 5, 20],
  [4420, 75, 5, 20], [9820, 70, 5, 20], [14740, 65, 5, 20], [19650, 60, 5, 20], [24560, 55, 5, 20],
  [29470, 50, 5, 20], [34380, 45, 5, 20], [39300, 40, 5, 20], [44210, 35, 5, 20], [49120, 30, 5, 20],
  [54030, 27.5, 5, 20], [58940, 25, 5, 20], [63860, 22.5, 5, 20], [68770, 20, 5, 20], [73681, 17.5, 5, 20],
  [78590, 15, 5, 20], [83500, 12.5, 5, 20], [88400, 10, 5, 20], [93330, 7.5, 5, 20], [98240, 5, 5, 20],
];
export const POOL_TIERS = Object.freeze(TIER_ROWS.map(([from, creator, house, lp]) => Object.freeze({ from: BigInt(from), creator: bps(creator), house: bps(house), lp: bps(lp) })));

/** One word for the unit everywhere it is shown: the page, the twin and the copy test import these. */
export const CREDIT_WORD = 'play credits';
export const CREDIT_LINE = 'Play credits only. No value, may reset. No real funds. Credits never leave this page.';
export const NOUNS_LINE = 'Noun art is CC0. Not a Nouns token. Not a claim on the Nouns treasury. No Nouns DAO endorsement.';

const AUCTION = Object.freeze({ ticks: 10, capDivisor: 100n });
const SNIPER_FEE = Object.freeze({ startBps: 5000, ticks: 60 });
const EARLY_CAP = Object.freeze({ bps: 200, ticks: 120 });

/** Launch rules, as presets so the case study can compare them. */
export const RULES = Object.freeze({
  naked: Object.freeze({ id: 'naked', label: 'Naked', auction: null, sniperFee: null, earlyCap: null, devLock: false }),
  auction: Object.freeze({ id: 'auction', label: 'Opening auction', auction: AUCTION, sniperFee: null, earlyCap: null, devLock: false }),
  'sniper-fee': Object.freeze({ id: 'sniper-fee', label: 'Decaying sniper fee', auction: null, sniperFee: SNIPER_FEE, earlyCap: null, devLock: false }),
  fair: Object.freeze({ id: 'fair', label: 'Fair launch', auction: AUCTION, sniperFee: SNIPER_FEE, earlyCap: EARLY_CAP, devLock: true }),
});

export const LIMITS = Object.freeze({ nameMax: 32, symbolMax: 13, devBuyMaxBps: 500, feeSplitMax: 10, defaultSlippageBps: 500, maxSlippageBps: 5000, maxPriorityFeeBps: 10_000 });

/** Rolling windows in ticks (one tick is one simulated second). */
export const WINDOWS = Object.freeze({ '5m': 300, '1h': 3600, '6h': 21600, '24h': 86400 });

export const TRENDING = Object.freeze({
  weights: Object.freeze({ breadth: 0.3, organic: 0.25, txns: 0.15, change: 0.1, holders: 0.1, liquidity: 0.05, reactions: 0.05 }),
  warmupTicks: 120,
  halfLifeTicks: 21600,
});

export const RISK = Object.freeze({
  weights: Object.freeze({ dev: 25, bundle: 20, sniper: 20, top10: 20, devSold: 15 }),
  scales: Object.freeze({ dev: 0.2, bundle: 0.4, sniper: 0.4, top10Floor: 0.3, top10Span: 0.5 }),
  badges: Object.freeze({ caution: 25, high: 55 }),
  sniperTicks: 5,
  washTicks: 60,
  devDump: Object.freeze({ share: 0.5, ticks: 300 }),
  bundled: 0.05,
  whale: 0.1,
  wash: 0.3,
});

export const CONFIG = Object.freeze({ version: 2, feeDenominator: D, presets: PRESETS, curveFees: CURVE_FEES, poolTiers: POOL_TIERS, rules: RULES, limits: LIMITS, windows: WINDOWS, trending: TRENDING, risk: RISK, creditWord: CREDIT_WORD });

/** JSON with BigInt values as strings, for hashing and machine editions. */
export const toJSON = (value, space) => JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), space);

export const configHash = (config = CONFIG) => hashString(toJSON(config));
