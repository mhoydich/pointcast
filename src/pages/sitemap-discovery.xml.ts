import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublicProduct } from '../lib/commerce';

type SitemapEntry = [loc: string, changefreq: string, priority: string];

const staticUrls: SitemapEntry[] = [
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
  ['https://pointcast.xyz/lobby', 'daily', '0.75'],
  ['https://pointcast.xyz/lobby.json', 'daily', '0.75'],
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

  const moods = new Set<string>();
  blocks.forEach(({ data }) => {
    if (data.mood) moods.add(data.mood);
  });
  products.forEach(({ data }) => {
    (data.pairsWithMood ?? []).forEach((mood) => moods.add(mood));
  });

  const dynamicUrls: SitemapEntry[] = [
    ...products.map(({ data }) => [
      `https://pointcast.xyz/products/${data.slug}`,
      'daily',
      '0.8',
    ] as SitemapEntry),
    ...products.map(({ data }) => [
      `https://pointcast.xyz/products/${data.slug}.json`,
      'daily',
      '0.75',
    ] as SitemapEntry),
    ...Array.from(moods).sort().map((mood) => [
      `https://pointcast.xyz/pairings/${mood}`,
      'daily',
      '0.7',
    ] as SitemapEntry),
    ...Array.from(moods).sort().map((mood) => [
      `https://pointcast.xyz/pairings/${mood}.json`,
      'daily',
      '0.65',
    ] as SitemapEntry),
  ];
  const urls = [...staticUrls, ...dynamicUrls];
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
