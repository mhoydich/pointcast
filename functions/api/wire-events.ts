/**
 * GET /api/wire-events — WebMCP-shaped tool surface for PointCast Wire.
 *
 * Purpose: /wire.json is a browser-friendly snapshot — the build-time
 * array plus a thin manifest. /api/wire-events is the MCP tool shape:
 *   - runtime handler (always fresh)
 *   - ?since=<ISO8601> filter so agents can poll incrementally
 *   - ?limit=<n> cap (default 24, max 60)
 *   - ?agent=<codex|manus|claude|mike|block> filter
 *   - ?kind=<commit|block> filter
 *   - `tool` + `description` meta so a WebMCP host can introspect
 *   - rate-limited via the shared _rate-limit helper (60 req/min per IP)
 *
 * This complements Sprint 17's /wire + /wire.json without replacing
 * them. /wire.json stays the build-time snapshot for agents that
 * prefer a single fetch. /api/wire-events is the tool surface for
 * agents polling live.
 *
 * The event source is the same as /wire.json — a re-fetch of the
 * /wire.json asset plus an optional slim proxy to keep the logic
 * DRY. We do a server-side fetch to `/wire.json` via the Pages
 * runtime and filter in-memory.
 */

import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../_rate-limit';

interface Env {
  PC_RATES_KV?: KVNamespace;
}

type AgentKey = 'codex' | 'manus' | 'claude' | 'mike' | 'block';
type EventKind = 'commit' | 'block';

interface WireEvent {
  kind: EventKind;
  agent: AgentKey;
  subject: string;
  href: string | null;
  at: string;
  sha?: string;
  id?: string;
  channel?: string;
  type?: string;
}

const VALID_AGENTS = new Set<AgentKey>(['codex', 'manus', 'claude', 'mike', 'block']);
const VALID_KINDS = new Set<EventKind>(['commit', 'block']);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // 60 polls/min/IP — generous for a well-behaved agent (1 Hz), tight
  // for a runaway loop. Agents should honor Retry-After when throttled.
  const rl = await rateLimit(request, env, {
    bucket: 'wire-events',
    windowSec: 60,
    maxRequests: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl, 'wire-events poll rate exceeded');

  const url = new URL(request.url);
  const sinceRaw = url.searchParams.get('since');
  const limitRaw = url.searchParams.get('limit');
  const agentFilter = url.searchParams.get('agent');
  const kindFilter = url.searchParams.get('kind');

  const since = sinceRaw ? Date.parse(sinceRaw) : NaN;
  const sinceMs = Number.isFinite(since) ? since : 0;
  const limit = Math.max(1, Math.min(60, parseInt(limitRaw || '24', 10) || 24));
  const agent = agentFilter && VALID_AGENTS.has(agentFilter as AgentKey)
    ? (agentFilter as AgentKey)
    : null;
  const kind = kindFilter && VALID_KINDS.has(kindFilter as EventKind)
    ? (kindFilter as EventKind)
    : null;

  // Fetch the build-time snapshot. Same origin, Pages caches it so the
  // hop is effectively free after the first hit. `ctx.waitUntil` isn't
  // needed — we wait for the fetch to complete before responding.
  let events: WireEvent[] = [];
  let generatedAt = '';
  try {
    const snapUrl = new URL('/wire.json', url.origin);
    const res = await fetch(snapUrl.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const snap = (await res.json()) as {
        generatedAt?: string;
        events?: WireEvent[];
      };
      generatedAt = snap.generatedAt || '';
      events = Array.isArray(snap.events) ? snap.events : [];
    }
  } catch {
    events = [];
  }

  // Apply filters.
  const filtered = events
    .filter((e) => (sinceMs ? Date.parse(e.at) > sinceMs : true))
    .filter((e) => (agent ? e.agent === agent : true))
    .filter((e) => (kind ? e.kind === kind : true))
    .slice(0, limit);

  const payload = {
    $schema: 'https://pointcast.xyz/agents.json',
    tool: {
      name: 'pointcast_wire_events',
      description:
        'Fetch the most recent PointCast events (commits + blocks). Call with ?since=<ISO> for incremental polling. Supports ?limit, ?agent, ?kind filters.',
      inputs: {
        since: 'ISO 8601 timestamp; only events strictly after this are returned',
        limit: 'integer, 1–60, default 24',
        agent: `one of ${[...VALID_AGENTS].join('|')}`,
        kind: `one of ${[...VALID_KINDS].join('|')}`,
      },
      example: '/api/wire-events?since=2026-04-24T08:00:00Z&limit=10&agent=claude',
      rateLimit: {
        limit: rl.limit,
        windowSec: rl.window,
        remaining: rl.remaining,
        headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      },
    },
    filter: {
      since: sinceMs ? new Date(sinceMs).toISOString() : null,
      limit,
      agent,
      kind,
    },
    source: {
      snapshot: '/wire.json',
      generatedAt,
    },
    count: filtered.length,
    events: filtered,
  };

  return applyRateLimitHeaders(
    new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=15',
      },
    }),
    rl,
  );
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
};
