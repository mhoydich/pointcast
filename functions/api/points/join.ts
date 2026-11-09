/**
 * POST /api/points/join  { name?: string, handle?: string } → join the open Network Points ledger.
 * handle is the member's shared profile handle (elsegundo.xyz/profiles/<handle>.json).
 *
 * Signed-in members only. Joining is what lets check-ins and drum days earn
 * public ledger lines; nobody is on the ledger without choosing to be.
 */
import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { HANDLE_RE, joinLedger, pointsEnabled, type PointsEnv } from '../../_lib/network-points.ts';

interface Env extends AuthEnv, PointsEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (request.headers.get('origin') !== new URL(request.url).origin) return authJson({ ok: false, reason: 'origin-not-allowed' }, { status: 403 });
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    return authJson({ ok: false, reason: 'json-required' }, { status: 415 });
  }
  if (!pointsEnabled(env)) return authJson({ ok: false, reason: 'points-ledger-off' }, { status: 503 });
  const current = await readSessionFromRequest(request, env).catch(() => null);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  let name: string | null = null;
  let handle: string | null = null;
  try {
    const raw = await request.text();
    if (raw.length > 512) return authJson({ ok: false, reason: 'too-large' }, { status: 413 });
    const body = raw ? JSON.parse(raw) : {};
    name = typeof body.name === 'string' ? body.name : null;
    if (body.handle !== undefined && body.handle !== null) {
      if (typeof body.handle !== 'string' || !HANDLE_RE.test(body.handle)) return authJson({ ok: false, reason: 'bad-handle' }, { status: 400 });
      handle = body.handle;
    }
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  try {
    const profile = await joinLedger(env.AUTH_DB!, current.user.userId, name, handle);
    return authJson({ ok: true, profile, handle, member: true });
  } catch (error) {
    if (handle && /UNIQUE/i.test(String(error))) return authJson({ ok: false, reason: 'handle-taken' }, { status: 409 });
    return authJson({ ok: false, reason: 'points-unavailable' }, { status: 503 });
  }
};
