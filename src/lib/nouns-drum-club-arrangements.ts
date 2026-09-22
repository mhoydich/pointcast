import { PAD_BY_ID, type PadFamily } from './nouns-drum-club-audio.ts';
import {
  NOUNS_DRUM_CLUB_BANDMATES,
  NOUNS_DRUM_CLUB_BANDMATES_BASE,
  getNounsDrumClubBandmate,
  type NounsDrumClubBandmate,
  type NounsDrumClubBandmateRole,
} from './nouns-drum-club-bandmates.ts';
import { encodeScore, normalizeScore, type DrumScore } from './nouns-drum-club-score.ts';

export const BANDMATE_QUARTET_ROLES = Object.freeze([
  'drum',
  'bass',
  'mallet',
  'chord',
] as const);

export type BandmateQuartet = readonly [
  drumId: number,
  bassId: number,
  malletId: number,
  chordId: number,
];

export type BandmateArrangement = {
  dateKey: string;
  quartet: BandmateQuartet;
  members: readonly NounsDrumClubBandmate[];
  prompt: string;
  score: DrumScore;
  playUrl: string;
};

const ROLE_FAMILIES = Object.freeze({
  drum: ['drums'],
  bass: ['bass'],
  mallet: ['mallets'],
  chord: ['chords', 'ear-candy'],
} as const satisfies Readonly<Record<NounsDrumClubBandmateRole, readonly PadFamily[]>>);

const MEMBERS_BY_ROLE = Object.freeze(Object.fromEntries(
  BANDMATE_QUARTET_ROLES.map((role) => [
    role,
    Object.freeze(NOUNS_DRUM_CLUB_BANDMATES.filter((member) => member.role === role)),
  ]),
) as Record<NounsDrumClubBandmateRole, readonly NounsDrumClubBandmate[]>);

function memberForRole(id: unknown, role: NounsDrumClubBandmateRole): NounsDrumClubBandmate | null {
  if (!Number.isInteger(id)) return null;
  const member = getNounsDrumClubBandmate(id as number);
  return member?.role === role ? member : null;
}

/** Returns a fresh validated tuple, or null when IDs are malformed, missing, duplicated, or out of role order. */
export function validateBandmateQuartet(value: unknown): BandmateQuartet | null {
  if (!Array.isArray(value) || value.length !== BANDMATE_QUARTET_ROLES.length) return null;
  if (value.some((id) => typeof id !== 'number' || !Number.isInteger(id))) return null;
  const ids = [...value] as number[];
  if (new Set(ids).size !== ids.length) return null;
  for (let index = 0; index < BANDMATE_QUARTET_ROLES.length; index++) {
    if (!memberForRole(ids[index], BANDMATE_QUARTET_ROLES[index])) return null;
  }
  return Object.freeze(ids) as unknown as BandmateQuartet;
}

export function encodeBandmateQuartet(quartet: BandmateQuartet): string {
  const valid = validateBandmateQuartet(quartet);
  if (!valid) throw new TypeError('Bandmate quartet must contain drum, bass, mallet, and chord IDs in that order');
  return valid.join(',');
}

export function decodeBandmateQuartet(value: unknown): BandmateQuartet | null {
  if (typeof value !== 'string' || !/^\d+,\d+,\d+,\d+$/.test(value)) return null;
  return validateBandmateQuartet(value.split(',').map(Number));
}

function quartetMembers(quartet: BandmateQuartet): readonly NounsDrumClubBandmate[] {
  const valid = validateBandmateQuartet(quartet);
  if (!valid) throw new TypeError('Bandmate quartet must contain drum, bass, mallet, and chord IDs in that order');
  return Object.freeze(valid.map((id, index) => memberForRole(id, BANDMATE_QUARTET_ROLES[index])!));
}

/** Builds a full-band score while keeping only the musical family each member was cast to play. */
export function composeBandmateScore(quartet: BandmateQuartet, name?: string): DrumScore {
  const members = quartetMembers(quartet);
  const tempos = members.map((member) => member.tempo).sort((a, b) => a - b);
  const tempo = Math.round((tempos[1] + tempos[2]) / 2);
  const swing = Math.round((members.reduce((sum, member) => sum + member.swing, 0) / members.length) * 1000) / 1000;
  const lanes = members.flatMap((member) => {
    const allowed: readonly PadFamily[] = ROLE_FAMILIES[member.role];
    return member.score.lanes
      .filter((lane) => {
        const pad = PAD_BY_ID.get(lane.padId);
        return Boolean(pad && allowed.includes(pad.family));
      })
      .map((lane) => ({ padId: lane.padId, steps: [...lane.steps] }));
  });
  const composed = normalizeScore({
    version: 1,
    name: name?.trim() || `${members.map((member) => member.name).join(' + ')}`,
    tempo,
    swing,
    lanes,
  });
  // A second normalization makes a 60-character truncation ending in space
  // canonical before it reaches the URL codec.
  return normalizeScore(composed);
}

function dateKeyAndDay(date: Date | string): { dateKey: string; day: number } {
  if (typeof date === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TypeError('Daily band date must use YYYY-MM-DD');
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new RangeError('Daily band date is invalid');
    return { dateKey: date, day: Math.floor(parsed.getTime() / 86_400_000) };
  }
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new RangeError('Daily band date is invalid');
  return { dateKey: date.toISOString().slice(0, 10), day: Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000) };
}

/** Base-3 rotation: every possible quartet appears exactly once in any consecutive 81 UTC days. */
export function dailyBandmateQuartet(date: Date | string = new Date()): BandmateQuartet {
  const { day } = dateKeyAndDay(date);
  // 31 is coprime with 81, so the permutation still visits every quartet once
  // while changing several chairs more often than a plain base-3 counter.
  let index = ((((day % 81) + 81) % 81) * 31) % 81;
  const ids = BANDMATE_QUARTET_ROLES.map((role) => {
    const members = MEMBERS_BY_ROLE[role];
    if (members.length !== 3) throw new Error(`Daily band requires exactly three ${role} bandmates`);
    const member = members[index % 3];
    index = Math.floor(index / 3);
    return member.id;
  });
  return validateBandmateQuartet(ids)!;
}

/** A short authored invitation; member names are data, while the musical direction stays predictable. */
export function bandmateArrangementPrompt(quartet: BandmateQuartet): string {
  const [drum, bass, mallet, chord] = quartetMembers(quartet);
  return `${drum.name} sets the pocket. ${bass.name} carries the floor. ${mallet.name} answers in color, and ${chord.name} opens the sky. Leave one step empty, then add your sound.`;
}

export function nounsDrumClubArrangementPlayUrl(
  quartet: BandmateQuartet,
  score: DrumScore = composeBandmateScore(quartet),
): string {
  const encodedBand = encodeBandmateQuartet(quartet);
  const url = new URL('/nouns/drum-club/', NOUNS_DRUM_CLUB_BANDMATES_BASE);
  url.searchParams.set('beat', encodeScore(score));
  url.searchParams.set('band', encodedBand);
  return url.href;
}

export function nounsDrumClubBandmateArrangement(date: Date | string = new Date()): BandmateArrangement {
  const { dateKey } = dateKeyAndDay(date);
  const quartet = dailyBandmateQuartet(dateKey);
  const members = quartetMembers(quartet);
  const score = composeBandmateScore(quartet, `${dateKey} · Today’s Band`);
  return Object.freeze({
    dateKey,
    quartet,
    members,
    prompt: bandmateArrangementPrompt(quartet),
    score,
    playUrl: nounsDrumClubArrangementPlayUrl(quartet, score),
  });
}
