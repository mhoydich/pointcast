import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../_rate-limit';
import {
  BUILDCAST_AGENTS,
  BUILDCAST_PHASES,
  BUILDCAST_PUBLIC_BOUNDARY,
  BUILDCAST_STATUSES,
  BUILDCAST_TYPES,
  HAPTIC_BUILDCAST_PROJECT,
  HAPTIC_BUILDCAST_SEED_EVENTS,
  HAPTIC_BUILDCAST_SESSION,
  type BuildcastEvent,
  type BuildcastEventInput,
} from '../../src/lib/pointcast-buildcast';

interface Env {
  PC_BUILDCAST_KV?: KVNamespace;
  PC_BUILDCAST_TOKEN?: string;
  PC_RATES_KV?: KVNamespace;
}

const EVENT_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_RUNTIME_EVENTS = 500;
const PUBLIC_LINK_HOSTS = new Set(['pointcast.xyz', 'www.pointcast.xyz', 'github.com']);
const SUSPICIOUS_TEXT = /(\/Users\/|\/private\/|\/tmp\/|[A-Z]:\\|\bBearer\s+|\b(?:sk|ghp|github_pat)[-_][A-Za-z0-9_-]{12,}|\b(?:TOKEN|PASSWORD|SECRET|API_KEY)\s*=|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i;

function json(body: unknown, status = 200, publicRead = true): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(publicRead ? { 'Access-Control-Allow-Origin': '*' } : {}),
    },
  });
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length > max || SUSPICIOUS_TEXT.test(cleaned)) return null;
  return cleaned;
}

function cleanLink(value: unknown): string | undefined | null {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 500 || SUSPICIOUS_TEXT.test(value)) return null;
  try {
    const url = new URL(value);
    const isPointcastPreview = url.protocol === 'https:' && url.hostname.endsWith('.pointcast.pages.dev');
    const isPublicHost = url.protocol === 'https:' && PUBLIC_LINK_HOSTS.has(url.hostname);
    const isPointcastRepo = url.hostname !== 'github.com' || url.pathname.startsWith('/mhoydich/pointcast');
    return (isPointcastPreview || (isPublicHost && isPointcastRepo)) ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanMetrics(value: unknown): BuildcastEvent['metrics'] | undefined | null {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const allowed = new Set(['testsPassed', 'testsFailed', 'pagesBuilt']);
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.some(([key]) => !allowed.has(key))) return null;
  const metrics: NonNullable<BuildcastEvent['metrics']> = {};
  for (const [key, raw] of entries) {
    if (!Number.isInteger(raw) || Number(raw) < 0 || Number(raw) > 100_000) return null;
    metrics[key as keyof typeof metrics] = Number(raw);
  }
  return metrics;
}

function validateInput(value: unknown): { ok: true; input: BuildcastEventInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'body-must-be-an-object' };
  const body = value as Record<string, unknown>;
  const allowed = new Set(['agent', 'type', 'phase', 'title', 'summary', 'status', 'link', 'metrics']);
  if (Object.keys(body).some((key) => !allowed.has(key))) return { ok: false, error: 'unknown-field' };
  if (!BUILDCAST_AGENTS.includes(body.agent as any)) return { ok: false, error: 'invalid-agent' };
  if (!BUILDCAST_TYPES.includes(body.type as any)) return { ok: false, error: 'invalid-type' };
  if (!BUILDCAST_PHASES.includes(body.phase as any)) return { ok: false, error: 'invalid-phase' };
  if (!BUILDCAST_STATUSES.includes(body.status as any)) return { ok: false, error: 'invalid-status' };
  const title = cleanText(body.title, 80);
  const summary = cleanText(body.summary, 280);
  if (!title) return { ok: false, error: 'invalid-or-sensitive-title' };
  if (!summary) return { ok: false, error: 'invalid-or-sensitive-summary' };
  const link = cleanLink(body.link);
  if (link === null) return { ok: false, error: 'invalid-or-private-link' };
  const metrics = cleanMetrics(body.metrics);
  if (metrics === null) return { ok: false, error: 'invalid-metrics' };
  return {
    ok: true,
    input: {
      agent: body.agent as BuildcastEventInput['agent'],
      type: body.type as BuildcastEventInput['type'],
      phase: body.phase as BuildcastEventInput['phase'],
      title,
      summary,
      status: body.status as BuildcastEventInput['status'],
      ...(link ? { link } : {}),
      ...(metrics && Object.keys(metrics).length ? { metrics } : {}),
    },
  };
}

