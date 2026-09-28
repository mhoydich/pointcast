/**
 * Morning Edition sources and storage: what the seven slots are made from, and
 * the frozen archive in AUTH_DB (morning_editions, migrations/auth/0023_air.sql).
 * Pure rules (dates, slot lines, the freeze rule, the feed) live in
 * functions/_lib/morning.mjs; this file gathers their inputs and does the SQL.
 *
 *   sky     KLAX through the Marine Layer Oracle: the last hourly report at or
 *           before 6:45 AM on the edition's date (answerMarine observations),
 *           plus the beach reading at its last on-site moment before 6:45 AM
 *   courts  yesterday's last reading with its bylines, and the same weekday a
 *           week before. Court Call comes from the spots file inside
 *           composeEdition, not from courtCallState, so a frozen line never
 *           depends on when it was first read
 *   price   the nearest paddle release within ±14 days, else the newest register change
 *   town    front-door news 7 days old or less, else the newest card-signed
 *           Shortwave post not by the house, else the almanac line for El Segundo
 *   ritual  the Nightly Net (fixed in morning.mjs, mirrors NET in src/lib/band.ts;
 *           netState is live state and is never frozen into a line)
 *   pick    the day's block from the static /morning-picks.json (else /today.json)
 *   shop    a register paddle, never THC, never a link: "No link, no commission."
 *
 * Every source fails soft to null and its slot falls back to a template. Only
 * KLAX or the report store failing makes an edition provisional, and a
 * provisional edition is served and never frozen.
 *
 * Freezing is one D1 batch: INSERT OR IGNORE the edition, then the byline
 * points and the BYLINE badge for the owner of every report the stored
 * edition cites (read from the stored row, so a racer pays only what was
 * printed), then read the stored copy back. Report rows go only into
 * momentOf(), which returns bylines and report ids; owners are resolved
 * inside SQL. No device or network hash is read in this file outside SQL,
 * so none can reach a response.
 * Only prepared statements with bound values.
 */
import type { AuthEnv } from '../api/auth/session.ts';
import { targetOf } from './air-store.ts';
import { readCardByUser } from './town-card.ts';
import type { OracleEnv } from './oracle-kit.ts';
import { MARINE_ORACLE } from './oracles/marine-layer.ts';
import type { AirConfig } from '../../src/lib/air.ts';
import { ALMANAC_PLACES, buildDay, fmtTime } from '../../src/lib/almanac.ts';
import { RELEASES } from '../../src/lib/paddle-calendar.ts';
import { CHANGES, PADDLES } from '../../src/lib/paddle-register.ts';
import NEWS from '../../src/data/front-door-news.json';
// @ts-ignore — plain modules shared with the tests
import { DAILY_CAP, badgeStamp, bylineAwards } from './air-points.mjs';
// @ts-ignore — plain modules shared with the tests
import { addDays, composeEdition, cutoffMs, freezeEdition, isEditionDate, momentOf, NEWS_MAX_AGE_DAYS, pickPrice, pickShop, pickTown } from './morning.mjs';

export type MorningEnv = AuthEnv & {
  VISITS?: KVNamespace;
  ASSETS?: { fetch: (input: Request | string | URL) => Promise<Response> };
};
/** composeEdition() output, or the frozen copy (frozen: true, frozenAt). */
export type Edition = {
  v: number; date: string; number: number; preview: boolean; title: string; masthead: string; cutoff: string;
  provisional: boolean; missing: string[]; reporters: string[]; more: number; reporterLine: string;
  slots: { id: string; label: string; line: string; source: string; reportIds: string[]; bylines: string[]; fallback: boolean }[];
  reportIds: string[]; footer: string; disclosure: string; frozen: boolean; frozenAt?: string;
};
/** KLAX for an edition date: previewMarine() or answerMarine() output, or null when NOAA is down. */
export type Klax = (date: string, now: number, env: MorningEnv) => Promise<unknown>;
type Row = Record<string, unknown>;
type DailyEntry = { date?: unknown; blockId?: unknown; title?: unknown };

/**
 * The house: handles whose Shortwave posts never run as "Today in town" (the
 * slot is for the town talking, not the owner). Mike's card handle goes here;
 * the list is a guess until his card is confirmed. Compared without the @,
 * case-insensitively (pickTown in morning.mjs).
 */
