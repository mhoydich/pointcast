/**
 * PointCast Weekly Recap — Cloudflare Cron Handler
 *
 * Scheduled: Monday 17:00 UTC (= Monday 9:00 AM PT, accounting for PDT UTC-8).
 * Wrangler config entry:
 *   [[triggers.crons]]
 *   crons = ["0 17 * * 1"]
 *
 * This handler:
 *   1. Determines the ISO week ID for the just-completed week (Mon–Sun).
 *   2. Scans KV namespaces VISITS and FEEDBACK for the relevant time window.
 *   3. Aggregates the 5 headline stats + 1 hero moment.
 *   4. Writes the recap JSON to KV namespace RECAPS.
 *   5. Updates the "recap:latest" pointer.
 */

import type { WeeklyRecap, RecapNounBreakdown, RecapHeroMoment, RecapDrop } from '../../src/types/recap';

// ─── Environment Bindings ────────────────────────────────────────────────────

export interface Env {
  VISITS: KVNamespace;
  FEEDBACK: KVNamespace;
  RECAPS: KVNamespace;
  /** Optional: manually curated JSON array of RecapDrop for the current week */
  DROPS: KVNamespace;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the ISO week string "YYYY-wWW" for a given Date.
 * Uses the ISO 8601 definition: week starts Monday, week 1 contains Jan 4.
 */
function getISOWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // ISO week: Thursday of the week determines the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-w${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns the Monday 00:00:00 UTC and Sunday 23:59:59 UTC
 * for the week that ended most recently relative to `now`.
 * Since the cron fires Monday morning, "last week" = the 7 days ending Sunday.
 */
function getWeekBounds(now: Date): { start: Date; end: Date } {
  // Find the most recent Monday (today is Monday, so go back 7 days)
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
  const daysToLastMonday = dayOfWeek === 1 ? 7 : (dayOfWeek + 6) % 7 + 7;
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - daysToLastMonday);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/** Formats milliseconds into a human-readable duration string, e.g. "4m 32s" */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// ─── KV Aggregation Helpers ───────────────────────────────────────────────────

interface DrumEntry {
  handle: string;
  count: number;
  sessionId: string;
  combos: number;
  durationMs: number;
  timestamp: number;
}

interface VisitEntry {
  nounId: string;
  city?: string;
  country?: string;
  timestamp: number;
  isFirstTime?: boolean;
}

/**
 * Lists all KV keys matching a prefix within a time window.
 * PointCast KV keys embed timestamps as part of the key name for visits
 * (e.g., visit:1713000000000-abc123), so we can filter by prefix + ts range.
 */
async function listKeysInWindow(
  kv: KVNamespace,
  prefix: string,
  startTs: number,
  endTs: number
): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await kv.list({ prefix, cursor, limit: 1000 });
    for (const key of result.keys) {
      // Extract timestamp from key name: "visit:1713000000000-abc123"
      const parts = key.name.split(':');
      if (parts.length >= 2) {
        const tsPart = parts[1].split('-')[0];
        const ts = parseInt(tsPart, 10);
        if (!isNaN(ts) && ts >= startTs && ts <= endTs) {
          keys.push(key.name);
        }
      }
    }
    cursor = result.list_complete ? undefined : (result as any).cursor;
  } while (cursor);

  return keys;
}

/**
 * Aggregates drum data from KV for the given week window.
 * Reads drum:by:<handle> counters and drum:session:<sid> entries.
 */
