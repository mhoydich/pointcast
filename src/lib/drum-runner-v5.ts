import type { NounVoice, PowerUpKind } from './drum-runner-v4';

export const ROAD_PASS_SCHEMA = 1 as const;
export const ROAD_PASS_GAME = 'beat-runner-v5' as const;
export const ROAD_PASS_STORAGE_KEY = 'pc-drum-runner-v5-road-pass';
export const ROAD_PASS_PROOF_KEY = 'pc-drum-runner-v5-signed-pass';
export const VISIT_NOUNS_CONTRACT = 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh';

export const XP_VALUES = {
  perfect: 12,
  good: 8,
  gear: 5,
  levelClear: 25,
  cleanLevel: 15,
  campaignClear: 50,
  stamp: 50,
  roadLegend: 250,
} as const;

export type AchievementId =
  | 'first-mile'
  | 'deep-pocket'
  | 'full-band'
  | 'gearhead'
  | 'ghost-rider'
  | 'clean-street'
  | 'city-loop'
  | 'road-keeper'
  | 'four-voices'
  | 'road-legend';

export const ACHIEVEMENTS: ReadonlyArray<{
  id: AchievementId;
  name: string;
  glyph: string;
  hint: string;
  xp: number;
}> = [
  { id: 'first-mile', name: 'First Mile', glyph: '☀', hint: 'Clear any level', xp: XP_VALUES.stamp },
  { id: 'deep-pocket', name: 'Deep Pocket', glyph: '8', hint: 'Reach a pocket of 8', xp: XP_VALUES.stamp },
  { id: 'full-band', name: 'Full Band', glyph: '♪', hint: 'Unlock all three stems', xp: XP_VALUES.stamp },
  { id: 'gearhead', name: 'Gearhead', glyph: '✦', hint: 'Collect all four gear kinds', xp: XP_VALUES.stamp },
  { id: 'ghost-rider', name: 'Ghost Rider', glyph: '◌', hint: 'Let Ghost Soles save a heart', xp: XP_VALUES.stamp },
  { id: 'clean-street', name: 'Clean Street', glyph: '✓', hint: 'Clear with no hit, miss, or off-grid tap', xp: XP_VALUES.stamp },
  { id: 'city-loop', name: 'City Loop', glyph: '∞', hint: 'Clear the four-level route', xp: XP_VALUES.stamp },
  { id: 'road-keeper', name: 'Road Keeper', glyph: '▦', hint: 'Save a performed road', xp: XP_VALUES.stamp },
  { id: 'four-voices', name: 'Four Voices', glyph: '4', hint: 'Clear with clave, pluck, bell, and clap', xp: XP_VALUES.stamp },
  { id: 'road-legend', name: 'Road Legend', glyph: '★', hint: 'Earn every other stamp', xp: XP_VALUES.roadLegend },
] as const;

export type SavedRoad = {
  id: string;
  levelId: string;
  levelName: string;
  nounId: number;
  voice: NounVoice;
  bpm: number;
  phrase: Array<{ step: number; note: number; grade: 'perfect' | 'good' }>;
  score: number;
  accuracy: number;
  createdAt: number;
};

export type RoadPassProfile = {
  schema: typeof ROAD_PASS_SCHEMA;
  game: typeof ROAD_PASS_GAME;
  xp: number;
  achievements: Partial<Record<AchievementId, { earnedAt: number }>>;
  stats: {
    perfect: number;
    good: number;
    misses: number;
    offgrid: number;
    gearCollected: number;
    levelsCleared: number;
    cleanLevels: number;
    campaignsCleared: number;
    ghostSaves: number;
    fullBandClears: number;
    bestFlow: number;
  };
  clearedLevels: string[];
  clearedVoices: NounVoice[];
  gearKinds: PowerUpKind[];
  savedRoads: SavedRoad[];
  bestScore: number;
  selectedNounId: number;
  completedLevel: number;
  revision: number;
  updatedAt: number;
};

