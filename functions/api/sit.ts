/**
 * /api/sit — WebSocket entry for the ambient sitting room.
 *
 * This Pages Function only routes requests to the singleton SitRoom Durable
 * Object. The DO itself lives in workers/sit and imports the shared class from
 * src/durable_objects/SitRoom.ts because Pages projects cannot deploy DO
 * classes directly.
 */

interface Env {
  SIT_ROOM?: DurableObjectNamespace;
}

const ROOM_NAME = 'global';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function sitRoomStub(env: Env): DurableObjectStub | null {
  if (!env.SIT_ROOM) return null;
  const id = env.SIT_ROOM.idFromName(ROOM_NAME);
  return env.SIT_ROOM.get(id);
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const upgrade = request.headers.get('upgrade') ?? '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return json({
      endpoint: '/api/sit',
      type: 'websocket',
      websocket: 'wss://pointcast.xyz/api/sit',
      presence: '/api/sit/presence',
      server: { type: 'presence', sitting: 0, total_minutes: 0 },
      client: [{ type: 'join' }, { type: 'leave' }],
    });
  }

  const stub = sitRoomStub(env);
  if (!stub) {
    return json({
      error: 'sit-room-unbound',
      note: 'SIT_ROOM Durable Object binding is not configured.',
    }, 503);
  }

  return stub.fetch(request);
};
