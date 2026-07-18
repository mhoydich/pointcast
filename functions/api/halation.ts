/**
 * /api/halation — live federation bridge for the Halation image diary.
 *
 * Halation already exposes JSON Feed. PointCast normalizes that public feed,
 * keeps page and mint state separate, and adds an edge cache plus CORS so the
 * same signal can power human pages and agent clients.
 */
import {
  HALATION_FEED_URL,
  fetchHalationSignal,
} from '../../src/lib/halation';

const BASE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...BASE_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export const onRequest: PagesFunction = async ({ request, waitUntil }) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: BASE_HEADERS });
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        ...BASE_HEADERS,
        'X-Pc-Service': 'halation-federation',
        'Link': `<${HALATION_FEED_URL}>; rel="alternate"; type="application/feed+json"`,
      },
    });
  }
  if (request.method !== 'GET') return json({ ok: false, error: 'method-not-allowed' }, { status: 405 });

  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/halation', request.url).toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const signal = await fetchHalationSignal();
  const response = json({
    ok: true,
    schema: 'https://pointcast.xyz/api/halation#v1',
    station: 'halation',
    updatedAt: new Date().toISOString(),
    ...signal,
    policy: {
      pageIsPrimary: true,
      mintIsOptional: true,
      privateWalletMaterial: false,
    },
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      'X-Pc-Federated-From': HALATION_FEED_URL,
      'Link': `<${HALATION_FEED_URL}>; rel="alternate"; type="application/feed+json"`,
    },
  });

  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
