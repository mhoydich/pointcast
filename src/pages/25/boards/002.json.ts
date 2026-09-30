import type { APIRoute } from 'astro';
import frozen from '../../../lib/pointcast-25-board-002.frozen.json?raw';

// Board 002 is served verbatim from the frozen byte capture
// (sha-256 bcb6ea15f7ec93262f43ea00c3fc144065087303ba9cfef024b58b1fcfdb3c9e).
// The live POINTCAST_25 object keeps moving with every new board and must
// never feed this route — "immutable: true" has to stay a checkable fact.
export const GET: APIRoute = () =>
  new Response(frozen, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
