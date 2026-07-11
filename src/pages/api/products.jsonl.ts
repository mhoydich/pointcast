/**
 * /api/products.jsonl — NDJSON feed of every Good Feels product on PointCast.
 *
 * One product per line. Each line includes `pairsWithMood` (the cross-index
 * key), `vibeProfile` (soundtrack pointer), and `pairingsUrl` — the page on
 * PointCast that renders this product alongside matching blocks + vibe.
 *
 * Agents consuming this feed can answer "what Good Feels product fits the
 * mood I'm reading" without visiting the shop directly.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import {
  CHECKOUT_POLICY,
  COMMERCE_CORS_HEADERS,
  COMMERCE_VERSION,
  commerceLane,
  commerceLaneLabel,
  commerceLastModified,
  checkoutActionLabel,
  checkoutHost,
  isPublicProduct,
  pairingsUrls,
  pairingsJsonUrls,
  productLinks,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: COMMERCE_CORS_HEADERS,
  });
};

export const GET: APIRoute = async () => {
  const products = (await getCollection('products', ({ data }) => isPublicProduct(data)))
    .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const catalogUpdatedAt = products.reduce<Date | null>((latest, product) => {
    const updatedAt = product.data.updatedAt ?? product.data.addedAt;
    return !latest || updatedAt > latest ? updatedAt : latest;
  }, null);

  const lines = products.map((p) => {
    const kind = sourceKind(p.data);
    const lane = commerceLane(p.data);
    const moods = p.data.pairsWithMood ?? [];
    const links = productLinks(p.data.slug, p.data.url);
    const host = checkoutHost(p.data.url);
    return JSON.stringify({
      slug: p.data.slug,
      name: p.data.name,
      brand: p.data.brand,
      description: p.data.description,
      dek: p.data.dek ?? null,
      serving: p.data.serving ?? null,
      productPage: links.html,
      productJson: links.self,
      links,
      shopUrl: p.data.url,
      checkoutUrl: p.data.url,
      checkoutHost: host,
      checkoutAction: checkoutActionLabel(p.data.availability, host),
      checkoutPolicy: CHECKOUT_POLICY,
      sourceKind: kind,
      sourceLabel: sourceLabel(kind),
      laneSlug: lane,
      laneLabel: commerceLaneLabel(lane),
      laneUrl: shopLaneUrl(lane, true),
      image: p.data.image ?? null,
      priceUsd: p.data.priceUsd ?? null,
      currency: p.data.currency,
      availability: p.data.availability,
      category: p.data.category ?? null,
      effects: p.data.effects ?? [],
      ingredients: p.data.ingredients ?? [],
      pairsWithMood: moods,
      vibeProfile: p.data.vibeProfile ?? null,
      pairingsUrls: pairingsUrls(moods),
      pairingsJsonUrls: pairingsJsonUrls(moods),
      addedAt: p.data.addedAt.toISOString(),
      updatedAt: (p.data.updatedAt ?? p.data.addedAt).toISOString(),
      author: p.data.author,
      source: p.data.source ?? null,
    });
  }).join('\n') + '\n';

  return new Response(lines, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Total-Count': String(products.length),
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
      'Last-Modified': commerceLastModified(catalogUpdatedAt),
      ...COMMERCE_CORS_HEADERS,
    },
  });
};
