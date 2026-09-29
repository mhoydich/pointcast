/**
 * The "New today" strip under the Shortwave hero: what shipped in the last
 * seven town days, one tap each. src/data/new-today.json is the list; add a
 * line there when something ships. Don't add the same launch to
 * front-door-news.json while it is fresh here: the Morning Edition's town slot
 * (pickTown in functions/_lib/morning.mjs) reads that file and would print it
 * into frozen editions for a week.
 *
 * The build filters the list, and the page checks again on load, so a quiet
 * week ages the strip out without a rebuild. An item's optional `until` retires
 * copy that stops being true sooner (a preview that becomes No. 1).
 */
import { townDate } from './band.ts';

export const NEW_TODAY_DAYS = 7;

export interface NewTodayItem {
  /** YYYY-MM-DD, the town (Pacific) day it shipped. */
  date: string;
  /** Small mono line above the title. */
  kicker: string;
  /** The cell's one line. */
  title: string;
  /** Site path the cell opens. */
  link: string;
  /** The block that filed it, e.g. "0626". */
  block?: string;
  /** ISO instant after which the cell's copy stops being true. */
  until?: string;
}

const DAY_MS = 86_400_000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const noon = (day: string) => Date.parse(`${day}T12:00:00Z`);

/** Whole town days from `date` to `today`, both YYYY-MM-DD. */
export function ageInDays(date: string, today: string): number {
  return Math.round((noon(today) - noon(date)) / DAY_MS);
}

/** Shipped within the last seven town days (today is day one) and not past its `until`. */
export function isFresh(item: { date: string; until?: string }, now: Date = new Date()): boolean {
  if (!ISO_DAY.test(item.date)) return false;
  const age = ageInDays(item.date, townDate(now));
  if (!(age >= 0 && age < NEW_TODAY_DAYS)) return false;
  const until = item.until ? Date.parse(item.until) : NaN;
  return !(Number.isFinite(until) && now.getTime() >= until);
}

/** "New today" when everything showing shipped today, otherwise "New this week". */
export function stripHeading(dates: string[], now: Date = new Date()): string {
  const today = townDate(now);
  return dates.length > 0 && dates.every((date) => date === today) ? 'New today' : 'New this week';
}

/** "Sep 28" for a YYYY-MM-DD town day. */
export function shortDay(date: string): string {
  if (!ISO_DAY.test(date)) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(noon(date)));
}
