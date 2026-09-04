import type { PointCastUser } from '../../../src/lib/auth/types.ts';
import { losAngelesDate, sittingOfTheDay } from '../../../src/lib/kennel-club.ts';
import {
  claimConfigured,
  claimDailyCap,
  claimKennelClubDog,
  releaseKennelClubClaimCapacity,
  reserveKennelClubClaimCapacity,
  type ClaimChainFactory,
  type KennelClaimEnv,
} from '../kennel-club/_claims.ts';
import {
  attachPaidIntent,
  acquirePaidSettlement,
  beginPaidIntent,
  clearPaidIntentCapacity,
  PAID_ACTION_HEADERS,
  PAID_TOWN_PRICE_UNITS,
  paidJson,
  paidIntentJson,
  readBoundedJson,
  settlementWasAmbiguous,
  updatePaidIntent,
} from '../../_lib/paid-town-actions.ts';
import {
  finalizeX402Receipt,
  shortEvmAddress,
  withX402,
  x402TransactionHash,
  X402PreSettlementError,
} from '../../_lib/x402-gate.ts';

const CLAIM_ADDRESS = /^tz[12][1-9A-HJ-NP-Za-km-z]{33}$/;
const FAILED_RETRY_DELAY_MS = 60_000;

type AgentClaimEnv = Cloudflare.Env & KennelClaimEnv;

interface ExistingClaimRow {
  status: 'held' | 'delivered' | 'failed';
  created_at: string;
}

interface ClaimCountRow {
  count: number | string;
}

async function actorIdForAddress(address: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `pcu_x402_${hex.slice(0, 32)}`;
}