export const OWNER_HANDLES: readonly string[] = ['mike', 'mhoydich', 'michaelhoydich', 'hoydich', 'pointcast'];

const SHORTWAVE_PREFIX = 'shortwave:post:v1:';
/** Shortwave keys read per compose: one list, then only posts inside the town window get fetched. */
const SHORTWAVE_LIST = 100;
const SHORTWAVE_GETS = 30;
const DAY_MS = 86_400_000;

/* ---------- sky ---------- */

/**
 * KLAX's time budget inside a compose. The page gives /morning.json 8 s, so a
 * hung NOAA or Iowa State upstream has to become "KLAX missing" (a
 * provisional edition, served) well before that, not a page that never loads.
 */
export const KLAX_BUDGET_MS = 4000;

/** `p`, or null once `ms` pass first. The timer is cleared either way. */
function within<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), ms); });
  return Promise.race([p, late]).finally(() => clearTimeout(timer));
}

/**
 * KLAX through the Marine Layer Oracle: answerMarine() for the edition's date
 * (the same AWC source and 300 s edge cache as the preview on its own day,
 * the ASOS archive for older dates). The edition prints only the last hourly
 * report at or before 6:45 AM from its `observations` (marineLine in
 * morning.mjs), so the frozen line is the same whenever the first read
 * happens; the preview's "latest report" would change with the read time.
 * Null on any upstream failure or after KLAX_BUDGET_MS: the sky slot then
 * reports 'klax' missing and the edition stays provisional.
 */
export async function klaxFor(date: string, _now: number, env: MorningEnv, budgetMs = KLAX_BUDGET_MS): Promise<unknown> {
  const oracleEnv = env as unknown as OracleEnv;
  try {
    return await within(MARINE_ORACLE.answer({ date }, oracleEnv), budgetMs);
  } catch {
    return null;
  }
}

/* ---------- reports ---------- */

/** One spot's reports filed on an LA day, and the confirms on them, as momentOf() takes them. */
function dayStmts(db: D1Database, spot: string, kind: string, day: string): D1PreparedStatement[] {
  return [
    db.prepare(`SELECT id, spot, kind, value, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports
      WHERE spot = ? AND kind = ? AND day = ? AND status = 'ok' ORDER BY observed_at DESC LIMIT 600`).bind(spot, kind, day),
    db.prepare(`SELECT c.report_id, c.pid_hash, c.ip_hash, c.user_id, c.verdict, c.value, c.onsite, c.at FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE r.spot = ? AND r.kind = ? AND r.day = ? AND r.status = 'ok' LIMIT 1200`).bind(spot, kind, day),
  ];
}

/**
 * Confirm rows carry no byline: a signed-in confirmer reads as their card,
 * as on the spot page (withBylines in air-store.ts); everyone else stays a guest.
 */
async function withCardBylines(env: MorningEnv, confirms: Row[]): Promise<Row[]> {
  const ids = [...new Set(confirms.map((c) => c.user_id).filter((id): id is string => typeof id === 'string' && id.length > 0))];
  const names = new Map<string, string | null>();
  await Promise.all(ids.map(async (id) => {
    try {
      const card = await readCardByUser(env, id);
      names.set(id, card && !card.released && card.handle ? `@${card.handle}` : null);
    } catch { names.set(id, null); }
  }));
  return confirms.map((c) => {
    const byline = typeof c.user_id === 'string' ? names.get(c.user_id) : null;
    return byline ? { ...c, byline } : c;
  });
}

type Moment = Record<string, unknown> | null;
type Moments = { courts: { yesterday: Moment; lastWeek: Moment }; beach: Moment };

/**
 * The report moments for `date`'s edition, from one D1 batch: the courts'
 * last reading yesterday, the courts' same weekday a week before that, and the
 * beach's last on-site moment this morning up to 6:45 AM. Null when the store
 * is unbound or fails, which the courts slot reports as 'reports' missing.
 */
