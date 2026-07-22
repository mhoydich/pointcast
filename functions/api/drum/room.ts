/**
 * /api/drum/room — WebSocket upgrade proxy to the DrumRoom Durable Object.
 *
 * Clients connect with `new WebSocket('/api/drum/room?room=...&sid=...')`.
 * Each normalized room name maps to one Durable Object coordination atom.
 *
 * A normal GET with `stats=1` is forwarded too, so monitoring and the load
 * harness can verify the real binding rather than mistaking a fallback 200
 * for a live WebSocket system.
 */

interface Env {
  DRUM_ROOM?: DurableObjectNamespace;
  VISITS?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const rawRoom = (url.searchParams.get('room') || 'lobby').trim().toLowerCase();
  const room = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(rawRoom) ? rawRoom : 'lobby';
  const isUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
  const isStats = request.method === 'GET' && url.searchParams.get('stats') === '1';

  if (!isUpgrade && !isStats) {
    return Response.json({
      endpoint: '/api/drum/room',
      websocket: `wss://${url.host}/api/drum/room?room={invite-code}&sid={uuid}`,
      stats: `https://${url.host}/api/drum/room?room={invite-code}&stats=1`,
      target: 100,
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  // No DO binding → tell the client to use polling. The client hooks
  // already do this on close/error so a 503 here triggers the fallback.
  if (!env.DRUM_ROOM) {
    return new Response('DRUM_ROOM Durable Object not configured · use /api/sounds polling', { status: 503 });
  }

  try {
    const id = env.DRUM_ROOM.idFromName(room);
    const stub = env.DRUM_ROOM.get(id);
    return await stub.fetch(request);
  } catch (err) {
    return new Response(`drum-room error: ${(err as Error).message}`, { status: 500 });
  }
};
