/**
 * The drum signal — one counter, many sources.
 *
 * Every beat that reaches the DrumCounter can carry a small source tag:
 *
 *   kind   pointcast | embed | standalone | artifact | agent | other
 *   app    which surface sent it  (/drum-v4, my-site.com, mcp, ...)
 *   place  optional coarse where  (a declared slug, else cc:<country>)
 *
 * Senders may declare a tag; when they don't, it is inferred from the
 * request's Origin/Referer so the 127 existing /drum* pages are attributed
 * without touching any of them. Only aggregates are stored — no IPs, no
 * sessions — and the DO re-normalizes whatever arrives.
 */

export const SIGNAL_KINDS = ['pointcast', 'embed', 'standalone', 'artifact', 'agent', 'other'] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];

export interface SignalSource {
  kind: SignalKind;
  app: string;
  place: string | null;
}

const POINTCAST_HOSTS = /(^|\.)pointcast\.xyz$|(^|\.)pointcast\.pages\.dev$|^localhost$|^127\.0\.0\.1$/;
const CLAUDE_HOSTS = /(^|\.)claude\.ai$|(^|\.)claudeusercontent\.com$|(^|\.)claude\.site$/;

export function signalSlug(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._/:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
}

function requestOrigin(request: Request): { host: string | null; path: string | null; sandboxed: boolean } {
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  let host: string | null = null;
  let path: string | null = null;
  try {
    if (referer) {
      const url = new URL(referer);
      host = url.hostname;
      path = url.pathname;
    }
  } catch { /* unparseable referer: fall back to Origin */ }
  if (!host && origin && origin !== 'null') {
    try {
      host = new URL(origin).hostname;
    } catch { /* ignore */ }
  }
  return { host, path, sandboxed: origin === 'null' && !host };
}

function pathApp(path: string | null): string {
  const trimmed = (path || '/').replace(/\/+$/, '') || '/';
  return trimmed === '/' ? 'home' : signalSlug(trimmed, 48) || 'home';
}

/**
 * Resolve the source for one request. `declared` is whatever the sender put
 * in its body; `country` comes from request.cf and is used only as a coarse
 * place when the sender didn't name one.
 */
export function resolveSource(request: Request, declared: unknown, country?: string | null): SignalSource {
  const input = declared && typeof declared === 'object'
    ? (declared as { kind?: unknown; app?: unknown; place?: unknown })
    : {};
  const { host, path, sandboxed } = requestOrigin(request);
  const fromPointcast = host ? POINTCAST_HOSTS.test(host) : false;

  let kind: SignalKind;
  let app: string;
  if (fromPointcast) {
    kind = 'pointcast';
    app = signalSlug(input.app, 48) || pathApp(path);
  } else if (host && CLAUDE_HOSTS.test(host)) {
    kind = 'artifact';
    app = signalSlug(input.app, 48) || 'claude';
  } else if (sandboxed) {
    // Sandboxed iframes (Claude artifacts among them) send `Origin: null`.
    kind = 'artifact';
    app = signalSlug(input.app, 48) || 'sandbox';
  } else if (host) {
    kind = 'embed';
    app = signalSlug(input.app, 48) || signalSlug(host, 48);
  } else {
    // No browser origin at all: a server, a script, curl, an agent.
    const claimed = SIGNAL_KINDS.includes(input.kind as SignalKind) ? (input.kind as SignalKind) : 'standalone';
    kind = claimed === 'pointcast' ? 'standalone' : claimed;
    app = signalSlug(input.app, 48) || 'direct';
  }
  // A browser page may refine its kind (e.g. an embed that is really an
  // artifact), but only PointCast's own origin can call itself pointcast.
  if (host && !fromPointcast && input.kind && SIGNAL_KINDS.includes(input.kind as SignalKind) && input.kind !== 'pointcast') {
    kind = input.kind as SignalKind;
  }

  const declaredPlace = signalSlug(input.place, 32);
  const cc = typeof country === 'string' && /^[A-Za-z]{2}$/.test(country) ? `cc:${country.toLowerCase()}` : '';
  return { kind, app, place: declaredPlace || cc || null };
}

export function requestCountry(request: Request): string | null {
  const cf = (request as Request & { cf?: { country?: unknown } }).cf;
  return typeof cf?.country === 'string' ? cf.country : null;
}

/**
 * Opaque per-member key for the drum counter. A signed-in PointCast member's
 * beats are credited to this hash of their user id, never the id itself, so
 * the counter can rank members without knowing who they are.
 * Never change the prefix: it would orphan every member's total.
 */
export async function drumMemberKey(userId: string): Promise<string> {
  const bytes = new TextEncoder().encode(`pointcast-drum-member/v1|${userId}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
