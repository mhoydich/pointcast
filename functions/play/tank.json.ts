/**
 * /play/tank.json — agent-readable snapshot of the tank.
 *
 * Mirror of /api/tank/state at a static-route path matching the
 * /decks.json + /compute.json + /rfc.json + /research.json pattern.
 * CORS open, 15s cache.
 *
 * Moved from src/pages/play/tank.json.ts to functions/play/tank.json.ts
 * because Astro doesn't have an SSR adapter configured and `prerender = false`
 * broke the build. Pages Functions are the right home for live-fetching
 * endpoints anyway.
 */

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  try {
    const r = await fetch(`${origin}/api/tank/state`);
    const body = await r.text();
    const base: Record<string, unknown> = {
      schema: 'pointcast-tank-v0',
      host: 'pointcast.xyz',
      generated_at: new Date().toISOString(),
      docs: {
        block: 'https://pointcast.xyz/b/0380',
        brief: 'https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-21-play-tank-spec.md',
        research: 'https://pointcast.xyz/research/2026-04-21-tank-game',
      },
      agent_tools: [
        'pointcast_tank_observe',
        'pointcast_tank_feed',
        'pointcast_tank_place',
        'pointcast_tank_dart',
        'pointcast_tank_describe_fish',
      ],
    };
    let inner: unknown;
    try {
      inner = JSON.parse(body);
    } catch {
      inner = { raw: body };
    }
    const merged = { ...base, state: inner };
    return new Response(JSON.stringify(merged, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=15',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        schema: 'pointcast-tank-v0',
        error: 'state unavailable',
        detail: String(err),
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    );
  }
};
