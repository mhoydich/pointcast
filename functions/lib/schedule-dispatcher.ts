/**
 * functions/lib/schedule-dispatcher.ts
 *
 * Cron-side companion to /api/schedule. Walks PC_SCHEDULE_KV for entries
 * whose fireAt <= now, fans them out to each destination, marks success
 * / failure, deletes on success or bumps attempt count on failure.
 *
 * v0.9 scope — pointcast destination only.
 *
 * Fan-out to non-pointcast destinations (Mastodon, Farcaster, Bluesky,
 * etc.) needs per-user credentials to travel to the worker. That's a
 * meaningful trust + security design (encryption at rest, narrow-scope
 * tokens, per-user KV keys) that we're deferring until the pattern
 * settles. For now: "pointcast" is always safe to fire cloud-side
 * because /api/ping is unauthed; anything else in a scheduled record
 * stays pending and the local BroadcastScheduler picks it up on wake.
 *
 * Each KV entry looks like:
 *   key = "broadcast:<fireAt ISO>:<clipID>"
 *   value (JSON) = {
 *     type: "pc-schedule-v1",
 *     fireAt, destinations, clipID, title?, dek?, body?, channel?,
 *     blockType?, overrides?, credentials?, from?, address?,
 *     timestamp, status, attempts, lastError?, results?
 *   }
 */

export interface DispatcherEnv {
  PC_SCHEDULE_KV?: KVNamespace;
  PC_PING_KV?: KVNamespace;
}

interface ScheduledRecord {
  type: string;
  fireAt: string;
  destinations: string[];
  clipID: number;
  title?: string;
  dek?: string;
  body?: string;
  channel?: string;
  blockType?: string;
  overrides?: Record<string, string>;
  credentials?: Record<string, Record<string, string>>;
  from?: string;
  address?: string;
  timestamp: string;
  status?: 'pending' | 'firing' | 'completed' | 'failed';
  attempts?: number;
  lastError?: string;
  results?: DispatchResult[];
}

interface DispatchResult {
  publisher: string;
  ok: boolean;
  summary?: string;
  error?: string;
  at: string;
}

const MAX_ATTEMPTS = 5;
const CLOUD_DISPATCHABLE = new Set(['pointcast']);

