export type ArenaLane = 'west' | 'north' | 'south' | 'east';
export type HitGrade = 'perfect' | 'great' | 'good' | 'miss';

export type ArenaCue = {
  id: string;
  groupId: string;
  beat: number;
  lane: ArenaLane;
  kind: 'single' | 'chord' | 'roll';
};

export type ArenaRound = {
  id: string;
  number: string;
  name: string;
  kicker: string;
  brief: string;
  bpm: number;
  accent: string;
  accentSoft: string;
  bars: string[];
};

export type RuntimeArenaCue = ArenaCue & {
  hitTime: number;
  judged?: boolean;
  pressedAt?: number;
  grade?: HitGrade;
};

export const ARENA_BEST_KEY = 'pc-drum-runner-v6-best';
export const ARENA_MUTED_KEY = 'pc-drum-runner-v6-muted';
export const ARENA_SYNC_KEY = 'pc-drum-runner-v6-sync-ms';
export const ARENA_APPROACH_BEATS = 3;
export const CHORD_WINDOW_MS = 75;

export const LANE_ORDER: ArenaLane[] = ['west', 'north', 'south', 'east'];

export const LANE_META: Record<ArenaLane, {
  key: string;
  arrow: string;
  arrowKey: string;
  label: string;
  color: string;
  frequency: number;
}> = {
  west: { key: 'D', arrow: '←', arrowKey: 'ArrowLeft', label: 'Kick', color: '#ffd166', frequency: 62 },
  north: { key: 'F', arrow: '↑', arrowKey: 'ArrowUp', label: 'Clap', color: '#ff8cb8', frequency: 220 },
  south: { key: 'J', arrow: '↓', arrowKey: 'ArrowDown', label: 'Tom', color: '#78f0ca', frequency: 128 },
  east: { key: 'K', arrow: '→', arrowKey: 'ArrowRight', label: 'Bell', color: '#7ad7ff', frequency: 520 },
};

export const HIT_WINDOWS_MS = {
  perfect: 45,
  great: 90,
  good: 125,
} as const;

export const ARENA_ROUNDS: ArenaRound[] = [
  {
    id: 'four-corners',
    number: '01',
    name: 'Four Corners',
    kicker: 'MAIN STREET · FIND THE CENTER',
    brief: 'Four voices, four directions. Strike each color as it reaches the Noun. Your hands are the drum kit.',
    bpm: 126,
    accent: '#ffd166',
    accentSoft: '#ff9d74',
    bars: [
      'w - n - e - s -',
      'n - w - s - e -',
      'w - e - n - s -',
      's - n - e - w -',
      'w - n - e - s -',
      'w - e - s - n -',
    ],
  },
  {
    id: 'crossfire',
    number: '02',
    name: 'Crossfire',
    kicker: 'EL PORTO · CATCH THE OFFBEAT',
    brief: 'The gaps close and the first two-note hits arrive. Keep both hands loose and listen for the answer.',
    bpm: 140,
    accent: '#72d7ff',
    accentSoft: '#8aefc7',
    bars: [
      'w - n e - s e -',
      'n w - e s - n -',
      'w n we - s e - n',
      's - e w n - es -',
      'w n - e s e - n',
      'we - n s - e ns -',
    ],
  },
  {
    id: 'switchback',
    number: '03',
    name: 'Switchback',
    kicker: 'RALPHS · ROLLS + RESPONSES',
    brief: 'Repeated hits turn into rolls. Follow the color, not the clock—the arena is already on the same clock as the beat.',
    bpm: 154,
    accent: '#ff79c8',
    accentSoft: '#b28cff',
    bars: [
      'w w - n e e - s',
      'n - n w s s - e',
      'w n e - s e n -',
      's s e w - n n e',
      'w - we n s - es n',
      'ns w e - we s n e',
    ],
  },
  {
    id: 'full-send',
    number: '04',
    name: 'Full Send',
    kicker: 'REFINERY · ALL FOUR VOICES',
    brief: 'The whole kit is live at 168 BPM. Chords, rolls, and automatic Rush mode turn one clean streak into the final drop.',
    bpm: 168,
    accent: '#8fffd1',
    accentSoft: '#7aa7ff',
    bars: [
      'w - n e - s n e',
      'n w s e s - e -',
      'w w n - e e s n',
      'wn - e s - w es -',
      'w n e s w - e -',
      'we - ns - e s w -',
      'w n we - s e ns -',
      'wn es - w ns e - s',
    ],
  },
];

