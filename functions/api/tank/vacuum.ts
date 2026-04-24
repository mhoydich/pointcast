/**
 * POST /api/tank/vacuum — reduce waste. Cooldown: 1h per session (DO-side).
 */
import { callTank, corsPreflight, json, sessionFromRequest, type Env } from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const sessionId = sessionFromRequest(request);
  return callTank(env, '/vacuum', { sessionId });
}
