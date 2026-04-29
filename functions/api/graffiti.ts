/**
 * /api/graffiti — anonymous shared wall.
 *
 * Backs /drum-graffiti. Each stroke is a small JSON object:
 *   { id, t, x, y, text, color, nounId }
 *
 * Storage in env.VISITS KV:
 *   - One key: `graffiti:wall` → JSON array of strokes (cap 200)
 *   - Whole-wall write keeps things simple and consistent.
 *
 * Endpoints:
 *   GET  /api/graffiti           → { strokes, count, kvBound }
 *   POST /api/graffiti           → { ok, stroke, count }
 *     body: { x, y, text, color, nounId }
 *
 * No moderation — text is sanitized (strip < and >) and capped at 12
 * chars. Strokes layer on top of each other in time order.
 *
 * Mirrors functions/api/letters.ts and bulletin.ts but with a single
 * whole-wall key (no per-stroke key) since the wall is small + the
 * cost of one full read+write per POST is acceptable.
 */

import type { Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const WALL_KEY = 'graffiti:wall';
const MAX_STROKES = 200;
const TEXT_CAP = 12;
const ALLOWED_COLORS = new Set(['cyan', 'magenta', 'yellow', 'lime', 'orange', 'white']);

interface Stroke {
  id: string;
  t: number;
  x: number; // 0..1 fractional position on the wall
  y: number;
  text: string;
  color: string;
  nounId: number;
}

function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

function clamp01(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  return Math.max(0, Math.min(1, n));
}

async function loadWall(env: Env): Promise<Stroke[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(WALL_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        typeof s.t === 'number' &&
        typeof s.x === 'number' &&
        typeof s.y === 'number' &&
        typeof s.text === 'string',
    ) as Stroke[];
  } catch {
    return [];
  }
}

async function saveWall(env: Env, strokes: Stroke[]): Promise<void> {
  if (!env.VISITS) return;
  try {
    await env.VISITS.put(WALL_KEY, JSON.stringify(strokes.slice(0, MAX_STROKES)));
  } catch {
    /* non-fatal */
  }
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
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
  if (!env.VISITS) return json({ strokes: [], count: 0, kvBound: false });
  const strokes = await loadWall(env);
  return json({ strokes, count: strokes.length, kvBound: true });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const text =
    typeof body.text === 'string'
      ? body.text.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, TEXT_CAP)
      : '';
  if (!text) return json({ ok: false, error: 'empty-text' }, { status: 400 });
  const color =
    typeof body.color === 'string' && ALLOWED_COLORS.has(body.color) ? body.color : 'cyan';
  const x = clamp01(body.x);
  const y = clamp01(body.y);
  let nounId = 0;
  if (typeof body.nounId === 'number' && Number.isFinite(body.nounId)) {
    nounId = Math.max(0, Math.min(1199, Math.floor(body.nounId)));
  } else {
    nounId = Math.floor(Math.random() * 1200);
  }

  const stroke: Stroke = {
    id: `${Date.now()}-${rand()}`,
    t: Date.now(),
    x,
    y,
    text,
    color,
    nounId,
  };

  if (!env.VISITS) {
    return json({ ok: true, stroke, count: 1, kvBound: false });
  }
  const wall = await loadWall(env);
  wall.unshift(stroke);
  const trimmed = wall.slice(0, MAX_STROKES);
  await saveWall(env, trimmed);
  return json({ ok: true, stroke, count: trimmed.length, kvBound: true });
};
