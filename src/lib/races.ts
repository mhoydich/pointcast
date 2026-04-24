/**
 * Race System — Phase 2 registry + types (RFC 0002).
 *
 * Phase 1 (PR #18, not yet merged): RFC + /race hub + /race/front-door scaffold
 * Phase 2 (this sprint): types + registry + submit/leaderboard endpoints +
 *   PC_RACE_KV binding scaffold. No live race runs yet — every race in
 *   RACE_REGISTRY ships with status: 'scheduled' until Mike opens one.
 *
 * The RFC's per-race KV keys:
 *   race:{slug}                      — full race state + entries
 *   race:{slug}:entrant:{id}         — per-entrant lookup (dedup + upsert)
 *
 * Shared by:
 *   - functions/api/race/[slug]/submit.ts
 *   - functions/api/race/[slug]/leaderboard.ts
 *   - src/pages/race.astro (when PR #18 merges)
 *   - src/pages/race/[slug].astro (Phase 3)
 */

export type ChannelCode = 'FD' | 'CRT' | 'SPN' | 'GF' | 'GDN' | 'ESC' | 'FCT' | 'VST' | 'BTL';
export type RaceMode = 'fastest' | 'most' | 'best' | 'streak' | 'prediction';
export type RaceStatus = 'scheduled' | 'open' | 'closed' | 'resolved';
export type EntrantKind = 'noun' | 'wallet' | 'anon';

export interface RaceSpec {
  slug: string;            // URL identity, e.g. "front-door-2026-04-24"
  title: string;
  channel: ChannelCode;
  mode: RaceMode;
  opensAt: string;         // ISO8601
  closesAt: string;        // ISO8601
  resolvesAt: string;      // ISO8601
  prize?: string;          // short human-readable note
  description?: string;    // 1–2 sentence explainer
  maxEntries?: number;     // optional cap per entrant (default 1)
}

export interface RaceEntry {
  entrantId: string;       // nounId / wallet address / anon-session fingerprint
  entrantKind: EntrantKind;
  score: number;
  submissionRef?: string;  // optional block id or external URL
  submittedAt: string;     // server ISO timestamp on accept
  clientTs?: string;       // client-reported ts (advisory — never trusted for ordering)
}

export interface LeaderboardEntry {
  rank: number;
  entrantId: string;
  entrantKind: EntrantKind;
  score: number;
  submittedAt: string;
  submissionRef?: string;
}

/**
 * Scoring direction for a mode. `fastest` and `best` want lower scores;
 * everything else wants higher. `best` is manual-judged, but default
 * ordering can still be "lower submittedAt wins" until Mike sets it.
 */
export function scoreDirection(mode: RaceMode): 'asc' | 'desc' {
  if (mode === 'fastest') return 'asc';
  return 'desc';
}

/**
 * Current RaceStatus derived from the spec + current time. We store the
 * authoritative status in KV on transitions (via the resolve cron, Phase
 * 5) but the endpoints fall back to this computed value when KV state is
 * missing or stale.
 */
export function deriveStatus(spec: RaceSpec, now: Date = new Date()): RaceStatus {
  const t = now.getTime();
  const opens = Date.parse(spec.opensAt);
  const closes = Date.parse(spec.closesAt);
  const resolves = Date.parse(spec.resolvesAt);
  if (Number.isFinite(opens) && t < opens) return 'scheduled';
  if (Number.isFinite(closes) && t < closes) return 'open';
  if (Number.isFinite(resolves) && t < resolves) return 'closed';
  return 'resolved';
}

/**
 * Normalize a race slug from URL path. Allows lowercase a–z, digits,
 * and dashes. Everything else is stripped. Max 64 chars. This keeps
 * KV keys bounded and predictable.
 */
export function normalizeSlug(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

/**
 * The in-repo race registry. Mike adds entries here (or a race-loader
 * reads them from KV at runtime, Phase 3+). For now this is the
 * single source of truth that the endpoints consult to find a race's
 * schedule + mode + scoring direction before touching KV.
 *
 * Sprint 25 (Mike 2026-04-24 Fri ~11:00 PT: "ok yah, run today") —
 * flipped Front Door from its 2099 placeholder window to live today.
 * opensAt is midnight PT this morning; closesAt is 23:59 PT tonight;
 * resolvesAt is midnight PT tomorrow. Race is OPEN as of first page
 * load after this deploy.
 *
 * Tomorrow (and every day after), a daily cron needs to rotate the
 * slug + window — deferred to Sprint 26+; doc in docs/plans/front-
 * door-daily-rotation.md. For today, the race is literally this
 * calendar date and the scaffold proves end-to-end.
 */
export const RACE_REGISTRY: RaceSpec[] = [
  {
    slug: 'front-door',
    title: 'Front Door · 2026-04-24',
    channel: 'FD',
    mode: 'fastest',
    opensAt: '2026-04-24T00:00:00-07:00',
    closesAt: '2026-04-24T23:59:00-07:00',
    resolvesAt: '2026-04-25T00:00:00-07:00',
    description:
      'Fastest page-load-to-first-block-click on PointCast home. Lowest score wins the day. Launch race, running today (2026-04-24).',
    prize: 'Attribution — winner\u2019s Noun on the home strip for the next day.',
    maxEntries: 1,
  },
];

export function findRace(slug: string): RaceSpec | null {
  const norm = normalizeSlug(slug);
  if (!norm) return null;
  return RACE_REGISTRY.find((r) => r.slug === norm) ?? null;
}
