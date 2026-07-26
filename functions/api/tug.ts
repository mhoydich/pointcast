/**
 * /api/tug — the one rope across the town.
 *
 * Forward-only, same shape as functions/api/presence/snapshot.ts: every
 * request goes to the `global` PresenceRoom Durable Object, rewritten
 * onto its `/tug` path. All the physics — the tallies, the lazily
 * decayed knot, the per-puller rate window — live in
 * workers/presence/src/index.ts. Nothing is decided here.
 *
 * Why a Durable Object and not KV: two pullers landing in the same
 * millisecond race the read-modify-write in KV and one of them
 * disappears. /api/duel says so in its own header; /api/meadow shrugs it
 * off with a line about being a meadow and not a ledger. A tug-of-war
 * IS a ledger — the two numbers underneath the rope are the only
 * permanent record on this site that a machine was ever here — so it
 * gets the DO.
 *
 *   GET  /api/tug
 *     → { ok: true, tug: { humanPulls, machinePulls, knot, updatedAt }, now }
 *       `knot` is −1 (all the way to the people's end) … 0 … +1 (all the
 *       way to the machines'), already decayed to `now`.
 *
 *   POST /api/tug   { side?: 'human' | 'machine', by?: string }
 *     → 200 with the rope after the pull, or 429 { ok:false,
 *       reason:'rate-limited' } when the same puller is leaning on it.
 *       `side` defaults to 'human'. `by` is a stable puller id — the
 *       browser sends its pc:room:sid, an agent sends its own label.
 *
 * Graceful degrade: if the PRESENCE binding is missing the rope reads as
 * a centred, untouched rope rather than a 500, so the dock renders quiet
 * instead of broken.
 */

interface Env {
  PRESENCE?: DurableObjectNamespace;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const UNBOUND_ROPE = JSON.stringify({
  ok: false,
  reason: 'presence-unbound',
  tug: { humanPulls: 0, machinePulls: 0, knot: 0, updatedAt: 0 },
  note: 'presence DO not bound — see docs/presence-next-steps.md',
});

function unbound(): Response {
  return new Response(UNBOUND_ROPE, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function forward(env: Env, request: Request, method: 'GET' | 'POST'): Promise<Response> {
  if (!env.PRESENCE) return unbound();

  try {
    const id = env.PRESENCE.idFromName('global');
    const stub = env.PRESENCE.get(id);

    const doUrl = new URL(request.url);
    doUrl.pathname = '/tug';
    doUrl.search = '';

    const init: RequestInit =
      method === 'POST'
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: await request.text(),
          }
        : { method: 'GET' };

    const response = await stub.fetch(new Request(doUrl.toString(), init));
    const headers = new Headers(CORS_HEADERS);
    headers.set('Content-Type', 'application/json');
    // The rope is live state. Never cache it — a cached knot is a lie
    // about the last ninety seconds of the town.
    headers.set('Cache-Control', 'no-store');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    console.error('[api/tug] DO fetch failed:', err);
    return unbound();
  }
}

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' },
  });

export const onRequestGet: PagesFunction<Env> = ({ env, request }) => forward(env, request, 'GET');

export const onRequestPost: PagesFunction<Env> = ({ env, request }) => forward(env, request, 'POST');
