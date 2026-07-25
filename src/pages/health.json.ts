/**
 * /health.json — the town inspector's latest report, machine-readable.
 *
 * The report is produced by `npm run inspect:town -- --write`, which walks
 * every door /agents.json advertises against production and re-verifies
 * the manifest's claims (agent-mode header, CORS, well-known aliases,
 * citable block JSON, honest freshness, MCP liveness). It is committed to
 * src/data and served here, so the site publishes its own drift instead
 * of letting visiting agents discover it first.
 */
import type { APIRoute } from 'astro';
import report from '../data/town-inspector-report.json';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...report,
        servedAt: new Date().toISOString(),
        cadence:
          'Inspections run at deploy time and on demand, not per-request. inspectedAt is the truth timestamp.',
        human: 'https://pointcast.xyz/health',
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
