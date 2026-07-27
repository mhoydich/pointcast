import type { APIRoute } from 'astro';
import {
  NOTICING,
  NOTICING_ALTITUDES,
  NOTICING_DESKS,
  NOTICING_STORIES,
} from '../lib/noticing';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...NOTICING,
        truthfulBoundary:
          'This endpoint is an editorial prospectus and planned calendar. A story with status next, on-desk, or fieldwork is not represented as published.',
        altitudes: NOTICING_ALTITUDES,
        desks: NOTICING_DESKS,
        schedule: NOTICING_STORIES,
        feeds: {
          rss: 'https://pointcast.xyz/feed.xml',
          json: 'https://pointcast.xyz/feed.json',
          archive: 'https://pointcast.xyz/archive',
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
