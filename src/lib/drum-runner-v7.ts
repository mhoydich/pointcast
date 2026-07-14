export type SiegeLane = 'west' | 'north' | 'south' | 'east';
export type SiegeGrade = 'perfect' | 'great' | 'good' | 'late';
export type SiegePowerup = 'repair' | 'drop';

export type LoopHit = {
  lane: SiegeLane;
  step: number;
};

export type EchoEvent = LoopHit & {
  hitTime: number;
  ghost: true;
};

export type SiegeEnemy = {
  id: string;
  lane: SiegeLane;
  spawnBeat: number;
  deadlineBeat: number;
  hp: number;
  maxHp: number;
  tier: 1 | 2 | 3;
  dead?: boolean;
  breached?: boolean;
};

export type SiegeWave = {
  id: string;
  number: string;
  name: string;
  kicker: string;
  brief: string;
  bpm: number;
  noteBudget: number;
  accent: string;
  accentSoft: string;
  bars: string[];
};

export const SIEGE_BEST_KEY = 'pc-drum-runner-v7-best';
export const SIEGE_MUTED_KEY = 'pc-drum-runner-v7-muted';
export const SIEGE_SYNC_KEY = 'pc-drum-runner-v7-sync-ms';
export const SIEGE_LOOP_STEPS = 16;
export const SIEGE_STEP_BEATS = 0.5;
export const SIEGE_SHIELDS = 4;

export const SIEGE_HIT_WINDOWS_MS = {
  perfect: 28,
  great: 52,
  good: 75,
} as const;

export const SIEGE_LANE_ORDER: SiegeLane[] = ['west', 'north', 'south', 'east'];

export const SIEGE_LANE_META: Record<SiegeLane, {
  key: string;
  arrow: string;
  arrowKey: string;
  label: string;
  color: string;
  frequency: number;
}> = {
  west: { key: 'D', arrow: '←', arrowKey: 'ArrowLeft', label: 'Kick gate', color: '#ffcf4a', frequency: 62 },
  north: { key: 'F', arrow: '↑', arrowKey: 'ArrowUp', label: 'Clap gate', color: '#ff6faa', frequency: 224 },
  south: { key: 'J', arrow: '↓', arrowKey: 'ArrowDown', label: 'Tom gate', color: '#56dfb1', frequency: 132 },
  east: { key: 'K', arrow: '→', arrowKey: 'ArrowRight', label: 'Bell gate', color: '#63cfff', frequency: 535 },
};

export const SIEGE_WAVES: SiegeWave[] = [
  {
    id: 'first-ring',
    number: '01',
    name: 'First Ring',
    kicker: 'MAIN STREET · WRITE THE DEFENSE',
    brief: 'Pick the threatened gate. Every clean strike fires now and writes the ghost phrase that fights one loop later.',
    bpm: 132,
    noteBudget: 16,
    accent: '#ffcf4a',
    accentSoft: '#ff8d6e',
    bars: [
      'w1 - n1 - e1 - s1 -',
      'n1 - e1 - s1 - w1 -',
      'w1 - - n2 - e1 - s1',
      's1 - w1 - n1 - e2 -',
      'wn1 - e1 - s1 - w1 -',
      'w2 - n2 - e2 - s2 -',
    ],
  },
  {
    id: 'cross-talk',
    number: '02',
    name: 'Cross Talk',
    kicker: 'EL PORTO · TWO GATES TALK',
    brief: 'Pairs arrive together. Write useful chords into the loop and let the ghost cover the lane you cannot reach next.',
    bpm: 148,
    noteBudget: 14,
    accent: '#63cfff',
    accentSoft: '#56dfb1',
    bars: [
      'wn1 - e1 - s1 - we1 -',
      'n1 - ws1 - e1 - n2 -',
      'w2 - e1 s1 - n1 - e2',
      's1 wn1 - e1 - ns1 - w1',
      'we1 - n2 - s2 - en1 -',
      'w2 n1 - e2 s1 - n2 e1',
    ],
  },
  {
    id: 'heavy-weather',
    number: '03',
    name: 'Heavy Weather',
    kicker: 'RALPHS · BRUTES IN THE LOOP',
    brief: 'Heavy raiders need repeated notes. A smart phrase lands the second hit for you while you move to the next deadline.',
    bpm: 164,
    noteBudget: 12,
    accent: '#ff6faa',
    accentSoft: '#a579ff',
    bars: [
      'wn2 - n1 e1 - s2 - n1',
      'e2 w1 - s1 n2 - e1 -',
      'ws1 - n2 - e2 - sn1 -',
      'w3 - e1 n1 - s2 - e1',
      'n2 ws1 - e3 - s1 - n1',
      'we2 - ns2 - w3 e1 s1 -',
    ],
  },
  {
    id: 'full-circle',
    number: '04',
    name: 'Full Circle',
    kicker: 'REFINERY · THE LOOP FIGHTS BACK',
    brief: 'All four gates are live at 180 BPM. Prioritize the closest deadline, trust the ghost, and earn the final drop.',
    bpm: 180,
    noteBudget: 12,
    accent: '#67efc2',
    accentSoft: '#ffcf4a',
    bars: [
      'wn1 e1 s1 - we2 - n1 s1',
      'w2 n1 e2 s1 - wn1 - e1',
      'ws2 - ne1 - w3 - s1 e1',
      'n2 we1 s2 en1 - w1 e2 -',
      'w3 n2 e1 s2 wn1 - es1 -',
      'we2 ns2 w3 e3 s1 n1 we1 -',
    ],
  },
];

