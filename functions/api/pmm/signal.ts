/**
 * /api/pmm/signal — the handshake note for PointCast Mobile Messaging.
 *
 * Two phones that want to talk peer to peer need to swap one WebRTC offer
 * and one answer. This endpoint holds each for ten minutes and nothing
 * else: no messages, no names, no keys. After the handshake the phones
 * talk directly and the note expires on its own.
 *
 *   GET  /api/pmm/signal                       → { bound }
 *   GET  /api/pmm/signal?room=ABCDEF&role=offer → 200 { sdp } | 200 { pending: true }
 *   POST { room, role: 'offer' | 'answer', sdp } → 201 { ok, expiresIn } | 409 { error: 'room-taken' }
 *
 * Both roles are write-once per room, so nobody who learns the code can
 * swap in their own answer after the friend has written theirs.
 *
 * Keys are `pmm:<room>:<role>:<random>` and readers find them with a prefix
 * list, never a direct get of a key they already read as missing: KV's edge
 * cache would otherwise serve that miss for up to a minute and stall the
 * handshake.
 *
 * Same env-guarded pattern as PC_PING_KV: without the PMM_KV binding every
 * call that needs storage answers 503 { reason: 'key-not-bound' } and the
 * app falls back to paste mode, which needs no server at all. Rate limits
 * use the shared PC_RATES_KV limiter and are advisory until that is bound.
 */
import { rateLimit, rateLimitResponse } from '../../_rate-limit.ts';

export interface Env {
  PMM_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

const ROOM = /^[A-HJ-NP-Z2-9]{6}$/;
const ROLES = new Set(['offer', 'answer']);
const TTL_SECONDS = 600;
const MAX_SDP = 32_000;
const MAX_BODY = 40_000;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const prefix = (room: string, role: string) => `pmm:${room}:${role}:`;

export const parseSignal = (input: unknown): { room: string; role: string; sdp: string } | { error: string } => {
  if (!input || typeof input !== 'object') return { error: 'bad-body' };
  const { room, role, sdp } = input as Record<string, unknown>;
  if (typeof room !== 'string' || !ROOM.test(room)) return { error: 'bad-room' };
  if (typeof role !== 'string' || !ROLES.has(role)) return { error: 'bad-role' };
  if (typeof sdp !== 'string' || !sdp.trim() || sdp.length > MAX_SDP) return { error: 'bad-sdp' };
  return { room, role, sdp };
};

async function findKey(kv: KVNamespace, room: string, role: string): Promise<string | null> {
  const page = await kv.list({ prefix: prefix(room, role), limit: 1 });
  return page.keys.length ? page.keys[0].name : null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const room = url.searchParams.get('room') || '';
  const role = url.searchParams.get('role') || '';
  if (!room && !role) return json({ bound: Boolean(env.PMM_KV), ttlSeconds: TTL_SECONDS });
  if (!env.PMM_KV) return json({ reason: 'key-not-bound' }, 503);
  if (!ROOM.test(room)) return json({ error: 'bad-room' }, 400);
  if (!ROLES.has(role)) return json({ error: 'bad-role' }, 400);
  const rl = await rateLimit(request, env, { bucket: 'pmm:get', windowSec: 60, maxRequests: 120 });
  if (!rl.allowed) return rateLimitResponse(rl, 'Polling too fast. Wait a few seconds.');
  const name = await findKey(env.PMM_KV, room, role);
  const sdp = name ? await env.PMM_KV.get(name) : null;
  if (!sdp) return json({ pending: true });
  return json({ sdp });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PMM_KV) return json({ reason: 'key-not-bound' }, 503);
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return json({ error: 'bad-sdp' }, 413);
  const rl = await rateLimit(request, env, { bucket: 'pmm:post', windowSec: 60, maxRequests: 10 });
  if (!rl.allowed) return rateLimitResponse(rl, 'Too many handshakes. Wait a minute.');
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const parsed = parseSignal(body);
  if ('error' in parsed) return json({ error: parsed.error }, 400);
  if (await findKey(env.PMM_KV, parsed.room, parsed.role)) return json({ error: 'room-taken' }, 409);
  await env.PMM_KV.put(prefix(parsed.room, parsed.role) + crypto.randomUUID(), parsed.sdp, { expirationTtl: TTL_SECONDS });
  return json({ ok: true, expiresIn: TTL_SECONDS }, 201);
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
