/**
 * /api/bell-post — the rack of hung phrases behind /bell-post.
 *
 * Bell Post is time-shifted multiplayer: play a short run of bells and hang
 * it on the wall for whoever comes next. Nobody has to be online at the same
 * second — the wall holds what people left and plays it back as a round.
 * (Stop 02 on the 2026-07-25 concept board; sibling of /bell-choir, which is
 * the be-here-now version.)
 *
 * Storage (VISITS KV, same shared-wall pattern as /api/votive):
 *   bellpost:wall → JSON { phrases: [...newest first], total }
 *     · a phrase: { id, notes: [{ n: 0-11, t: ms offset }], voice,
 *                   avatar, hue, t, pid }
 *     · pruned to PHRASE_TTL_MS on every load, stored list capped at
 *       STORE_CAP newest (the page shows fewer)
 *   bellpost:rate:{pid} → ms timestamp · one hang per RATE_WINDOW_MS
 *
 * Identity: derived server-side from sha256 of the caller's sessionId —
 * avatar (a Noun seed) and hue are assigned here, never trusted from the
 * client, so nobody can hang a phrase wearing someone else's Noun. Same
 * derivation shape as the DrumRoomV2 worker's identityFor().
 *
 * Validation is strict because playback is automatic on other people's
 * machines: 1–8 notes, pitches 0–11, offsets 0–6000ms non-decreasing,
 * voice from the fixed set. Anything else is a 400, never a truncation —
 * a phrase that had notes silently dropped would play back as something
 * its author didn't write.
 *
 * GET → { ok, phrases (newest first, ≤ RETURN_CAP), total, now }
 * POST { sessionId, notes, voice } → hang a phrase
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const WALL_KEY = 'bellpost:wall';
const PHRASE_TTL_MS = 7 * 24 * 3600 * 1000; // a week — the wall goes quiet only after a week of nobody visiting
// Store far more than we show: RETURN_CAP is the rack, the rest is the moat.
// With a 24-slot store a scripted visitor could evict every genuine phrase in
// one burst; at 100, even a full IP-budget flood leaves the wall's history
// recoverable and the drip needed to flush it crosses into obviously-hostile
// territory.
const STORE_CAP = 100;
const RETURN_CAP = 10;
const RATE_WINDOW_MS = 30_000;
const RATE_KV_TTL_SECONDS = 90;
/** The session key is per-tab courtesy (honest clients get a precise retry);
 *  the IP key is the abuse backstop — sessionId is client-minted, so rotating
 *  it must not mint a fresh rate window. A small budget rather than 1 so a
 *  family behind one router can each hang something. */
const IP_BUDGET_PER_WINDOW = 3;
const MAX_NOTES = 8;
const MAX_OFFSET_MS = 6000;
const VOICES = ['chime', 'bowl', 'glass'] as const;

type Voice = (typeof VOICES)[number];

interface PhraseNote {
  n: number;
  t: number;
}

interface Phrase {
  id: string;
  notes: PhraseNote[];
  voice: Voice;
  avatar: number;
  hue: number;
  t: number;
  pid: string;
}

interface Wall {
  phrases: Phrase[];
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
    phrases: wall.phrases.filter((p) => now - p.t < PHRASE_TTL_MS).slice(0, STORE_CAP),
    total: wall.total,
  };
}

async function loadWall(env: Env, now: number): Promise<Wall> {
  if (!env.VISITS) return { phrases: [], total: 0 };
  const raw = await env.VISITS.get(WALL_KEY);
  if (!raw) return { phrases: [], total: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<Wall>;
    return prune(
      {
        phrases: Array.isArray(parsed.phrases) ? (parsed.phrases as Phrase[]) : [],
        total: typeof parsed.total === 'number' ? parsed.total : 0,
      },
      now,
    );
  } catch {
    return { phrases: [], total: 0 };
  }
}

async function saveWall(env: Env, wall: Wall): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(WALL_KEY, JSON.stringify(wall));
}

