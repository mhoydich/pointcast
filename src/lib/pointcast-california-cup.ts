import {
  CALIFORNIA_CIRCUIT_2026,
  CALIFORNIA_FOOTBALL_SOURCES,
} from './pointcast-california-football';

export const CALIFORNIA_CUP_FEATURE = {
  spec: 'pointcast.college-football.california-cup/v1',
  title: 'THE CALIFORNIA CUP',
  subtitle: 'Seven games. Two trophies. One state table.',
  dek: 'Follow every 2026 game between California FBS programs, then build a private circuit card around the Saturdays you want to see.',
  thesis:
    'The scoreboard should remember who won. The magazine should also remember who made Saturday easier, stranger, warmer, and more specific to its place.',
  publishedAt: '2026-08-03T23:18:00-07:00',
  updatedAt: '2026-08-03T23:18:00-07:00',
  asOf: '2026-08-03',
  season: 2026,
  state: 'PRESEASON',
  byline: 'PointCast State Desk · designed and written by Codex',
  source:
    'Michael Hoydich continuation directive, 2026-08-03, following the California Football State Desk and its fifth compact promise: keep the table.',
  canonical: 'https://pointcast.xyz/25/magazine/california-cup',
  machineEdition: 'https://pointcast.xyz/25/magazine/california-cup.json',
  socialImage:
    'https://pointcast.xyz/images/pointcast-california-football/california-cup-social.png',
  block: '0559',
  boundary:
    'Unofficial PointCast editorial game and season ledger. Schedule facts are sourced to current athletics pages as of the timestamp above. Results, reported attendance, and invitation scores remain null until a completed game and a cited field report. The browser-local circuit card is private unless a visitor explicitly copies or shares it. PointCast is not affiliated with any school, conference, stadium, broadcaster, or governing body named.',
} as const;

export const CALIFORNIA_CUP_PROGRAMS = [
  { slug: 'usc', name: 'USC', short: 'SC', region: 'LOS ANGELES', primary: '#8f1735', accent: '#f4c44e' },
  { slug: 'ucla', name: 'UCLA', short: 'LA', region: 'WESTWOOD / PASADENA', primary: '#2d68a8', accent: '#f6cc55' },
  { slug: 'california', name: 'CALIFORNIA', short: 'CAL', region: 'BERKELEY', primary: '#173b6d', accent: '#f2b632' },
  { slug: 'stanford', name: 'STANFORD', short: 'STA', region: 'PALO ALTO', primary: '#8f1d2c', accent: '#f3ead7' },
  { slug: 'fresno-state', name: 'FRESNO STATE', short: 'FRE', region: 'CENTRAL VALLEY', primary: '#c72f3e', accent: '#25548b' },
  { slug: 'san-diego-state', name: 'SAN DIEGO STATE', short: 'SDS', region: 'SAN DIEGO', primary: '#171717', accent: '#d63b32' },
  { slug: 'san-jose-state', name: 'SAN JOSÉ STATE', short: 'SJS', region: 'SILICON VALLEY', primary: '#25529a', accent: '#e7bd3e' },
  { slug: 'sacramento-state', name: 'SACRAMENTO STATE', short: 'SAC', region: 'THE CAPITAL', primary: '#14543c', accent: '#d5b856' },
] as const;

export const CALIFORNIA_CUP_INVITATION_DIMENSIONS = [
  {
    id: 'access',
    label: 'THE ROUTE',
    question: 'Could a student or first-timer actually get there, afford it, and get home?',
  },
  {
    id: 'sound',
    label: 'THE SOUND',
    question: 'Did the bowl sound like this campus and region rather than generic sports television?',
  },
  {
    id: 'food',
    label: 'THE TABLE',
    question: 'Did the food and gathering culture tell the truth about the place?',
  },
  {
    id: 'atmosphere',
    label: 'THE AIR',
    question: 'Did the light, crowd, pace, and stadium make a distinct Saturday?',
  },
  {
    id: 'belonging',
    label: 'THE WELCOME',
    question: 'Could a new person understand how to join without already belonging?',
  },
] as const;

export const CALIFORNIA_CUP_RULES = {
  footballCup: {
    name: 'THE SCOREBOARD CUP',
    pointsForWin: 3,
    pointsForLoss: 0,
    note: 'Three table points to the winner of each listed in-state game. No projection points are published.',
  },
  invitationCup: {
    name: 'THE INVITATION CUP',
    dimensions: CALIFORNIA_CUP_INVITATION_DIMENSIONS.length,
    pointsPerDimension: 10,
    maximumPerGame: CALIFORNIA_CUP_INVITATION_DIMENSIONS.length * 10,
    creditedTo: 'host program',
    note: 'A separate host score published only after a cited PointCast field report. It never changes the football result.',
  },
  tiebreakers: [
    'Head-to-head result when applicable',
    'Total point differential in California Cup games',
    'Most California Cup games played',
    'Shared position when still tied',
  ],
} as const;

const slugByProgram = new Map(
  CALIFORNIA_CUP_PROGRAMS.map((program) => [program.name, program.slug]),
);

export const CALIFORNIA_CUP_GAMES = CALIFORNIA_CIRCUIT_2026.map(
  (game, index) => ({
    id: `ca-2026-${String(index + 1).padStart(2, '0')}`,
    order: index + 1,
    ...game,
    awaySlug: slugByProgram.get(game.away),
    homeSlug: slugByProgram.get(game.home),
    status: 'scheduled' as const,
    result: null,
    reportedAttendance: null,
    footballCupPoints: { away: 0, home: 0 },
    invitationReport: null,
  }),
);

export const CALIFORNIA_CUP_STANDINGS = CALIFORNIA_CUP_PROGRAMS.map(
  (program) => ({
    ...program,
    played: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    tablePoints: 0,
    invitationGames: 0,
    invitationPoints: 0,
  }),
);

export const CALIFORNIA_CUP_SOURCE_IDS = [
  'usc-schedule-2026',
  'cal-schedule-2026',
  'sac-state-schedule-current',
  'sjsu-schedule-2026',
  'sdsu-schedule-2026',
] as const;

export const CALIFORNIA_CUP_SOURCES = CALIFORNIA_CUP_SOURCE_IDS.map(
  (id) => {
    const source = CALIFORNIA_FOOTBALL_SOURCES.find((entry) => entry.id === id);
    if (!source) throw new Error(`Unknown California Cup source: ${id}`);
    return source;
  },
);

export const CALIFORNIA_CUP_PRIVACY = {
  accountRequired: false,
  serverWrite: false,
  storage: 'browser-local localStorage only',
  sharedByDefault: false,
  shareActions: ['copy circuit card', 'native device share when available'],
  clearControl: true,
} as const;
