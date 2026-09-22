/**
 * /api/paddles/correct — the corrections desk for The Paddle Register.
 *
 * A reader who knows a fact on a paddle page is wrong can say so here, with
 * the URL that shows it. Nothing is applied automatically: the weekly refresh
 * reads the queue, checks each claim against its source, and writes accepted
 * ones into the data files with a `corrected` row in the changes feed. A
 * correction without a source is not accepted.
 *
 * Storage (VISITS KV, same pattern as /api/paddles/wear):
 *   paddles:correct:queue  → JSON list, newest first, capped at STORE_CAP
 *     · an item: { id, t, paddleId, field, claim, source, contact, pid, status: 'open' }
 *   paddles:correct:counts → { [paddleId]: open count }
 *   paddles:correct:rate:{pid}:{paddleId} and paddles:correct:rateip:{ipHash} → rate keys
 *
 * Validation is hard-range and rejects, never repairs (beyond stripping
 * control characters from the text).
 *
 * GET ?id=<paddleId>            → { ok, id, open }
 * GET ?all=1                    → { ok, counts }
 * GET ?queue=1&key=<secret>     → { ok, queue } — open items WITHOUT contact fields,
 *                                 only when key equals env.CORRECTIONS_KEY
 * POST { sessionId, paddleId, field, claim, source, contact? }
 *
 * The contact field is stored for the reviewer and is never returned by any GET.
 */

import { sha256, type Env as VisitEnv } from '../visit';
// @ts-ignore — plain module shared with the tests
import { countOpen, parseCorrection, withoutContact } from '../../_lib/paddle-correct.mjs';

type Env = VisitEnv & { CORRECTIONS_KEY?: string };

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const QUEUE_KEY = 'paddles:correct:queue';
const COUNTS_KEY = 'paddles:correct:counts';
const STORE_CAP = 500;
const RATE_WINDOW_MS = 60_000;
const RATE_KV_TTL_SECONDS = 120;
const IP_BUDGET_PER_WINDOW = 4;
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Correction {
  id: string;
  t: number;
  paddleId: string;
  field: string;
  claim: string;
  source: string;
  contact: string | null;
  pid: string;
  status: 'open' | 'accepted' | 'rejected';
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), { ...init, headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) } });
}

async function loadQueue(env: Env): Promise<Correction[]> {
  if (!env.VISITS) return [];
  const raw = await env.VISITS.get(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Correction[]).slice(0, STORE_CAP) : [];
  } catch {
    return [];
  }
}

async function loadCounts(env: Env): Promise<Record<string, number>> {
  if (!env.VISITS) return {};
  const raw = await env.VISITS.get(COUNTS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** Timing-safe-enough equality for a short shared secret. */
function keyMatches(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const cache = { headers: { 'Cache-Control': 'public, max-age=120' } };

  // Admin path: the weekly refresh reads the open queue. Contacts stay in KV.
  if (url.searchParams.get('queue') === '1') {
    if (!env.CORRECTIONS_KEY) return json({ ok: false, reason: 'key-not-set' }, { status: 503 });
    if (!keyMatches(url.searchParams.get('key'), env.CORRECTIONS_KEY)) return json({ ok: false, reason: 'bad-key' }, { status: 403 });
    const queue = (await loadQueue(env)).filter((c) => c.status === 'open').map((c) => withoutContact(c));
    return json({ ok: true, queue }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // Public paths return counts only. Never claims, sources or contacts.
  if (url.searchParams.get('all') === '1') {
    return json({ ok: true, counts: await loadCounts(env) }, cache);
  }
  const id = url.searchParams.get('id') || '';
  if (!ID_RE.test(id) || id.length > 64) return json({ ok: false, reason: 'bad-paddle' }, { status: 400 });
  const counts = await loadCounts(env);
  return json({ ok: true, id, open: counts[id] ?? 0 }, cache);
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
  const parsed = parseCorrection(body) as
    | { paddleId: string; correction: Pick<Correction, 'field' | 'claim' | 'source' | 'contact'> }
    | { reason: string };
  if ('reason' in parsed) {
    const reason = parsed.reason === 'source-required' ? 'source-required: a correction without a source URL is not accepted' : parsed.reason;
    return json({ ok: false, reason }, { status: 400 });
  }

  const now = Date.now();
  const pid = (await sha256(`paddles-correct:${sessionId}`)).slice(0, 10);
  // One correction per paddle per session per window: honest clients get a precise retry.
  const rateKey = `paddles:correct:rate:${pid}:${parsed.paddleId}`;
  const lastRaw = await env.VISITS.get(rateKey);
  const lastTs = lastRaw ? Number.parseInt(lastRaw, 10) : 0;
  if (Number.isFinite(lastTs) && now - lastTs < RATE_WINDOW_MS) {
    return json({ ok: false, reason: 'one-at-a-time', retryMs: RATE_WINDOW_MS - (now - lastTs) }, { status: 429 });
  }
  // Per-IP budget is the backstop; sessionId is whatever the client says it is.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipKey = `paddles:correct:rateip:${(await sha256(`paddles-correct-ip:${ip}`)).slice(0, 10)}`;
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

  const item: Correction = { id: crypto.randomUUID(), t: now, paddleId: parsed.paddleId, ...parsed.correction, pid, status: 'open' };
  const queue = [item, ...(await loadQueue(env))].slice(0, STORE_CAP);
  await env.VISITS.put(QUEUE_KEY, JSON.stringify(queue));
  const counts = countOpen(queue) as Record<string, number>;
  await env.VISITS.put(COUNTS_KEY, JSON.stringify(counts));
  // The response confirms receipt and the open count. It never echoes the contact.
  return json({ ok: true, id: parsed.paddleId, open: counts[parsed.paddleId] ?? 0 });
};
