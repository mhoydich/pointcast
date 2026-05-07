/**
 * GET /api/presence/snapshot — HTTP snapshot of live presence.
 *
 * Proxies the Durable Object at `/snapshot`. Edge-cached 5s to prevent
 * thundering-herd on the DO from multiple simultaneous /here loads.
 *
 * Graceful degrade: if the PRESENCE binding isn't available or the DO
 * budget is exhausted, returns the in-isolate fallback shape.
 */

import { presenceSnapshotFallback } from '../../_realtime-fallback';

interface Env {
  PRESENCE?: DurableObjectNamespace;
}

const PRESENCE_GLOBAL_KEY = 'global:2026-04-29c';
// Account-level DO duration is exhausted right now; use Pages fallback.
const USE_DURABLE_OBJECTS = false;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!USE_DURABLE_OBJECTS || !env.PRESENCE) {
    return fallbackSnapshot(request);
  }

  try {
    const id = env.PRESENCE.idFromName(PRESENCE_GLOBAL_KEY);
    const stub = env.PRESENCE.get(id);
    const incomingUrl = new URL(request.url);
    const viewerSid = incomingUrl.searchParams.get('sid');
    const doUrl = new URL(incomingUrl.toString());
    doUrl.pathname = '/snapshot';
    doUrl.search = viewerSid ? '?sid=' + encodeURIComponent(viewerSid) : '';

    const response = await stub.fetch(new Request(doUrl.toString(), { method: 'GET' }));
    if (!response.ok) throw new Error(`presence snapshot DO returned ${response.status}`);
    const headers = new Headers(response.headers);
    // Personalized responses must not be edge-cached (different viewers → different payloads).
    headers.set('Cache-Control', viewerSid ? 'private, no-store' : 'public, max-age=5, s-maxage=5');
    headers.set('Content-Type', 'application/json');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    // Any DO error → use the in-isolate fallback shape.
    console.error('[presence/snapshot] DO fetch failed:', err);
    return fallbackSnapshot(request);
  }
};

function fallbackSnapshot(request: Request): Response {
  const incoming = new URL(request.url);
  const viewerSid = incoming.searchParams.get('sid');
  return Response.json(presenceSnapshotFallback(PRESENCE_GLOBAL_KEY, viewerSid ?? undefined), {
    headers: {
      'Cache-Control': viewerSid ? 'private, no-store' : 'public, max-age=5, s-maxage=5',
      'Content-Type': 'application/json',
    },
  });
}
