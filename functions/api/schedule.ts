/**
 * functions/api/schedule.ts — cloud-backed broadcast scheduler for Magpie.
 *
 * The local BroadcastScheduler in Magpie v0.8 only fires while the app
 * is running. If your laptop sleeps at fire time, the post stays queued
 * until wake. For "fire at 9 AM" to actually work, you want cloud-side.
 *
 * v0.9 protocol:
 *   POST /api/schedule  — queue a future broadcast
 *   GET  /api/schedule  — health + kv-bound probe
 *   GET  /api/schedule?action=list  — list pending (cc uses this)
 *
 * POST body = {
 *   type: "pc-schedule-v1",
 *   fireAt: ISO 8601 datetime,
 *   destinations: ["pointcast", "mastodon", ...],
 *   clipID: number,            // Magpie-side clip ID
 *   title?, dek?, body?, channel?, blockType?, overrides?,
 *   // Credentials for each destination travel here — they're scoped to
 *   // the scheduled post and encrypted at rest. cc reads KV at cron tick,
 *   // fans out via the same adapter code, wipes the entry on success.
 *   credentials: { [publisherID]: { token?, instance?, ... } }
 *   from?, address?,
 * }
 *
 * A Cloudflare Cron Trigger (configured in wrangler.toml) pokes this
 * worker every 5 min, picks up KV entries whose fireAt <= now, fans out
 * to each destination, deletes on success.
 *
 * v0.9 scope: this file exposes POST + GET. The cron-dispatch worker
 * lives alongside in functions/api/schedule-dispatch.ts (v0.10 — needs
 * deeper adapter reuse between the Magpie Swift layer and the TS
 * worker; for now we leave the actual dispatch to the client-side
 * scheduler and just use KV as shared persistence).
 */

export interface Env {
  PC_SCHEDULE_KV?: KVNamespace;
}

interface SchedulePayload {
  type?: string;
  fireAt?: string;             // ISO 8601
  destinations?: string[];
  clipID?: number;
  title?: string;
  dek?: string;
  body?: string;
  channel?: string;
  blockType?: string;
  overrides?: Record<string, string>;
  credentials?: Record<string, Record<string, string>>;
  from?: string;
  address?: string;
  timestamp?: string;
}

