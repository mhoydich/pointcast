import type { APIRoute } from 'astro';
import { UES_PHILOSOPHY } from '../../lib/ues-philosophy';

/** /ues/philosophy.json — series catalog, including next-shelf stubs. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(UES_PHILOSOPHY, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
