/**
 * /archive.json — the machine-readable version of /archive.
 *
 * Same data as /blocks.json but grouped by month and with stripped-down
 * block entries (no body, just the index shape). Agents that want every
 * block in one pull use /blocks.json; agents reasoning about publication
 * cadence over time pull this.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  // Group by UTC year-month for cadence reasoning
  const byMonth: Record<string, any[]> = {};
  for (const b of blocks) {
    const d = b.data.timestamp;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const ch = CHANNELS[b.data.channel];
    const entry = {
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      channel: { code: ch.code, slug: ch.slug },
      type: b.data.type,
      title: b.data.title,
      timestamp: d.toISOString(),
    };
    byMonth[key] = byMonth[key] ?? [];
    byMonth[key].push(entry);
  }

  const channelCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  for (const b of blocks) {
    channelCounts[b.data.channel] = (channelCounts[b.data.channel] ?? 0) + 1;
    typeCounts[b.data.type] = (typeCounts[b.data.type] ?? 0) + 1;
  }

  const payload = {
    $schema: 'https://pointcast.xyz/BLOCKS.md',
    total: blocks.length,
    updatedAt: new Date().toISOString(),
    since: blocks.length > 0 ? blocks[blocks.length - 1].data.timestamp.toISOString().slice(0, 10) : null,
    latest: blocks.length > 0 ? blocks[0].data.timestamp.toISOString().slice(0, 10) : null,
    counts: {
      total: blocks.length,
      channels: channelCounts,
      types: typeCounts,
    },
    byMonth: Object.fromEntries(
      Object.entries(byMonth).sort(([a], [b]) => (a < b ? 1 : -1)), // desc
    ),
    links: {
      human: 'https://pointcast.xyz/archive',
      flat: 'https://pointcast.xyz/blocks.json',
      sitemap: 'https://pointcast.xyz/sitemap-blocks.xml',
      rss: 'https://pointcast.xyz/rss.xml',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
