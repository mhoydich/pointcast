/**
 * /api/products.jsonl — NDJSON feed of every Good Feels product on PointCast.
 *
 * One product per line. Each line includes `pairsWithMood` (the cross-index
 * key), `vibeProfile` (soundtrack pointer), and `pairingsUrl` — the page on
 * PointCast that renders this product alongside matching blocks + vibe.
 *
 * Agents consuming this feed can answer "what Good Feels product fits the
 * mood I'm reading" without visiting the shop directly.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const products = (await getCollection('products', ({ data }) => !data.draft))
    .sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());

  const lines = products.map((p) => JSON.stringify({
    slug: p.data.slug,
    name: p.data.name,
    brand: p.data.brand,
    description: p.data.description,
    dek: p.data.dek ?? null,
    shopUrl: p.data.url,
    image: p.data.image ?? null,
    priceUsd: p.data.priceUsd ?? null,
    currency: p.data.currency,
    availability: p.data.availability,
    category: p.data.category ?? null,
    effects: p.data.effects ?? [],
    ingredients: p.data.ingredients ?? [],
    pairsWithMood: p.data.pairsWithMood ?? [],
    vibeProfile: p.data.vibeProfile ?? null,
    pairingsUrls: (p.data.pairsWithMood ?? []).map((m) => `https://pointcast.xyz/pairings/${m}`),
    addedAt: p.data.addedAt.toISOString(),
    author: p.data.author,
    source: p.data.source ?? null,
  })).join('\n') + '\n';

  return new Response(lines, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Total-Count': String(products.length),
    },
  });
};
