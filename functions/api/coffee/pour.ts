/**
 * POST /api/coffee/pour — increment today's global cup-pour counter.
 *
 * Sprint 37 (Mike 2026-04-24 ~16:50 PT autonomous: "create your own next
 * set of sprints do some fun stuffs"). The /coffee room shipped in
 * Sprint 35 with a localStorage-only cup tally. This endpoint adds a
 * shared global counter so visitors see how many cups have been poured
 * by everyone today.
 *
 * Storage: PC_RACE_KV (reused — single KV namespace for all small
 * counters keeps the wrangler.toml simple). Key shape:
 *   coffee:cups:YYYY-MM-DD   → integer
 * Day key is PT-day so the count resets at midnight PT, matching the
 * client localStorage reset and the rest of the site's "today" sense.
 *
 * Rate limit: 60/min/IP via _rate-limit (graceful degraded mode if
 * PC_RATES_KV is unbound). Generous because each pour is a tiny
 * intentional action — abuse would just be amusing, not damaging.
 *
 * Graceful no-op: if PC_RACE_KV is unbound, returns { ok: true,
 * reason: 'kv-unbound', count: null } so the /coffee page can show
 * the local count and silently skip the global tally.
 */
import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../../_rate-limit';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

function ptDayKey(): string {
  // PT calendar date as YYYY-MM-DD using Intl. Stable across UTC build
  // servers because we go through the timezone-aware formatter.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date()); // "2026-04-24"
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

// Five mug variants — must match MUGS array in src/pages/coffee.astro.
const MUG_VARIANTS = ['ceramic', 'espresso', 'latte', 'paper', 'bistro'] as const;

interface MugRecord {
  mug: string;     // variant slug
  at: string;      // ISO timestamp
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const rl = await rateLimit(ctx.request, ctx.env, {
    bucket: 'coffee-pour',
    windowSec: 60,
    maxRequests: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const kv = ctx.env.PC_RACE_KV;
  if (!kv) {
    return applyRateLimitHeaders(
      json({ ok: true, reason: 'kv-unbound', count: null, mugs: [] }),
      rl
    );
  }

  const day = ptDayKey();
  const cupsKey = `coffee:cups:${day}`;
  const mugsKey = `coffee:mugs:${day}`;

  // Read current count + mug list in parallel.
  let current = 0;
  let mugs: MugRecord[] = [];
  try {
    const [cupsRaw, mugsRaw] = await Promise.all([
      kv.get(cupsKey),
      kv.get(mugsKey),
    ]);
    current = cupsRaw ? parseInt(cupsRaw, 10) || 0 : 0;
    if (mugsRaw) {
      try {
        const parsed = JSON.parse(mugsRaw);
        if (Array.isArray(parsed)) mugs = parsed;
      } catch (e) { /* corrupt — treat as empty */ }
    }
  } catch (e) {
    // Read failure — treat as 0/empty, still increment.
  }

  const next = current + 1;
  // Pick variant deterministically from the new pour-index.
  const variant = MUG_VARIANTS[(next - 1) % MUG_VARIANTS.length];
  const newRecord: MugRecord = {
    mug: variant,
    at: new Date().toISOString(),
  };

  // Append + cap at last 48 mugs to keep KV value small.
  const updatedMugs = [...mugs, newRecord].slice(-48);

  try {
    await Promise.all([
      kv.put(cupsKey, String(next), { expirationTtl: 60 * 60 * 48 }),
      kv.put(mugsKey, JSON.stringify(updatedMugs), { expirationTtl: 60 * 60 * 48 }),
    ]);
  } catch (e) {
    return applyRateLimitHeaders(
      json({ ok: false, error: 'kv-write-failed', count: current }, 500),
      rl
    );
  }

  return applyRateLimitHeaders(
    json({
      ok: true,
      count: next,
      day,
      mug: newRecord,
      mugs: updatedMugs,
    }),
    rl
  );
};
