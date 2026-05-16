/**
 * /shop.json — storefront mirror for people building against PointCast.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  commerceLane,
  commerceLaneLabel,
  checkoutHost,
  isPublicProduct,
  pairingsUrls,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../lib/commerce';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-Total-Count, X-PointCast-Commerce-Version, ETag, Last-Modified',
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
  const countMatching = (pattern: RegExp) =>
    products.filter((product) => pattern.test(product.data.category || product.data.name)).length;
  const countSource = (kind: ReturnType<typeof sourceKind>) =>
    products.filter((product) => sourceKind(product.data) === kind).length;
  const moodSlugs = Array.from(new Set(products.flatMap((product) => product.data.pairsWithMood ?? []))).sort();

  const latestAddedAt = products[0]?.data.addedAt?.toISOString() ?? '';
  const etag = `W/"${COMMERCE_VERSION}-${products.length}-${latestAddedAt}"`;
  const lastModified = products[0]?.data.addedAt ?? new Date(0);

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'Cache-Control': 'public, max-age=300',
        'ETag': etag,
        'Last-Modified': lastModified.toUTCString(),
        'X-Total-Count': String(products.length),
        'X-PointCast-Commerce-Version': COMMERCE_VERSION,
        ...CORS_HEADERS,
      },
    });
  }

  const ifModifiedSince = request.headers.get('if-modified-since');
  if (ifModifiedSince) {
    const since = Date.parse(ifModifiedSince);
    if (Number.isFinite(since) && lastModified.getTime() <= since) {
      return new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=300',
          'ETag': etag,
          'Last-Modified': lastModified.toUTCString(),
          'X-Total-Count': String(products.length),
          'X-PointCast-Commerce-Version': COMMERCE_VERSION,
          ...CORS_HEADERS,
        },
      });
    }
  }

  const payload = {
    $schema: 'https://pointcast.xyz/shop.json',
    version: COMMERCE_VERSION,
    name: 'PointCast Commerce',
    description: 'Unified commerce hub for Good Feels product discovery, PointCast merch lanes, pairings, and agent-readable catalog routes. Checkout stays outbound at canonical shop surfaces.',
    generatedAt: new Date().toISOString(),
    homepage: 'https://pointcast.xyz/shop',
    productsJson: 'https://pointcast.xyz/products.json',
    productsJsonl: 'https://pointcast.xyz/api/products.jsonl',
    blocksJsonl: 'https://pointcast.xyz/api/blocks.jsonl',
    checkoutPolicy: CHECKOUT_POLICY,
    guides: [
      {
        slug: 'ai-shopify-seo-geo-llm-best-practices-2026',
        title: 'AI Shopify SEO, GEO, and LLM best practices for 2026',
        url: 'https://pointcast.xyz/posts/ai-shopify-seo-geo-llm-best-practices-2026',
        topics: ['shopify', 'seo', 'generative-engine-optimization', 'llm', 'structured-data', 'outbound-checkout'],
        summary: 'Practical guide for building AI-readable Shopify commerce while keeping source catalog facts and checkout ownership clear.',
      },
    ],
    count: products.length,
    sources: [
      {
        slug: 'good-feels',
        label: 'Good Feels',
        sourceKind: 'good-feels',
        url: 'https://getgoodfeels.com',
        checkoutHost: 'getgoodfeels.com',
        count: countSource('good-feels'),
        status: 'live',
      },
      {
        slug: 'pointcast-merch',
        label: 'PointCast Merch',
        sourceKind: 'pointcast-merch',
        url: 'https://pointcast.xyz/shop#pointcast-merch',
        checkoutHost: null,
        count: countSource('pointcast-merch'),
        status: 'coming-soon',
        note: 'Draft or unavailable PointCast Shopify products stay hidden until active.',
      },
    ],
    lanes: [
      { slug: 'good-feels', label: commerceLaneLabel('good-feels'), url: shopLaneUrl('good-feels', true), count: countSource('good-feels'), source: 'https://getgoodfeels.com', sourceKind: 'good-feels', status: 'live', description: 'All live Good Feels products mirrored for discovery.' },
      { slug: 'seltzers', label: commerceLaneLabel('seltzers'), url: shopLaneUrl('seltzers', true), count: countMatching(/seltzer|drink|mix seltzer/i), sourceKind: 'good-feels', status: 'live', description: 'THC seltzers and drink packs.' },
      { slug: 'gummies', label: commerceLaneLabel('gummies'), url: shopLaneUrl('gummies', true), count: countMatching(/gumm/i), sourceKind: 'good-feels', status: 'live', description: 'Gummies and 2-pack samples.' },
      { slug: 'enhancers', label: commerceLaneLabel('enhancers'), url: shopLaneUrl('enhancers', true), count: countMatching(/enhancer/i), sourceKind: 'good-feels', status: 'live', description: 'Beverage enhancers and drops.' },
      { slug: 'pointcast-merch', label: commerceLaneLabel('pointcast-merch'), url: shopLaneUrl('pointcast-merch', true), count: countSource('pointcast-merch'), sourceKind: 'pointcast-merch', status: 'coming-soon', description: 'Draft or unavailable PointCast merch stays hidden until active.' },
      { slug: 'pairings', label: commerceLaneLabel('pairings'), url: 'https://pointcast.xyz/pairings', count: moodSlugs.length, sourceKind: 'pointcast', status: 'live', description: 'Mood routes that cross-index products.' },
      { slug: 'json-api', label: commerceLaneLabel('json-api'), url: shopLaneUrl('json-api', true), count: 4, sourceKind: 'pointcast', status: 'live', description: 'Shop JSON, products JSON, products JSONL, and blocks JSONL.' },
    ],
    products: products.map((product) => {
      const kind = sourceKind(product.data);
      const lane = commerceLane(product.data);
      const moods = product.data.pairsWithMood ?? [];
      return {
        slug: product.data.slug,
        name: product.data.name,
        brand: product.data.brand,
        description: product.data.description,
        dek: product.data.dek ?? null,
        category: product.data.category ?? null,
        availability: product.data.availability,
        priceUsd: product.data.priceUsd ?? null,
        currency: product.data.currency,
        productPage: `https://pointcast.xyz/products/${product.data.slug}`,
        checkoutUrl: product.data.url,
        checkoutHost: checkoutHost(product.data.url),
        sourceKind: kind,
        sourceLabel: sourceLabel(kind),
        laneSlug: lane,
        laneLabel: commerceLaneLabel(lane),
        laneUrl: shopLaneUrl(lane, true),
        image: product.data.image ?? [],
        pairsWithMood: moods,
        pairingsUrls: pairingsUrls(moods),
        vibeProfile: product.data.vibeProfile ?? null,
        addedAt: product.data.addedAt.toISOString(),
        source: product.data.source ?? null,
      };
    }),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'ETag': etag,
      'Last-Modified': lastModified.toUTCString(),
      'X-Total-Count': String(products.length),
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
      ...CORS_HEADERS,
    },
  });
};
