/**
 * functions/api/drop.ts — paste-a-URL surface for cc.
 *
 * Mike 2026-04-18: "give me a place to share urls with you like the spotify
 * link or product link, location, etc". This is that. POST a URL + optional
 * note + optional location, lands in PC_DROP_KV (or 503 + docs/drops/
 * fallback). cc reads on every cron tick, classifies (see
 * src/lib/url-classifier.ts), and either stages a draft block or files it
 * under products / collabs / locations.
 *
 * Same env-guarded pattern as /api/queue, /api/ping, /api/publish.
 */

export interface Env {
  PC_DROP_KV?: KVNamespace;
}

interface DropPayload {
  type?: string;
  url?: string;
  note?: string;
  location?: string;
  tag?: string;
  from?: string;
  address?: string;
  timestamp?: string;
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

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'drop',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_DROP_KV)),
      },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'GET') {
    if (action === 'list') {
      if (!env.PC_DROP_KV) return json({ ok: false, reason: 'key-not-bound' }, 503);
      try {
        const list = await env.PC_DROP_KV.list({ prefix: 'drop:', limit: 100 });
        const entries = await Promise.all(list.keys.map(async (k) => ({
          key: k.name, drop: JSON.parse((await env.PC_DROP_KV!.get(k.name)) || 'null'),
          metadata: k.metadata ?? null,
        })));
        return json({ ok: true, count: entries.length, entries });
      } catch (err: any) {
        return json({ ok: false, error: 'kv-list-failed', message: err?.message }, 500);
      }
    }
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/drop',
      kvBound: Boolean(env.PC_DROP_KV),
      usage: 'POST body { type: "pc-drop-v1", url, note?, location?, tag?, from?, address?, timestamp }',
      notes: [
        'Paste-a-URL inbox for cc.',
        'cc reads ?action=list at session start + hourly cron tick, classifies via src/lib/url-classifier.ts, files into product / location / collab / draft-block as appropriate.',
        'Until PC_DROP_KV is bound, POST returns 503 with a docs/drops/ fallback hint.',
      ],
      spec: 'https://pointcast.xyz/drop',
    });
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);

  if (!env.PC_DROP_KV) {
    return json({
      ok: false,
      reason: 'key-not-bound',
      hint: 'Bind PC_DROP_KV in Cloudflare Pages → Settings → KV namespace bindings. Name: PC_DROP_KV.',
      fallback: 'For now: drop a file in docs/drops/{timestamp}-{slug}.md in the repo. cc reads on session start.',
    }, 503);
  }

  let body: DropPayload;
  try { body = (await request.json()) as DropPayload; } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }
  if (body.type !== 'pc-drop-v1') return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);
  if (!body.url) return json({ ok: false, error: 'missing-url' }, 400);
  try { new URL(body.url); } catch { return json({ ok: false, error: 'invalid-url' }, 400); }
  if (body.note && body.note.length > 500) return json({ ok: false, error: 'note-too-long', max: 500 }, 400);
  if (body.location && body.location.length > 200) return json({ ok: false, error: 'location-too-long', max: 200 }, 400);
  if (body.tag && body.tag.length > 40) return json({ ok: false, error: 'tag-too-long', max: 40 }, 400);

  const timestamp = body.timestamp || new Date().toISOString();
  const enc = new TextEncoder().encode(body.url);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hash = Array.from(new Uint8Array(buf)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `drop:${timestamp}:${hash}`;

  try {
    await env.PC_DROP_KV.put(key, JSON.stringify({ ...body, timestamp }), {
      expirationTtl: 60 * 24 * 3600, // 60-day retention
      metadata: { url: body.url.slice(0, 200), tag: body.tag || null, from: body.from || null },
    });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-put-failed', message: err?.message }, 500);
  }

  return json({ ok: true, key, queued: timestamp, note: 'URL queued. cc classifies + files on the next tick.' });
};
