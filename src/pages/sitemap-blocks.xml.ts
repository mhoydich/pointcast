/**
 * /sitemap-blocks.xml — crawl-parity sitemap for every block + channel page.
 * Separate from Astro's auto-generated sitemap-index so agents with only
 * a blocks-focused workflow can hit one URL.
 */
import { getCollection } from 'astro:content';
import { CHANNEL_LIST } from '../lib/channels';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  const base = 'https://pointcast.xyz';

  const urls: { loc: string; lastmod: string; priority: string }[] = [
    { loc: `${base}/`, lastmod: new Date().toISOString(), priority: '1.0' },
    { loc: `${base}/for-agents`, lastmod: new Date().toISOString(), priority: '0.8' },
  ];
  for (const ch of CHANNEL_LIST) {
    urls.push({ loc: `${base}/c/${ch.slug}`, lastmod: new Date().toISOString(), priority: '0.7' });
  }
  for (const b of blocks) {
    urls.push({
      loc: `${base}/b/${b.data.id}`,
      lastmod: b.data.timestamp.toISOString(),
      priority: b.data.type === 'READ' ? '0.8' : '0.6',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  });
};
