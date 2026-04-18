/**
 * /random.json — return a random Block's metadata as JSON.
 *
 * Fresh pick on every request (Cache-Control: no-store) so agents
 * hitting this can loop for variety. Useful for "give me a random
 * example" or quick retrieval samples.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  const pick = blocks[Math.floor(Math.random() * blocks.length)];
  const ch = CHANNELS[pick.data.channel];

  const payload = {
    $schema: 'https://pointcast.xyz/BLOCKS.md',
    pickedAt: new Date().toISOString(),
    id: pick.data.id,
    url: `https://pointcast.xyz/b/${pick.data.id}`,
    jsonUrl: `https://pointcast.xyz/b/${pick.data.id}.json`,
    channel: { code: ch.code, slug: ch.slug, name: ch.name },
    type: pick.data.type,
    title: pick.data.title,
    dek: pick.data.dek,
    timestamp: pick.data.timestamp.toISOString(),
    total: blocks.length,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