export type RoadEvent =
  | { type: 'cue'; grade: 'perfect' | 'good' }
  | { type: 'miss' }
  | { type: 'offgrid' }
  | { type: 'gear'; kind: PowerUpKind }
  | { type: 'flow'; value: number }
  | { type: 'ghost-save' }
  | { type: 'level-clear'; levelId: string; voice: NounVoice; clean: boolean; fullBand: boolean; levelIndex: number; score: number }
  | { type: 'campaign-clear' }
  | { type: 'road-save'; road: SavedRoad }
  | { type: 'select-noun'; nounId: number }
  | { type: 'score'; value: number };

const VOICES: NounVoice[] = ['clave', 'pluck', 'bell', 'clap'];
const GEAR: PowerUpKind[] = ['noggles', 'tape', 'bass', 'ghost'];
const NORMAL_ACHIEVEMENTS = ACHIEVEMENTS.filter((achievement) => achievement.id !== 'road-legend');

function finiteInt(value: unknown, fallback = 0, min = 0, max = 1_000_000_000): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function uniqueAllowed<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is T => allowed.includes(item as T)))];
}

function normalizeRoad(value: unknown): SavedRoad | null {
  const road = value as Partial<SavedRoad> | null;
  if (!road || typeof road !== 'object') return null;
  const levelId = String(road.levelId ?? '').slice(0, 80);
  const id = String(road.id ?? '').slice(0, 140);
  if (!id || !levelId || !VOICES.includes(road.voice as NounVoice)) return null;
  const phrase = Array.isArray(road.phrase)
    ? road.phrase.slice(0, 64).flatMap((note) => {
        const candidate = note as { step?: unknown; note?: unknown; grade?: unknown };
        if (candidate.grade !== 'perfect' && candidate.grade !== 'good') return [];
        return [{
          step: finiteInt(candidate.step, 0, 0, 63),
          note: finiteInt(candidate.note, 0, 0, 24),
          grade: candidate.grade,
        }];
      })
    : [];
  return {
    id,
    levelId,
    levelName: String(road.levelName ?? levelId).slice(0, 80),
    nounId: finiteInt(road.nounId, 137, 0, 1199),
    voice: road.voice as NounVoice,
    bpm: finiteInt(road.bpm, 92, 40, 240),
    phrase,
    score: finiteInt(road.score),
    accuracy: finiteInt(road.accuracy, 0, 0, 100),
    createdAt: finiteInt(road.createdAt, Date.now(), 0, Number.MAX_SAFE_INTEGER),
  };
}

export function defaultRoadPass(now = Date.now()): RoadPassProfile {
  return {
    schema: ROAD_PASS_SCHEMA,
    game: ROAD_PASS_GAME,
    xp: 0,
    achievements: {},
    stats: {
      perfect: 0,
      good: 0,
      misses: 0,
      offgrid: 0,
      gearCollected: 0,
      levelsCleared: 0,
      cleanLevels: 0,
      campaignsCleared: 0,
      ghostSaves: 0,
      fullBandClears: 0,
      bestFlow: 0,
    },
    clearedLevels: [],
    clearedVoices: [],
    gearKinds: [],
    savedRoads: [],
    bestScore: 0,
    selectedNounId: 137,
    completedLevel: -1,
    revision: 0,
    updatedAt: now,
  };
}

export function normalizeRoadPass(value: unknown, now = Date.now()): RoadPassProfile {
  const source = value && typeof value === 'object' ? value as Partial<RoadPassProfile> : {};
  const base = defaultRoadPass(now);
  const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
  const achievements: RoadPassProfile['achievements'] = {};
  for (const achievement of ACHIEVEMENTS) {
    const earnedAt = finiteInt(source.achievements?.[achievement.id]?.earnedAt, -1, -1, Number.MAX_SAFE_INTEGER);
    if (earnedAt >= 0) achievements[achievement.id] = { earnedAt };
  }
  const roads = Array.isArray(source.savedRoads)
    ? source.savedRoads.map(normalizeRoad).filter((road): road is SavedRoad => Boolean(road))
    : [];
  const dedupedRoads = [...new Map(roads.map((road) => [road.id, road])).values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12);
  return {
    ...base,
    xp: finiteInt(source.xp),
    achievements,
    stats: {
      perfect: finiteInt(stats.perfect),
      good: finiteInt(stats.good),
      misses: finiteInt(stats.misses),
      offgrid: finiteInt(stats.offgrid),
      gearCollected: finiteInt(stats.gearCollected),
      levelsCleared: finiteInt(stats.levelsCleared),
      cleanLevels: finiteInt(stats.cleanLevels),
      campaignsCleared: finiteInt(stats.campaignsCleared),
      ghostSaves: finiteInt(stats.ghostSaves),
      fullBandClears: finiteInt(stats.fullBandClears),
      bestFlow: finiteInt(stats.bestFlow),
    },
    clearedLevels: Array.isArray(source.clearedLevels)
      ? [...new Set(source.clearedLevels.map(String).filter(Boolean))].slice(0, 32)
      : [],
    clearedVoices: uniqueAllowed(source.clearedVoices, VOICES),
    gearKinds: uniqueAllowed(source.gearKinds, GEAR),
    savedRoads: dedupedRoads,
    bestScore: finiteInt(source.bestScore),
    selectedNounId: finiteInt(source.selectedNounId, 137, 0, 1199),
    completedLevel: finiteInt(source.completedLevel, -1, -1, 3),
    revision: finiteInt(source.revision),
    updatedAt: finiteInt(source.updatedAt, now, 0, Number.MAX_SAFE_INTEGER),
  };
}

