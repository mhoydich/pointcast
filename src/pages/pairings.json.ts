import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { CHECKOUT_POLICY, COMMERCE_CORS_HEADERS, COMMERCE_VERSION, isPublicProduct } from '../lib/commerce';
import { resolveMoodTemplate } from '../lib/moods-soundtracks';

export const OPTIONS: APIRoute = async () => new Response(null, {
  status: 204,
  headers: COMMERCE_CORS_HEADERS,
});

export const GET: APIRoute = async () => {
  const [blocks, products] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft),
    getCollection('products', ({ data }) => isPublicProduct(data)),
  ]);
  const moods = new Set<string>();
  blocks.forEach(({ data }) => { if (data.mood) moods.add(data.mood); });
  products.forEach(({ data }) => data.pairsWithMood?.forEach((mood) => moods.add(mood)));

  const pairings = [...moods].map((mood) => {
    const template = resolveMoodTemplate(mood);
    const blockCount = blocks.filter(({ data }) => data.mood === mood).length;
    const productCount = products.filter(({ data }) => data.pairsWithMood?.includes(mood)).length;
    return {
      mood,
      label: template.label,
      description: template.dek,
      register: template.register,
      counts: { blocks: blockCount, products: productCount },
      url: `https://pointcast.xyz/pairings/${mood}`,
      jsonUrl: `https://pointcast.xyz/pairings/${mood}.json`,
    };
  }).sort((a, b) => {
    const countDifference = (b.counts.blocks + b.counts.products) - (a.counts.blocks + a.counts.products);
    return countDifference || a.mood.localeCompare(b.mood);
  });

  return new Response(JSON.stringify({
    version: COMMERCE_VERSION,
    name: 'PointCast commerce pairings',
    description: 'Agent-readable index of mood routes connecting PointCast blocks with public products.',
    generatedAt: new Date().toISOString(),
    homepage: 'https://pointcast.xyz/pairings',
    checkoutPolicy: CHECKOUT_POLICY,
    count: pairings.length,
    withProducts: pairings.filter(({ counts }) => counts.products > 0).length,
    pairings,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Total-Count': String(pairings.length),
      'X-PointCast-Commerce-Version': COMMERCE_VERSION,
      ...COMMERCE_CORS_HEADERS,
    },
  });
};
