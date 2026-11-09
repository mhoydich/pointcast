/**
 * /broadcast.json — the on_air frame for clients without MCP (2026-11-03).
 *
 * Same shape as the on_air MCP tool (src/lib/broadcast-mcp.ts), built at
 * deploy time from the blocks collection. The live parts the MCP adds (the
 * station's play log, the current Morning Edition, card and chart of the
 * day) are listed under `live` with the URL to read each one, so a poller
 * gets one stable file plus pointers. Poll every five minutes at most.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { CHANNELS } from '../lib/channels';
import { BROADCAST_TOOL_NAMES, FEEDS, SITE, buildBroadcastFrame, type FeedItem } from '../lib/broadcast-mcp';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .slice(0, 25);

  const feedItems: FeedItem[] = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    return {
      id: `${SITE}/b/${b.data.id}`,
      url: `${SITE}/b/${b.data.id}`,
      title: b.data.title,
      summary: b.data.dek ?? undefined,
      content_text: b.data.dek ?? b.data.body?.slice(0, 320) ?? b.data.title,
      date_published: b.data.timestamp.toISOString(),
      image: `${SITE}/images/og/b/${b.data.id}.png`,
      _pointcast: { id: b.data.id, channel: { code: ch.code, name: ch.name }, type: b.data.type },
    };
  });

  const frame = buildBroadcastFrame({ feedItems, generatedAt: new Date().toISOString(), limit: 12 });
  const payload = {
    ...frame,
    live: {
      note: 'Built at deploy time. For the live station, edition and card of the day, read these or call on_air over MCP.',
      morning: `${SITE}/morning.json`,
      now: `${SITE}/now.json`,
      station: `${SITE}/station`,
      mcp: { endpoint: `${SITE}/api/mcp-v2`, tools: BROADCAST_TOOL_NAMES },
    },
    feeds: FEEDS,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
