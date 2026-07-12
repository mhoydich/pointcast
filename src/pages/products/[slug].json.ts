/**
 * /products/{slug}.json — machine-readable product detail.
 *
 * Static JSON twin for every public product page. Draft products and
 * unavailable PointCast merch never receive a route because getStaticPaths
 * uses the same visibility policy as the HTML catalog.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  commerceLane,
  commerceLaneLabel,
  checkoutHost,
  isPublicProduct,
  pairingsUrls,
  productPage,
  schemaAvailability,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';

export const getStaticPaths = (async () => {
  const products = await getCollection('products', ({ data }) => isPublicProduct(data));
  return products.map((product) => ({
    params: { slug: product.data.slug },
    props: { product },
  }));
}) satisfies GetStaticPaths;

interface Props {
  product: CollectionEntry<'products'>;
}

export const GET: APIRoute<Props> = ({ props }) => {
  const { data } = props.product;
  const kind = sourceKind(data);
  const lane = commerceLane(data);
  const moods = data.pairsWithMood ?? [];
  const canonical = productPage(data.slug);

  const payload = {
    $schema: 'https://pointcast.xyz/products.json',
    version: COMMERCE_VERSION,
    canonical,
    catalog: 'https://pointcast.xyz/products.json',
    checkoutPolicy: CHECKOUT_POLICY,
    product: {
      slug: data.slug,
      name: data.name,
      brand: data.brand,
      description: data.description,
      dek: data.dek ?? null,
      url: data.url,
      canonical,
      checkoutHost: checkoutHost(data.url),
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
