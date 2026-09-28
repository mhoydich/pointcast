// The Pickleball Board's display text — plain functions with no JSON import,
// so the page, CourtCard and the browser client (src/scripts/pickleball-board.ts)
// all print the same words for the same schedule. src/lib/courts.ts imports
// its JSON and must not reach the client bundle; this file carries no data.
//
// Times are LA wall time "HH:MM"; days are weekdays 0-6 (Sun 0); dates are
// LA days 'YYYY-MM-DD'.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Monday-first, so a weekend reads "Sat–Sun", never "Sun, Sat". */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_MS = 86_400_000;
export const STALE_DAYS = 45;

/** "Sep 28" for '2026-09-28'. */
export function monthDay(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${MONTHS[m - 1] ?? '?'} ${d}`;
}

/** "08:00" -> "8 AM", "17:30" -> "5:30 PM". */
export function timeText(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

/**
 * [1,2,3,4,5] -> "Mon–Fri"; [0,6] -> "Sat–Sun"; all seven -> "Daily";
 * [1,3,5] -> "Mon, Wed, Fri". Runs of three or more collapse, and so does the
 * weekend; other pairs list.
 */
export function daysText(days: number[]): string {
  const set = new Set(days);
  if (set.size === 7) return 'Daily';
  const ordered = WEEK.filter((d) => set.has(d));
  const runs: number[][] = [];
  for (const d of ordered) {
    const last = runs[runs.length - 1];
    if (last && WEEK.indexOf(last[last.length - 1]) === WEEK.indexOf(d) - 1) last.push(d);
    else runs.push([d]);
  }
  return runs
    .map((r) => (r.length >= 3 || (r.length === 2 && r[0] === 6 && r[1] === 0) ? `${DOW[r[0]]}–${DOW[r[r.length - 1]]}` : r.map((d) => DOW[d]).join(', ')))
    .join(', ');
}

/** A block's season: "Sep 7–Oct 26", "through Nov 30", "from Dec 1", or '' without one. */
export function seasonText(from: string | null | undefined, until: string | null | undefined): string {
  if (from && until) return `${monthDay(from)}–${monthDay(until)}`;
  if (until) return `through ${monthDay(until)}`;
  if (from) return `from ${monthDay(from)}`;
  return '';
}

/** "Mon–Fri 8 AM–9 PM; Sat–Sun 8 AM–8 PM" ('dusk' reads as a word). */
export function hoursLine(rules: { days: number[]; open: string; close: string }[]): string {
  return rules.map((r) => `${daysText(r.days)} ${timeText(r.open)}–${r.close === 'dusk' ? 'dusk' : timeText(r.close)}`).join('; ');
}

type SourceLike = { label: string; url: string | null | boolean };
type ProvenanceLike = { src: string; checked: string; confidence?: string };

/**
 * "from rec.us, checked Sep 28" — or "Mike said, Sep 28" for a label source
 * (no url), or "checked Sep 28" for an unknown source id. Tags ("unconfirmed",
 * "may have changed") are the caller's; see sourcedTag().
 */
export function provenanceText(p: ProvenanceLike, sources: Record<string, SourceLike | undefined>): string {
  const s = Object.prototype.hasOwnProperty.call(sources, p.src) ? sources[p.src] : undefined;
  if (!s) return `checked ${monthDay(p.checked)}`;
  return s.url ? `from ${s.label}, checked ${monthDay(p.checked)}` : `${s.label}, ${monthDay(p.checked)}`;
}

/** Whole days from a 'YYYY-MM-DD' checked date to the LA day `today` ('YYYY-MM-DD'). */
export function daysBetween(checked: string, today: string): number {
  const at = (day: string) => Date.parse(`${day}T12:00:00Z`);
  return Math.floor((at(today) - at(checked)) / DAY_MS);
}

/**
 * build spec §3, for anything sourced: `unverified` never shows; `partial`
 * shows tagged "unconfirmed"; a `verified` thing checked 45+ days before
 * `today` shows tagged "stale" ("may have changed").
 */
export function sourcedTag(p: ProvenanceLike, today: string): { show: boolean; tag: 'unconfirmed' | 'stale' | null } {
  if (p.confidence === 'unverified') return { show: false, tag: null };
  if (p.confidence === 'partial') return { show: true, tag: 'unconfirmed' };
  return { show: true, tag: daysBetween(p.checked, today) >= STALE_DAYS ? 'stale' : null };
}
