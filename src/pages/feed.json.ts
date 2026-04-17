/**
 * /feed.json — unified JSON Feed v1.1 covering every Block.
 *
 * Sibling of /feed.xml in the jsonfeed.org v1.1 format. Most modern RSS
 * clients and agents speak this natively.
 *
 * Differs from /blocks.json: this is the canonical "feed" shape
 * (standards-compliant, items[], image, url), whereas /blocks.json
 * is PointCast's native shape (blocks[], richer metadata).
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const items = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    return {
      id: `https://pointcast.xyz/b/${b.data.id}`,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      external_url: b.data.external?.url ?? undefined,
      title: b.data.title,
      content_text: b.data.dek ?? b.data.body?.slice(0, 320) ?? b.data.title,
      summary: b.data.dek ?? undefined,
      date_published: b.data.timestamp.toISOString(),
      tags: [`CH.${ch.code}`, ch.name, b.data.type],
      image: `https://pointcast.xyz/images/og/b/${b.data.id}.png`,
      _pointcast: {
        id: b.data.id,
        channel: { code: ch.code, slug: ch.slug, name: ch.name, color: ch.color600 },
        type: b.data.type,
        edition: b.data.edition ?? null,
      },
    };
  });

  const payload = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'PointCast',
    description: 'A living broadcast from El Segundo. Every piece of content is a Block.',
    home_page_url: 'https://pointcast.xyz/',
    feed_url: 'https://pointcast.xyz/feed.json',
    icon: 'https://pointcast.xyz/images/og/og-home-v2.png',
    favicon: 'https://pointcast.xyz/favicon.svg',
    authors: [{ name: 'Mike Hoydich', url: 'https://pointcast.xyz/about' }],
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
