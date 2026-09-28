/**
 * The Pickleball Board's storage — one `db.batch` over every air court's
 * wait+parking evidence, today's last-on-site rows, 30 days of vibe rows and
 * the day's validator count, then `boardSummary()` (functions/_lib/
 * court-board.mjs) turns the rows into the BoardPayload. Pure rules live in
 * court-board.mjs and air-reading.mjs; this file is the SQL — every query a
 * literal string with its values bound, never interpolated, as air-store.ts's
 * source test enforces — and the one round trip. No hashes leave `boardData`: bylines are filled in by
 * `withBylines` (air-store.ts) before grouping, and boardSummary's own view
 * never reads a hash past that (see its "no hashes past this point" note).
 *
 * `readConditions` (functions/_lib/court-conditions.ts, group C) is taken as
 * a dependency, not imported here — and so are `courts` (src/lib/courts.ts's
 * COURTS) and `config` (src/lib/air.ts's AIR_CONFIG). Both of those import
 * their JSON without an import attribute (courts.ts's own note), which Astro
 * and Pages bundle but plain node cannot load; air-store.ts's fix is to take
 * AIR_CONFIG as an argument instead of reaching for a global, and this file
 * follows the same rule for both schedules. `functions/api/air/board.ts` and
 * `functions/courts.json.ts` import the real values and pass them in; a test
 * passes its own JSON import (`with { type: 'json' }`, as courts-schedule.
 * test.mjs does) or a fixture. A caller that passes no `readConditions` gets
 * a local EMPTY_CONDITIONS, so the payload is still a valid 200 with every
 * conditions field null — the same shape a live feed outage produces.
 */
import type { BoardPayload, Conditions, Court } from '../../src/lib/courts.ts';
import type { AirConfig, AirKind } from '../../src/lib/air.ts';
import { withBylines, type AirEnv, type ConfirmRow, type ReportRow } from './air-store.ts';
// @ts-ignore — plain modules shared with the tests
import { laDate, laParts } from './air-reading.mjs';
// @ts-ignore — plain module shared with the tests
import { boardSummary } from './court-board.mjs';
// @ts-ignore — plain module shared with the tests
import { spotOf } from './air-kinds.mjs';

/** court-conditions.ts's readConditions(now: Date) — see its own doc comment. */
export type ReadConditions = (now: Date) => Promise<Conditions>;
const EMPTY_CONDITIONS: Conditions = Object.freeze({
  observedAt: null, wind: null, tempF: null, heat: null, wet: null, marine: null, sunset: null, next3h: null,
}) as Conditions;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const EVIDENCE_SINCE_MIN = 90;
const EVIDENCE_LIVE_MIN = 60;
const VIBE_WINDOW_DAYS = 30;
// The report and confirm columns are spelled out in full in every query
// below rather than spliced in: each query is one whole literal string,
// nothing interpolated, matching air-store.ts's own statements.

/** Report + confirm evidence for one spot+kind: last `EVIDENCE_SINCE_MIN`, or a report kept live by an on-site "still" confirm in `EVIDENCE_LIVE_MIN`. Two literal statements, always bound and read together. */
function evidenceStmts(db: D1Database, spot: string, kind: string, since: number, liveSince: number): D1PreparedStatement[] {
  return [
    db.prepare(`SELECT id, spot, kind, value, extras_json, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports
      WHERE spot = ? AND kind = ? AND status = 'ok'
        AND (observed_at >= ? OR id IN (SELECT report_id FROM air_confirms WHERE at >= ? AND verdict = 'still' AND onsite = 1))
      ORDER BY observed_at DESC LIMIT 400`).bind(spot, kind, since, liveSince),
    db.prepare(`SELECT c.report_id, c.pid_hash, c.ip_hash, c.user_id, c.verdict, c.value, c.onsite, c.at FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE r.spot = ? AND r.kind = ? AND r.status = 'ok' AND (r.observed_at >= ? OR c.at >= ?) LIMIT 800`).bind(spot, kind, since, liveSince),
  ];
}

/**
 * Today's newest on-site, ok, human rows at a spot+kind — a decayed reading
 * still shows a last line. Filtered here, not only in lastOnSite(), so the
 * LIMIT counts rows that can be the last line: five remote taps from home
 * must not push the court's own last report out of the window.
 */
function lastStmt(db: D1Database, spot: string, kind: string, day: string): D1PreparedStatement {
  return db.prepare(`SELECT id, spot, kind, value, extras_json, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports
    WHERE spot = ? AND kind = ? AND day = ? AND onsite = 1 AND status = 'ok' AND source = 'page' ORDER BY observed_at DESC LIMIT 5`).bind(spot, kind, day);
}

/**
 * 30 days of on-site, ok, human vibe rows at a spot, newest first
 * (qualityVibe re-sorts and re-checks). Newest first so a flood of old rows
 * can never freeze the line by filling the LIMIT; on-site only so remote
 * ratings (no code needed) never take a slot at all.
 */