const TOKEN_TO_LANE: Record<string, SiegeLane> = {
  w: 'west',
  n: 'north',
  s: 'south',
  e: 'east',
};

const TIER_DEADLINE_BEATS: Record<1 | 2 | 3, number> = { 1: 1.5, 2: 2.5, 3: 3.5 };

export function secondsPerBeat(bpm: number): number {
  return 60 / Math.max(1, bpm);
}

export function stepSeconds(bpm: number): number {
  return secondsPerBeat(bpm) * SIEGE_STEP_BEATS;
}

export function loopSeconds(bpm: number): number {
  return stepSeconds(bpm) * SIEGE_LOOP_STEPS;
}

export function buildWaveEnemies(wave: SiegeWave): SiegeEnemy[] {
  const enemies: SiegeEnemy[] = [];
  wave.bars.forEach((bar, barIndex) => {
    const tokens = bar.trim().split(/\s+/);
    if (tokens.length !== 8) throw new Error(`${wave.id} bar ${barIndex + 1} needs eight eighth-note cells`);
    tokens.forEach((token, stepIndex) => {
      if (token === '-') return;
      const match = token.match(/^([wnse]+)([123])$/);
      if (!match) throw new Error(`${wave.id} has an invalid enemy token: ${token}`);
      const tier = Number(match[2]) as 1 | 2 | 3;
      const spawnBeat = barIndex * 4 + stepIndex * SIEGE_STEP_BEATS;
      [...match[1]].forEach((letter, laneIndex) => {
        const lane = TOKEN_TO_LANE[letter];
        if (!lane) throw new Error(`${wave.id} has an invalid lane token: ${token}`);
        enemies.push({
          id: `${wave.id}-${barIndex}-${stepIndex}-${laneIndex}`,
          lane,
          spawnBeat,
          deadlineBeat: spawnBeat + TIER_DEADLINE_BEATS[tier],
          hp: tier,
          maxHp: tier,
          tier,
        });
      });
    });
  });
  return enemies.sort((a, b) => a.spawnBeat - b.spawnBeat
    || a.deadlineBeat - b.deadlineBeat
    || SIEGE_LANE_ORDER.indexOf(a.lane) - SIEGE_LANE_ORDER.indexOf(b.lane));
}

export function waveEndBeat(wave: SiegeWave): number {
  return Math.max(wave.bars.length * 4, ...buildWaveEnemies(wave).map((enemy) => enemy.deadlineBeat)) + 1;
}

export function absoluteStepAtTime(audioNow: number, startTime: number, bpm: number): number {
  if (![audioNow, startTime, bpm].every(Number.isFinite)) return 0;
  return Math.max(0, Math.floor((audioNow - startTime) / stepSeconds(bpm) + 1e-9));
}

export function loopStepAtTime(audioNow: number, startTime: number, bpm: number): number {
  return absoluteStepAtTime(audioNow, startTime, bpm) % SIEGE_LOOP_STEPS;
}

export function loopOrdinalAtTime(audioNow: number, startTime: number, bpm: number): number {
  return Math.floor(absoluteStepAtTime(audioNow, startTime, bpm) / SIEGE_LOOP_STEPS);
}

