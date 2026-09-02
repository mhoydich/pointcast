import { POINTCAST_25 } from './pointcast-25';
import board000 from './pointcast-25-board-000.frozen.json';

export const POINTCAST_25_REFERENCE = {
  name: 'ESPN preseason FPI Top 25',
  shortName: 'ESPN FPI',
  publishedAt: '2026-07-09',
  checkedAt: '2026-07-27',
  url: 'https://www.si.com/fannation/college/cfb-hq/rankings/college-football-rankings-espn-top-25-preseason-poll-2026',
  note:
    'ESPN Football Power Index order as reported by College Football HQ on SI. FPI is a predictive model, not an opinion poll; PointCast uses it here as one legible reference board, not as a universal consensus.',
  rankings: [
    'Ohio State',
    'Texas',
    'Notre Dame',
    'Oregon',
    'Georgia',
    'Indiana',
    'Miami',
    'Alabama',
    'LSU',
    'Texas Tech',
    'Texas A&M',
    'Oklahoma',
    'USC',
    'Ole Miss',
    'Michigan',
    'Tennessee',
    'Penn State',
    'Florida',
    'Clemson',
    'BYU',
    'Missouri',
    'Auburn',
    'South Carolina',
    'SMU',
    'Iowa',
  ],
} as const;

export function pointcast25TeamSlug(school: string): string {
  return school
    .toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const referenceRanks = new Map(
  POINTCAST_25_REFERENCE.rankings.map((school, index) => [school, index + 1]),
);

export const POINTCAST_25_TEAMS = POINTCAST_25.teams.map((team) => {
  const referenceRank = referenceRanks.get(team.school) ?? null;
  const rankDelta = referenceRank === null ? null : referenceRank - team.rank;
  const comparison =
    referenceRank === null
      ? `PointCast ranks ${team.school} No. ${team.rank}; ${POINTCAST_25_REFERENCE.shortName} leaves the team outside its Top 25.`
      : rankDelta === 0
        ? `PointCast and ${POINTCAST_25_REFERENCE.shortName} both rank ${team.school} No. ${team.rank}.`
        : rankDelta > 0
          ? `PointCast ranks ${team.school} ${rankDelta} ${rankDelta === 1 ? 'place' : 'places'} higher than ${POINTCAST_25_REFERENCE.shortName}.`
          : `PointCast ranks ${team.school} ${Math.abs(rankDelta)} ${Math.abs(rankDelta) === 1 ? 'place' : 'places'} lower than ${POINTCAST_25_REFERENCE.shortName}.`;

  return {
    ...team,
    slug: pointcast25TeamSlug(team.school),
    referenceRank,
    rankDelta,
    comparison,
  };
});

const dissentNotes: Record<string, string> = {
  'Penn State':
    'PointCast is buying Matt Campbell’s organizing power before 39 transfers look like one connected team.',
  BYU:
    'Consecutive 11-win seasons are evidence. The Cougars have earned more than outsider courtesy.',
  Utah:
    'PointCast is betting that years of developmental competence survive the end of the Kyle Whittingham era.',
  Washington:
    'The roster and returning structure are stronger than the volume of the national conversation.',
  'Boise State':
    'A national board needs an outsider benchmark. Boise is the first test of whether the poll watches beyond the largest brands.',
};

const dissentSchools = ['Penn State', 'BYU', 'Utah', 'Washington', 'Boise State'] as const;

export const POINTCAST_25_DISSENTS = dissentSchools.map((school) => {
  const team = POINTCAST_25_TEAMS.find((candidate) => candidate.school === school);
  if (!team) throw new Error(`Missing PointCast 25 dissent team: ${school}`);
  return {
    ...team,
    dissent: dissentNotes[school],
  };
});

// A claim opens on the board that first published its sentence. Board 000's
// frozen capture is the reference: a reason carried forward verbatim keeps its
// July 27 opening date and its 000-prefixed receipt id; a rewritten reason opens
// fresh on the current board.
const openingReasons = new Map(board000.teams.map((team) => [team.school, team.reason]));

export const POINTCAST_25_RECEIPTS = POINTCAST_25_TEAMS.map((team) => {
  const carried = openingReasons.get(team.school) === team.reason;
  const openedBoard = carried ? board000.board : POINTCAST_25.board;
  return {
    id: `${openedBoard}-${team.slug}`,
    board: POINTCAST_25.board,
    openedBoard,
    team: team.school,
    teamUrl: `https://pointcast.xyz/25/teams/${team.slug}`,
    rank: team.rank,
    previousRank: team.previousRank,
    movement: team.movement,
    openedAt: carried ? board000.publishedAt : POINTCAST_25.publishedAt,
    reviewedAt: POINTCAST_25.publishedAt,
    status: 'OPEN' as const,
    claim: team.reason,
    nextProof: team.proof,
    change: team.change,
    sources: team.sources,
  };
});

export function getPointcast25Team(slug: string) {
  return POINTCAST_25_TEAMS.find((team) => team.slug === slug);
}
