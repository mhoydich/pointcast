export type SongYardMode = 'major' | 'mixolydian' | 'dorian';
export type SongYardPartId = 'call' | 'answer' | 'floor' | 'hands';

export interface SongYardSeed {
  id: string;
  title: string;
  kicker: string;
  call: string;
  answer: string;
  note: string;
  bpm: number;
  root: number;
  mode: SongYardMode;
  callDegrees: Array<number | null>;
  answerDegrees: Array<number | null>;
  floorDegrees: number[];
  handSteps: number[];
}

export const POINTCAST_2029_SONG_YARD = {
  spec: 'pointcast.saturday-commons.song-yard/v2',
  title: 'THE SONG YARD',
  subtitle: 'A stadium-song practice commons and reported repertoire atlas for PointCast College Football',
  publishedAt: '2026-07-28T01:18:00-07:00',
  canonical: 'https://pointcast.xyz/25/2029/song-yard',
  machineEdition: 'https://pointcast.xyz/25/2029/song-yard.json',
  parent: 'https://pointcast.xyz/25/2029/field-kit',
  block: '0527',
  identitySystems: 35,
  researchedProgramDossiers: 16,
  songReferences: 48,
  originalSongSeeds: 6,
  rehearsalParts: 4,
  bowlSections: 4,
  boundary:
    'An unofficial speculative practice instrument. It contains original PointCast song seeds, not official fight songs, alma maters, recordings, lyrics, melodies, marks, or institutional commissions. PointCast is not affiliated with or endorsed by any school, conference, athletic program, stadium, band, or governing body.',
} as const;

export const SONG_YARD_PARTS = [
  {
    id: 'call',
    name: 'Call',
    short: 'Lead the first line',
    instruction: 'One clear entrance. Stay in speaking range. Leave air after the phrase.',
    section: 'Transit Porch',
  },
  {
    id: 'answer',
    name: 'Answer',
    short: 'Return the second line',
    instruction: 'Enter after the space. Match the shape, not the volume.',
    section: 'Student End',
  },
  {
    id: 'floor',
    name: 'Floor',
    short: 'Hold the low notes',
    instruction: 'Two notes can carry a whole bowl. Make the pulse easy to find.',
    section: 'Band Terrace',
  },
  {
    id: 'hands',
    name: 'Hands',
    short: 'Place the shared beat',
    instruction: 'Clap less than you expect. The empty beats teach the phrase.',
    section: 'Afterglow Table',
  },
] as const satisfies ReadonlyArray<{
  id: SongYardPartId;
  name: string;
  short: string;
  instruction: string;
  section: string;
}>;

