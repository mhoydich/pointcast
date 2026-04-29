/**
 * GET /api/sit/presence — HTTP snapshot for the ambient sitting room.
 *
 * Reads the same `room:/sit` PresenceRoom instance as `/api/sit` without
 * opening a WebSocket, so observers like the homepage tile do not inflate
 * the number of people actually sitting.
 */

import { presenceSnapshotFallback } from '../../_realtime-fallback';

interface Env {
  PRESENCE?: DurableObjectNamespace;
}

const ROOM_KEY = 'room:2026-04-29c:/sit';
// Account-level DO duration is exhausted right now; use Pages fallback.
const USE_DURABLE_OBJECTS = false;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!USE_DURABLE_OBJECTS || !env.PRESENCE) {
    return sitSnapshotFallback(request.url);
  }

  try {
    const id = env.PRESENCE.idFromName(ROOM_KEY);
    const stub = env.PRESENCE.get(id);
    const incoming = new URL(request.url);
    const snapshotUrl = new URL(incoming.toString());
    snapshotUrl.pathname = '/snapshot';
    snapshotUrl.search = incoming.searchParams.has('sid')
      ? '?sid=' + encodeURIComponent(incoming.searchParams.get('sid') ?? '')
      : '';

    const response = await stub.fetch(new Request(snapshotUrl.toString(), { method: 'GET' }));
    if (!response.ok) throw new Error(`sit presence DO returned ${response.status}`);
    const raw = (await response.json()) as Record<string, unknown>;
    return Response.json(toSitPayload(raw), {
      status: response.ok ? 200 : response.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[sit/presence] DO fetch failed:', err);
    return sitSnapshotFallback(request.url);
  }
};

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
