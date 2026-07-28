import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublicProduct } from '../lib/commerce';
import { POINTCAST_25_TEAMS } from '../lib/pointcast-25-audience';
import afterimageExamples from '../data/afterimage-examples.json';

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
  ['https://pointcast.xyz/afterimage', 'weekly', '0.9'],
  ['https://pointcast.xyz/afterimage.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/sound-garden', 'weekly', '0.9'],
  ['https://pointcast.xyz/sound-garden.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/common-hours', 'weekly', '0.9'],
  ['https://pointcast.xyz/common-hours.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/adventure-networks', 'weekly', '0.9'],
  ['https://pointcast.xyz/adventure-networks.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/qwen-weather', 'weekly', '0.9'],
  ['https://pointcast.xyz/qwen-weather.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/qwen-silver-letter', 'weekly', '0.9'],
  ['https://pointcast.xyz/qwen-silver-letter.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/qwen-good-intelligence', 'weekly', '0.92'],
  ['https://pointcast.xyz/qwen-good-intelligence.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/sunset-switchboard', 'weekly', '0.92'],
  ['https://pointcast.xyz/sunset-switchboard.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/super-follow', 'daily', '0.94'],
  ['https://pointcast.xyz/super-follow.json', 'daily', '0.9'],
  ['https://pointcast.xyz/super-follow.feed.json', 'daily', '0.88'],
  ['https://pointcast.xyz/super-follow.xml', 'daily', '0.86'],
  ...afterimageExamples.flatMap((example) => [
    [`https://pointcast.xyz/afterimage/${example.slug}`, 'weekly', '0.82'] as SitemapEntry,
    [`https://pointcast.xyz/afterimage/${example.slug}.json`, 'weekly', '0.78'] as SitemapEntry,
  ]),
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
  ['https://pointcast.xyz/noticing', 'weekly', '0.96'],
  ['https://pointcast.xyz/noticing.json', 'weekly', '0.92'],
  ['https://pointcast.xyz/noticing/the-future-of-the-library', 'weekly', '0.98'],
  ['https://pointcast.xyz/noticing/the-future-of-the-library.json', 'weekly', '0.94'],
  ['https://pointcast.xyz/noticing/why-lacroix', 'weekly', '0.98'],
  ['https://pointcast.xyz/noticing/why-lacroix.json', 'weekly', '0.94'],
  ['https://pointcast.xyz/blocks.json', 'daily', '0.9'],
  ['https://pointcast.xyz/feed.json', 'daily', '0.8'],
  ['https://pointcast.xyz/feed.xml', 'daily', '0.8'],
  ['https://pointcast.xyz/25', 'daily', '0.98'],
  ['https://pointcast.xyz/25.json', 'daily', '0.94'],
  ['https://pointcast.xyz/25/season', 'weekly', '0.96'],
  ['https://pointcast.xyz/25/season.json', 'weekly', '0.92'],
  ['https://pointcast.xyz/25/disagreements', 'weekly', '0.98'],
  ['https://pointcast.xyz/25/disagreements.json', 'weekly', '0.94'],
  ['https://pointcast.xyz/25/receipts', 'weekly', '0.97'],
  ['https://pointcast.xyz/25/receipts.json', 'weekly', '0.93'],
  ['https://pointcast.xyz/25/boards/000', 'never', '0.92'],
  ['https://pointcast.xyz/25/boards/000.json', 'never', '0.88'],
  ...POINTCAST_25_TEAMS.flatMap((team) => [
    [`https://pointcast.xyz/25/teams/${team.slug}`, 'weekly', '0.9'] as SitemapEntry,
    [`https://pointcast.xyz/25/teams/${team.slug}.json`, 'weekly', '0.82'] as SitemapEntry,
  ]),
  ['https://pointcast.xyz/25/terms', 'monthly', '0.65'],
  ['https://pointcast.xyz/press', 'daily', '0.9'],
  ['https://pointcast.xyz/press.json', 'daily', '0.85'],
  ['https://pointcast.xyz/press.xml', 'daily', '0.82'],
  ['https://pointcast.xyz/local-star-commons', 'daily', '0.92'],
  ['https://pointcast.xyz/local-star-commons.json', 'daily', '0.88'],
  ['https://pointcast.xyz/network-el-segundo', 'daily', '0.9'],
  ['https://pointcast.xyz/network-el-segundo.json', 'daily', '0.86'],
  ['https://pointcast.xyz/network-el-segundo/field-kit', 'weekly', '0.9'],
  ['https://pointcast.xyz/network-el-segundo/field-kit.json', 'weekly', '0.86'],
  ['https://pointcast.xyz/network-el-segundo/mesh-commons', 'weekly', '0.92'],
  ['https://pointcast.xyz/network-el-segundo/mesh-commons.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/gallery/today', 'daily', '0.88'],
  ['https://pointcast.xyz/gallery/today.json', 'daily', '0.84'],
  ['https://pointcast.xyz/showcast/bells-bloom', 'weekly', '0.92'],
  ['https://pointcast.xyz/showcast/bells-bloom.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/garden-signal/open-heart', 'weekly', '0.98'],
  ['https://pointcast.xyz/garden-signal/open-heart.json', 'weekly', '0.94'],
  ['https://pointcast.xyz/beach-commons', 'weekly', '0.92'],
  ['https://pointcast.xyz/beach-commons.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/beach-commons/v2', 'weekly', '0.94'],
  ['https://pointcast.xyz/beach-commons/v2.json', 'weekly', '0.9'],
  ['https://pointcast.xyz/beach-commons/v3', 'weekly', '0.96'],
  ['https://pointcast.xyz/beach-commons/v3.json', 'weekly', '0.92'],
  ['https://pointcast.xyz/beach-commons/v4', 'weekly', '0.97'],
  ['https://pointcast.xyz/beach-commons/v4.json', 'weekly', '0.93'],
  ['https://pointcast.xyz/beach-commons/v5', 'weekly', '0.98'],
  ['https://pointcast.xyz/beach-commons/v5.json', 'weekly', '0.94'],
  ['https://pointcast.xyz/beach-commons/v6', 'weekly', '0.99'],
  ['https://pointcast.xyz/beach-commons/v6.json', 'weekly', '0.95'],
  ['https://pointcast.xyz/beach-commons/v7', 'weekly', '0.99'],
  ['https://pointcast.xyz/beach-commons/v7.json', 'weekly', '0.96'],
  ['https://pointcast.xyz/reviews', 'weekly', '0.92'],
  ['https://pointcast.xyz/reviews.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/reviews/beach-commons-v3', 'weekly', '0.96'],
  ['https://pointcast.xyz/reviews/beach-commons-v3.json', 'weekly', '0.92'],
  ['https://pointcast.xyz/reviews/tone-bloom', 'weekly', '0.88'],
  ['https://pointcast.xyz/reviews/tone-bloom.json', 'weekly', '0.84'],
  ['https://pointcast.xyz/reviews/the-listening-grove', 'weekly', '0.92'],
  ['https://pointcast.xyz/reviews/the-listening-grove.json', 'weekly', '0.88'],
  ['https://pointcast.xyz/reviews/year-one', 'weekly', '0.94'],
  ['https://pointcast.xyz/reviews/year-one.json', 'weekly', '0.90'],
  ['https://pointcast.xyz/listening-grove', 'weekly', '0.92'],
  ['https://pointcast.xyz/marine-layer', 'weekly', '0.90'],
  ['https://pointcast.xyz/marine-layer.json', 'weekly', '0.86'],
  ['https://pointcast.xyz/potters-field', 'monthly', '0.88'],
  ['https://pointcast.xyz/potters-field.json', 'monthly', '0.84'],
  ['https://pointcast.xyz/thursday', 'weekly', '0.86'],
  ['https://pointcast.xyz/bench', 'daily', '0.88'],
  ['https://pointcast.xyz/tug', 'weekly', '0.82'],
  ['https://pointcast.xyz/gallery/2026-07-22', 'weekly', '0.86'],
  ['https://pointcast.xyz/gallery/2026-07-22.json', 'weekly', '0.82'],
  ['https://pointcast.xyz/gallery/2026-07-21', 'weekly', '0.86'],
  ['https://pointcast.xyz/gallery/2026-07-21.json', 'weekly', '0.82'],
  ['https://pointcast.xyz/gallery/2026-07-20', 'monthly', '0.76'],
  ['https://pointcast.xyz/gallery/2026-07-20.json', 'monthly', '0.72'],
  ['https://pointcast.xyz/gallery/editions', 'daily', '0.84'],
  ['https://pointcast.xyz/gallery/editions.json', 'daily', '0.82'],
  ['https://pointcast.xyz/ads', 'weekly', '0.72'],
  ['https://pointcast.xyz/ads.json', 'weekly', '0.7'],
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
  ['https://pointcast.xyz/digital-pets', 'weekly', '0.96'],
  ['https://pointcast.xyz/digital-pets.json', 'weekly', '0.92'],
  ['https://pointcast.xyz/digital-pets/share', 'weekly', '0.9'],
  ['https://pointcast.xyz/digital-pets/share.json', 'weekly', '0.86'],
  ['https://pointcast.xyz/digital-pets/office', 'weekly', '0.92'],
  ['https://pointcast.xyz/digital-pets/office.json', 'weekly', '0.88'],
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
