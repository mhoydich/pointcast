/**
 * /api/bloom/room — WebSocket upgrade proxy to the BloomPartyRoom Durable
 * Object behind Bloom Party (/bloom-party).
 *
 * Clients connect with
 * `new WebSocket('/api/bloom/room?room=ABCDEF&sid=...&role=player')`.
 * Each six-letter room code maps to one Durable Object.
 *
 * A plain GET with `stats=1` is forwarded too, so the load harness and any
 * monitoring can verify the real binding rather than mistaking a fallback 200
 * for a live room.
 */

interface Env {
  BLOOM_ROOM?: DurableObjectNamespace;
}

const ROOM_CODE_RE = /^[A-HJKMNP-TV-Z2-9]{6}$/;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const room = (url.searchParams.get('room') || '').trim().toUpperCase();
  const isUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
  const isStats = request.method === 'GET' && url.searchParams.get('stats') === '1';

  if (!isUpgrade && !isStats) {
    return Response.json({
      endpoint: '/api/bloom/room',
      game: 'Bloom Party',
      page: `https://${url.host}/bloom-party`,
      websocket: `wss://${url.host}/api/bloom/room?room={CODE}&sid={uuid}&role=player|stage`,
      stats: `https://${url.host}/api/bloom/room?room={CODE}&stats=1`,
      roomCode: 'six uppercase base32 characters, no O/I/L/U',
      maxPlayers: 15,
      protocolVersion: 1,
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  // An unknown code must not silently land strangers in a shared room — a
  // party game's whole premise is that the people in it are in the same room.
  if (!ROOM_CODE_RE.test(room)) {
    return new Response('bad-room-code', { status: 400 });
  }

  // No DO binding → the page falls back to solo mode, which is fully playable
  // on one phone. The client hooks already do this on close/error.
  if (!env.BLOOM_ROOM) {
    return new Response('BLOOM_ROOM Durable Object not configured · use /bloom-party?solo=1', { status: 503 });
  }

  try {
    const id = env.BLOOM_ROOM.idFromName(room);
    const stub = env.BLOOM_ROOM.get(id);
    return await stub.fetch(request);
  } catch (err) {
    return new Response(`bloom-room error: ${(err as Error).message}`, { status: 500 });
  }
};
