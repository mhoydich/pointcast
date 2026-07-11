import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublicProduct, latestCommerceDate } from '../lib/commerce';

const urls = [
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
  ['https://pointcast.xyz/pairings.json', 'daily', '0.75'],
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
  const today = new Date().toISOString().slice(0, 10);
  const [blocks, products] = await Promise.all([
    getCollection('blocks', ({ data }) => !data.draft),
    getCollection('products', ({ data }) => isPublicProduct(data)),
  ]);
  const moods = Array.from(new Set([
    ...blocks.flatMap(({ data }) => data.mood ? [data.mood] : []),
    ...products.flatMap(({ data }) => data.pairsWithMood ?? []),
  ])).sort();
  const catalogLastmod = products.length > 0
    ? products.reduce(
        (latest, { data }) => (data.updatedAt ?? data.addedAt) > latest ? (data.updatedAt ?? data.addedAt) : latest,
        products[0].data.updatedAt ?? products[0].data.addedAt,
      ).toISOString().slice(0, 10)
    : today;
  const commerceRootUrls = new Set([
    'https://pointcast.xyz/shop',
    'https://pointcast.xyz/shop.json',
    'https://pointcast.xyz/products',
    'https://pointcast.xyz/products.json',
    'https://pointcast.xyz/api/products.jsonl',
    'https://pointcast.xyz/pairings',
    'https://pointcast.xyz/pairings.json',
  ]);
  const commerceUrls = [
    ...products.flatMap(({ data }) => [
      [`https://pointcast.xyz/products/${data.slug}`, 'weekly', '0.75', (data.updatedAt ?? data.addedAt).toISOString().slice(0, 10)],
      [`https://pointcast.xyz/products/${data.slug}.json`, 'weekly', '0.72', (data.updatedAt ?? data.addedAt).toISOString().slice(0, 10)],
    ]),
    ...moods.flatMap((mood) => {
      const pairingUpdatedAt = latestCommerceDate([
        ...blocks
          .filter(({ data }) => data.mood === mood)
          .map(({ data }) => data.timestamp),
        ...products
          .filter(({ data }) => data.pairsWithMood?.includes(mood))
          .map(({ data }) => data.updatedAt ?? data.addedAt),
      ]);
      const pairingLastmod = (pairingUpdatedAt ?? new Date(`${catalogLastmod}T00:00:00.000Z`))
        .toISOString()
        .slice(0, 10);

      return [
        [`https://pointcast.xyz/pairings/${mood}`, 'daily', '0.72', pairingLastmod],
        [`https://pointcast.xyz/pairings/${mood}.json`, 'daily', '0.7', pairingLastmod],
      ];
    }),
  ];
  const discoveryUrls = [
    ...urls.map(([loc, changefreq, priority]) => [
      loc,
      changefreq,
      priority,
      commerceRootUrls.has(loc) ? catalogLastmod : today,
    ]),
    ...commerceUrls,
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${discoveryUrls.map(([loc, changefreq, priority, lastmod]) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
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
