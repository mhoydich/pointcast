/**
 * /b/{id}.json — machine-readable block, 1:1 with the frontmatter schema.
 *
 * This is the public JSON shape agents read. Keep it stable — any new
 * optional fields should default to `undefined` rather than changing
 * existing field names or types. Follow semver-ish behavior in spirit.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../../lib/channels';
import { BLOCK_TYPES } from '../../lib/block-types';
import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  return blocks.map((block) => ({
    params: { id: block.data.id },
    props: { block },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const block = (props as any).block;
  const ch = CHANNELS[block.data.channel as keyof typeof CHANNELS];
  const t = BLOCK_TYPES[block.data.type as keyof typeof BLOCK_TYPES];

  const payload = {
    id: block.data.id,
    url: `https://pointcast.xyz/b/${block.data.id}`,
    channel: {
      code: ch.code,
      slug: ch.slug,
      name: ch.name,
      purpose: ch.purpose,
    },
    type: {
      code: t.code,
      label: t.label,
      description: t.description,
    },
    title: block.data.title,
    dek: block.data.dek,
    body: block.data.body,
    timestamp: block.data.timestamp.toISOString(),
    size: block.data.size,
    noun: block.data.noun,
    readingTime: block.data.readingTime,
    edition: block.data.edition,
    media: block.data.media,
    external: block.data.external,
    visitor: block.data.visitor,
    meta: block.data.meta,
    schema: 'https://pointcast.xyz/BLOCKS.md',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
