/**
 * POST /api/tank/leave — mark the session's fish as ghosting.
 * Called by navigator.sendBeacon() on page unload.
 */
import { callTank, corsPreflight, json, sessionFromRequest, type Env } from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const sessionId = sessionFromRequest(request);
  return callTank(env, '/leave', { sessionId });
}
