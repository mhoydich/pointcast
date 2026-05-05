/**
 * Moon Tournament — once-per-full-moon knockout for the 8 founding gangs
 * of Nouns Nation Battler. One night, single elimination, run on the
 * special Lunar Tide field. Different format from the regular Bowl
 * (which runs over a 14-day Sprint Room cycle).
 *
 * Lunar timing is computed from a known new-moon epoch and the mean
 * synodic month (29.530589 days). Full moon = new moon + half cycle.
 * Mean-cycle math has up to ~12h of drift vs. real astronomical full
 * moons; the page surfaces this caveat in the kicker.
 *
 * Seeds (1..8) are built from real championship history pulled from
 * src/lib/battler-bowl-state.ts — most championships first, then most
 * recent title, then alphabetical-by-short-code as the deterministic
 * fallback for gangs without titles. No fabricated rankings.
 */

import { FOUNDING_GANGS, type GangState } from './battler-bowl-state';

// Reference: 2000-01-06 18:14 UTC — well-known new moon used as the
// epoch for mean-cycle ephemeris approximations. Full moon at +14.7653
// days from any new moon.
const NEW_MOON_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_MS = 29.530588853 * 86400000;
const FULL_MOON_OFFSET_MS = 14.76529 * 86400000;

/**
 * Find the next full moon at or after `now` (inclusive of "currently lit
 * full moon" if we're within ~6h of peak). Returns a Date.
 */
export function nextFullMoon(now: Date = new Date()): Date {
  const elapsed = now.getTime() - NEW_MOON_EPOCH_MS;
  const cyclesSinceRef = Math.floor(elapsed / SYNODIC_MONTH_MS);
  let candidate = NEW_MOON_EPOCH_MS + cyclesSinceRef * SYNODIC_MONTH_MS + FULL_MOON_OFFSET_MS;
  // If the candidate already passed by more than ~6h, advance to the next cycle.
  while (candidate + 6 * 3600000 < now.getTime()) {
    candidate += SYNODIC_MONTH_MS;
  }
  return new Date(candidate);
}

/**
 * Hours until the next full moon, signed. Negative means the moon is
 * within the ~6h "still effectively full" window.
 */
export function hoursToNextFullMoon(now: Date = new Date()): number {
  return (nextFullMoon(now).getTime() - now.getTime()) / 3600000;
}

/**
 * Traditional Old Farmer's Almanac names for each calendar month's full
 * moon, in PT month order. The page prefixes the tournament name with
 * the named moon for the month containing the upcoming full moon — e.g.
 * "Flower Moon Cup" for May, "Strawberry Moon Cup" for June.
 */
export const MOON_NAMES_BY_MONTH = [
  'Wolf Moon',       // 0  Jan
  'Snow Moon',       // 1  Feb
  'Worm Moon',       // 2  Mar
  'Pink Moon',       // 3  Apr
  'Flower Moon',     // 4  May
  'Strawberry Moon', // 5  Jun
  'Buck Moon',       // 6  Jul
  'Sturgeon Moon',   // 7  Aug
  'Harvest Moon',    // 8  Sep — name shifts to closest-to-equinox in some years; the page treats this as a heuristic
  "Hunter's Moon",   // 9  Oct
  'Beaver Moon',     // 10 Nov
  'Cold Moon',       // 11 Dec
] as const;

export function namedMoonForDate(d: Date): string {
  // Use PT month for naming so the marquee matches the local El Segundo cycle.
  const pt = new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'America/Los_Angeles' }).format(d);
  const monthIdx = Number(pt) - 1;
  return MOON_NAMES_BY_MONTH[monthIdx] ?? 'Full Moon';
}

export interface MoonSeed {
  seed: number;
  short: string;
  name: string;
  color: string;
  noun: number;
  championships: string[];
  defending: boolean;
  // Honest, public seeding rationale — no scoreboard math.
  rationale: string;
}

/**
 * Build the 8 seeds for the next Moon Tournament. Order:
 *   1. Most championships (defending champ breaks ties of equal count
 *      by sliding ahead, e.g. MC over a hypothetical 2-time champ
 *      who isn't defending — but in S6 the defending is also the only
 *      multi-title gang, so the rule rarely fires).
 *   2. Most recent championship year (S05 > S04 > S01).
 *   3. Alphabetical by short code for un-titled gangs.
 *
 * Pure ranking from facts; if FOUNDING_GANGS gets a real `record` field
 * later, this function is the single place to update.
 */
export function moonSeeds(): MoonSeed[] {
  const sorted = [...FOUNDING_GANGS].sort((a, b) => {
    const aCount = a.championships.length;
    const bCount = b.championships.length;
    if (aCount !== bCount) return bCount - aCount;
    if (aCount > 0 && bCount > 0) {
      const aLast = lastTitleNumber(a);
      const bLast = lastTitleNumber(b);
      if (aLast !== bLast) return bLast - aLast;
    }
    if (a.defending !== b.defending) return a.defending ? -1 : 1;
    return a.short.localeCompare(b.short);
  });

  return sorted.map((g, i) => ({
    seed: i + 1,
    short: g.short,
    name: g.name,
    color: g.color,
    noun: g.noun,
    championships: g.championships,
    defending: g.defending ?? false,
    rationale: rationaleFor(g),
  }));
}

