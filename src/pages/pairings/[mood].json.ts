/**
 * /pairings/{mood}.json — machine-readable commerce/editorial pairing.
 *
 * Only public products are included, so draft or unavailable PointCast merch
 * cannot leak through this route. Checkout remains at the external merchant.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import {
  CHECKOUT_POLICY,
  COMMERCE_VERSION,
  checkoutHost,
  isPublicProduct,
  productPage,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';

export async function getStaticPaths() {
  const [blocks, products] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft),
    getCollection('products', ({ data }) => isPublicProduct(data)),
  ]);
  const moods = new Set<string>();
  blocks.forEach(({ data }) => { if (data.mood) moods.add(data.mood); });
  products.forEach(({ data }) => (data.pairsWithMood ?? []).forEach((mood) => moods.add(mood)));
  return Array.from(moods).map((mood) => ({ params: { mood }, props: { mood } }));
}

interface Props { mood: string; }

export const GET: APIRoute<Props> = async ({ props }) => {
  const { mood } = props;
  const [blocks, products] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft && data.mood === mood),
    getCollection('products', ({ data }) => isPublicProduct(data) && (data.pairsWithMood ?? []).includes(mood)),
  ]);
  const canonical = `https://pointcast.xyz/pairings/${mood}`;
  const payload = {
    $schema: 'https://pointcast.xyz/shop.json',
    version: COMMERCE_VERSION,
    mood,
    canonical,
    json: `${canonical}.json`,
    generatedAt: new Date().toISOString(),
    checkoutPolicy: CHECKOUT_POLICY,
    counts: { blocks: blocks.length, products: products.length },
    blocks: blocks
      .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
      .map(({ data }) => ({
        id: data.id,
        title: data.title,
        channel: data.channel,
        type: data.type,
        url: `https://pointcast.xyz/b/${data.id}`,
        timestamp: data.timestamp.toISOString(),
      })),
    products: products
      .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime())
      .map(({ data }) => {
        const kind = sourceKind(data);
        return {
          slug: data.slug,
          name: data.name,
          brand: data.brand,
          productPage: productPage(data.slug),
          checkoutUrl: data.url,
          checkoutHost: checkoutHost(data.url),
          sourceKind: kind,
          sourceLabel: sourceLabel(kind),
          availability: data.availability,
          priceUsd: data.priceUsd ?? null,
          currency: data.currency,
          vibeProfile: data.vibeProfile ?? null,
        };
      }),
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
