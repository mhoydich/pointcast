import type { APIRoute } from 'astro';
import {
  FAN_CLIQUE_RALLY,
  FAN_CLIQUE_RALLY_TEAMS,
} from '../../../lib/pointcast-fan-clique-rally';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...FAN_CLIQUE_RALLY,
        eligiblePrograms: FAN_CLIQUE_RALLY_TEAMS.length,
        teams: FAN_CLIQUE_RALLY_TEAMS.map((team) => ({
          fieldNumber: team.fieldNumber,
          slug: team.slug,
          school: team.school,
          short: team.short,
          conference: team.conference,
          city: team.city,
          state: team.state,
          gameUrl: team.gameUrl,
          rallyCopy: team.rallyCopy,
          groupCopy: team.groupCopy,
        })),
        instructions: {
          first: 'Open the school-specific game URL.',
          second: 'Use one accepted click for your school.',
          third: 'Copy one call and pass it through a real fan network.',
          measure:
            'Read the live endpoint for accepted clicks, current leader, and total people in the room.',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