function lastTitleNumber(g: GangState): number {
  if (g.championships.length === 0) return 0;
  const last = g.championships[g.championships.length - 1];
  return Number(last.replace(/\D/g, '')) || 0;
}

function rationaleFor(g: GangState): string {
  const titles = g.championships.length;
  if (titles === 0) return 'No title yet — seeded by deterministic short-code order.';
  const list = g.championships.join(', ');
  if (g.defending) return `${list} · defending. Seeded for title count, then most-recent year, then defending tiebreaker.`;
  return `${list}. Seeded by title count, then most-recent year.`;
}

/**
 * 8-team single-elimination bracket pairings. Standard structure:
 *   QF1: 1 vs 8       SF1: QF1 vs QF4
 *   QF2: 4 vs 5       SF2: QF2 vs QF3
 *   QF3: 3 vs 6       Final: SF1 vs SF2
 *   QF4: 2 vs 7
 */
export interface BracketMatch {
  code: string;
  round: 'QF' | 'SF' | 'F';
  feedsInto?: string; // next round match code
  // Either a seed slot (resolvable from `seeds`) or a winner-of slot
  // (resolvable from a previous match code). Stays unresolved until a
  // result lands.
  top:    { kind: 'seed'; seed: number } | { kind: 'winner'; from: string };
  bottom: { kind: 'seed'; seed: number } | { kind: 'winner'; from: string };
  result: 'pending' | { winnerSeed: number };
}

export function bracketMatches(): BracketMatch[] {
  return [
    { code: 'QF1', round: 'QF', feedsInto: 'SF1', top: { kind: 'seed', seed: 1 }, bottom: { kind: 'seed', seed: 8 }, result: 'pending' },
    { code: 'QF4', round: 'QF', feedsInto: 'SF1', top: { kind: 'seed', seed: 4 }, bottom: { kind: 'seed', seed: 5 }, result: 'pending' },
    { code: 'QF3', round: 'QF', feedsInto: 'SF2', top: { kind: 'seed', seed: 3 }, bottom: { kind: 'seed', seed: 6 }, result: 'pending' },
    { code: 'QF2', round: 'QF', feedsInto: 'SF2', top: { kind: 'seed', seed: 2 }, bottom: { kind: 'seed', seed: 7 }, result: 'pending' },
    { code: 'SF1', round: 'SF', feedsInto: 'F',   top: { kind: 'winner', from: 'QF1' }, bottom: { kind: 'winner', from: 'QF4' }, result: 'pending' },
    { code: 'SF2', round: 'SF', feedsInto: 'F',   top: { kind: 'winner', from: 'QF3' }, bottom: { kind: 'winner', from: 'QF2' }, result: 'pending' },
    { code: 'F',   round: 'F',                    top: { kind: 'winner', from: 'SF1' }, bottom: { kind: 'winner', from: 'SF2' }, result: 'pending' },
  ];
}

/**
 * The single boss field used during a Moon Tournament. Differs from the
 * regular Bowl rotation — it shows up only on tournament night.
 */
export const LUNAR_TIDE_FIELD = {
  code: 'LT',
  title: 'Lunar Tide',
  effect:
    'Every match runs under a slow tide pulse — momentum oscillates with the moon. Ranged volleys land harder near peak; close-quarter brawls land harder during the pull. Healers who time their mints to the down-pull double their effective output. The field gives the night its texture; no other boss field appears.',
};

export interface MoonTournamentSnapshot {
  season: 'S06';
  upcoming: {
    name: string;          // "Flower Moon Cup"
    namedMoon: string;     // "Flower Moon"
    fullMoonIso: string;
    hoursAway: number;
    daysAway: number;
  };
  format: {
    nights: 1;
    teams: 8;
    style: 'single-elimination';
    field: typeof LUNAR_TIDE_FIELD;
  };
  seeds: MoonSeed[];
  bracket: BracketMatch[];
}

export function moonTournamentSnapshot(now: Date = new Date()): MoonTournamentSnapshot {
  const fm = nextFullMoon(now);
  const hoursAway = (fm.getTime() - now.getTime()) / 3600000;
  const namedMoon = namedMoonForDate(fm);
  return {
    season: 'S06',
    upcoming: {
      name: `${namedMoon} Cup`,
      namedMoon,
      fullMoonIso: fm.toISOString(),
      hoursAway: Math.round(hoursAway * 10) / 10,
      daysAway: Math.round((hoursAway / 24) * 10) / 10,
    },
    format: {
      nights: 1,
      teams: 8,
      style: 'single-elimination',
      field: LUNAR_TIDE_FIELD,
    },
    seeds: moonSeeds(),
    bracket: bracketMatches(),
  };
}
