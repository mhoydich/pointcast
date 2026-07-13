export type DrumGameSlug =
  | 'drum-says'
  | 'drum-quickdraw'
  | 'drum-fill'
  | 'drum-runner'
  | 'drum-steady';

export interface DrumGame {
  slug: DrumGameSlug;
  name: string;
  shortName: string;
  path: `/${DrumGameSlug}`;
  number: string;
  kicker: string;
  description: string;
  skill: string;
  controls: string;
  nounId: number;
  accent: string;
  bestKey: string;
  bestUnit: string;
  bestDirection: 'high' | 'low';
  secondaryKey?: string;
  secondaryUnit?: string;
}

/**
 * The five-game Drum Arcade shelf.
 *
 * Keep this list small and intentional. PointCast already has dozens of
 * musical rooms; these entries are the ones with a start, rules, a score,
 * and a clean replay loop.
 */
export const DRUM_GAMES: readonly DrumGame[] = [
  {
    slug: 'drum-says',
    name: 'Drum Says',
    shortName: 'Says',
    path: '/drum-says',
    number: '01',
    kicker: 'MEMORY · FOUR PADS',
    description: 'A Noun calls a growing pattern on four drums. Echo it back and hold the thread for one more round.',
    skill: 'Memory',
    controls: 'Tap pads · keys 1–4',
    nounId: 385,
    accent: '#ff6b8a',
    bestKey: 'pc-drum-says-best',
    bestUnit: ' patterns echoed',
    bestDirection: 'high',
  },
  {
    slug: 'drum-quickdraw',
    name: 'Quick Draw',
    shortName: 'Draw',
    path: '/drum-quickdraw',
    number: '02',
    kicker: 'REACTION · TEN DRAWS',
    description: 'Wait for gold, ignore the feints, then strike. Ten clean draws become one reaction-time grade.',
    skill: 'Restraint',
    controls: 'Tap pad · Space',
    nounId: 723,
    accent: '#f6c15e',
    bestKey: 'pc-drum-quickdraw-best',
    bestUnit: ' ms average',
    bestDirection: 'low',
    secondaryKey: 'pc-drum-quickdraw-grade',
    secondaryUnit: ' grade',
  },
  {
    slug: 'drum-fill',
    name: 'Fill the Bar',
    shortName: 'Fill',
    path: '/drum-fill',
    number: '03',
    kicker: 'LISTEN · FIND THE GAP',
    description: 'An eight-step groove has a hole in it. Land a tom in the empty step as the tempo and missing hits multiply.',
    skill: 'Pocket',
    controls: 'Tap fill · Space',
    nounId: 117,
    accent: '#8aeac0',
    bestKey: 'pc-drum-fill-best',
    bestUnit: ' bars locked',
    bestDirection: 'high',
  },
  {
    slug: 'drum-runner',
    name: 'Beat Runner',
    shortName: 'Runner',
    path: '/drum-runner',
    number: '04',
    kicker: '4 LEVELS · JUMP THE GRID',
    description: 'A Noun runs four beat-mapped El Segundo postcards. Jump clean, carry three hearts, and hold the pocket as every level gets faster.',
    skill: 'Anticipation',
    controls: 'Tap stage · Space',
    nounId: 214,
    accent: '#7ac8ed',
    bestKey: 'pc-drum-runner-v2-best',
    bestUnit: ' meters',
    bestDirection: 'high',
  },
  {
    slug: 'drum-steady',
    name: 'Steady Hands',
    shortName: 'Steady',
    path: '/drum-steady',
    number: '05',
    kicker: 'SILENT TEMPO · 32 BEATS',
    description: 'Four clicks set the pulse, then the guide disappears. Hold the tempo by feel for thirty-two taps.',
    skill: 'Internal clock',
    controls: 'Tap pad · Space',
    nounId: 523,
    accent: '#b99cff',
    bestKey: 'pc-drum-steady-best',
    bestUnit: ' ms drift',
    bestDirection: 'low',
    secondaryKey: 'pc-drum-steady-pocket',
    secondaryUnit: '% pocket',
  },
] as const;

export function getDrumGame(slug: string): DrumGame | undefined {
  return DRUM_GAMES.find((game) => game.slug === slug);
}