export async function reportMoments(env: MorningEnv, config: AirConfig, date: string): Promise<Moments | null> {
  const db = env.AUTH_DB;
  const courts = targetOf(config, 'courts');
  const beach = targetOf(config, 'beach');
  if (!db || !courts) return null;
  const yesterday = addDays(date, -1);
  const weekBefore = addDays(date, -8);
  try {
    const res = await db.batch([
      ...dayStmts(db, courts.spot.id, courts.kind, yesterday),
      ...dayStmts(db, courts.spot.id, courts.kind, weekBefore),
      ...(beach ? dayStmts(db, beach.spot.id, beach.kind, date) : []),
    ]);
    const rows = (i: number) => (res[i]?.results ?? []) as Row[];
    const [yConfirms, wConfirms, bConfirms] = await Promise.all([1, 3, 5].map((i) => withCardBylines(env, rows(i))));
    return {
      courts: {
        yesterday: momentOf({ spot: courts.spot.id, cfg: courts.cfg, rows: rows(0), confirms: yConfirms, day: yesterday }),
        lastWeek: momentOf({ spot: courts.spot.id, cfg: courts.cfg, rows: rows(2), confirms: wConfirms, day: weekBefore }),
      },
      beach: beach ? momentOf({ spot: beach.spot.id, cfg: beach.cfg, rows: rows(4), confirms: bConfirms, day: date, until: cutoffMs(date) }) : null,
    };
  } catch {
    return null;
  }
}

/* ---------- town ---------- */

/** "In El Segundo today: sunrise 6:59 AM, sunset 6:36 PM, a waxing gibbous moon." Computed, so it cannot fail for a real date. */
export function almanacLine(date: string): string | null {
  try {
    const place = ALMANAC_PLACES[0];
    const [y, m, d] = date.split('-').map(Number);
    const day = buildDay(place, new Date(Date.UTC(y, m - 1, d)));
    if (!day.sun.sunrise || !day.sun.sunset) return null;
    const moon = /moon$/.test(day.moon.label) ? day.moon.label : `${day.moon.label} moon`;
    return `In ${place.name} today: sunrise ${fmtTime(day.sun.sunrise)}, sunset ${fmtTime(day.sun.sunset)}, a ${moon}.`;
  } catch {
    return null;
  }
}

/** When a Shortwave key was posted: its id is a reversed timestamp. */
const postedAt = (name: string) => 9999999999999 - Number(name.slice(SHORTWAVE_PREFIX.length, SHORTWAVE_PREFIX.length + 13));

/**
 * Card-signed Shortwave posts from the week before `date`'s 6:45 AM, newest
 * first. Keys carry the time, so only posts inside that window are fetched.
 * Station posts (Field Reports) and self-reported posts never qualify; the
 * text stays untrusted and pickTown quotes it, attributed, links removed.
 */
async function townPosts(env: MorningEnv, date: string): Promise<Row[]> {
  const kv = env.VISITS;
  if (!kv) return [];
  try {
    const cutoff = cutoffMs(date);
    const page = await kv.list({ prefix: SHORTWAVE_PREFIX, limit: SHORTWAVE_LIST });
    const names = page.keys.map((k) => k.name)
      .filter((name) => { const t = postedAt(name); return t <= cutoff && cutoff - t <= NEWS_MAX_AGE_DAYS * DAY_MS; })
      .slice(0, SHORTWAVE_GETS);
    const posts = await Promise.all(names.map((name) => kv.get<Row>(name, 'json').catch(() => null)));
    return posts.filter((p): p is Row => Boolean(p) && p!.attribution === 'card' && p!.via !== 'air');
  } catch {
    return [];
  }
}

/** Slot 4: news first; Shortwave is read only when no news item is fresh enough. */
export async function townSource(env: MorningEnv, date: string) {
  const almanac = almanacLine(date);
  const news = pickTown({ news: NEWS, posts: [], almanac: null, date, ownerHandles: OWNER_HANDLES });
  if (news?.kind === 'news') return news;
  return pickTown({ news: NEWS, posts: await townPosts(env, date), almanac, date, ownerHandles: OWNER_HANDLES });
}

/* ---------- pick, price, shop ---------- */

/** A {blockId, title} pick when both are strings, else null. */
const asPick = (e: DailyEntry | null | undefined) =>
  e && typeof e.blockId === 'string' && typeof e.title === 'string' ? { blockId: e.blockId, title: e.title } : null;

