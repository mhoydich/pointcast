/**
 * daily — deterministic daily-drop pick logic. Same PT date + same block
 * list = same pick for every visitor globally. The site is El Segundo
 * anchored, so the calendar is America/Los_Angeles.
 */
import type { CollectionEntry } from 'astro:content';

/** YYYY-MM-DD in PT. */
export function todayPT(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
  } catch {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/** Day-of-year in PT, 1..366. */
export function dayOfYearPT(now: Date = new Date()): number {
  const [y, m, d] = todayPT(now).split('-').map((n) => parseInt(n, 10));
  const start = Date.UTC(y, 0, 1);
  const mid = Date.UTC(y, m - 1, d);
  return Math.floor((mid - start) / 86_400_000) + 1;
}

/** Stable daily seed across the PT calendar day. */
export function daySeed(now: Date = new Date()): number {
  const y = parseInt(todayPT(now).split('-')[0], 10);
  return y * 1000 + dayOfYearPT(now);
}

/** Pick today's drop deterministically from a block list. */
export function pickDailyBlock<T extends CollectionEntry<'blocks'>>(blocks: T[], now: Date = new Date()): T | null {
  if (blocks.length === 0) return null;
  const sorted = [...blocks].sort((a, b) => a.data.id.localeCompare(b.data.id));
  return sorted[daySeed(now) % sorted.length];
}

export const DAILY_LS_KEYS = {
  collection: 'pc:daily:collected',
  lastDay: 'pc:daily:lastDay',
} as const;
