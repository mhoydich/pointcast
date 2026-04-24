/**
 * /decks.json — agent-readable manifest of every PointCast deck.
 *
 * Companion to /decks (human index). Mirrors src/lib/decks.ts to JSON and
 * serves with CORS open so any agent or federated peer can enumerate the
 * versioned-narrative archive.
 */
import type { APIRoute } from 'astro';
import { listDecks } from '../lib/decks';

export const GET: APIRoute = () => {
  const decks = listDecks();
  const body = {
    schema: 'pointcast-decks-v0',
    host: 'pointcast.xyz',
    summary: {
      total: decks.length,
      slides_total: decks.reduce((a, d) => a + d.slides, 0),
      bytes_total: decks.reduce((a, d) => a + d.bytes, 0),
      latest: decks[0]?.publishedAt ?? null,
    },
    decks: decks.map((d) => ({
      slug: d.slug,
      roman: d.roman,
      title: d.title,
      dek: d.dek,
      published_at: d.publishedAt,
      slides: d.slides,
      bytes: d.bytes,
      deck_url: `https://pointcast.xyz/decks/${d.slug}.html`,
      poster_url: `https://pointcast.xyz/posters/${d.slug}.png`,
      cover_block_url: `https://pointcast.xyz/b/${d.coverBlock}`,
      cover_block_id: d.coverBlock,
      note: d.note ?? null,
    })),
    triggers_for_next_volume: {
      doc: 'https://pointcast.xyz/b/0361',
      list: [
        'DRUM originates on Tezos mainnet + first voucher redeem',
        'First external /compute.json peer registers',
        'First field-node client reaches TestFlight or beta distribution',
        'First human authors a guest block via /for-nodes',
      ],
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
