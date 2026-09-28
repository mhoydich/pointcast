/**
 * POST /api/air/claim — keep your stamps: move this phone's last 24 hours of
 * Field Reports (reports, confirms, points, stamps) to the signed-in account,
 * with the card @handle as the byline. Points are re-paid under the account's
 * 30-a-day cap, so claiming throwaway phones never passes it.
 *
 * { device } + the pc_session cookie
 * → 200 { ok, moved: { reports, confirms, points, stamps }, byline }
 *   401 sign-in · 400 bad-device · 429 rate-limited · 503
 *
 * The one Field Reports rate limit kept in KV (5 an hour per account); every
 * other limit counts D1 rows.
 */
import { rateLimit } from '../../_rate-limit';
// @ts-ignore — plain module shared with the tests
import { parseDevice } from '../../_lib/air-kinds.mjs';
import { claimDevice, fail, limited, readPost, unavailable, whoIs, type AirEnv } from '../../_lib/air-store.ts';

export const onRequestPost: PagesFunction<AirEnv> = async ({ request, env }) => {
  const read = await readPost(request);
  if ('refused' in read) return read.refused;
  const body = read.body && typeof read.body === 'object' ? read.body as Record<string, unknown> : {};
  const device = parseDevice(body.device) as string | null;
  if (!device) return fail('bad-device');
  if (!env.AUTH_DB) return unavailable();
  const who = await whoIs(request, env);
  if (!who.userId) return fail('sign-in', 401);
  const limit = await rateLimit(request, env, { bucket: 'air:claim', windowSec: 3600, maxRequests: 5, clientId: `user:${who.userId}` });
  if (!limit.allowed) return limited(limit.retryAfter);
  try {
    return await claimDevice(env.AUTH_DB, { ...who, userId: who.userId }, device, Date.now());
  } catch {
    return unavailable();
  }
};
