/**
 * /mood/{slug}.json — machine-readable filter view. Agent mirror of
 * the /mood/{slug} page. Lists blocks + gallery entries carrying the
 * given mood, newest → oldest, with enough metadata that an agent can
 * pivot into /b/{id}.json or the gallery item without another fetch.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveMoodTemplate } from '../../lib/moods-soundtracks';

export const getStaticPaths: GetStaticPaths = async () => {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  let gallery: CollectionEntry<'gallery'>[] = [];
  try {
    gallery = await getCollection('gallery', ({ data }) => !data.draft);
  } catch {
    gallery = [];
  }

  const slugs = new Set<string>();
  for (const b of blocks) if (b.data.mood) slugs.add(b.data.mood);
  for (const g of gallery) if (g.data.mood) slugs.add(g.data.mood);

  return Array.from(slugs).map((slug) => {
    const matchingBlocks = blocks
      .filter((b) => b.data.mood === slug)
      .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
    const matchingGallery = gallery
      .filter((g) => g.data.mood === slug)
      .sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
    return {
      params: { slug },
      props: {
        slug,
        blocks: matchingBlocks,
        gallery: matchingGallery,
      },
    };
  });
};

type Props = {
  slug: string;
  blocks: CollectionEntry<'blocks'>[];
  gallery: CollectionEntry<'gallery'>[];
};

export const GET: APIRoute<Props> = async ({ props }) => {
  const { slug, blocks, gallery } = props;
  const template = resolveMoodTemplate(slug);

  const payload = {
    $schema: 'https://pointcast.xyz/mood/{slug}.json',
    mood: slug,
    prettyMood: template.label,
    template,
    home: `https://pointcast.xyz/mood/${slug}`,
    generatedAt: new Date().toISOString(),
    counts: {
      blocks: blocks.length,
      gallery: gallery.length,
      total: blocks.length + gallery.length,
    },
    blocks: blocks.map((b) => ({
      id: b.data.id,
      channel: b.data.channel,
      type: b.data.type,
      title: b.data.title,
      dek: b.data.dek ?? null,
      timestamp: b.data.timestamp.toISOString(),
      url: `https://pointcast.xyz/b/${b.data.id}`,
      jsonUrl: `https://pointcast.xyz/b/${b.data.id}.json`,
      author: b.data.author,
    })),
    gallery: gallery.map((g) => ({
      slug: g.data.slug,
      title: g.data.title,
      imageUrl: g.data.imageUrl,
      tool: g.data.tool,
      createdAt: g.data.createdAt.toISOString(),
      url: `https://pointcast.xyz/gallery#${g.data.slug}`,
    })),
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
