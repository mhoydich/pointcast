/**
 * /feed.xml — RSS 2.0 of the latest 50 non-draft blocks, newest first.
 *
 * Primary consumers: traditional RSS readers + search crawlers that
 * still prefer the decade-plus-old format. PointCast also ships
 * /feed.json for modern clients.
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

function rfc822(d: Date): string {
  return d.toUTCString();
}

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .slice(0, 50);

  const channels = new Set<string>();
  blocks.forEach((b) => {
    const ch = CHANNELS[b.data.channel];
    if (ch?.name) channels.add(ch.name);
  });

  const items = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    const title = `${ch.name} · ${b.data.title}`;
    const body = b.data.dek ?? (b.data.body ? b.data.body.slice(0, 280) : b.data.title);
    return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>https://pointcast.xyz/b/${b.data.id}</link>
      <guid isPermaLink="true">https://pointcast.xyz/b/${b.data.id}</guid>
      <pubDate>${rfc822(b.data.timestamp)}</pubDate>
      <description>${xmlEscape(body)}</description>
      <category>${xmlEscape(ch.name)}</category>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${xmlEscape(b.data.author)}</dc:creator>
    </item>`;
  }).join('\n');

  const categoryTags = Array.from(channels)
    .map((name) => `    <category>${xmlEscape(name)}</category>`)
    .join('\n');

  const now = new Date();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PointCast</title>
    <link>https://pointcast.xyz</link>
    <description>Living broadcast from El Segundo. Blocks over channels, edition one.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(now)}</lastBuildDate>
    <atom:link href="https://pointcast.xyz/feed.xml" rel="self" type="application/rss+xml" />
${categoryTags}
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
