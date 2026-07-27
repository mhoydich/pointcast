import type { APIRoute } from 'astro';
import { SUPER_FOLLOW_SIGNALS, SUPER_FOLLOW_SOURCES } from '../data/super-follow';

const sourceById = new Map(SUPER_FOLLOW_SOURCES.map((source) => [source.id, source]));

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Super Follow: Sony / PointCast field prototype',
  home_page_url: 'https://pointcast.xyz/super-follow',
  feed_url: 'https://pointcast.xyz/super-follow.feed.json',
  description: 'A static, attributable sample broadcaster assembled from official Sony source lanes through a PointCast lens.',
  language: 'en-US',
  authors: [{ name: 'PointCast', url: 'https://pointcast.xyz/about' }],
  _pointcast: {
    schema: 'pointcast.super-follow-feed/v1',
    status: 'directional-static-prototype',
    relationship: 'observing',
    fullContract: 'https://pointcast.xyz/super-follow.json',
  },
  items: SUPER_FOLLOW_SIGNALS.map((signal) => {
    const source = sourceById.get(signal.sourceId)!;
    return {
      id: `https://pointcast.xyz/super-follow#${signal.id}`,
      url: signal.url,
      title: signal.title,
      content_text: signal.summary,
      date_published: signal.publishedAt,
      tags: signal.topics,
      authors: [{ name: source.name, url: source.url }],
      _pointcast: {
        source_id: source.id,
        source_noun: source.noun,
        signal_noun: signal.noun,
        source_trust: source.trust,
        source_receipt: signal.url,
        product_adjacent: signal.commerce,
        editorial_summary_by: 'PointCast',
      },
    };
  }),
}, null, 2), {
  headers: {
    'Content-Type': 'application/feed+json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
  },
});
