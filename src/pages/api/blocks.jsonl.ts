/**
 * /api/blocks.jsonl — NDJSON feed of every non-draft block, newest first.
 *
 * Newline-delimited JSON = ONE block per line. Built for LLM ingest: stream
 * it, line-buffer it, parse each line independently. No pagination cursor
 * needed since the whole archive is returned (~350 blocks, ~300KB).
 * Switch to cursor-based pagination once the archive crosses ~2000.
 *
 * For the full enriched single-block payload, each line includes a `url`
 * and `jsonUrl` pointer — follow to /b/{id}.json for the complete shape.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const lines = blocks.map((b) => JSON.stringify({
    id: b.data.id,
    url: `https://pointcast.xyz/b/${b.data.id}`,
    jsonUrl: `https://pointcast.xyz/b/${b.data.id}.json`,
    channel: b.data.channel,
    type: b.data.type,
    title: b.data.title,
    dek: b.data.dek ?? null,
    body: b.data.body ?? null,
    timestamp: b.data.timestamp.toISOString(),
    author: b.data.author,
    source: b.data.source ?? null,
    mood: b.data.mood ?? null,
    hasClock: !!b.data.clock,
    hasMedia: !!b.data.media,
    hasEdition: !!b.data.edition,
    companions: (b.data.companions ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      surface: c.surface ?? 'block',
    })),
    metaKeys: Object.keys(b.data.meta ?? {}),
  })).join('\n') + '\n';

  return new Response(lines, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Total-Count': String(blocks.length),
    },
  });
};
