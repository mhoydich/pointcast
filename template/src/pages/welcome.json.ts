/**
 * /welcome.json — the room contract for /welcome.
 *
 * One source of truth (src/data/rooms/welcome.ts) feeds both this
 * endpoint and the rendered page at src/pages/r/welcome.astro.
 */
import type { APIRoute } from 'astro';
import { validateRoomSpec } from '../lib/room-contract';
import { buildWelcomeRoom } from '../data/rooms/welcome';

export const GET: APIRoute = async () => {
  const payload = validateRoomSpec(buildWelcomeRoom());
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
