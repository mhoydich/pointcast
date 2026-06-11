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
 *
 * Date/seed/pick math lives in daily-core.ts (dependency-free) so the
 * client-side stale-proof re-pick scripts share the exact same
 * implementation — never port it inline.
 */
import type { CollectionEntry } from 'astro:content';
import { todayPT, dayOfYearPT, daySeed, pickDailyIndex } from './daily-core';

export { todayPT, dayOfYearPT, daySeed, pickDailyIndex };

/** Pick today's drop deterministically from a block list.
 *  Returns null if the list is empty. */
export function pickDailyBlock<T extends CollectionEntry<'blocks'>>(blocks: T[], now: Date = new Date()): T | null {
  if (blocks.length === 0) return null;
  // Sort by id-string so the pick is stable regardless of caller sort
  // order. (Block ids are 4-digit zero-padded, so string sort === natural.)
  const sorted = [...blocks].sort((a, b) => a.data.id.localeCompare(b.data.id));
  return sorted[pickDailyIndex(sorted.length, now)];
}

/** localStorage keys the client uses for the daily collection. */
export const DAILY_LS_KEYS = {
  /** JSON array of { date: 'YYYY-MM-DD', blockId, at: ISO } */
  collection: 'pc:daily:collected',
  /** ISO string of most-recent claim time — used to deduplicate same-day. */
  lastDay: 'pc:daily:lastDay',
} as const;