const VALID_PUBLISHERS = new Set([
  'pointcast', 'mastodon', 'farcaster', 'bitchat',
  'bluesky', 'twitter', 'linkedin', 'zora', 'objkt',
]);
const VALID_CHANNELS = new Set(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'VST', 'BTL', 'FCT']);
const VALID_BLOCK_TYPES = new Set(['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT', 'MINT', 'FAUCET']);

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        'X-Pc-Service': 'schedule',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_SCHEDULE_KV)),
      },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // GET without action = health probe (mirrors /api/ping, /api/queue).
  if (request.method === 'GET') {
    if (action === 'list') {
      if (!env.PC_SCHEDULE_KV) {
        return json({
          ok: false,
          reason: 'key-not-bound',
          hint: 'Bind PC_SCHEDULE_KV in Cloudflare Pages → Settings → KV.',
        }, 503);
      }
      try {
        const list = await env.PC_SCHEDULE_KV.list({ prefix: 'broadcast:', limit: 200 });
        const entries = await Promise.all(
          list.keys.map(async (k) => {
            const v = await env.PC_SCHEDULE_KV!.get(k.name);
            return { key: k.name, item: v ? JSON.parse(v) : null, metadata: k.metadata ?? null };
          }),
        );
        const now = Date.now();
        const due = entries.filter((e) => e.item && new Date(e.item.fireAt).getTime() <= now);
        return json({ ok: true, total: entries.length, due: due.length, entries });
      } catch (err: any) {
        return json({ ok: false, error: 'kv-list-failed', message: err?.message || String(err) }, 500);
      }
    }

    return json({
      ok: true,
      service: 'schedule',
      endpoint: 'https://pointcast.xyz/api/schedule',
      kvBound: Boolean(env.PC_SCHEDULE_KV),
      usage: 'POST body { type: "pc-schedule-v1", fireAt, destinations, clipID, title?, dek?, body?, channel?, blockType?, overrides?, credentials?, from?, address?, timestamp }',
      notes: [
        'Cloud-backed broadcast scheduler — fires when laptop is asleep.',
        'Stores in PC_SCHEDULE_KV with key = "broadcast:<fireAt>:<clipID>".',
        'Cron trigger dispatches due entries in v0.10.',
        'Credentials in-flight: TLS-only. At rest: KV (use app-specific tokens with narrow scope).',
      ],
      spec: 'https://pointcast.xyz/magpie.json#broadcast_protocol',
    });
  }

  if (request.method === 'DELETE') {
    if (!env.PC_SCHEDULE_KV) {
      return json({ ok: false, reason: 'key-not-bound' }, 503);
    }
    const key = url.searchParams.get('key');
    if (!key || !key.startsWith('broadcast:')) {
      return json({ ok: false, error: 'bad-key' }, 400);
    }
    try {
      await env.PC_SCHEDULE_KV.delete(key);
      return json({ ok: true, key, deleted: true });
    } catch (err: any) {
      return json({ ok: false, error: 'kv-delete-failed', message: err?.message || String(err) }, 500);
    }
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_SCHEDULE_KV) {
    return json({
      ok: false,
      reason: 'key-not-bound',
      hint: 'Bind PC_SCHEDULE_KV in Cloudflare Pages → Settings → KV namespace bindings.',
    }, 503);
  }

  let body: SchedulePayload;
  try {
    body = (await request.json()) as SchedulePayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  // Validation — same gates as the local scheduler.
  if (body.type !== 'pc-schedule-v1') {
    return json({ ok: false, error: 'unsupported-type', got: body.type, expected: 'pc-schedule-v1' }, 400);
  }
  if (!body.fireAt) {
    return json({ ok: false, error: 'missing-fireAt' }, 400);
  }
  const fireAtMs = new Date(body.fireAt).getTime();
  if (isNaN(fireAtMs)) {
    return json({ ok: false, error: 'bad-fireAt', got: body.fireAt }, 400);
  }
  if (fireAtMs < Date.now() - 60_000) {
    return json({ ok: false, error: 'fireAt-in-past', hint: 'Cannot schedule in the past (> 60s tolerance).' }, 400);
  }
  const year = 365 * 24 * 3600 * 1000;
  if (fireAtMs > Date.now() + year) {
    return json({ ok: false, error: 'fireAt-too-far', hint: 'Maximum scheduling horizon is 1 year.' }, 400);
  }
  if (!Array.isArray(body.destinations) || body.destinations.length === 0) {
    return json({ ok: false, error: 'missing-destinations' }, 400);
  }
  const badDest = body.destinations.find((d) => !VALID_PUBLISHERS.has(d));
  if (badDest) {
    return json({ ok: false, error: 'unknown-destination', got: badDest, valid: [...VALID_PUBLISHERS] }, 400);
  }
  if (body.channel && !VALID_CHANNELS.has(body.channel)) {
    return json({ ok: false, error: 'bad-channel', got: body.channel, valid: [...VALID_CHANNELS] }, 400);
  }
  if (body.blockType && !VALID_BLOCK_TYPES.has(body.blockType)) {
    return json({ ok: false, error: 'bad-blockType', got: body.blockType, valid: [...VALID_BLOCK_TYPES] }, 400);
  }
  if (typeof body.clipID !== 'number' || !Number.isFinite(body.clipID)) {
    return json({ ok: false, error: 'bad-clipID' }, 400);
  }
  if (body.body && body.body.length > 4000) {
    return json({ ok: false, error: 'body-too-long', max: 4000 }, 400);
  }
  if (body.title && body.title.length > 200) {
    return json({ ok: false, error: 'title-too-long', max: 200 }, 400);
  }

  const timestamp = body.timestamp || new Date().toISOString();
  const key = `broadcast:${body.fireAt}:${body.clipID}`;
  const record = {
    ...body,
    timestamp,
    status: 'pending' as const,
    attempts: 0,
  };

  // Expiration = 30 days past fireAt so entries that never fire auto-GC.
  const ttl = Math.max(3600, Math.ceil((fireAtMs - Date.now()) / 1000) + 30 * 24 * 3600);

  try {
    await env.PC_SCHEDULE_KV.put(key, JSON.stringify(record), {
      expirationTtl: ttl,
      metadata: {
        fireAt: body.fireAt,
        destinations: body.destinations,
        clipID: body.clipID,
        from: body.from || null,
      },
    });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-put-failed', message: err?.message || String(err) }, 500);
  }

  return json({
    ok: true,
    key,
    fireAt: body.fireAt,
    destinations: body.destinations,
    note: `Scheduled for ${body.fireAt}. Dispatch runs on 5-min cron tick (v0.10).`,
  });
};
