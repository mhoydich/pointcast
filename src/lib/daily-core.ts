/**
 * daily-core — the daily-drop date/seed/pick math, dependency-free.
 *
 * THE one implementation, imported by BOTH the build-time picker
 * (src/lib/daily.ts) and the client-side stale-proof re-pick scripts
 * (/today, the homepage daily strip). Prod once sat 25 days undeployed,
 * which froze every build-time "today" — client and server must compute
 * the same pick from the same seed, so this module owns the math and
 * nothing else. No astro:content, no DOM, no Date.now side effects.
 */

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

/** Index of today's pick in a list of `count` candidates sorted by block
 *  id ascending (4-digit zero-padded string sort — the contract every
 *  caller must uphold). */
export function pickDailyIndex(count: number, now: Date = new Date()): number {
  if (count <= 0) return -1;
  return daySeed(now) % count;
}
