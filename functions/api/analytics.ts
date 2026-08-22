interface Env {
  PC_ANALYTICS_KV?: KVNamespace;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: cors });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { event?: unknown; meta?: unknown; ts?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400, headers: cors });
  }

  const event = typeof body.event === 'string' ? body.event.trim() : '';
  if (!event || event.length > 64) {
    return new Response(null, { status: 400, headers: cors });
  }

  // Per-page-load analytics can exhaust the daily KV write budget. Keep this
  // guard even after removing the client beacons so cached pages cannot write.
  if (event === 'pageview' || event === 'page_view') {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        'Cache-Control': 'no-store',
        'X-PC-Analytics': 'pageview-suppressed',
      },
    });
  }

  const meta = body.meta && typeof body.meta === 'object' ? body.meta : undefined;
  const metaJson = meta ? JSON.stringify(meta) : undefined;
  if (metaJson && metaJson.length > 2048) {
    return new Response(null, { status: 413, headers: cors });
  }

  if (!env.PC_ANALYTICS_KV) {
    return new Response(null, { status: 204, headers: cors });
  }

  const ts =
    typeof body.ts === 'string' && !Number.isNaN(Date.parse(body.ts))
      ? new Date(body.ts).toISOString()
      : new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHint = ip.includes('.') ? `${ip.split('.').slice(0, 1).join('.')}.x` : ip.split(':')[0] || '';
  const payload = JSON.stringify({ event, meta, ts, ipHint });
  const rand = crypto.randomUUID().slice(0, 8);
  // Pageviews are keyed by path so a prefix list (`pv:/route:`) counts them
  // without reading values — see scripts/score-projects.mjs.
  const pvPath = event === 'pageview' && meta && typeof (meta as { path?: unknown }).path === 'string'
    ? String((meta as { path: string }).path).replace(/[^\w\-\/.]/g, '').slice(0, 120)
    : '';
  const key = pvPath ? `pv:${pvPath}:${ts}:${rand}` : `event:${event}:${ts}:${rand}`;

  await env.PC_ANALYTICS_KV.put(key, payload, { expirationTtl: 60 * 60 * 24 * 90 });
  return new Response(null, { status: 204, headers: cors });
};
