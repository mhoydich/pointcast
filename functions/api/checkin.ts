/**
 * functions/api/checkin.ts — community presence for /me.
 *
 * Mike 2026-05-08 (after the start-experience polish): "keep building
 * out". Makes the local-first /me experience feel COMMUNAL — every
 * check-in lands a counter on a shared per-day aggregate visible at
 * GET /api/checkin and on /me's "WHO ELSE IS HERE TODAY" band.
 *
 * POST { area, mood }
 *   → optional: a single per-IP-per-day dedup mark prevents the same
 *     visitor from inflating the count on refresh
 *   → atomic-ish read-modify-write of the day's aggregate
 *   → returns 200 { ok, today: { total, byArea, byMood, topArea, topMood } }
 *   → returns 200 { ok: false, alreadyCheckedIn: true, today } if dup
 *
 * GET /api/checkin
 *   → returns today's aggregate without writing
 *   → cached 60s/swr 300s; /me polls this every minute or so
 *
 * Privacy / abuse guards:
 *   - IPs are hashed with sha256(ip + date + secret). Today's hash and
 *     yesterday's hash for the same IP differ, so we can't link a
 *     visitor across days. The "secret" is a deploy-time string baked
 *     into the function (not a real cryptographic secret — daily
 *     rotation is the actual privacy property).
 *   - 7-day TTL on every key.
 *   - Rate limit at 30 POST/min/IP via PC_RATES_KV (matches the
 *     /api/talk pattern). Most legit visitors check in once.
 *   - Validates area + mood against the same enums as /me + the
 *     editor.
 *
 * Graceful degradation: when PC_CHECKIN_KV is unbound, GET returns an
 * empty aggregate and POST returns 503 with reason. /me already shows
 * "—" for missing data. No user-facing failure.
 */

import { rateLimit } from '../_rate-limit';

export interface Env {
  PC_CHECKIN_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

interface DayAggregate {
  date: string;
  total: number;
  byArea: Record<string, number>;
  byMood: Record<string, number>;
  updatedAt: string;
}

const VALID_AREAS = [
  'el-segundo','manhattan-beach','hermosa-beach','redondo-beach',
  'venice','palos-verdes','santa-monica','culver-city',
  'lax','long-beach','downtown-la','elsewhere',
];
const VALID_MOODS = ['chill','hype','focus','flow','curious','quiet'];

// Daily-rotated salt baked into the source. Not a cryptographic secret —
// the privacy property is "today's hash != yesterday's hash for the same
// IP," which doesn't require the salt to be hidden, just date-scoped.
const HASH_SALT = 'pc-checkin-2026';

const TTL_DAYS = 7;
const TTL_SECS = TTL_DAYS * 24 * 60 * 60;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyAggregate(date: string): DayAggregate {
  return { date, total: 0, byArea: {}, byMood: {}, updatedAt: new Date().toISOString() };
}

function topKey(map: Record<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, v] of Object.entries(map)) {
    if (v > bestCount) { best = k; bestCount = v; }
  }
  return best;
}

function projection(agg: DayAggregate) {
  return {
    date: agg.date,
    total: agg.total,
    byArea: agg.byArea,
    byMood: agg.byMood,
    topArea: topKey(agg.byArea),
    topMood: topKey(agg.byMood),
    updatedAt: agg.updatedAt,
  };
}

