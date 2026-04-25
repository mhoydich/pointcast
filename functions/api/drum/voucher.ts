/**
 * POST /api/drum/voucher
 *
 * Three-mode endpoint that drives the DRUM claim flow on /drum.
 *
 * Body (JSON):
 *   { address?: string, probe?: boolean }
 *
 * Response shapes:
 *
 *   // mode 'pending' — contract not originated yet
 *   { ok: true, mode: 'pending', reason: 'no-contract' }
 *
 *   // mode 'awaiting-signer' — contract live but server signer key not configured
 *   { ok: true, mode: 'awaiting-signer', contract: 'KT1…', reason: 'no-signer' }
 *
 *   // mode 'live' — full voucher
 *   {
 *     ok: true,
 *     mode: 'live',
 *     claim: {
 *       contract:  'KT1…',
 *       recipient: 'tz…',
 *       amount:    1,            // DRUM (units = 10^decimals later)
 *       nonce:     1234,
 *       expiry:    'ISO timestamp',
 *       signature: 'edsig…',
 *     },
 *   }
 *
 *   // already claimed today (per address)
 *   { ok: false, mode: 'live', error: 'already-claimed-today', claimedAt: 'ISO' }
 *
 * The voucher signs sp.pack(record(amount, expiry, nonce, recipient))
 * — alphabetical record packing per SmartPy v0.24 — using the configured
 * DRUM_SIGNER_SK (Pages secret). The contract verifies via
 * sp.check_signature against the public key set on the contract via
 * set_signer().
 *
 * Daily eligibility is tracked in PC_DRUM_KV under key
 * `drum:claimed:<address>:<YYYY-MM-DD-PT>` with a 48h TTL.
 *
 * Probe mode (`probe: true`) skips eligibility check + signing and just
 * returns the current operational mode for UI state. Used by /drum on
 * page load to populate the claim card without exposing voucher details.
 */

import contracts from '../../../src/data/contracts.json';

interface Env {
  PC_DRUM_KV?: KVNamespace;
  DRUM_SIGNER_SK?: string;
}

interface VoucherBody {
  address?: string;
  probe?: boolean;
}

const DAILY_AMOUNT = 1; // 1 DRUM/day initial; tunable via env later

function ptDayKey(d: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(d);
}

