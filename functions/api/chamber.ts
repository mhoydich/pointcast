/**
 * /api/chamber — shared state for the Presence Bus surfaces.
 *
 * Per Mike + codex 2026-05-05 overnight sprint plan: the wing has a
 * lot of solo meditatives. The Presence Bus surfaces (drum-room,
 * drum-echo, drum-procession, drum-now) need shared KV-backed state
 * so visitors can see each other.
 *
 * Distinct from the existing /api/room (DO-backed cursor+chat per
 * URL); this is a simple polling KV bus shared across multiple
 * chamber-themed surfaces.
 *
 * One endpoint, multiple "kinds":
 *
 *   kind=lobby      — drum-room: visitors as brass lights + room-wide rings
 *   kind=echo       — drum-echo: 5-hit phrases, async pickup
 *   kind=procession — drum-procession: collective ceremonial advance
 *   kind=now        — drum-now: who's here in the wing right now
 *   kind=threshold  — drum-threshold: arrival candles
 *   kind=offering   — drum-offering: visitor intentions archive
 *
 * GET ?kind=foo → { ok, kind, state, now }
 * POST { kind, action, sessionId, ... } → updated state
 */

import { sha256, type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

const KINDS = ['lobby', 'echo', 'procession', 'now', 'threshold', 'offering'] as const;
type Kind = typeof KINDS[number];

const TTL: Record<Kind, number> = {
  lobby: 600,
  echo: 7 * 24 * 3600,
  procession: 14 * 24 * 3600,
  now: 90,
  threshold: 24 * 3600,
  offering: 14 * 24 * 3600,
};

const PRESENCE_WINDOW_MS = 30000;

interface Visitor { pid: string; joinedAt: number; lastSeen: number; nounId: number; hue: number; }
interface Ring { pid: string; t: number; hue: number; nounId: number; }
interface EchoPhrase { id: string; pid: string; t: number; pattern: number[]; replies: number; }
interface ProcessionStep { pid: string; t: number; step: number; }
interface Offering { pid: string; t: number; nounId: number; intention: string; hue: number; }

interface LobbyState { visitors: Visitor[]; rings: Ring[]; ringCount: number; }
interface EchoState { phrases: EchoPhrase[]; }
interface ProcessionState { totalSteps: number; lastFiveSteps: ProcessionStep[]; }
interface NowState { visitors: Visitor[]; lastUpdated: number; }
interface ThresholdState { candles: { pid: string; name: string; nounId: number; lit: number }[]; }
interface OfferingState { offerings: Offering[]; }

function nounIdFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 1200;
}
function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 7) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