/**
 * Slot 6: the daily block for the edition's day, from the static
 * /morning-picks.json (built with the site: No. 1 through 60 days past the
 * build, src/pages/morning-picks.json.ts), then /today.json (the build day
 * ±1 week) for a deploy without it. Only an entry dated the edition's day
 * counts; otherwise the slot's template runs.
 */
export async function dailyPick(env: MorningEnv, date: string, origin: string): Promise<{ blockId: string; title: string } | null> {
  if (!env.ASSETS) return null;
  const read = async <T>(path: string): Promise<T | null> => {
    try {
      const res = await env.ASSETS!.fetch(new URL(path, origin));
      return res.ok ? await res.json() as T : null;
    } catch {
      return null;
    }
  };
  const picks = await read<{ picks?: Record<string, DailyEntry> }>('/morning-picks.json');
  const hit = picks?.picks && Object.prototype.hasOwnProperty.call(picks.picks, date) ? asPick(picks.picks[date]) : null;
  if (hit) return hit;
  const body = await read<{ today?: DailyEntry; tomorrow?: DailyEntry; past?: DailyEntry[] }>('/today.json');
  if (!body) return null;
  const entries = [body.today, body.tomorrow, ...(Array.isArray(body.past) ? body.past : [])];
  return asPick(entries.find((e) => e && e.date === date));
}

/** Slots 3 and 7 from the paddle calendar and register. The shop never repeats the price slot's paddle. */
export function priceAndShop(date: string) {
  const price = pickPrice({ releases: RELEASES, changes: CHANGES, paddles: PADDLES, date });
  const exclude = [price?.kind === 'release' ? price.id : price?.paddle].filter((id): id is string => typeof id === 'string');
  return { price, shop: pickShop({ paddles: PADDLES, date, exclude }) };
}

/* ---------- gather ---------- */

/**
 * Everything composeEdition(date, sources, config) takes, fetched in
 * parallel. Each source fails soft; `courts` is left out (not null) when the
 * report store failed, which is how the edition learns it is provisional.
 */
export async function gatherSources(env: MorningEnv, o: { config: AirConfig; date: string; now: number; origin: string; klax?: Klax }) {
  const { config, date, now, origin } = o;
  const [marine, moments, town, pick] = await Promise.all([
    (o.klax ?? klaxFor)(date, now, env).catch(() => null),
    reportMoments(env, config, date),
    townSource(env, date).catch(() => null),
    dailyPick(env, date, origin),
  ]);
  const { price, shop } = priceAndShop(date);
  return {
    sky: { marine, beach: moments?.beach ?? null },
    ...(moments ? { courts: moments.courts } : {}),
    price, town, pick, shop,
  };
}

/* ---------- the archive ---------- */

const asEdition = (json: unknown, date: string): Edition | null => {
  try {
    const e = JSON.parse(String(json)) as Edition;
    return e && typeof e === 'object' && e.date === date && Array.isArray(e.slots) ? e : null;
  } catch {
    return null;
  }
};

