import type { APIRoute } from 'astro';
import frozen from '../../../lib/pointcast-25-board-001.frozen.json?raw';

// Board 001 is served verbatim from the frozen byte capture
// (sha-256 2a95780cd7f7fc52153b9c29d40060332b5ff98f97b8ebc6a2e36e41114adf83).
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
