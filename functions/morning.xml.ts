/**
 * /morning.xml — the Morning Edition as RSS 2.0.
 *
 * GET /morning.xml → the newest frozen editions (30 at most), newest first.
 * Only frozen, non-provisional editions are items: a reader keeps what it
 * fetched, so it must never be a line that could still change. The route only
 * reads the archive (readRecentFrozen in functions/_lib/morning-sources.ts); it
 * never composes or freezes an edition, which stays with /morning.json and the
 * page. With nothing frozen the channel is valid and has no items. When the
 * archive read fails the answer is 503 with no-store and nothing is cached, so
 * a passing D1 error never reaches readers as an empty feed.
 *
 * Content-Type application/rss+xml. Edge-cached in caches.default under one key
 * (query strings share it): at most 300 s, and never past the next 6:45 AM in
 * El Segundo, when a new edition can freeze.
 *
 * Not src/pages/morning.xml.ts: a static page there would be built once and
 * collide with this route. Sibling of functions/morning.json.ts.
 */
import { readRecentFrozen, type MorningEnv } from './_lib/morning-sources.ts';
// @ts-ignore — plain module shared with the tests
import { RSS_LIMIT, addDays, cutoffMs, editionDate, toRss } from './_lib/morning.mjs';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'X-Content-Type-Options': 'nosniff' };
const RSS_TYPE = 'application/rss+xml; charset=utf-8';
const MAX_TTL = 300;

/** Seconds to keep a response: 300, or less when the next 6:45 AM is sooner; at least 1. */
function ttlFor(now: number): number {
  const left = Math.floor((cutoffMs(addDays(editionDate(now), 1)) - now) / 1000);
  return Math.max(1, Math.min(MAX_TTL, Number.isFinite(left) ? left : MAX_TTL));
}

export const onRequestOptions: PagesFunction<MorningEnv> = () =>
  new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<MorningEnv> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const now = Date.now();
  const key = new Request(`${url.origin}/morning.xml`);
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) return hit;
    } catch { /* a miss */ }
  }
  const editions = await readRecentFrozen(env.AUTH_DB, RSS_LIMIT);
  if (editions === null) {
    return new Response('The Morning Edition archive did not answer. Try again in a minute.\n', {
      status: 503,
      headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60' },
    });
  }
  const response = new Response(toRss(editions), {
    headers: { ...CORS, 'Content-Type': RSS_TYPE, 'Cache-Control': `public, max-age=${ttlFor(now)}` },
  });
  if (cache) waitUntil(cache.put(key, response.clone()).catch(() => undefined));
  return response;
};
