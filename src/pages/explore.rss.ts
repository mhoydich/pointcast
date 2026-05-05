/**
 * /explore.rss — "new rooms" feed.
 *
 * Subscribers get pinged when a new page (or a meaningfully updated
 * page) lands in the explorer. Cap at 30 entries, newest first by
 * last-commit timestamp.
 *
 * RSS 2.0 with the dublin-core date extension. Feed lives next to
 * /feed.xml (all-blocks RSS) and the per-channel `/c/{slug}.rss`
 * feeds. Unlike those, /explore.rss is a *page* feed — it tracks
 * site structure, not Block content.
 */
import type { APIRoute } from 'astro';
import { FEATURES } from '../lib/explore';

const SITE = 'https://pointcast.xyz';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = () => {
  const items = FEATURES
    .filter((f) => f.mtime > 0)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 30);

  const lastBuild = items[0]
    ? new Date(items[0].mtime * 1000).toUTCString()
    : new Date().toUTCString();

  const itemsXml = items
    .map((f) => {
      const url = `${SITE}${f.slug}`;
      const date = new Date(f.mtime * 1000).toUTCString();
      const dek = f.description ? `<description>${escape(f.description)}</description>` : '';
      return `    <item>
      <title>${escape(f.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${url}#${f.mtime}</guid>
      <category>${escape(f.category)}</category>
      <pubDate>${date}</pubDate>
      ${dek}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>PointCast · New rooms</title>
    <link>${SITE}/explore</link>
    <atom:link href="${SITE}/explore.rss" rel="self" type="application/rss+xml" />
    <description>New and updated pages on PointCast — every public surface, sorted by last commit. Subscribe to follow the small internet town as it grows.</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>PointCast</generator>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
