export type HapticDreamsTeam = 'MICH' | 'OSU';
export type HapticDreamsSky = 'dawn' | 'cold' | 'ember' | 'midnight' | 'still';
export type HapticDreamsEffect =
  | 'wake'
  | 'field-flip'
  | 'arc'
  | 'advance'
  | 'reversal'
  | 'breach'
  | 'miss'
  | 'fireworks'
  | 'final';

export interface HapticPattern {
  id: string;
  label: string;
  phrase: string;
  meaning: string;
  zones: number[][];
  vibration: number[];
}

export interface HapticDreamsPlay {
  id: string;
  quarter: number;
  clock: string;
  michigan: number;
  ohioState: number;
  team: HapticDreamsTeam;
  type: string;
  title: string;
  detail: string;
  yards: number;
  haptic: string;
  myth: string;
  world: {
    possession: number;
    michiganLevel: number;
    ohioStateLevel: number;
    sky: HapticDreamsSky;
    effect: HapticDreamsEffect;
    intensity: number;
  };
}

export const HAPTIC_DREAMS = {
  title: 'Haptic Dreams: Saturday Kingdom',
  shortTitle: 'Saturday Kingdom',
  subtitle: 'The game, translated into touch and a world that remembers.',
  description:
    'A real football game becomes a shared haptic language and a living illustrated kingdom: possession moves the train, scores construct the cities, turnovers reverse the field, and the final whistle completes the world.',
  canonical: 'https://pointcast.xyz/haptic-dreams',
  machine: 'https://pointcast.xyz/haptic-dreams.json',
  socialImage: 'https://pointcast.xyz/images/pointcast-haptic-dreams/social-card.png',
  publishedAt: '2026-08-08T13:30:00-07:00',
  updatedAt: '2026-08-08T13:30:00-07:00',
  authorship: {
    concept: 'Michael Hoydich / Haptic Dreams',
    visualSystem: 'Jon Snow / KansasDAO',
    interactionTranslation: 'Codex / OpenAI for PointCast',
  },
  game: {
    eventId: '401628566',
    away: 'Michigan',
    home: 'Ohio State',
    awayScore: 13,
    homeScore: 10,
    date: '2024-11-30',
    venue: 'Ohio Stadium, Columbus, Ohio',
    status: 'Final',
  },
  boundary:
    'This is an unofficial editorial replay and interaction prototype. It is not affiliated with either university, the Big Ten, the NCAA, or ESPN. It does not represent a live score feed, medical haptics, certified wearable hardware, a token, or an NFT offer.',
} as const;

export const HAPTIC_DREAMS_SOURCES = [
  {
    id: 'espn-play-by-play',
    label: 'ESPN play-by-play',
    url: 'https://www.espn.com/college-football/playbyplay/_/gameId/401628566',
    role: 'Selected play sequence, clocks, scoring, yardage, and possession.',
  },
  {
    id: 'ohio-state-box-score',
    label: 'Ohio State official box score',
    url: 'https://ohiostatebuckeyes.com/sports/football/stats/2024/michigan/boxscore/20061',
    role: 'Final score, venue, date, and official game record cross-check.',
  },
] as const;

