/**
 * /handshakes.json — machine mirror of /handshakes.
 *
 * The reciprocal-crawler ledger. Updated whenever scripts/reciprocal-crawl.mjs
 * runs and writes src/data/handshakes.json (default: daily, 09:15 local).
 */
import type { APIRoute } from 'astro';
import handshakes from '../data/handshakes.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(handshakes, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