async function loadState<T>(env: Env, kind: Kind): Promise<T | null> {
  if (!env.VISITS) return null;
  const raw = await env.VISITS.get(`chamber:${kind}:state`);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
async function saveState<T>(env: Env, kind: Kind, state: T): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(`chamber:${kind}:state`, JSON.stringify(state), { expirationTtl: TTL[kind] });
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const kind = (url.searchParams.get('kind') || '') as Kind;
  if (!KINDS.includes(kind)) {
    return json({ ok: false, reason: 'bad-kind', kinds: KINDS }, { status: 400 });
  }
  const state = await loadState<unknown>(env, kind);
  return json(
    { ok: true, kind, state, now: Date.now() },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });

  let body: { kind?: unknown; action?: unknown; sessionId?: unknown; pattern?: unknown; step?: unknown; intention?: unknown; name?: unknown; phraseId?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return json({ ok: false, reason: 'bad-body' }, { status: 400 }); }

  const kind = String(body.kind || '') as Kind;
  if (!KINDS.includes(kind)) {
    return json({ ok: false, reason: 'bad-kind' }, { status: 400 });
  }
  const action = String(body.action || '');
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  const pid = (await sha256(sessionId)).slice(0, 10);
  const nounId = nounIdFromString(pid);
  const hue = hueFromString(pid);
  const now = Date.now();

  if (kind === 'lobby') {
    const state = (await loadState<LobbyState>(env, 'lobby')) ?? { visitors: [], rings: [], ringCount: 0 };
    state.visitors = state.visitors.filter((v) => now - v.lastSeen < PRESENCE_WINDOW_MS);

    if (action === 'ping') {
      const existing = state.visitors.find((v) => v.pid === pid);
      if (existing) existing.lastSeen = now;
      else state.visitors.push({ pid, joinedAt: now, lastSeen: now, nounId, hue });
      state.rings = state.rings.filter((r) => now - r.t < 8000);
      await saveState(env, 'lobby', state);
      return json({ ok: true, state });
    }
    if (action === 'ring') {
      state.rings.unshift({ pid, t: now, hue, nounId });
      state.rings = state.rings.slice(0, 30);
      state.ringCount += 1;
      const existing = state.visitors.find((v) => v.pid === pid);
      if (existing) existing.lastSeen = now;
      else state.visitors.push({ pid, joinedAt: now, lastSeen: now, nounId, hue });
      await saveState(env, 'lobby', state);
      return json({ ok: true, state });
    }
  }

  if (kind === 'echo') {
    const state = (await loadState<EchoState>(env, 'echo')) ?? { phrases: [] };
    if (action === 'leave') {
      const pattern = Array.isArray(body.pattern) ? (body.pattern as unknown[]).slice(0, 5).map((n) => Math.max(0, Math.min(2000, Number(n) || 0))) : [];
      if (pattern.length !== 5) return json({ ok: false, reason: 'pattern-must-be-5' }, { status: 400 });
      const id = `${pid.slice(0, 4)}${now.toString(36).slice(-4)}`;
      state.phrases.unshift({ id, pid, t: now, pattern, replies: 0 });
      state.phrases = state.phrases.slice(0, 60);
      await saveState(env, 'echo', state);
      return json({ ok: true, state, id });
    }
    if (action === 'pickup') {
      const phraseId = String(body.phraseId || '');
      const ph = state.phrases.find((p) => p.id === phraseId);
      if (ph) {
        ph.replies += 1;
        await saveState(env, 'echo', state);
      }
      return json({ ok: true, state });
    }
  }

  if (kind === 'procession') {
    const state = (await loadState<ProcessionState>(env, 'procession')) ?? { totalSteps: 0, lastFiveSteps: [] };
    if (action === 'advance') {
      state.totalSteps += 1;
      state.lastFiveSteps.unshift({ pid, t: now, step: state.totalSteps });
      state.lastFiveSteps = state.lastFiveSteps.slice(0, 5);
      await saveState(env, 'procession', state);
      return json({ ok: true, state });
    }
  }

  if (kind === 'now') {
    const state = (await loadState<NowState>(env, 'now')) ?? { visitors: [], lastUpdated: now };
    state.visitors = state.visitors.filter((v) => now - v.lastSeen < PRESENCE_WINDOW_MS);
    if (action === 'ping') {
      const existing = state.visitors.find((v) => v.pid === pid);
      if (existing) existing.lastSeen = now;
      else state.visitors.push({ pid, joinedAt: now, lastSeen: now, nounId, hue });
      state.lastUpdated = now;
      await saveState(env, 'now', state);
      return json({ ok: true, state });
    }
  }

  if (kind === 'threshold') {
    const state = (await loadState<ThresholdState>(env, 'threshold')) ?? { candles: [] };
    if (action === 'light') {
      const name = String(body.name || '').slice(0, 40).replace(/[<>]/g, '');
      const existing = state.candles.find((c) => c.pid === pid);
      if (existing) {
        existing.name = name;
        existing.nounId = nounId;
        existing.lit = now;
      } else {
        state.candles.push({ pid, name, nounId, lit: now });
        state.candles = state.candles.slice(-40);
      }
      await saveState(env, 'threshold', state);
      return json({ ok: true, state });
    }
  }

  if (kind === 'offering') {
    const state = (await loadState<OfferingState>(env, 'offering')) ?? { offerings: [] };
    if (action === 'leave') {
      const intention = String(body.intention || '').slice(0, 80).replace(/[<>]/g, '');
      if (!intention) return json({ ok: false, reason: 'missing-intention' }, { status: 400 });
      state.offerings.unshift({ pid, t: now, nounId, intention, hue });
      state.offerings = state.offerings.slice(0, 60);
      await saveState(env, 'offering', state);
      return json({ ok: true, state });
    }
  }

  return json({ ok: false, reason: 'unknown-action', action }, { status: 400 });
};
