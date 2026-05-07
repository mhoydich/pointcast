/**
 * functions/api/studio-block/[id].ts — read a published Studio composition.
 *
 * GET /api/studio-block/{id} → { id, createdAt, composition }
 * 404 if not found, 503 if PC_STUDIO_KV unbound.
 *
 * Used by /studio/share/{id} on the server side and by the Studio editor
 * when remixing (?remix={id} query param).
 */

export interface Env {
  PC_STUDIO_KV?: KVNamespace;
}

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_STUDIO_KV) return json({ error: 'kv-not-bound' }, 503);

  const id = String(params.id || '');
  if (!/^s-[a-z0-9-]{4,40}$/i.test(id)) {
    return json({ error: 'id-malformed' }, 400);
  }

  const raw = await env.PC_STUDIO_KV.get(id);
  if (!raw) return json({ error: 'not-found', id }, 404);

  if (request.method === 'HEAD') return new Response(null, { status: 200 });

  try {
    const parsed = JSON.parse(raw);
    return json(parsed);
  } catch (e) {
    return json({ error: 'kv-value-corrupt', id }, 500);
  }
};
