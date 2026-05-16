/**
 * /meditate.json — machine-readable mirror of /meditate.
 *
 * As of Sprint 2 of the live-artifacts arc, this endpoint is the
 * canonical reference implementation of the v1 room contract
 * (see src/lib/room-contract.ts + docs/room-contract.md). The
 * existing /meditate.astro continues to render its own rich page;
 * /r/meditate renders this payload via the shared RoomRenderer.
 *
 * Single source of truth: src/data/rooms/meditate.ts.
 */
import type { APIRoute } from 'astro';
import { validateRoomSpec } from '../lib/room-contract';
import { buildMeditateRoom } from '../data/rooms/meditate';

export const GET: APIRoute = async () => {
  const payload = buildMeditateRoom();

  // Validate against the v1 contract so a malformed room fails the build
  // rather than shipping a broken payload to consumers.
  validateRoomSpec(payload);

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
