/**
 * /api/pmm/turn — short-lived TURN credentials for PointCast Mobile Messaging.
 *
 * Two phones behind strict carrier NAT cannot reach each other with STUN
 * alone. When Cloudflare Calls TURN is configured, this endpoint mints a
 * four-hour credential per request and the phones add the relay to their
 * ICE servers. Four hours outlives the ten-minute handshake window plus a
 * long chat; a relayed line drops when its credential expires. Bytes that go
 * through the relay are counted and shown in the LINK panel as VIA RELAY;
 * the relay still cannot read them (DTLS).
 *
 *   GET /api/pmm/turn → 200 { iceServers: [...], ttlSeconds }
 *                     → 200 { iceServers: [], reason: 'turn-not-configured' } until the secrets exist
 *                       (a 200, not a 503, so phones polling it log no console errors)
 *                     → 403 { iceServers: [], reason: 'turn-site-only' } when the request is not from a pointcast.xyz page
 *
 * A TURN credential relays any traffic for its lifetime and relayed bytes are
 * billed to the account, so the endpoint only answers the site's own pages
 * (Sec-Fetch-Site same-origin, or a same-origin Origin/Referer) and is rate
 * limited per IP. That stops other websites and casual scripts; a determined
 * client can forge those headers, so the Calls dashboard's usage alerts are
 * the backstop.
 *
 * Configure in Cloudflare Pages → Settings → Environment variables (encrypt both):
 *   CF_TURN_KEY_ID     — the TURN key id from Calls → TURN keys
 *   CF_TURN_API_TOKEN  — that key's API token
 * Nothing is committed. Until both are set the app is STUN-only, as before.
 */
import { rateLimit, rateLimitResponse } from '../../_rate-limit.ts';

export interface Env {
  CF_TURN_KEY_ID?: string;
  CF_TURN_API_TOKEN?: string;
  PC_RATES_KV?: KVNamespace;
}

export interface IceServer { urls: string[]; username?: string; credential?: string }

const TTL_SECONDS = 14_400;
const UPSTREAM_TIMEOUT_MS = 4000;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

export const turnConfigured = (env: Env) => Boolean(env.CF_TURN_KEY_ID && env.CF_TURN_API_TOKEN);

/** Normalise either shape Cloudflare has returned: `{ iceServers: {...} }` or `{ iceServers: [...] }`. */
export const normalizeIceServers = (body: unknown): IceServer[] => {
  const raw = body && typeof body === 'object' ? (body as { iceServers?: unknown }).iceServers : null;
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  const out: IceServer[] = [];
  for (const s of list) {
    if (!s || typeof s !== 'object') continue;
    const { urls, username, credential } = s as Record<string, unknown>;
    const u = (Array.isArray(urls) ? urls : typeof urls === 'string' ? [urls] : []).filter((x): x is string => typeof x === 'string' && /^(stun|turn|turns):/.test(x));
    if (!u.length) continue;
    const server: IceServer = { urls: u };
    if (typeof username === 'string' && typeof credential === 'string') { server.username = username; server.credential = credential; }
    out.push(server);
  }
  return out;
};

/** True when the request comes from one of the site's own pages. */
export function fromSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const own = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin) return origin === own;
  const referer = request.headers.get('referer');
  if (referer) { try { return new URL(referer).origin === own; } catch { return false; } }
  return false;
}

export async function mintTurn(env: Env, fetchImpl: typeof fetch = fetch, ttl = TTL_SECONDS): Promise<IceServer[]> {
  const res = await fetchImpl(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.CF_TURN_KEY_ID!)}/credentials/generate-ice-servers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`turn-upstream-${res.status}`);
  const servers = normalizeIceServers(await res.json());
  if (!servers.length) throw new Error('turn-upstream-empty');
  return servers;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!turnConfigured(env)) return json({ iceServers: [], reason: 'turn-not-configured' });
  if (!fromSite(request)) return json({ iceServers: [], reason: 'turn-site-only' }, 403);
  const rl = await rateLimit(request, env, { bucket: 'pmm:turn', windowSec: 60, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl, 'Too many relay requests. Wait a minute.');
  try {
    const iceServers = await mintTurn(env);
    return json({ iceServers, ttlSeconds: TTL_SECONDS });
  } catch (e) {
    return json({ reason: 'turn-unavailable', detail: e instanceof Error ? e.message : 'error' }, 502);
  }
};
