/**
 * Google OAuth 2.0 / OIDC Authentication Handler
 * @file functions/api/auth/google.ts
 *
 * Handles two routes:
 *   GET /api/auth/google/login    — Initiates the OAuth flow
 *   GET /api/auth/google/callback — Handles the OAuth callback
 *
 * Required Cloudflare Pages env vars:
 *   GOOGLE_CLIENT_ID      — From Google Cloud Console (OAuth 2.0 Client ID)
 *   GOOGLE_CLIENT_SECRET  — From Google Cloud Console
 *   GOOGLE_REDIRECT_URI   — Must match exactly: https://your-domain.com/api/auth/google/callback
 *   AUTH_KV               — KV namespace binding
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
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
}

// Google's OIDC discovery document endpoint
const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export const onRequestGet = async (context: EventContext<Env, any, any>) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // -------------------------------------------------------------------------
  // Route: /api/auth/google/login
  // -------------------------------------------------------------------------
  if (url.pathname.endsWith('/login')) {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    // Read optional migration preferences from query params
    const drumName = url.searchParams.get('drumName') ?? undefined;
    const noun = url.searchParams.get('noun') ?? undefined;

    const stateData: OAuthState = {
      nonce,
      preferences: drumName || noun ? { drumName, noun } : undefined,
    };

    // Store state in KV with 5-minute TTL to prevent CSRF
    await env.AUTH_KV.put(
      `oauth_state:${state}`,
      JSON.stringify(stateData),
      { expirationTtl: 300 }
    );

    // Build Google authorization URL
    const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
    authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid');  // Privacy-maximizing: openid only, no email/profile
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('access_type', 'online'); // No refresh tokens needed

    return Response.redirect(authUrl.toString(), 302);
  }

  // -------------------------------------------------------------------------
  // Route: /api/auth/google/callback
  // -------------------------------------------------------------------------
  if (url.pathname.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return Response.redirect('/?auth_error=google_denied', 302);
    }

    if (!code || !state) {
      return Response.redirect('/?auth_error=missing_params', 302);
    }

    // Verify and consume state from KV
    const stateDataStr = await env.AUTH_KV.get(`oauth_state:${state}`);
    if (!stateDataStr) {
      return Response.redirect('/?auth_error=invalid_state', 302);
    }
    const stateData: OAuthState = JSON.parse(stateDataStr);
    await env.AUTH_KV.delete(`oauth_state:${state}`);

    // Exchange authorization code for tokens
    let idToken: string;
    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error('Token exchange failed:', errBody);
        return Response.redirect('/?auth_error=token_exchange', 302);
      }

      const tokens = await tokenResponse.json<{ id_token: string }>();
      idToken = tokens.id_token;
    } catch (err) {
      console.error('Token exchange exception:', err);
      return Response.redirect('/?auth_error=token_exchange', 302);
    }

    // Verify id_token and extract claims
    // TODO: In production, verify the JWT signature using Google's JWKS.
    // For now, we decode the payload without verification (INSECURE — replace before launch).
    // Recommended library: `jose` (works in Cloudflare Workers runtime).
    //
    // Example with jose:
    //   import { createRemoteJWKSet, jwtVerify } from 'jose';
    //   const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URI));
    //   const { payload } = await jwtVerify(idToken, JWKS, {
    //     issuer: 'https://accounts.google.com',
    //     audience: env.GOOGLE_CLIENT_ID,
    //   });
    //   if (payload.nonce !== stateData.nonce) throw new Error('Nonce mismatch');
    //   const providerId = payload.sub as string;

    // TEMPORARY: Decode without verification (replace with jose before launch)
    let providerId: string;
    try {
      const [, payloadB64] = idToken.split('.');
      const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      // Validate nonce
      if (payload.nonce !== stateData.nonce) {
        return Response.redirect('/?auth_error=nonce_mismatch', 302);
      }

      providerId = payload.sub;
    } catch (err) {
      console.error('id_token decode error:', err);
      return Response.redirect('/?auth_error=token_invalid', 302);
    }

    // Find or create user
    const { user } = await findOrCreateUser(
      env.AUTH_KV,
      'google',
      providerId,
      stateData.preferences
    );

    // Create session
    const sessionId = await createSession(env.AUTH_KV, user.id, 'google');

    // Set cookie and redirect home
    const headers = new Headers();
    headers.append('Set-Cookie', buildSessionCookie(sessionId));
    headers.append('Location', '/');

    return new Response(null, { status: 302, headers });
  }

  return new Response('Not found', { status: 404 });
};
