import type { APIRoute } from 'astro';
import { LIBRARY_ISSUE, LIBRARY_SOURCES } from '../../lib/noticing-library';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...LIBRARY_ISSUE,
        truthfulBoundary:
          'Current El Segundo Public Library services are separated from PointCast proposals. This opening dispatch is based on official public sources; direct interviews and in-person observation are not represented as completed.',
        sources: LIBRARY_SOURCES,
        feeds: {
          rss: 'https://pointcast.xyz/feed.xml',
          json: 'https://pointcast.xyz/feed.json',
          editorialCalendar: 'https://pointcast.xyz/noticing.json',
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
