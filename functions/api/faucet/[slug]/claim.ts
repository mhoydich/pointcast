/**
 * POST /api/faucet/{slug}/claim — write today's drip into the ledger.
 *
 * Needs a PointCast session (Google, passkey, email). No wallet. Nothing
 * is sent on-chain here; the row is `held` until the account asks for
 * delivery. One claim per account per Los Angeles day, capped per day.
 */
import { getFaucet, losAngelesDate } from '../../../../src/lib/faucet';
import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../../_rate-limit';
import { authJson, hasAuthStorage, readSessionFromRequest } from '../../auth/session';
import { claimFaucetDrip, faucetCap, spigotConfigured, type FaucetClaimEnv } from '../_claims';

export async function handleFaucetClaim(request: Request, env: FaucetClaimEnv, slug: string): Promise<Response> {
  const faucet = getFaucet(slug);
  if (!faucet) return authJson({ ok: false, reason: 'unknown-faucet' }, { status: 404 });
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, configured: false, reason: 'auth-storage-not-bound' }, { status: 503 });
  }
  if (!env.AUTH_DB) {
    return authJson({ ok: false, configured: false, reason: 'claim-database-not-bound' }, { status: 503 });
  }
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

  const [ipLimit, userLimit] = await Promise.all([
    rateLimit(request, env, { bucket: 'faucet-claim-ip', windowSec: 600, maxRequests: 20 }),
    rateLimit(request, env, {
      bucket: 'faucet-claim-user',
      clientId: `user:${current.user.userId}`,
      windowSec: 3600,
      maxRequests: 6,
    }),
  ]);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit, 'Too many claim attempts from this connection.');
  if (!userLimit.allowed) return rateLimitResponse(userLimit, 'This account has made too many claim attempts.');

  const day = losAngelesDate();
  const result = await claimFaucetDrip({ env, user: current.user, faucet, day });
  const body = {
    ...result,
    configured: spigotConfigured(env, faucet),
    day,
    cap: faucetCap(env, faucet),
    faucet: faucet.slug,
  };
  const status = result.ok ? 200 : result.reason === 'claim-database-not-bound' ? 503 : 409;
  const response = authJson(body, { status });
  applyRateLimitHeaders(response, ipLimit);
  response.headers.set('X-RateLimit-User-Remaining', String(userLimit.remaining));
  return response;
}

export const onRequestPost: PagesFunction<FaucetClaimEnv> = async ({ request, env, params }) => (
  handleFaucetClaim(request, env, typeof params.slug === 'string' ? params.slug : '')
);
