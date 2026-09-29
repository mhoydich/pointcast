// The Early Shift: five morning feeds, filed once, never twice.
// Build spec: docs/plans/2026-09-28-early-shift-desk-spec.md §4 (Worker).
//
// Design (spec's exact contract):
//   - Sweep expired calls first (air_calls is a shared table; the shift is
//     the one guaranteed daily touch on it, so it's a good place to keep it
//     honest even though asking/answering is M's).
//   - Run the five feeds under Promise.allSettled, each aborting at
//     FEED_TIMEOUT_MS (F's constant) — one slow upstream never holds up the
//     others.
//   - File each feed in its own D1 batch: an air_reports insert that only
//     fires when today's air_shift_feeds row for that feed isn't already
//     'filed' (the INSERT…SELECT…WHERE NOT EXISTS), backstopped by
//     air_reports' own (spot, kind, pid_hash, slot) unique index, plus an
//     air_shift_feeds upsert that only overwrites a 'gap' row. Together: a
//     later run upgrades a gap, and a filed feed never files again.
//
// Agents never earn air_points or air_stamps rows here — agentRowOf() (F's
// module) builds only an air_reports row: On time and the badges are read
// back at view time (functions/_lib/air-desk.mjs), never written here.
import config from '../../../src/data/air-spots.json';
import {
  AGENT_ROW_COLUMNS,
  DESK_SPOT,
  FEED_IDS,
  FEED_TIMEOUT_MS,
  agentRowOf,
  feedOf,
  feedSourceUrl,
  onTimeCut,
} from '../../../functions/_lib/air-desk.mjs';
import { laDate } from '../../../functions/_lib/air-reading.mjs';
import { laDayStart, laWallToMs } from '../../../functions/_lib/air-assign.mjs';
import { awcUrl, ceilingOf } from '../../../src/lib/marine-oracle';
import { sunTimes } from '../../../src/lib/sky';
import { parseAirNow, parseAwcNewest, parseNdbc, parseTides, sunDetail } from './feeds.mjs';

const AIRNOW_LAT = 33.9192;
const AIRNOW_LON = -118.4165;
const AIRNOW_DISTANCE_MI = 25;

export interface ShiftEnv {
  AUTH_DB: D1Database;
  AIRNOW_API_KEY?: string;
  /** "true": read and parse every feed, write nothing (no sweep, no row, no air_shift_feeds). */
  EARLY_SHIFT_DRY_RUN?: string;
}

/** The only capability shift.ts needs beyond D1: fetch, so a test can hand it a fake. */
export interface ShiftDeps {
  fetch: typeof fetch;
}

export type GapReason = 'blocked' | 'upstream' | 'stale' | 'shape';

/**
 * One feed's state for the day after this run, read back from
 * air_shift_feeds (never what the run merely attempted): a re-run over a
 * filed feed reports the morning's own row, its report and time.
 * `fresh` is true when this run wrote that row (a first file, a gap, or a gap
 * upgraded); false when an earlier run's row stood.
 */
export type ShiftFeedOutcome = {
  feed: string;
  agent: string;
  outcome: 'filed' | 'gap';
  reason: GapReason | null;
  reportId: string | null;
  at: number;
  fresh: boolean;
  /**
   * A report this run filed over the morning's `blocked` gap after the on-time
   * cut (the key arrived later in the day): it shows on the board, but the
   * morning's row stays `blocked`, so a house gap never turns into the
   * keeper's late morning.
   */
  lateReportId?: string;
  /** True when this feed's D1 write or read-back threw: nothing about it was recorded by this run (logged with the feed id). */
  error?: true;
};

export type ShiftResult = {
  ok: true;
  day: string;
  feeds: ShiftFeedOutcome[];
  airnowKey: boolean;
  dryRun: boolean;
};

type FeedRead = { value: string; detail: Record<string, unknown>; observedAt: number } | { gap: GapReason };

