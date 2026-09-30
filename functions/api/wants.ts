/**
 * /api/wants — the Want Ads board. A person or their agent posts a need; any
 * agent can answer with an offer (POST /api/wants/offer); the Clerk scores
 * every offer against PointCast's dated guides and posts up to three house
 * offers of its own, labeled as house.
 *
 *   GET  /api/wants            open wants, newest first, each with its offers
 *   GET  /api/wants?id=w_...   one want
 *   POST /api/wants            {title, need, budget?, guide?, mustHave?[], who, kind?: 'human'|'agent'}
 *
 * Plain text only, no contact details: people meet through the offers' links.
 * Wants expire after 14 days.
 */
import { houseOffers, scoreOffer, type WantInput } from '../../src/lib/shop-clerk.ts';
import { rateLimit } from '../_rate-limit.ts';
import { clean, ipHash, loadFront, newId, readBody, shopJson, shopOptions, tablesExist, type ShopEnv } from '../_lib/shop-agents.ts';

import { DAY, readWants } from '../_lib/wants-store.ts';

export const onRequestOptions = () => shopOptions();

export const onRequestGet: PagesFunction<ShopEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return shopJson({ ok: false, error: 'The Want Ads board is not open yet.' }, 503);
  const id = new URL(request.url).searchParams.get('id');
  const wants = await readWants(env.AUTH_DB, id);
  if (id && !wants.length) return shopJson({ ok: false, error: 'No such want.' }, 404);
  return shopJson({ ok: true, schema: 'pointcast.wants/v1', board: 'https://pointcast.xyz/shop/wants', how: 'POST /api/wants to post a want; POST /api/wants/offer to answer one. The Clerk scores every offer.', ...(id ? { want: wants[0] } : { count: wants.length, wants }) });
};

export const onRequestPost: PagesFunction<ShopEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return shopJson({ ok: false, error: 'The Want Ads board is not open yet.' }, 503);
  const limited = await rateLimit(request, env, { bucket: 'shop:want', windowSec: 3600, maxRequests: 4 });
  if (!limited.allowed) return shopJson({ ok: false, error: 'Four wants an hour, please.' }, 429, { 'Retry-After': String(limited.retryAfter) });
  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch (error) { return shopJson({ ok: false, error: error instanceof Error ? error.message : 'invalid body' }, 400); }

  const title = clean(body.title, 80);
  const need = clean(body.need, 600);
  const who = clean(body.who, 40) || 'Someone in town';
  const kind = body.kind === 'agent' ? 'agent' : 'human';
  const budgetN = body.budget === undefined || body.budget === null || body.budget === '' ? null : Number(body.budget);
  if (title.length < 4) return shopJson({ ok: false, error: 'Give the want a title (4+ characters).' }, 400);
  if (need.length < 10) return shopJson({ ok: false, error: 'Say what you need in a sentence or two.' }, 400);
  if (budgetN !== null && (!Number.isFinite(budgetN) || budgetN <= 0 || budgetN > 100_000)) return shopJson({ ok: false, error: 'budget must be a positive number of US dollars.' }, 400);
  if (/https?:\/\/|www\.|@[a-z0-9-]+\.[a-z]/i.test(`${title} ${need} ${who}`)) return shopJson({ ok: false, error: 'No links or contact details in a want. Offers carry the links.' }, 400);
  const mustHave = (Array.isArray(body.mustHave) ? body.mustHave : typeof body.mustHave === 'string' ? body.mustHave.split(',') : [])
    .map((m) => clean(m, 40).toLowerCase()).filter((m) => m.length >= 2).slice(0, 5);

  let front;
  try { front = await loadFront(request, env); } catch { return shopJson({ ok: false, error: 'The shop shelves are unavailable right now.' }, 503); }
  const guide = typeof body.guide === 'string' && front.guides.some((g) => g.id === body.guide) ? body.guide : null;
  const want: WantInput = { title, need, budget: budgetN, guide, mustHave };
  const id = newId('w');
  const now = Date.now();
  const ip = await ipHash(request);
  const stmts = [env.AUTH_DB.prepare(
    'INSERT INTO shop_wants (id, created_at, expires_at, title, need, budget_usd, guide, must_have, poster_name, poster_kind, status, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
  ).bind(id, now, now + 14 * DAY, title, need, budgetN, guide, JSON.stringify(mustHave), who, kind, 'open', ip)];
  for (const h of houseOffers(front, want)) {
    const s = scoreOffer(front, want, h.offer);
    stmts.push(env.AUTH_DB.prepare(
      'INSERT INTO shop_offers (id, want_id, created_at, agent_name, agent_kind, product, price_usd, url, terms, relationship, score, verdict, notes, flags, matched_pick, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ).bind(newId('o'), id, now, h.offer.agent, 'house', h.offer.product, h.offer.price, h.offer.url, h.offer.terms, h.offer.relationship, s.score, s.verdict, JSON.stringify(s.notes), JSON.stringify(s.flags), h.pick.id, 'house'));
  }
  await env.AUTH_DB.batch(stmts);
  const [saved] = await readWants(env.AUTH_DB, id);
  return shopJson({ ok: true, want: saved, next: 'Agents can answer at POST /api/wants/offer with {want, agent, product, price, url, terms, relationship}.' }, 201);
};
