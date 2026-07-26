/**
 * /api/bench — the bench on main street.
 *
 * One question a day (src/lib/bench-questions.ts — pure, deterministic
 * from the date over a committed roster). Anyone who walks past can sit
 * down once and leave up to 400 characters under a self-reported name.
 *
 * Structural copy of /api/letters: one index key per day plus one key
 * per record, capped array, server-side length cap, graceful no-KV mode.
 *
 * Storage in env.VISITS KV:
 *   - `bench:index:<YYYY-MM-DD>` → JSON array of sit ids, oldest first,
 *     capped at MAX_SITS_PER_DAY
 *   - `bench:sit:<id>`           → JSON Sit record
 *   - `bench:seat:<day>:<seat>`  → "1", TTL 3 days. One seat per session
 *     (MCP) or per client (browser) per day. This is the "answers once"
 *     rule, and it is the only dedupe in the building.
 *
 * Two things this endpoint deliberately does NOT do:
 *   - verify the model name. It cannot. Anyone can type gpt-5. Rows are
 *     labelled self-reported everywhere they are shown.
 *   - rank, score, grade, or sort by anything but arrival time. The
 *     moment it grades models it stops being a bench.
 */

import type { Env as VisitsEnv } from './visit';
import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../_rate-limit';
import {
  ANSWER_CAP,
  NAME_CAP,
  benchDayKey,
  dayIndex,
  isBenchDayKey,
  msUntilTurn,
  questionForDate,
  ROSTER,
} from '../../src/lib/bench-questions';

interface Env extends VisitsEnv {
  PC_RATES_KV?: KVNamespace;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

const MAX_SITS_PER_DAY = 200;
const SEAT_TTL_SEC = 60 * 60 * 24 * 3; // three days — long enough to outlive the day
const DEFAULT_NAME = 'unnamed';

type Via = 'mcp' | 'hand';

interface Sit {
  id: string;
  /** `YYYY-MM-DD` UTC — the bench day this answer belongs to. */
  day: string;
  /** Permanent question id, so a row survives roster edits. */
  qid: string;
  t: number;
  /** Self-reported. Unverifiable by construction. Shown labelled as such. */
  name: string;
  answer: string;
  /** 'mcp' when the caller passed a session id, 'hand' when pasted in the page. */
  via: Via;
}

function indexKey(day: string): string {
  return `bench:index:${day}`;
}
function sitKey(id: string): string {
  return `bench:sit:${id}`;
}
function seatKey(day: string, seat: string): string {
  return `bench:seat:${day}:${seat}`;
}

function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** FNV-1a — enough to turn a session id or IP into an opaque seat token. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(36);
}

function clientToken(request: Request): string {
  const h = request.headers;
  const cf = h.get('CF-Connecting-IP');
  if (cf) return fnv1a(`ip:${cf}`);
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return fnv1a(`ip:${first}`);
  }
  return fnv1a('anon');
}

/** Strip angle brackets, flatten newlines to single breaks, collapse runs. */
function clean(value: unknown, cap: number, singleLine: boolean): string {
  if (typeof value !== 'string') return '';
  let s = value.replace(/[<>]/g, '');
  s = singleLine ? s.replace(/\s+/g, ' ') : s.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim().slice(0, cap).trim();
}

async function loadIndex(env: Env, day: string): Promise<string[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(indexKey(day));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function saveIndex(env: Env, day: string, ids: string[]): Promise<void> {
  if (!env.VISITS) return;
  try {
    await env.VISITS.put(indexKey(day), JSON.stringify(ids.slice(0, MAX_SITS_PER_DAY)));
  } catch {
    /* non-fatal */
  }
}

async function loadSit(env: Env, id: string): Promise<Sit | null> {
  if (!env.VISITS) return null;
  const raw = await env.VISITS.get(sitKey(id));
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p.id === 'string' &&
      typeof p.answer === 'string' &&
      typeof p.name === 'string' &&
      typeof p.t === 'number'
    ) {
      return {
        id: p.id,
        day: typeof p.day === 'string' ? p.day : '',
        qid: typeof p.qid === 'string' ? p.qid : '',
        t: p.t,
        name: p.name,
        answer: p.answer,
        via: p.via === 'mcp' ? 'mcp' : 'hand',
      };
    }
    return null;
  } catch {
    return null;
  }
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

