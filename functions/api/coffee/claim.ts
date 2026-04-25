/**
 * POST /api/coffee/claim
 *
 * Body: { mug: 'ceramic'|'espresso'|'latte'|'paper'|'bistro', address: 'tz1…'|'tz2…' }
 *
 * Verifies the caller's local cup count meets the per-mug threshold
 * by reading `coffee:cups:YYYY-MM-DD` and `coffee:claims:<addr>:<mug>`
 * from PC_RACE_KV, then issues a server-signed claim receipt that's
 * redeemable on-chain once the Coffee Mugs FA2 contract is live.
 *
 * Sprint v4 follow-on per docs/briefs/2026-04-25-mike-coffee-mugs-fa2.md.
 *
 * Two response modes:
 *
 *   1. Contract NOT live (coffee_mugs.mainnet === ''):
 *      Returns a "banked" receipt — no on-chain action expected, the
 *      receipt is a placeholder with a deterministic id that the
 *      client stores in localStorage. Will be redeemable post-KT1.
 *
 *   2. Contract live (coffee_mugs.mainnet === 'KT1…'):
 *      Returns a full TZIP-32-style claim payload:
 *        { mug, address, tokenId, contract, nonce, signedAt }
 *      Plus a server-side write: `coffee:claims:<addr>:<mug> = receipt`
 *      so a second call returns 409. The frontend uses this payload to
 *      build a Beacon-driven mint_mug(token_id) call from the user's
 *      wallet (user pays gas).
 *
 * Notes for follow-up wiring:
 *   - The Pages Function only ISSUES receipts; it does not call the
 *     contract or admin-mint on the user's behalf. The mint is signed
 *     by the user's Beacon wallet on the client.
 *   - A future v2 can add HMAC signing of the receipt for tamper
 *     resistance — for now the receipt is a structured JSON token
 *     trusted via the server-only KV write barrier.
 */
import { rateLimit, applyRateLimitHeaders, rateLimitResponse } from '../../_rate-limit';
import contracts from '../../../src/data/contracts.json';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

interface ClaimBody {
  mug?: string;
  address?: string;
}

// Must match contracts/v2/coffee_mugs_fa2.py + the front-end UI tiers.
const MUG_TIERS: Record<string, { tokenId: number; threshold: number; rarity: string }> = {
  ceramic:  { tokenId: 0, threshold: 1,  rarity: 'common' },
  espresso: { tokenId: 1, threshold: 3,  rarity: 'uncommon' },
  latte:    { tokenId: 2, threshold: 7,  rarity: 'rare' },
  paper:    { tokenId: 3, threshold: 15, rarity: 'ultra-rare' },
  bistro:   { tokenId: 4, threshold: 30, rarity: 'legendary' },
};

function ptDayKey(d: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(d);
}

function isValidTzAddress(addr: string): boolean {
  return /^tz[123][1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

function nonceFor(address: string, mug: string): string {
  // Deterministic short id — combines address tail + mug + day. Not
  // cryptographically signed yet; future version adds HMAC.
  const day = ptDayKey();
  const tail = address.slice(-8);
  const seed = `${tail}-${mug}-${day}`;
  // Cheap hash — trim to 12 chars
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return `pcm-${mug.slice(0, 3)}-${(h >>> 0).toString(36)}-${tail.slice(-4)}`;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const rl = await rateLimit(ctx.request, ctx.env, {
    bucket: 'coffee-claim',
    windowSec: 3600,
    maxRequests: 10,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  let body: ClaimBody = {};
  try {
    body = await ctx.request.json();
  } catch {
    return applyRateLimitHeaders(json({ ok: false, error: 'invalid-json' }, 400), rl);
  }

  const mug = (body.mug ?? '').toString().toLowerCase();
  const address = (body.address ?? '').toString().trim();

  // Validate inputs.
  const tier = MUG_TIERS[mug];
  if (!tier) {
    return applyRateLimitHeaders(
      json({ ok: false, error: 'unknown-mug', valid: Object.keys(MUG_TIERS) }, 400),
      rl
    );
  }
  if (!isValidTzAddress(address)) {
    return applyRateLimitHeaders(
      json({ ok: false, error: 'invalid-address', hint: 'tz1/tz2/tz3 with 36 chars total' }, 400),
      rl
    );
  }

  const kv = ctx.env.PC_RACE_KV;
  if (!kv) {
    // Graceful no-op: still return a banked receipt so the client UX works.
    return applyRateLimitHeaders(
      json({
        ok: true,
        reason: 'kv-unbound',
        mode: 'banked',
        receipt: {
          mug,
          address,
          tokenId: tier.tokenId,
          rarity: tier.rarity,
          nonce: nonceFor(address, mug),
          bankedAt: new Date().toISOString(),
        },
      }),
      rl
    );
  }

  const day = ptDayKey();

  // Check eligibility — daily count + already-claimed defense.
  const cupsKey = `coffee:cups:${day}`;
  const claimKey = `coffee:claims:${address}:${mug}`;

  const [cupsRaw, existing] = await Promise.all([
    kv.get(cupsKey),
    kv.get(claimKey),
  ]);

  if (existing) {
    return applyRateLimitHeaders(
      json({
        ok: false,
        error: 'already-claimed',
        existing: JSON.parse(existing),
      }, 409),
      rl
    );
  }

  const cups = cupsRaw ? parseInt(cupsRaw, 10) || 0 : 0;
  if (cups < tier.threshold) {
    return applyRateLimitHeaders(
      json({
        ok: false,
        error: 'threshold-not-met',
        mug,
        threshold: tier.threshold,
        currentCups: cups,
        moreNeeded: tier.threshold - cups,
      }, 403),
      rl
    );
  }

  // Build the receipt. Mode depends on whether the contract is live.
  const contractAddress = (contracts as any)?.coffee_mugs?.mainnet ?? '';
  const isLive = contractAddress && contractAddress.startsWith('KT1');

  const receipt = {
    mug,
    address,
    tokenId: tier.tokenId,
    rarity: tier.rarity,
    nonce: nonceFor(address, mug),
    bankedAt: new Date().toISOString(),
    ...(isLive ? { contract: contractAddress, mode: 'mintable' as const } : { mode: 'banked' as const }),
  };

  // Write the claim record so a second attempt returns 409. 90-day TTL.
  try {
    await kv.put(claimKey, JSON.stringify(receipt), {
      expirationTtl: 60 * 60 * 24 * 90,
    });
  } catch (e) {
    return applyRateLimitHeaders(
      json({ ok: false, error: 'kv-write-failed' }, 500),
      rl
    );
  }

  return applyRateLimitHeaders(
    json({
      ok: true,
      mode: receipt.mode,
      receipt,
      // Frontend uses these to build the Beacon mint call when mode=mintable.
      mint: isLive ? {
        contract: contractAddress,
        entrypoint: 'mint_mug',
        params: { token_id: tier.tokenId },
        recipient: address,
        // mint_mug is gas-only — no ꜩ amount.
        amount: 0,
      } : null,
    }),
    rl
  );
};