async function tokenMatches(request: Request, expected: string): Promise<boolean> {
  const supplied = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!supplied || supplied.length !== expected.length) return false;
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(supplied)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function loadRuntimeEvents(kv: KVNamespace): Promise<BuildcastEvent[]> {
  const prefix = `buildcast:${HAPTIC_BUILDCAST_PROJECT}:${HAPTIC_BUILDCAST_SESSION}:`;
  const listed = await kv.list({ prefix, limit: MAX_RUNTIME_EVENTS });
  const values = await Promise.all(listed.keys.map((key) => kv.get(key.name, 'json')));
  return values.filter((value): value is BuildcastEvent => Boolean(value && typeof value === 'object'));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const rl = await rateLimit(request, env, { bucket: 'buildcast:get', windowSec: 60, maxRequests: 30 });
  if (!rl.allowed) return rateLimitResponse(rl, 'buildcast poll rate exceeded');
  const url = new URL(request.url);
  const project = url.searchParams.get('project') || HAPTIC_BUILDCAST_PROJECT;
  const session = url.searchParams.get('session') || HAPTIC_BUILDCAST_SESSION;
  const since = Math.max(0, Number(url.searchParams.get('since') || 0) || 0);
  if (project !== HAPTIC_BUILDCAST_PROJECT || session !== HAPTIC_BUILDCAST_SESSION) {
    return json({ ok: false, error: 'unknown-buildcast' }, 404);
  }

  let runtimeEvents: BuildcastEvent[] = [];
  let mode: 'seeded' | 'read-only-edge' | 'curated-edge' = 'seeded';
  if (env.PC_BUILDCAST_KV) {
    try {
      runtimeEvents = await loadRuntimeEvents(env.PC_BUILDCAST_KV);
      mode = env.PC_BUILDCAST_TOKEN ? 'curated-edge' : 'read-only-edge';
    } catch {
      runtimeEvents = [];
    }
  }
  const events = [...HAPTIC_BUILDCAST_SEED_EVENTS, ...runtimeEvents]
    .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
    .filter((event) => event.sequence > since)
    .sort((a, b) => a.sequence - b.sequence)
    .slice(-100);
  const latest = [...HAPTIC_BUILDCAST_SEED_EVENTS, ...runtimeEvents].sort((a, b) => b.sequence - a.sequence)[0] ?? null;

  return applyRateLimitHeaders(json({
    ok: true,
    project,
    session,
    mode,
    liveUpdates: mode === 'curated-edge',
    generatedAt: new Date().toISOString(),
    latestSequence: latest?.sequence ?? 0,
    currentPhase: latest?.phase ?? 'shape',
    count: events.length,
    events,
    boundary: BUILDCAST_PUBLIC_BOUNDARY,
  }), rl);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PC_BUILDCAST_KV || !env.PC_BUILDCAST_TOKEN) {
    return json({ ok: false, error: 'buildcast-writer-not-configured' }, 503, false);
  }
  if (!(await tokenMatches(request, env.PC_BUILDCAST_TOKEN))) {
    return json({ ok: false, error: 'unauthorized' }, 401, false);
  }
  const rl = await rateLimit(request, env, { bucket: 'buildcast:post', windowSec: 60, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl, 'buildcast writer rate exceeded');
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400, false);
  }
  const validated = validateInput(body);
  if (!validated.ok) return json({ ok: false, error: validated.error }, 400, false);

  const now = new Date();
  const sequence = Date.now() * 1000 + crypto.getRandomValues(new Uint16Array(1))[0] % 1000;
  const id = crypto.randomUUID();
  const event: BuildcastEvent = {
    id,
    project: HAPTIC_BUILDCAST_PROJECT,
    session: HAPTIC_BUILDCAST_SESSION,
    sequence,
    at: now.toISOString(),
    ...validated.input,
  };
  const key = `buildcast:${event.project}:${event.session}:${String(sequence).padStart(16, '0')}:${id}`;
  await env.PC_BUILDCAST_KV.put(key, JSON.stringify(event), { expirationTtl: EVENT_TTL_SECONDS });
  return applyRateLimitHeaders(json({ ok: true, event }, 201, false), rl);
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