async function aggregateDrums(
  kv: KVNamespace,
  startTs: number,
  endTs: number
): Promise<{
  totalDrums: number;
  topDrummerHandle: string;
  topDrummerCount: number;
  longestSessionMs: number;
  longestSessionHandle: string;
  mostCombos: number;
  mostCombosHandle: string;
}> {
  // Fetch the global drum total key for the week
  // Since KV stores cumulative totals, we read session-level data for the window
  const sessionKeys = await listKeysInWindow(kv, 'drum:session:', startTs, endTs);

  const drummerTotals: Record<string, number> = {};
  let totalDrums = 0;
  let longestSessionMs = 0;
  let longestSessionHandle = '';
  let mostCombos = 0;
  let mostCombosHandle = '';

  for (const key of sessionKeys) {
    const raw = await kv.get(key, 'json') as DrumEntry | null;
    if (!raw) continue;

    totalDrums += raw.count;
    drummerTotals[raw.handle] = (drummerTotals[raw.handle] || 0) + raw.count;

    if (raw.durationMs > longestSessionMs) {
      longestSessionMs = raw.durationMs;
      longestSessionHandle = raw.handle;
    }
    if (raw.combos > mostCombos) {
      mostCombos = raw.combos;
      mostCombosHandle = raw.handle;
    }
  }

  // Find top drummer
  let topDrummerHandle = 'anonymous';
  let topDrummerCount = 0;
  for (const [handle, count] of Object.entries(drummerTotals)) {
    if (count > topDrummerCount) {
      topDrummerCount = count;
      topDrummerHandle = handle;
    }
  }

  return {
    totalDrums,
    topDrummerHandle,
    topDrummerCount,
    longestSessionMs,
    longestSessionHandle,
    mostCombos,
    mostCombosHandle,
  };
}

/**
 * Aggregates visitor data from KV for the given week window.
 * Reads visit:<ts>-<rand> entries and visit:<ts>:noun = <id> entries.
 */
async function aggregateVisits(
  kv: KVNamespace,
  startTs: number,
  endTs: number
): Promise<{
  newVisitors: number;
  nounBreakdown: RecapNounBreakdown[];
  topNounId: string;
  topNounVisits: number;
  firstTimeCities: string[];
}> {
  const visitKeys = await listKeysInWindow(kv, 'visit:', startTs, endTs);
  // Filter out noun sub-keys (visit:<ts>:noun) — those have a colon after the ts
  const pureVisitKeys = visitKeys.filter(k => !k.includes(':noun'));

  const nounCounts: Record<string, number> = {};
  const citySet = new Set<string>();
  const newCities: string[] = [];
  let newVisitors = 0;

  for (const key of pureVisitKeys) {
    const raw = await kv.get(key, 'json') as VisitEntry | null;
    if (!raw) continue;
    newVisitors++;

    // Noun breakdown
    if (raw.nounId) {
      nounCounts[raw.nounId] = (nounCounts[raw.nounId] || 0) + 1;
    }

    // City tracking
    if (raw.city && raw.isFirstTime) {
      newCities.push(raw.city);
    }
    if (raw.city) citySet.add(raw.city);
  }

  // Build sorted noun breakdown
  const nounBreakdown: RecapNounBreakdown[] = Object.entries(nounCounts)
    .map(([nounId, visitCount]) => ({ nounId, visitCount }))
    .sort((a, b) => b.visitCount - a.visitCount);

  const topNoun = nounBreakdown[0] ?? { nounId: 'none', visitCount: 0 };

  return {
    newVisitors,
    nounBreakdown,
    topNounId: topNoun.nounId,
    topNounVisits: topNoun.visitCount,
    firstTimeCities: newCities,
  };
}

/**
 * Selects the single best hero moment from the available data.
 * Priority: first_time_city > most_combos > longest_session > quiet_week
 */
function selectHeroMoment(params: {
  firstTimeCities: string[];
  mostCombos: number;
  mostCombosHandle: string;
  longestSessionMs: number;
  longestSessionHandle: string;
  isQuietWeek: boolean;
}): RecapHeroMoment {
  const { firstTimeCities, mostCombos, mostCombosHandle, longestSessionMs, longestSessionHandle, isQuietWeek } = params;

  if (isQuietWeek) {
    return {
      type: 'quiet_week',
      headline: 'A quiet week at PointCast.',
      description: 'The drums were silent, but the stage is set. Something is building.',
      value: '—',
    };
  }

  if (firstTimeCities.length > 0) {
    const city = firstTimeCities[0];
    return {
      type: 'first_time_city',
      headline: `PointCast reached ${city} for the first time.`,
      description: `A visitor from ${city} joined the cast this week, marking a new city on the map.`,
      value: city,
    };
  }

  if (mostCombos >= 5) {
    return {
      type: 'most_combos',
      headline: `${mostCombosHandle} landed ${mostCombos} combos in a single session.`,
      description: `The highest combo streak of the week — a masterclass in rhythm and timing.`,
      value: `${mostCombos} combos`,
      actor: mostCombosHandle,
    };
  }

  if (longestSessionMs > 0) {
    return {
      type: 'longest_session',
      headline: `${longestSessionHandle} drummed for ${formatDuration(longestSessionMs)} straight.`,
      description: `The longest unbroken session of the week. Dedication in its purest form.`,
      value: formatDuration(longestSessionMs),
      actor: longestSessionHandle,
    };
  }

  // Fallback
  return {
    type: 'quiet_week',
    headline: 'A quiet week at PointCast.',
    description: 'The drums were silent, but the stage is set. Something is building.',
    value: '—',
  };
}

