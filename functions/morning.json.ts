/**
 * /morning.json — the Morning Edition as JSON Feed 1.1.
 *
 * GET /morning.json          → the current edition (yesterday's until 6:45 AM
 *                              in El Segundo) and up to six earlier frozen ones,
 *                              newest first. Before No. 1 (Sat 3 Oct 2026) the
 *                              one item is a PREVIEW edition, never frozen.
 * GET /morning.json?d=YYYY-MM-DD → that edition alone. `d` runs from 2026-10-03
 *                              to the current edition date; anything else is
 *                              400 { ok: false, reason: 'bad-date' }.
 *
 * An edition is assembled at read time (no cron). A frozen one is served from
 * D1 as stored. Otherwise it is composed from its sources, and the first read
 * at or after its own 6:45 AM that is not provisional freezes it: one D1
 * batch, INSERT OR IGNORE, plus byline points and the BYLINE badge for every
 * report it cites (editionFor / saveFrozen in functions/_lib/morning-sources.ts).
 * A provisional edition (KLAX or the report store missing) is served and
 * composed again on a later read, never frozen.
 *
 * Content-Type application/feed+json. Edge-cached in caches.default: frozen
 * 300 s, provisional or preview 60 s, and the undated feed never past the next
 * 6:45 AM, when the current edition changes.
 *
 * Not src/pages/morning.json.ts: a static page there would be built once and
 * collide with this route.
 */
import { AIR_CONFIG } from '../src/lib/air.ts';
import { editionFor, readFrozen, type Edition, type MorningEnv } from './_lib/morning-sources.ts';
// @ts-ignore — plain module shared with the tests
import { addDays, cutoffMs, EDITION_TTL, editionDate, FIRST_EDITION, feedDates, parseEditionParam, toJsonFeed } from './_lib/morning.mjs';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'X-Content-Type-Options': 'nosniff' };
const FEED_TYPE = 'application/feed+json; charset=utf-8';

const badDate = (now: number) => new Response(JSON.stringify({ ok: false, reason: 'bad-date', first: FIRST_EDITION, current: editionDate(now) }), {
  status: 400, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

/**
 * Seconds to keep a response: frozen 300, otherwise 60. The undated feed
 * also stops at the next 6:45 AM, when a new edition takes the top.
 */
function ttlFor(edition: Edition, dated: boolean, now: number): number {
  const base = edition.frozen === true ? EDITION_TTL.frozen : EDITION_TTL.provisional;
  if (dated) return base;
  const left = Math.floor((cutoffMs(addDays(edition.date, 1)) - now) / 1000);
  return Math.max(1, Math.min(base, Number.isFinite(left) ? left : base));
}

export const onRequestOptions: PagesFunction<MorningEnv> = () =>
  new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<MorningEnv> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const now = Date.now();
  const d = url.searchParams.get('d');
  const dated = d != null && d !== '';
  const parsed = parseEditionParam(d, now) as { date: string } | { reason: string };
  if ('reason' in parsed) return badDate(now);

  // One cache entry per edition date (and one for the undated feed); other query strings share it.
  const key = new Request(`${url.origin}/morning.json${dated ? `?d=${parsed.date}` : ''}`);
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) return hit;
    } catch { /* a miss */ }
  }

  // One archive read covers the usual case (already frozen); editionFor composes and freezes otherwise.
  const dates: string[] = dated ? [parsed.date] : feedDates(now);
  const archive = await readFrozen(env.AUTH_DB, dates);
  const edition = archive.get(parsed.date) ?? await editionFor(env, { config: AIR_CONFIG, date: parsed.date, now, origin: url.origin });
  const earlier = dates.filter((x) => x !== parsed.date).map((x) => archive.get(x)).filter((e): e is Edition => Boolean(e));
  const feed = toJsonFeed([edition, ...earlier]);
  const response = new Response(JSON.stringify(feed), {
    headers: { ...CORS, 'Content-Type': FEED_TYPE, 'Cache-Control': `public, max-age=${ttlFor(edition, dated, now)}` },
  });
  if (cache) waitUntil(cache.put(key, response.clone()).catch(() => undefined));
  return response;
};
