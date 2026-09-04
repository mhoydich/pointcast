/**
 * POST /api/faucet/{slug}/deliver — send every held drip to an address.
 *
 * Body: { address?: '0x…' }. Falls back to the account's linked EVM
 * identity when no address is given. The spigot wallet signs and pays
 * gas; the account signs nothing. One transaction carries all held drips.
 */
import { getFaucet, isEvmAddress } from '../../../../src/lib/faucet';
import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../../_rate-limit';
import { authJson, hasAuthStorage, readSessionFromRequest } from '../../auth/session';
import {
  deliverHeldFaucetDrips,
  linkedEvmAddress,
  type FaucetChainFactory,
  type FaucetClaimEnv,
} from '../_claims';

interface DeliverBody { address?: unknown }

export async function handleFaucetDelivery(
  request: Request,
  env: FaucetClaimEnv,
  slug: string,
  options: { chainFactory?: FaucetChainFactory } = {},
): Promise<Response> {
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

  let body: DeliverBody = {};
  try { body = await request.json() as DeliverBody; } catch { /* address may come from the account */ }
  const pasted = typeof body.address === 'string' ? body.address.trim() : '';
  const deliveredTo = pasted || linkedEvmAddress(current.user) || '';
  if (!isEvmAddress(deliveredTo)) {
    return authJson({ ok: false, configured: true, reason: 'address-required', delivered: 0 }, { status: 400 });
  }

  const limit = await rateLimit(request, env, {
    bucket: 'faucet-deliver-user',
    clientId: `user:${current.user.userId}`,
    windowSec: 600,
    maxRequests: 5,
  });
  if (!limit.allowed) return rateLimitResponse(limit, 'This account has made too many delivery attempts.');

  let result: Awaited<ReturnType<typeof deliverHeldFaucetDrips>>;
  try {
    result = await deliverHeldFaucetDrips({
      env,
      userId: current.user.userId,
      faucet,
      deliveredTo,
      chainFactory: options.chainFactory,
    });
  } catch (error) {
    // The desk parses every response as JSON; a bare D1 error must not reach
    // it as a platform 500 with an HTML body.
    console.error(JSON.stringify({
      message: 'faucet-delivery-unavailable',
      faucet: faucet.slug,
      userId: current.user.userId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return applyRateLimitHeaders(
      authJson({ ok: false, reason: 'delivery-unavailable', delivered: 0, faucet: faucet.slug }, { status: 503 }),
      limit,
    );
  }
  const status = result.ok
    ? 200
    : result.reason === 'nothing-held' || result.reason === 'delivery-busy'
      ? 409
      : result.reason === 'address-required'
        ? 400
        : 503;
  return applyRateLimitHeaders(authJson({ ...result, faucet: faucet.slug }, { status }), limit);
}

export const onRequestPost: PagesFunction<FaucetClaimEnv> = async ({ request, env, params }) => (
  handleFaucetDelivery(request, env, typeof params.slug === 'string' ? params.slug : '')
);
