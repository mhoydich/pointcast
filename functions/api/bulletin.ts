/**
 * /api/bulletin — community pinboard.
 *
 * Backs /drum-bulletin. Each pin is a one-line note with hearts:
 *   { id, t, body, color, nounId, hearts }
 *
 * Storage in env.VISITS KV:
 *   - One key per pin: `pin:<ts>-<rand>` → JSON
 *   - One index key:   `pins:index`     → JSON array of ids (capped 50)
 *
 * Endpoints:
 *   GET  /api/bulletin              → { pins, count, kvBound }
 *   POST /api/bulletin              → { ok, pin, count }   body: { body, color, nounId }
 *   POST /api/bulletin/heart        → { ok, pin }          body: { id }
 *
 * Routing for the second POST shape: same file responds to both POST
 * to /api/bulletin and POST to /api/bulletin?heart=1 (we read the
 * `heart` query OR the body shape to decide).
 *
 * Mirrors functions/api/letters.ts shape.
 */

import type { Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const INDEX_KEY = 'pins:index';
const MAX_PINS = 50;
const BODY_CAP = 140;
const ALLOWED_COLORS = new Set(['warm', 'bright', 'ocean', 'garden', 'fog', 'rose']);

interface Pin {
  id: string;
  t: number;
  body: string;
  color: string;
  nounId: number;
  hearts: number;
}

function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function loadIndex(env: Env): Promise<string[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function saveIndex(env: Env, ids: string[]): Promise<void> {
  if (!env.VISITS) return;
  try {
    await env.VISITS.put(INDEX_KEY, JSON.stringify(ids.slice(0, MAX_PINS)));
  } catch {
    /* non-fatal */
  }
}

async function loadPin(env: Env, id: string): Promise<Pin | null> {
  if (!env.VISITS) return null;
  const raw = await env.VISITS.get(`pin:${id}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.body === 'string' &&
      typeof parsed.t === 'number' &&
      typeof parsed.nounId === 'number'
    ) {
      return parsed as Pin;
    }
    return null;
  } catch {
    return null;
  }
}

async function savePin(env: Env, p: Pin): Promise<void> {
  if (!env.VISITS) return;
  try {
    await env.VISITS.put(`pin:${p.id}`, JSON.stringify(p));
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

/**
 * GET /api/bulletin
 *   → { pins, count, kvBound }
 *   Returns pins newest-first, hearts included.
 */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.VISITS) {
    return json({ pins: [], count: 0, kvBound: false }, { status: 200 });
  }
  const ids = await loadIndex(env);
  const pins: Pin[] = [];
  for (const id of ids) {
    const p = await loadPin(env, id);
    if (p) pins.push(p);
  }
  return json({ pins, count: pins.length, kvBound: true });
};

/**
 * POST /api/bulletin
 *   body: { body, color, nounId }    → add new pin
 *   body: { heart: id }               → +1 heart on pin id
 *   body: { id, op:'heart' }          → also accepted
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  // Heart path
  if ((typeof body?.heart === 'string' && body.heart) || body?.op === 'heart') {
    const id = (body.heart || body.id) as string;
    if (!env.VISITS) {
      return json({ ok: false, error: 'kv-unbound' }, { status: 200 });
    }
    const pin = await loadPin(env, id);
    if (!pin) return json({ ok: false, error: 'not-found' }, { status: 404 });
    pin.hearts = (pin.hearts || 0) + 1;
    await savePin(env, pin);
    return json({ ok: true, pin });
  }

  // Add path
  const text =
    typeof body.body === 'string'
      ? body.body.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, BODY_CAP)
      : '';
  if (!text) return json({ ok: false, error: 'empty-body' }, { status: 400 });
  const color =
    typeof body.color === 'string' && ALLOWED_COLORS.has(body.color) ? body.color : 'warm';
  let nounId = 0;
  if (typeof body.nounId === 'number' && Number.isFinite(body.nounId)) {
    nounId = Math.max(0, Math.min(1199, Math.floor(body.nounId)));
  } else {
    nounId = Math.floor(Math.random() * 1200);
  }
  const id = `${Date.now()}-${rand()}`;
  const pin: Pin = { id, t: Date.now(), body: text, color, nounId, hearts: 0 };
  if (!env.VISITS) {
    return json({ ok: true, pin, count: 1, kvBound: false });
  }
  await savePin(env, pin);
  const ids = await loadIndex(env);
  ids.unshift(id);
  await saveIndex(env, ids);
  return json({ ok: true, pin, count: Math.min(ids.length, MAX_PINS), kvBound: true });
};
