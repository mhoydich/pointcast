import publishedRecord from '../../public/games/nouns-nation-battler/records/rivalry-night-001.json';

export type RivalrySide = 'left' | 'right';
export interface RivalryTeam {
  gang: string;
  tactic: string;
  roster: Record<string, number>;
}
export interface RivalryUnit {
  id: number;
  side: RivalrySide;
  gang: string;
  role: string;
  nounId: number;
  maxHp: number;
}
export interface RivalryMatch {
  rulesVersion: string;
  mode: string;
  input: { seed: number; left: RivalryTeam; right: RivalryTeam };
  field: { width: number; height: number };
  tickMs: number;
  ticks: number;
  durationMs: number;
  winner: RivalrySide | 'draw';
  reason: 'elimination' | 'time-limit';
  survivors: Record<RivalrySide, number>;
  health: Record<RivalrySide, number>;
  healthScore: Record<RivalrySide, number>;
  units: RivalryUnit[];
  frames: { tick: number; units: [id: number, x: number, y: number, hp: number][] }[];
  events: { tick: number; type: string; actor: number | null; target: number | null; amount: number; text: string }[];
  eventsTruncated: number;
}

export type RivalryNightRecord = Omit<typeof publishedRecord, 'match'> & { match: RivalryMatch };

// Publication data is imported, never regenerated during an Astro build. Saved
// frames and catalog keep the original replay usable after future rule changes.
// JSON imports widen frame tuples to number[][]; the publication tests validate
// the narrower replay contract, including every tuple and unit identity.
export const RIVALRY_NIGHT_RECORD = publishedRecord as unknown as RivalryNightRecord;
export const RIVALRY_NIGHT_META = RIVALRY_NIGHT_RECORD.metadata;

const match = RIVALRY_NIGHT_RECORD.match;
const finalHp = new Map(match.frames.at(-1)!.units.map(([id, , , hp]) => [id, hp]));
const candidates = match.units
  .filter(unit => (match.winner === 'draw' || unit.side === match.winner) && (finalHp.get(unit.id) ?? 0) > 0)
  .map(unit => ({ ...unit, hp: finalHp.get(unit.id) ?? 0 }))
  .sort((a, b) => b.hp * a.maxHp - a.hp * b.maxHp || b.hp - a.hp || a.id - b.id);

// The event feed is capped, so this is a transparent final-frame selection,
// not an inferred top scorer or a count of partially recorded knockouts.
export const RIVALRY_NIGHT_STANDOUT = candidates[0] ? {
  ...candidates[0],
  healthPercent: Math.round(candidates[0].hp * 100 / candidates[0].maxHp),
  basis: 'Highest remaining health percentage among the winning survivors; ties use remaining health, then unit ID.',
} : null;
