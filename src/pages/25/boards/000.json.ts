import type { APIRoute } from 'astro';
import { POINTCAST_25 } from '../../../lib/pointcast-25';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...POINTCAST_25,
        immutable: true,
        canonical: 'https://pointcast.xyz/25/boards/000.json',
        current: 'https://pointcast.xyz/25.json',
        seasonLedger: 'https://pointcast.xyz/25/season.json',
        block: 'https://pointcast.xyz/b/0510',
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
