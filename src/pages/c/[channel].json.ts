/**
 * /c/{channel}.json — JSON feed (jsonfeed.org-compatible v1.1) per channel.
 */
import { getCollection } from 'astro:content';
import { CHANNELS, CHANNEL_LIST } from '../../lib/channels';
import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  return CHANNEL_LIST.map((ch) => ({
    params: { channel: ch.slug },
    props: { channelCode: ch.code },
  }));
}

interface Props { channelCode: keyof typeof CHANNELS; }

export const GET: APIRoute<Props> = async ({ props }) => {
  const ch = CHANNELS[props.channelCode];
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft && data.channel === props.channelCode))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: `PointCast · ${ch.name}`,
    home_page_url: `https://pointcast.xyz/c/${ch.slug}`,
    feed_url: `https://pointcast.xyz/c/${ch.slug}.json`,
    description: ch.purpose,
    language: 'en-US',
    authors: [{ name: 'Mike Hoydich × Claude', url: 'https://pointcast.xyz/about' }],
    items: blocks.map((b) => ({
      id: `https://pointcast.xyz/b/${b.data.id}`,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      title: b.data.title,
      summary: b.data.dek ?? b.data.body?.slice(0, 200),
      content_text: b.data.body ?? b.data.dek ?? b.data.title,
      date_published: b.data.timestamp.toISOString(),
      _pointcast: {
        blockId: b.data.id,
        channel: ch.code,
        type: b.data.type,
        edition: b.data.edition,
      },
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};
