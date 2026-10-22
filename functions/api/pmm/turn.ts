/**
 * /api/pmm/turn — short-lived TURN credentials for PointCast Mobile Messaging.
 *
 * Two phones behind strict carrier NAT cannot reach each other with STUN
 * alone. When Cloudflare Calls TURN is configured, this endpoint mints a
 * ten-minute credential per request and the phones add the relay to their
 * ICE servers. Bytes that go through the relay are counted and shown in the
 * LINK panel as VIA RELAY; the relay still cannot read them (DTLS).
 *
 *   GET /api/pmm/turn → 200 { iceServers: [...], ttlSeconds }
 *                     → 200 { iceServers: [], reason: 'turn-not-configured' } until the secrets exist
 *                       (a 200, not a 503, so phones polling it log no console errors)
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

const TTL_SECONDS = 600;
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

export async function mintTurn(env: Env, fetchImpl: typeof fetch = fetch, ttl = TTL_SECONDS): Promise<IceServer[]> {
  const res = await fetchImpl(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.CF_TURN_KEY_ID!)}/credentials/generate-ice-servers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl }),
  });
  if (!res.ok) throw new Error(`turn-upstream-${res.status}`);
  const servers = normalizeIceServers(await res.json());
  if (!servers.length) throw new Error('turn-upstream-empty');
  return servers;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!turnConfigured(env)) return json({ iceServers: [], reason: 'turn-not-configured' });
  const rl = await rateLimit(request, env, { bucket: 'pmm:turn', windowSec: 60, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl, 'Too many relay requests. Wait a minute.');
  try {
    const iceServers = await mintTurn(env);
    return json({ iceServers, ttlSeconds: TTL_SECONDS });
  } catch (e) {
    return json({ reason: 'turn-unavailable', detail: e instanceof Error ? e.message : 'error' }, 502);
  }
};
