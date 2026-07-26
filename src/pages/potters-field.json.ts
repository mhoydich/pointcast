import type { APIRoute } from 'astro';
import field from '../data/potters-field.json';

// The twenty-six, machine-readable. Same file the page renders from — recovered
// once by hand with scripts/recover-potters-field.mjs. No Ethereum call happens
// in the build or the request path. Nouns art is CC0.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(field, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=3600',
    },
  });
