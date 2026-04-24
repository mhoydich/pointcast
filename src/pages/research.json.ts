/**
 * /research.json — agent-readable manifest of every PointCast research memo.
 *
 * Companion to /research. Mirrors src/lib/research.ts; CORS open.
 */
import type { APIRoute } from 'astro';
import { listMemos } from '../lib/research';

export const GET: APIRoute = () => {
  const memos = listMemos();
  const body = {
    schema: 'pointcast-research-v0',
    host: 'pointcast.xyz',
    summary: {
      total: memos.length,
      words_total: memos.reduce((a, m) => a + m.wordCount, 0),
      latest: memos[0]?.filedDate ?? null,
    },
    memos: memos.map((m) => ({
      slug: m.slug,
      title: m.title,
      filed_by: m.filedBy,
      filed_date: m.filedDate,
      trigger: m.trigger,
      purpose: m.purpose,
      summary: m.summary,
      word_count: m.wordCount,
      canonical_url: `https://pointcast.xyz/research/${m.slug}`,
      source_url: `https://github.com/mhoydich/pointcast/blob/main/docs/research/${m.slug}.md`,
    })),
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
