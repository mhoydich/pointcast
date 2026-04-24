/**
 * POST /api/tank/dart — trigger a dart event for the session's fish.
 * Rate: 1 per 10s per session.
 */
import { callTank, corsPreflight, json, rateLimit, sessionFromRequest, type Env } from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const sessionId = sessionFromRequest(request);
  if (!rateLimit(`dart:${sessionId}`, 1, 10_000)) {
    return json({ ok: false, error: 'rate-limited', retryAfterMs: 10_000 }, 429);
  }

  return callTank(env, '/dart', { sessionId });
}
