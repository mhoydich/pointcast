/**
 * Season 6 Bowl-path state. Single source for /nouns-nation-battler-bowl
 * and /nouns-nation-battler-bowl.json. Edit ONE place to update both
 * surfaces — the page reads these constants, the JSON endpoint serializes
 * them.
 *
 * Anchored to a real season start date (D0). The Bowl page computes the
 * current sprint day from `Date.now()` against this anchor — no hardcoded
 * day pin to drift out of sync.
 *
 * `lockStatus` per gang stays at 'pending' until a real result source is
 * wired (browser-side match engine snapshots → curated post-beat manifest
 * update). When pending, the page shows structural commentary; when set
 * to 'in' / 'locked' / 'bubble' / 'out', the page renders a status pill.
 * Never invent values here — leave 'pending' until backed by a real read.
 */

export const SEASON_6 = {
  code: 'S06',
  name: 'Season 6',
  // D0 = Monday 2026-04-27 PT. Sprint Room calendar runs 14 days from here.
  // Today (2026-05-05) lands as D8 — Rivalry test night.
  d0Iso: '2026-04-27T07:00:00.000Z', // 2026-04-27T00:00:00 PT
  lengthDays: 14,
} as const;

export type LockStatus = 'pending' | 'in' | 'locked' | 'bubble' | 'out';

export interface GangState {
  short: string;
  name: string;
  color: string;
  noun: number;
  line: string;
  // Real, factual history pulled from V3 season-recap data. Do not invent.
  championships: string[]; // ['S01'] etc — empty array if no title
  defending?: boolean;     // true only for the most recent champion
  // Live lock status. 'pending' = no real source yet; do not surface a band
  // pill. The other states require a backing read.
  lockStatus: LockStatus;
}

export const FOUNDING_GANGS: GangState[] = [
  { short: 'TN', name: 'Tomato Noggles',     color: '#e45745', noun: 12, championships: ['S01'],        lockStatus: 'pending', line: 'Face of the league since S01. Clean reads, fast starts; getting punished by weather in S6.' },
  { short: 'CF', name: 'Cobalt Frames',      color: '#3677e0', noun: 41, championships: ['S02'],        lockStatus: 'pending', line: 'Best structure, best captain tree. Cleanest paper path back to the Bowl.' },
  { short: 'GN', name: 'Golden Nouncil',     color: '#d49b19', noun: 58, championships: [],             lockStatus: 'pending', line: 'Quiet runs are easy to miss. Watch the points column, not the wins column.' },
  { short: 'GS', name: 'Garden Stack',       color: '#3f9b54', noun: 27, championships: ['S03'],        lockStatus: 'pending', line: 'Built for messy reads. Scrap Storm and Monsoon Rift turn that into a second-half lever.' },
  { short: 'PU', name: 'Pixel Union',        color: '#8b5cf6', noun:  3, championships: [],             lockStatus: 'pending', line: 'Chaos pick. If the fields skew weird, scrappy matchups become a meme season.' },
  { short: 'NA', name: 'Night Auction',      color: '#2f3a4f', noun: 88, championships: ['S04'],        lockStatus: 'pending', line: 'Heel run from S04. Auction-tower volleys still the most clip-friendly archetype in the league.' },
  { short: 'SP', name: 'Sunset Prop House',  color: '#ef7d2d', noun: 62, championships: [],             lockStatus: 'pending', line: 'S06 wildcard. Rivalry-test night format favors them; rights-receipt week does not.' },
  { short: 'MC', name: 'Mint Condition',     color: '#13a6a1', noun:  9, championships: ['S05'],        lockStatus: 'pending', line: 'Defending champ. No gang has gone back-to-back; the table has learned how to drag them late.', defending: true },
];

export interface SprintDay {
  day: string;
  title: string;
  note: string;
}

export const SPRINT_DAYS: SprintDay[] = [
  { day: 'D0',  title: 'Commissioner kickoff', note: 'Recap link pinned, intake lane published, season story named.' },
  { day: 'D2',  title: 'Expansion combine',    note: 'Imported nations submit colors, code, roster, home, proof, rivalry seed.' },
  { day: 'D5',  title: 'Media week packet',    note: 'Preview cards, MVP watch, upset watch, sponsor reads, repeatable rundown.' },
  { day: 'D8',  title: 'Rivalry test night',   note: 'Named exhibitions before promising a full season. Great rivalries graduate; weak ones stay clips.' },
  { day: 'D12', title: 'Rights and receipts',  note: 'Watch frames, JSON routes, score envelopes, archive pages, sponsor inventory.' },
  { day: 'D14', title: 'Bowl lock',            note: 'Slate freezes, the final gets promoted, agents pick up the postgame publishing checklist.' },
];

export type SprintState = 'done' | 'now' | 'next';

/**
 * Compute the current sprint day number (D0..D14) from a reference time.
 * Day rolls over at 00:00 PT — i.e. D0 is the entire calendar day of the anchor.
 */
export function dayNumber(now: Date = new Date()): number {
  const d0 = new Date(SEASON_6.d0Iso).getTime();
  const elapsed = now.getTime() - d0;
  return Math.max(0, Math.floor(elapsed / 86400000));
}

/**
 * Days remaining until the Bowl lock at D14. 0 means lock day; negative
 * means the season has wrapped.
 */
export function daysToLock(now: Date = new Date()): number {
  return SEASON_6.lengthDays - dayNumber(now);
}

/**
 * Mark each sprint day with done / now / next based on its index relative
 * to the current day number. The 'now' day is the latest milestone whose
 * day-number marker is <= the current day; later milestones are 'next';
 * earlier ones are 'done'.
 */
export function annotateCalendar(now: Date = new Date()): Array<SprintDay & { state: SprintState }> {
  const today = dayNumber(now);
  // Find the highest-indexed milestone whose day marker is <= today.
  const milestones = SPRINT_DAYS.map((m) => Number(m.day.replace('D', '')));
  let nowIdx = -1;
  for (let i = 0; i < milestones.length; i += 1) {
    if (milestones[i] <= today) nowIdx = i;
  }
  return SPRINT_DAYS.map((m, i) => ({
    ...m,
    state: i < nowIdx ? 'done' : i === nowIdx ? 'now' : 'next',
  }));
}

/**
 * Snapshot suitable for serialization in /nouns-nation-battler-bowl.json.
 * Agent-readable; the page computes its own derived view.
 */
export function bowlStateSnapshot(now: Date = new Date()) {
  return {
    season: SEASON_6.code,
    name: SEASON_6.name,
    d0: SEASON_6.d0Iso,
    lengthDays: SEASON_6.lengthDays,
    today: {
      iso: now.toISOString(),
      day: dayNumber(now),
      daysToLock: daysToLock(now),
    },
    calendar: annotateCalendar(now),
    gangs: FOUNDING_GANGS.map((g) => ({
      short: g.short,
      name: g.name,
      color: g.color,
      noun: g.noun,
      championships: g.championships,
      defending: g.defending ?? false,
      lockStatus: g.lockStatus,
    })),
    // 'pending' until a real read source plugs in. Documents the contract
    // future updates need to satisfy. See src/lib/battler-bowl-state.ts.
    liveStatusContract: {
      values: ['pending', 'in', 'locked', 'bubble', 'out'],
      pendingMeans: 'no real result read yet — page falls back to structural framing for this gang',
      writePath: 'edit FOUNDING_GANGS in src/lib/battler-bowl-state.ts when a beat brings new signal',
    },
  };
}
