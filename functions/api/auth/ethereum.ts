/**
 * /api/auth/ethereum
 *
 * Verifies an Ethereum personal_sign signature against PointCast's custom
 * login-message format (mirror of /api/auth/tezos):
 *
 *   PointCast Ethereum Login
 *   Address: 0x...
 *   Origin: https://pointcast.xyz
 *   Issued At: 2026-05-07T...
 *   Nonce: <client-uuid>
 *   Chain ID: 0x2105     (optional)
 *
 * On success: upserts a PointCast user keyed to the recovered (lowercased)
 * address and issues a session cookie. Provider is recorded as 'metamask'
 * for backward compat with the existing AuthProvider enum, but this
 * endpoint accepts any EVM signer — MetaMask, Coinbase Smart Wallet,
 * future WalletConnect, Safe, etc. `personal_sign` proves address control
 * regardless of which wallet signed; ERC-1271 (smart-contract wallets)
 * are also handled by viem.verifyMessage when a `client` arg is supplied.
 *
 * Replay window: 5 min via `Issued At` + age check. Same as /api/auth/tezos.
 * Future hardening: replace with EIP-4361 (SIWE) + server-issued nonce KV.
 *
 * Required Cloudflare Pages env: USERS (KV namespace).
 *
 * Security notes:
 * - viem.verifyMessage tries EIP-191 personal_sign EOA recovery first
 *   (no network call). If that fails AND the address is a deployed
 *   contract, it falls back to ERC-1271's `isValidSignature` via the
 *   provided `client`. We pass getBaseClient() because Coinbase Smart
 *   Wallet (and most ERC-4337 wallets PointCast cares about) live on
 *   Base. A user signing in from a Safe on L1 won't verify here — that's
 *   acceptable for v0; users with multi-chain smart wallets can fall back
 *   to a Tezos / EOA login.
 * - Address comparison is case-insensitive: EVM addresses use mixed-case
 *   EIP-55 checksums but the underlying 20-byte address is canonical.
 * - Signature shape is hex-only with even length and >= 130 chars (the
 *   standard 65-byte ECDSA signature). Smart-contract-wallet signatures
 *   can be much longer (e.g. multi-sig aggregations) so the upper bound
 *   is generous (8KB).
 */

import { verifyMessage } from 'viem';

import type { AuthIdentity } from '../../../src/lib/auth/types';
import { getBaseClient } from '../../../src/lib/eth/clients';
import {
  IdentityConflictError,
  authJson,
  issueSession,
  readSessionFromRequest,
  upsertUserForIdentity,
  withSessionCookie,
  type AuthEnv,
} from './session';

interface EthereumAuthBody {
  provider?: unknown;
  address?: unknown;
  chainId?: unknown;
  message?: unknown;
  signature?: unknown;
}

const LOGIN_PREFIX = 'PointCast Ethereum Login';
const MESSAGE_TTL_MS = 5 * 60 * 1000;

/** Display labels for known chains — informational only, not enforced. */
const KNOWN_CHAINS: Record<string, string> = {
  '0x1':     'Ethereum mainnet',
  '0x2105':  'Base mainnet',
  '0x14a34': 'Base Sepolia',
};

function parseSignedMessage(message: string): Record<string, string> | null {
  const lines = message.split('\n');
  if (lines[0]?.trim() !== LOGIN_PREFIX) return null;

  const fields: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) fields[key] = value;
  }

  return fields;
}

function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function isAddressLike(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

/**
 * Validate signature shape.
 * - EOA personal_sign: exactly 65 bytes (130 hex chars + 0x prefix)
 * - ERC-1271: variable length, but always hex with even length and
 *   minimum 130 chars (anything shorter can't be a valid ECDSA sig)
 * Upper bound 8192 hex chars (= 4kB binary) is a generous DoS guard
 * against pathologically large request bodies.
 */
function isHexSignature(value: string): value is `0x${string}` {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) return false;
  const hexLen = value.length - 2;
  return hexLen % 2 === 0 && hexLen >= 130 && hexLen <= 8192;
}

function lc(addr: string): string {
  return addr.toLowerCase();
}

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }

  let body: EthereumAuthBody;
  try {
    body = (await request.json()) as EthereumAuthBody;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (!address || !signature || !message) {
    return authJson({ ok: false, reason: 'missing-fields' }, { status: 400 });
  }
  if (!isAddressLike(address)) {
    return authJson({ ok: false, reason: 'bad-address' }, { status: 400 });
  }
  if (!isHexSignature(signature)) {
    return authJson({ ok: false, reason: 'bad-signature' }, { status: 400 });
  }

  const parsedMessage = parseSignedMessage(message);
  if (!parsedMessage) {
    return authJson({ ok: false, reason: 'bad-message-format' }, { status: 400 });
  }

  const requestOrigin = new URL(request.url).origin;
  if (
    lc(parsedMessage.Address ?? '') !== lc(address) ||
    parsedMessage.Origin !== requestOrigin
  ) {
    return authJson({ ok: false, reason: 'message-mismatch' }, { status: 400 });
  }

  const issuedAt = Date.parse(parsedMessage['Issued At'] ?? '');
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > MESSAGE_TTL_MS) {
    return authJson({ ok: false, reason: 'stale-message' }, { status: 400 });
  }

  // Cryptographic verification.
  // - EOA path: synchronous ECDSA recovery, no network call.
  // - ERC-1271 path: viem checks if `address` is a deployed contract on the
  //   provided client and, if so, calls `isValidSignature(messageHash, sig)`.
  //   Adds one RPC round-trip on Base (~50-200ms typical) for smart wallets.
  let isValid = false;
  try {
    isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
      client: getBaseClient(),
    });
  } catch {
    return authJson({ ok: false, reason: 'verify-error' }, { status: 401 });
  }
  if (!isValid) {
    return authJson({ ok: false, reason: 'invalid-signature' }, { status: 401 });
  }

  const current = await readSessionFromRequest(request, env);

  // Canonicalize identity ID to lowercase. Different wallets return mixed-case
  // addresses (EIP-55 checksums); lowercase makes lookups stable.
  // All EVM auth — EOA or smart-contract wallet — keys to provider 'metamask'
  // so a user signing in via MetaMask one day and Coinbase Smart Wallet the
  // next (with the same address) is the same PointCast user. The actual
  // signer wallet is recorded client-side in pc:wallet for UI only.
  const identity: AuthIdentity = {
    provider: 'metamask',
    id: lc(address),
    name: shortAddress(address),
    verifiedAt: new Date().toISOString(),
  };

  try {
    const user = await upsertUserForIdentity(env, identity, {
      currentUserId: current?.user.userId ?? null,
    });
    const session = await issueSession(env, user.userId);
    const chainLabel = parsedMessage['Chain ID']
      ? (KNOWN_CHAINS[parsedMessage['Chain ID']] ?? 'unknown')
      : null;

    return withSessionCookie(
      authJson({
        ok: true,
        user,
        session,
        chain: chainLabel,
      }),
      session,
    );
  } catch (error) {
    if (error instanceof IdentityConflictError) {
      return authJson({ ok: false, reason: 'identity-already-linked' }, { status: 409 });
    }
    throw error;
  }
};