/** Frozen editions for these dates, by date. A missing or failing store is an empty archive. */
export async function readFrozen(db: D1Database | undefined, dates: string[]): Promise<Map<string, Edition>> {
  const out = new Map<string, Edition>();
  const wanted = dates.filter((d) => isEditionDate(d));
  if (!db || !wanted.length) return out;
  try {
    const res = await db.prepare('SELECT date, json FROM morning_editions WHERE date IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify(wanted)).all<{ date: string; json: string }>();
    for (const row of res.results ?? []) {
      const e = asEdition(row.json, row.date);
      if (e) out.set(row.date, e);
    }
  } catch { /* served as composed */ }
  return out;
}

/**
 * Freeze an edition (freezeEdition() output) in one D1 batch:
 *   1. INSERT OR IGNORE the edition: the first freeze wins, forever.
 *   2. Byline points (10, ref morning:<date>, dated the edition, under the
 *      daily cap) for the owner of every report the STORED edition cites:
 *      on-site, human, ok reports only, once per owner per edition.
 *   3. The BYLINE badge for the same owners (earned once).
 *   4. The stored edition, read back.
 * 2 and 3 read the cited report ids out of the stored row, not this request's
 * copy, so a request that lost a race to freeze (even in the same
 * millisecond) pays exactly what the stored edition printed; UNIQUE(owner,
 * action, ref) and the badge's UNIQUE make the repeat a no-op. → the stored
 * edition, or null.
 */
export async function saveFrozen(db: D1Database, frozen: Edition, now: number): Promise<Edition | null> {
  const [award] = bylineAwards(frozen.date) as { action: string; ref: string; units: number; day: string }[];
  const badge = badgeStamp('byline') as { kind: string; ref: string; day: string };
  const meta = JSON.stringify({ edition: frozen.date, number: frozen.number });
  const res = await db.batch([
    db.prepare('INSERT OR IGNORE INTO morning_editions (date, number, json, frozen_at) VALUES (?, ?, ?, ?)')
      .bind(frozen.date, frozen.number, JSON.stringify(frozen), now),
    db.prepare(`INSERT OR IGNORE INTO air_points (id, owner, action, ref, units, day, report_id, created_at)
      SELECT 'ap_' || lower(hex(randomblob(10))), o.owner, ?, ?,
        MAX(0, MIN(?, ? - COALESCE((SELECT SUM(p.units) FROM air_points p WHERE p.owner = o.owner AND p.day = ?), 0))), ?, o.report_id, ?
      FROM (SELECT CASE WHEN r.user_id IS NOT NULL AND r.user_id != '' THEN 'user:' || r.user_id ELSE 'dev:' || r.pid_hash END AS owner, MIN(r.id) AS report_id
        FROM air_reports r
        WHERE r.id IN (SELECT value FROM json_each((SELECT json_extract(m.json, '$.reportIds') FROM morning_editions m WHERE m.date = ?)))
          AND r.status = 'ok' AND r.onsite = 1 AND r.source = 'page'
        GROUP BY owner) o`)
      .bind(award.action, award.ref, award.units, DAILY_CAP, award.day, award.day, now, frozen.date),
    db.prepare(`INSERT OR IGNORE INTO air_stamps (id, owner, kind, ref, day, report_id, meta_json, created_at)
      SELECT 'as_' || lower(hex(randomblob(10))), o.owner, ?, ?, ?, o.report_id, ?, ?
      FROM (SELECT CASE WHEN r.user_id IS NOT NULL AND r.user_id != '' THEN 'user:' || r.user_id ELSE 'dev:' || r.pid_hash END AS owner, MIN(r.id) AS report_id
        FROM air_reports r
        WHERE r.id IN (SELECT value FROM json_each((SELECT json_extract(m.json, '$.reportIds') FROM morning_editions m WHERE m.date = ?)))
          AND r.status = 'ok' AND r.onsite = 1 AND r.source = 'page'
        GROUP BY owner) o`)
      .bind(badge.kind, badge.ref, badge.day, meta, now, frozen.date),
    db.prepare('SELECT json FROM morning_editions WHERE date = ?').bind(frozen.date),
  ]);
  const row = (res[3]?.results ?? [])[0] as { json?: string } | undefined;
  return row ? asEdition(row.json, frozen.date) : null;
}

/**
 * The edition for `date`, as /morning.json and the MCP serve it: the frozen
 * copy when there is one; otherwise composed now, and frozen (with its
 * bylines paid) when canFreeze allows: numbered, not provisional, seven
 * filled slots, at or after its own 6:45 AM. A preview (before No. 1) and a
 * provisional edition are served as composed, never stored.
 */
export async function editionFor(env: MorningEnv, o: { config: AirConfig; date: string; now: number; origin: string; klax?: Klax }): Promise<Edition> {
  const kept = (await readFrozen(env.AUTH_DB, [o.date])).get(o.date);
  if (kept) return kept;
  let sources = {};
  try { sources = await gatherSources(env, o); } catch { /* every slot has a template */ }
  const edition = composeEdition({ date: o.date, sources, config: o.config }) as Edition;
  const frozen = freezeEdition(edition, o.now) as Edition | null;
  if (!frozen || !env.AUTH_DB) return edition;
  try {
    return (await saveFrozen(env.AUTH_DB, frozen, o.now)) ?? edition;
  } catch {
    return edition;
  }
}
