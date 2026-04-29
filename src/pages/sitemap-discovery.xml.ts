import type { APIRoute } from 'astro';

const urls = [
  ['https://pointcast.xyz/', 'daily', '1.0'],
  ['https://pointcast.xyz/agent-native-publishing', 'weekly', '0.95'],
  ['https://pointcast.xyz/agent-value', 'weekly', '0.9'],
  ['https://pointcast.xyz/agent-value.json', 'weekly', '0.9'],
  ['https://pointcast.xyz/investment-thesis', 'weekly', '0.85'],
  ['https://pointcast.xyz/investment-thesis.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/nouns-nation/roadmap', 'weekly', '0.85'],
  ['https://pointcast.xyz/nouns-nation/roadmap.json', 'weekly', '0.85'],
  ['https://pointcast.xyz/for-agents', 'weekly', '0.9'],
  ['https://pointcast.xyz/agents.json', 'daily', '0.9'],
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

export const GET: APIRoute = () => {
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
