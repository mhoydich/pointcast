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
 *   GET  /api/bulletin?board=thursday[&week=YYYY-MM-DD]
 *                                   → { ok, board, week, open, opensAt, notes, count }
 *   POST /api/bulletin              → { ok, board, week, pin, count }
 *                                     body: { board:'thursday', body }
 *                                     403 { ok:false, error:'closed', opensAt } when shut
 *
 * Routing for the second POST shape: same file responds to both POST
 * to /api/bulletin and POST to /api/bulletin?heart=1 (we read the
 * `heart` query OR the body shape to decide).
 *
 * Mirrors functions/api/letters.ts shape.
 *
 * ── The Thursday board (added 2026-07-26, backs /thursday) ──────────────────
 * /thursday is a room that keeps hours: Thursday 15:00–19:00 America/
 * Los_Angeles, shut the rest of the week. Requests that carry
 * `board: 'thursday'` take a separate branch that
 *   - recomputes the Pacific window SERVER-SIDE (the page's client-side gate
 *     is presentation, not enforcement),
 *   - 403s with { ok:false, error:'closed', opensAt } outside the window,
 *   - rate-limits to five notes an hour per client,
 *   - writes the pin under the same `pin:<id>` key, but indexes it in a
 *     week-scoped key `thursday:index:<YYYY-MM-DD>` (the PT date of that
 *     Thursday) instead of `pins:index`.
 * Requests WITHOUT `board` take the original code path untouched, so
 * /drum-bulletin keeps working exactly as before.
 */

import type { Env as VisitsEnv } from './visit';
import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../_rate-limit';

/** VISITS for storage, PC_RATES_KV for the Thursday post limiter. */
type Env = VisitsEnv & { PC_RATES_KV?: KVNamespace };

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

/* ─────────────────────────── Thursday board ─────────────────────────────── */

const THURSDAY_PREFIX = 'thursday:index:';
const MAX_THURSDAY_NOTES = 60;
const OPEN_HOUR = 15; // 3pm PT
const SHUT_HOUR = 19; // 7pm PT
const PT = 'America/Los_Angeles';
const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const PT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: PT,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

interface PtNow {
  weekday: string;
  year: number;
  month: number; // 1-based
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function ptNow(d: Date): PtNow {
  const p: Record<string, string> = {};
  for (const part of PT_FORMATTER.formatToParts(d)) p[part.type] = part.value;
  return {
    weekday: p.weekday,
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    // hour12:false can render midnight as "24" in some ICU builds.
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** Offset in ms such that ptWallClock === utcInstant + offset. Negative. */
function ptOffsetMs(d: Date): number {
  const p = ptNow(d);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - Math.floor(d.getTime() / 1000) * 1000;
}

/** Exact UTC instant of a Pacific wall-clock moment. DST-correct. */
function ptWallToUTC(year: number, month: number, day: number, hour: number): number {
  const naive = Date.UTC(year, month - 1, day, hour, 0, 0);
  let t = naive + 8 * 3600000;
  for (let i = 0; i < 3; i++) t = naive - ptOffsetMs(new Date(t));
  return t;
}

function shiftDays(p: PtNow, n: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day) + n * 86400000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isOpenPT(p: PtNow): boolean {
  return p.weekday === 'Thu' && p.hour >= OPEN_HOUR && p.hour < SHUT_HOUR;
}

/** ISO instant of the next Thursday 15:00 PT. */
function nextOpenISO(p: PtNow): string {
  let ahead = (4 - (DAY_INDEX[p.weekday] ?? 0) + 7) % 7;
  if (ahead === 0 && p.hour >= OPEN_HOUR) ahead = 7;
  const t = shiftDays(p, ahead);
  return new Date(ptWallToUTC(t.year, t.month, t.day, OPEN_HOUR)).toISOString();
}

/**
 * PT date of the Thursday whose board is currently live. Before 15:00 on a
 * Thursday the live board is still the previous week's — the new one opens
 * with the room.
 */
function currentWeekKey(p: PtNow): string {
  let back = ((DAY_INDEX[p.weekday] ?? 0) - 4 + 7) % 7;
  if (p.weekday === 'Thu' && p.hour < OPEN_HOUR) back = 7;
  const t = shiftDays(p, -back);
  return `${t.year}-${pad2(t.month)}-${pad2(t.day)}`;
}

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

async function loadWeekIndex(env: Env, week: string): Promise<string[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(`${THURSDAY_PREFIX}${week}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
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
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // ── Thursday board. Everything below this block is the original path. ──
  const params = new URL(request.url).searchParams;
  if (params.get('board') === 'thursday') {
    const p = ptNow(new Date());
    const asked = params.get('week');
    const week = asked && WEEK_RE.test(asked) ? asked : currentWeekKey(p);
    const open = isOpenPT(p);
    if (!env.VISITS) {
      return json({ ok: true, board: 'thursday', week, open, notes: [], count: 0, kvBound: false });
    }
    const ids = await loadWeekIndex(env, week);
    const notes: Pin[] = [];
    for (const id of ids) {
      const pin = await loadPin(env, id);
      if (pin) notes.push(pin);
    }
    return json(
      {
        ok: true,
        board: 'thursday',
        week,
        open,
        opensAt: open ? null : nextOpenISO(p),
        notes,
        count: notes.length,
        kvBound: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

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

  // ── Thursday board. Everything below this block is the original path,
  //    reached by every request that does not carry `board: 'thursday'`. ──
  if (body?.board === 'thursday') {
    const rl = await rateLimit(request, env, {
      bucket: 'thursday:post',
      windowSec: 3600,
      maxRequests: 5,
    });
    if (!rl.allowed) return rateLimitResponse(rl, 'five lines an hour is plenty');

    const p = ptNow(new Date());
    if (!isOpenPT(p)) {
      return json({ ok: false, error: 'closed', opensAt: nextOpenISO(p) }, { status: 403 });
    }

    const line =
      typeof body.body === 'string'
        ? body.body.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, BODY_CAP)
        : '';
    if (!line) return json({ ok: false, error: 'empty-body' }, { status: 400 });

    const nounId =
      typeof body.nounId === 'number' && Number.isFinite(body.nounId)
        ? Math.max(0, Math.min(1199, Math.floor(body.nounId)))
        : Math.floor(Math.random() * 1200);
    const week = currentWeekKey(p);
    const noteId = `${Date.now()}-${rand()}`;
    const note: Pin = { id: noteId, t: Date.now(), body: line, color: 'garden', nounId, hearts: 0 };

    if (!env.VISITS) {
      return json({ ok: true, board: 'thursday', week, pin: note, count: 1, kvBound: false });
    }
    await savePin(env, note);
    const ids = await loadWeekIndex(env, week);
    ids.unshift(noteId);
    try {
      await env.VISITS.put(
        `${THURSDAY_PREFIX}${week}`,
        JSON.stringify(ids.slice(0, MAX_THURSDAY_NOTES)),
      );
    } catch {
      /* non-fatal — the pin itself is already written */
    }
    return applyRateLimitHeaders(
      json({
        ok: true,
        board: 'thursday',
        week,
        pin: note,
        count: Math.min(ids.length, MAX_THURSDAY_NOTES),
        kvBound: true,
      }),
      rl,
    );
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
