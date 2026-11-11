/**
 * /api/pmm/stat — did the line open? Anonymous connect outcomes for PMM.
 *
 * The PRD's "easy to connect with friends" goal is connect success over 90%.
 * This endpoint is how that number gets measured. Only the phone that pressed
 * LOAD reports, once per handshake that reached FOUND, so each connection
 * counts once:
 *
 *   POST /api/pmm/stat { v: 1, outcome, flow, via, path, reason, ms, id }
 *        → 201 { recorded: true }
 *        → 204 when the browser sends DNT or Sec-GPC (nothing is written)
 *        → 400 / 403 / 413 / 415 / 503 otherwise
 *   GET  /api/pmm/stat?days=7 → 200 { attempts, run, fail, successRate, goal, byFlow, byVia, byPath, failReasons, medianMs, p90Ms, days }
 *
 * Each outcome is one immutable KV key in PC_ANALYTICS_KV, kept 90 days:
 *   pmm:v1:{day}:{outcome}:{flow}:{via}:{path}:{reason}:{id}   metadata { ms }
 * `id` is a random UUID made for that one handshake. No IP, user agent,
 * cookie, sigil, name, friend, code or message is written to the outcome.
 * The per-minute rate limit keys on a salted hash of the address (the /64 for
 * IPv6), kept about a minute and never joined to an outcome.
 *
 * Anyone can forge reports: the site-only check is header based and the rate
 * limit is per address. The GET says so. The account's KV is on the free plan
 * (1,000 writes a day), so a POST costs two writes and the GET lists the prefix
 * once (one operation per 1,000 keys) into one edge-cached snapshot that every
 * window is computed from, refreshed at most every five minutes per data center.
 */
import { fromSite } from './turn.ts';
import { rateLimit, rateLimitResponse } from '../../_rate-limit.ts';

export interface Env {
  PC_ANALYTICS_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

export const PREFIX = 'pmm:v1:';
const RETENTION_SECONDS = 90 * 86400;
const REPORT_LIMIT = 10_000;
export const GOAL = 0.9;
export const VALUES = {
  outcome: ['run', 'fail'],
  flow: ['code', 'paste'],
  via: ['store', 'paste', 'scan', 'tab', 'link'],
  path: ['direct', 'relay', 'unknown', 'none'],
  reason: ['-', 'timeout', 'ice', 'abandoned', 'hello'],
} as const;
type Field = keyof typeof VALUES;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

export interface Outcome { outcome: string; flow: string; via: string; path: string; reason: string; ms: number; id: string }

/** The event, or null when any field is outside the allowlist. A run carries a path and no reason; a fail carries a reason and no path. */
export function parseOutcome(body: unknown): Outcome | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (b.v !== 1) return null;
  for (const k of Object.keys(VALUES) as Field[]) {
    if (typeof b[k] !== 'string' || !(VALUES[k] as readonly string[]).includes(b[k] as string)) return null;
  }
  if (b.outcome === 'run' && (b.reason !== '-' || b.path === 'none')) return null;
  if (b.outcome === 'fail' && (b.reason === '-' || b.path !== 'none')) return null;
  if (typeof b.id !== 'string' || !UUID.test(b.id)) return null;
  const ms = typeof b.ms === 'number' && Number.isFinite(b.ms) ? Math.max(0, Math.min(600_000, Math.round(b.ms))) : 0;
  return { outcome: b.outcome as string, flow: b.flow as string, via: b.via as string, path: b.path as string, reason: b.reason as string, ms, id: b.id.toLowerCase() };
}

export const keyFor = (o: Outcome, day: string) => `${PREFIX}${day}:${o.outcome}:${o.flow}:${o.via}:${o.path}:${o.reason}:${o.id}`;

