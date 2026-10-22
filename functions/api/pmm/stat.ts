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
 * cookie, sigil, name, friend, code or message is written.
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
  reason: ['-', 'timeout', 'ice'],
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
  const rl = await rateLimit(request, env, { bucket: 'pmm:stat', windowSec: 60, maxRequests: 12 });
  if (!rl.allowed) return rateLimitResponse(rl, 'Too many reports. Wait a minute.');
  try {
    // One immutable key per handshake: a retry with the same id overwrites itself, and nothing is lost to racing increments.
    await env.PC_ANALYTICS_KV.put(keyFor(o, new Date().toISOString().slice(0, 10)), '', { expirationTtl: RETENTION_SECONDS, metadata: { ms: o.ms } });
    return json({ recorded: true }, 201);
  } catch { return json({ error: 'stats-unavailable' }, 503); }
};

const pct = (sorted: number[], q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : null);
const tally = (fields: readonly string[]) => Object.fromEntries(fields.map((f) => [f, { run: 0, fail: 0 }])) as Record<string, { run: number; fail: number }>;

/** Roll up keys (with their metadata) into the report. Exported for the test. */
export function summarize(keys: { name: string; metadata?: unknown }[], since: string) {
  const byFlow = tally(VALUES.flow), byVia = tally(VALUES.via);
  const byPath: Record<string, number> = { direct: 0, relay: 0, unknown: 0 };
  const failReasons: Record<string, number> = { timeout: 0, ice: 0 };
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const n = Number(new URL(request.url).searchParams.get('days'));
  const windowDays = Number.isInteger(n) && n >= 1 && n <= 90 ? n : 7;
  const since = new Date(Date.now() - (windowDays - 1) * 86400_000).toISOString().slice(0, 10);
  const base = {
    windowDays, since,
    measurement: 'One report per handshake that reached FOUND, sent by the phone that pressed LOAD. RUN means the signed hello arrived; FAIL means no line within 30 seconds or the path failed. Handshakes abandoned before FOUND are not counted. Browsers sending DNT or Global Privacy Control are not counted. KV listings are eventually consistent.',
  };
  if (!env.PC_ANALYTICS_KV) return json({ ...base, status: 'unavailable', attempts: null }, 503);
  // One listing per day, newest first, so a report that hits the cap drops the oldest days, not today.
  const keys: { name: string; metadata?: unknown }[] = [];
  let truncated = false;
  try {
    for (let i = 0; i < windowDays && !truncated; i++) {
      const prefix = `${PREFIX}${new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10)}:`;
      let cursor: string | undefined; let complete = false;
      do {
        if (keys.length >= REPORT_LIMIT) { truncated = true; break; }
        const page = await env.PC_ANALYTICS_KV.list({ prefix, limit: Math.min(1000, REPORT_LIMIT - keys.length), ...(cursor ? { cursor } : {}) });
        keys.push(...page.keys);
        complete = page.list_complete;
        cursor = 'cursor' in page ? page.cursor : undefined;
      } while (!complete);
    }
  } catch { return json({ ...base, status: 'unavailable', attempts: null }, 503); }
  return json({ ...base, status: 'available', ...summarize(keys, since), truncated, generatedAt: new Date().toISOString() });
};