/** Parse and validate the notes array, or return null. Never repairs. */
function parseNotes(value: unknown): PhraseNote[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_NOTES) return null;
  const notes: PhraseNote[] = [];
  let prevT = 0;
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    const n = (item as Record<string, unknown>).n;
    const t = (item as Record<string, unknown>).t;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 11) return null;
    if (typeof t !== 'number' || !Number.isFinite(t)) return null;
    const ms = Math.round(t);
    if (ms < 0 || ms > MAX_OFFSET_MS || ms < prevT) return null;
    prevT = ms;
    notes.push({ n, t: ms });
  }
  if (notes[0] && notes[0].t !== 0) {
    // first note anchors the phrase — shift so playback starts immediately
    const shift = notes[0].t;
    for (const note of notes) note.t -= shift;
  }
  return notes;
}

function hashToNumber(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 6), 16);
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
      phrases: wall.phrases.slice(0, RETURN_CAP),
      hanging: wall.phrases.length,
      total: wall.total,
      now,
    },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { sessionId?: unknown; notes?: unknown; voice?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) return json({ ok: false, reason: 'missing-session' }, { status: 400 });

  const notes = parseNotes(body.notes);
  if (!notes) {
    return json(
      { ok: false, reason: 'bad-phrase', rules: `1-${MAX_NOTES} notes, n 0-11, t 0-${MAX_OFFSET_MS}ms non-decreasing` },
      { status: 400 },
    );
  }

  const voice = typeof body.voice === 'string' && (VOICES as readonly string[]).includes(body.voice)
    ? (body.voice as Voice)
    : 'chime';

  const pid = (await sha256(sessionId)).slice(0, 10);
  const now = Date.now();

  // Per-session window: precise retryMs for honest clients.
  const rateKey = `bellpost:rate:${pid}`;
  const lastRaw = await env.VISITS.get(rateKey);
  const lastTs = lastRaw ? Number.parseInt(lastRaw, 10) : 0;
  if (Number.isFinite(lastTs) && now - lastTs < RATE_WINDOW_MS) {
    return json(
      { ok: false, reason: 'one-at-a-time', retryMs: RATE_WINDOW_MS - (now - lastTs) },
      { status: 429 },
    );
  }

  // Per-IP budget: the backstop the session key can't be. sessionId is
  // whatever the client says it is; the connecting address is not.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipPid = (await sha256(`bellpost-ip:${ip}`)).slice(0, 10);
  const ipKey = `bellpost:rateip:${ipPid}`;
  let ipCount = 0;
  let ipWindowStart = now;
  const ipRaw = await env.VISITS.get(ipKey);
  if (ipRaw) {
    try {
      const parsed = JSON.parse(ipRaw) as { c?: number; t?: number };
      if (typeof parsed.t === 'number' && now - parsed.t < RATE_WINDOW_MS) {
        ipCount = typeof parsed.c === 'number' ? parsed.c : 0;
        ipWindowStart = parsed.t;
      }
    } catch {}
  }
  if (ipCount >= IP_BUDGET_PER_WINDOW) {
    return json(
      { ok: false, reason: 'one-at-a-time', retryMs: RATE_WINDOW_MS - (now - ipWindowStart) },
      { status: 429 },
    );
  }

  // Noun + hue assigned here, from the hash — the client never sends them.
  const idHex = await sha256(`bellpost:${pid}`);
  const phrase: Phrase = {
    id: crypto.randomUUID(),
    notes,
    voice,
    avatar: hashToNumber(idHex, 0) % 1200,
    hue: hashToNumber(idHex, 6) % 360,
    t: now,
    pid,
  };

  // Claim both rate keys BEFORE the wall write (votive's ordering) — it
  // narrows the check-then-act window under concurrent posts.
  await env.VISITS.put(rateKey, String(now), { expirationTtl: RATE_KV_TTL_SECONDS });
  await env.VISITS.put(
    ipKey,
    JSON.stringify({ c: ipCount + 1, t: ipCount === 0 ? now : ipWindowStart }),
    { expirationTtl: RATE_KV_TTL_SECONDS },
  );

  // Known, accepted limit: KV is last-write-wins, so two visitors hanging in
  // the same instant can drop one phrase. The whole town shares this ceiling
  // (see /api/votive); the fix if it ever matters is a Durable Object, and
  // /bell-choir already runs one we could serialize through.
  const wall = await loadWall(env, now);
  wall.phrases.unshift(phrase);
  wall.total += 1;
  const pruned = prune(wall, now);

  await saveWall(env, pruned);

  return json({
    ok: true,
    phrase,
    hanging: pruned.phrases.length,
    total: pruned.total,
  });
};
