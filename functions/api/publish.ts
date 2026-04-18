/**
 * functions/api/publish.ts — queue endpoint for signed thoughts.
 *
 * POST { type: 'pc-publish-v1', title, body, sha256, timestamp, address }
 *
 * Behavior:
 *   - If PC_PUBLISH_KV is bound, store the payload keyed by address + ts
 *     and return 200 with the stored key.
 *   - If not bound, return 503 with { reason: 'key-not-bound' }.
 *   - GET returns status + protocol doc.
 *   - HEAD returns 200 for health checkers.
 *   - OPTIONS handles CORS preflight.
 *
 * All JSON. All CORS-open. No auth yet (wallet signature is the auth;
 * verifying sig server-side is v1.1 when Taquito signature verification
 * is ported to the edge runtime).
 */

export interface Env {
  PC_PUBLISH_KV?: KVNamespace;
}

interface PublishPayload {
  type?: string;
  title?: string;
  body?: string;
  sha256?: string;
  timestamp?: string;
  address?: string;
}

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return json({ ok: true }, 204);
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'publish',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_PUBLISH_KV)),
      },
    });
  }

  if (request.method === 'GET') {
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/publish',
      kvBound: Boolean(env.PC_PUBLISH_KV),
      usage: 'POST body { type: "pc-publish-v1", title, body, sha256, timestamp, address }',
      notes: [
        'Queue for the PointCast publishing system v1.',
        'Until PC_PUBLISH_KV is bound in Cloudflare Pages env, this returns 503 on POST.',
        'Signed payloads are stored keyed by address + timestamp.',
        'Public: anyone can POST. Rate-limiting lands with v1.1.',
      ],
      spec: 'https://pointcast.xyz/publish.json',
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_PUBLISH_KV) {
    return json({
      ok: false,
      reason: 'key-not-bound',
      hint: 'Bind PC_PUBLISH_KV in Cloudflare Pages → Settings → KV namespace bindings.',
    }, 503);
  }

  let body: PublishPayload;
  try {
    body = (await request.json()) as PublishPayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== 'pc-publish-v1') {
    return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);
  }
  if (!body.title || !body.body || !body.sha256 || !body.timestamp || !body.address) {
    return json({ ok: false, error: 'missing-fields', required: ['title', 'body', 'sha256', 'timestamp', 'address'] }, 400);
  }
  if (body.title.length > 80) return json({ ok: false, error: 'title-too-long' }, 400);
  if (body.body.length > 4000) return json({ ok: false, error: 'body-too-long' }, 400);
  if (!/^[0-9a-f]{64}$/.test(body.sha256)) return json({ ok: false, error: 'bad-sha256' }, 400);
  if (!/^(tz|KT)[1-3][1-9A-HJ-NP-Za-km-z]{33}$/.test(body.address)) {
    return json({ ok: false, error: 'bad-address' }, 400);
  }

  const key = `pub:${body.address}:${body.timestamp}`;
  try {
    await env.PC_PUBLISH_KV.put(key, JSON.stringify(body), {
      metadata: { sha256: body.sha256, title: body.title.slice(0, 80) },
    });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-put-failed', message: err?.message || String(err) }, 500);
  }

  return json({
    ok: true,
    key,
    queued: body.timestamp,
    note: 'Payload stored. Batch anchoring to Dispatch FA2 happens when the contract lands.',
  });
};
