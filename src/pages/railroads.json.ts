import type { APIRoute } from 'astro';
import { RAILROAD_ERAS, RAILROAD_TIME } from '../lib/railroad-history';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...RAILROAD_TIME,
        eras: RAILROAD_ERAS,
        discovery: {
          human: RAILROAD_TIME.canonical,
          machine: RAILROAD_TIME.machineEdition,
          socialImage: RAILROAD_TIME.social.image,
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        Link: `<${RAILROAD_TIME.canonical}>; rel="canonical"; type="text/html"`,
      },
    },
  );
