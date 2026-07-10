/** /pairings.json — agent-readable commerce/editorial mood index. */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { CHECKOUT_POLICY, COMMERCE_VERSION, checkoutRoute, isPublicProduct } from '../lib/commerce';
import { respondWithConditionalCache } from '../lib/http-cache';
import { resolveMoodTemplate } from '../lib/moods-soundtracks';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-Total-Count, X-PointCast-Commerce-Version, ETag, Last-Modified',
} as const;

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ request }) => {
  const [blocks, products] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft),
    getCollection('products', ({ data }) => isPublicProduct(data)),
  ]);
  const moodSlugs = new Set<string>();
  blocks.forEach((block) => { if (block.data.mood) moodSlugs.add(block.data.mood); });
  products.forEach((product) => (product.data.pairsWithMood ?? []).forEach((mood) => moodSlugs.add(mood)));

  const pairings = Array.from(moodSlugs).map((mood) => {
    const template = resolveMoodTemplate(mood);
    const moodBlocks = blocks.filter((block) => block.data.mood === mood)
      .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
    const moodProducts = products.filter((product) => (product.data.pairsWithMood ?? []).includes(mood))
      .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
    return {
      mood,
      label: template.label,
      description: template.dek,
      register: template.register,
      url: `https://pointcast.xyz/pairings/${mood}`,
      blockCount: moodBlocks.length,
      productCount: moodProducts.length,
      vibeProfiles: Array.from(new Set(moodProducts.map((product) => product.data.vibeProfile).filter(Boolean))),
      blocks: moodBlocks.map((block) => ({ id: block.data.id, title: block.data.title, channel: block.data.channel, type: block.data.type, url: `https://pointcast.xyz/b/${block.data.id}` })),
      products: moodProducts.map((product) => ({
        slug: product.data.slug,
        name: product.data.name,
        category: product.data.category ?? null,
        priceUsd: product.data.priceUsd ?? null,
        currency: product.data.currency,
        availability: product.data.availability,
        productPage: `https://pointcast.xyz/products/${product.data.slug}`,
        productJson: `https://pointcast.xyz/products/${product.data.slug}.json`,
        checkout: checkoutRoute(product.data.url),
      })),
    };
  }).sort((a, b) => (b.blockCount + b.productCount) - (a.blockCount + a.productCount) || a.mood.localeCompare(b.mood));

  const lastModified = products.reduce((latest, product) => product.data.addedAt > latest ? product.data.addedAt : latest, new Date(0));
  const body = JSON.stringify({
    $schema: 'https://pointcast.xyz/pairings.json', version: COMMERCE_VERSION, name: 'PointCast Pairings',
    description: 'Mood routes cross-indexing PointCast editorial blocks with public products and outbound checkout destinations.',
    generatedAt: lastModified.toISOString(), homepage: 'https://pointcast.xyz/pairings', checkoutPolicy: CHECKOUT_POLICY,
    count: pairings.length, pairings,
  }, null, 2);

  return respondWithConditionalCache({
    request, body, contentType: 'application/json; charset=utf-8', cacheControl: 'public, max-age=300', lastModified,
    headers: { 'X-Total-Count': String(pairings.length), 'X-PointCast-Commerce-Version': COMMERCE_VERSION, ...CORS_HEADERS },
  });
};