export async function dispatchDueBroadcasts(env: DispatcherEnv): Promise<{ dispatched: number; skipped: number; errors: number }> {
  if (!env.PC_SCHEDULE_KV) {
    return { dispatched: 0, skipped: 0, errors: 0 };
  }
  const now = Date.now();
  const list = await env.PC_SCHEDULE_KV.list({ prefix: 'broadcast:', limit: 200 });

  let dispatched = 0;
  let skipped = 0;
  let errors = 0;

  for (const key of list.keys) {
    const raw = await env.PC_SCHEDULE_KV.get(key.name);
    if (!raw) continue;
    let rec: ScheduledRecord;
    try {
      rec = JSON.parse(raw);
    } catch {
      await env.PC_SCHEDULE_KV.delete(key.name);
      errors++;
      continue;
    }

    // Not due yet.
    const fireAtMs = new Date(rec.fireAt).getTime();
    if (isNaN(fireAtMs) || fireAtMs > now) {
      skipped++;
      continue;
    }

    // Already finished.
    if (rec.status === 'completed') {
      continue;
    }

    // Too many attempts — give up + mark failed.
    if ((rec.attempts ?? 0) >= MAX_ATTEMPTS) {
      rec.status = 'failed';
      await env.PC_SCHEDULE_KV.put(key.name, JSON.stringify(rec), {
        expirationTtl: 30 * 24 * 3600,
      });
      errors++;
      continue;
    }

    // Mark "firing" to prevent double-dispatch if cron overlaps.
    rec.status = 'firing';
    rec.attempts = (rec.attempts ?? 0) + 1;
    await env.PC_SCHEDULE_KV.put(key.name, JSON.stringify(rec));

    const results: DispatchResult[] = rec.results ?? [];
    let anyNewFailure = false;
    let anyNewSuccess = false;

    for (const dest of rec.destinations) {
      // Skip destinations we've already succeeded on in prior attempts.
      if (results.find((r) => r.publisher === dest && r.ok)) continue;

      if (!CLOUD_DISPATCHABLE.has(dest)) {
        // Leave it for the local scheduler — we don't have credentials.
        results.push({
          publisher: dest,
          ok: false,
          error: 'deferred — cloud dispatch only supports pointcast (v0.9)',
          at: new Date().toISOString(),
        });
        continue;
      }

      try {
        const outcome = await dispatchPointCast(rec, env);
        results.push({
          publisher: dest,
          ok: true,
          summary: outcome.summary,
          at: new Date().toISOString(),
        });
        anyNewSuccess = true;
      } catch (err: any) {
        results.push({
          publisher: dest,
          ok: false,
          error: err?.message || String(err),
          at: new Date().toISOString(),
        });
        anyNewFailure = true;
      }
    }

    rec.results = results;

    // Any cloud destinations that still haven't succeeded? Keep pending
    // for the next cron tick. Locally-dispatched destinations stay in
    // the record but don't block status: their `deferred` error is the
    // signal to the local scheduler.
    const cloudPending = rec.destinations
      .filter((d) => CLOUD_DISPATCHABLE.has(d))
      .some((d) => !results.find((r) => r.publisher === d && r.ok));

    if (!cloudPending && !anyNewFailure) {
      rec.status = 'completed';
      // Keep the record around for 7 days so the CLI can show history,
      // then let TTL clear it.
      await env.PC_SCHEDULE_KV.put(key.name, JSON.stringify(rec), {
        expirationTtl: 7 * 24 * 3600,
      });
      dispatched++;
    } else if (cloudPending) {
      rec.status = 'pending';
      await env.PC_SCHEDULE_KV.put(key.name, JSON.stringify(rec));
      if (anyNewSuccess) dispatched++;
      if (anyNewFailure) errors++;
    } else {
      rec.status = 'pending'; // local-only remainder
      await env.PC_SCHEDULE_KV.put(key.name, JSON.stringify(rec));
      if (anyNewSuccess) dispatched++;
    }
  }

  return { dispatched, skipped, errors };
}

/**
 * Fire a PointCast ping cloud-side. Re-implements /api/ping's KV write
 * inline so we avoid a self-http call (saves a round-trip + subrequest
 * budget).
 */
async function dispatchPointCast(
  rec: ScheduledRecord,
  env: DispatcherEnv
): Promise<{ summary: string; key: string }> {
  if (!env.PC_PING_KV) {
    throw new Error('PC_PING_KV not bound');
  }
  const body = rec.overrides?.pointcast ?? rec.body ?? '';
  if (!body.trim()) {
    throw new Error('body empty');
  }
  const timestamp = new Date().toISOString();
  const handle = (rec.title || body).slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'scheduled';
  const key = `ping:${timestamp}:${handle}`;
  const ping = {
    type: 'pc-ping-v1',
    subject: rec.title ?? null,
    body: body.slice(0, 4000),
    dek: rec.dek ?? null,
    channel: rec.channel ?? null,
    blockType: rec.blockType ?? null,
    from: rec.from ?? null,
    address: rec.address ?? null,
    timestamp,
    expand: Boolean(rec.title),          // presence of a title = "make it a block"
    source: 'schedule-cron',
    scheduledAt: rec.fireAt,
  };
  await env.PC_PING_KV.put(key, JSON.stringify(ping), {
    expirationTtl: 30 * 24 * 3600,
    metadata: {
      subject: rec.title ?? null,
      channel: rec.channel ?? null,
      blockType: rec.blockType ?? null,
      fromSchedule: true,
    },
  });
  return { summary: rec.title ? `Expanded → CH.${rec.channel ?? 'FD'}` : 'Pushed to PointCast', key };
}
