/**
 * /email-daily-preview.json - exact public Daily Wire payload.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import { buildDailyWirePreview } from '../lib/daily-email-scheduler';
import { readAllRecaps } from '../lib/sprint-recap';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .slice(0, 6)
    .map((block) => {
      const channel = CHANNELS[block.data.channel];
      return {
        id: block.data.id,
        title: block.data.title,
        dek: block.data.dek,
        url: `https://pointcast.xyz/b/${block.data.id}`,
        jsonUrl: `https://pointcast.xyz/b/${block.data.id}.json`,
        channel: `${channel.code} / ${channel.name}`,
        timestamp: block.data.timestamp.toISOString(),
      };
    });

  const sprints = readAllRecaps().slice(0, 6).map((sprint) => ({
    id: sprint.sprintId,
    title: sprint.title,
    status: sprint.status ?? null,
    firedAt: sprint.firedAt || null,
    anchor: `https://pointcast.xyz/sprints#${sprint.sprintId}`,
    shippedAs: sprint.shippedAs ?? null,
  }));

  return new Response(JSON.stringify(buildDailyWirePreview({ blocks, sprints }), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
