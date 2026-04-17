/**
 * Web3 Wallet Authentication Handler
 * @file functions/api/auth/web3.ts
 *
 * Handles all Web3 wallet authentication via a challenge-response pattern:
 *
 *   POST /api/auth/web3/nonce  — Issue a challenge nonce for a given provider
 *   POST /api/auth/web3/verify — Verify a signed challenge and establish session
 *
 * Supported providers:
 *   - kukai, temple, umami  (Tezos / Beacon SDK — Micheline payload signing)
 *   - metamask              (Ethereum / SIWE — EIP-4361)
 *   - phantom               (Solana / SIWS — Ed25519 signing)
 *
 * Required Cloudflare Pages env vars:
 *   AUTH_KV — KV namespace binding
 */

import type { EventContext } from '@cloudflare/workers-types';
import type { Web3VerifyRequest, AuthProvider } from '../../../src/lib/auth/types';
import {
  findOrCreateUser,
  createSession,
  buildSessionCookie,
} from '../../../src/lib/auth/session';

export interface Env {
  AUTH_KV: KVNamespace;
}

const TEZOS_PROVIDERS: AuthProvider[] = ['kukai', 'temple', 'umami'];
const NONCE_TTL = 300; // 5 minutes

export const onRequestPost = async (context: EventContext<Env, any, any>) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // -------------------------------------------------------------------------
  // Route: POST /api/auth/web3/nonce
  // Issues a one-time challenge nonce for the given provider.
  // -------------------------------------------------------------------------
  if (url.pathname.endsWith('/nonce')) {
    let provider: AuthProvider;
    try {
      const body = await request.json<{ provider: AuthProvider }>();
      provider = body.provider;
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (!provider) return jsonError('Missing provider', 400);

    const nonce = crypto.randomUUID();
    const issuedAt = Math.floor(Date.now() / 1000);

    await env.AUTH_KV.put(
      `nonce:${nonce}`,
      JSON.stringify({ provider, issuedAt }),
      { expirationTtl: NONCE_TTL }
    );

    return jsonOk({ nonce });
  }

  // -------------------------------------------------------------------------
  // Route: POST /api/auth/web3/verify
  // Verifies the signed challenge and creates a session.
  // -------------------------------------------------------------------------
  if (url.pathname.endsWith('/verify')) {
    let payload: Web3VerifyRequest;
    try {
      payload = await request.json<Web3VerifyRequest>();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    const { provider, signature, message, nonce, publicKey, preferences } = payload;

    if (!provider || !signature || !message || !nonce) {
      return jsonError('Missing required fields: provider, signature, message, nonce', 400);
    }

    // Verify nonce exists and matches provider
    const nonceDataStr = await env.AUTH_KV.get(`nonce:${nonce}`);
    if (!nonceDataStr) {
      return jsonError('Invalid or expired nonce', 401);
    }
    const nonceData = JSON.parse(nonceDataStr);
    if (nonceData.provider !== provider) {
      return jsonError('Nonce provider mismatch', 401);
    }
    await env.AUTH_KV.delete(`nonce:${nonce}`); // Single-use

    let providerId = '';

    try {
      if (provider === 'metamask') {
        // -----------------------------------------------------------------
        // Ethereum SIWE Verification
        // -----------------------------------------------------------------
        // TODO: Install and use `viem` or `ethers` in your Pages Functions.
        //
        // The SIWE message format (EIP-4361) must include the nonce.
        // Verify the message contains the nonce to prevent replay attacks.
        //
        // Example with viem:
        //   import { verifyMessage } from 'viem';
        //   const isValid = await verifyMessage({ address, message, signature });
        //   if (!isValid) throw new Error('Invalid signature');
        //   providerId = address; // checksummed Ethereum address
        //
        // IMPORTANT: Parse the SIWE message to extract the address and nonce
        // before calling verifyMessage. Validate:
        //   - message.nonce === nonce
        //   - message.domain === your domain
        //   - message.expirationTime is not in the past
        throw new Error('TODO: Implement MetaMask SIWE verification with viem');

      } else if (provider === 'phantom') {
        // -----------------------------------------------------------------
        // Solana SIWS Verification (Ed25519)
        // -----------------------------------------------------------------
        // TODO: Install `@solana/web3.js` and `tweetnacl`.
        //
        // Example:
        //   import nacl from 'tweetnacl';
        //   import { PublicKey } from '@solana/web3.js';
        //   const pubKey = new PublicKey(publicKey!);
        //   const msgBytes = new TextEncoder().encode(message);
        //   const sigBytes = Buffer.from(signature, 'hex');
        //   const isValid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKey.toBytes());
        //   if (!isValid) throw new Error('Invalid signature');
        //   providerId = pubKey.toBase58();
        throw new Error('TODO: Implement Phantom SIWS verification with tweetnacl');

      } else if (TEZOS_PROVIDERS.includes(provider)) {
        // -----------------------------------------------------------------
        // Tezos Beacon SDK Verification
        // -----------------------------------------------------------------
        // TODO: Install `@taquito/utils`.
        //
        // The Beacon SDK signs a Micheline-encoded payload. The payload format is:
        //   "Tezos Signed Message: {domain} {timestamp} {nonce}"
        // or a custom payload you define.
        //
        // Example:
        //   import { verifySignature } from '@taquito/utils';
        //   const isValid = verifySignature(message, publicKey!, signature);
        //   if (!isValid) throw new Error('Invalid Tezos signature');
        //   // Derive address from public key
        //   import { getPkhfromPk } from '@taquito/utils';
        //   providerId = getPkhfromPk(publicKey!);
        throw new Error('TODO: Implement Tezos Beacon verification with @taquito/utils');

      } else {
        return jsonError('Unsupported provider', 400);
      }
    } catch (err: any) {
      console.error(`[web3/verify] ${provider} verification failed:`, err.message);
      return jsonError('Signature verification failed', 401);
    }

    if (!providerId) {
      return jsonError('Could not recover identity from signature', 401);
    }

    // Find or create user
    const { user, isNew } = await findOrCreateUser(
      env.AUTH_KV,
      provider,
      providerId,
      preferences
    );

    // Create session
    const sessionId = await createSession(env.AUTH_KV, user.id, provider);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': buildSessionCookie(sessionId),
    });

    return new Response(
      JSON.stringify({
        success: true,
        isNew,
        user: { id: user.id, preferences: user.preferences },
      }),
      { status: 200, headers }
    );
  }

  return new Response('Not found', { status: 404 });
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jsonOk(body: object): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
