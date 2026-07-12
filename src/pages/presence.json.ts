/**
 * /presence.json — source of truth for "who is here".
 *
 * Sprint 3 of the live-artifacts arc. Read by RoomRenderer's status
 * chyron, by node.json consumers, and by the /rooms index (Sprint 10).
 *
 * Static-site limitation: at build time we don't know the live count,
 * so this endpoint returns a zero stub with a `note` field explaining
 * how to wire a real-time provider. When the edge function lands
 * (separate sprint, not in this 10-sprint arc), this endpoint becomes
 * dynamic and the stub goes away. Consumers don't need to change —
 * they're already polling the same URL.
 *
 * Optional `?room=<id>` query param scopes the count to one room.
 * In stub mode we return zeros regardless; the shape stays consistent.
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
    nodeId: 'pointcast',
    room: roomParam,
    humans: 0,
    agents: 0,
    total: 0,
    recent: [],
    generatedAt: new Date().toISOString(),
    note:
      'Stub presence: pointcast.xyz is statically built so this endpoint returns zeros. ' +
      'A future edge-function PR replaces this with KV-backed real-time counts. Until then ' +
      'consumers should treat zero counts as "unknown" rather than "empty room".',
  };

  validatePresenceSpec(payload);

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Short cache — when the edge function lands, it'll override.
      'Cache-Control': 'public, max-age=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
