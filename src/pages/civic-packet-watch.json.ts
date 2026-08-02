import type { APIRoute } from 'astro';
import { CIVIC_PACKET_WATCH, civicStats } from '../lib/civic-packet-watch';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...CIVIC_PACKET_WATCH,
        stats: civicStats,
        correction: {
          route: 'https://pointcast.xyz/contact',
          instruction: 'Send the signal id, official source URL, and the correction requested.',
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
        Link: '<https://pointcast.xyz/civic-packet-watch>; rel="alternate"; type="text/html"',
      },
    },
  );
