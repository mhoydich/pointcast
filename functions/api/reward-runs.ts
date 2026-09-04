/**
 * POST /api/reward-runs — bind a rewarded trip to this account.
 *
 * This is the step that makes the whole thing account-bound. A completion
 * receipt is a bearer token: without binding the run to an account before the
 * person leaves, a stolen receipt could be claimed by whoever holds it. So the
 * rewarded route takes a short trip through PointCast first, and the satellite
 * is handed a run id that means nothing without the row written here.
 *
 * Creates nothing on GET, nothing without a session, and nothing when the
 * account already has today's line for that token. The satellite receives no
 * cookie, no email, no user id and no address; the launch ticket carries a run
 * id, a program, a nonce and two timestamps, and that is all.
 *
 * Wire format and checks: docs/plans/2026-09-05-rewards-protocol.md.
 *
 * Env:
 *   AUTH_DB                     D1, the ledger and reward_runs
 *   PC_RATES_KV                 rate limits
 *   REWARDS_TONEBLOOM_SECRET    shared HMAC secret with Tone Bloom
 *   REWARDS_INDUSTRYNEXT_SECRET shared HMAC secret with Industry Next
 */
import { getFaucet } from '../../src/lib/faucet';
import {
  LAUNCH_TTL_SECONDS,
  RUN_TTL_SECONDS,
  getRewardProgram,
  launchUrlFor,
  newRewardNonce,
  newRunId,
  nowSeconds,
  signRewardToken,
  type RewardLaunchPayload,
  type RewardProgram,
} from '../../src/lib/rewards';
import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../_rate-limit';
import { authJson, hasAuthStorage, readSessionFromRequest } from './auth/session';
import { ensureFaucetSchema, hasClaimedFaucetToday, type FaucetClaimEnv } from './faucet/_claims';

interface RewardRunBody { program?: unknown }

interface OpenRunRow {
  id: string;
  status: string;
  created_at: string;
  expires_at: string;
  launch_nonce: string;
}

/**
 * Same-site or nothing. A session cookie is SameSite=Lax, which a cross-site
 * POST cannot carry, but belt and braces: `Sec-Fetch-Site` is set by every
 * browser that can make this request, and `none` covers an address-bar visit.
 * An `Origin` equal to our own origin is the fallback for anything that sends
 * one instead. Everything else is somebody else's page talking for you.
 */
function sameSiteRequest(request: Request): boolean {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none';
  const origin = request.headers.get('Origin');
  if (origin) {
    try { return origin === new URL(request.url).origin; } catch { return false; }
  }
  return false;
}

function programSecret(env: FaucetClaimEnv, program: RewardProgram): string | null {
  const secret = env[program.secretEnv]?.trim();
  return secret ? secret : null;
}

async function ticketFor(program: RewardProgram, runId: string, nonce: string, secret: string): Promise<string> {
  const iat = nowSeconds();
  const payload: RewardLaunchPayload = {
    v: 1,
    kid: program.kid,
    iss: 'pointcast',
    aud: program.issuer,
    program: program.id,
    run: runId,
    iat,
    exp: iat + LAUNCH_TTL_SECONDS,
    nonce,
  };
  return signRewardToken('launch', payload, secret);
}

