/**
 * /feed.json — JSON Feed 1.1 (https://www.jsonfeed.org/version/1.1/)
 *
 * Latest 50 non-draft blocks, newest first. Primary consumers: readers
 * that support JSON Feed (NetNewsWire, Reeder, Feedbin) and LLM pipelines
 * that prefer JSON over XML.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    return {
      id: `https://pointcast.xyz/b/${b.data.id}`,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      title: `${ch.name} · ${b.data.title}`,
      content_html: `<p>${htmlEscape(body)}</p>`,
      content_text: body,
      summary: b.data.dek ?? undefined,
      date_published: b.data.timestamp.toISOString(),
      authors: [{ name: b.data.author }],
      tags,
    };
  });

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'PointCast',
    description: 'Living broadcast from El Segundo. Blocks over channels, edition one.',
    home_page_url: 'https://pointcast.xyz',
    feed_url: 'https://pointcast.xyz/feed.json',
    language: 'en',
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
