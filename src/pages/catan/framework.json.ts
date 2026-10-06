import type { APIRoute } from 'astro';
import { gameShelfSpec } from '../../lib/catan-games';

/** /catan/framework.json — the machine twin of the game shelf. Live claims are on /api/catan/shelf. */
export const GET: APIRoute = () => {
  const spec = gameShelfSpec();
  return new Response(JSON.stringify({ ...spec, liveClaims: 'https://pointcast.xyz/api/catan/shelf' }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
