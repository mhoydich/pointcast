/**
 * /blocks.json — full archive, paginated.
 *
 * Shape: { total, blocks: [...] } with every block summarized (no body
 * to keep payloads small). Agents paginate via ?offset= and ?limit= —
 * static build returns the full list since we only have ~20 blocks;
 * switch to SSR pagination once the archive crosses ~500.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const payload = {
    $schema: 'https://pointcast.xyz/BLOCKS.md',
    total: blocks.length,
    updatedAt: new Date().toISOString(),
    blocks: blocks.map((b) => {
      const ch = CHANNELS[b.data.channel];
      return {
        id: b.data.id,
        url: `https://pointcast.xyz/b/${b.data.id}`,
        jsonUrl: `https://pointcast.xyz/b/${b.data.id}.json`,
        channel: { code: ch.code, slug: ch.slug, name: ch.name, color600: ch.color600 },
        type: b.data.type,
        title: b.data.title,
        dek: b.data.dek,
        timestamp: b.data.timestamp.toISOString(),
        edition: b.data.edition,
        external: b.data.external,
        // Editorial + graph fields — surfaced so agents can filter/classify
        // without a second fetch. Added 2026-04-19 sprint `blocks-json-enrich`.
        author: b.data.author,
        source: b.data.source ?? null,
        mood: b.data.mood ?? null,
        moodUrl: b.data.mood ? `https://pointcast.xyz/mood/${b.data.mood}` : null,
        companions: b.data.companions ?? [],
      };
    }),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