function isValidTzAddress(addr: string): boolean {
  return /^tz[123][1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: VoucherBody = {};
  try {
    body = await ctx.request.json();
  } catch {
    /* empty body is fine for probe */
  }

  const drumKt1 = (contracts as any)?.drum_token?.mainnet ?? '';
  const contractLive = typeof drumKt1 === 'string' && drumKt1.startsWith('KT1');

  // Mode 1: contract not originated yet.
  if (!contractLive) {
    return jsonResponse({
      ok: true,
      mode: 'pending',
      reason: 'no-contract',
      hint: 'Originate contracts/v2/drum_token.py via /admin/deploy/drum_token, then update src/data/contracts.json[drum_token].mainnet.',
    });
  }

  // Mode 2: contract live but signer not configured.
  if (!ctx.env.DRUM_SIGNER_SK) {
    return jsonResponse({
      ok: true,
      mode: 'awaiting-signer',
      contract: drumKt1,
      reason: 'no-signer',
      hint: 'Set DRUM_SIGNER_SK as a Pages secret + call set_signer(public-key) on the contract.',
    });
  }

  // Probe shortcut — don't sign anything, just confirm we're operational.
  if (body.probe === true) {
    return jsonResponse({
      ok: true,
      mode: 'live',
      contract: drumKt1,
      hint: 'live · pass {address} (omit probe) to receive a voucher.',
    });
  }

  // Mode 3: real voucher request.
  const address = (body.address ?? '').toString().trim();
  if (!isValidTzAddress(address)) {
    return jsonResponse({
      ok: false,
      mode: 'live',
      error: 'invalid-address',
      hint: 'pass a valid tz1/tz2/tz3 address',
    }, 400);
  }

  const day = ptDayKey();
  const claimKey = `drum:claimed:${address}:${day}`;

  if (ctx.env.PC_DRUM_KV) {
    const existing = await ctx.env.PC_DRUM_KV.get(claimKey);
    if (existing) {
      return jsonResponse({
        ok: false,
        mode: 'live',
        error: 'already-claimed-today',
        claimedAt: existing,
        hint: 'one DRUM claim per address per PT day · come back tomorrow',
      }, 409);
    }
  }

  // Voucher signing — packs the Michelson record + signs with the
  // configured DRUM_SIGNER_SK. Field order matters: SmartPy sorts record
  // fields alphabetically when packing, so the Michelson schema must be
  // amount → expiry → nonce → recipient. Taquito's packDataBytes does
  // the Michelson encoding; InMemorySigner adds the 0x05 PACK prefix and
  // hashes + signs.
  let signer, packDataBytes;
  try {
    const signerMod = await import('@taquito/signer');
    const codecMod = await import('@taquito/michel-codec');
    signer = new signerMod.InMemorySigner(ctx.env.DRUM_SIGNER_SK);
    packDataBytes = codecMod.packDataBytes;
  } catch (err: any) {
    return jsonResponse({
      ok: false,
      mode: 'awaiting-signer',
      error: 'signer-init-failed',
      detail: err?.message || 'unknown',
    }, 503);
  }

  // Issue voucher: 5-minute expiry, random 12-digit nonce.
  const nonce = Math.floor(Math.random() * 1e12);
  const expirySec = Math.floor((Date.now() + 5 * 60 * 1000) / 1000);

  // Build the Michelson value (alphabetical: amount, expiry, nonce, recipient)
  // as a right-leaning Pair tree, matching how SmartPy emits sp.pack(record).
  const value = {
    prim: 'Pair',
    args: [
      { int: String(DAILY_AMOUNT) },
      {
        prim: 'Pair',
        args: [
          { int: String(expirySec) },
          {
            prim: 'Pair',
            args: [
              { int: String(nonce) },
              { string: address },
            ],
          },
        ],
      },
    ],
  };
  const type = {
    prim: 'pair',
    args: [
      { prim: 'nat',       annots: ['%amount'] },
      { prim: 'pair',
        args: [
          { prim: 'timestamp', annots: ['%expiry'] },
          { prim: 'pair',
            args: [
              { prim: 'nat',     annots: ['%nonce'] },
              { prim: 'address', annots: ['%recipient'] },
            ],
          },
        ],
      },
    ],
  };

  let packedHex: string;
  try {
    const packed = packDataBytes(value as any, type as any);
    packedHex = packed.bytes;
  } catch (err: any) {
    return jsonResponse({
      ok: false, mode: 'awaiting-signer',
      error: 'pack-failed', detail: err?.message || 'unknown',
    }, 500);
  }

  let signature: string;
  try {
    // signer.sign() expects the raw payload as hex; it prepends nothing
    // by default (SmartPy's sp.check_signature works on raw packed bytes).
    const sig = await signer.sign(packedHex);
    signature = sig.prefixSig;
  } catch (err: any) {
    return jsonResponse({
      ok: false, mode: 'awaiting-signer',
      error: 'sign-failed', detail: err?.message || 'unknown',
    }, 500);
  }

  // Persist the dedup record. 48h TTL covers the PT day boundary.
  if (ctx.env.PC_DRUM_KV) {
    try {
      await ctx.env.PC_DRUM_KV.put(claimKey, new Date().toISOString(), {
        expirationTtl: 60 * 60 * 48,
      });
    } catch { /* dedup is best-effort; if KV is down, allow the claim */ }
  }

  const expiryIso = new Date(expirySec * 1000).toISOString();

  return jsonResponse({
    ok: true,
    mode: 'live',
    claim: {
      contract: drumKt1,
      recipient: address,
      amount: DAILY_AMOUNT,
      nonce,
      expiry: expiryIso,
      signature,
    },
    hint: 'voucher valid 5 minutes · sign claim() in Kukai before expiry',
  });
};
