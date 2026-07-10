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
  COMMERCE_VERSION,
  commerceCatalogMetadata,
  commerceLane,
  commerceLaneLabel,
  checkoutHost,
  isPublicProduct,
  pairingsUrls,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';
import { respondWithConditionalCache } from '../../lib/http-cache';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-Total-Count, X-PointCast-Commerce-Version, X-PointCast-Catalog-Updated-At, X-PointCast-Generated-At, ETag, Last-Modified',
} as const;

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const GET: APIRoute = async ({ request }) => {
  const products = (await getCollection('products', ({ data }) => isPublicProduct(data)))
    .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const lastModified = products[0]?.data.addedAt ?? new Date(0);
  const catalog = commerceCatalogMetadata(products);

  const lines = products.map((p) => {
    const kind = sourceKind(p.data);
    const lane = commerceLane(p.data);
    const moods = p.data.pairsWithMood ?? [];
    return JSON.stringify({
      slug: p.data.slug,
      name: p.data.name,
      brand: p.data.brand,
      description: p.data.description,
      dek: p.data.dek ?? null,
      productPage: `https://pointcast.xyz/products/${p.data.slug}`,
      shopUrl: p.data.url,
      checkoutUrl: p.data.url,
      checkoutHost: checkoutHost(p.data.url),
      sourceKind: kind,
      sourceLabel: sourceLabel(kind),
      checkoutPolicyMode: CHECKOUT_POLICY.mode,
      payment: CHECKOUT_POLICY.payment,
      pii: CHECKOUT_POLICY.pii,
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
      addedAt: p.data.addedAt.toISOString(),
      author: p.data.author,
      source: p.data.source ?? null,
      feed: {
        version: COMMERCE_VERSION,
        generatedAt: catalog.generatedAt,
        catalogUpdatedAt: catalog.catalogUpdatedAt,
      },
    });
  }).join('\n') + '\n';

  return respondWithConditionalCache({
    request,
    body: lines,
    contentType: 'application/x-ndjson; charset=utf-8',
    cacheControl: 'public, max-age=300',
    lastModified,
    headers: {
      'X-Total-Count': String(products.length),
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
      'X-PointCast-Catalog-Updated-At': catalog.catalogUpdatedAt,
      'X-PointCast-Generated-At': catalog.generatedAt,
      ...CORS_HEADERS,
    },
  });
};
