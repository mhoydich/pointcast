import type { APIRoute } from 'astro';
import { PRESS_RELEASES, pressReleaseUrl } from '../lib/press-wire';

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const items = PRESS_RELEASES.map((release) => `    <item>
      <guid isPermaLink="true">${xml(pressReleaseUrl(release))}</guid>
      <title>${xml(release.headline)}</title>
      <link>${xml(pressReleaseUrl(release))}</link>
      <description>${xml(release.summary)}</description>
      <category>${xml(release.kind)}</category>
      <pubDate>${new Date(release.publishedAt).toUTCString()}</pubDate>
    </item>`).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PointCast Press Wire</title>
    <link>https://pointcast.xyz/press</link>
    <description>Owned PointCast product filings with named issuers, primary sources, and visible disclosure.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120',
    },
  });
};
