/**
 * /operating-mode.json — agent-readable mirror of src/data/operating-mode.json.
 *
 * Codex 2026-05-07 review (PR 3 — agent discovery surfaces): the
 * operating-mode data file already declares a `$schema` that points at
 * /operating-mode.schema.json, but neither the data nor the schema had a
 * public route. Agents that landed cold couldn't introspect "what's in
 * flight on PointCast" without scraping the homepage HTML.
 *
 * This route serves the JSON unmodified, with cache-control tuned for the
 * "agents update this when work moves" cadence (a few times a day).
 */
import type { APIRoute } from 'astro';
import opmodeData from '../data/operating-mode.json';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(opmodeData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
      'X-Pc-Schema': 'https://pointcast.xyz/operating-mode.schema.json',
    },
  });
};
