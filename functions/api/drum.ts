/**
 * /api/drum — the cookie-clicker backend for the Drum Room.
 *
 * Tracks two counters in the same VISITS KV namespace we already use:
 *
 *   drum:total                — global cumulative drum count (never decays)
 *   drum:session:{sessionHash} — per-client cumulative drums (for claims)
 *
 * The client batches taps locally and POSTs a delta every ~10 clicks or 5s
 * so we don't beat up KV. Server clamps any single increment to 1000 to
 * prevent trivial spam (a bot mashing refresh-with-huge-delta still caps).
 *
 * When the DRUM FA1.2 token ships (Phase C), a `/api/drum/claim` endpoint
 * will sign off-chain claim tickets this session can spend on the contract.
 * For now, this endpoint just aggregates — the Drum Room's "Claim" button
 * is a placeholder.
 *
 * POST /api/drum
 *   body: { delta: number, sessionId: string }
 *   response: { ok, globalTotal, yourTotal }
 *
 * GET  /api/drum?sessionId=...
 *   response: { globalTotal, yourTotal }
 */

import { sha256, type Env } from './visit';
import { updateLeaderboard } from './drum/top';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const KEY_GLOBAL = 'drum:total';
const SESSION_PREFIX = 'drum:session:';
// Soft spam guard — no single POST can bump more than this.
const MAX_DELTA_PER_REQ = 1000;
// Session stickiness — long so progress doesn't evaporate between sessions.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadGlobal(env: Env): Promise<number> {
  if (!env.VISITS) return 0;
  const raw = await env.VISITS.get(KEY_GLOBAL);
  return raw ? Number(raw) || 0 : 0;
}

async function loadSession(env: Env, sessionHash: string): Promise<number> {
  if (!env.VISITS) return 0;
  const raw = await env.VISITS.get(`${SESSION_PREFIX}${sessionHash}`);
  return raw ? Number(raw) || 0 : 0;
}

async function hashSession(sessionId: string): Promise<string> {
  return (await sha256(sessionId)).slice(0, 16);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' });

  let body: { delta?: unknown; sessionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const deltaRaw = typeof body.delta === 'number' && Number.isFinite(body.delta)
    ? Math.floor(body.delta)
    : 0;
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  const delta = Math.max(0, Math.min(MAX_DELTA_PER_REQ, deltaRaw));
  if (delta === 0) {
    // No-op — return current state so client can still sync.
    const sessionHash = await hashSession(sessionId);
    const [globalTotal, yourTotal] = await Promise.all([
      loadGlobal(env),
      loadSession(env, sessionHash),
    ]);
    return json({ ok: true, globalTotal, yourTotal });
  }

  const sessionHash = await hashSession(sessionId);
  const [globalTotal, yourTotal] = await Promise.all([
    loadGlobal(env),
    loadSession(env, sessionHash),
  ]);
  const nextGlobal = globalTotal + delta;
  const nextYour = yourTotal + delta;

  // KV is eventually-consistent — two near-simultaneous POSTs could clobber.
  // Acceptable for a playful counter. If Mike ever wants strong consistency,
  // switch to Durable Objects; for a drum room, KV is plenty.
  await Promise.all([
    env.VISITS.put(KEY_GLOBAL, String(nextGlobal)),
    env.VISITS.put(
      `${SESSION_PREFIX}${sessionHash}`,
      String(nextYour),
      { expirationTtl: SESSION_TTL_SECONDS },
    ),
    // Fire-and-forget leaderboard update. KV eventual consistency +
    // read-modify-write race is fine for a "top 10" display.
    updateLeaderboard(env, sessionId, nextYour).catch(() => {}),
  ]);

  return json({ ok: true, globalTotal: nextGlobal, yourTotal: nextYour });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sessionId = (url.searchParams.get('sessionId') ?? '').slice(0, 128);
  const [globalTotal, yourTotal] = await Promise.all([
    loadGlobal(env),
    sessionId ? hashSession(sessionId).then((h) => loadSession(env, h)) : Promise.resolve(0),
  ]);
  return json(
    { globalTotal, yourTotal },
    { headers: { 'Cache-Control': 'private, max-age=3' } },
  );
};

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
