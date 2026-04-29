/**
 * /api/drum/room — WebSocket upgrade proxy to the DrumRoom Durable Object.
 *
 * Clients connect with `new WebSocket('/api/drum/room?sid=...')` and get
 * a fan-out connection that broadcasts any event they post to all other
 * connected clients in <100ms. Falls back to /api/sounds polling if the
 * DO binding isn't configured (e.g. Pages free tier or local dev without
 * the binding).
 *
 * One global "main" room for now — `state.idFromName('main')` always
 * resolves to the same DO instance regardless of which Worker handles
 * the upgrade. Sharding (per surface or per geo) is a later optimization.
 *
 * Per docs/briefs/2026-04-26-drum-realtime.md.
 */

import { acceptDrumWebSocketFallback } from '../../_realtime-fallback';

interface Env {
  DRUM_ROOM?: DurableObjectNamespace;
  VISITS?: KVNamespace;
}

const DRUM_ROOM_KEY = 'main:2026-04-29b';
// Account-level DO duration is exhausted right now; use Pages fallback.
const USE_DURABLE_OBJECTS = false;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // Reject anything that's not a WebSocket upgrade
  if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
    return new Response('expected WebSocket upgrade', { status: 426 });
  }

  // No DO binding → tell the client to use polling. The client hooks
  // already do this on close/error so a 503 here triggers the fallback.
  if (!USE_DURABLE_OBJECTS || !env.DRUM_ROOM) {
    return acceptDrumWebSocketFallback(request, env.VISITS);
  }

  try {
    const id = env.DRUM_ROOM.idFromName(DRUM_ROOM_KEY);
    const stub = env.DRUM_ROOM.get(id);
    const response = await stub.fetch(request);
    if (response.status === 101) return response;
    console.error(`[drum/room] DO returned ${response.status}; using fallback`);
    return acceptDrumWebSocketFallback(request, env.VISITS);
  } catch (err) {
    console.error('[drum/room] DO fetch failed:', err);
    return acceptDrumWebSocketFallback(request, env.VISITS);
  }
};
