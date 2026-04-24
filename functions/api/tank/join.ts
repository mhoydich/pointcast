/**
 * POST /api/tank/join — register a fish in the tank for this session.
 * Called by the /play/tank page on mount + by agent WebMCP calls.
 */
import {
  callTank,
  corsPreflight,
  deriveNounId,
  json,
  rateLimit,
  sessionFromRequest,
  sessionKindFromRequest,
  type Env,
} from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const sessionId = sessionFromRequest(request);
  if (!rateLimit(`join:${sessionId}`, 20, 60_000)) {
    return json({ ok: false, error: 'rate-limited' }, 429);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const kind = (body.kind as string) || sessionKindFromRequest(request);
  const nounId =
    typeof body.nounId === 'number' && body.nounId >= 0 && body.nounId < 1200
      ? (body.nounId as number)
      : deriveNounId(sessionId);

  return callTank(env, '/join', { sessionId, nounId, kind });
}