async function ipHash(req: Request, date: string): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip')
          || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || 'anon';
  const enc = new TextEncoder();
  const data = enc.encode(`${ip}:${date}:${HASH_SALT}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

function corsHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra,
  };
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders({
        'X-Pc-Service': 'checkin',
        'X-Pc-Version': '1.0',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_CHECKIN_KV)),
      }),
    });
  }

  // ── GET: today's aggregate ────────────────────────────────────────────
  if (request.method === 'GET') {
    const date = todayUtc();
    let agg = emptyAggregate(date);
    if (env.PC_CHECKIN_KV) {
      try {
        const raw = await env.PC_CHECKIN_KV.get(`agg:${date}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') agg = parsed;
        }
      } catch (e) { /* fall through to empty */ }
    }
    return new Response(JSON.stringify({
      service: 'checkin',
      kvBound: Boolean(env.PC_CHECKIN_KV),
      today: projection(agg),
      docs: 'POST { area, mood } to check in. Aggregates roll forward 7 days. Per-IP dedup. Hashes rotate daily.',
      enums: { area: VALID_AREAS, mood: VALID_MOODS },
    }, null, 2), {
      status: 200,
      headers: corsHeaders({
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      }),
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method-not-allowed' }), {
      status: 405, headers: corsHeaders(),
    });
  }

  // ── POST: rate-limit then write ───────────────────────────────────────
  const limit = await rateLimit(request, env, {
    bucket: 'checkin:post', windowSec: 60, maxRequests: 30,
  });
  const rateHeaders: Record<string, string> = {
    'X-RateLimit-Limit':     String(limit.limit),
    'X-RateLimit-Remaining': String(Math.max(0, limit.remaining)),
    'X-RateLimit-Reset':     String(limit.retryAfter),
    'X-RateLimit-Bucket':    limit.bucket,
  };
  if (limit.degraded) rateHeaders['X-RateLimit-Mode'] = 'degraded-no-kv';
  if (!limit.allowed) {
    return new Response(JSON.stringify({
      error: 'rate-limited',
      retryAfterSeconds: limit.retryAfter,
    }), {
      status: 429,
      headers: corsHeaders({ ...rateHeaders, 'Retry-After': String(limit.retryAfter) }),
    });
  }

  if (!env.PC_CHECKIN_KV) {
    return new Response(JSON.stringify({
      error: 'kv-not-bound',
      reason: 'PC_CHECKIN_KV unbound — community aggregates degraded.',
    }), { status: 503, headers: corsHeaders(rateHeaders) });
  }

  let body: any;
  try { body = await request.json(); }
  catch (e) {
    return new Response(JSON.stringify({ error: 'body-not-json' }), {
      status: 400, headers: corsHeaders(rateHeaders),
    });
  }

  const area = typeof body?.area === 'string' ? body.area : null;
  const mood = typeof body?.mood === 'string' ? body.mood : null;
  if (!area || !VALID_AREAS.includes(area)) {
    return new Response(JSON.stringify({ error: 'area-invalid', allowed: VALID_AREAS }), {
      status: 422, headers: corsHeaders(rateHeaders),
    });
  }
  if (!mood || !VALID_MOODS.includes(mood)) {
    return new Response(JSON.stringify({ error: 'mood-invalid', allowed: VALID_MOODS }), {
      status: 422, headers: corsHeaders(rateHeaders),
    });
  }

  const date = todayUtc();
  const hash = await ipHash(request, date);
  const markKey = `mark:${date}:${hash}`;

  // Has this IP already checked in today?
  let alreadyCheckedIn = false;
  try {
    const mark = await env.PC_CHECKIN_KV.get(markKey);
    if (mark) alreadyCheckedIn = true;
  } catch (e) { /* assume no */ }

  // Read current aggregate (always, so we can return it).
  let agg = emptyAggregate(date);
  try {
    const raw = await env.PC_CHECKIN_KV.get(`agg:${date}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') agg = parsed;
    }
  } catch (e) { /* keep empty */ }

  if (!alreadyCheckedIn) {
    agg.total = (agg.total ?? 0) + 1;
    agg.byArea = agg.byArea || {};
    agg.byMood = agg.byMood || {};
    agg.byArea[area] = (agg.byArea[area] ?? 0) + 1;
    agg.byMood[mood] = (agg.byMood[mood] ?? 0) + 1;
    agg.updatedAt = new Date().toISOString();

    // Best-effort writes. KV doesn't support atomic increments, so two
    // simultaneous POSTs can race. For our scale this is fine — slight
    // undercounting under burst load.
    try {
      await env.PC_CHECKIN_KV.put(`agg:${date}`, JSON.stringify(agg), { expirationTtl: TTL_SECS });
      await env.PC_CHECKIN_KV.put(markKey, '1', { expirationTtl: 25 * 60 * 60 });
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'kv-write-failed', detail: String(e),
      }), { status: 500, headers: corsHeaders(rateHeaders) });
    }
  }

  return new Response(JSON.stringify({
    ok: !alreadyCheckedIn,
    alreadyCheckedIn,
    today: projection(agg),
  }, null, 2), {
    status: alreadyCheckedIn ? 200 : 201,
    headers: corsHeaders(rateHeaders),
  });
};
