/**
 * /api/clerk — the shop's buyer's agent. Free, signed, no commission.
 *
 *   GET  /api/clerk?q=robot+pet+under+$500[&maxPrice=500][&guide=home-robots][&limit=5]
 *   POST /api/clerk  {"q": "...", "maxPrice"?: 500, "guide"?: "home-robots", "limit"?: 5}
 *
 * Answers only from PointCast's own dated guides (/shop/front.json). A miss is
 * an honest miss. Every answer is signed with the treasury key so a shopping
 * agent can cite it; verify at /api/x402/keys.
 */
import { clerkAnswer, parseAsk } from '../../src/lib/shop-clerk.ts';
import { rateLimit } from '../_rate-limit.ts';
import { attestShop, loadFront, readBody, shopJson, shopOptions, type ShopEnv } from '../_lib/shop-agents.ts';

async function answer(request: Request, env: ShopEnv, input: Record<string, unknown>) {
  const limited = await rateLimit(request, env, { bucket: 'shop:clerk', windowSec: 60, maxRequests: 60 });
  if (!limited.allowed) return shopJson({ ok: false, error: 'Slow down: 60 questions a minute.' }, 429, { 'Retry-After': String(limited.retryAfter) });
  let front;
  try { front = await loadFront(request, env); }
  catch { return shopJson({ ok: false, error: 'The shop shelves are unavailable right now. Try again in a minute.' }, 503, { 'Retry-After': '60' }); }
  const ask = parseAsk(input, front.guides.map((g) => g.id));
  const result = clerkAnswer(front, ask);
  const signed = await attestShop(env, 'clerk-answer', result as unknown as Record<string, unknown>);
  return shopJson({ ok: true, ...signed, about: 'https://pointcast.xyz/shop/clerk', affiliateLinks: false });
}

export const onRequestOptions = () => shopOptions();

export const onRequestGet: PagesFunction<ShopEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  return answer(request, env, {
    q: url.searchParams.get('q') ?? '', maxPrice: url.searchParams.get('maxPrice') ?? undefined,
    guide: url.searchParams.get('guide') ?? undefined, limit: url.searchParams.get('limit') ?? undefined,
  });
};

export const onRequestPost: PagesFunction<ShopEnv> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try { body = await readBody(request, 4_096); }
  catch (error) { return shopJson({ ok: false, error: error instanceof Error ? error.message : 'invalid body' }, 400); }
  return answer(request, env, body);
};
