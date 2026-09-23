import openingBoard from './pointcast-25-board-000.frozen.json';
import { POINTCAST_25 } from './pointcast-25';

export const POINTCAST_25_REFERENCE = {
  "name": "AP Top 25 \u00b7 September 20, 2026",
  "shortName": "AP Top 25",
  "publishedAt": "2026-09-20",
  "checkedAt": "2026-09-23",
  "url": "https://www.collegepollarchive.com/football/ap/seasons.cfm?appollid=1271",
  "note": "The September 20 AP poll, as archived by College Poll Archive and cross-checked against CFB App. An opinion poll, not a predictive model: one legible reference board, not as a universal consensus.",
  "rankings": [
    "Texas",
    "Georgia",
    "Notre Dame",
    "Ole Miss",
    "Indiana",
    "Miami",
    "Ohio State",
    "Alabama",
    "BYU",
    "LSU",
    "Texas Tech",
    "USC",
    "Penn State",
    "Tennessee",
    "Utah",
    "Louisville",
    "Iowa",
    "Michigan",
    "Missouri",
    "Oregon",
    "Florida",
    "SMU",
    "Texas A&M",
    "Mississippi State",
    "Houston"
  ]
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

// Select the largest positive differences, with current PointCast rank as tie-breaker.
export const POINTCAST_25_DISSENTS = POINTCAST_25_TEAMS
  .filter(team => team.rankDelta !== null && team.rankDelta > 0)
  .sort((a, b) => b.rankDelta! - a.rankDelta! || a.rank - b.rank)
  .slice(0, 5)
  .map(team => ({ ...team, dissent: team.reason }));

export const POINTCAST_25_RECEIPTS = POINTCAST_25_TEAMS.map((team) => ({
  id: `${POINTCAST_25.board}-${team.slug}`,
  board: POINTCAST_25.board,
  team: team.school,
  teamUrl: `https://pointcast.xyz/25/teams/${team.slug}`,
  rank: team.rank,
  openedAt: POINTCAST_25.publishedAt,
  status: 'OPEN' as const,
  claim: team.reason,
  nextProof: team.proof,
}));

export function getPointcast25Team(slug: string) {
  return POINTCAST_25_TEAMS.find((team) => team.slug === slug);
}

// Retain old team URLs even when a team drops out of the current 25.
export const POINTCAST_25_ALL_TEAM_PAGES = [
  ...POINTCAST_25_TEAMS.map(team => ({...team, isCurrent: true})),
  ...openingBoard.teams.filter(team => !POINTCAST_25_TEAMS.some(now => now.school === team.school))
    .map(team => ({...team, slug: pointcast25TeamSlug(team.school), referenceRank: null, rankDelta: null,
      comparison: 'Outside the current PointCast 25. This is the preserved Board 000 case.',
      record: null, lastResult: null, movementReason: 'Dropped from the current board; the original case remains below.',
      isCurrent: false})),
];
export const POINTCAST_25_OPENING_RECEIPTS = openingBoard.teams.map(team => ({
  id: `000-${pointcast25TeamSlug(team.school)}`, board: '000', team: team.school,
  teamUrl: `https://pointcast.xyz/25/teams/${pointcast25TeamSlug(team.school)}`,
  rank: team.rank, openedAt: openingBoard.publishedAt, status: 'OPEN',
  claim: team.reason, nextProof: team.proof,
  review: 'Original claim retained. Ranking changes are not proof that a specific football claim was proven or disproven.',
}));
