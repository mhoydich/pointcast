/**
 * Nouns Battler — resolver.
 *
 * Pure function. Given two stat blocks and a stance selection per round,
 * returns a deterministic match trace. No RNG, no hidden state, no
 * time-based inputs. Same inputs → same outputs forever.
 *
 * A match is best-of-3 rounds. Each round both fighters pick a stance:
 *   STRIKE  beats  FOCUS   (aggressive crushes analyst)
 *   FOCUS   beats  GUARD   (patience breaks defense)
 *   GUARD   beats  STRIKE  (defense blunts aggression)
 *
 * On stance match (both STRIKE, both GUARD, both FOCUS), the fighter
 * with the higher stat wins a tempo exchange. HP damage in every round
 * is ATK × matchup multiplier × stance factor - DEF / 4, clamped ≥ 1.
 *
 * Design by Codex — see docs/codex-logs/2026-04-17-nouns-battler-design.md.
 */

import type { FighterStats } from './stat-derivation';
import { matchupMultiplier } from './stat-derivation';

export type Stance = 'STRIKE' | 'GUARD' | 'FOCUS';

const STANCE_BEATS: Record<Stance, Stance> = {
  STRIKE: 'FOCUS',
  FOCUS: 'GUARD',
  GUARD: 'STRIKE',
};

interface RoundInput {
  a: Stance;
  b: Stance;
}

export interface RoundResult {
  round: number;                 // 1-indexed
  stanceA: Stance;
  stanceB: Stance;
  /** Damage dealt to B this round */
  damageA: number;
  /** Damage dealt to A this round */
  damageB: number;
  hpA: number;
  hpB: number;
  winner: 'a' | 'b' | 'draw';
  log: string;
}

export interface MatchResult {
  a: FighterStats;
  b: FighterStats;
  rounds: RoundResult[];
  winner: 'a' | 'b' | 'draw';
  /** For convenience: the final hp after all rounds. */
  finalHpA: number;
  finalHpB: number;
}

function stanceFactor(attackerStance: Stance, defenderStance: Stance): number {
  if (STANCE_BEATS[attackerStance] === defenderStance) return 1.3;
  if (STANCE_BEATS[defenderStance] === attackerStance) return 0.75;
  return 1.0;
}

/** Compute damage landed by attacker on defender this round. Clamped ≥ 1. */
function computeDamage(attacker: FighterStats, defender: FighterStats, attackerStance: Stance, defenderStance: Stance): number {
  // Matchup — attacker's primary type vs defender's primary type.
  const typeMult = matchupMultiplier(attacker.types[0], defender.types[0]);
  // Stance interaction.
  const stanceMult = stanceFactor(attackerStance, defenderStance);
  // FOC boosts damage a touch — patience reads the opening.
  const focBonus = (attacker.FOC / 100) * 0.2 + 0.9;  // 0.9–1.1
  const raw = attacker.ATK * typeMult * stanceMult * focBonus - defender.DEF / 4;
  return Math.max(1, Math.round(raw));
}

/**
 * Resolve a full best-of-3 match.
 *   - rounds[].a/b are the chosen stances for this fighter that round.
 *   - If rounds < 3 are provided and no winner is decided, the remaining
 *     rounds auto-resolve to a STRIKE vs STRIKE tempo exchange.
 */
export function resolveMatch(a: FighterStats, b: FighterStats, rounds: RoundInput[]): MatchResult {
  let hpA = a.HP, hpB = b.HP;
  const results: RoundResult[] = [];

  const picks = rounds.slice(0, 3);
  while (picks.length < 3) picks.push({ a: 'STRIKE', b: 'STRIKE' });

  for (let i = 0; i < picks.length; i++) {
    const { a: stanceA, b: stanceB } = picks[i];
    const damageA = computeDamage(a, b, stanceA, stanceB);  // damage A deals to B
    const damageB = computeDamage(b, a, stanceB, stanceA);  // damage B deals to A

    // If speeds differ, the faster side lands first and the slower side
    // lands only if they're still standing. If SPD tie, simultaneous.
    let roundHpA = hpA, roundHpB = hpB;
    if (a.SPD > b.SPD) {
      roundHpB = Math.max(0, hpB - damageA);
      roundHpA = roundHpB > 0 ? Math.max(0, hpA - damageB) : hpA;
    } else if (b.SPD > a.SPD) {
      roundHpA = Math.max(0, hpA - damageB);
      roundHpB = roundHpA > 0 ? Math.max(0, hpB - damageA) : hpB;
    } else {
      roundHpA = Math.max(0, hpA - damageB);
      roundHpB = Math.max(0, hpB - damageA);
    }

    hpA = roundHpA;
    hpB = roundHpB;

    let roundWinner: 'a' | 'b' | 'draw' = 'draw';
    if (hpA === 0 && hpB === 0) roundWinner = 'draw';
    else if (hpA === 0) roundWinner = 'b';
    else if (hpB === 0) roundWinner = 'a';
    else roundWinner = damageA > damageB ? 'a' : damageB > damageA ? 'b' : 'draw';

    const log = `R${i + 1} · ${stanceA} vs ${stanceB} · A deals ${damageA} · B deals ${damageB} · HP ${hpA}/${hpB}`;
    results.push({ round: i + 1, stanceA, stanceB, damageA, damageB, hpA, hpB, winner: roundWinner, log });

    if (hpA === 0 || hpB === 0) break;
  }

  let winner: 'a' | 'b' | 'draw';
  if (hpA === 0 && hpB === 0) winner = 'draw';
  else if (hpA === 0) winner = 'b';
  else if (hpB === 0) winner = 'a';
  else {
    // All rounds ran, both alive — highest remaining HP wins; tie → SPD tiebreak; else draw.
    if (hpA > hpB) winner = 'a';
    else if (hpB > hpA) winner = 'b';
    else if (a.SPD > b.SPD) winner = 'a';
    else if (b.SPD > a.SPD) winner = 'b';
    else winner = 'draw';
  }

  return { a, b, rounds: results, winner, finalHpA: hpA, finalHpB: hpB };
}
