import type { APIRoute } from 'astro';
import { POINTCAST_25_ALABAMA } from '../../lib/pointcast-25-alabama';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...POINTCAST_25_ALABAMA,
        collection: {
          human: 'https://pointcast.xyz/25',
          machine: 'https://pointcast.xyz/25.json',
          alabamaTeamReceipt: 'https://pointcast.xyz/25/teams/alabama.json',
          immutableBoard: 'https://pointcast.xyz/25/boards/000.json',
        },
        rights: {
          text: 'PointCast original editorial synthesis',
          reportingBoundary:
            'Facts and source links were checked July 28, 2026. Rankings, interpretations, tier labels, and win thresholds are PointCast editorial judgments.',
          affiliation:
            'Independent editorial. Not affiliated with or endorsed by the University of Alabama, the SEC, ESPN, the NCAA, or Nick Saban.',
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: '<https://pointcast.xyz/25/alabama-after-saban>; rel="alternate"; type="text/html"',
      },
    },
  );
