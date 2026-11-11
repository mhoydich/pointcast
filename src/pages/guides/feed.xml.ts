/**
 * /guides/feed.xml — RSS 2.0 for PointCast Guides: the changelog plus one
 * item per guide, newest first. Accepted contributor material stays on the
 * guide pages (live from /api/guides/intake).
 */
import type { APIRoute } from 'astro';
import { GUIDES } from '../../data/guides';
import { CHANGELOG } from '../../data/guides/roadmap';

const SITE = 'https://pointcast.xyz';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc = (date: string) => new Date(`${date}T16:00:00Z`).toUTCString();
const abs = (href?: string) => (href ? (href.startsWith('http') ? href : `${SITE}${href}`) : `${SITE}/guides/status`);

export const GET: APIRoute = () => {
  const items = [
    ...CHANGELOG.map((c) => ({ title: c.title, link: abs(c.href), guid: `guides-changelog-${c.date}-${c.title}`, date: c.date, body: c.summary })),
    ...GUIDES.map((g) => ({ title: `Guide: ${g.title}`, link: `${SITE}/guides/${g.slug}`, guid: `${SITE}/guides/${g.slug}`, date: g.published ?? '2026-10-20', body: g.dek })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>PointCast Guides</title>
<link>${SITE}/guides</link>
<atom:link href="${SITE}/guides/feed.xml" rel="self" type="application/rss+xml" />
<description>About.com rebuilt for 2028: practical guides for local communities, pickleball teams and sports teams. Changelog and new guides.</description>
<language>en-us</language>
${items.map((i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(i.link)}</link>
<guid isPermaLink="false">${esc(i.guid)}</guid>
<pubDate>${rfc(i.date)}</pubDate>
<description>${esc(i.body)}</description>
</item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
