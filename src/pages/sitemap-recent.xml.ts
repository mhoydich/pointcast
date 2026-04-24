/**
 * /sitemap-recent.xml — last-7-days block sitemap.
 *
 * SEO: aggressive-recrawl signal. Google and Bing re-crawl sitemaps more
 * frequently when they're small and update often. By publishing a
 * 7-day-window sitemap separately from the full block sitemap, we tell
 * crawlers "come back to these URLs first / more often."
 *
 * Sibling to:
 *   /sitemap-index.xml   — Astro-generated, all pages
 *   /sitemap-blocks.xml  — every block ever, 150+ URLs
 *   /sitemap-recent.xml  — THIS, last 7 days, ~20-40 URLs, updates hourly
 *
 * `changefreq` is "hourly" for all recent blocks (the site ships 2-10
 * blocks per day via autonomous agents). Priority=1.0 since these are
 * the pages with the freshest content.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const GET: APIRoute = async () => {
  const all = await getCollection('blocks', ({ data }) => !data.draft);
  const now = Date.now();
  const recent = all
    .filter((b) => now - b.data.timestamp.getTime() <= SEVEN_DAYS_MS)
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const base = 'https://pointcast.xyz';
  const lastBuild = new Date().toISOString();

  const urls = recent.map((b) => `  <url>
    <loc>${base}/b/${b.data.id}</loc>
    <lastmod>${b.data.timestamp.toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`).join('\n');

  // Always include the home, the 3 pillars, and the 9 channel pages in
  // this recent sitemap — those surfaces change every time a block
  // lands, so crawlers should treat them as near-daily-refresh targets.
  const freshAlways = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/el-segundo`, priority: '0.95' },
    { loc: `${base}/agent-native`, priority: '0.95' },
    { loc: `${base}/nouns`, priority: '0.95' },
    { loc: `${base}/archive`, priority: '0.9' },
    { loc: `${base}/manifesto`, priority: '0.85' },
    { loc: `${base}/glossary`, priority: '0.85' },
    { loc: `${base}/blocks`, priority: '0.85' },
    { loc: `${base}/for-agents`, priority: '0.85' },
    { loc: `${base}/press`, priority: '0.85' },
  ].map((e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${lastBuild}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${freshAlways}
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Short cache — we want crawlers to re-pull this often.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Sitemap-Window': '7d',
      'X-Block-Count': String(recent.length),
    },
  });
};
