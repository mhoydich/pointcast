import type { APIRoute } from 'astro';
import { SUPER_FOLLOW_SIGNALS, SUPER_FOLLOW_SOURCES } from '../data/super-follow';

const sourceById = new Map(SUPER_FOLLOW_SOURCES.map((source) => [source.id, source]));

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const prerender = true;

export const GET: APIRoute = () => {
  const items = SUPER_FOLLOW_SIGNALS.map((signal) => {
    const source = sourceById.get(signal.sourceId)!;
    return `<item>
      <guid isPermaLink="false">${escapeXml(`pointcast:super-follow:${signal.id}`)}</guid>
      <title>${escapeXml(signal.title)}</title>
      <link>${escapeXml(signal.url)}</link>
      <description>${escapeXml(`${signal.summary} — Source: ${source.name}. PointCast editorial summary; open the official source for the original.`)}</description>
      <pubDate>${new Date(signal.publishedAt).toUTCString()}</pubDate>
      <source url="${escapeXml(source.feedUrl || source.url)}">${escapeXml(source.name)}</source>
      ${signal.topics.map((topic) => `<category>${escapeXml(topic)}</category>`).join('')}
    </item>`;
  }).join('\n');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Super Follow: Sony / PointCast field prototype</title>
    <link>https://pointcast.xyz/super-follow</link>
    <description>A static, attributable sample broadcaster assembled from official Sony source lanes through a PointCast lens.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date('2026-07-26T00:00:00.000Z').toUTCString()}</lastBuildDate>
    <docs>https://pointcast.xyz/super-follow.json</docs>
    ${items}
  </channel>
</rss>`, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