const TOKEN_TO_LANE: Record<string, ArenaLane> = {
  w: 'west',
  n: 'north',
  s: 'south',
  e: 'east',
};

export function buildRoundCues(round: ArenaRound): ArenaCue[] {
  const cues: ArenaCue[] = [];
  const onsetBeats: number[] = [];
  round.bars.forEach((bar, barIndex) => {
    const tokens = bar.trim().split(/\s+/);
    if (tokens.length !== 8) throw new Error(`${round.id} bar ${barIndex + 1} needs eight eighth-note slots`);
    tokens.forEach((token, stepIndex) => {
      if (token === '-') return;
      const letters = [...token];
      const lanes = letters.map((letter) => TOKEN_TO_LANE[letter]);
      if (lanes.some((lane) => !lane) || new Set(lanes).size !== lanes.length) {
        throw new Error(`${round.id} has an invalid cue token: ${token}`);
      }
      const beat = barIndex * 4 + stepIndex * 0.5;
      const groupId = `${round.id}-${barIndex}-${stepIndex}`;
      onsetBeats.push(beat);
      lanes.forEach((lane, chordIndex) => cues.push({
        id: `${groupId}-${chordIndex}`,
        groupId,
        beat,
        lane,
        kind: lanes.length > 1 ? 'chord' : 'single',
      }));
    });
  });
  for (const cue of cues) {
    if (cue.kind === 'chord') continue;
    const index = onsetBeats.indexOf(cue.beat);
    const before = onsetBeats[index - 1];
    const after = onsetBeats[index + 1];
    if (Math.abs(cue.beat - before) === 0.5 || Math.abs(after - cue.beat) === 0.5) cue.kind = 'roll';
  }
  return cues.sort((a, b) => a.beat - b.beat || LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane));
}

export function secondsPerBeat(bpm: number): number {
  return 60 / Math.max(1, bpm);
}

export function roundDurationSeconds(round: ArenaRound): number {
  return round.bars.length * 4 * secondsPerBeat(round.bpm);
}

export function approachSecondsForRound(round: ArenaRound): number {
  return ARENA_APPROACH_BEATS * secondsPerBeat(round.bpm);
}

export function compensatedAudioTime(currentTime: number, outputLatency = 0, syncMs = 0): number {
  const safeLatency = Math.max(0, Math.min(0.25, Number.isFinite(outputLatency) ? outputLatency : 0));
  const safeSync = Math.max(-150, Math.min(150, Number.isFinite(syncMs) ? syncMs : 0));
  return currentTime - safeLatency - safeSync / 1000;
}

export function audioTimeForPerformanceTimestamp(
  contextTime: number,
  performanceTime: number,
  eventTime: number,
  syncMs = 0,
): number {
  if (![contextTime, performanceTime, eventTime].every(Number.isFinite)) return Number.NaN;
  return compensatedAudioTime(contextTime + (eventTime - performanceTime) / 1000, 0, syncMs);
}

export function runtimeCues(round: ArenaRound, startTime: number): RuntimeArenaCue[] {
  const beatSeconds = secondsPerBeat(round.bpm);
  return buildRoundCues(round).map((cue) => ({ ...cue, hitTime: startTime + cue.beat * beatSeconds }));
}

export function gradeHit(deltaMs: number): HitGrade {
  const absolute = Math.abs(deltaMs);
  if (absolute <= HIT_WINDOWS_MS.perfect) return 'perfect';
  if (absolute <= HIT_WINDOWS_MS.great) return 'great';
  if (absolute <= HIT_WINDOWS_MS.good) return 'good';
  return 'miss';
}

