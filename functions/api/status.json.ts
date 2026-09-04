/**
 * GET /api/status.json — service health + diagnostics for the /diagnostics page.
 *
 * Probes each subsystem in parallel with a per-probe timeout, returns a
 * structured snapshot the client can poll every ~10s. Probes are grouped:
 *
 *   edge      — Pages routes that serve the public surface (root, snapshot,
 *               wire-events, agents.json, blocks.json)
 *   realtime  — Durable Objects (presence global + per-URL cursor rooms)
 *   kv        — KV namespace bindings (read a sentinel key to confirm the
 *               binding actually responds, not just that it's typed)
 *   external  — third-party deps PointCast leans on (noun.pics, tzkt)
 *
 * Status values per service:
 *   ok        — probe succeeded, response shape matched expectations
 *   degraded  — probe succeeded but a soft assertion failed (e.g. snapshot
 *               returned the binding-missing fallback)
 *   down      — non-2xx, timeout, threw, or hard assertion failed
 *   unknown   — binding not present (we can't probe; not an outage)
 *
 * Top-level `overall` is `down` if anything is down, `degraded` if anything
 * is degraded, `unknown` only if every probe came back unknown, else `ok`.
 *
 * Cache: short edge cache (5s) so a herd of /diagnostics viewers doesn't
 * fan out one DO+KV probe per viewer per second.
 */

interface Env {
  PRESENCE?: DurableObjectNamespace;
  VISITS?: KVNamespace;
  PC_PING_KV?: KVNamespace;
  PC_QUEUE_KV?: KVNamespace;
  PC_DROP_KV?: KVNamespace;
  PC_POLLS_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
  PC_STUDIO_KV?: KVNamespace;
  PC_CHECKIN_KV?: KVNamespace;
}

type Status = 'ok' | 'degraded' | 'down' | 'unknown';

interface ServiceResult {
  name: string;
  status: Status;
  latencyMs: number | null;
  detail: string;
  href?: string;
}

interface ServiceGroup {
  key: string;
  label: string;
  services: ServiceResult[];
}

const PROBE_TIMEOUT_MS = 5000;
const HEALTHCHECK_KEY = '__pc_status_healthcheck__';

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms (${label})`)), ms),
    ),
  ]);
}

function ms(t0: number): number {
  return Math.max(0, Math.round(performance.now() - t0));
}

async function httpProbe(
  name: string,
  url: string,
  opts: {
    method?: 'GET' | 'HEAD';
    expectJson?: boolean;
    assert?: (body: any) => string | null;
    href?: string;
  } = {},
): Promise<ServiceResult> {
  const t0 = performance.now();
  try {
    const res = await withTimeout(
      fetch(url, { method: opts.method ?? 'GET', cf: { cacheTtl: 0, cacheEverything: false } }),
      PROBE_TIMEOUT_MS,
      name,
    );
    const latency = ms(t0);
    if (!res.ok) {
      return {
        name, status: 'down', latencyMs: latency,
        detail: `HTTP ${res.status} ${res.statusText || ''}`.trim(),
        href: opts.href ?? url,
      };
    }
    if (opts.expectJson) {
      let body: any;
      try { body = await res.json(); }
      catch (e: any) {
        return { name, status: 'degraded', latencyMs: latency, detail: `JSON parse failed: ${e.message}`, href: opts.href ?? url };
      }
      const reason = opts.assert?.(body) ?? null;
      if (reason) {
        return { name, status: 'degraded', latencyMs: latency, detail: reason, href: opts.href ?? url };
      }
    }
    return { name, status: 'ok', latencyMs: latency, detail: `HTTP ${res.status}`, href: opts.href ?? url };
  } catch (e: any) {
    return { name, status: 'down', latencyMs: ms(t0), detail: e.message ?? String(e), href: opts.href ?? url };
  }
}

async function presenceDoProbe(env: Env, room: string, label: string): Promise<ServiceResult> {
  if (!env.PRESENCE) {
    return { name: label, status: 'unknown', latencyMs: null, detail: 'PRESENCE binding not configured' };
  }
  const t0 = performance.now();
  try {
    const id = env.PRESENCE.idFromName(room);
    const stub = env.PRESENCE.get(id);
    const res = await withTimeout(
      stub.fetch(`https://do.pointcast.internal/snapshot?room=${encodeURIComponent(room)}`),
      PROBE_TIMEOUT_MS,
      label,
    );
    const latency = ms(t0);
    if (!res.ok) {
      return { name: label, status: 'down', latencyMs: latency, detail: `DO ${res.status}` };
    }
    let body: any;
    try { body = await res.json(); }
    catch (e: any) {
      return { name: label, status: 'degraded', latencyMs: latency, detail: `DO returned non-JSON: ${e.message}` };
    }
    const humans = typeof body?.humans === 'number' ? body.humans : null;
    const agents = typeof body?.agents === 'number' ? body.agents : null;
    if (humans === null || agents === null) {
      return { name: label, status: 'degraded', latencyMs: latency, detail: 'snapshot missing humans/agents fields' };
    }
    return { name: label, status: 'ok', latencyMs: latency, detail: `${humans} humans · ${agents} agents` };
  } catch (e: any) {
    return { name: label, status: 'down', latencyMs: ms(t0), detail: e.message ?? String(e) };
  }
}

