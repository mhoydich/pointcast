/**
 * functions/api/bell.ts — the universal bell.
 *
 * Mike 2026-05-16: "make a ring the bell on every page". One verb
 * that visitors can fire from anywhere. Increments a global rings
 * counter; returns total + the time of the most recent ring.
 *
 * Reuses the VISITS KV namespace (already bound on Cloudflare Pages)
 * — no new binding required, just two extra keys:
 *
 *   bell:total → number (string-encoded), monotonically increasing
 *   bell:last  → JSON { at: ISO timestamp, from?: anon session id }
 *
 * Graceful zero-state when VISITS isn't bound: POST returns ok=false
 * with `kv-not-bound`, GET returns rings=0. The button still plays
 * its local tone so the surface feels alive in dev.
 *
 * Behavior:
 *   POST  → increment bell:total; write bell:last; return { ok, rings, at }
 *   GET   → return { rings, last }
 *   HEAD  → 200 health
 *   OPTIONS → CORS preflight
 */

export interface Env {
  VISITS?: KVNamespace;
}

const TOTAL_KEY = 'bell:total';
const LAST_KEY = 'bell:last';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

async function readState(kv: KVNamespace): Promise<{ rings: number; last: { at: string; from?: string } | null }> {
  const [totalStr, lastStr] = await Promise.all([
    kv.get(TOTAL_KEY),
    kv.get(LAST_KEY),
  ]);
  const rings = totalStr ? Math.max(0, Math.floor(Number(totalStr) || 0)) : 0;
  let last: { at: string; from?: string } | null = null;
  if (lastStr) {
    try { last = JSON.parse(lastStr); } catch { last = null; }
  }
  return { rings, last };
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestHead: PagesFunction = async () => new Response(null, { status: 200, headers: CORS });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.VISITS) {
    return json({ rings: 0, last: null, note: 'VISITS KV namespace not bound; returning zero-state.' });
  }
  const state = await readState(env.VISITS);
  return json(state);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.VISITS) {
    return json(
      { ok: false, reason: 'kv-not-bound', note: 'Bind VISITS KV namespace to enable the rings counter.' },
      { status: 503 },
    );
  }

  let from: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { from?: unknown };
    if (typeof body.from === 'string' && body.from.length <= 40) from = body.from;
  } catch { /* tolerate bad bodies */ }

  // Read-modify-write. KV doesn't offer atomic counters, so concurrent
  // rings can collide and undercount by 1 every now and then — fine for
  // a vanity counter, not a financial one.
  const current = await readState(env.VISITS);
  const next = current.rings + 1;
  const at = new Date().toISOString();
  await Promise.all([
    env.VISITS.put(TOTAL_KEY, String(next)),
    env.VISITS.put(LAST_KEY, JSON.stringify({ at, from })),
  ]);

  return json({ ok: true, rings: next, at });
};
