/**
 * /rfc.json — agent-readable manifest of every PointCast RFC.
 *
 * Companion to /rfc (human index). Mirrors src/lib/rfcs.ts to JSON and
 * serves with CORS open so any agent or federated peer can enumerate
 * the specification archive.
 */
import type { APIRoute } from 'astro';
import { listRfcs } from '../lib/rfcs';

export const GET: APIRoute = () => {
  const rfcs = listRfcs();
  const body = {
    schema: 'pointcast-rfcs-v0',
    host: 'pointcast.xyz',
    summary: {
      total: rfcs.length,
      words_total: rfcs.reduce((a, r) => a + r.wordCount, 0),
    },
    rfcs: rfcs.map((r) => ({
      slug: r.slug,
      title: r.title,
      version: r.version,
      status: r.status,
      filed_at: r.filedAt,
      editors: r.editors,
      license: r.license,
      contact: r.contact,
      canonical_url: r.canonicalUrl || `https://pointcast.xyz/rfc/${r.slug}`,
      source_url: `https://github.com/mhoydich/pointcast/blob/main/docs/rfc/${r.slug}.md`,
      word_count: r.wordCount,
      abstract: r.abstract,
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