export async function handleRewardRunPost(request: Request, env: FaucetClaimEnv): Promise<Response> {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, reason: 'auth-storage-not-bound' }, { status: 503 });
  }
  if (!env.AUTH_DB) {
    return authJson({ ok: false, reason: 'claim-database-not-bound' }, { status: 503 });
  }
  if (!sameSiteRequest(request)) {
    return authJson({ ok: false, reason: 'cross-site' }, { status: 403 });
  }
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

  let body: RewardRunBody = {};
  try { body = await request.json() as RewardRunBody; } catch { /* an empty body is an unknown program */ }
  const program = getRewardProgram(typeof body.program === 'string' ? body.program : null);
  if (!program) return authJson({ ok: false, reason: 'unknown-program' }, { status: 404 });
  const faucet = getFaucet(program.faucet);
  if (!faucet) return authJson({ ok: false, reason: 'unknown-faucet' }, { status: 404 });

  const limit = await rateLimit(request, env, {
    bucket: 'reward-run-user',
    clientId: `user:${current.user.userId}`,
    windowSec: 600,
    maxRequests: 10,
  });
  if (!limit.allowed) return rateLimitResponse(limit, 'This account has started too many runs. Try again shortly.');

  const secret = programSecret(env, program);
  if (!secret) {
    // Nothing is created: a run whose ticket cannot be signed is a dead row.
    return applyRateLimitHeaders(
      authJson({ ok: false, reason: 'rewards-not-configured', program: program.id }, { status: 503 }),
      limit,
    );
  }

  const db = env.AUTH_DB;
  await ensureFaucetSchema(db);

  // Already have today's line for that token? Say so and create nothing. The
  // room is still open; repeat listening is welcome, it just earns nothing.
  if (await hasClaimedFaucetToday(db, faucet, current.user.userId)) {
    return applyRateLimitHeaders(
      authJson({ ok: false, reason: 'already-claimed-today', program: program.id, faucet: faucet.slug }, { status: 409 }),
      limit,
    );
  }

  const now = Date.now();
  const existing = await db.prepare(`
    SELECT id, status, created_at, expires_at, launch_nonce
    FROM reward_runs
    WHERE user_id = ? AND program = ? AND status = 'open'
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(current.user.userId, program.id).first<OpenRunRow>();

  let run: OpenRunRow;
  if (existing && Date.parse(existing.expires_at) > now) {
    // One active run per account per program. Coming back to the start page
    // resumes the same run with a fresh ticket rather than orphaning it.
    run = existing;
  } else {
    if (existing) {
      await db.prepare(`UPDATE reward_runs SET status = 'expired' WHERE id = ? AND status = 'open'`)
        .bind(existing.id).run().catch(() => { /* a stale open row is harmless */ });
    }
    const createdAt = new Date(now).toISOString();
    run = {
      id: newRunId(),
      status: 'open',
      created_at: createdAt,
      expires_at: new Date(now + RUN_TTL_SECONDS * 1000).toISOString(),
      launch_nonce: newRewardNonce(),
    };
    await db.prepare(`
      INSERT INTO reward_runs (id, user_id, issuer, program, faucet, status, created_at, expires_at, launch_nonce)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)
    `).bind(
      run.id, current.user.userId, program.issuer, program.id, faucet.slug,
      run.created_at, run.expires_at, run.launch_nonce,
    ).run();
  }

  // The nonce is the run's, not the ticket's, so a duplicate launch resumes the
  // same run on the satellite instead of starting a second one.
  const ticket = await ticketFor(program, run.id, run.launch_nonce, secret);
  return applyRateLimitHeaders(authJson({
    ok: true,
    run: {
      id: run.id,
      program: program.id,
      issuer: program.issuer,
      faucet: faucet.slug,
      status: run.status,
      createdAt: run.created_at,
      expiresAt: run.expires_at,
    },
    launchUrl: launchUrlFor(program, ticket),
    expiresAt: run.expires_at,
  }), limit);
}

export const onRequestPost: PagesFunction<FaucetClaimEnv> = async ({ request, env }) => {
  try {
    return await handleRewardRunPost(request, env);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'reward-run-unavailable',
      error: error instanceof Error ? error.message : String(error),
    }));
    return authJson({ ok: false, reason: 'reward-run-unavailable' }, { status: 503 });
  }
};

/** GET never creates anything. The start page is at /rewards/start. */
export const onRequestGet: PagesFunction<FaucetClaimEnv> = async () => (
  authJson({ ok: false, reason: 'post-only', start: '/rewards/start' }, { status: 405 })
);