export const HAPTIC_PATTERNS: HapticPattern[] = [
  { id: 'kickoff', label: 'Kickoff', phrase: 'full wake', meaning: 'The shared field opens.', zones: [[0, 7], [1, 6], [2, 5], [3, 4]], vibration: [80, 40, 80, 40, 150] },
  { id: 'punt', label: 'Punt', phrase: 'field flips', meaning: 'Possession and direction reverse.', zones: [[6, 7], [4, 5], [2, 3], [0, 1]], vibration: [60, 70, 60, 70, 60] },
  { id: 'longRun', label: 'Run', phrase: 'climbing drive', meaning: 'Ground is gained from wrist toward shoulder.', zones: [[6], [7], [4, 5], [2, 3], [0, 1]], vibration: [45, 30, 55, 30, 70, 30, 100] },
  { id: 'longPass', label: 'Pass', phrase: 'long sweep', meaning: 'The ball travels as one clean rising sweep.', zones: [[6, 7], [4, 5], [2, 3], [0, 1]], vibration: [35, 55, 35, 55, 120] },
  { id: 'turnover', label: 'Turnover', phrase: 'reverse wave', meaning: 'The expected direction collapses and returns.', zones: [[0, 1], [2, 3], [4, 5], [6, 7], [0, 7]], vibration: [100, 35, 70, 35, 50, 35, 180] },
  { id: 'goalLineTurnover', label: 'Goal-line turn', phrase: 'hard reverse', meaning: 'A near-score strikes twice, then falls away.', zones: [[0, 1], [0, 1], [2, 3], [4, 5], [6, 7]], vibration: [180, 40, 180, 40, 80, 30, 60] },
  { id: 'fieldGoal', label: 'Field goal', phrase: 'three rings', meaning: 'Three measured points ring outward.', zones: [[2, 3], [0, 1], [0, 1, 2, 3, 4, 5, 6, 7]], vibration: [80, 80, 80, 80, 220] },
  { id: 'fieldGoalLong', label: 'Long field goal', phrase: 'rising arc', meaning: 'A distant attempt climbs before the full ring.', zones: [[6, 7], [4, 5], [2, 3], [0, 1], [0, 1, 2, 3, 4, 5, 6, 7]], vibration: [45, 35, 60, 35, 90, 35, 250] },
  { id: 'touchdown', label: 'Touchdown', phrase: 'whole-sleeve chorus', meaning: 'The entire shared body answers twice.', zones: [[6, 7], [4, 5], [2, 3], [0, 1], [0, 1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 3, 4, 5, 6, 7]], vibration: [100, 40, 100, 40, 100, 40, 300] },
  { id: 'miss', label: 'Missed kick', phrase: 'arc dissolves', meaning: 'The expected arrival thins to one edge.', zones: [[6, 7], [4, 5], [2, 3], [0]], vibration: [65, 45, 65, 45, 25] },
  { id: 'final', label: 'Final', phrase: 'shared landing', meaning: 'The field settles from shoulder to wrist.', zones: [[0, 1], [2, 3], [4, 5], [6, 7], [0, 1, 2, 3, 4, 5, 6, 7]], vibration: [120, 120, 120, 120, 400] },
];

