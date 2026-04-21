/**
 * /sparrow/api/latest.json — polling surface for the native Sparrow.app
 * menu-bar companion (and any other lightweight client that wants a
 * compact, dedup-friendly feed).
 *
 * Distinct from /blocks.json (PointCast canonical) and /sparrow/feed.xml
 * (Sparrow-branded Atom). This endpoint is shaped for polling clients:
 *   · small payload (top 24 blocks, summary-only, no bodies)
 *   · stable shape — `total`, `updated_at`, `blocks[]`
 *   · snake_case keys to match the Swift decoder idiom
 *   · blocks[] carries the minimal set the app needs to drive its menu
 *     and notifications: id, title, dek, channel, type, timestamp, url.
 *
 * Cache headers let CF Pages + the Sparrow SW share the same response
 * for ~2 min, which is plenty — the companion polls at 30 s floor by
 * default.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const top = blocks.slice(0, 24);

  const payload = {
    $schema: 'https://pointcast.xyz/sparrow/api/latest.json',
    total: blocks.length,
    updated_at: new Date().toISOString(),
    window: 24,
    // The canonical base for every `url` below. Kept explicit so a
    // native client pointed at a fork/dev host (via its own feedURL
    // setting) has a clear origin to resolve against.
    origin: 'https://pointcast.xyz',
    blocks: top.map((b) => ({
      id: b.data.id,
      title: b.data.title,
      dek: b.data.dek ?? '',
      channel: b.data.channel,
      type: b.data.type,
      mood: b.data.mood ?? null,
      timestamp: b.data.timestamp.toISOString(),
      author: b.data.author,
      url: `/b/${b.data.id}`,
      sparrow_url: `/sparrow/b/${b.data.id}`,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
