/** /products/{slug}.json — canonical machine-readable product detail. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  commerceLane,
  commerceLaneLabel,
  checkoutRoute,
  isPublicProduct,
  pairingsUrls,
  productPage,
  schemaAvailability,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';
import { respondWithConditionalCache } from '../../lib/http-cache';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-PointCast-Commerce-Version, ETag, Last-Modified',
} as const;

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getCollection('products', ({ data }) => isPublicProduct(data));
  return products.map((product) => ({ params: { slug: product.data.slug }, props: { product } }));
};

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ props, request }) => {
  const product = props.product as CollectionEntry<'products'>;
  const data = product.data;
  const kind = sourceKind(data);
  const lane = commerceLane(data);
  const moods = data.pairsWithMood ?? [];
  const canonical = productPage(data.slug);

  const payload = {
    $schema: 'https://pointcast.xyz/products/{slug}.json',
    version: COMMERCE_VERSION,
    canonical,
    html: canonical,
    json: `${canonical}.json`,
    checkoutPolicy: CHECKOUT_POLICY,
    product: {
      slug: data.slug,
      name: data.name,
      brand: data.brand,
      description: data.description,
      dek: data.dek ?? null,
      category: data.category ?? null,
      availability: data.availability,
      priceUsd: data.priceUsd ?? null,
      currency: data.currency,
      image: data.image ?? [],
      effects: data.effects ?? [],
      ingredients: data.ingredients ?? [],
      sourceKind: kind,
      sourceLabel: sourceLabel(kind),
      laneSlug: lane,
      laneLabel: commerceLaneLabel(lane),
      laneUrl: shopLaneUrl(lane, true),
      checkout: checkoutRoute(data.url),
      pairsWithMood: moods,
      pairingsUrls: pairingsUrls(moods),
      vibeProfile: data.vibeProfile ?? null,
      addedAt: data.addedAt.toISOString(),
      author: data.author,
      source: data.source ?? null,
    },
    schemaOrg: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': canonical,
      name: data.name,
      description: data.description,
      brand: { '@type': 'Brand', name: data.brand },
      url: canonical,
      ...(data.image?.length ? { image: data.image } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.priceUsd !== undefined ? {
        offers: {
          '@type': 'Offer',
          price: data.priceUsd,
          priceCurrency: data.currency,
          availability: schemaAvailability(data.availability),
          url: data.url,
        },
      } : {}),
    },
  };

  return respondWithConditionalCache({
    request,
    body: JSON.stringify(payload, null, 2),
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=300',
    lastModified: data.addedAt,
    headers: { 'X-PointCast-Commerce-Version': COMMERCE_VERSION, ...CORS_HEADERS },
  });
};
