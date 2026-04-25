/**
 * GET /api/coffee/history?days=7
 *
 * Returns the daily cup count for the last N PT days (default 7,
 * max 30). Reads `coffee:cups:YYYY-MM-DD` keys from PC_RACE_KV in
 * parallel.
 *
 * Sprint 47 — Mike pivot 2026-04-25 ~10:30 PT: "coffee interactions
 * today and then history and then mintables." History endpoint
 * powers the "through the days" section on /coffee.
 *
 * Caching: 60s edge cache (history changes slowly — yesterday's
 * count never changes after midnight PT).
 */
import { rateLimit, applyRateLimitHeaders, rateLimitResponse } from '../../_rate-limit';

interface Env {
  PC_RACE_KV?: KVNamespace;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

function ptDayKey(d: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(d);
}

function shiftPtDay(today: string, deltaDays: number): string {
  // today is "YYYY-MM-DD" — convert to a midday Date and step.
  const base = new Date(`${today}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toISOString().slice(0, 10);
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const rl = await rateLimit(ctx.request, ctx.env, {
    bucket: 'coffee-history',
    windowSec: 60,
    maxRequests: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const url = new URL(ctx.request.url);
  let days = parseInt(url.searchParams.get('days') ?? '7', 10);
  if (!isFinite(days) || days < 1) days = 7;
  if (days > 30) days = 30;

  const today = ptDayKey();
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(shiftPtDay(today, -i));

  const kv = ctx.env.PC_RACE_KV;
  if (!kv) {
    const empty = dayKeys.map((d) => ({ day: d, count: 0 }));
    return applyRateLimitHeaders(
      json({ ok: true, reason: 'kv-unbound', days: empty, total: 0, since: dayKeys[0], today }),
      rl
    );
  }

  // Read all day counts in parallel.
  const reads = dayKeys.map((d) =>
    kv.get(`coffee:cups:${d}`).then((raw) => ({
      day: d,
      count: raw ? parseInt(raw, 10) || 0 : 0,
    })).catch(() => ({ day: d, count: 0 }))
  );

  const results = await Promise.all(reads);
  const total = results.reduce((sum, r) => sum + r.count, 0);

  return applyRateLimitHeaders(
    json({ ok: true, days: results, total, since: dayKeys[0], today }),
    rl
  );
};
