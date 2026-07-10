/**
 * /products.json — machine-readable product catalog.
 *
 * Mirrors the schema.org Product graph emitted by /products + per-product
 * pages. CORS-open. Cached 5 min — products don't change minute-to-minute.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  commerceCatalogMetadata,
  commerceLane,
  commerceLaneLabel,
  checkoutHost,
  isPublicProduct,
  pairingsUrls,
  schemaAvailability,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../lib/commerce';
import { respondWithConditionalCache } from '../lib/http-cache';

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
  const countSource = (kind: ReturnType<typeof sourceKind>) =>
    products.filter((product) => sourceKind(product.data) === kind).length;
  const catalog = commerceCatalogMetadata(products);

  const payload = {
    $schema: 'https://pointcast.xyz/products.json',
    version: COMMERCE_VERSION,
    name: 'PointCast products catalog',
    description: 'Structured product entries surfaced via PointCast for commerce discovery and agent routing. Checkout stays outbound at canonical shop surfaces.',
    generatedAt: catalog.generatedAt,
    catalogUpdatedAt: catalog.catalogUpdatedAt,
    count: products.length,
    homepage: 'https://pointcast.xyz/products',
    shop: 'https://pointcast.xyz/shop',
    checkoutPolicy: CHECKOUT_POLICY,
    catalog,
    guide: {
      title: 'AI Shopify SEO, GEO, and LLM best practices for 2026',
      url: 'https://pointcast.xyz/posts/ai-shopify-seo-geo-llm-best-practices-2026',
      summary: 'Best-practices guide for AI-readable Shopify product catalogs, Product schema, Shopify Catalog readiness, JSON feeds, and outbound checkout mirrors.',
    },
    seller: {
      name: 'Good Feels',
      url: 'https://getgoodfeels.com',
    },
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
      },
    ],
    products: products
      .map((p) => {
        const kind = sourceKind(p.data);
        const lane = commerceLane(p.data);
        const moods = p.data.pairsWithMood ?? [];
        return {
          slug: p.data.slug,
          name: p.data.name,
          brand: p.data.brand,
          description: p.data.description,
          dek: p.data.dek ?? null,
          url: p.data.url,
          canonical: `https://pointcast.xyz/products/${p.data.slug}`,
          checkoutHost: checkoutHost(p.data.url),
          sourceKind: kind,
          sourceLabel: sourceLabel(kind),
          laneSlug: lane,
          laneLabel: commerceLaneLabel(lane),
          laneUrl: shopLaneUrl(lane, true),
          image: p.data.image ?? [],
          priceUsd: p.data.priceUsd ?? null,
          currency: p.data.currency,
          availability: p.data.availability,
          category: p.data.category ?? null,
          effects: p.data.effects ?? [],
          ingredients: p.data.ingredients ?? [],
          pairsWithMood: moods,
          pairingsUrls: pairingsUrls(moods),
          addedAt: p.data.addedAt.toISOString(),
          author: p.data.author,
          source: p.data.source ?? null,
          schemaOrg: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: p.data.name,
            brand: p.data.brand,
            description: p.data.description,
            url: `https://pointcast.xyz/products/${p.data.slug}`,
            ...(p.data.image && p.data.image.length ? { image: p.data.image } : {}),
            ...(p.data.priceUsd !== undefined ? {
              offers: {
                '@type': 'Offer',
                price: p.data.priceUsd,
                priceCurrency: p.data.currency,
                availability: schemaAvailability(p.data.availability),
                url: p.data.url,
              },
            } : {}),
          },
        };
      }),
    ...(products.length === 0 ? {
      note: 'Catalog is empty (v0). First product lands when Mike adds an entry under src/content/products/ or drops a product URL via /drop.',
    } : {}),
  };

  const body = JSON.stringify(payload, null, 2);
  return respondWithConditionalCache({
    request,
    body,
    contentType: 'application/json; charset=utf-8',
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
