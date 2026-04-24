/**
 * POST /api/tank/describe — agent writes short lore about a fish.
 * Body: { fishId, lore (<=300), author? }
 * Rate: 6 per hour per session (generous for agents).
 */
import { callTank, corsPreflight, json, rateLimit, sessionFromRequest, type Env } from './_shared';

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const sessionId = sessionFromRequest(request);
  if (!rateLimit(`describe:${sessionId}`, 6, 3_600_000)) {
    return json({ ok: false, error: 'rate-limited', retryAfterMs: 600_000 }, 429);
  }

  let body: { fishId?: string; fish_id?: string; lore?: string; author?: string } = {};
  try {
    body = await request.json();
  } catch {}
  const fishId = body.fishId || body.fish_id;
  const lore = body.lore?.trim();
  const author = body.author;
  if (!fishId || !lore) return json({ ok: false, error: 'fishId + lore required' }, 400);

  return callTank(env, '/describe', { sessionId, fishId, lore, author });
}
