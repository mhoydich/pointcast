/**
 * /products/{slug}.json — machine-readable companion to a product detail page.
 *
 * Checkout remains an outbound merchant URL. Only public products receive a
 * static route, so draft and unavailable PointCast merch cannot leak here.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  commerceLane,
  commerceLaneLabel,
  checkoutHost,
  isPublicProduct,
  pairingsUrls,
  schemaAvailability,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';

export async function getStaticPaths() {
  const products = await getCollection('products', ({ data }) => isPublicProduct(data));
  return products.map((product) => ({
    params: { slug: product.data.slug },
    props: { product },
  }));
}

interface Props { product: CollectionEntry<'products'>; }

export const GET: APIRoute<Props> = async ({ props }) => {
  const { data } = props.product;
  const kind = sourceKind(data);
  const lane = commerceLane(data);
  const moods = data.pairsWithMood ?? [];
  const canonical = `https://pointcast.xyz/products/${data.slug}`;

  const payload = {
    $schema: 'https://pointcast.xyz/products.json',
    version: COMMERCE_VERSION,
    slug: data.slug,
    name: data.name,
    brand: data.brand,
    description: data.description,
    dek: data.dek ?? null,
    canonical,
    json: `${canonical}.json`,
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
    vibeProfile: data.vibeProfile ?? null,
    addedAt: data.addedAt.toISOString(),
    author: data.author,
    source: data.source ?? null,
    schemaOrg: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': canonical,
      name: data.name,
      brand: { '@type': 'Brand', name: data.brand },
      description: data.description,
      url: canonical,
      ...(data.image?.length ? { image: data.image } : {}),
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
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
    },
  });
};
