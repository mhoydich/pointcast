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
 * endpoint accepts any EVM signer (MetaMask today, Coinbase Smart Wallet
 * in the next PR, future WalletConnect) — `personal_sign` proves address
 * control regardless of which wallet signed.
 *
 * Replay window: 5 min via `Issued At` + age check. Same as /api/auth/tezos.
 * Future hardening: replace with EIP-4361 (SIWE) + server-issued nonce KV.
 *
 * Required Cloudflare Pages env: USERS (KV namespace).
 *
 * Security notes:
 * - viem.verifyMessage handles EIP-191 personal_sign for EOAs without any
 *   network call. ERC-1271 smart-contract-wallet verification is NOT enabled
 *   in this PR — it requires a `client` argument (RPC) and is added with
 *   Coinbase Smart Wallet support in a follow-up.
 * - Address comparison is case-insensitive: EVM addresses use mixed-case
 *   EIP-55 checksums but the underlying 20-byte address is canonical.
 * - Signature must be exactly 65 bytes (130 hex + '0x') to be a valid
 *   personal_sign output.
 */

import { verifyMessage } from 'viem';

import type { AuthIdentity } from '../../../src/lib/auth/types';
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

function isHexSignature(value: string): value is `0x${string}` {
  // EVM personal_sign signatures are 65 bytes = 130 hex + '0x' = 132 total.
  return /^0x[0-9a-fA-F]{130}$/.test(value);
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

  // Cryptographic verification — no network call for EOA signatures.
  let isValid = false;
  try {
    isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
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
