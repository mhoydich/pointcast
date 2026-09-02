import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../_rate-limit';
import { losAngelesDate, sittingOfTheDay } from '../../../src/lib/kennel-club';
import {
  claimKennelClubDog,
  type ClaimChainFactory,
  type KennelClaimEnv,
} from './_claims';
import {
  authJson,
  hasAuthStorage,
  readSessionFromRequest,
} from '../auth/session';

export async function handleKennelClubClaim(
  request: Request,
  env: KennelClaimEnv,
  options: { chainFactory?: ClaimChainFactory } = {},
): Promise<Response> {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, configured: false, reason: 'auth-storage-not-bound' }, { status: 503 });
  }
  if (!env.AUTH_DB) {
    return authJson({ ok: false, configured: false, reason: 'claim-database-not-bound' }, { status: 503 });
  }
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

  const [ipLimit, userLimit] = await Promise.all([
    rateLimit(request, env, { bucket: 'kennel-claim-ip', windowSec: 600, maxRequests: 10 }),
    rateLimit(request, env, {
      bucket: 'kennel-claim-user',
      clientId: `user:${current.user.userId}`,
      windowSec: 3600,
      maxRequests: 3,
    }),
  ]);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit, 'Too many claim attempts from this connection.');
  if (!userLimit.allowed) return rateLimitResponse(userLimit, 'This account has made too many claim attempts.');

  const date = losAngelesDate();
  const today = sittingOfTheDay(date);
  if (today.mintDate !== date) {
    return authJson({ ok: false, configured: true, reason: 'claim-window-closed' }, { status: 409 });
  }
  const result = await claimKennelClubDog({
    env,
    user: current.user,
    tokenId: today.tokenId,
    chainFactory: options.chainFactory,
  });
  const status = result.ok
    ? 200
    : result.reason === 'already-claimed' || result.reason === 'claim-in-progress' || result.reason === 'daily-cap-reached'
      ? 409
      : 503;
  const response = authJson(result, { status });
  applyRateLimitHeaders(response, ipLimit);
  response.headers.set('X-RateLimit-User-Remaining', String(userLimit.remaining));
  return response;
}

export const onRequestPost: PagesFunction<KennelClaimEnv> = async ({ request, env }) => (
  handleKennelClubClaim(request, env)
);
