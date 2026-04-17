/**
 * /api/drum/top — leaderboard of top drum-session counters.
 *
 * Kept as a maintained KV key `drum:top` so we don't scan all sessions
 * on every read. Updated whenever /api/drum POST writes a new count:
 *
 *   - If the session is already in the top-N, update its count.
 *   - Else if there's room (< 10 entries) or the new count beats the
 *     current #10, insert + re-sort + trim to top 10.
 *
 * Anonymized: entries store only the first 8 chars of the sha256 of the
 * sessionId (same opaque shape as presence pids) and a stable nounSeed
 * picked once per session for visual identity. No IP, no raw session.
 *
 * GET /api/drum/top
 *   → { entries: [{ rank, hash, nounId, count }, ...] }
 */

import { sha256, type Env } from '../visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const KEY_TOP = 'drum:top';

export interface TopEntry {
  hash: string;   // 8-char session identity, stable per session
  nounId: number; // visual avatar for the leaderboard row
  count: number;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadTop(env: Env): Promise<TopEntry[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(KEY_TOP);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) =>
      typeof e?.hash === 'string' &&
      typeof e?.count === 'number' &&
      typeof e?.nounId === 'number',
    );
  } catch { return []; }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const entries = await loadTop(env);
  const ranked = entries
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((e, i) => ({ rank: i + 1, ...e }));
  return json(
    { entries: ranked },
    { headers: { 'Cache-Control': 'public, max-age=10' } },
  );
};

/**
 * Helper exported for drum.ts to call on every POST. Stays in this file
 * so the leaderboard storage shape has a single source of truth.
 */
export async function updateLeaderboard(
  env: Env,
  sessionId: string,
  newCount: number,
): Promise<void> {
  if (!env.VISITS || !sessionId || newCount <= 0) return;
  const hash = (await sha256(sessionId)).slice(0, 8);
  // Derive a stable noun avatar from sessionId — same session always
  // flies the same flag on the leaderboard.
  const nounSeed = parseInt((await sha256(sessionId + ':noun')).slice(0, 6), 16) % 1200;

  const current = await loadTop(env);
  const existing = current.find((e) => e.hash === hash);
  if (existing) {
    existing.count = newCount;
  } else if (current.length < 10 || newCount > (current[current.length - 1]?.count ?? 0)) {
    current.push({ hash, nounId: nounSeed, count: newCount });
  } else {
    return; // not qualifying; skip write
  }
  current.sort((a, b) => b.count - a.count);
  const top = current.slice(0, 10);
  try {
    await env.VISITS.put(KEY_TOP, JSON.stringify(top));
  } catch { /* non-fatal */ }
}

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
