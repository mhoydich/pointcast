/**
 * Shared helpers for the Agent-Web Observatory read endpoints.
 *
 * These Pages Functions are read-only views over the OBSERVATORY KV
 * namespace, which the standalone scanner Worker (workers/observatory/)
 * populates on its hourly cron. Until the namespace is bound in the root
 * wrangler.toml, every endpoint degrades to a graceful zero-state with
 * reason 'kv-unbound' — the same idiom as /api/coffee and /api/race.
 */

export interface Env {
  OBSERVATORY?: KVNamespace;
}

export const KEY_INDEX = 'obs:index';
export const KEY_EVENTS = 'obs:events';
export const domainKey = (domain: string) => `obs:domain:${domain}`;

export function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Scans land hourly; five minutes of edge cache keeps reads cheap
      // without hiding fresh census rows for long.
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: message }, status, { 'Cache-Control': 'no-store' });
}

export function kvUnbound(zeroState: Record<string, unknown>): Response {
  return jsonResponse({ ok: true, reason: 'kv-unbound', ...zeroState });
}

export const corsPreflight: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
