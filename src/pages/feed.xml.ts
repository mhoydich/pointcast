/**
 * /feed.xml — unified RSS 2.0 feed covering the latest 50 Blocks.
 *
 * The existing /rss.xml predates the Blocks architecture and only covers
 * long-form posts in src/content/posts/. /c/{slug}.rss covers single
 * channels. This feed is the "everything in reverse chronological order"
 * stream that most readers (RSS clients, agents consuming via Atom/RSS,
 * archival tools) will want.
 *
 * Sibling endpoints:
 *   - /feed.json   — JSON Feed v1.1 version of this same data
 *   - /rss.xml     — legacy posts-only RSS (preserved for existing subs)
 *   - /blocks.json — PointCast's native JSON shape
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .slice(0, 50);

  const channelsSeen = new Set<string>();

  const items = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    channelsSeen.add(ch.name);
    const description = b.data.dek ?? b.data.body?.slice(0, 280) ?? b.data.title;
    const prefixedTitle = `${ch.name} \u00b7 ${b.data.title}`;
    return `
    <item>
      <title>${xmlEscape(prefixedTitle)}</title>
      <link>https://pointcast.xyz/b/${b.data.id}</link>
      <guid isPermaLink="true">https://pointcast.xyz/b/${b.data.id}</guid>
      <pubDate>${b.data.timestamp.toUTCString()}</pubDate>
      <description>${xmlEscape(description)}</description>
    </item>`;
  }).join('\n');

  const categories = Array.from(channelsSeen)
    .map((name) => `    <category>${xmlEscape(name)}</category>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PointCast</title>
    <link>https://pointcast.xyz/</link>
    <description>A living broadcast from El Segundo. Every piece of content is a Block.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://pointcast.xyz/feed.xml" rel="self" type="application/rss+xml" />
${categories}
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
