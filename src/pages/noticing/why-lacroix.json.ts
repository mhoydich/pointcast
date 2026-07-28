import type { APIRoute } from 'astro';
import { LACROIX_ISSUE, LACROIX_SOURCES } from '../../lib/noticing-lacroix';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...LACROIX_ISSUE,
        truthfulBoundary:
          'This is a design-and-ritual essay, not medical or nutrition advice. Company and label claims, sensory evidence, PointCast interpretation, dental context, and recycling context are labeled separately. Local recycling programs and product formulations can change.',
        sources: LACROIX_SOURCES,
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
