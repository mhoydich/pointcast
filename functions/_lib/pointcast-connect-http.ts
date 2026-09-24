/**
 * HTTP for Sign in with PointCast.
 *   GET  /api/connect/authorize?client=&scope=   what the consent screen will share (session)
 *   POST /api/connect/authorize {client, scope}   the member says yes → { code } (session, same-site)
 *   POST /api/connect/token {code, client}        the app trades the code once (CORS open)
 *   GET  /api/connect/grants                      sites you have signed into (session)
 *   DELETE /api/connect/grants {client}           forget one (session, same-site)
 */
import { readSessionFromRequest } from '../api/auth/session.ts';
import { ConnectError, authorize, exchange, forgetGrant, normalizeClient, normalizeScope, preview, readGrants, type ConnectEnv } from './pointcast-connect.ts';
import type { PointCastUser } from '../../src/lib/auth/types';

type SessionReader = (request: Request, env: ConnectEnv) => Promise<{ user: PointCastUser } | null>;
export type ConnectDeps = { readSession?: SessionReader };
export type ConnectAction = 'authorize' | 'token' | 'grants';

const base = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { ...base, ...extra } });
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' };

function ownPage(request: Request): boolean {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite) return fetchSite === 'same-origin';
  const origin = request.headers.get('Origin');
  try { return Boolean(origin) && origin === new URL(request.url).origin; } catch { return false; }
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ConnectError('invalid-request', 'Use Content-Type: application/json.');
  const raw = await request.text();
  if (raw.length > 4000) throw new ConnectError('invalid-request', 'Request too large.');
  try { const v = JSON.parse(raw); if (v && typeof v === 'object' && !Array.isArray(v)) return v; } catch { /* below */ }
  throw new ConnectError('invalid-request', 'Send a JSON object.');
}

export async function handleConnect(request: Request, env: ConnectEnv, action: ConnectAction, deps: ConnectDeps = {}): Promise<Response> {
  const readSession = deps.readSession || (readSessionFromRequest as unknown as SessionReader);
  try {
    if (action === 'token') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return json({ ok: false, reason: 'method-not-allowed' }, 405, { ...cors, Allow: 'POST, OPTIONS' });
      const b = await body(request);
      return json(await exchange(env, b.code, b.client, request.headers.get('Origin')), 200, cors);
    }

    if (request.method !== 'GET' && !ownPage(request)) return json({ ok: false, reason: 'cross-site', error: 'Only PointCast pages can do that.' }, 403);
    let current: Awaited<ReturnType<SessionReader>> = null;
    try { current = await readSession(request, env); } catch { return json({ ok: false, reason: 'session-unavailable', error: 'Sign-in is unavailable right now.' }, 503); }
    if (!current) return json({ ok: false, reason: 'unauthorized', error: 'Sign in to PointCast first.' }, 401);

    if (action === 'authorize') {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        const client = normalizeClient(url.searchParams.get('client'));
        if (!client) return json({ ok: false, reason: 'invalid-client', error: 'The app must be an https origin like https://example.com.' }, 400);
        return json({ ok: true, ...(await preview(env, current.user, client, normalizeScope(url.searchParams.get('scope')))) });
      }
      if (request.method !== 'POST') return json({ ok: false, reason: 'method-not-allowed' }, 405, { Allow: 'GET, POST' });
      const b = await body(request);
      return json({ ok: true, ...(await authorize(env, current.user, b.client, b.scope)) });
    }

    if (request.method === 'GET') return json({ ok: true, grants: await readGrants(env, current.user.userId), access: 'none-ongoing' });
    if (request.method !== 'DELETE') return json({ ok: false, reason: 'method-not-allowed' }, 405, { Allow: 'GET, DELETE' });
    const client = normalizeClient((await body(request)).client);
    if (!client) return json({ ok: false, reason: 'invalid-client' }, 400);
    return json({ ok: true, grants: await forgetGrant(env, current.user.userId, client) });
  } catch (e) {
    const extra = action === 'token' ? cors : {};
    if (e instanceof ConnectError) return json({ ok: false, reason: e.reason, error: e.message }, e.status, extra);
    return json({ ok: false, reason: 'unavailable', error: 'Sign in with PointCast is unavailable right now.' }, 503, extra);
  }
}
