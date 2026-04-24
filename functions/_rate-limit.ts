/**
 * _rate-limit.ts — shared KV-backed rate limiter for Pages Functions.
 *
 * Fixed-window counter keyed by `rl:<bucket>:<clientId>:<windowIdx>`.
 * Cheaper than a token bucket (one KV read + one conditional write per
 * request) and more than sufficient for the volumes Voice Dispatch,
 * Room chat, and the Wire MCP hook see.
 *
 * Graceful degradation: if `env.PC_RATES_KV` is unbound (first deploy,
 * staging envs, dev), `rateLimit` returns `{ allowed: true }` with a
 * diagnostic `degraded: true` flag. Endpoints can log this but should
 * not surface it to callers as an error.
 *
 * ClientId priority:
 *   1. explicit `clientId` in the options (e.g. sessionId from query)
 *   2. `CF-Connecting-IP` header (what CF always sets)
 *   3. `x-forwarded-for` first entry
 *   4. a constant fallback `anon` — only hits if CF isn't in front
 *
 * Provision once:
 *   npx wrangler kv namespace create "PC_RATES_KV"
 *   # then paste id into wrangler.toml [[kv_namespaces]] binding
 *
 * Until bound, rate limiting is advisory only. Safe.
 */

interface RateLimitOptions {
  /** Logical bucket name — keep short and unique, e.g. "talk:post". */
  bucket: string;
  /** Window duration in seconds. Default 60. */
  windowSec?: number;
  /** Maximum requests per window per client. Default 30. */
  maxRequests?: number;
  /** Optional explicit client id (takes precedence over IP headers). */
  clientId?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until window rolls over
  limit: number;
  window: number;
  bucket: string;
  degraded?: boolean; // true when KV unbound
}

interface MaybeRatesEnv {
  PC_RATES_KV?: KVNamespace;
}

export async function rateLimit(
  request: Request,
  env: MaybeRatesEnv,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const bucket = opts.bucket;
  const windowSec = Math.max(1, opts.windowSec ?? 60);
  const maxRequests = Math.max(1, opts.maxRequests ?? 30);

  const clientId = (opts.clientId || extractClientId(request) || 'anon').slice(0, 80);
  const windowIdx = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${bucket}:${clientId}:${windowIdx}`;

  // Time until this window ends — gives callers a correct Retry-After.
  const windowStartSec = windowIdx * windowSec;
  const nowSec = Date.now() / 1000;
  const retryAfter = Math.max(1, Math.ceil(windowStartSec + windowSec - nowSec));

  if (!env.PC_RATES_KV) {
    return {
      allowed: true,
      remaining: maxRequests,
      retryAfter,
      limit: maxRequests,
      window: windowSec,
      bucket,
      degraded: true,
    };
  }

  let count = 0;
  try {
    const raw = await env.PC_RATES_KV.get(key);
    if (raw) count = parseInt(raw, 10) || 0;
  } catch {
    // KV read failed — treat as allowed. Don't want a rate limiter
    // outage to take down user-facing endpoints.
    return {
      allowed: true,
      remaining: maxRequests,
      retryAfter,
      limit: maxRequests,
      window: windowSec,
      bucket,
      degraded: true,
    };
  }

  if (count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      limit: maxRequests,
      window: windowSec,
      bucket,
    };
  }

  // Increment. TTL = window + 5s so the entry self-cleans after the
  // window ends — no need for a sweeper.
  try {
    await env.PC_RATES_KV.put(key, String(count + 1), {
      expirationTtl: windowSec + 5,
    });
  } catch {
    // Again, don't fail closed on a KV write error.
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - count - 1),
    retryAfter,
    limit: maxRequests,
    window: windowSec,
    bucket,
  };
}

/**
 * Build a 429 response with standard rate-limit headers. Use when
 * `rateLimit(...)` returns `allowed: false`.
 */
export function rateLimitResponse(result: RateLimitResult, message?: string): Response {
  const body = {
    ok: false,
    error: message || 'rate limit exceeded',
    rateLimit: {
      bucket: result.bucket,
      limit: result.limit,
      windowSec: result.window,
      retryAfterSec: result.retryAfter,
    },
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 429,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': String(result.retryAfter),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + result.retryAfter)),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Attach advisory rate-limit headers to a successful response.
 * Mutates + returns the same Response for caller convenience.
 */
export function applyRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil(Date.now() / 1000 + result.retryAfter)),
  );
  if (result.degraded) response.headers.set('X-RateLimit-Mode', 'degraded-no-kv');
  return response;
}

function extractClientId(request: Request): string | null {
  const h = request.headers;
  const cf = h.get('CF-Connecting-IP');
  if (cf) return `ip:${cf}`;
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return `ip:${first}`;
  }
  return null;
}
