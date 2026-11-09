/**
 * POST /api/points/leave → stop earning and hide your name on the ledger.
 *
 * The ledger is append-only, so earlier lines stay (under the opaque profile
 * id, with no name). New check-ins and drum days stop adding lines.
 */
import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { leaveLedger, pointsEnabled, type PointsEnv } from '../../_lib/network-points.ts';

interface Env extends AuthEnv, PointsEnv {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (request.headers.get('origin') !== new URL(request.url).origin) return authJson({ ok: false, reason: 'origin-not-allowed' }, { status: 403 });
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    return authJson({ ok: false, reason: 'json-required' }, { status: 415 });
  }
  if (!pointsEnabled(env)) return authJson({ ok: false, reason: 'points-ledger-off' }, { status: 503 });
  const current = await readSessionFromRequest(request, env).catch(() => null);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  try {
    await leaveLedger(env.AUTH_DB!, current.user.userId);
    return authJson({ ok: true, member: false });
  } catch {
    return authJson({ ok: false, reason: 'points-unavailable' }, { status: 503 });
  }
};
