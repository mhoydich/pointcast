import type { APIRoute } from 'astro';
import companion from '../data/steve-miller-band.json';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...companion,
        machine: {
          human: companion.url,
          interaction:
            'Client-side desk. Query params era, song, and persona select the open panels. The receipt lives in localStorage under pc:smb-companion:v1 and is not posted anywhere.',
          lyrics: false,
          charts: false,
          affiliateLinks: false,
        },
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
