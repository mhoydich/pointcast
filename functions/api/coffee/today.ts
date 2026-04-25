/**
 * GET /api/coffee/today — read today's global cup-pour count.
 *
 * Sprint 37 sibling to /api/coffee/pour. Lets the /coffee page hydrate
 * the global tally on load without firing a write. Same key shape:
 *   coffee:cups:YYYY-MM-DD   → integer (PT-day)
 *
 * Rate limit: 120/min/IP — read-heavier than pour because the page
 * polls every ~30s if the tab is open. Cheap GETs.
 *
 * Graceful no-op when PC_RACE_KV is unbound: { ok: true,
 * reason: 'kv-unbound', count: null } — same shape as pour.ts so the
 * client renders nothing instead of erroring.
 */
import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../../_rate-limit';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

function ptDayKey(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=10',
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const rl = await rateLimit(ctx.request, ctx.env, {
    bucket: 'coffee-today',
    windowSec: 60,
    maxRequests: 120,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const kv = ctx.env.PC_RACE_KV;
  if (!kv) {
    return applyRateLimitHeaders(
      json({ ok: true, reason: 'kv-unbound', count: null }),
      rl
    );
  }

  const day = ptDayKey();
  const cupsKey = `coffee:cups:${day}`;
  const mugsKey = `coffee:mugs:${day}`;

  let count = 0;
  let mugs: unknown[] = [];
  try {
    const [cupsRaw, mugsRaw] = await Promise.all([
      kv.get(cupsKey),
      kv.get(mugsKey),
    ]);
    count = cupsRaw ? parseInt(cupsRaw, 10) || 0 : 0;
    if (mugsRaw) {
      try {
        const parsed = JSON.parse(mugsRaw);
        if (Array.isArray(parsed)) mugs = parsed;
      } catch (e) { /* corrupt — treat as empty */ }
    }
  } catch (e) {
    // Keep zero/empty, return ok still.
  }

  return applyRateLimitHeaders(
    json({ ok: true, count, day, mugs }),
    rl
  );
};
