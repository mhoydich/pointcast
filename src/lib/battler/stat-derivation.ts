/**
 * Nouns Battler — stat derivation.
 *
 * Pure function of a Nouns seed id. No RNG, no I/O, no state. Given
 * a seed, produces the same {traits, types, stats} forever. Anyone
 * running this function (including agents) derives the same battle.
 *
 * Production note: in v2 we simulate trait indices via a deterministic
 * mixing function keyed on the seed id — the real Nouns trait arrays
 * live in the on-chain descriptor and aren't bundled here. If/when we
 * ship the real descriptor lookup, swap `fakeSeedTraits()` for the real
 * `seedToTraits(seedId)` and `seedToStats()` continues to work unchanged.
 *
 * Design by Codex — see docs/codex-logs/2026-04-17-nouns-battler-design.md.
 */

export type BattlerType = 'WATER' | 'BEAM' | 'ARMOR' | 'WILD' | 'FEAST';

export interface SeedTraits {
  bg: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}

export interface FighterStats {
  id: number;
  traits: SeedTraits;
  /** Two types — head-derived (primary) + glasses-derived (secondary). */
  types: [BattlerType, BattlerType];
  /** Clamped to [1, 99]. */
  ATK: number;
  DEF: number;
  SPD: number;
  FOC: number;
  /** Max HP — derived from DEF + base. */
  HP: number;
}

/** 32-bit deterministic mix — xmur3-style. Pure. */
function mix(seed: number, salt: number): number {
  let h = (seed ^ salt) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Simulated trait indices. Real Nouns descriptor has:
 *   backgrounds: 2, bodies: 30, accessories: 140, heads: 240, glasses: 21
 * These ranges are locked into the protocol and rarely change.
 */
export function fakeSeedTraits(id: number): SeedTraits {
  return {
    bg: mix(id, 0x01) % 2,
    body: mix(id, 0x02) % 30,
    accessory: mix(id, 0x03) % 140,
    head: mix(id, 0x04) % 240,
    glasses: mix(id, 0x05) % 21,
  };
}

export const BATTLER_TYPES: readonly BattlerType[] = ['WATER', 'BEAM', 'ARMOR', 'WILD', 'FEAST'];

function headToType(head: number): BattlerType {
  return BATTLER_TYPES[mix(head, 0xaa) % BATTLER_TYPES.length];
}

function glassesToType(glasses: number): BattlerType {
  return BATTLER_TYPES[mix(glasses, 0xbb) % BATTLER_TYPES.length];
}

/** Stat contribution in [-12, +12] keyed off a trait index + salt. */
function contrib(idx: number, salt: number): number {
  return ((mix(idx, salt) % 25) - 12);
}

/**
 * The full derivation. Pure: (id: number) → FighterStats.
 *
 * Stat formulas:
 *   ATK = 50 + head-contrib + accessory-contrib ± 2 (body parity)
 *   DEF = 50 + body-contrib + bg-contrib
 *   SPD = 50 + glasses-contrib - 0.5 * body-contrib
 *   FOC = 50 + accessory-contrib + (glasses multiple of 7 ? +8 : 0)
 *   HP  = 80 + DEF * 0.4
 *
 * All stats clamped to [1, 99]; HP is rounded to the nearest integer.
 */
export function seedToStats(id: number): FighterStats {
  const t = fakeSeedTraits(id);
  const headType = headToType(t.head);
  const glassesType = glassesToType(t.glasses);

  const ATKraw = 50 + contrib(t.head, 0x10) + contrib(t.accessory, 0x11) + ((t.body % 2) ? 2 : -2);
  const DEFraw = 50 + contrib(t.body, 0x12) + contrib(t.bg, 0x13);
  const SPDraw = 50 + contrib(t.glasses, 0x14) - Math.round(contrib(t.body, 0x12) * 0.5);
  const FOCraw = 50 + contrib(t.accessory, 0x15) + ((t.glasses % 7 === 0) ? 8 : 0);

  const clamp = (v: number) => Math.max(1, Math.min(99, Math.round(v)));
  const ATK = clamp(ATKraw);
  const DEF = clamp(DEFraw);
  const SPD = clamp(SPDraw);
  const FOC = clamp(FOCraw);
  const HP = Math.round(80 + DEF * 0.4);

  return { id, traits: t, types: [headType, glassesType], ATK, DEF, SPD, FOC, HP };
}

/** Type matchup: WATER > BEAM > ARMOR > WILD > WATER (rock-paper-scissors+).
 *  FEAST is neutral vs. all — a wildcard type. */
const BEATS: Record<BattlerType, BattlerType | null> = {
  WATER: 'BEAM',
  BEAM: 'ARMOR',
  ARMOR: 'WILD',
  WILD: 'WATER',
  FEAST: null,
};

/** 1.5× on advantage, 0.67× on disadvantage, 1.0× neutral. */
export function matchupMultiplier(attacker: BattlerType, defender: BattlerType): number {
  if (BEATS[attacker] === defender) return 1.5;
  if (BEATS[defender] === attacker) return 0.67;
  return 1.0;
}