function vibeStmt(db: D1Database, spot: string, since: number): D1PreparedStatement {
  return db.prepare(`SELECT id, spot, kind, value, extras_json, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports
    WHERE spot = ? AND kind = 'vibe' AND observed_at >= ? AND onsite = 1 AND status = 'ok' AND source = 'page' ORDER BY observed_at DESC LIMIT 500`).bind(spot, since);
}

/**
 * Distinct on-site phones and courts today, on-site reports UNION on-site
 * "still" confirms — one literal statement so only the two counts leave the
 * batch; the pid_hash rows the UNION reads over never surface as JS objects.
 * Both halves count the board's own air courts only (`spots`, a JSON array
 * bound as one value): a fog report at the beach is not a pickleball validator.
 */
function validatorsStmt(db: D1Database, day: string, dayStart: number, dayEnd: number, spots: string): D1PreparedStatement {
  return db.prepare(`SELECT COUNT(DISTINCT pid_hash) AS phones, COUNT(DISTINCT spot) AS courts FROM (
      SELECT pid_hash, spot FROM air_reports WHERE day = ? AND onsite = 1 AND status = 'ok' AND source = 'page'
        AND spot IN (SELECT value FROM json_each(?))
      UNION
      SELECT c.pid_hash AS pid_hash, r.spot AS spot FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
        WHERE c.verdict = 'still' AND c.onsite = 1 AND c.at >= ? AND c.at < ?
          AND r.spot IN (SELECT value FROM json_each(?))
    )`).bind(day, spots, dayStart, dayEnd, spots);
}

/** LA-midnight-to-midnight bounds for `now`, in epoch ms (approximate across a DST day; only used to bound a coarse "today" scan). */
function laDayBounds(now: number): [number, number] {
  const { minuteOfDay } = laParts(now) as { minuteOfDay: number };
  const start = now - minuteOfDay * MIN;
  return [start, start + DAY];
}

/**
 * GET /api/air/board's data, one `db.batch`. Throws on a DB failure — the
 * route (functions/api/air/board.ts) catches that the way every other /api/air
 * route does and answers 503 store-unavailable, no-store.
 *
 * `courts` is COURTS (src/lib/courts.ts, board order) and `config` is
 * AIR_CONFIG (src/lib/air.ts) — see the file doc comment for why they are
 * arguments, not imports. `readConditions` defaults to EMPTY_CONDITIONS.
 */
export async function boardData(env: AirEnv, db: D1Database, now: number, courts: Court[], config: AirConfig, readConditions?: ReadConditions): Promise<BoardPayload> {
  const airCourts = courts.filter((c) => c.air);
  const since = now - EVIDENCE_SINCE_MIN * MIN;
  const liveSince = now - EVIDENCE_LIVE_MIN * MIN;
  const today = laDate(now) as string;
  const vibeSince = now - VIBE_WINDOW_DAYS * DAY;
  const [dayStart, dayEnd] = laDayBounds(now);

  // Every group is pushed in a fixed, known order, so the results are sliced
  // back out by counting statements, not by re-deriving indices later.
  const KINDS = ['wait', 'parking'] as const;
  const stmts: D1PreparedStatement[] = [];
  for (const c of airCourts) for (const kind of KINDS) stmts.push(...evidenceStmts(db, c.id, kind, since, liveSince));
  for (const c of airCourts) for (const kind of KINDS) stmts.push(lastStmt(db, c.id, kind, today));
  for (const c of airCourts) stmts.push(vibeStmt(db, c.id, vibeSince));
  stmts.push(validatorsStmt(db, today, dayStart, dayEnd, JSON.stringify(airCourts.map((c) => c.id))));

  const res = await db.batch(stmts);
  let cursor = 0;
  const next = () => res[cursor++];

  const rows: ReportRow[] = [];
  const confirms: ConfirmRow[] = [];
  for (const c of airCourts) for (const kind of KINDS) {
    void c; void kind;
    rows.push(...((next().results ?? []) as ReportRow[]));
    confirms.push(...((next().results ?? []) as ConfirmRow[]));
  }
  const lastRows: ReportRow[] = [];
  for (const c of airCourts) for (const kind of KINDS) { void c; void kind; lastRows.push(...((next().results ?? []) as ReportRow[])); }
  const vibeRows: ReportRow[] = [];
  for (const c of airCourts) { void c; vibeRows.push(...((next().results ?? []) as ReportRow[])); }
  const validatorsRow = (next().results ?? [])[0] as { phones?: number; courts?: number } | undefined;
  const validatorsToday = { phones: Number(validatorsRow?.phones ?? 0), courts: Number(validatorsRow?.courts ?? 0) };

  const bylined = await withBylines(env, confirms);
  const conditions: Conditions = readConditions ? await readConditions(new Date(now)) : EMPTY_CONDITIONS;

  const kindCfg: Record<string, { wait?: AirKind; parking?: AirKind }> = {};
  for (const c of airCourts) {
    const spot = spotOf(config, c.id) as { kinds: Record<string, AirKind> } | null;
    if (spot) kindCfg[c.id] = { wait: spot.kinds.wait, parking: spot.kinds.parking };
  }

  return boardSummary({ now, courts, kindCfg, rows, confirms: bylined, lastRows, vibeRows, validatorsToday, conditions }) as BoardPayload;
}
