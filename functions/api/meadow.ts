/**
 * /api/meadow — the shared butterfly meadow behind /blue.
 *
 * Sprint 2026-07-18 evening (Mike: "all three we have credits"). /blue
 * shipped as a painting; this makes it participatory: tap the dunes,
 * release an El Segundo Blue, it joins everyone's meadow.
 *
 *   GET  /api/meadow           → { ok, total, recent: [{ n, h, x, t }] }
 *   POST /api/meadow           → body { n, h, x } → { ok, total }
 *
 *     n — coined name, lowercase-hyphen, 3-40 chars ("salt-glider")
 *     h — wing hue, integer 0-359 (client renders via hue shift)
 *     x — release position, 0-100 (% across the dune)
 *     t — server timestamp (ISO), set here, never trusted from client
 *
 * Storage: PC_RACE_KV (the shared small-counter namespace, same as
 * /api/coffee/pour). Keys:
 *   meadow:total   → integer, all releases since 2026-07-18
 *   meadow:recent  → JSON array ring, newest first, capped at 100
 *
 * The recent-ring read-modify-write can race under concurrent releases
 * (KV is eventually consistent). Same accepted trade as coffee's cup
 * counter: worst case a butterfly or two goes uncounted in the ring —
 * the total still increments — and this is a meadow, not a ledger.
 *
 * Rate limit: 20/min/IP. A person releasing butterflies faster than
 * one every three seconds is a person who has found a different game.
 *
 * Graceful no-op: if PC_RACE_KV is unbound, GET/POST return
 * { ok: true, reason: 'kv-unbound', total: null } and /blue quietly
 * keeps butterflies local-only.
 */
import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../_rate-limit';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

interface Release {
  n: string;
  h: number;
  x: number;
  t: string;
}

const TOTAL_KEY = 'meadow:total';
const RECENT_KEY = 'meadow:recent';
const RECENT_CAP = 100;
const NAME_RE = /^[a-z0-9][a-z0-9-]{2,39}$/;

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

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = env.PC_RACE_KV;
  if (!kv) return json({ ok: true, reason: 'kv-unbound', total: null, recent: [] });

  const [totalRaw, recentRaw] = await Promise.all([kv.get(TOTAL_KEY), kv.get(RECENT_KEY)]);
  let recent: Release[] = [];
  try {
    recent = recentRaw ? (JSON.parse(recentRaw) as Release[]) : [];
  } catch {
    recent = [];
  }
  return json({ ok: true, total: parseInt(totalRaw ?? '0', 10) || 0, recent });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rl = await rateLimit(request, env, { bucket: 'meadow:release', windowSec: 60, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl);

  const kv = env.PC_RACE_KV;
  if (!kv) return json({ ok: true, reason: 'kv-unbound', total: null });

  let body: { n?: unknown; h?: unknown; x?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const n = typeof body.n === 'string' && NAME_RE.test(body.n) ? body.n : null;
  const h = Number.isInteger(body.h) && (body.h as number) >= 0 && (body.h as number) <= 359 ? (body.h as number) : null;
  const xRaw = typeof body.x === 'number' && isFinite(body.x) ? body.x : null;
  if (!n || h === null || xRaw === null) return json({ ok: false, error: 'invalid-release' }, 400);
  const x = Math.min(100, Math.max(0, Math.round(xRaw * 10) / 10));

  const release: Release = { n, h, x, t: new Date().toISOString() };

  const [totalRaw, recentRaw] = await Promise.all([kv.get(TOTAL_KEY), kv.get(RECENT_KEY)]);
  const total = (parseInt(totalRaw ?? '0', 10) || 0) + 1;
  let recent: Release[] = [];
  try {
    recent = recentRaw ? (JSON.parse(recentRaw) as Release[]) : [];
  } catch {
    recent = [];
  }
  recent.unshift(release);
  if (recent.length > RECENT_CAP) recent.length = RECENT_CAP;

  await Promise.all([kv.put(TOTAL_KEY, String(total)), kv.put(RECENT_KEY, JSON.stringify(recent))]);

  return applyRateLimitHeaders(json({ ok: true, total }), rl);
};
