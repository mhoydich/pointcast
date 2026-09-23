import type { APIRoute } from 'astro';
import frozen from '../../../lib/pointcast-25-board-001.frozen.json?raw';

// Board 001 is served verbatim from the frozen byte capture
// (sha-256 c8dcda4e2ac260095a81914cf06dbbd25078c4b906e8c55c43a30b93ddb70695).
// The live POINTCAST_25 object keeps moving with every Tuesday board and must
// never feed this route — "immutable: true" has to stay a checkable fact.
export const GET: APIRoute = () =>
  new Response(frozen, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=31536001, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
