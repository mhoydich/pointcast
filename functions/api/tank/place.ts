/**
 * POST /api/tank/place — place a plant or decor item.
 * Rate: 1 per minute per session.
 */
import { callTank, corsPreflight, json, rateLimit, sessionFromRequest, type Env } from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const sessionId = sessionFromRequest(request);
  if (!rateLimit(`place:${sessionId}`, 1, 60_000)) {
    return json({ ok: false, error: 'rate-limited', retryAfterMs: 60_000 }, 429);
  }

  let body: {
    item_type?: string;
    itemType?: string;
    type?: string;
    x?: number;
    y?: number;
    position?: { x?: number; y?: number };
  } = {};
  try {
    body = await request.json();
  } catch {}
  const itemType = body.item_type || body.itemType || body.type;
  const x = body.x ?? body.position?.x;
  const y = body.y ?? body.position?.y;

  if (!itemType) return json({ ok: false, error: 'item_type required' }, 400);

  return callTank(env, '/place', { sessionId, itemType, x, y });
}
