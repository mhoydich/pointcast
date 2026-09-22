/**
 * /api/paddles/wear — field reports for The Paddle Register.
 *
 * The labs measure a paddle new. Nobody measures it at hour sixty. A player
 * who keeps a bag on Rally (tez-rally.pages.dev/bag/) can press one button
 * and send an anonymous wear report here: hours logged, sessions, the hour
 * the grit first read "fading", the hour it "went dead", months in play, and
 * a rating bucket. No name, no device id, no free text. The paddle page shows
 * aggregates only, and only once three reports are in.
 *
 * Storage (VISITS KV, same pattern as /api/bell-post):
 *   paddles:wear:{paddleId} → JSON { reports: [...newest first], total }
 *     · a report: { t, hours, sessions, months, fadeAt, deadAt, rating, pid }
 *     · stored list capped at STORE_CAP newest
 *   paddles:wear:rate:{pid} and paddles:wear:rateip:{ipHash} → rate keys
 *
 * Validation is hard-range and rejects, never repairs: a report that had
 * fields silently clamped would say something its author didn't log.
 *
 * GET ?id=<paddleId>  → { ok, id, n, aggregates | null }
 * GET ?all=1          → { ok, paddles: { [id]: aggregates } } for every paddle with n ≥ MIN_SHOWN
 * POST { sessionId, paddleId, hours, sessions, months, fadeAt?, deadAt?, rating? }
 */

import { sha256, type Env } from '../visit';
// @ts-ignore — plain module shared with the tests
import { MIN_SHOWN, aggregate, parseReport } from '../../_lib/paddle-wear.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const KEY = (id: string) => `paddles:wear:${id}`;
const INDEX_KEY = 'paddles:wear:index';
const STORE_CAP = 400;
const RATE_WINDOW_MS = 60_000;
const RATE_KV_TTL_SECONDS = 120;
const IP_BUDGET_PER_WINDOW = 4;
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Report {
  t: number;
  hours: number;
  sessions: number;
  months: number;
  fadeAt: number | null;
  deadAt: number | null;
  rating: number | null;
  pid: string;
}
interface Wall { reports: Report[]; total: number }

export interface Aggregates {
  n: number;
  medianHours: number;
  medianSessions: number;
  medianMonths: number;
  fade: { n: number; medianHours: number } | null;
  dead: { n: number; medianHours: number; share: number };
  ratings: Record<string, number>;
  updated: number;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), { ...init, headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) } });
}

async function loadWall(env: Env, id: string): Promise<Wall> {
  if (!env.VISITS) return { reports: [], total: 0 };
  const raw = await env.VISITS.get(KEY(id));
  if (!raw) return { reports: [], total: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<Wall>;
    return { reports: Array.isArray(parsed.reports) ? (parsed.reports as Report[]).slice(0, STORE_CAP) : [], total: typeof parsed.total === 'number' ? parsed.total : 0 };
  } catch {
    return { reports: [], total: 0 };
  }
}

/** Aggregates without the per-report rows. Never returns raw reports. */
const publicView = (id: string, wall: Wall) => ({ id, n: wall.reports.length, aggregates: aggregate(wall.reports) as Aggregates | null, minShown: MIN_SHOWN });

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const cache = { headers: { 'Cache-Control': 'public, max-age=300' } };
  if (url.searchParams.get('all') === '1') {
    const ids: string[] = env.VISITS ? JSON.parse((await env.VISITS.get(INDEX_KEY)) || '[]') : [];
    const paddles: Record<string, unknown> = {};
    for (const id of ids.slice(0, 500)) {
      const wall = await loadWall(env, id);
      const agg = aggregate(wall.reports) as Aggregates | null;
      if (agg) paddles[id] = agg;
    }
    return json({ ok: true, minShown: MIN_SHOWN, paddles, note: 'Self-reported by players from The Bag on Rally, unaudited. Aggregates only; raw reports are never published.' }, cache);
  }
  const id = url.searchParams.get('id') || '';
  if (!ID_RE.test(id)) return json({ ok: false, reason: 'bad-paddle' }, { status: 400 });
  return json({ ok: true, ...publicView(id, await loadWall(env, id)) }, cache);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : '';
  if (!sessionId) return json({ ok: false, reason: 'missing-session' }, { status: 400 });
  const parsed = parseReport(body) as { paddleId: string; report: Omit<Report, 't' | 'pid'> } | { reason: string };
  if ('reason' in parsed) return json({ ok: false, reason: parsed.reason }, { status: 400 });

  const now = Date.now();
  const pid = (await sha256(`paddles-wear:${sessionId}`)).slice(0, 10);
  // One report per paddle per session per window: honest clients get a precise retry.
  const rateKey = `paddles:wear:rate:${pid}:${parsed.paddleId}`;
  const lastRaw = await env.VISITS.get(rateKey);
  const lastTs = lastRaw ? Number.parseInt(lastRaw, 10) : 0;
  if (Number.isFinite(lastTs) && now - lastTs < RATE_WINDOW_MS) {
    return json({ ok: false, reason: 'one-at-a-time', retryMs: RATE_WINDOW_MS - (now - lastTs) }, { status: 429 });
  }
  // Per-IP budget is the backstop; sessionId is whatever the client says it is.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipKey = `paddles:wear:rateip:${(await sha256(`paddles-wear-ip:${ip}`)).slice(0, 10)}`;
  let ipCount = 0, ipWindowStart = now;
  const ipRaw = await env.VISITS.get(ipKey);
  if (ipRaw) {
    try {
      const p = JSON.parse(ipRaw) as { c?: number; t?: number };
      if (typeof p.t === 'number' && now - p.t < RATE_WINDOW_MS) { ipCount = p.c ?? 0; ipWindowStart = p.t; }
    } catch {}
  }
  if (ipCount >= IP_BUDGET_PER_WINDOW) {
    return json({ ok: false, reason: 'one-at-a-time', retryMs: RATE_WINDOW_MS - (now - ipWindowStart) }, { status: 429 });
  }
  await env.VISITS.put(rateKey, String(now), { expirationTtl: RATE_KV_TTL_SECONDS });
  await env.VISITS.put(ipKey, JSON.stringify({ c: ipCount + 1, t: ipCount === 0 ? now : ipWindowStart }), { expirationTtl: RATE_KV_TTL_SECONDS });

  // A resend from the same session replaces its earlier report for this
  // paddle, so a player who logs more hours updates rather than duplicates.
  const wall = await loadWall(env, parsed.paddleId);
  const kept = wall.reports.filter((r) => r.pid !== pid);
  const next: Wall = { reports: [{ ...parsed.report, t: now, pid }, ...kept].slice(0, STORE_CAP), total: wall.total + (kept.length === wall.reports.length ? 1 : 0) };
  await env.VISITS.put(KEY(parsed.paddleId), JSON.stringify(next));
  const ids: string[] = JSON.parse((await env.VISITS.get(INDEX_KEY)) || '[]');
  if (!ids.includes(parsed.paddleId)) await env.VISITS.put(INDEX_KEY, JSON.stringify([...ids, parsed.paddleId].slice(0, 500)));
  return json({ ok: true, ...publicView(parsed.paddleId, next), replaced: kept.length !== wall.reports.length });
};
