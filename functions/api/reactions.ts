/**
 * /api/reactions — slackmoji-style reactions on live visitors.
 *
 * Each currently-present visitor has a public `pid` (first 12 chars of their
 * sha256(ip)). Any other visitor can stick an emoji on them; reactions
 * aggregate as counts. Reactions live ~10 minutes (slightly longer than the
 * 5-minute presence TTL) so they don't disappear the instant a visitor
 * goes idle — they linger long enough to feel like the room has a vibe.
 *
 * POST /api/reactions
 *   body: { pid: string, emoji: string, action: 'add' | 'remove', sessionId: string }
 *   - `sessionId` is a client-generated UUID persisted in localStorage; we
 *     hash it server-side before storing, so cleared localStorage doesn't
 *     leave orphaned reactions (good enough — this is playful, not banking).
 *   - The same hashed session can only count once per (pid, emoji); a
 *     duplicate `add` is a no-op. `remove` removes this session's stake.
 *   - Emoji is whitelisted server-side (ALLOWED_EMOJIS in ./visit.ts) to
 *     prevent zalgo / unicode abuse in the shared room.
 *
 * Storage shape (KV key `react:{pid}`):
 *   { "👋": ["sh1","sh2"], "🔥": ["sh3"] }
 *
 * GET reactions is served via GET /api/visit — the visit endpoint already
 * loads presence, so embedding reactions there saves a second round-trip.
 */

import {
  ALLOWED_EMOJIS,
  REACTIONS_PREFIX,
  REACTIONS_TTL_SECONDS,
  sha256,
  type Env,
  type ReactionTuple,
} from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

interface ReactionsDoc {
  [emoji: string]: string[]; // array of hashed sessionIds
}

function aggregate(doc: ReactionsDoc): ReactionTuple[] {
  const tuples: ReactionTuple[] = [];
  for (const emoji of ALLOWED_EMOJIS) {
    const arr = doc[emoji];
    if (Array.isArray(arr) && arr.length > 0) {
      tuples.push({ emoji, count: arr.length });
    }
  }
  return tuples;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) {
    return json({ ok: false, reason: 'kv-not-bound' });
  }

  let body: { pid?: unknown; emoji?: unknown; action?: unknown; sessionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const pid = typeof body.pid === 'string' ? body.pid.slice(0, 12) : '';
  const emoji = typeof body.emoji === 'string' ? body.emoji : '';
  const action = body.action === 'remove' ? 'remove' : 'add';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';

  if (!pid || !/^[a-f0-9]{8,12}$/.test(pid)) {
    return json({ ok: false, reason: 'bad-pid' }, { status: 400 });
  }
  if (!sessionId) {
    return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  }
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return json({ ok: false, reason: 'emoji-not-allowed' }, { status: 400 });
  }

  const sessionHash = (await sha256(sessionId)).slice(0, 16);
  const key = `${REACTIONS_PREFIX}${pid}`;

  // Read-modify-write. KV is eventually-consistent so two near-simultaneous
  // reactions could theoretically collide; for a playful counter that's
  // acceptable. The sessionHash dedupe means collisions can't double-count
  // within the same client session.
  const raw = await env.VISITS.get(key);
  const doc: ReactionsDoc = (() => {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? (parsed as ReactionsDoc) : {};
    } catch {
      return {};
    }
  })();

  const current = Array.isArray(doc[emoji]) ? doc[emoji] : [];
  if (action === 'add') {
    if (!current.includes(sessionHash)) current.push(sessionHash);
  } else {
    const idx = current.indexOf(sessionHash);
    if (idx >= 0) current.splice(idx, 1);
  }
  doc[emoji] = current;

  // Clean out empty emoji buckets so the doc stays compact.
  for (const k of Object.keys(doc)) {
    if (!Array.isArray(doc[k]) || doc[k].length === 0) delete doc[k];
  }

  await env.VISITS.put(key, JSON.stringify(doc), {
    expirationTtl: REACTIONS_TTL_SECONDS,
  });

  return json({ ok: true, pid, reactions: aggregate(doc) });
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
