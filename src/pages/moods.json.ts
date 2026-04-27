/**
 * /moods.json — machine-readable tonal atlas. Mirror of /moods for agents.
 *
 * Lists every mood slug with at least one entry across blocks + gallery,
 * sorted by population (freshest-entry recency as tie-break). Each row
 * includes block/gallery split, freshest timestamp, and sample block ids
 * so an agent can follow up into /mood/{slug}.json or /b/{id}.json.
 *
 * Completes the structural mirror pattern — every human mood surface
 * gained on 2026-04-19 (sprint `mood-primitive`, `moods-atlas`) now has
 * an agent-facing counterpart.
 */
import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveMoodTemplate } from '../lib/moods-soundtracks';

export const GET: APIRoute = async () => {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);

  let gallery: CollectionEntry<'gallery'>[] = [];
  try {
    gallery = await getCollection('gallery', ({ data }) => !data.draft);
  } catch {
    gallery = [];
  }

  type Row = {
    slug: string;
    blocks: number;
    gallery: number;
    total: number;
    freshest: string | null;
    sampleBlockIds: string[];
    template: ReturnType<typeof resolveMoodTemplate>;
    url: string;
    jsonUrl: string;
  };

  const byMood = new Map<string, Row>();
  const freshestMs = new Map<string, number>();

  function ensure(slug: string): Row {
    let r = byMood.get(slug);
    if (!r) {
      r = {
        slug,
        blocks: 0,
        gallery: 0,
        total: 0,
        freshest: null,
        sampleBlockIds: [],
        template: resolveMoodTemplate(slug),
        url: `https://pointcast.xyz/mood/${slug}`,
        jsonUrl: `https://pointcast.xyz/mood/${slug}.json`,
      };
      byMood.set(slug, r);
      freshestMs.set(slug, 0);
    }
    return r;
  }

  for (const b of blocks) {
    if (!b.data.mood) continue;
    const r = ensure(b.data.mood);
    r.blocks += 1;
    r.total += 1;
    const ms = b.data.timestamp.getTime();
    if (ms > (freshestMs.get(r.slug) ?? 0)) freshestMs.set(r.slug, ms);
  }
  for (const g of gallery) {
    if (!g.data.mood) continue;
    const r = ensure(g.data.mood);
    r.gallery += 1;
    r.total += 1;
    const ms = g.data.createdAt.getTime();
    if (ms > (freshestMs.get(r.slug) ?? 0)) freshestMs.set(r.slug, ms);
  }

  for (const row of byMood.values()) {
    row.freshest = new Date(freshestMs.get(row.slug) ?? 0).toISOString();
    row.sampleBlockIds = blocks
      .filter((b) => b.data.mood === row.slug)
      .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
      .slice(0, 3)
      .map((b) => b.data.id);
  }

  const rows = Array.from(byMood.values()).sort(
    (a, b) =>
      b.total - a.total ||
      (freshestMs.get(b.slug) ?? 0) - (freshestMs.get(a.slug) ?? 0),
  );

  const payload = {
    $schema: 'https://pointcast.xyz/moods.json',
    name: 'PointCast · tonal atlas',
    description:
      'Every mood slug with at least one entry, across the blocks + gallery collections. Each slug is a /mood/{slug} route. Moods are editorial classifiers that cut across channels and types.',
    generatedAt: new Date().toISOString(),
    home: 'https://pointcast.xyz/moods',
    moodCount: rows.length,
    totalEntries: rows.reduce((sum, r) => sum + r.total, 0),
    moods: rows,
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
