/**
 * Door of the Day — the daily dusting.
 *
 * Every day the town features one of its quietest doors: the pages whose
 * last commit is furthest in the past (via explore's staleFeatures). The
 * pick is deterministic from the PT calendar date, so every visitor and
 * every agent sees the same door, and no cron is needed — the formula IS
 * the schedule. Pages embed the pool at build time; client JS re-runs the
 * same formula so the door still turns over daily between deploys.
 *
 * Formula: fnv1a(PT date "YYYY-MM-DD") % pool.length, pool sorted
 * oldest-first. Keep in sync with the inline re-pick in door.astro.
 */
import { staleFeatures } from './explore';

export interface DoorPick {
  slug: string;
  title: string;
  description: string;
  daysQuiet: number;
}

export const POOL_DAYS = 45;
export const POOL_SIZE = 60;

export function doorPool(): DoorPick[] {
  const now = Math.floor(Date.now() / 1000);
  return staleFeatures(POOL_DAYS, POOL_SIZE).map((f) => ({
    slug: f.slug,
    title: f.title,
    description: f.description,
    daysQuiet: Math.floor((now - f.mtime) / 86400),
  }));
}

/** FNV-1a over a string — tiny, deterministic, mirrors the client copy. */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function ptDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function pickForDate(pool: DoorPick[], dateStr: string): DoorPick | null {
  if (!pool.length) return null;
  return pool[fnv1a(dateStr) % pool.length];
}
