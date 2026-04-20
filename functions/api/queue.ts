/**
 * functions/api/queue.ts — sprint-pick queue.
 *
 * Mike 2026-04-18: "yah it'd be neat to have just some one click options
 * or so, maybe a feedback area for me tho, while its say 10 am and you are
 * idle, i can see these options and say pick 1 like a progress on yeeplayer
 * whatev and then green light it".
 *
 * /sprint page lists candidate work items (from src/lib/sprints.ts). User
 * taps PICK → POST here → message lands in PC_QUEUE_KV (or 503 with
 * docs/queue/ fallback hint). Custom directives from the feedback form
 * land here too.
 *
 * cc reads /api/queue?action=list at the start of each session AND on
 * every hourly CronCreate tick. Highest-priority unprocessed pick wins.
 *
 * Same env-guarded pattern as /api/ping + /api/publish + /api/indexnow.
 */

export interface Env {
  PC_QUEUE_KV?: KVNamespace;
}

interface QueuePayload {
  type?: string;
  sprintId?: string;       // matches an id in src/lib/sprints.ts
  comment?: string;        // optional note from the picker
  custom?: string;         // free-text custom directive (when no sprintId)
  from?: string;           // optional display name
  address?: string;        // optional Tezos identity claim
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
        'X-Pc-Service': 'queue',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_QUEUE_KV)),
      },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'GET') {
    if (action === 'list') {
      if (!env.PC_QUEUE_KV) {
        return json({ ok: false, reason: 'key-not-bound', hint: 'Bind PC_QUEUE_KV in Cloudflare Pages → Settings → KV namespace bindings.' }, 503);
      }
      try {
        const list = await env.PC_QUEUE_KV.list({ prefix: 'pick:', limit: 100 });
        const entries = await Promise.all(
          list.keys.map(async (k) => {
            const v = await env.PC_QUEUE_KV!.get(k.name);
            return { key: k.name, pick: v ? JSON.parse(v) : null, metadata: k.metadata ?? null };
          }),
        );
        return json({ ok: true, count: entries.length, entries });
      } catch (err: any) {
        return json({ ok: false, error: 'kv-list-failed', message: err?.message || String(err) }, 500);
      }
    }

    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/queue',
      kvBound: Boolean(env.PC_QUEUE_KV),
      usage: 'POST body { type: "pc-queue-v1", sprintId? | custom?, comment?, from?, address?, timestamp }',
      notes: [
        'One-click sprint-pick queue from /sprint.',
        'Either sprintId (matches src/lib/sprints.ts) or custom (free text).',
        'cc reads ?action=list at session start + hourly cron tick.',
        'Until PC_QUEUE_KV is bound in Cloudflare Pages env, POST returns 503.',
      ],
      spec: 'https://pointcast.xyz/sprint',
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_QUEUE_KV) {
    return json({
      ok: false,
      reason: 'key-not-bound',
      hint: 'Bind PC_QUEUE_KV in Cloudflare Pages → Settings → KV namespace bindings. Name: PC_QUEUE_KV.',
      fallback: 'For now: drop a file in docs/queue/{timestamp}-{slug}.md in the repo. cc reads that directory on session start.',
    }, 503);
  }

  let body: QueuePayload;
  try {
    body = (await request.json()) as QueuePayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== 'pc-queue-v1') {
    return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);
  }
  if (!body.sprintId && !body.custom) {
    return json({ ok: false, error: 'missing-pick', hint: 'Provide either sprintId or custom directive text.' }, 400);
  }
  if (body.sprintId && !/^[a-z0-9-]{1,40}$/.test(body.sprintId)) {
    return json({ ok: false, error: 'bad-sprint-id', hint: 'sprintId must be lowercase alphanumeric + hyphens, ≤40 chars.' }, 400);
  }
  if (body.custom && body.custom.length > 1000) {
    return json({ ok: false, error: 'custom-too-long', max: 1000 }, 400);
  }
  if (body.comment && body.comment.length > 500) {
    return json({ ok: false, error: 'comment-too-long', max: 500 }, 400);
  }

  const timestamp = body.timestamp || new Date().toISOString();
  const handle = body.sprintId || ('custom-' + (await sha8(body.custom || '')));
  const key = `pick:${timestamp}:${handle}`;

  try {
    await env.PC_QUEUE_KV.put(key, JSON.stringify({ ...body, timestamp }), {
      expirationTtl: 30 * 24 * 3600, // 30-day retention — cc clears as it processes
      metadata: {
        sprintId: body.sprintId || null,
        custom: body.custom ? body.custom.slice(0, 80) : null,
        from: body.from || null,
      },
    });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-put-failed', message: err?.message || String(err) }, 500);
  }

  return json({
    ok: true,
    key,
    queued: timestamp,
    note: body.sprintId
      ? `Sprint "${body.sprintId}" picked. cc executes on the next cron tick.`
      : 'Custom directive queued. cc executes on the next cron tick.',
  });
};

async function sha8(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('');
}
