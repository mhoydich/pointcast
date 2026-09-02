/**
 * /health.json — the town inspector's latest report, machine-readable.
 *
 * The report is produced by `npm run inspect:town -- --write`, which walks
 * every door /agents.json advertises against production and re-verifies
 * the manifest's claims (agent-mode header, CORS, well-known aliases,
 * citable block JSON, honest freshness, MCP liveness). The deployer runs
 * it after each deploy and commits the report in the next PR; it is
 * served here, so the site publishes its own drift instead of letting
 * visiting agents discover it first.
 *
 * Nothing here is generated at build or per request except the freshness
 * fields: `ageDays`, `staleAfterDays`, and `stale` are computed from the
 * build date so an old walk says so.
 */
import type { APIRoute } from 'astro';
import report from '../data/town-inspector-report.json';
import { inspectorFreshness } from '../lib/town-inspector';

export const GET: APIRoute = () => {
  const freshness = inspectorFreshness(report.inspectedAt, new Date());
  return new Response(
    JSON.stringify(
      {
        ...report,
        ...freshness,
        cadence:
          'Inspections run when a deployer walks production with `npm run inspect:town -- --write` and commits the report; they are not per-request and not automatic at deploy. inspectedAt is the truth timestamp; stale flips true once ageDays passes staleAfterDays.',
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
};
