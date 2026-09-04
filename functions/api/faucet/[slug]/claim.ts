/**
 * POST /api/faucet/{slug}/claim — write today's drip into the ledger.
 *
 * Needs a PointCast session (Google, passkey, email). No wallet. Nothing
 * is sent on-chain here; the row is `held` until the account asks for
 * delivery. One claim per account per Los Angeles day, capped per day.
 *
 * Body may carry `{ receipt }`: a satellite's signed completion receipt from
 * an allowlisted reward program (docs/plans/2026-09-05-rewards-protocol.md).
 * FISHCLUB has no button of its own and always needs one; HELLO's ordinary
 * claim still works, and a receipt there only adds provenance. This POST is
 * the only thing in the system that awards anything.
 */
import { getFaucet, losAngelesDate } from '../../../../src/lib/faucet';
import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../../_rate-limit';
import { authJson, hasAuthStorage, readSessionFromRequest } from '../../auth/session';
import { claimFaucetDrip, faucetCap, spigotConfigured, type ClaimReason, type FaucetClaimEnv } from '../_claims';

interface ClaimBody { receipt?: unknown }

/** Longer than any receipt this protocol produces. A paste bomb is not a claim. */
const MAX_RECEIPT_LENGTH = 4_096;

function claimStatus(reason: ClaimReason | undefined): number {
  switch (reason) {
    case 'account-mismatch':
      return 403;
    case 'already-claimed':
    case 'daily-cap-reached':
      return 409;
    case 'claim-database-not-bound':
    case 'rewards-not-configured':
      return 503;
    default:
      // Everything a receipt can be wrong about is a bad request, not a
      // server fault: the person needs a new run, not a retry.
      return 400;
  }
}

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

  let payload: ClaimBody = {};
  // The ordinary HELLO claim posts no body at all, so a missing one is normal.
  try { payload = await request.json() as ClaimBody; } catch { /* no receipt, then */ }
  const receipt = typeof payload.receipt === 'string' ? payload.receipt.trim().slice(0, MAX_RECEIPT_LENGTH) : '';

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
  let result: Awaited<ReturnType<typeof claimFaucetDrip>>;
  try {
    result = await claimFaucetDrip({ env, user: current.user, faucet, day, receipt });
  } catch (error) {
    // The desk parses every response as JSON; a bare D1 error must not reach
    // it as a platform 500 with an HTML body. A receipt that could not be
    // written is still unconsumed, so this is honestly retryable.
    console.error(JSON.stringify({
      message: 'faucet-claim-unavailable',
      faucet: faucet.slug,
      userId: current.user.userId,
      // Never the receipt itself.
      receipt: receipt ? 'present' : 'absent',
      error: error instanceof Error ? error.message : String(error),
    }));
    return authJson({ ok: false, reason: 'claim-unavailable', day, faucet: faucet.slug }, { status: 503 });
  }
  const body = {
    ...result,
    configured: spigotConfigured(env, faucet),
    day,
    cap: faucetCap(env, faucet),
    faucet: faucet.slug,
    claimMode: faucet.claim,
  };
  const status = result.ok ? 200 : claimStatus(result.reason);
  const response = authJson(body, { status });
  applyRateLimitHeaders(response, ipLimit);
  response.headers.set('X-RateLimit-User-Remaining', String(userLimit.remaining));
  return response;
}

export const onRequestPost: PagesFunction<FaucetClaimEnv> = async ({ request, env, params }) => (
  handleFaucetClaim(request, env, typeof params.slug === 'string' ? params.slug : '')
);
