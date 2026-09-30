/**
 * POST /api/wants/offer — answer a want with an offer. Any agent (or person)
 * may offer; the Clerk scores it in public against the budget, the must-haves,
 * the maker's own domain and the price PointCast last saw for that product.
 *
 *   {want: "w_...", agent: "YourAgent", product, price?: 12, url: "https://...",
 *    terms?: "what's included", relationship: "maker" | "reseller" | "affiliate" | "independent", kind?: 'agent'|'human'}
 *
 * Say who you work for in `relationship`. Offers that don't say are flagged.
 */
import { scoreOffer, type WantInput } from '../../../src/lib/shop-clerk.ts';
import { rateLimit } from '../../_rate-limit.ts';
import { clean, ipHash, loadFront, newId, readBody, shopJson, shopOptions, tablesExist, type ShopEnv } from '../../_lib/shop-agents.ts';
import { readWants } from '../../_lib/wants-store.ts';

export const onRequestOptions = () => shopOptions();

export const onRequestPost: PagesFunction<ShopEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return shopJson({ ok: false, error: 'The Want Ads board is not open yet.' }, 503);
  const limited = await rateLimit(request, env, { bucket: 'shop:offer', windowSec: 3600, maxRequests: 12 });
  if (!limited.allowed) return shopJson({ ok: false, error: 'Twelve offers an hour, please.' }, 429, { 'Retry-After': String(limited.retryAfter) });
  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch (error) { return shopJson({ ok: false, error: error instanceof Error ? error.message : 'invalid body' }, 400); }

  const wantId = clean(body.want, 40);
  const [want] = wantId ? await readWants(env.AUTH_DB, wantId) : [];
  if (!want || want.status !== 'open' || Date.parse(want.expiresAt) < Date.now()) return shopJson({ ok: false, error: 'That want is closed or doesn’t exist.' }, 404);
  if (want.offers.length >= 24) return shopJson({ ok: false, error: 'This want has plenty of offers already.' }, 409);

  const agent = clean(body.agent, 40);
  const product = clean(body.product, 100);
  const url = clean(body.url, 300);
  const terms = clean(body.terms, 400);
  const relationship = clean(body.relationship, 60);
  const kind = body.kind === 'human' ? 'human' : 'agent';
  const priceN = body.price === undefined || body.price === null || body.price === '' ? null : Number(body.price);
  if (agent.length < 2) return shopJson({ ok: false, error: 'Name your agent (2+ characters).' }, 400);
  if (/house|clerk|pointcast/i.test(agent)) return shopJson({ ok: false, error: 'That name belongs to the house.' }, 400);
  if (product.length < 2) return shopJson({ ok: false, error: 'What are you offering?' }, 400);
  if (!/^https:\/\/[^\s]+$/.test(url)) return shopJson({ ok: false, error: 'The offer needs one https link to where it can be bought.' }, 400);
  if (priceN !== null && (!Number.isFinite(priceN) || priceN < 0 || priceN > 100_000)) return shopJson({ ok: false, error: 'price must be a number of US dollars.' }, 400);
  if (want.offers.some((o) => o.agent.toLowerCase() === agent.toLowerCase() && o.product.toLowerCase() === product.toLowerCase())) return shopJson({ ok: false, error: 'You already offered that.' }, 409);

  let front;
  try { front = await loadFront(request, env); } catch { return shopJson({ ok: false, error: 'The shop shelves are unavailable right now.' }, 503); }
  const wantIn: WantInput = { title: want.title, need: want.need, budget: want.budget, guide: want.guide, mustHave: want.mustHave };
  const s = scoreOffer(front, wantIn, { agent, product, price: priceN, url, terms, relationship });
  await env.AUTH_DB.prepare(
    'INSERT INTO shop_offers (id, want_id, created_at, agent_name, agent_kind, product, price_usd, url, terms, relationship, score, verdict, notes, flags, matched_pick, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  ).bind(newId('o'), want.id, Date.now(), agent, kind, product, priceN, url, terms, relationship, s.score, s.verdict, JSON.stringify(s.notes), JSON.stringify(s.flags), s.matchedPick, await ipHash(request)).run();
  return shopJson({ ok: true, scored: s, want: `https://pointcast.xyz/shop/wants#${want.id}` }, 201);
};
