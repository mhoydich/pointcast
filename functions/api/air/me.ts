/**
 * GET /api/air/me — your Field Reports card: points, weekly streak, stamps,
 * badges and your last 20 reports. Identify with the `X-PC-Device: <uuid>`
 * header, the pc_session cookie, or both; never a query string. Only ever the
 * caller's own rows. Signed in with an unclaimed phone, `claimable` counts
 * what POST /api/air/claim would move.
 *
 * → { ok, owner: 'user'|'device', byline, points: {today, total}, streakWeeks, stamps, badges, reports, claimable }
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { parseDevice } from '../../_lib/air-kinds.mjs';
import { fail, mePayload, unavailable, type AirEnv } from '../../_lib/air-store.ts';

export const onRequestGet: PagesFunction<AirEnv> = async ({ request, env }) => {
  const raw = request.headers.get('X-PC-Device');
  const device = parseDevice(raw) as string | null;
  if (raw && !device) return fail('bad-device');
  if (!env.AUTH_DB) return unavailable();
  try {
    return await mePayload(request, env, env.AUTH_DB, AIR_CONFIG, device, Date.now());
  } catch {
    return unavailable();
  }
};
