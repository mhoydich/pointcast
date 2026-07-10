/**
 * daily — the daily-drop pick logic. Given a date and a block list,
 * returns a deterministic block. Same day + same block list = same
 * pick for every visitor globally.
 *
 * Per Mike 2026-04-19 morning: "need the daily collection". v0 is a
 * rotation: one block per PT calendar day, indexed by day-of-year so
 * the same block doesn't re-appear for ~N days (where N is the
 * collection size). Visitors across time zones see the same drop on
 * the same PT date — the site is El Segundo-anchored.
 *
 * Collection mechanic is client-side-only for v0 (localStorage array
 * of { date, blockId, at }). Future: server-side count via Cloudflare
 * Function + KV; further future: Tezos claim via /collect flow.
 */
import type { CollectionEntry } from 'astro:content';

/** YYYY-MM-DD in PT, anchored to El Segundo's calendar. */
export function todayPT(now: Date = new Date()): string {
  // en-CA gives YYYY-MM-DD format.
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
  } catch {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/** Day-of-year in PT (1..366). */
export function dayOfYearPT(now: Date = new Date()): number {
  const [y, m, d] = todayPT(now).split('-').map((n) => parseInt(n, 10));
  const start = Date.UTC(y, 0, 1);
  const mid = Date.UTC(y, m - 1, d);
  return Math.floor((mid - start) / 86_400_000) + 1;
}

/** Deterministic day-seed — stable across the PT calendar day.
 *  Combines year * 1000 + day-of-year so each day has a unique seed and
 *  year rollovers don't collide. */
export function daySeed(now: Date = new Date()): number {
  const y = parseInt(todayPT(now).split('-')[0], 10);
  return y * 1000 + dayOfYearPT(now);
}

/** Pick today's drop deterministically from a block list.
 *  Returns null if the list is empty. */
export function pickDailyBlock<T extends CollectionEntry<'blocks'>>(blocks: T[], now: Date = new Date()): T | null {
  if (blocks.length === 0) return null;
  // Sort by id-string so the pick is stable regardless of caller sort
  // order. (Block ids are 4-digit zero-padded, so string sort === natural.)
  const sorted = [...blocks].sort((a, b) => a.data.id.localeCompare(b.data.id));
  return sorted[daySeed(now) % sorted.length];
}

/** localStorage keys the client uses for the daily collection. */
export const DAILY_LS_KEYS = {
  /** JSON array of { date: 'YYYY-MM-DD', blockId, at: ISO } */
  collection: 'pc:daily:collected',
  /** ISO string of most-recent claim time — used to deduplicate same-day. */
  lastDay: 'pc:daily:lastDay',
} as const;
