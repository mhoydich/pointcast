/**
 * /feed.json — unified JSON Feed v1.1 covering the latest 50 Blocks.
 *
 * Sibling of /feed.xml in the jsonfeed.org v1.1 format. Most modern RSS
 * clients and agents speak this natively.
 *
 * Differs from /blocks.json: this is the canonical "feed" shape
 * (standards-compliant, items[], authors[], tags[]), whereas /blocks.json
 * is PointCast's native shape (blocks[], richer metadata).
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .slice(0, 50);

  const items = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    const body = b.data.body ?? b.data.dek ?? b.data.title;
    const tags = [ch.code];
    if (b.data.mood) tags.push(b.data.mood);
    const prefixedTitle = `${ch.name} \u00b7 ${b.data.title}`;
    return {
      id: `https://pointcast.xyz/b/${b.data.id}`,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      title: prefixedTitle,
      content_html: `<p>${htmlEscape(body)}</p>`,
      content_text: body,
      summary: b.data.dek ?? undefined,
      date_published: b.data.timestamp.toISOString(),
      authors: [{ name: b.data.author }],
      tags,
    };
  });

  const payload = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'PointCast',
    home_page_url: 'https://pointcast.xyz/',
    feed_url: 'https://pointcast.xyz/feed.json',
    description: 'A living broadcast from El Segundo. Every piece of content is a Block.',
    language: 'en-US',
    items,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
