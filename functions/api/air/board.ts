/**
 * GET /api/air/board — the Pickleball Board's one live call
 * (src/pages/pickleball.astro polls this every 30 s while visible).
 *
 * → 200 BoardPayload (src/lib/courts.ts), `Cache-Control: public, max-age=30`.
 *   Nothing in the body is per-viewer, so one edge cache entry (caches.default,
 *   keyed by the URL with its query stripped — the route takes none) serves
 *   every viewer inside the window; a cache hit never touches D1.
 *   503 store-unavailable, `no-store`, without D1 or on any read failure —
 *   the page keeps showing its last poll rather than an error state.
 *   A conditions feed being down is not this: `conditions` fields are null
 *   and the response is still 200 (court-conditions.ts's own concern).
 */
import { boardData } from '../../_lib/air-board-store.ts';
import { fail, unavailable, type AirEnv } from '../../_lib/air-store.ts';
import { readConditions } from '../../_lib/court-conditions.ts';
import { COURTS } from '../../../src/lib/courts.ts';
import { AIR_CONFIG } from '../../../src/lib/air.ts';

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };

export const onRequestGet: PagesFunction<AirEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB) return unavailable();
  const cacheUrl = new URL(request.url);
  cacheUrl.search = '';
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let payload;
  try {
    payload = await boardData(env, env.AUTH_DB, Date.now(), COURTS, AIR_CONFIG, readConditions);
  } catch {
    return unavailable();
  }
  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...HEADERS, 'Cache-Control': 'public, max-age=30' },
  });
  // Cloudflare Cache API requires a cacheable status and headers; this response is 200 and public, so it is stored as-is.
  await caches.default.put(cacheKey, response.clone());
  return response;
};

export const onRequestPost: PagesFunction = async () => fail('method-not-allowed', 405);
