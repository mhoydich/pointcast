/**
 * /api/letters — letters left for a future visitor.
 *
 * Backs /drum-letters. Each letter is a small JSON object:
 *   { id, t, body, color, nounId, delivered_count }
 *
 * Storage in env.VISITS KV:
 *   - One key per letter: `letter:<ts>-<rand>` → JSON
 *   - One index key: `letters:index` → JSON array of ids (capped at 200)
 *
 * The index lets us pick the oldest-undelivered letter cheaply without
 * a `list` call on every GET. We store delivered_count in the letter
 * record itself so the next reader sees how many people have seen it.
 *
 * No moderation here — body is sanitized client-side (strip < and >).
 * 500-char hard cap server-side too.
 */

import type { Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const INDEX_KEY = 'letters:index';
const MAX_LETTERS = 200;
const BODY_CAP = 500;
const ALLOWED_COLORS = new Set(['warm', 'bright', 'ocean', 'garden', 'fog', 'rose']);

interface Letter {
  id: string;
  t: number;
  body: string;
  color: string;
  nounId: number;
  delivered_count: number;
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
  const trimmed = ids.slice(0, MAX_LETTERS);
  try {
    await env.VISITS.put(INDEX_KEY, JSON.stringify(trimmed));
  } catch {
    /* non-fatal */
  }
}

async function loadLetter(env: Env, id: string): Promise<Letter | null> {
  if (!env.VISITS) return null;
  const raw = await env.VISITS.get(`letter:${id}`);
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
      return parsed as Letter;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveLetter(env: Env, l: Letter): Promise<void> {
  if (!env.VISITS) return;
  try {
    await env.VISITS.put(`letter:${l.id}`, JSON.stringify(l));
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
 * GET /api/letters?exclude=id1,id2,id3
 *   → { letter, count } where letter is the next-undelivered letter for
 *     this caller (excluding ids already seen) and count is total
 *     letters in the queue.
 *   → { letter: null, count } if there's nothing left to deliver.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) {
    return json({ letter: null, count: 0, kvBound: false }, { status: 200 });
  }
  const url = new URL(request.url);
  const excludeRaw = url.searchParams.get('exclude') || '';
  const exclude = new Set(
    excludeRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const ids = await loadIndex(env);
  const remaining = ids.filter((id) => !exclude.has(id));
  if (remaining.length === 0) {
    return json({ letter: null, count: ids.length, kvBound: true });
  }
  // Pick a random one (oldest-first weighting could go here later)
  const pickId = remaining[Math.floor(Math.random() * remaining.length)];
  const letter = await loadLetter(env, pickId);
  if (!letter) {
    // Stale index — drop and retry once
    const cleaned = ids.filter((id) => id !== pickId);
    await saveIndex(env, cleaned);
    return json({ letter: null, count: cleaned.length, kvBound: true });
  }
  // Increment delivered_count
  letter.delivered_count = (letter.delivered_count || 0) + 1;
  await saveLetter(env, letter);
  return json({ letter, count: ids.length, kvBound: true });
};

/**
 * POST /api/letters  body: { body, color, nounId }
 *   → { ok, letter, count }
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { body?: unknown; color?: unknown; nounId?: unknown } = {};
  try {
    body = (await request.json()) as { body?: unknown; color?: unknown; nounId?: unknown };
  } catch {
    return json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }
  const text =
    typeof body.body === 'string'
      ? body.body.replace(/[<>]/g, '').trim().slice(0, BODY_CAP)
      : '';
  if (!text) {
    return json({ ok: false, error: 'empty-body' }, { status: 400 });
  }
  const color = typeof body.color === 'string' && ALLOWED_COLORS.has(body.color) ? body.color : 'warm';
  let nounId = 0;
  if (typeof body.nounId === 'number' && Number.isFinite(body.nounId)) {
    nounId = Math.max(0, Math.min(1199, Math.floor(body.nounId)));
  } else {
    nounId = Math.floor(Math.random() * 1200);
  }
  const id = `${Date.now()}-${rand()}`;
  const letter: Letter = {
    id,
    t: Date.now(),
    body: text,
    color,
    nounId,
    delivered_count: 0,
  };
  if (!env.VISITS) {
    return json({ ok: true, letter, count: 1, kvBound: false });
  }
  await saveLetter(env, letter);
  const ids = await loadIndex(env);
  ids.unshift(id);
  await saveIndex(env, ids);
  return json({ ok: true, letter, count: Math.min(ids.length, MAX_LETTERS), kvBound: true });
};
