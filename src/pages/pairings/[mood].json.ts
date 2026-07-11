import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
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
  latestCommerceDate,
  productLinks,
  shopLaneUrl,
  sourceKind,
  sourceLabel,
} from '../../lib/commerce';
import { resolveMoodTemplate } from '../../lib/moods-soundtracks';

export const OPTIONS: APIRoute = async () => new Response(null, {
  status: 204,
  headers: COMMERCE_CORS_HEADERS,
});

export const getStaticPaths: GetStaticPaths = async () => {
  const [blocks, products] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft),
    getCollection('products', ({ data }) => isPublicProduct(data)),
  ]);
  const moods = new Set<string>();
  blocks.forEach(({ data }) => { if (data.mood) moods.add(data.mood); });
  products.forEach(({ data }) => data.pairsWithMood?.forEach((mood) => moods.add(mood)));
  return [...moods].map((mood) => ({ params: { mood }, props: { mood } }));
};

export const GET: APIRoute = async ({ props }) => {
  const mood = String(props.mood);
  const template = resolveMoodTemplate(mood);
  const [allBlocks, allProducts] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft),
    getCollection('products', ({ data }) => isPublicProduct(data)),
  ]);
  const blocks = allBlocks
    .filter(({ data }) => data.mood === mood)
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .map(({ data }) => ({
      id: data.id,
      title: data.title,
      dek: data.dek ?? null,
      channel: data.channel,
      type: data.type,
      timestamp: data.timestamp.toISOString(),
      url: `https://pointcast.xyz/b/${data.id}`,
    }));
  const products = allProducts
    .filter(({ data }) => data.pairsWithMood?.includes(mood))
    .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime())
    .map(({ data }) => {
      const kind = sourceKind(data);
      const lane = commerceLane(data);
      const links = productLinks(data.slug, data.url);
      const host = checkoutHost(data.url);
      return {
        slug: data.slug,
        name: data.name,
        brand: data.brand,
        dek: data.dek ?? null,
        category: data.category ?? null,
        effects: data.effects ?? [],
        availability: data.availability,
        priceUsd: data.priceUsd ?? null,
        currency: data.currency,
        productPage: links.html,
        productJson: links.self,
        links,
        checkoutUrl: data.url,
        checkoutHost: host,
        checkoutAction: checkoutActionLabel(data.availability, host),
        sourceKind: kind,
        sourceLabel: sourceLabel(kind),
        laneSlug: lane,
        laneLabel: commerceLaneLabel(lane),
        laneUrl: shopLaneUrl(lane, true),
        vibeProfile: data.vibeProfile ?? null,
        updatedAt: (data.updatedAt ?? data.addedAt).toISOString(),
      };
    });

  const canonical = `https://pointcast.xyz/pairings/${mood}`;
  const updatedAt = latestCommerceDate([
    ...blocks.map((block) => new Date(block.timestamp)),
    ...products.map((product) => new Date(product.updatedAt)),
  ]);

  return new Response(JSON.stringify({
    version: COMMERCE_VERSION,
    mood,
    label: template.label,
    description: template.dek,
    register: template.register,
    url: canonical,
    jsonUrl: `${canonical}.json`,
    updatedAt: updatedAt?.toISOString() ?? null,
    links: {
      html: canonical,
      self: `${canonical}.json`,
      index: 'https://pointcast.xyz/pairings.json',
      catalog: 'https://pointcast.xyz/products.json',
      shop: 'https://pointcast.xyz/shop.json',
    },
    checkoutPolicy: CHECKOUT_POLICY,
    counts: { blocks: blocks.length, products: products.length },
    blocks,
    products,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
      'Last-Modified': commerceLastModified(updatedAt),
      ...COMMERCE_CORS_HEADERS,
    },
  });
};
