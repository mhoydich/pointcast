/**
 * town-inspector — freshness for the committed inspector report.
 *
 * The report at src/data/town-inspector-report.json is written by
 * `npm run inspect:town -- --write` after a deploy and committed in the
 * next PR. It is not regenerated at build or per request, so /health and
 * /health.json must say how old it is instead of implying it is current.
 * Both surfaces call `inspectorFreshness` with the build date; a walk
 * older than INSPECTOR_STALE_AFTER_DAYS is labelled stale.
 */

export const INSPECTOR_STALE_AFTER_DAYS = 14;

export interface InspectorFreshness {
  /** ISO timestamp of the walk the report describes. */
  inspectedAt: string;
  /** ISO timestamp of the build that computed this — the "now" used. */
  builtAt: string;
  /** Whole days between the walk and the build, never negative. */
  ageDays: number;
  staleAfterDays: number;
  /** True once ageDays passes staleAfterDays. */
  stale: boolean;
}

const DAY_MS = 86_400_000;

export function inspectorFreshness(
  inspectedAt: string,
  builtAt: Date = new Date(),
  staleAfterDays: number = INSPECTOR_STALE_AFTER_DAYS,
): InspectorFreshness {
  const inspected = new Date(inspectedAt);
  const ageDays = Math.max(0, Math.floor((builtAt.getTime() - inspected.getTime()) / DAY_MS));
  return {
    inspectedAt: inspected.toISOString(),
    builtAt: builtAt.toISOString(),
    ageDays,
    staleAfterDays,
    stale: ageDays > staleAfterDays,
  };
}