/** The eight groups of an IPv6 address, '::' expanded and leading zeros dropped. */
export function expandV6(ip: string): string[] {
  const [head, tail] = ip.toLowerCase().split('%')[0].split('::');
  const a = head ? head.split(':') : [];
  const b = tail === undefined ? [] : tail ? tail.split(':') : [];
  const groups = tail === undefined ? a : [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b];
  return groups.map((g) => g.replace(/^0+(?=.)/, ''));
}

/** A salted, day-scoped hash of the reporter's address for the rate limit: the /64 for IPv6, the whole address for IPv4. */
export async function limiterId(request: Request, day: string): Promise<string | undefined> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  if (!ip) return undefined;
  const net = ip.includes(':') ? expandV6(ip).slice(0, 4).join(':') : ip;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pmm-stat|${day}|${net}`));
  return 'h:' + Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!fromSite(request)) return json({ error: 'site-only' }, 403);
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return new Response(null, { status: 204 });
  if (!env.PC_ANALYTICS_KV) return json({ error: 'stats-unavailable' }, 503);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'content-type' }, 415);
  const raw = await request.text().catch(() => '');
  if (raw.length > 512) return json({ error: 'too-large' }, 413);
  let body: unknown; try { body = JSON.parse(raw); } catch { return json({ error: 'invalid-body' }, 400); }
  const o = parseOutcome(body);
  if (!o) return json({ error: 'invalid-event' }, 400);
  const day = new Date().toISOString().slice(0, 10);
  const rl = await rateLimit(request, env, { bucket: 'pmm:stat', windowSec: 60, maxRequests: 12, clientId: await limiterId(request, day) });
  if (!rl.allowed) return rateLimitResponse(rl, 'Too many reports. Wait a minute.');
  try {
    // One immutable key per handshake: a retry with the same id overwrites itself, and nothing is lost to racing increments.
    await env.PC_ANALYTICS_KV.put(keyFor(o, day), '', { expirationTtl: RETENTION_SECONDS, metadata: { ms: o.ms } });
    return json({ recorded: true }, 201);
  } catch { return json({ error: 'stats-unavailable' }, 503); }
};

const pct = (sorted: number[], q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : null);
const tally = (fields: readonly string[]) => Object.fromEntries(fields.map((f) => [f, { run: 0, fail: 0 }])) as Record<string, { run: number; fail: number }>;

/** Roll up keys (with their metadata) into the report. Exported for the test. */
export function summarize(keys: { name: string; metadata?: unknown }[], since: string) {
  const byFlow = tally(VALUES.flow), byVia = tally(VALUES.via);
  const byPath: Record<string, number> = { direct: 0, relay: 0, unknown: 0 };
  const failReasons: Record<string, number> = { timeout: 0, ice: 0, abandoned: 0, hello: 0 };
  const days: Record<string, { run: number; fail: number }> = {};
  const runMs: number[] = [];
  let run = 0, fail = 0;
  for (const k of keys) {
    const [, , day, outcome, flow, via, path, reason] = k.name.split(':');
    if (!day || day < since || (outcome !== 'run' && outcome !== 'fail')) continue;
    const o = outcome as 'run' | 'fail';
    if (o === 'run') run++; else fail++;
    (days[day] ||= { run: 0, fail: 0 })[o]++;
    if (byFlow[flow]) byFlow[flow][o]++;
    if (byVia[via]) byVia[via][o]++;
    if (o === 'run') {
      if (path in byPath) byPath[path]++;
      const ms = (k.metadata as { ms?: unknown } | undefined)?.ms;
      if (typeof ms === 'number' && ms > 0) runMs.push(ms);
    } else if (reason in failReasons) failReasons[reason]++;
  }
  runMs.sort((a, b) => a - b);
  const attempts = run + fail;
  const successRate = attempts ? Math.round((run / attempts) * 1000) / 1000 : null;
  return {
    attempts, run, fail, successRate,
    goal: { target: GOAL, met: successRate == null ? null : successRate >= GOAL },
    byFlow, byVia, byPath, failReasons,
    medianMs: pct(runMs, 0.5), p90Ms: pct(runMs, 0.9),
    days: Object.entries(days).sort(([a], [b]) => (a < b ? 1 : -1)).map(([day, v]) => ({ day, ...v })),
  };
}

type Key = { name: string; metadata?: unknown };
const SNAPSHOT_SECONDS = 300;
async function listPrefix(kv: KVNamespace, prefix: string, cap: number, into: Key[]): Promise<boolean> {
  let cursor: string | undefined;
  do {
    if (into.length >= cap) return false;
    const page = await kv.list({ prefix, limit: Math.min(1000, cap - into.length), ...(cursor ? { cursor } : {}) });
    into.push(...page.keys);
    if (page.list_complete) return true;
    cursor = 'cursor' in page ? page.cursor : undefined;
  } while (cursor);
  return true;
}

/** The months (YYYY-MM) the retention window touches, newest first. */
export function monthsBack(days: number, nowMs = Date.now()): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) { const m = new Date(nowMs - i * 86400_000).toISOString().slice(0, 7); if (!out.includes(m)) out.push(m); }
  return out;
}

/** Every key the report can use. One listing of the whole prefix while it is under the cap; past it, month by month,
 *  newest first, so the cap drops the oldest days and not today. */
export async function snapshot(kv: KVNamespace): Promise<{ keys: Key[]; truncated: boolean }> {
  let keys: Key[] = [];
  if (await listPrefix(kv, PREFIX, REPORT_LIMIT, keys)) return { keys, truncated: false };
  keys = [];
  for (const month of monthsBack(90)) {
    if (!(await listPrefix(kv, `${PREFIX}${month}`, REPORT_LIMIT, keys))) return { keys, truncated: true };
  }
  return { keys, truncated: false };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const n = Number(url.searchParams.get('days'));
  const windowDays = Number.isInteger(n) && n >= 1 && n <= 90 ? n : 7;
  const since = new Date(Date.now() - (windowDays - 1) * 86400_000).toISOString().slice(0, 10);
  const base = {
    windowDays, since,
    measurement: 'One report per handshake that reached FOUND, sent by the phone that pressed LOAD. RUN means the signed hello arrived. FAIL means no line within 30 seconds (timeout), the path failed (ice), the person gave up after FOUND (abandoned), or the line opened without a verified hello (hello). Handshakes abandoned before FOUND are not counted. Browsers sending DNT or Global Privacy Control are not counted. Reports are anonymous and unauthenticated, so forged reports can skew the numbers; each address is rate limited. KV listings are eventually consistent, and the numbers can be up to five minutes old.',
  };
  if (!env.PC_ANALYTICS_KV) return json({ ...base, status: 'unavailable', attempts: null }, 503);
  // One cached snapshot serves every window, so asking for many windows costs no more than asking for one.
  const cache = typeof caches === 'undefined' ? null : (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`${url.origin}/api/pmm/stat/snapshot`);
  let snap: { keys: Key[]; truncated: boolean; listedAt: string } | null = null;
  const hit = cache ? await cache.match(cacheKey).catch(() => undefined) : undefined;
  if (hit) { try { snap = await hit.json(); } catch { snap = null; } }
  if (!snap) {
    try { snap = { ...(await snapshot(env.PC_ANALYTICS_KV)), listedAt: new Date().toISOString() }; }
    catch { return json({ ...base, status: 'unavailable', attempts: null }, 503); }
    if (cache) {
      const put = cache.put(cacheKey, new Response(JSON.stringify(snap), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${SNAPSHOT_SECONDS}` } })).catch(() => {});
      if (waitUntil) waitUntil(put);
    }
  }
  return new Response(JSON.stringify({ ...base, status: 'available', ...summarize(snap.keys, since), truncated: snap.truncated, listedAt: snap.listedAt, generatedAt: new Date().toISOString() }),
    { status: 200, headers: { ...HEADERS, 'Cache-Control': 'public, max-age=60' } });
};