// ─── Main Aggregation Function ────────────────────────────────────────────────

export async function computeWeeklyRecap(env: Env, targetDate?: Date): Promise<WeeklyRecap> {
  const now = targetDate ?? new Date();
  const { start, end } = getWeekBounds(now);
  const weekId = getISOWeekId(start);

  const startTs = start.getTime();
  const endTs = end.getTime();

  // Run aggregations in parallel
  const [drumStats, visitStats] = await Promise.all([
    aggregateDrums(env.VISITS, startTs, endTs),
    aggregateVisits(env.VISITS, startTs, endTs),
  ]);

  const isQuietWeek = drumStats.totalDrums === 0 && visitStats.newVisitors === 0;

  const heroMoment = selectHeroMoment({
    firstTimeCities: visitStats.firstTimeCities,
    mostCombos: drumStats.mostCombos,
    mostCombosHandle: drumStats.mostCombosHandle,
    longestSessionMs: drumStats.longestSessionMs,
    longestSessionHandle: drumStats.longestSessionHandle,
    isQuietWeek,
  });

  // Fetch manually curated drops for this week (set via admin or CMS)
  const dropsRaw = await env.DROPS.get(`drops:${weekId}`, 'json') as RecapDrop[] | null;
  const newDrops: RecapDrop[] = dropsRaw ?? [];

  const recap: WeeklyRecap = {
    id: weekId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    publishedAt: now.toISOString(),
    totalDrums: drumStats.totalDrums,
    topDrummerHandle: drumStats.topDrummerHandle,
    topDrummerCount: drumStats.topDrummerCount,
    newVisitors: visitStats.newVisitors,
    topNounId: visitStats.topNounId,
    topNounVisits: visitStats.topNounVisits,
    nounBreakdown: visitStats.nounBreakdown.slice(0, 10), // top 10 nouns max
    heroMoment,
    newDrops,
    isQuietWeek,
  };

  return recap;
}

// ─── Cron Handler Export ──────────────────────────────────────────────────────

export default {
  /**
   * Scheduled handler — invoked by Cloudflare Cron Trigger.
   * Wrangler cron: "0 17 * * 1" (Monday 17:00 UTC = Monday 9:00 AM PT)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const recap = await computeWeeklyRecap(env);
          const recapKey = `recap:${recap.id}`;

          // Store the full recap JSON
          await env.RECAPS.put(recapKey, JSON.stringify(recap), {
            metadata: {
              publishedAt: recap.publishedAt,
              totalDrums: recap.totalDrums,
              newVisitors: recap.newVisitors,
            },
          });

          // Update the "latest" pointer
          await env.RECAPS.put('recap:latest', recap.id);

          // Append to the index list (for RSS and archive)
          const indexRaw = await env.RECAPS.get('recap:index', 'json') as string[] | null;
          const index = indexRaw ?? [];
          if (!index.includes(recap.id)) {
            index.unshift(recap.id); // newest first
            await env.RECAPS.put('recap:index', JSON.stringify(index));
          }

          console.log(`[weekly-recap] Published recap ${recap.id} — ${recap.totalDrums} drums, ${recap.newVisitors} visitors`);
        } catch (err) {
          console.error('[weekly-recap] Aggregation failed:', err);
          throw err;
        }
      })()
    );
  },
};
