import type { APIRoute } from 'astro';
import {
  FAN_CLIQUE_FEATURE,
  FAN_CLIQUE_TEAMS,
} from '../../lib/pointcast-fan-clique';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...FAN_CLIQUE_FEATURE,
  eligiblePrograms: FAN_CLIQUE_TEAMS.length,
  teams: FAN_CLIQUE_TEAMS.map((team) => ({
    fieldNumber: team.fieldNumber,
    cohort: team.cohort,
    slug: team.slug,
    school: team.school,
    short: team.short,
    conference: team.conference,
    city: team.city,
    state: team.state,
    markName: team.markName,
    colors: {
      primary: team.primary,
      secondary: team.secondary,
      paper: team.paper,
    },
  })),
  rules: {
    score: 'One point for every accepted Vote for my team click.',
    ballot: 'One counted click per locally generated anonymous browser id.',
    identity: 'No account, email, wallet, name, or school affiliation is requested.',
    interpretation:
      'A casual participation game measuring clicks received on this PointCast page. Not a scientific fan-base survey and not a football ranking.',
  },
  live: {
    endpoint: FAN_CLIQUE_FEATURE.liveEndpoint,
    method: 'GET for standings; POST to vote.',
    voteType: 'pointcast-fan-clique-v1',
  },
  discovery: {
    human: FAN_CLIQUE_FEATURE.canonical,
    machine: FAN_CLIQUE_FEATURE.machineEdition,
    magazine: 'https://pointcast.xyz/25/magazine',
    beliefBoard: 'https://pointcast.xyz/25',
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
