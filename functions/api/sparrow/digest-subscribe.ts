/**
 * functions/api/sparrow/digest-subscribe.ts — v0.32 digest sidecar stub.
 *
 * POST /api/sparrow/digest-subscribe
 *   body: sparrow-digest-subscription-v1
 *     { schema, email, frequency, npub?, relays?, created_at }
 *
 * Behavior (env-guarded):
 *   - Valid schema + email + frequency → 202 Accepted, stored in KV if bound
 *     (binding: SPARROW_DIGEST_KV). Without KV binding, still 202 — ack means
 *     "shape accepted" so the v0.30 client clears the retry state.
 *   - Malformed → 400 { reason }
 *   - GET → protocol doc + binding status (same pattern ping.ts uses)
 *   - HEAD → 200 health check
 *   - OPTIONS → CORS preflight
 *
 * What's NOT yet built:
 *   - Cron trigger / actual email dispatch. That ships alongside the cron
 *     worker (separate concern — this endpoint is intent capture only).
 *   - Unsubscribe. Planned as DELETE with a signed token from the email
 *     footer; until mail sends, there's nothing to unsubscribe from.
 *
 * Privacy / trust:
 *   - We store email + npub + relays + frequency. No secret material.
 *   - The eventual cron worker re-aggregates signals bundles from the
 *     same public Nostr relay pool Sparrow clients already subscribe to —
 *     never holds anything signed by the user.
 */

export interface Env {
  SPARROW_DIGEST_KV?: KVNamespace;
}

interface SubscriptionPayload {
  schema?: string;
  email?: string;
  frequency?: string;
  npub?: string | null;
  relays?: string[];
  created_at?: string;
}

const ALLOWED_FREQUENCIES = new Set(['weekly', 'biweekly', 'monthly']);
const MAX_BODY_BYTES = 8 * 1024;
const MAX_RELAYS = 32;

const corsHeaders = (): HeadersInit => ({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });

const docResponse = (env: Env) =>
  jsonResponse(200, {
    endpoint: '/api/sparrow/digest-subscribe',
    schema: 'sparrow-digest-subscription-v1',
    status: env.SPARROW_DIGEST_KV ? 'kv-bound' : 'kv-missing',
    accepts: {
      method: 'POST',
      content_type: 'application/json',
      shape: {
        schema: '"sparrow-digest-subscription-v1"',
        email: 'string · user-supplied',
        frequency: 'weekly | biweekly | monthly',
        npub: '64-hex pubkey or null',
        relays: 'string[]? · up to 32 wss:// URLs',
        created_at: 'ISO 8601',
      },
    },
    responses: {
      '202': 'intent accepted; stored in KV if binding is available',
      '400': 'malformed body or invalid schema/email/frequency',
      '413': 'body exceeds 8KB',
    },
    roadmap: {
      next: 'cron worker (separate deploy) that aggregates the user\'s /sparrow/signals recap and sends an HTML email',
      unsubscribe: 'DELETE with a signed token from the email footer — lands with the cron worker',
    },
    docs: 'https://pointcast.xyz/sparrow.json · nostr.federated_lists.digest_sidecar',
  });

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(trimmed)) return null;
  if (trimmed.length > 254) return null;
  return trimmed;
}

function normalizeRelays(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((u): u is string => typeof u === 'string' && u.startsWith('ws'))
    .map((u) => u.slice(0, 200))
    .slice(0, MAX_RELAYS);
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestHead: PagesFunction = async () =>
  new Response(null, { status: 200, headers: corsHeaders() });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => docResponse(env);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { ok: false, reason: 'body too large' });
  }

  let payload: SubscriptionPayload;
  try {
    payload = (await request.json()) as SubscriptionPayload;
  } catch {
    return jsonResponse(400, { ok: false, reason: 'invalid JSON' });
  }
  if (!payload || typeof payload !== 'object') {
    return jsonResponse(400, { ok: false, reason: 'body must be an object' });
  }
  if (payload.schema !== 'sparrow-digest-subscription-v1') {
    return jsonResponse(400, { ok: false, reason: 'unknown schema' });
  }
  const email = normalizeEmail(payload.email);
  if (!email) {
    return jsonResponse(400, { ok: false, reason: 'invalid email' });
  }
  const frequency = typeof payload.frequency === 'string' ? payload.frequency : 'weekly';
  if (!ALLOWED_FREQUENCIES.has(frequency)) {
    return jsonResponse(400, { ok: false, reason: 'frequency must be weekly | biweekly | monthly' });
  }
  const npub = typeof payload.npub === 'string' && /^[0-9a-f]{64}$/i.test(payload.npub)
    ? payload.npub.toLowerCase()
    : null;
  const relays = normalizeRelays(payload.relays);

  const record = {
    schema: 'sparrow-digest-subscription-v1',
    email,
    frequency,
    npub,
    relays,
    client_created_at: typeof payload.created_at === 'string' ? payload.created_at : null,
    received_at: new Date().toISOString(),
    user_agent: (request.headers.get('user-agent') || '').slice(0, 200),
  };

  // KV binding is optional. When missing, we still 202 so the v0.30
  // client stops retrying, but we note in the response that persistence
  // didn't happen. Operators can bind SPARROW_DIGEST_KV later without
  // a code change.
  let stored = false;
  let key: string | null = null;
  if (env.SPARROW_DIGEST_KV) {
    key = `sub:${email}`;
    try {
      await env.SPARROW_DIGEST_KV.put(key, JSON.stringify(record), {
        // 400 days ≈ long enough that a quiet user isn't dropped.
        expirationTtl: 60 * 60 * 24 * 400,
        metadata: { frequency, npub, received_at: record.received_at },
      });
      stored = true;
    } catch {
      // Keep calm; the ack below still returns 202 so the client isn't
      // stuck in a retry loop for a transient KV hiccup.
    }
  }

  return jsonResponse(202, {
    ok: true,
    stored,
    key,
    echo: {
      email: record.email,
      frequency: record.frequency,
      has_npub: !!npub,
      relays_count: relays.length,
    },
    note: stored
      ? 'intent recorded · cron worker is still in development'
      : 'intent accepted · storage binding absent so nothing was persisted server-side',
  });
};
