/**
 * Sign in with Apple Handler
 * @file functions/api/auth/apple.ts
 *
 * Handles two routes:
 *   GET  /api/auth/apple/login    — Initiates the Apple OIDC flow
 *   POST /api/auth/apple/callback — Handles the Apple form_post callback
 *
 * Required Cloudflare Pages env vars:
 *   APPLE_CLIENT_ID    — Your Apple Services ID (e.g., com.yourapp.web)
 *   APPLE_TEAM_ID      — Your Apple Developer Team ID (10-char string)
 *   APPLE_KEY_ID       — The Key ID of your Sign in with Apple private key
 *   APPLE_PRIVATE_KEY  — The PEM-encoded private key (p8 file contents, newlines as \n)
 *   APPLE_REDIRECT_URI — Must be HTTPS: https://your-domain.com/api/auth/apple/callback
 *   AUTH_KV            — KV namespace binding
 *
 * NOTE: Apple requires the redirect URI to be registered in the Apple Developer Console
 * under your Services ID configuration.
 */

import type { EventContext } from '@cloudflare/workers-types';
import type { OAuthState } from '../../../src/lib/auth/types';
import {
  findOrCreateUser,
  createSession,
  buildSessionCookie,
} from '../../../src/lib/auth/session';

export interface Env {
  AUTH_KV: KVNamespace;
  APPLE_CLIENT_ID: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
  APPLE_PRIVATE_KEY: string;
  APPLE_REDIRECT_URI: string;
}

const APPLE_AUTH_ENDPOINT = 'https://appleid.apple.com/auth/authorize';
const APPLE_TOKEN_ENDPOINT = 'https://appleid.apple.com/auth/token';
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

// ---------------------------------------------------------------------------
// Client Secret Generation
// Apple requires a JWT signed with your private key as the client_secret.
// This JWT must be generated fresh for each token exchange (max 6 months TTL).
// ---------------------------------------------------------------------------
async function generateAppleClientSecret(env: Env): Promise<string> {
  // TODO: Implement using jose or SubtleCrypto.
  // The JWT header must be: { "alg": "ES256", "kid": env.APPLE_KEY_ID }
  // The JWT payload must be:
  //   {
  //     "iss": env.APPLE_TEAM_ID,
  //     "iat": Math.floor(Date.now() / 1000),
  //     "exp": Math.floor(Date.now() / 1000) + 86400, // 1 day
  //     "aud": "https://appleid.apple.com",
  //     "sub": env.APPLE_CLIENT_ID
  //   }
  // Sign with ES256 using env.APPLE_PRIVATE_KEY (P-256 ECDSA key).
  //
  // Example with jose:
  //   import { SignJWT, importPKCS8 } from 'jose';
  //   const privateKey = await importPKCS8(env.APPLE_PRIVATE_KEY, 'ES256');
  //   return new SignJWT({ ... })
  //     .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_KEY_ID })
  //     .sign(privateKey);
  throw new Error('TODO: Implement generateAppleClientSecret using jose');
}

// ---------------------------------------------------------------------------
// GET /api/auth/apple/login
// ---------------------------------------------------------------------------
export const onRequestGet = async (context: EventContext<Env, any, any>) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!url.pathname.endsWith('/login')) {
    return new Response('Not found', { status: 404 });
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const drumName = url.searchParams.get('drumName') ?? undefined;
  const noun = url.searchParams.get('noun') ?? undefined;

  const stateData: OAuthState = {
    nonce,
    preferences: drumName || noun ? { drumName, noun } : undefined,
  };

  await env.AUTH_KV.put(
    `oauth_state:${state}`,
    JSON.stringify(stateData),
    { expirationTtl: 300 }
  );

  const authUrl = new URL(APPLE_AUTH_ENDPOINT);
  authUrl.searchParams.set('client_id', env.APPLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', env.APPLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code id_token');
  authUrl.searchParams.set('response_mode', 'form_post'); // Required for id_token
  authUrl.searchParams.set('scope', '');                   // Privacy-maximizing: no name/email
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  return Response.redirect(authUrl.toString(), 302);
};

// ---------------------------------------------------------------------------
// POST /api/auth/apple/callback
// Apple sends the callback as a form POST, not a GET redirect.
// ---------------------------------------------------------------------------
export const onRequestPost = async (context: EventContext<Env, any, any>) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!url.pathname.endsWith('/callback')) {
    return new Response('Not found', { status: 404 });
  }

  let code: string, state: string, idToken: string;
  try {
    const formData = await request.formData();
    code = formData.get('code') as string;
    state = formData.get('state') as string;
    idToken = formData.get('id_token') as string;
    const error = formData.get('error') as string;

    if (error) {
      console.error('Apple auth error:', error);
      return Response.redirect('/?auth_error=apple_denied', 302);
    }

    if (!code || !state || !idToken) {
      return Response.redirect('/?auth_error=missing_params', 302);
    }
  } catch (err) {
    return Response.redirect('/?auth_error=parse_error', 302);
  }

  // Verify state
  const stateDataStr = await env.AUTH_KV.get(`oauth_state:${state}`);
  if (!stateDataStr) {
    return Response.redirect('/?auth_error=invalid_state', 302);
  }
  const stateData: OAuthState = JSON.parse(stateDataStr);
  await env.AUTH_KV.delete(`oauth_state:${state}`);

  // Verify id_token using Apple's JWKS
  // TODO: Use jose to verify:
  //   import { createRemoteJWKSet, jwtVerify } from 'jose';
  //   const JWKS = createRemoteJWKSet(new URL(APPLE_JWKS_URI));
  //   const { payload } = await jwtVerify(idToken, JWKS, {
  //     issuer: 'https://appleid.apple.com',
  //     audience: env.APPLE_CLIENT_ID,
  //   });
  //   if (payload.nonce !== stateData.nonce) throw new Error('Nonce mismatch');
  //   const providerId = payload.sub as string;

  // TEMPORARY: Decode without verification (replace with jose before launch)
  let providerId: string;
  try {
    const [, payloadB64] = idToken.split('.');
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (payload.nonce !== stateData.nonce) {
      return Response.redirect('/?auth_error=nonce_mismatch', 302);
    }
    providerId = payload.sub;
  } catch (err) {
    return Response.redirect('/?auth_error=token_invalid', 302);
  }

  const { user } = await findOrCreateUser(
    env.AUTH_KV,
    'apple',
    providerId,
    stateData.preferences
  );

  const sessionId = await createSession(env.AUTH_KV, user.id, 'apple');

  const headers = new Headers();
  headers.append('Set-Cookie', buildSessionCookie(sessionId));
  headers.append('Location', '/');

  return new Response(null, { status: 302, headers });
};
