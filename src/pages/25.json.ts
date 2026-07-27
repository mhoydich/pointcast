import type { APIRoute } from 'astro';
import { POINTCAST_25 } from '../lib/pointcast-25';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...POINTCAST_25,
        canonical: 'https://pointcast.xyz/25',
        machineEdition: 'https://pointcast.xyz/25.json',
        block: 'https://pointcast.xyz/b/0510',
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