function achievementReady(profile: RoadPassProfile, id: AchievementId): boolean {
  if (id === 'first-mile') return profile.clearedLevels.length >= 1;
  if (id === 'deep-pocket') return profile.stats.bestFlow >= 8;
  if (id === 'full-band') return profile.stats.fullBandClears >= 1;
  if (id === 'gearhead') return GEAR.every((kind) => profile.gearKinds.includes(kind));
  if (id === 'ghost-rider') return profile.stats.ghostSaves >= 1;
  if (id === 'clean-street') return profile.stats.cleanLevels >= 1;
  if (id === 'city-loop') return profile.stats.campaignsCleared >= 1;
  if (id === 'road-keeper') return profile.savedRoads.length >= 1;
  if (id === 'four-voices') return VOICES.every((voice) => profile.clearedVoices.includes(voice));
  return NORMAL_ACHIEVEMENTS.every((achievement) => Boolean(profile.achievements[achievement.id]));
}

function unlockReadyAchievements(profile: RoadPassProfile, now: number): AchievementId[] {
  const unlocked: AchievementId[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (profile.achievements[achievement.id] || !achievementReady(profile, achievement.id)) continue;
    profile.achievements[achievement.id] = { earnedAt: now };
    profile.xp += achievement.xp;
    unlocked.push(achievement.id);
  }
  return unlocked;
}

export function applyRoadEvent(
  input: RoadPassProfile,
  event: RoadEvent,
  now = Date.now(),
): { profile: RoadPassProfile; baseXp: number; stampXp: number; unlocked: AchievementId[] } {
  const profile = normalizeRoadPass(input, now);
  let baseXp = 0;
  if (event.type === 'cue') {
    profile.stats[event.grade]++;
    baseXp = XP_VALUES[event.grade];
  } else if (event.type === 'miss') {
    profile.stats.misses++;
  } else if (event.type === 'offgrid') {
    profile.stats.offgrid++;
  } else if (event.type === 'gear') {
    profile.stats.gearCollected++;
    if (!profile.gearKinds.includes(event.kind)) profile.gearKinds.push(event.kind);
    baseXp = XP_VALUES.gear;
  } else if (event.type === 'flow') {
    profile.stats.bestFlow = Math.max(profile.stats.bestFlow, finiteInt(event.value));
  } else if (event.type === 'ghost-save') {
    profile.stats.ghostSaves++;
  } else if (event.type === 'level-clear') {
    profile.stats.levelsCleared++;
    if (!profile.clearedLevels.includes(event.levelId)) profile.clearedLevels.push(event.levelId);
    if (!profile.clearedVoices.includes(event.voice)) profile.clearedVoices.push(event.voice);
    profile.completedLevel = Math.max(profile.completedLevel, finiteInt(event.levelIndex, 0, 0, 3));
    profile.bestScore = Math.max(profile.bestScore, finiteInt(event.score));
    baseXp = XP_VALUES.levelClear;
    if (event.clean) {
      profile.stats.cleanLevels++;
      baseXp += XP_VALUES.cleanLevel;
    }
    if (event.fullBand) profile.stats.fullBandClears++;
  } else if (event.type === 'campaign-clear') {
    profile.stats.campaignsCleared++;
    baseXp = XP_VALUES.campaignClear;
  } else if (event.type === 'road-save') {
    const road = normalizeRoad(event.road);
    if (road) {
      profile.savedRoads = [road, ...profile.savedRoads.filter((item) => item.id !== road.id)].slice(0, 12);
    }
  } else if (event.type === 'select-noun') {
    profile.selectedNounId = finiteInt(event.nounId, 137, 0, 1199);
  } else if (event.type === 'score') {
    profile.bestScore = Math.max(profile.bestScore, finiteInt(event.value));
  }
  profile.xp += baseXp;
  const beforeStampXp = profile.xp;
  const unlocked = unlockReadyAchievements(profile, now);
  const stampXp = profile.xp - beforeStampXp;
  profile.revision++;
  profile.updatedAt = now;
  return { profile, baseXp, stampXp, unlocked };
}

