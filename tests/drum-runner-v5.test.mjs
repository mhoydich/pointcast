import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const V5_HELPERS = new URL('../src/lib/drum-runner-v5.ts', import.meta.url);
const V5_PAGE = new URL('../src/pages/drum-runner.astro', import.meta.url);

const {
  ACHIEVEMENTS,
  ROAD_PASS_GAME,
  VISIT_NOUNS_CONTRACT,
  XP_VALUES,
  applyRoadEvent,
  beatPassPayload,
  canonicalJson,
  defaultRoadPass,
  mergeRoadPass,
  normalizeRoadPass,
  perfectCampaignBaseXp,
  roadLevel,
  roadLevelCeiling,
  roadLevelFloor,
} = await import(V5_HELPERS);
const v5Source = await readFile(V5_PAGE, 'utf8');

function road(id, overrides = {}) {
  return {
    id,
    levelId: 'marine-layer',
    levelName: 'Marine Layer',
    nounId: 137,
    voice: 'clave',
    bpm: 92,
    phrase: [{ step: 2, note: 1, grade: 'perfect' }],
    score: 1200,
    accuracy: 100,
    createdAt: 1,
    ...overrides,
  };
}

function reduceEvents(events) {
  let profile = defaultRoadPass(0);
  const results = [];
  events.forEach((event, index) => {
    const result = applyRoadEvent(profile, event, index + 1);
    profile = result.profile;
    results.push(result);
  });
  return { profile, results };
}

test('v5 awards deterministic musical XP and uses stable level boundaries', () => {
  const { profile, results } = reduceEvents([
    { type: 'cue', grade: 'perfect' },
    { type: 'cue', grade: 'good' },
    { type: 'gear', kind: 'noggles' },
  ]);

  assert.deepEqual(results.map((result) => result.baseXp), [XP_VALUES.perfect, XP_VALUES.good, XP_VALUES.gear]);
  assert.deepEqual(results.map((result) => result.stampXp), [0, 0, 0]);
  assert.equal(profile.xp, 25);
  assert.equal(profile.stats.perfect, 1);
  assert.equal(profile.stats.good, 1);
  assert.equal(profile.stats.gearCollected, 1);
  assert.equal(perfectCampaignBaseXp(), 699, '37 perfect cues, 9 gear, and 4 clean levels should have a stable base value');

  assert.equal(roadLevel(0), 1);
  assert.equal(roadLevel(99), 1);
  assert.equal(roadLevel(100), 2);
  assert.equal(roadLevel(399), 2);
  assert.equal(roadLevel(400), 3);
  assert.equal(roadLevel(899), 3);
  assert.equal(roadLevel(900), 4);
  assert.equal(roadLevel(Number.MAX_SAFE_INTEGER), 20);
  assert.equal(roadLevelFloor(4), 900);
  assert.equal(roadLevelCeiling(4), 1600);
});

test('the ten stamps unlock once from play state and Road Legend closes the set', () => {
  const events = [
    { type: 'flow', value: 8 },
    { type: 'gear', kind: 'noggles' },
    { type: 'gear', kind: 'tape' },
    { type: 'gear', kind: 'bass' },
    { type: 'gear', kind: 'ghost' },
    { type: 'ghost-save' },
    { type: 'road-save', road: road('first-road') },
    { type: 'level-clear', levelId: 'marine-layer', voice: 'clave', clean: true, fullBand: true, levelIndex: 0, score: 1200 },
    { type: 'level-clear', levelId: 'el-porto-pier', voice: 'pluck', clean: false, fullBand: false, levelIndex: 1, score: 2200 },
    { type: 'level-clear', levelId: 'grocery-3pm', voice: 'bell', clean: false, fullBand: false, levelIndex: 2, score: 3200 },
    { type: 'level-clear', levelId: 'refinery-night', voice: 'clap', clean: false, fullBand: false, levelIndex: 3, score: 4200 },
    { type: 'campaign-clear' },
  ];
  const { profile, results } = reduceEvents(events);
  const unlocked = results.flatMap((result) => result.unlocked);

  assert.equal(ACHIEVEMENTS.length, 10);
  assert.deepEqual(new Set(unlocked), new Set(ACHIEVEMENTS.map((achievement) => achievement.id)));
  assert.equal(unlocked.length, ACHIEVEMENTS.length, 'no stamp should award twice during the campaign');
  assert.equal(Object.keys(profile.achievements).length, ACHIEVEMENTS.length);
  assert.equal(results.at(-1).stampXp, XP_VALUES.stamp + XP_VALUES.roadLegend, 'City Loop should immediately make Road Legend eligible');
  assert.equal(profile.xp, 885, '185 base XP plus 700 stamp XP');
  assert.equal(profile.bestScore, 4200);
  assert.deepEqual(profile.clearedVoices, ['clave', 'pluck', 'bell', 'clap']);
  assert.deepEqual(profile.gearKinds, ['noggles', 'tape', 'bass', 'ghost']);

  const repeat = applyRoadEvent(profile, { type: 'flow', value: 8 }, 99);
  assert.deepEqual(repeat.unlocked, []);
  assert.equal(repeat.stampXp, 0);
  assert.equal(repeat.profile.xp, profile.xp);
});

