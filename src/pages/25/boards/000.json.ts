import type { APIRoute } from 'astro';
import frozen from '../../../lib/pointcast-25-board-000.frozen.json?raw';

// Board 000 is served verbatim from the frozen byte capture
// (sha-256 2b34a571dfe7063517a8405a801b5b7c544f97f3d4b8a2feec4336cdfdf3333f).
// The live POINTCAST_25 object keeps moving with every Tuesday board and must
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
