import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { isPublicProduct } from '../lib/commerce';

type UrlTuple = [loc: string, changefreq: string, priority: string];

const baseUrls: UrlTuple[] = [
  ['https://pointcast.xyz/', 'daily', '1.0'],
  ['https://pointcast.xyz/agent-native-publishing', 'weekly', '0.95'],
  ['https://pointcast.xyz/agent-value', 'weekly', '0.9'],
  ['https://pointcast.xyz/agent-value.json', 'weekly', '0.9'],
  ['https://pointcast.xyz/cartography', 'weekly', '0.9'],
  ['https://pointcast.xyz/cartography.json', 'weekly', '0.9'],
  ['https://pointcast.xyz/cartography/pilot', 'weekly', '0.88'],
  ['https://pointcast.xyz/cartography/pilot.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/cartography/sprint', 'daily', '0.88'],
  ['https://pointcast.xyz/cartography/sprint.json', 'daily', '0.88'],
  ['https://pointcast.xyz/cartography/demo', 'weekly', '0.85'],
  ['https://pointcast.xyz/cartography/demo.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/investment-thesis', 'weekly', '0.85'],
  ['https://pointcast.xyz/investment-thesis.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/nouns-nation/roadmap', 'weekly', '0.85'],
  ['https://pointcast.xyz/nouns-nation/roadmap.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/for-agents', 'weekly', '0.9'],
  ['https://pointcast.xyz/agents.json', 'daily', '0.9'],
  ['https://pointcast.xyz/shop', 'daily', '0.85'],
  ['https://pointcast.xyz/shop.json', 'daily', '0.85'],
  ['https://pointcast.xyz/products', 'daily', '0.85'],
  ['https://pointcast.xyz/products.json', 'daily', '0.85'],
  ['https://pointcast.xyz/api/products.jsonl', 'daily', '0.8'],
  ['https://pointcast.xyz/api/blocks.jsonl', 'daily', '0.8'],
  ['https://pointcast.xyz/pairings', 'daily', '0.75'],
  ['https://pointcast.xyz/pairings.json', 'daily', '0.78'],
  ['https://pointcast.xyz/posts/ai-shopify-seo-geo-llm-best-practices-2026', 'weekly', '0.82'],
  ['https://pointcast.xyz/.well-known/agents.json', 'daily', '0.8'],
  ['https://pointcast.xyz/.well-known/ai.json', 'daily', '0.8'],
  ['https://pointcast.xyz/llms.txt', 'daily', '0.9'],
  ['https://pointcast.xyz/llms-full.txt', 'daily', '0.9'],
  ['https://pointcast.xyz/manifesto', 'weekly', '0.9'],
  ['https://pointcast.xyz/glossary', 'weekly', '0.8'],
  ['https://pointcast.xyz/blocks.json', 'daily', '0.9'],
  ['https://pointcast.xyz/feed.json', 'daily', '0.8'],
  ['https://pointcast.xyz/feed.xml', 'daily', '0.8'],
  ['https://pointcast.xyz/archive', 'daily', '0.8'],
  ['https://pointcast.xyz/archive.json', 'daily', '0.8'],
  ['https://pointcast.xyz/local', 'weekly', '0.7'],
  ['https://pointcast.xyz/local.json', 'weekly', '0.7'],
  ['https://pointcast.xyz/nature', 'weekly', '0.7'],
  ['https://pointcast.xyz/nature.json', 'weekly', '0.7'],
  ['https://pointcast.xyz/garden-yield', 'weekly', '0.7'],
  ['https://pointcast.xyz/garden-yield.json', 'weekly', '0.7'],
  ['https://pointcast.xyz/houseplants', 'weekly', '0.7'],
  ['https://pointcast.xyz/houseplants.json', 'weekly', '0.7'],
  ['https://pointcast.xyz/meditate', 'weekly', '0.7'],
  ['https://pointcast.xyz/meditate.json', 'weekly', '0.7'],
  ['https://pointcast.xyz/play', 'daily', '0.8'],
  ['https://pointcast.xyz/play.json', 'daily', '0.8'],
  ['https://pointcast.xyz/passport', 'weekly', '0.7'],
  ['https://pointcast.xyz/quests', 'weekly', '0.7'],
  ['https://pointcast.xyz/walk', 'daily', '0.7'],
  ['https://pointcast.xyz/room-weather', 'weekly', '0.7'],
  ['https://pointcast.xyz/radio', 'weekly', '0.7'],
  ['https://pointcast.xyz/routes', 'weekly', '0.7'],
  ['https://pointcast.xyz/builders', 'weekly', '0.7'],
  ['https://pointcast.xyz/civic', 'weekly', '0.7'],
  ['https://pointcast.xyz/pet', 'weekly', '0.7'],
  ['https://pointcast.xyz/pets', 'weekly', '0.7'],
  ['https://pointcast.xyz/pets.json', 'weekly', '0.7'],
  ['https://pointcast.xyz/poll/site-pet-name', 'weekly', '0.68'],
  ['https://pointcast.xyz/zen-cats', 'daily', '0.7'],
  ['https://pointcast.xyz/zen-cats.json', 'daily', '0.7'],
  ['https://pointcast.xyz/BLOCKS.md', 'weekly', '0.7'],
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async () => {
  const [products, blocks] = await Promise.all([
    getCollection('products', ({ data }) => isPublicProduct(data)),
    getCollection('blocks', ({ data }) => !data.draft),
  ]);

  const productUrls: UrlTuple[] = products
    .map((p) => [`https://pointcast.xyz/products/${p.data.slug}`, 'daily', '0.82'] satisfies UrlTuple)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const moodSet = new Set<string>();
  blocks.forEach((b) => {
    if (b.data.mood) moodSet.add(b.data.mood);
  });
  products.forEach((p) => {
    (p.data.pairsWithMood ?? []).forEach((mood) => moodSet.add(mood));
  });
  const moodUrls: UrlTuple[] = Array.from(moodSet)
    .sort((a, b) => a.localeCompare(b))
    .map((mood) => [`https://pointcast.xyz/pairings/${mood}`, 'daily', '0.76'] satisfies UrlTuple);

  const urls: UrlTuple[] = [];
  const seen = new Set<string>();
  for (const tuple of [...baseUrls, ...productUrls, ...moodUrls]) {
    if (seen.has(tuple[0])) continue;
    seen.add(tuple[0]);
    urls.push(tuple);
  }

  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, changefreq, priority]) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