test('profiles sanitize saved roads, deduplicate them, and keep the newest twelve', () => {
  const savedRoads = Array.from({ length: 14 }, (_, index) => road(`road-${index}`, {
    createdAt: index,
    nounId: 5000,
    bpm: 500,
    accuracy: 140,
    phrase: [
      { step: 90, note: 80, grade: 'perfect' },
      { step: 3, note: 2, grade: 'miss' },
    ],
  }));
  savedRoads.push(road('road-13', { createdAt: 99, score: 9999 }));
  const profile = normalizeRoadPass({ savedRoads, selectedNounId: -20 }, 500);

  assert.equal(profile.savedRoads.length, 12);
  assert.equal(profile.savedRoads[0].id, 'road-13');
  assert.equal(profile.savedRoads[0].score, 9999, 'the later duplicate snapshot should win');
  assert.equal(profile.savedRoads.at(-1).id, 'road-2');
  assert.equal(profile.savedRoads[0].nounId, 137, 'invalid Noun ids use the safe fallback');
  assert.equal(profile.savedRoads[0].bpm, 92, 'invalid tempo uses the safe fallback');
  assert.equal(profile.savedRoads[0].accuracy, 100);
  assert.deepEqual(profile.savedRoads[1].phrase, [{ step: 63, note: 24, grade: 'perfect' }]);
  assert.equal(profile.selectedNounId, 0);
});

test('Beat Pass imports merge monotonically without double-counting snapshot XP', () => {
  const local = normalizeRoadPass({
    ...defaultRoadPass(10),
    xp: 400,
    achievements: { 'first-mile': { earnedAt: 3 } },
    stats: { ...defaultRoadPass().stats, perfect: 12, misses: 2 },
    clearedLevels: ['marine-layer'],
    clearedVoices: ['clave'],
    gearKinds: ['noggles'],
    savedRoads: [road('local-road', { createdAt: 10 })],
    bestScore: 4000,
    selectedNounId: 137,
    completedLevel: 1,
    revision: 4,
    updatedAt: 10,
  });
  const incoming = normalizeRoadPass({
    ...defaultRoadPass(20),
    xp: 350,
    achievements: { 'deep-pocket': { earnedAt: 7 } },
    stats: { ...defaultRoadPass().stats, perfect: 8, good: 11, misses: 5 },
    clearedLevels: ['el-porto-pier'],
    clearedVoices: ['pluck'],
    gearKinds: ['tape'],
    savedRoads: [road('imported-road', { createdAt: 20, voice: 'pluck' })],
    bestScore: 3500,
    selectedNounId: 385,
    completedLevel: 2,
    revision: 9,
    updatedAt: 20,
  });
  const merged = mergeRoadPass(local, incoming, 30);

  assert.equal(merged.xp, 400, 'portable snapshots merge by max, never by addition');
  assert.equal(merged.stats.perfect, 12);
  assert.equal(merged.stats.good, 11);
  assert.equal(merged.stats.misses, 5);
  assert.deepEqual(merged.clearedLevels, ['marine-layer', 'el-porto-pier']);
  assert.deepEqual(merged.clearedVoices, ['clave', 'pluck']);
  assert.deepEqual(merged.gearKinds, ['noggles', 'tape']);
  assert.deepEqual(new Set(Object.keys(merged.achievements)), new Set(['first-mile', 'deep-pocket']));
  assert.deepEqual(merged.savedRoads.map((savedRoad) => savedRoad.id), ['imported-road', 'local-road']);
  assert.equal(merged.bestScore, 4000);
  assert.equal(merged.selectedNounId, 385, 'the newer snapshot chooses the cosmetic Noun');
  assert.equal(merged.completedLevel, 2);
  assert.equal(merged.revision, 10);
  assert.equal(merged.updatedAt, 30);
});

test('Beat Pass payloads are canonical, mainnet-scoped, and bind profile to wallet and Visit Nouns', () => {
  const profile = normalizeRoadPass({ ...defaultRoadPass(10), xp: 144, selectedNounId: 385 }, 10);
  const payload = beatPassPayload(profile, {
    walletAddress: 'tz1burnburnburnburnburnburnburjAYjjX',
    issuedAt: '2026-07-13T12:34:56.000Z',
    tokenBalance: 3.9,
  });

  assert.equal(payload.format, 'pointcast.beat-pass.v1');
  assert.equal(payload.origin, 'https://pointcast.xyz');
  assert.equal(payload.chainId, 'NetXdQprcVkpaWU');
  assert.equal(payload.game, ROAD_PASS_GAME);
  assert.equal(payload.walletAddress, 'tz1burnburnburnburnburnburnburjAYjjX');
  assert.deepEqual(payload.visitNouns, { balance: 3, contract: VISIT_NOUNS_CONTRACT });
  assert.equal(payload.profile.xp, 144);
  assert.equal(payload.profile.selectedNounId, 385);
  assert.deepEqual(Object.keys(payload), [...Object.keys(payload)].sort());
  assert.deepEqual(Object.keys(payload.profile), [...Object.keys(payload.profile)].sort());
  assert.equal(canonicalJson(payload), JSON.stringify(payload));
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 3 } }), '{"a":{"x":3,"y":2},"z":1}');
});

test('v5 uses local saves and gasless signatures without a transaction path', () => {
  assert.match(v5Source, /ROAD_PASS_STORAGE_KEY/);
  assert.match(v5Source, /applyRoadEvent\(roadPass, event\)/);
  assert.match(v5Source, /mergeRoadPass\(roadPass, pass\.profile\)/);
  assert.match(v5Source, /signTezosMichelineMessage/);
  assert.match(v5Source, /verifyTezosMichelineMessage/);
  assert.match(v5Source, /Gasless signature · no mint · no token transfer/);
  assert.match(v5Source, /note\.step \* secondsPerStep \* 1000/, 'saved-road replay should preserve the road rests');
  assert.doesNotMatch(v5Source, /index \* secondsPerStep \* 1000/, 'saved-road replay must not compress rests');
  assert.doesNotMatch(v5Source, /\.(?:send|transfer|originate)\s*\(/);
});