export const SONG_YARD_SEEDS: SongYardSeed[] = [
  {
    id: 'open-the-gate',
    title: 'Open the Gate',
    kicker: 'Arrival song',
    call: 'OPEN THE GATE',
    answer: 'LEAVE ROOM ON THE RAIL',
    note: 'A useful first song: short vowels, one visible rest, and an answer a stranger can learn before kickoff.',
    bpm: 92,
    root: 0,
    mode: 'mixolydian',
    callDegrees: [0, null, 0, 2, 4, null, 2, null],
    answerDegrees: [4, null, 4, 2, 0, null, -1, null],
    floorDegrees: [0, 0, 4, 0],
    handSteps: [2, 6, 10, 14],
  },
  {
    id: 'rain-roof-round',
    title: 'Rain Roof Round',
    kicker: 'Weather song',
    call: 'HOLD THE ROOF',
    answer: 'PASS THE SOUND',
    note: 'Designed to travel under a roof: long first tones, a clipped answer, and room for rain to remain audible.',
    bpm: 84,
    root: 2,
    mode: 'dorian',
    callDegrees: [0, null, null, 2, 3, null, 2, null],
    answerDegrees: [3, null, 2, null, 0, null, -1, null],
    floorDegrees: [0, 0, 3, 0],
    handSteps: [4, 12],
  },
  {
    id: 'long-way-chorus',
    title: 'The Long Way Chorus',
    kicker: 'Walking song',
    call: 'TAKE THE LONG WAY',
    answer: 'SING IT ALL THE WAY',
    note: 'A chorus for transit and the walk home. It rises once, returns home, and works without a conductor.',
    bpm: 106,
    root: 5,
    mode: 'major',
    callDegrees: [0, 0, 2, null, 4, 4, 5, null],
    answerDegrees: [5, 4, 2, null, 2, 0, 0, null],
    floorDegrees: [0, 4, 5, 0],
    handSteps: [2, 5, 8, 11, 14],
  },
  {
    id: 'open-on-monday',
    title: 'Open on Monday',
    kicker: 'Commons song',
    call: 'OPEN ON MONDAY',
    answer: 'OPEN ALL WEEK',
    note: 'The stadium sings about its civic job instead of only the result on the field.',
    bpm: 98,
    root: 7,
    mode: 'mixolydian',
    callDegrees: [0, 2, 4, null, 4, 5, 4, null],
    answerDegrees: [2, 2, 0, null, -1, 0, 0, null],
    floorDegrees: [0, 4, 5, 4],
    handSteps: [2, 6, 9, 14],
  },
  {
    id: 'river-room-hum',
    title: 'River Room Hum',
    kicker: 'Quiet song',
    call: 'LOW LIGHT, LONG NOTE',
    answer: 'LISTEN FOR THE ROOM',
    note: 'A nearly wordless lower-register practice for learning breath, blend, and when not to get louder.',
    bpm: 72,
    root: 9,
    mode: 'dorian',
    callDegrees: [0, null, null, null, 2, null, null, null],
    answerDegrees: [3, null, null, 2, 0, null, null, null],
    floorDegrees: [0, 0, 3, 0],
    handSteps: [6, 14],
  },
  {
    id: 'walk-home-slow',
    title: 'Walk Home Slow',
    kicker: 'Afterglow song',
    call: 'WALK HOME SLOW',
    answer: 'KEEP THE SONG',
    note: 'The final song starts after the event. It is small enough for a table and strong enough for a sidewalk.',
    bpm: 78,
    root: 4,
    mode: 'major',
    callDegrees: [0, null, 2, null, 4, null, 2, null],
    answerDegrees: [4, null, 2, null, 0, null, 0, null],
    floorDegrees: [0, 0, 4, 0],
    handSteps: [4, 12],
  },
];

export const SONG_YARD_PRACTICE_PATH = [
  {
    minute: '00–02',
    title: 'Hear the home note',
    instruction: 'The guide sounds once. Hum gently. Nobody earns points for arriving loud.',
  },
  {
    minute: '02–05',
    title: 'Learn one line',
    instruction: 'Half the room takes the call. Half takes the answer. The floor and hands stay silent.',
  },
  {
    minute: '05–08',
    title: 'Add the floor',
    instruction: 'A low two-note part makes the entrances feel inevitable without turning into a backing track.',
  },
  {
    minute: '08–11',
    title: 'Send it around',
    instruction: 'Transit Porch, Student End, Band Terrace, Afterglow Table. Each zone enters after the previous zone leaves space.',
  },
  {
    minute: '11–12',
    title: 'Remove the guide',
    instruction: 'The final pass belongs to people. If it collapses, the phrase is not ready yet—and that is useful information.',
  },
] as const;

export const SONG_YARD_RULES = [
  'Seven seconds is enough for a first phrase.',
  'Give the crowd one entrance it can see.',
  'Write the low part for ordinary speaking voices.',
  'Leave an empty beat where the next section can enter.',
  'Print the words; do not require a stadium app.',
  'Practice outside the moment of maximum pressure.',
  'Keep a quiet version for children, elders, workers, and the walk home.',
  'A song becomes tradition through repetition and care, not launch copy.',
] as const;

export const SONG_YARD_DISCOVERY = {
  human: POINTCAST_2029_SONG_YARD.canonical,
  machine: POINTCAST_2029_SONG_YARD.machineEdition,
  magazine: 'https://pointcast.xyz/25/magazine',
  magazineJson: 'https://pointcast.xyz/25/magazine.json',
  fieldKit: POINTCAST_2029_SONG_YARD.parent,
  visualEdition: 'https://pointcast.xyz/25/2029',
  block: 'https://pointcast.xyz/b/0527',
} as const;
