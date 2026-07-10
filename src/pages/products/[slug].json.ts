import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  commerceLane,
  commerceLaneLabel,
  checkoutHost,
  isPublicProduct,
  pairingsJsonUrls,
  pairingsUrls,
  schemaAvailability,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getCollection('products', ({ data }) => isPublicProduct(data));
  return products.map((product) => ({
    params: { slug: product.data.slug },
    props: { product },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const product = props.product as CollectionEntry<'products'>;
  const data = product.data;
  const kind = sourceKind(data);
  const lane = commerceLane(data);
  const moods = data.pairsWithMood ?? [];
  const canonical = `https://pointcast.xyz/products/${data.slug}`;

  const payload = {
    version: COMMERCE_VERSION,
    slug: data.slug,
    name: data.name,
    brand: data.brand,
    description: data.description,
    dek: data.dek ?? null,
    canonical,
    jsonUrl: `${canonical}.json`,
    checkoutUrl: data.url,
    checkoutHost: checkoutHost(data.url),
    checkoutPolicy: CHECKOUT_POLICY,
    sourceKind: kind,
    sourceLabel: sourceLabel(kind),
    laneSlug: lane,
    laneLabel: commerceLaneLabel(lane),
    laneUrl: shopLaneUrl(lane, true),
    image: data.image ?? [],
    priceUsd: data.priceUsd ?? null,
    currency: data.currency,
    availability: data.availability,
    category: data.category ?? null,
    effects: data.effects ?? [],
    ingredients: data.ingredients ?? [],
    pairsWithMood: moods,
    pairingsUrls: pairingsUrls(moods),
    pairingsJsonUrls: pairingsJsonUrls(moods),
    vibeProfile: data.vibeProfile ?? null,
    addedAt: data.addedAt.toISOString(),
    author: data.author,
    source: data.source ?? null,
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

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
    },
  });
};