export function gradeLoopHit(audioNow: number, startTime: number, bpm: number): {
  absoluteStep: number;
  step: number;
  targetTime: number;
  deltaMs: number;
  grade: SiegeGrade;
} {
  const absoluteStep = Math.max(0, Math.floor((audioNow - startTime) / stepSeconds(bpm) + 0.5 + 1e-9));
  const targetTime = startTime + absoluteStep * stepSeconds(bpm);
  const deltaMs = (audioNow - targetTime) * 1000;
  const distance = Math.abs(deltaMs);
  const grade: SiegeGrade = distance <= SIEGE_HIT_WINDOWS_MS.perfect
    ? 'perfect'
    : distance <= SIEGE_HIT_WINDOWS_MS.great
      ? 'great'
      : distance <= SIEGE_HIT_WINDOWS_MS.good
        ? 'good'
        : 'late';
  return { absoluteStep, step: absoluteStep % SIEGE_LOOP_STEPS, targetTime, deltaMs, grade };
}

export function recordLoopHit(pattern: LoopHit[], lane: SiegeLane, step: number): LoopHit[] {
  if (!SIEGE_LANE_ORDER.includes(lane)) throw new Error(`invalid loop lane: ${lane}`);
  if (!Number.isInteger(step) || step < 0 || step >= SIEGE_LOOP_STEPS) throw new Error(`loop step must be 0-${SIEGE_LOOP_STEPS - 1}`);
  if (pattern.some((hit) => hit.lane === lane && hit.step === step)) return pattern.map((hit) => ({ ...hit }));
  if (pattern.filter((hit) => hit.step === step).length >= 2) return pattern.map((hit) => ({ ...hit }));
  return [...pattern.map((hit) => ({ ...hit })), { lane, step }].sort((a, b) => a.step - b.step
    || SIEGE_LANE_ORDER.indexOf(a.lane) - SIEGE_LANE_ORDER.indexOf(b.lane));
}

export function echoEventsForBar(pattern: LoopHit[], barStart: number, bpm: number): EchoEvent[] {
  const seconds = stepSeconds(bpm);
  return pattern.map((hit) => ({
    ...hit,
    hitTime: barStart + hit.step * seconds,
    ghost: true as const,
  }));
}

export function applyAttack<T extends SiegeEnemy>(enemy: T, lane: SiegeLane, damage = 1): T & { dead?: boolean } {
  if (enemy.lane !== lane || enemy.dead || enemy.breached || damage <= 0) return { ...enemy };
  const hp = Math.max(0, enemy.hp - Math.max(0, damage));
  return { ...enemy, hp, dead: hp === 0 };
}

export function resolveEnemyDeadlines<T extends SiegeEnemy>(enemies: T[], currentBeat: number, shields: number): {
  enemies: T[];
  shields: number;
  breaches: number;
} {
  let nextShields = Math.max(0, Math.floor(shields));
  let breaches = 0;
  const nextEnemies = enemies.map((enemy) => {
    if (enemy.dead || enemy.breached || currentBeat < enemy.deadlineBeat) return { ...enemy };
    breaches += 1;
    nextShields = Math.max(0, nextShields - 1);
    return { ...enemy, breached: true };
  }) as T[];
  return { enemies: nextEnemies, shields: nextShields, breaches };
}

export function powerupForKills(kills: number): SiegePowerup | null {
  if (!Number.isInteger(kills) || kills <= 0) return null;
  if (kills % 12 === 0) return 'drop';
  if (kills % 6 === 0) return 'repair';
  return null;
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

export function enemyApproachProgress(enemy: SiegeEnemy, currentBeat: number): number {
  if (currentBeat < enemy.spawnBeat) return 0;
  const duration = Math.max(SIEGE_STEP_BEATS, enemy.deadlineBeat - enemy.spawnBeat);
  return Math.max(0, Math.min(1, (currentBeat - enemy.spawnBeat) / duration));
}

export function laneForKey(key: string): SiegeLane | null {
  const normalized = key.toLowerCase();
  if (normalized === 'd' || normalized === 'arrowleft') return 'west';
  if (normalized === 'f' || normalized === 'arrowup') return 'north';
  if (normalized === 'j' || normalized === 'arrowdown') return 'south';
  if (normalized === 'k' || normalized === 'arrowright') return 'east';
  return null;
}
