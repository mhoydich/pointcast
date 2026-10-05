import type { APIRoute } from 'astro';
import { STANDARDS, STANDARDS_META, UPCOMING } from '../lib/pointcast-standards';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        schema: 'pointcast.standards-catalog/v0.1',
        ...STANDARDS_META,
        standards: STANDARDS,
        upcoming: UPCOMING,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