export function roadLevel(xp: number): number {
  return Math.min(20, Math.floor(Math.sqrt(Math.max(0, finiteInt(xp)) / 100)) + 1);
}

export function roadLevelFloor(level: number): number {
  const safe = Math.max(1, Math.min(20, finiteInt(level, 1, 1, 20)));
  return (safe - 1) ** 2 * 100;
}

export function roadLevelCeiling(level: number): number {
  const safe = Math.max(1, Math.min(20, finiteInt(level, 1, 1, 20)));
  return safe >= 20 ? roadLevelFloor(20) : safe ** 2 * 100;
}

export function roadTitle(level: number): string {
  if (level >= 16) return 'Night Shift Legend';
  if (level >= 11) return 'City Headliner';
  if (level >= 7) return 'Band Leader';
  if (level >= 4) return 'Road Regular';
  if (level >= 2) return 'Pocket Rider';
  return 'Street Starter';
}

export function mergeRoadPass(localValue: unknown, incomingValue: unknown, now = Date.now()): RoadPassProfile {
  const local = normalizeRoadPass(localValue, now);
  const incoming = normalizeRoadPass(incomingValue, now);
  const merged = normalizeRoadPass({
    ...local,
    xp: Math.max(local.xp, incoming.xp),
    achievements: { ...local.achievements, ...incoming.achievements },
    stats: Object.fromEntries(Object.keys(local.stats).map((key) => [
      key,
      Math.max(local.stats[key as keyof RoadPassProfile['stats']], incoming.stats[key as keyof RoadPassProfile['stats']]),
    ])),
    clearedLevels: [...local.clearedLevels, ...incoming.clearedLevels],
    clearedVoices: [...local.clearedVoices, ...incoming.clearedVoices],
    gearKinds: [...local.gearKinds, ...incoming.gearKinds],
    savedRoads: [...local.savedRoads, ...incoming.savedRoads],
    bestScore: Math.max(local.bestScore, incoming.bestScore),
    selectedNounId: incoming.updatedAt >= local.updatedAt ? incoming.selectedNounId : local.selectedNounId,
    completedLevel: Math.max(local.completedLevel, incoming.completedLevel),
    revision: Math.max(local.revision, incoming.revision) + 1,
    updatedAt: now,
  }, now);
  return merged;
}

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
      return result;
    }, {});
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function beatPassPayload(profileValue: unknown, input: {
  walletAddress: string;
  issuedAt: string;
  tokenBalance?: number;
}): Record<string, unknown> {
  const profile = normalizeRoadPass(profileValue);
  return canonicalize({
    format: 'pointcast.beat-pass.v1',
    origin: 'https://pointcast.xyz',
    chainId: 'NetXdQprcVkpaWU',
    game: ROAD_PASS_GAME,
    walletAddress: input.walletAddress,
    issuedAt: input.issuedAt,
    visitNouns: {
      contract: VISIT_NOUNS_CONTRACT,
      balance: finiteInt(input.tokenBalance),
    },
    profile,
  }) as Record<string, unknown>;
}

export function perfectCampaignBaseXp(cues = 37, gear = 9, levels = 4): number {
  return cues * XP_VALUES.perfect
    + gear * XP_VALUES.gear
    + levels * (XP_VALUES.levelClear + XP_VALUES.cleanLevel)
    + XP_VALUES.campaignClear;
}
