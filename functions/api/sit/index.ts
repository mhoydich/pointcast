/**
 * /api/sit — compatibility WebSocket for the ambient sitting room.
 *
 * The original /sit client was written against a tiny `{type:"presence"}`
 * room contract. The production presence backend now lives in the shared
 * PresenceRoom Durable Object, sharded by `room:/sit`; this endpoint keeps
 * the old URL alive while reusing that backend.
 */

import { acceptPresenceWebSocketFallback, presenceSnapshotFallback } from '../../_realtime-fallback';

interface Env {
  PRESENCE?: DurableObjectNamespace;
  VISITS?: KVNamespace;
}

const ROOM_KEY = 'room:2026-04-29c:/sit';
// Account-level DO duration is exhausted right now; use Pages fallback.
const USE_DURABLE_OBJECTS = false;

export const onRequest: PagesFunction<Env> = async ({ env, request }) => {
  const upgrade = (request.headers.get('Upgrade') || '').toLowerCase();

  if (!USE_DURABLE_OBJECTS || !env.PRESENCE) {
    if (upgrade === 'websocket') {
      return acceptPresenceWebSocketFallback(withSitDefaults(request), ROOM_KEY, 'human', env.VISITS);
    }
    return sitSnapshotFallback(request.url);
  }

  const id = env.PRESENCE.idFromName(ROOM_KEY);
  const stub = env.PRESENCE.get(id);

  if (upgrade === 'websocket') {
    try {
      const response = await stub.fetch(withSitDefaults(request));
      if (response.status === 101) return response;
      console.error(`[sit] DO returned ${response.status}; using fallback`);
      return acceptPresenceWebSocketFallback(withSitDefaults(request), ROOM_KEY, 'human', env.VISITS);
    } catch (err) {
      console.error('[sit] DO fetch failed:', err);
      return acceptPresenceWebSocketFallback(withSitDefaults(request), ROOM_KEY, 'human', env.VISITS);
    }
  }

  return sitSnapshot(stub, request.url).catch(() => sitSnapshotFallback(request.url));
};

function withSitDefaults(request: Request): Request {
  const url = new URL(request.url);
  if (!url.searchParams.has('kind')) url.searchParams.set('kind', 'human');
  if (!url.searchParams.has('sid')) url.searchParams.set('sid', crypto.randomUUID());
  return new Request(url.toString(), request);
}

async function sitSnapshot(stub: DurableObjectStub, requestUrl: string): Promise<Response> {
  const incoming = new URL(requestUrl);
  const snapshotUrl = new URL(incoming.toString());
  snapshotUrl.pathname = '/snapshot';
  snapshotUrl.search = incoming.searchParams.has('sid')
    ? '?sid=' + encodeURIComponent(incoming.searchParams.get('sid') ?? '')
    : '';

  const response = await stub.fetch(new Request(snapshotUrl.toString(), { method: 'GET' }));
  if (!response.ok) throw new Error(`sit snapshot DO returned ${response.status}`);
  const raw = (await response.json()) as Record<string, unknown>;
  return Response.json(toSitPayload(raw), {
    status: response.ok ? 200 : response.status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function sitSnapshotFallback(requestUrl: string): Response {
  const incoming = new URL(requestUrl);
  const sid = incoming.searchParams.get('sid');
  const raw = presenceSnapshotFallback(ROOM_KEY, sid ?? undefined);
  return Response.json(toSitPayload(raw), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function toSitPayload(raw: Record<string, unknown>) {
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  const humans = Number(raw.humans ?? 0);
  const agents = Number(raw.agents ?? 0);
  const sitting = Math.max(0, Math.round(humans + agents)) || sessions.length;
  const now = Date.now();
  const totalMinutes = sessions.reduce((sum, session) => {
    if (!session || typeof session !== 'object') return sum;
    const joinedAt = Date.parse(String((session as { joinedAt?: unknown }).joinedAt ?? ''));
    if (!Number.isFinite(joinedAt)) return sum;
    return sum + Math.max(0, Math.floor((now - joinedAt) / 60_000));
  }, 0);

  return {
    type: 'presence',
    sitting,
    total_minutes: totalMinutes,
    updated_at: new Date(now).toISOString(),
    source: 'presence-room:/sit',
  };
}
