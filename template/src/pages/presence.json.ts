/**
 * /presence.json — stub presence for your node.
 *
 * Returns zeros today. Swap in a KV-backed real-time provider when
 * you want live counts (Cloudflare KV + an edge function is the
 * lightest path; see /docs/run-your-own-node.md).
 */
import type { APIRoute } from 'astro';
import {
  PRESENCE_CONTRACT_SCHEMA,
  validatePresenceSpec,
  type PresenceSpec,
} from '../lib/federation-contract';

export const GET: APIRoute = async ({ url }) => {
  const roomParam = url.searchParams.get('room') ?? undefined;
  const payload: PresenceSpec & { note?: string } = {
    $schema: PRESENCE_CONTRACT_SCHEMA,
    nodeId: 'your-node',
    room: roomParam,
    humans: 0,
    agents: 0,
    total: 0,
    recent: [],
    generatedAt: new Date().toISOString(),
    note: 'Stub presence. Wire a real-time provider when ready.',
  };
  validatePresenceSpec(payload);
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
