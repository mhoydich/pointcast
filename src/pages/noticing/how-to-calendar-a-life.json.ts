import type { APIRoute } from 'astro';
import { CALENDAR_ISSUE, CALENDAR_SOURCES } from '../../lib/noticing-calendar';
import { CALENDAR_APPENDIX } from '../../lib/noticing-calendar-appendix';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...CALENDAR_ISSUE,
        truthfulBoundary:
          'This practical editorial field guide is not medical, therapeutic, or employment advice. Time-use averages, workplace telemetry, and published studies retain their population and causal limits. Anchors, shadows, tides, weather, and commons are a PointCast synthesis.',
        sources: CALENDAR_SOURCES,
        feeds: {
          rss: 'https://pointcast.xyz/feed.xml',
          json: 'https://pointcast.xyz/feed.json',
          editorialCalendar: 'https://pointcast.xyz/noticing.json',
        },
        appendix: CALENDAR_APPENDIX,
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
