/**
 * /api/pmm/signal — the handshake note for PointCast Mobile Messaging.
 *
 * Two phones that want to talk peer to peer need to swap one WebRTC offer
 * and one answer. This endpoint holds each for ten minutes and nothing
 * else: no messages, no names, no keys. After the handshake the phones
 * talk directly and this store forgets them.
 *
 *   GET  /api/pmm/signal                       → { bound }
 *   GET  /api/pmm/signal?room=ABCDEF&role=offer → 200 { sdp } | 200 { pending: true }
 *   POST { room, role: 'offer' | 'answer', sdp } → 201 { ok, expiresIn }
 *
 * Same env-guarded pattern as PC_PING_KV: without the PMM_KV binding every
 * call that needs storage answers 503 { reason: 'key-not-bound' } and the
 * app falls back to paste mode, which needs no server at all.
 */

export interface Env {
  PMM_KV?: KVNamespace;
}

const ROOM = /^[A-HJ-NP-Z2-9]{6}$/;
const ROLES = new Set(['offer', 'answer']);
const TTL_SECONDS = 600;
const MAX_SDP = 32_000;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const key = (room: string, role: string) => `pmm:${room}:${role}`;

export const parseSignal = (input: unknown): { room: string; role: string; sdp: string } | { error: string } => {
  if (!input || typeof input !== 'object') return { error: 'bad-body' };
  const { room, role, sdp } = input as Record<string, unknown>;
  if (typeof room !== 'string' || !ROOM.test(room)) return { error: 'bad-room' };
  if (typeof role !== 'string' || !ROLES.has(role)) return { error: 'bad-role' };
  if (typeof sdp !== 'string' || !sdp.trim() || sdp.length > MAX_SDP) return { error: 'bad-sdp' };
  return { room, role, sdp };
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const room = url.searchParams.get('room') || '';
  const role = url.searchParams.get('role') || '';
  if (!room && !role) return json({ bound: Boolean(env.PMM_KV), ttlSeconds: TTL_SECONDS });
  if (!env.PMM_KV) return json({ reason: 'key-not-bound' }, 503);
  if (!ROOM.test(room)) return json({ error: 'bad-room' }, 400);
  if (!ROLES.has(role)) return json({ error: 'bad-role' }, 400);
  const sdp = await env.PMM_KV.get(key(room, role));
  if (!sdp) return json({ pending: true });
  return json({ sdp });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PMM_KV) return json({ reason: 'key-not-bound' }, 503);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const parsed = parseSignal(body);
  if ('error' in parsed) return json({ error: parsed.error }, 400);
  const existing = await env.PMM_KV.get(key(parsed.room, parsed.role));
  if (existing && parsed.role === 'offer') return json({ error: 'room-taken' }, 409);
  await env.PMM_KV.put(key(parsed.room, parsed.role), parsed.sdp, { expirationTtl: TTL_SECONDS });
  return json({ ok: true, expiresIn: TTL_SECONDS }, 201);
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
