import type { APIRoute } from 'astro';
import {
  CALIFORNIA_CUP_FEATURE,
  CALIFORNIA_CUP_GAMES,
  CALIFORNIA_CUP_INVITATION_DIMENSIONS,
  CALIFORNIA_CUP_PRIVACY,
  CALIFORNIA_CUP_PROGRAMS,
  CALIFORNIA_CUP_RULES,
  CALIFORNIA_CUP_SOURCES,
  CALIFORNIA_CUP_STANDINGS,
} from '../../../lib/pointcast-california-cup';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...CALIFORNIA_CUP_FEATURE,
  counts: {
    programs: CALIFORNIA_CUP_PROGRAMS.length,
    scheduledGames: CALIFORNIA_CUP_GAMES.length,
    finalGames: 0,
    invitationDimensions: CALIFORNIA_CUP_INVITATION_DIMENSIONS.length,
    officialScheduleSources: CALIFORNIA_CUP_SOURCES.length,
  },
  rules: CALIFORNIA_CUP_RULES,
  invitationDimensions: CALIFORNIA_CUP_INVITATION_DIMENSIONS,
  standings: CALIFORNIA_CUP_STANDINGS,
  games: CALIFORNIA_CUP_GAMES,
  sources: CALIFORNIA_CUP_SOURCES,
  participation: {
    ...CALIFORNIA_CUP_PRIVACY,
    receiptSpec: 'pointcast.california-cup.circuit-card/v1',
    note: 'Predictions and field-note priorities are visitor-authored rehearsal data. They do not enter the published standings.',
  },
  editorialBoundary: {
    official: false,
    prediction: false,
    scoresPublishedBeforeFinal: false,
    invitationScoresPublishedWithoutFieldReport: false,
    footballResultAffectedByInvitationScore: false,
  },
  discovery: {
    human: CALIFORNIA_CUP_FEATURE.canonical,
    machine: CALIFORNIA_CUP_FEATURE.machineEdition,
    block: `https://pointcast.xyz/b/${CALIFORNIA_CUP_FEATURE.block}`,
    stateReport: 'https://pointcast.xyz/25/magazine/california-football',
    magazine: 'https://pointcast.xyz/25/magazine',
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=1800',
    'Access-Control-Allow-Origin': '*',
  },
});
