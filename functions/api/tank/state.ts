/**
 * GET /api/tank/state — full tank snapshot.
 *
 * Delegates to the TankRoom DO at /state. CORS open for agent reads.
 */
export interface Env {
  TANK?: DurableObjectNamespace;
}

function cors(): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };
}

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      },
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ ok: false, error: 'method' }), {
      status: 405,
      headers: cors(),
    });
  }
  if (!env.TANK) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'tank-do-not-bound',
        note: 'Deploy workers/tank/ + bind TANK in wrangler.toml to enable.',
        stub: {
          tankId: 'v0',
          fish: [],
          flake: [],
          plants: [],
          decor: [],
          waste: 0,
          events: [],
          stats: { fishCount: 0, humans: 0, agents: 0, health: 'stub' },
        },
      }),
      { status: 503, headers: cors() },
    );
  }
  const id = env.TANK.idFromName('pointcast-tank-v0');
  const stub = env.TANK.get(id);
  const r = await stub.fetch('https://tank/state', { method: 'GET' });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: cors() });
}
