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

interface Env {
  DRUM_ROOM?: DurableObjectNamespace;
  VISITS?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // Reject anything that's not a WebSocket upgrade
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('expected WebSocket upgrade', { status: 426 });
  }

  // No DO binding → tell the client to use polling. The client hooks
  // already do this on close/error so a 503 here triggers the fallback.
  if (!env.DRUM_ROOM) {
    return new Response('DRUM_ROOM Durable Object not configured · use /api/sounds polling', { status: 503 });
  }

  try {
    const id = env.DRUM_ROOM.idFromName('main');
    const stub = env.DRUM_ROOM.get(id);
    return await stub.fetch(request);
  } catch (err) {
    return new Response(`drum-room error: ${(err as Error).message}`, { status: 500 });
  }
};
