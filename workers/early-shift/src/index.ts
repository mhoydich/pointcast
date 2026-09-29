// Early Shift — a scheduled Worker (pointcast-early-shift), not a Pages
// Function, so AIRNOW_API_KEY lives in exactly one place and the cron
// trigger — not a lazy Pages filer — owns "on time" cleanly.
// Build spec: docs/plans/2026-09-28-early-shift-desk-spec.md §1, §4, §6.
//
// Crons: 0 13 * * * and 0 14 * * *. `shouldRun()` (F's module) is true only
// in the 6 AM LA hour, so exactly one of the two fires on any calendar day,
// DST or not — the other logs a skip and touches nothing. A missed shift
// just leaves today's board as it is (live KLAX plus the computed sunset);
// there is no lazy filer inside Pages to fall back to.
//
// POST /run is the resident-only re-run: a missed morning, or manual testing.
// Re-runs never count as on time (spec §1.1), so it answers 409 `too-early`
// until the day's on-time cut (config.desk.onTimeBy, 6:15 LA) has passed:
// the 6 AM cron owns the morning up to the cut, a run after midnight can
// never file today's feeds ahead of it (and stop it filing fresh ones), and
// every row a re-run writes is late by construction. After the cut, without
// `force` it still respects the 6 AM gate (so a bare re-run behaves like the
// cron would); `force: true` runs regardless of the hour. Either way it goes
// through the exact same runEarlyShift() as the cron, so a re-run upgrades a
// gap the same way — the filed `at` is what On time reads.
import config from '../../../src/data/air-spots.json';
import { onTimeCut, shouldRun } from '../../../functions/_lib/air-desk.mjs';
import { isoSec, laDate } from '../../../functions/_lib/air-reading.mjs';
import { runEarlyShift, type ShiftEnv } from './shift';

export interface Env extends ShiftEnv {
  YARD_RESIDENT_KEY?: string;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify(event));
}

/**
 * Constant-time string compare — the house pattern for a shared secret
 * (workers/sparrow-digest/src/signing.ts), portable to both the Workers
 * runtime and the node test harness (unlike `crypto.subtle.timingSafeEqual`,
 * a Workers-only extension no `node --test` global provides).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** null when the request may proceed; otherwise the refusal to return. 503 unset, 403 wrong. */
function residentRefusal(request: Request, env: Env): Response | null {
  if (!env.YARD_RESIDENT_KEY) return json({ ok: false, reason: 'resident-key-unset' }, 503);
  const presented = request.headers.get('X-Yard-Resident') || '';
  if (!presented || !timingSafeEqual(presented, env.YARD_RESIDENT_KEY)) {
    return json({ ok: false, reason: 'not-a-resident' }, 403);
  }
  return null;
}

const CRONS = ['0 13 * * *', '0 14 * * *'];

async function status(env: Env): Promise<Response> {
  const day = laDate(Date.now());
  let feeds: unknown[] = [];
  if (env.AUTH_DB) {
    try {
      const rows = await env.AUTH_DB.prepare(
        `SELECT feed, agent, outcome, reason, at FROM air_shift_feeds WHERE day = ? ORDER BY feed`,
      ).bind(day).all();
      feeds = rows.results ?? [];
    } catch (error) {
      log({ message: 'early shift status query failed', error: error instanceof Error ? error.message : String(error) });
    }
  }
  return json({
    ok: true,
    day,
    feeds,
    airnowKey: Boolean(env.AIRNOW_API_KEY),
    residentKeySet: Boolean(env.YARD_RESIDENT_KEY),
    cron: CRONS,
    timeZone: 'America/Los_Angeles',
    dryRun: String(env.EARLY_SHIFT_DRY_RUN) === 'true',
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/status')) {
      return status(env);
    }
    if (request.method === 'POST' && url.pathname === '/run') {
      const refusal = residentRefusal(request, env);
      if (refusal) return refusal;
      let force = false;
      try {
        const body = await request.json();
        if (body && typeof body === 'object') force = Boolean((body as Record<string, unknown>).force);
      } catch {
        // an empty or absent body is fine; force stays false
      }
      const nowMs = Date.now();
      // Re-runs never count as on time: nothing before the day's cut (the cron's window).
      const cut = onTimeCut(config, laDate(nowMs));
      if (nowMs <= cut) {
        return json({ ok: false, ran: false, reason: 'too-early', after: isoSec(cut) }, 409);
      }
      if (!force && !shouldRun(nowMs)) {
        return json({ ok: true, ran: false, reason: 'not-6am-la' });
      }
      const result = await runEarlyShift(env, { fetch: (...args) => fetch(...args) }, nowMs);
      log({ message: 'early shift ran (POST /run)', force, ...result });
      return json({ ...result, ran: true });
    }
    return new Response('Not found', { status: 404 });
  },
  async scheduled(controller, env): Promise<void> {
    const nowMs = controller.scheduledTime;
    if (!shouldRun(nowMs)) {
      log({ message: 'early shift skipped', reason: 'not-6am-la', scheduledTime: new Date(nowMs).toISOString(), cron: controller.cron });
      return;
    }
    const result = await runEarlyShift(env, { fetch: (...args) => fetch(...args) }, nowMs);
    log({ message: 'early shift complete', cron: controller.cron, ...result });
  },
} satisfies ExportedHandler<Env>;
