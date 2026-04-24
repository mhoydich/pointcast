/**
 * POST /api/tank/feed — drop a flake in the tank.
 * Rate: 1 per 5 seconds per session.
 */
import { callTank, corsPreflight, json, rateLimit, sessionFromRequest, type Env } from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const sessionId = sessionFromRequest(request);
  if (!rateLimit(`feed:${sessionId}`, 1, 5_000)) {
    return json({ ok: false, error: 'rate-limited', retryAfterMs: 5_000 }, 429);
  }

  let body: { x?: number; y?: number; position?: { x?: number; y?: number } } = {};
  try {
    body = await request.json();
  } catch {}
  const x = body.x ?? body.position?.x;
  const y = body.y ?? body.position?.y;

  return callTank(env, '/feed', { sessionId, x, y });
}