export async function handleAgentClaim(
  request: Request,
  env: AgentClaimEnv,
  options: { expectedPublicKey?: string; chainFactory?: ClaimChainFactory; now?: Date } = {},
): Promise<Response> {
  let input: unknown;
  try {
    input = await readBoundedJson(request.clone());
  } catch (error) {
    return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  if (!CLAIM_ADDRESS.test(to)) return paidJson({ ok: false, error: 'to must be a valid tz1 or tz2 address' }, 400);
  if (!env.AUTH_DB) {
    return paidJson({ ok: false, error: 'The claim and split ledgers are unavailable; no payment was submitted.' }, 503);
  }
  if (!claimConfigured(env)) {
    return paidJson({ ok: false, error: 'The sponsored claim wallet is unavailable; no payment was submitted.' }, 503);
  }

  const now = options.now ?? new Date();
  const date = losAngelesDate(now);
  const today = sittingOfTheDay(date);
  if (today.mintDate !== date) {
    return paidJson({ ok: false, error: 'claim-window-closed', date }, 409);
  }

  const userId = await actorIdForAddress(to);
  const begun = await beginPaidIntent(request, env.AUTH_DB, 'claim', { to, tokenId: today.tokenId });
  if (begun.kind === 'response') return begun.response;
  if (begun.kind === 'quote') {
    const [existing, count] = await Promise.all([
      env.AUTH_DB.prepare(`
        SELECT status, created_at FROM claims WHERE user_id = ? AND token_id = ? LIMIT 1
      `).bind(userId, today.tokenId).first<ExistingClaimRow>(),
      env.AUTH_DB.prepare(`
        SELECT COUNT(*) AS count FROM claims WHERE token_id = ?
      `).bind(today.tokenId).first<ClaimCountRow>(),
    ]);
    if (existing && (existing.status !== 'failed'
      || now.getTime() - Date.parse(existing.created_at) < FAILED_RETRY_DELAY_MS)) {
      return paidJson({ ok: false, error: existing.status === 'failed' ? 'claim-in-progress' : 'already-claimed' }, 409);
    }
    if (Number(count?.count ?? 0) >= claimDailyCap(env.KENNEL_CLUB_CLAIM_DAILY_CAP)) {
      return paidJson({ ok: false, error: 'daily-cap-reached' }, 409);
    }
  }

  const intentId = begun.kind === 'quote' ? null : begun.intent.id;
  let capacityKey = begun.kind === 'quote' ? null : begun.intent.capacity_key;
  let gate;
  if (begun.kind === 'resume') {
    gate = {
      settled: true as const,
      response: new Response(null, { headers: PAID_ACTION_HEADERS }),
      ...begun.settlement,
    };
  } else {
    gate = await withX402(request, env, {
      action: 'claim',
      priceUnits: PAID_TOWN_PRICE_UNITS,
      maker: 'town',
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: `Sponsor today's Kennel Club claim to ${to}. One per address per sitting.`,
      merchantUrl: 'https://pointcast.xyz/kennel-club',
      context: `Paid town action: an agent sponsors today's Kennel Club dog for ${to}.`,
      requestHash: begun.kind === 'quote' ? null : begun.intent.request_hash,
      resourceId: intentId,
      agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
      ...(intentId ? {
        beforeSettlement: async () => {
          if (!await acquirePaidSettlement(env.AUTH_DB!, intentId)) {
            throw new X402PreSettlementError(202, { ok: false, error: 'action-already-in-progress' });
          }
          if (!capacityKey) {
            const reservation = await reserveKennelClubClaimCapacity({
              db: env.AUTH_DB!,
              userId,
              tokenId: today.tokenId,
              cap: claimDailyCap(env.KENNEL_CLUB_CLAIM_DAILY_CAP),
            });
            if (!reservation.ok) {
              await updatePaidIntent(env.AUTH_DB!, intentId, 'settlement_failed', { error: reservation.reason });
              throw new X402PreSettlementError(409, { ok: false, error: reservation.reason });
            }
            capacityKey = reservation.claimId;
          }
          await updatePaidIntent(env.AUTH_DB!, intentId, 'settling', { capacityKey });
        },
      } : {}),
    });
    if (!gate.settled) {
      if (!intentId) return gate.response;
      if (gate.response.status === 202) return attachPaidIntent(gate.response, intentId);
      const ambiguous = settlementWasAmbiguous(gate.response);
      if (!ambiguous && capacityKey
        && await releaseKennelClubClaimCapacity(env.AUTH_DB, capacityKey)) {
        await clearPaidIntentCapacity(env.AUTH_DB, intentId);
        capacityKey = null;
      }
      await updatePaidIntent(
        env.AUTH_DB,
        intentId,
        ambiguous ? 'settlement_ambiguous' : 'settlement_failed',
        { capacityKey, error: `settlement-response-${gate.response.status}` },
      );
      return attachPaidIntent(gate.response, intentId);
    }
    if (intentId) {
      await updatePaidIntent(env.AUTH_DB, intentId, 'settled', {
        capacityKey,
        txHash: x402TransactionHash(gate.receipt),
        agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
        settlement: {
          receipt: gate.receipt,
          receiptHash: gate.receiptHash,
          payer: gate.payer,
          split: gate.split,
        },
      });
    }
  }

  if (!intentId || !capacityKey) return gate.response;
  await updatePaidIntent(env.AUTH_DB, intentId, 'acting');

  const actorTimestamp = typeof gate.receipt.timestamp === 'string'
    ? gate.receipt.timestamp
    : now.toISOString();
  const actor: PointCastUser = {
    userId,
    createdAt: actorTimestamp,
    identities: [{ provider: 'kukai', id: to, name: to, verifiedAt: actorTimestamp }],
    preferredName: 'Agent guest',
    roles: [],
  };
  const storedActor = {
    ...actor,
    paidActor: {
      rail: 'x402',
      payer: shortEvmAddress(gate.payer),
      receiptHash: gate.receiptHash,
      agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
    },
  };
  try {
    await env.AUTH_DB.prepare(`
      INSERT INTO users (id, payload, created_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
    `).bind(userId, JSON.stringify(storedActor), actor.createdAt).run();
  } catch (error) {
    console.error('[api/agent/claim] actor write failed after settlement', error);
    const actionResult = {
      ok: false,
      actionCompleted: false,
      actionId: intentId,
      error: 'Payment settled but the claim actor could not be recorded.',
    };
    gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
    const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', {
      settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
      result,
      error: result.error,
    });
    return paidIntentJson(intentId, result, 502, gate.response.headers);
  }

  const result = await claimKennelClubDog({
    env,
    user: actor,
    tokenId: today.tokenId,
    chainFactory: options.chainFactory,
    reservedClaimId: capacityKey,
  });
  if (!result.ok) {
    const status = result.reason === 'already-claimed'
      || result.reason === 'claim-in-progress'
      || result.reason === 'daily-cap-reached'
      ? 409
      : 503;
    const actionResult = {
      ok: false,
      actionCompleted: false,
      actionId: intentId,
      to,
      claim: result,
    };
    gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
    const responseBody = { ...actionResult, receipt: gate.receipt, split: gate.split };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', {
      settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
      result: responseBody,
      error: result.reason ?? 'claim-action-failed',
    });
    return paidIntentJson(intentId, responseBody, status, gate.response.headers);
  }

  const actionResult = {
    ok: true,
    action: 'claim',
    actionId: intentId,
    to,
    actor: { payer: shortEvmAddress(gate.payer), receiptHash: gate.receiptHash },
    claim: result.claim,
  };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
  const responseBody = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result: responseBody,
  });
  return paidIntentJson(intentId, responseBody, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentClaimEnv> = async ({ request, env }) =>
  handleAgentClaim(request, env);
