import type { APIRoute } from 'astro';
import { CROSSING_ISSUE, CROSSING_SOURCES } from '../../lib/noticing-crossing';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...CROSSING_ISSUE,
        truthfulBoundary:
          'This independent digital-anthropology essay is not affiliated with or endorsed by Nintendo. Official mechanics, published player research, anthropological context, PointCast interpretation, and platform limits are labeled separately. Features and online requirements can change.',
        sources: CROSSING_SOURCES,
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
