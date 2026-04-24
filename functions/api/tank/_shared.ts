/**
 * Shared helpers for /api/tank/* endpoints.
 *
 * Rate-limits are session-scoped (cookie-based) and live in a small
 * in-memory LRU on each Pages worker instance. That's good enough for
 * v0 — low-volume tank, no money at stake. Hardens in v0.1 to KV if
 * abuse surfaces.
 */
export interface Env {
  TANK?: DurableObjectNamespace;
}

export const CORS_JSON: HeadersInit = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-PC-Session',
    },
  });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_JSON });
}

/** Derive a stable session id from cookie or header, or mint one. */
export function sessionFromRequest(req: Request): string {
  const hdr = req.headers.get('x-pc-session');
  if (hdr) return hdr.slice(0, 64);
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/pc_session=([A-Za-z0-9_-]{8,64})/);
  if (m) return m[1];
  // anonymous fallback — deterministic from IP + UA so repeat requests collapse
  const ip = req.headers.get('cf-connecting-ip') || 'anon';
  const ua = (req.headers.get('user-agent') || 'anon').slice(0, 32);
  return `anon-${cheapHash(ip + ua).toString(36)}`;
}

export function sessionKindFromRequest(req: Request): 'human' | 'agent' | 'wallet' {
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  if (ua.startsWith('ai:') || /(claude|gpt|openai|anthropic|gemini|cursor|codex|manus)bot/i.test(ua)) {
    return 'agent';
  }
  const kindHdr = req.headers.get('x-pc-kind');
  if (kindHdr === 'agent' || kindHdr === 'wallet') return kindHdr;
  return 'human';
}

export function cheapHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function deriveNounId(sessionId: string): number {
  return cheapHash(sessionId) % 1200;
}

/** Simple in-memory rate limiter. Returns false if over limit. */
const buckets: Map<string, { hits: number; resetAt: number }> = new Map();
export function rateLimit(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.hits >= maxHits) return false;
  bucket.hits += 1;
  return true;
}

/** Forward to the tank DO. */
export async function callTank(env: Env, path: string, body: unknown): Promise<Response> {
  if (!env.TANK) {
    return json({ ok: false, error: 'tank-do-not-bound' }, 503);
  }
  const id = env.TANK.idFromName('pointcast-tank-v0');
  const stub = env.TANK.get(id);
  const r = await stub.fetch(`https://tank${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: CORS_JSON });
}
