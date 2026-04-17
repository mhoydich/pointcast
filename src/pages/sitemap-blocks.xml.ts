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

  // Per Manus QA (2026-04-17, finding 1.3): this sitemap is BLOCK-ONLY.
  // The home, /for-agents, and channel pages live in the main sitemap-index
  // (Astro auto-generates) — this one is strictly block URLs so agents
  // that want "every block ever" have a single clean list.
  const urls: { loc: string; lastmod: string; priority: string }[] = [];
  for (const b of blocks) {
    urls.push({
      loc: `${base}/b/${b.data.id}`,
      lastmod: b.data.timestamp.toISOString(),
      priority: b.data.type === 'READ' ? '0.8' : '0.6',
    });
  }
  // Keep CHANNEL_LIST import live — used elsewhere and needed for sort stability.
  void CHANNEL_LIST;

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