async function kvProbe(name: string, ns: KVNamespace | undefined): Promise<ServiceResult> {
  if (!ns) {
    return { name, status: 'unknown', latencyMs: null, detail: 'binding not configured' };
  }
  const t0 = performance.now();
  try {
    const v = await withTimeout(ns.get(HEALTHCHECK_KEY, { type: 'text' }), PROBE_TIMEOUT_MS, name);
    return { name, status: 'ok', latencyMs: ms(t0), detail: v === null ? 'reachable · sentinel unset' : 'reachable' };
  } catch (e: any) {
    return { name, status: 'down', latencyMs: ms(t0), detail: e.message ?? String(e) };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const startedAt = Date.now();
  const origin = new URL(request.url).origin;
  const u = (path: string) => `${origin}${path}`;

  // ─── edge probes (self-fetch through Pages) ────────────────────────────
  const edgeProbes: Promise<ServiceResult>[] = [
    httpProbe('pages-root', u('/'), { method: 'HEAD', href: '/' }),
    httpProbe('presence-info', u('/api/presence'), {
      expectJson: true,
      assert: (b) => b?.endpoint === '/api/presence' ? null : 'missing endpoint field',
      href: '/api/presence',
    }),
    httpProbe('presence-snapshot', u('/api/presence/snapshot'), {
      expectJson: true,
      assert: (b) => {
        if (typeof b?.humans !== 'number') return 'humans missing';
        if (typeof b?.note === 'string' && b.note.includes('not bound')) return b.note;
        return null;
      },
      href: '/api/presence/snapshot',
    }),
    httpProbe('wire-events', u('/api/wire-events?limit=1'), {
      expectJson: true,
      assert: (b) => Array.isArray(b) || Array.isArray(b?.events) ? null : 'expected array or {events}',
      href: '/api/wire-events?limit=1',
    }),
    httpProbe('blocks-json', u('/blocks.json'), { method: 'HEAD', href: '/blocks.json' }),
    httpProbe('agents-json', u('/agents.json'), {
      expectJson: true,
      assert: (b) => b && typeof b === 'object' ? null : 'not a JSON object',
      href: '/agents.json',
    }),
  ];

  // ─── realtime probes (Durable Objects) ─────────────────────────────────
  const realtimeProbes: Promise<ServiceResult>[] = [
    presenceDoProbe(env, 'global', 'presence-do · global'),
    presenceDoProbe(env, 'room:/diagnostics', 'cursor-room · /diagnostics'),
  ];

  // ─── kv probes ─────────────────────────────────────────────────────────
  const kvProbes: Promise<ServiceResult>[] = [
    kvProbe('VISITS', env.VISITS),
    kvProbe('PC_PING_KV', env.PC_PING_KV),
    kvProbe('PC_QUEUE_KV', env.PC_QUEUE_KV),
    kvProbe('PC_DROP_KV', env.PC_DROP_KV),
    kvProbe('PC_POLLS_KV', env.PC_POLLS_KV),
    kvProbe('PC_RATES_KV', env.PC_RATES_KV),
    kvProbe('PC_RACE_KV', env.PC_RACE_KV),
    kvProbe('PC_STUDIO_KV', env.PC_STUDIO_KV),
    kvProbe('PC_CHECKIN_KV', env.PC_CHECKIN_KV),
  ];

  // ─── external probes ───────────────────────────────────────────────────
  const externalProbes: Promise<ServiceResult>[] = [
    httpProbe('noun.pics', 'https://noun.pics/0.svg', { method: 'HEAD', href: 'https://noun.pics/0.svg' }),
    httpProbe('tzkt.io', 'https://api.tzkt.io/v1/head', {
      expectJson: true,
      assert: (b) => typeof b?.level === 'number' ? null : 'missing level',
      href: 'https://api.tzkt.io',
    }),
  ];

  const [edge, realtime, kv, external] = await Promise.all([
    Promise.all(edgeProbes),
    Promise.all(realtimeProbes),
    Promise.all(kvProbes),
    Promise.all(externalProbes),
  ]);

  const groups: ServiceGroup[] = [
    { key: 'edge',     label: 'Edge · Pages',          services: edge },
    { key: 'realtime', label: 'Realtime · Durable Objects', services: realtime },
    { key: 'kv',       label: 'KV namespaces',         services: kv },
    { key: 'external', label: 'External services',     services: external },
  ];

  let okCount = 0, degradedCount = 0, downCount = 0, unknownCount = 0;
  for (const g of groups) for (const s of g.services) {
    if (s.status === 'ok') okCount++;
    else if (s.status === 'degraded') degradedCount++;
    else if (s.status === 'down') downCount++;
    else unknownCount++;
  }

  const overall: Status = downCount > 0 ? 'down'
    : degradedCount > 0 ? 'degraded'
    : unknownCount > 0 && okCount === 0 ? 'unknown'
    : 'ok';

  return new Response(JSON.stringify({
    checkedAt: new Date(startedAt).toISOString(),
    elapsedMs: Date.now() - startedAt,
    overall,
    counts: { ok: okCount, degraded: degradedCount, down: downCount, unknown: unknownCount },
    groups,
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=15',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
