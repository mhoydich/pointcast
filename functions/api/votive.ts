/**
 * /api/votive — the candle wall (prayer-candles).
 *
 * Per Mike 2026-07-19: "this was very cool, can you try a next" —
 * fourth room of the prayer wing. Anyone lights a votive under one
 * of the eleven stations; it burns 24 real hours where everyone can
 * see it. The wall is shared state — the room accumulates presence.
 *
 * Storage:
 *   votive:wall → JSON { candles: [{id, station, t, pid}], total }
 *     · pruned to the 24h window on every load
 *     · stored list capped at 400 newest (display caps lower)
 *   votive:rate:{pid} → ms timestamp · 120s TTL · one candle per 60s
 *
 * GET → { ok, candles (newest first, ≤160), burning, total, now }
 * POST { sessionId, station } → light a candle
 *
 * Lighting a candle is also a prayer — the page POSTs /api/prayer
 * alongside this endpoint (client-side dual write keeps the two
 * ledgers decoupled here).
 */

import { sha256, type Env } from './visit';
import { STATIONS } from './prayer';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const BURN_MS = 24 * 3600 * 1000;
const STORE_CAP = 400;
const RETURN_CAP = 160;
const RATE_WINDOW_MS = 60_000;
const RATE_KV_TTL_SECONDS = 120;
const WALL_KEY = 'votive:wall';

type Station = (typeof STATIONS)[number];

interface Candle {
  id: string;
  station: Station;
  t: number;
  pid: string;
}

interface Wall {
  candles: Candle[];
  total: number;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

function prune(wall: Wall, now: number): Wall {
  return {
    candles: wall.candles.filter((c) => now - c.t < BURN_MS).slice(0, STORE_CAP),
    total: wall.total,
  };
}

async function loadWall(env: Env, now: number): Promise<Wall> {
  if (!env.VISITS) return { candles: [], total: 0 };
  const raw = await env.VISITS.get(WALL_KEY);
  if (!raw) return { candles: [], total: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<Wall>;
    return prune(
      {
        candles: Array.isArray(parsed.candles) ? (parsed.candles as Candle[]) : [],
        total: typeof parsed.total === 'number' ? parsed.total : 0,
      },
      now,
    );
  } catch {
    return { candles: [], total: 0 };
  }
}

async function saveWall(env: Env, wall: Wall): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(WALL_KEY, JSON.stringify(wall));
}

export const onRequestOptions: PagesFunction<Env> = () =>
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
  const now = Date.now();
  const wall = await loadWall(env, now);
  return json(
    {
      ok: true,
      candles: wall.candles.slice(0, RETURN_CAP),
      burning: wall.candles.length,
      total: wall.total,
      now,
    },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { sessionId?: unknown; station?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  const station = typeof body.station === 'string' ? (body.station as Station) : null;
  if (!station || !STATIONS.includes(station)) {
    return json({ ok: false, reason: 'not-a-station', stations: STATIONS }, { status: 400 });
  }

  const pid = (await sha256(sessionId)).slice(0, 10);
  const rateKey = `votive:rate:${pid}`;
  const lastRaw = await env.VISITS.get(rateKey);
  const lastTs = lastRaw ? parseInt(lastRaw, 10) : 0;
  const now = Date.now();
  if (Number.isFinite(lastTs) && now - lastTs < RATE_WINDOW_MS) {
    const retryMs = RATE_WINDOW_MS - (now - lastTs);
    return json(
      { ok: false, reason: 'rate-limited', retryAfterSec: Math.max(1, Math.ceil(retryMs / 1000)) },
      { status: 429 },
    );
  }
  await env.VISITS.put(rateKey, String(now), { expirationTtl: RATE_KV_TTL_SECONDS });

  const wall = await loadWall(env, now);
  const candle: Candle = {
    id: 'v-' + now.toString(36) + Math.random().toString(36).slice(2, 7),
    station,
    t: now,
    pid,
  };
  wall.candles.unshift(candle);
  wall.total += 1;
  await saveWall(env, prune(wall, now));

  return json({ ok: true, candle, burning: wall.candles.length, total: wall.total });
};
