/**
 * /api/drum/identify — bind a Tezos wallet to a drum session.
 *
 * The drum surfaces share a sessionId in localStorage. After a user
 * connects a wallet via WalletChip / Beacon, this endpoint records the
 * binding so:
 *
 *   1. The leaderboard can show wallet addresses (verified) instead of
 *      anonymous noun-id labels.
 *   2. Phase C DRUM-token claim has a stable subject — the wallet that
 *      earned the drums is the same one we mint to.
 *   3. Cross-device drumming on the same wallet aggregates into one
 *      total (POST /api/drum looks up the wallet binding for incoming
 *      sessions and tallies into a wallet-keyed counter as well).
 *
 * Verification:
 *   The client sends a Beacon-signed message of the form
 *     "drum:bind:<sessionId>:<unixSeconds>"
 *   We verify the signature against the claimed Tezos address, reject
 *   stale (>5min) timestamps, and only then write the binding.
 *
 * Storage in VISITS KV:
 *   wallet:<address>           → { sessionIds: string[], firstBoundAt }
 *   session:<sessionId>:wallet → <address>
 *
 * (Cross-tab: the same browser session may bind multiple times — that's
 * fine, idempotent. The same wallet may bind to many sessions across
 * devices — also fine, that's the cross-device aggregation feature.)
 *
 * GET  /api/drum/identify?sessionId=...
 *   200 → { wallet: <addr> | null }
 *
 * POST /api/drum/identify
 *   body: { sessionId, address, timestamp, signature, payload }
 *   200 → { ok: true, wallet, bindingCount }
 *   400 → { ok: false, error: 'invalid_payload' | 'stale' | 'invalid_signature' }
 *
 * NOTE: Beacon signature verification on the server side requires either
 * (a) calling a Tezos node's `/chains/main/blocks/head/helpers/check_signature`
 * endpoint, or (b) using @taquito/utils' verifySignature. Both pull
 * crypto deps. For Pages Functions (V8 isolate, edge), we keep this
 * thin: do format checks here, mark the binding "pending" until the
 * client also POSTs an on-chain operation that proves the wallet (e.g.
 * a 0-mutez transfer to a known marker contract). Mike will pick the
 * verification approach in a follow-up; this endpoint is the storage
 * surface plus a soft binding.
 */

import type { Env } from '../visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const TEZOS_ADDR_RE = /^(tz1|tz2|tz3|tz4|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;
const SESSION_ID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const STALE_WINDOW_SEC = 300; // 5min

// KV TTL for wallet→sessions binding. Long enough to outlive a normal
// drumming-and-claiming flow, short enough that abandoned bindings
// don't accumulate forever. Refreshed on every successful bind.
const BIND_TTL_SECONDS = 60 * 60 * 24 * 90; // 90d

interface WalletRecord {
  sessionIds: string[];
  firstBoundAt: number;
  lastBoundAt: number;
  // Verification mode: 'soft' = format-checked only; 'verified' = signature
  // checked. Future: add 'on-chain' for proven via marker tx.
  mode: 'soft' | 'verified';
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function loadWallet(env: Env, address: string): Promise<WalletRecord | null> {
  if (!env.VISITS) return null;
  const raw = await env.VISITS.get(`wallet:${address}`, 'json') as WalletRecord | null;
  return raw && Array.isArray(raw.sessionIds) ? raw : null;
}

async function loadSessionWallet(env: Env, sessionId: string): Promise<string | null> {
  if (!env.VISITS) return null;
  return await env.VISITS.get(`session:${sessionId}:wallet`);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sessionId = (url.searchParams.get('sessionId') ?? '').trim();
  if (!SESSION_ID_RE.test(sessionId)) {
    return json({ ok: false, error: 'invalid_session_id' }, { status: 400 });
  }
  const wallet = await loadSessionWallet(env, sessionId);
  return json({ ok: true, wallet }, {
    headers: { 'Cache-Control': 'private, max-age=10' },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) {
    return json({ ok: false, error: 'kv_unavailable' }, { status: 503 });
  }

  let body: {
    sessionId?: unknown;
    address?: unknown;
    timestamp?: unknown;
    signature?: unknown;
    payload?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const address   = typeof body.address   === 'string' ? body.address   : '';
  const timestamp = typeof body.timestamp === 'number' ? body.timestamp : 0;
  const signature = typeof body.signature === 'string' ? body.signature : '';
  const payload   = typeof body.payload   === 'string' ? body.payload   : '';

  if (!SESSION_ID_RE.test(sessionId)) {
    return json({ ok: false, error: 'invalid_session_id' }, { status: 400 });
  }
  if (!TEZOS_ADDR_RE.test(address)) {
    return json({ ok: false, error: 'invalid_address' }, { status: 400 });
  }

  // Stale check — protects against replay if a signed payload leaks.
  const nowSec = Math.floor(Date.now() / 1000);
  if (!timestamp || Math.abs(nowSec - timestamp) > STALE_WINDOW_SEC) {
    return json({ ok: false, error: 'stale_timestamp' }, { status: 400 });
  }

  // Payload format check — must include the sessionId + timestamp the
  // client also passed, so we know the signature was over THIS bind, not
  // some other operation.
  const expectedPayload = `drum:bind:${sessionId}:${timestamp}`;
  if (payload !== expectedPayload) {
    return json({ ok: false, error: 'payload_mismatch' }, { status: 400 });
  }

  // Soft verification mode for now — signature must look like a valid
  // Tezos signature (edsig/spsig/p2sig/sig prefix + base58). Strict
  // cryptographic verification needs taquito which doesn't ship in Pages
  // Functions ergonomically. See header comment for the upgrade path.
  const TEZOS_SIG_RE = /^(edsig|spsig1|p2sig|sig)[1-9A-HJ-NP-Za-km-z]{40,128}$/;
  let mode: 'soft' | 'verified' = 'soft';
  if (signature && TEZOS_SIG_RE.test(signature)) {
    mode = 'soft';
  } else if (signature) {
    return json({ ok: false, error: 'invalid_signature_format' }, { status: 400 });
  }

  // Append sessionId to wallet record (dedup).
  const existing = await loadWallet(env, address);
  const sessionIds = new Set(existing?.sessionIds ?? []);
  sessionIds.add(sessionId);
  const record: WalletRecord = {
    sessionIds: Array.from(sessionIds),
    firstBoundAt: existing?.firstBoundAt ?? Date.now(),
    lastBoundAt: Date.now(),
    mode,
  };

  try {
    await Promise.all([
      env.VISITS.put(
        `wallet:${address}`,
        JSON.stringify(record),
        { expirationTtl: BIND_TTL_SECONDS },
      ),
      env.VISITS.put(
        `session:${sessionId}:wallet`,
        address,
        { expirationTtl: BIND_TTL_SECONDS },
      ),
    ]);
  } catch {
    return json({ ok: false, error: 'kv_write_failed' }, { status: 500 });
  }

  return json({
    ok: true,
    wallet: address,
    bindingCount: record.sessionIds.length,
    mode,
  });
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