/** A fetch with FEED_TIMEOUT_MS's own abort — one slow upstream never blocks the rest. */
async function fetchText(deps: ShiftDeps, url: string | null): Promise<{ ok: true; text: string } | { ok: false }> {
  if (!url) return { ok: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await deps.fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false };
    return { ok: true, text: await res.text() };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/** One feed's read: the fetch (or none, for sun/air-without-a-key) plus its parser. Untyped .mjs parsers, so this is deliberately loose — `'gap' in read` (below) is the real, runtime contract. */
async function readFeed(feedId: string, env: ShiftEnv, deps: ShiftDeps, nowMs: number): Promise<FeedRead> {
  switch (feedId) {
    case 'sky': {
      const got = await fetchText(deps, awcUrl(3));
      if (!got.ok) return { gap: 'upstream' };
      return parseAwcNewest(got.text, nowMs, ceilingOf) as FeedRead;
    }
    case 'tides': {
      const url = feedSourceUrl('tides', nowMs);
      const got = await fetchText(deps, url);
      if (!got.ok) return { gap: 'upstream' };
      return parseTides(got.text, nowMs) as FeedRead;
    }
    case 'swell': {
      const url = feedSourceUrl('swell', nowMs);
      const got = await fetchText(deps, url);
      if (!got.ok) return { gap: 'upstream' };
      return parseNdbc(got.text, nowMs) as FeedRead;
    }
    case 'sun': {
      return sunDetail(nowMs, sunTimes) as FeedRead;
    }
    case 'air': {
      // With no key, Air records `blocked` and never fetches — the AirNow
      // request URL carries the key; the stored source_url never does
      // (feedSourceUrl('air', …) is the fixed public page, not this URL).
      if (!env.AIRNOW_API_KEY) return { gap: 'blocked' };
      const url = `https://airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${AIRNOW_LAT}&longitude=${AIRNOW_LON}&distance=${AIRNOW_DISTANCE_MI}&API_KEY=${env.AIRNOW_API_KEY}`;
      const got = await fetchText(deps, url);
      if (!got.ok) return { gap: 'upstream' };
      return parseAirNow(got.text, nowMs, laWallToMs) as FeedRead;
    }
    default:
      return { gap: 'shape' };
  }
}

/**
 * air_shift_feeds' 'filed' upsert: only when the report row it names exists
 * (so a report skipped by air_reports' own slot index never leaves a filed row
 * pointing at nothing), and only over a 'gap' row, so a filed feed never files
 * twice. A `blocked` gap (a house gap: the key was unset) is only upgraded
 * before the day's on-time cut (`cut`): after it, a late row would turn a
 * morning that never counted against the keeper into a late one. The report
 * itself still files and shows on the board.
 */
function shiftFiledUpsert(db: D1Database, args: { day: string; feed: string; agent: string; reportId: string; at: number; cut: number }) {
  return db.prepare(`
    INSERT INTO air_shift_feeds (day, feed, agent, outcome, reason, report_id, at)
    SELECT ?, ?, ?, 'filed', NULL, ?, ?
    WHERE EXISTS (SELECT 1 FROM air_reports WHERE id = ?)
    ON CONFLICT (day, feed) DO UPDATE SET
      agent = excluded.agent, outcome = excluded.outcome, reason = excluded.reason,
      report_id = excluded.report_id, at = excluded.at
    WHERE air_shift_feeds.outcome = 'gap' AND (air_shift_feeds.reason != 'blocked' OR excluded.at <= ?)
  `).bind(args.day, args.feed, args.agent, args.reportId, args.at, args.reportId, args.cut);
}

/** The day's stored row for one feed, as the run reports it. */
async function storedFeed(db: D1Database, day: string, feed: string, agent: string, nowMs: number): Promise<ShiftFeedOutcome> {
  const row = await db.prepare('SELECT agent, outcome, reason, report_id, at FROM air_shift_feeds WHERE day = ? AND feed = ?')
    .bind(day, feed).first<{ agent: string; outcome: 'filed' | 'gap'; reason: GapReason | null; report_id: string | null; at: number }>();
  if (!row) return { feed, agent, outcome: 'gap', reason: 'shape', reportId: null, at: nowMs, fresh: false };
  return { feed, agent: row.agent, outcome: row.outcome, reason: row.reason, reportId: row.report_id, at: row.at, fresh: row.at === nowMs };
}

/** air_shift_feeds' own upsert: only overwrites a 'gap' row, so a filed feed never files twice. */
function shiftFeedUpsert(db: D1Database, args: { day: string; feed: string; agent: string; outcome: 'filed' | 'gap'; reason: GapReason | null; reportId: string | null; at: number }) {
  return db.prepare(`
    INSERT INTO air_shift_feeds (day, feed, agent, outcome, reason, report_id, at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (day, feed) DO UPDATE SET
      agent = excluded.agent, outcome = excluded.outcome, reason = excluded.reason,
      report_id = excluded.report_id, at = excluded.at
    WHERE air_shift_feeds.outcome = 'gap'
  `).bind(args.day, args.feed, args.agent, args.outcome, args.reason, args.reportId, args.at);
}

/** One structured log line, as index.ts writes them (observability is on for this Worker). */
function logError(message: string, feed: string | null, error: unknown): void {
  console.error(JSON.stringify({ message, feed, error: error instanceof Error ? error.message : String(error) }));
}

export async function runEarlyShift(env: ShiftEnv, deps: ShiftDeps, nowMs: number): Promise<ShiftResult> {
  const day = laDate(nowMs);
  const dryRun = String(env.EARLY_SHIFT_DRY_RUN) === 'true';
  const cut = onTimeCut(config, day);

  // Sweep expired calls first — a shared table (air_calls), but the shift is
  // a guaranteed daily touch on it regardless of whether anyone asked today.
  // Its own try/catch: a failed sweep never costs the morning its feeds.
  if (!dryRun) {
    try {
      await env.AUTH_DB.prepare(
        `UPDATE air_calls SET status = 'expired' WHERE status = 'open' AND expires_at <= ?`,
      ).bind(nowMs).run();
    } catch (error) {
      logError('early shift sweep failed', null, error);
    }
  }

  const settled = await Promise.allSettled(FEED_IDS.map((feedId: string) => readFeed(feedId, env, deps, nowMs)));

  const feeds: ShiftFeedOutcome[] = [];
  for (let i = 0; i < FEED_IDS.length; i++) {
    const feedId = FEED_IDS[i];
    const agent = feedOf(config, feedId)?.keeper ?? '';
    const settledRead = settled[i];
    const read: FeedRead = settledRead.status === 'fulfilled' ? settledRead.value : { gap: 'upstream' };
    // Each feed's write and read-back in its own try/catch: one D1 failure is
    // logged and flagged on that feed, and the feeds after it still file.
    try {
      feeds.push(await fileFeed(env, { feedId, agent, read, day, cut, nowMs, dryRun }));
    } catch (error) {
      logError('early shift feed failed', feedId, error);
      feeds.push({ feed: feedId, agent, outcome: 'gap', reason: null, reportId: null, at: nowMs, fresh: false, error: true });
    }
  }

  return { ok: true, day, feeds, airnowKey: Boolean(env.AIRNOW_API_KEY), dryRun };
}

/** One feed's write (a gap row, or a report plus its filed row) and the stored row read back. */
async function fileFeed(
  env: ShiftEnv,
  o: { feedId: string; agent: string; read: FeedRead; day: string; cut: number; nowMs: number; dryRun: boolean },
): Promise<ShiftFeedOutcome> {
  const { feedId, agent, read, day, cut, nowMs, dryRun } = o;
  if ('gap' in read) {
    if (dryRun) return { feed: feedId, agent, outcome: 'gap', reason: read.gap, reportId: null, at: nowMs, fresh: false };
    await shiftFeedUpsert(env.AUTH_DB, { day, feed: feedId, agent, outcome: 'gap', reason: read.gap, reportId: null, at: nowMs }).run();
    return storedFeed(env.AUTH_DB, day, feedId, agent, nowMs);
  }

  const built = await agentRowOf(config, {
    agent, feed: feedId, detail: read.detail, observedAt: read.observedAt, now: nowMs,
  }) as unknown as { row: Record<string, unknown> } | { reason: string };
  if ('reason' in built) {
    // Any refusal other than 'stale' is a shape problem (not-keeper, bad-kind,
    // bad-observed-at, unknown-agent/feed, a bad source URL): GAP_REASONS
    // has no room for those, so it reads as the same house catch-all pages
    // already show for "the source sent something unreadable".
    const reason: GapReason = built.reason === 'stale' ? 'stale' : 'shape';
    if (dryRun) return { feed: feedId, agent, outcome: 'gap', reason, reportId: null, at: nowMs, fresh: false };
    await shiftFeedUpsert(env.AUTH_DB, { day, feed: feedId, agent, outcome: 'gap', reason, reportId: null, at: nowMs }).run();
    return storedFeed(env.AUTH_DB, day, feedId, agent, nowMs);
  }

  const row = built.row;
  if (dryRun) return { feed: feedId, agent, outcome: 'filed', reason: null, reportId: null, at: nowMs, fresh: false };
  const columns = AGENT_ROW_COLUMNS as unknown as string[];
  const placeholders = columns.map(() => '?').join(', ');
  const [inserted] = await env.AUTH_DB.batch([
    // Files only while the day's feed row isn't 'filed', and at most once per
    // LA day per feed: a report already filed over a `blocked` gap after the
    // cut (whose feed row stays a gap) is never filed again by a later run.
    env.AUTH_DB.prepare(`
      INSERT INTO air_reports (${columns.join(', ')})
      SELECT ${placeholders}
      WHERE NOT EXISTS (SELECT 1 FROM air_shift_feeds WHERE day = ? AND feed = ? AND outcome = 'filed')
        AND NOT EXISTS (SELECT 1 FROM air_reports WHERE source = ? AND spot = ? AND kind = ? AND created_at >= ?)
      ON CONFLICT (spot, kind, pid_hash, slot) DO NOTHING
    `).bind(...columns.map((c) => row[c]), day, feedId, row.source, row.spot, row.kind, laDayStart(nowMs)),
    shiftFiledUpsert(env.AUTH_DB, { day, feed: feedId, agent, reportId: row.id as string, at: nowMs, cut }),
  ]);
  const stored = await storedFeed(env.AUTH_DB, day, feedId, agent, nowMs);
  if (Number(inserted?.meta?.changes ?? 0) > 0 && stored.outcome === 'gap' && stored.reason === 'blocked') {
    return { ...stored, lateReportId: row.id as string };
  }
  return stored;
}

export { DESK_SPOT };
