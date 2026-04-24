/**
 * GET /api/presence/snapshot — HTTP snapshot of live presence.
 *
 * Proxies the Durable Object at `/snapshot`. Edge-cached 5s to prevent
 * thundering-herd on the DO from multiple simultaneous /here loads.
 *
 * Graceful degrade: if the PRESENCE binding isn't available (DO deploy
 * is still deferred — see docs/presence-next-steps.md), returns an
 * empty snapshot shape so `/here` renders its quiet "waiting for peoples"
 * state rather than surfacing a 500.
 */

interface Env {
  PRESENCE?: DurableObjectNamespace;
}

const EMPTY_SNAPSHOT = JSON.stringify({
  humans: 0,
  agents: 0,
  sessions: [],
  note: 'presence DO not bound — see docs/presence-next-steps.md',
});

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  // DO binding missing → return empty snapshot with short cache.
  if (!env.PRESENCE) {
    return new Response(EMPTY_SNAPSHOT, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    });
  }

  try {
    const id = env.PRESENCE.idFromName('global');
    const stub = env.PRESENCE.get(id);
    const incomingUrl = new URL(request.url);
    const viewerSid = incomingUrl.searchParams.get('sid');
    const doUrl = new URL(incomingUrl.toString());
    doUrl.pathname = '/snapshot';
    doUrl.search = viewerSid ? '?sid=' + encodeURIComponent(viewerSid) : '';

    const response = await stub.fetch(new Request(doUrl.toString(), { method: 'GET' }));
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
    // Any DO error → graceful empty shape. Log for debugging but don't fail the page.
    console.error('[presence/snapshot] DO fetch failed:', err);
    return new Response(EMPTY_SNAPSHOT, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    });
  }
};
