/**
 * /api/air/house — mark this phone as a house phone (docs/plans/
 * 2026-10-18-field-reports-v2-paper-spec.md §7.3). House phones and accounts
 * never count in the kill test or in the paper's busiest-court pick, and
 * marking one also takes its earlier reports out of the count (every count
 * reads air_house at count time).
 *
 * GET with `X-PC-Device: <uuid>` (never a query string) and the session
 * cookie → { ok, canMark: false } for anyone who is not the director (hasDirectorDeskAccess,
 * as /api/air/assign): a non-director learns nothing about the list. The
 * director gets { ok, canMark: true, marked }. `no-store`.
 *
 * POST { action: 'mark' | 'unmark', device } → { ok, marked }
 *   mark: this phone and the signed-in account go on the list; unmark: this
 *   phone comes off it (the account stays house by its role).
 *   400 bad-device · 400 bad-action · 403 forbidden (not the director) ·
 *   403 bad-origin · 415 · 413 · 503 store-unavailable (also before
 *   migrations/auth/0031_field_reports_paper.sql is applied).
 *
 * No response carries a hash or a user id.
 */
import { hasDirectorDeskAccess } from '../../../src/lib/director-access.ts';
import { readSessionFromRequest } from '../auth/session.ts';
// @ts-ignore — plain module shared with the tests
import { parseDevice, pidHash } from '../../_lib/air-kinds.mjs';
import { houseState, markHouse, unmarkHouse } from '../../_lib/air-count-store.ts';
import { fail, json, readPost, unavailable, type AirEnv } from '../../_lib/air-store.ts';

export const onRequestGet: PagesFunction<AirEnv> = async ({ request, env }) => {
  const device = parseDevice(request.headers.get('X-PC-Device')) as string | null;
  if (!device) return fail('bad-device');
  if (!env.AUTH_DB) return unavailable();
  try {
    const session = await readSessionFromRequest(request, env);
    if (!session || !hasDirectorDeskAccess(session)) return json({ ok: true, canMark: false });
    const marked = await houseState(env.AUTH_DB, await pidHash(device) as string, session.user.userId);
    return json({ ok: true, canMark: true, marked });
  } catch {
    return unavailable();
  }
};

export const onRequestPost: PagesFunction<AirEnv> = async ({ request, env }) => {
  const read = await readPost(request);
  if ('refused' in read) return read.refused;
  const body = read.body && typeof read.body === 'object' ? read.body as Record<string, unknown> : {};
  const device = parseDevice(body.device) as string | null;
  if (!device) return fail('bad-device');
  if (!env.AUTH_DB) return unavailable();
  try {
    const session = await readSessionFromRequest(request, env);
    if (!session || !hasDirectorDeskAccess(session)) return fail('forbidden', 403);
    if (body.action !== 'mark' && body.action !== 'unmark') return fail('bad-action');
    const pid = await pidHash(device) as string;
    if (body.action === 'mark') await markHouse(env.AUTH_DB, pid, session.user.userId, Date.now());
    else await unmarkHouse(env.AUTH_DB, pid);
    return json({ ok: true, marked: await houseState(env.AUTH_DB, pid, session.user.userId) });
  } catch {
    return unavailable();
  }
};
