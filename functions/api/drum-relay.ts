/**
 * /api/drum-relay — async-social rhythm chain.
 *
 * Per Mike 2026-04-30 (late, "keep building"): a relay where a
 * visitor taps 4 beats and they get appended to a community chain.
 * The next visitor hears the chain so far, can extend it with 4
 * more beats, etc. Persistent, async-social, browsable.
 *
 * Storage in env.VISITS KV:
 *   relay:chain → JSON array of last 60 links · 7-day TTL
 *
 * Each link is:
 *   {
 *     id:    "ts-rand"  (8-char nonce + timestamp for ordering),
 *     t:     server timestamp ms,
 *     pid:   sha256(sessionId).slice(0,10),
 *     nounId: number,                  // hashed from sessionId for visual continuity
 *     beats: [number, number, number, number],   // ms offsets within the 4-beat window
 *     bpm:   number | null,            // computed from beat intervals
 *   }
 *
 * GET → { chain: [...], count, now }
 * POST { beats, sessionId, nounId? } → appends a link
 *
 * Validation:
 *   - beats must be exactly 4 numbers
 *   - first beat at t=0 (we store deltas)
 *   - max delta 4000ms (one beat per ~1s max — anything slower is
 *     not really a "rhythm")
 *   - rate-limit: same pid can append at most 1 link per 30s
 *     (lightweight — based on chain history, not a separate KV key)
 *
 * No moderation; chain is purely numeric data, no text input from
 * visitors.
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CHAIN_KEY = 'relay:chain';
const CHAIN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const CHAIN_MAX = 60;
const RATE_LIMIT_MS = 30_000;
const MAX_BEAT_DELTA_MS = 4000;

interface RelayLink {
  id: string;
  t: number;
  pid: string;
  nounId: number;
  beats: number[];
  bpm: number | null;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadChain(env: Env): Promise<RelayLink[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(CHAIN_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveChain(env: Env, chain: RelayLink[]): Promise<void> {
  if (!env.VISITS) return;
  const trimmed = chain.slice(-CHAIN_MAX);
  await env.VISITS.put(CHAIN_KEY, JSON.stringify(trimmed), {
    expirationTtl: CHAIN_TTL_SECONDS,
  });
}

function rand(): string {
  return Math.random().toString(36).slice(2, 10);
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
  const chain = await loadChain(env);
  return json(
    { chain, count: chain.length, now: Date.now() },
    { headers: { 'Cache-Control': 'private, max-age=2' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) {
    return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });
  }

  let body: { beats?: unknown; sessionId?: unknown; nounId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  // Validate beats
  if (!Array.isArray(body.beats) || body.beats.length !== 4) {
    return json({ ok: false, reason: 'beats-must-be-4' }, { status: 400 });
  }
  const beats = (body.beats as unknown[]).map((b) => {
    const n = typeof b === 'number' ? b : Number(b);
    return Number.isFinite(n) ? Math.max(0, Math.min(MAX_BEAT_DELTA_MS, Math.floor(n))) : NaN;
  });
  if (beats.some((b) => Number.isNaN(b))) {
    return json({ ok: false, reason: 'beats-must-be-numbers' }, { status: 400 });
  }
  // Sort ascending (visitor might submit out of order due to async timing)
  beats.sort((a, b) => a - b);
  // First beat to t=0 — we store relative timing
  const t0 = beats[0];
  const beatsZeroed = beats.map((b) => b - t0);

  // Validate sessionId, derive pid
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) {
    return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  }
  const pid = (await sha256(sessionId)).slice(0, 10);

  // Validate / derive nounId
  let nounId = 0;
  if (typeof body.nounId === 'number' && Number.isFinite(body.nounId)) {
    nounId = Math.max(0, Math.min(1199, Math.floor(body.nounId)));
  } else {
    // Derive deterministically from pid
    let h = 0;
    for (let i = 0; i < pid.length; i++) {
      h = ((h << 5) - h + pid.charCodeAt(i)) | 0;
    }
    nounId = Math.abs(h) % 1200;
  }

  // Compute BPM from intervals
  const intervals: number[] = [];
  for (let i = 1; i < beatsZeroed.length; i++) {
    intervals.push(beatsZeroed[i] - beatsZeroed[i - 1]);
  }
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)] || 0;
  const bpm = median > 0 ? Math.round(60_000 / median) : null;

  const now = Date.now();
  const chain = await loadChain(env);

  // Rate-limit: same pid can't append within RATE_LIMIT_MS
  const recent = chain.filter((l) => l.pid === pid && now - (l.t || 0) < RATE_LIMIT_MS);
  if (recent.length > 0) {
    const remainSec = Math.ceil((RATE_LIMIT_MS - (now - recent[0].t)) / 1000);
    return json(
      { ok: false, reason: 'rate-limit', retryAfterSec: remainSec },
      { status: 429 },
    );
  }

  const link: RelayLink = {
    id: `${now}-${rand()}`,
    t: now,
    pid,
    nounId,
    beats: beatsZeroed,
    bpm,
  };
  chain.push(link);
  await saveChain(env, chain);

  return json({ ok: true, link, count: chain.length });
};
