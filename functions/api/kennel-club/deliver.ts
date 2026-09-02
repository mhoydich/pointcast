import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../_rate-limit';
import {
  deliverHeldKennelClubDogs,
  linkedTezosAddress,
  type ClaimChainFactory,
  type KennelClaimEnv,
} from './_claims';
import {
  authJson,
  hasAuthStorage,
  readSessionFromRequest,
} from '../auth/session';

export async function handleKennelClubDelivery(
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
  const deliveredTo = linkedTezosAddress(current.user);
  if (!deliveredTo) {
    return authJson({ ok: false, configured: true, reason: 'tezos-wallet-required' }, { status: 409 });
  }

  const limit = await rateLimit(request, env, {
    bucket: 'kennel-deliver-user',
    clientId: `user:${current.user.userId}`,
    windowSec: 600,
    maxRequests: 5,
  });
  if (!limit.allowed) return rateLimitResponse(limit, 'This account has made too many delivery attempts.');

  const result = await deliverHeldKennelClubDogs({
    env,
    userId: current.user.userId,
    deliveredTo,
    chainFactory: options.chainFactory,
  });
  const status = result.ok ? 200 : result.reason === 'tezos-wallet-required' ? 409 : 503;
  return applyRateLimitHeaders(authJson(result, { status }), limit);
}

export const onRequestPost: PagesFunction<KennelClaimEnv> = async ({ request, env }) => (
  handleKennelClubDelivery(request, env)
);