export const HAPTIC_DREAMS_PLAYS: HapticDreamsPlay[] = [
  { id: 'q1-1500-kickoff', quarter: 1, clock: '15:00', michigan: 0, ohioState: 0, team: 'MICH', type: 'kickoff', title: 'The rivalry wakes', detail: 'Michigan receives the opening kick in Columbus.', yards: 0, haptic: 'kickoff', myth: 'The gates open. Two old kingdoms enter the field.', world: { possession: -0.15, michiganLevel: 1, ohioStateLevel: 1, sky: 'dawn', effect: 'wake', intensity: 1 } },
  { id: 'q1-1033-punt', quarter: 1, clock: '10:33', michigan: 0, ohioState: 0, team: 'MICH', type: 'punt', title: 'The field turns', detail: 'Tommy Doman punts 33 yards out of bounds at the Ohio State 31.', yards: -33, haptic: 'punt', myth: 'The maize banners withdraw; the scarlet host takes the road.', world: { possession: 0.38, michiganLevel: 1, ohioStateLevel: 1, sky: 'dawn', effect: 'field-flip', intensity: 2 } },
  { id: 'q1-0614-osu-fg', quarter: 1, clock: '6:14', michigan: 0, ohioState: 3, team: 'OSU', type: 'field goal', title: 'First points', detail: 'Jayden Fielding makes a 29-yard field goal. Ohio State leads 3–0.', yards: 29, haptic: 'fieldGoal', myth: 'A golden bolt clears the wall. Scarlet Hold lights three braziers.', world: { possession: 0.67, michiganLevel: 1, ohioStateLevel: 2, sky: 'cold', effect: 'arc', intensity: 3 } },
  { id: 'q1-0614-orji-run', quarter: 1, clock: '6:14', michigan: 0, ohioState: 3, team: 'MICH', type: 'run', title: 'A break in the line', detail: 'Alex Orji runs 29 yards to the Ohio State 27 for a first down.', yards: 29, haptic: 'longRun', myth: 'A maize rider finds open ground and carries the standard deep into scarlet land.', world: { possession: 0.58, michiganLevel: 1, ohioStateLevel: 2, sky: 'cold', effect: 'advance', intensity: 3 } },
  { id: 'q2-1321-hall-int', quarter: 2, clock: '13:21', michigan: 0, ohioState: 3, team: 'MICH', type: 'turnover', title: 'The gate swings', detail: 'Aamir Hall intercepts Will Howard and returns 11 yards to the Ohio State 2.', yards: 11, haptic: 'turnover', myth: 'The pass is captured. Maize Keep appears suddenly at the inner gate.', world: { possession: 0.92, michiganLevel: 2, ohioStateLevel: 2, sky: 'cold', effect: 'reversal', intensity: 4 } },
  { id: 'q2-1237-mullings-td', quarter: 2, clock: '12:37', michigan: 7, ohioState: 3, team: 'MICH', type: 'touchdown', title: 'Michigan takes the keep', detail: 'Kalel Mullings runs 1 yard for a touchdown; the kick is good. Michigan leads 7–3.', yards: 1, haptic: 'touchdown', myth: 'The ram lands once. The scarlet gate opens. Seven fires answer.', world: { possession: 1, michiganLevel: 3, ohioStateLevel: 2, sky: 'ember', effect: 'breach', intensity: 5 } },
  { id: 'q2-0728-osu-miss', quarter: 2, clock: '7:28', michigan: 7, ohioState: 3, team: 'OSU', type: 'missed field goal', title: 'Wide of the tower', detail: 'Jayden Fielding misses a 38-yard field goal.', yards: 38, haptic: 'miss', myth: 'The bolt sails beyond the north tower and disappears into the cold.', world: { possession: -0.15, michiganLevel: 3, ohioStateLevel: 2, sky: 'cold', effect: 'miss', intensity: 2 } },
  { id: 'q2-0215-zvada-54', quarter: 2, clock: '2:15', michigan: 10, ohioState: 3, team: 'MICH', type: 'field goal', title: 'From fifty-four', detail: 'Dominic Zvada makes a 54-yard field goal. Michigan leads 10–3.', yards: 54, haptic: 'fieldGoalLong', myth: 'From beyond the mist, a maize engine casts fire across the whole valley.', world: { possession: 0.74, michiganLevel: 4, ohioStateLevel: 2, sky: 'ember', effect: 'arc', intensity: 5 } },
  { id: 'q2-0030-smith-td', quarter: 2, clock: '0:30', michigan: 10, ohioState: 10, team: 'OSU', type: 'touchdown', title: 'Level at the half', detail: 'Will Howard finds Jeremiah Smith for a 10-yard touchdown. The game is tied 10–10.', yards: 10, haptic: 'touchdown', myth: 'Scarlet wings cross the last wall. At the bell, both kingdoms burn equally bright.', world: { possession: -1, michiganLevel: 4, ohioStateLevel: 4, sky: 'ember', effect: 'fireworks', intensity: 5 } },
  { id: 'q3-1458-henderson-pass', quarter: 3, clock: '14:58', michigan: 10, ohioState: 10, team: 'OSU', type: 'pass', title: 'A clean crossing', detail: 'Will Howard completes to TreVeyon Henderson for 24 yards and a first down.', yards: 24, haptic: 'longPass', myth: 'A scarlet messenger crosses the open field under a high arc.', world: { possession: -0.54, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'advance', intensity: 3 } },
  { id: 'q3-0451-howard-int', quarter: 3, clock: '4:51', michigan: 10, ohioState: 10, team: 'MICH', type: 'turnover', title: 'Taken in the air', detail: 'Will Howard is intercepted with the game tied.', yards: 0, haptic: 'turnover', myth: 'The maize falcon catches the message before it reaches the keep.', world: { possession: 0.12, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'reversal', intensity: 4 } },
  { id: 'q3-0401-warren-int', quarter: 3, clock: '4:01', michigan: 10, ohioState: 10, team: 'OSU', type: 'turnover', title: 'Returned immediately', detail: 'Davis Warren is intercepted on the following Michigan possession.', yards: 0, haptic: 'turnover', myth: 'Scarlet answers at once. The captured standard changes hands again.', world: { possession: -0.18, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'reversal', intensity: 4 } },
  { id: 'q3-0158-osu-miss', quarter: 3, clock: '1:58', michigan: 10, ohioState: 10, team: 'OSU', type: 'missed field goal', title: 'No breach', detail: 'Jayden Fielding misses a 34-yard field goal. The game remains tied.', yards: 34, haptic: 'miss', myth: 'The siege stone glances away. Neither wall gives.', world: { possession: 0.08, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'miss', intensity: 2 } },
  { id: 'q4-1500-oleary-pass', quarter: 4, clock: '15:00', michigan: 10, ohioState: 10, team: 'MICH', type: 'pass', title: 'Into scarlet ground', detail: 'Davis Warren completes to Peyton O’Leary for 18 yards to the Ohio State 39.', yards: 18, haptic: 'longPass', myth: 'A maize courier slips between watchfires and reaches the scarlet road.', world: { possession: 0.42, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'advance', intensity: 3 } },
  { id: 'q4-0748-sawyer-int', quarter: 4, clock: '7:48', michigan: 10, ohioState: 10, team: 'OSU', type: 'goal-line turnover', title: 'The goal line survives', detail: 'Jack Sawyer intercepts Davis Warren at the Ohio State 1 and returns 12 yards.', yards: 12, haptic: 'goalLineTurnover', myth: 'At the final door, Scarlet Hold seizes the ram and hurls it back.', world: { possession: -0.82, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'reversal', intensity: 5 } },
  { id: 'q4-0613-mullings-run', quarter: 4, clock: '6:13', michigan: 10, ohioState: 10, team: 'MICH', type: 'run', title: 'The decisive road', detail: 'Kalel Mullings runs 27 yards to the Ohio State 17 for a first down.', yards: 27, haptic: 'longRun', myth: 'The maize train breaks through the center and does not stop until the inner field.', world: { possession: 0.72, michiganLevel: 4, ohioStateLevel: 4, sky: 'midnight', effect: 'advance', intensity: 5 } },
  { id: 'q4-0045-zvada-fg', quarter: 4, clock: '0:45', michigan: 13, ohioState: 10, team: 'MICH', type: 'field goal', title: 'Forty-five seconds', detail: 'Dominic Zvada makes a 21-yard field goal. Michigan leads 13–10.', yards: 21, haptic: 'fieldGoal', myth: 'Three final fires rise over Maize Keep. The valley goes still.', world: { possession: 0.84, michiganLevel: 5, ohioStateLevel: 4, sky: 'still', effect: 'fireworks', intensity: 5 } },
  { id: 'final', quarter: 4, clock: '0:00', michigan: 13, ohioState: 10, team: 'MICH', type: 'final', title: 'The fourth straight', detail: 'Michigan kneels. Final: Michigan 13, Ohio State 10.', yards: 0, haptic: 'final', myth: 'The maize lion remains. The scarlet gates close until another year.', world: { possession: 0, michiganLevel: 5, ohioStateLevel: 4, sky: 'still', effect: 'final', intensity: 3 } },
];

export const hapticPattern = (id: string) =>
  HAPTIC_PATTERNS.find((pattern) => pattern.id === id) ?? HAPTIC_PATTERNS[0];