export function findHittableCue<T extends RuntimeArenaCue>(
  cues: T[],
  lane: ArenaLane,
  audioNow: number,
): { cue: T; deltaMs: number } | null {
  let best: { cue: T; deltaMs: number } | null = null;
  for (const cue of cues) {
    if (cue.judged || cue.lane !== lane) continue;
    const deltaMs = (audioNow - cue.hitTime) * 1000;
    if (Math.abs(deltaMs) > HIT_WINDOWS_MS.good) continue;
    if (!best || Math.abs(deltaMs) < Math.abs(best.deltaMs)) best = { cue, deltaMs };
  }
  return best;
}

export function approachProgress(hitTime: number, audioNow: number, approachSeconds: number): number {
  return Math.max(0, Math.min(1, 1 - (hitTime - audioNow) / approachSeconds));
}

export function arenaTravelProgress(progress: number): number {
  const safeProgress = Math.max(0, Math.min(1, progress));
  return safeProgress ** 1.35;
}

export function countInDisplay(roundStart: number, audioNow: number, beatSeconds: number): string {
  const safeBeat = Math.max(0.001, beatSeconds);
  const remaining = Math.ceil((roundStart - audioNow) / safeBeat);
  return remaining > 0 ? String(Math.min(ARENA_APPROACH_BEATS, remaining)) : 'GO';
}

export function advanceShieldRepair(
  shields: number,
  repairProgress: number,
  cleanTargets: number,
  maxShields = 4,
  repairEvery = 8,
): { shields: number; repairProgress: number; repaired: boolean } {
  const safeMax = Math.max(1, Math.floor(maxShields));
  const safeThreshold = Math.max(1, Math.floor(repairEvery));
  let nextProgress = Math.max(0, Math.floor(repairProgress)) + Math.max(0, Math.floor(cleanTargets));
  let nextShields = Math.max(0, Math.min(safeMax, Math.floor(shields)));
  let repaired = false;
  while (nextProgress >= safeThreshold) {
    nextProgress -= safeThreshold;
    if (nextShields < safeMax) {
      nextShields += 1;
      repaired = true;
    }
  }
  return { shields: nextShields, repairProgress: nextProgress, repaired };
}

export function chordSpanMs(cues: RuntimeArenaCue[]): number {
  const pressed = cues.map((cue) => cue.pressedAt).filter((value): value is number => Number.isFinite(value));
  if (pressed.length < 2) return 0;
  return (Math.max(...pressed) - Math.min(...pressed)) * 1000;
}

export function worstGrade(grades: HitGrade[]): HitGrade {
  const order: HitGrade[] = ['perfect', 'great', 'good', 'miss'];
  return order[Math.max(0, ...grades.map((grade) => order.indexOf(grade)))];
}

export function comboMultiplier(combo: number, rush = false): number {
  if (rush) return 4;
  return Math.min(3, 1 + Math.floor(Math.max(0, combo) / 8) * 0.5);
}

export function hitScore(grade: HitGrade, combo: number, rush = false): number {
  const base = grade === 'perfect' ? 100 : grade === 'great' ? 70 : grade === 'good' ? 40 : 0;
  return Math.round(base * comboMultiplier(combo, rush));
}

export function arenaGrade(accuracy: number): string {
  if (accuracy >= 97) return 'S';
  if (accuracy >= 91) return 'A';
  if (accuracy >= 82) return 'B';
  if (accuracy >= 70) return 'C';
  return 'D';
}

export function laneForKey(key: string): ArenaLane | null {
  const normalized = key.toLowerCase();
  if (normalized === 'd' || normalized === 'arrowleft') return 'west';
  if (normalized === 'f' || normalized === 'arrowup') return 'north';
  if (normalized === 'j' || normalized === 'arrowdown') return 'south';
  if (normalized === 'k' || normalized === 'arrowright') return 'east';
  return null;
}