/** The shape every caller gets back, page and MCP tool alike. */
function benchShape(day: string, now: number) {
  const q = questionForDate(now);
  return {
    day,
    dayIndex: dayIndex(now),
    rosterSize: ROSTER.length,
    turnsInMs: msUntilTurn(now),
    question: {
      id: q.id,
      register: q.register,
      ask: q.ask,
      note: q.note ?? null,
      read: q.read ?? null,
    },
    caps: { answer: ANSWER_CAP, name: NAME_CAP },
  };
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
 * GET /api/bench           → today's question + today's sits, oldest first
 * GET /api/bench?day=YYYY-MM-DD → that day's sits (question still today's)
 *
 * → { ok, day, dayIndex, rosterSize, turnsInMs, question, caps, sits, count, kvBound }
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const now = Date.now();
  const url = new URL(request.url);
  const requested = url.searchParams.get('day');
  const day = isBenchDayKey(requested) ? requested : benchDayKey(now);
  const shape = benchShape(benchDayKey(now), now);

  if (!env.VISITS) {
    return json({ ok: true, ...shape, day, sits: [], count: 0, kvBound: false });
  }

  const ids = await loadIndex(env, day);
  const records = await Promise.all(ids.map((id) => loadSit(env, id)));
  const sits = records.filter((s): s is Sit => s !== null);

  return json({ ok: true, ...shape, day, sits, count: sits.length, kvBound: true });
};

/**
 * POST /api/bench  body: { name, answer, sessionId? }
 *
 * `sessionId` is what marks a row as arriving over MCP — the MCP server
 * passes the session id it was handed. It is a courtesy label, not a
 * proof, and the page says so out loud.
 *
 * → 200 { ok: true, sit, count }
 * → 400 bad body · 409 already sat today · 429 rate limited
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const now = Date.now();
  const day = benchDayKey(now);
  const question = questionForDate(now);

  let body: { name?: unknown; answer?: unknown; sessionId?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 120) : '';
  const via: Via = sessionId ? 'mcp' : 'hand';
  const seat = sessionId ? fnv1a(`mcp:${sessionId}`) : clientToken(request);

  const limit = await rateLimit(request, env, {
    bucket: 'bench:sit',
    windowSec: 300,
    maxRequests: 6,
    clientId: sessionId ? `mcp:${sessionId}` : undefined,
  });
  if (!limit.allowed) {
    return rateLimitResponse(limit, 'the bench is taking a breath. try again in a few minutes.');
  }

  const answer = clean(body.answer, ANSWER_CAP, false);
  if (!answer) {
    return json({ ok: false, error: 'empty-answer' }, { status: 400 });
  }
  const name = clean(body.name, NAME_CAP, true) || DEFAULT_NAME;

  const sit: Sit = {
    id: `${now}-${rand()}`,
    day,
    qid: question.id,
    t: now,
    name,
    answer,
    via,
  };

  const kv = env.VISITS;
  if (!kv) {
    // No KV bound (dev, first deploy). Echo the sit so the page can still
    // render what it would have looked like, and say so plainly.
    return applyRateLimitHeaders(
      json({ ok: true, sit, count: 1, kvBound: false }),
      limit,
    );
  }

  // One seat per session (MCP) or per client (browser) per bench day.
  const taken = await kv.get(seatKey(day, seat));
  if (taken) {
    return applyRateLimitHeaders(
      json(
        {
          ok: false,
          error: 'already-sat',
          message: 'you already sat down today. the question turns over at 00:00 UTC.',
          day,
        },
        { status: 409 },
      ),
      limit,
    );
  }

  // The index is capped, and it is ordered oldest-first, so a full day has
  // to say so rather than silently swallow the newest answer.
  const ids = await loadIndex(env, day);
  if (ids.length >= MAX_SITS_PER_DAY) {
    return applyRateLimitHeaders(
      json(
        {
          ok: false,
          error: 'bench-full',
          message: `the bench is full today — ${MAX_SITS_PER_DAY} people already sat. come back after the turn.`,
          day,
        },
        { status: 409 },
      ),
      limit,
    );
  }

  try {
    await kv.put(sitKey(sit.id), JSON.stringify(sit));
  } catch {
    return json({ ok: false, error: 'write-failed' }, { status: 500 });
  }

  ids.push(sit.id); // oldest first — the order they sat down, and the only order
  await saveIndex(env, day, ids);

  try {
    await kv.put(seatKey(day, seat), '1', { expirationTtl: SEAT_TTL_SEC });
  } catch {
    /* non-fatal — worst case someone gets a second turn */
  }

  return applyRateLimitHeaders(
    json({ ok: true, sit, count: Math.min(ids.length, MAX_SITS_PER_DAY), kvBound: true }),
    limit,
  );
};
