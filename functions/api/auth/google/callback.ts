import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { AuthIdentity, AuthRole } from '../../../../src/lib/auth/types';
import {
  appendResult,
  secureEqual,
  safeReturnTo,
  type OAuthStateRecord,
} from '../_oauth';
import {
  IdentityConflictError,
  authJson,
  issueSession,
  upsertUserForIdentity,
  withSessionCookie,
} from '../session';

type GoogleCallbackEnv = Cloudflare.Env;

interface GoogleTokenResponse {
  id_token?: string;
  error?: string;
}

const STATE_PREFIX = 'oauth-state:google:';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/certs';

function errorRedirect(request: Request, reason: string, returnTo = '/dashboard'): Response {
  const target = appendResult(safeReturnTo(returnTo), 'auth_error', reason);
  return Response.redirect(new URL(target, request.url).toString(), 302);
}

export const onRequestGet: PagesFunction<GoogleCallbackEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return authJson({ ok: false, reason: 'google-not-configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  const providerError = url.searchParams.get('error');
  if (providerError) return errorRedirect(request, 'google-denied');

  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  if (!code || !state) return errorRedirect(request, 'google-missing-callback');

  const stateKey = `${STATE_PREFIX}${state}`;
  const stateRecord = await env.USERS.get<OAuthStateRecord>(stateKey, 'json');
  if (!stateRecord) return errorRedirect(request, 'google-state-expired');
  await env.USERS.delete(stateKey);

  const redirectUri = `${url.origin}/api/auth/google/callback`;
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
  } catch {
    return errorRedirect(request, 'google-token-unreachable', stateRecord.returnTo);
  }

  const token = await tokenResponse.json<GoogleTokenResponse>().catch(() => ({}));
  if (!tokenResponse.ok || !token.id_token) {
    return errorRedirect(request, 'google-token-failed', stateRecord.returnTo);
  }

  try {
    const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_ENDPOINT));
    const verified = await jwtVerify(token.id_token, jwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_ID,
    });
    const claims = verified.payload;
    const subject = typeof claims.sub === 'string' ? claims.sub : '';
    const nonce = typeof claims.nonce === 'string' ? claims.nonce : '';
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
    const emailVerified = claims.email_verified === true;
    if (!subject || !nonce || !(await secureEqual(nonce, stateRecord.nonce))) {
      return errorRedirect(request, 'google-identity-invalid', stateRecord.returnTo);
    }

    const identity: AuthIdentity = {
      provider: 'google',
      id: subject,
      name: typeof claims.name === 'string' && claims.name.trim()
        ? claims.name.trim()
        : 'Google member',
      ...(typeof claims.picture === 'string' && claims.picture.startsWith('https://')
        ? { avatar: claims.picture }
        : {}),
      verifiedAt: new Date().toISOString(),
    };

    const broadcasterEmail = env.POINTCAST_BROADCAST_EMAIL?.trim().toLowerCase() ?? '';
    const roles: AuthRole[] = broadcasterEmail
      && emailVerified
      && await secureEqual(email, broadcasterEmail)
      ? ['broadcaster']
      : [];
    const user = await upsertUserForIdentity(env, identity, {
      currentUserId: stateRecord.currentUserId,
      roles,
    });
    const session = await issueSession(env, user.userId);
    const target = appendResult(stateRecord.returnTo, 'auth', 'google');
    return withSessionCookie(
      Response.redirect(new URL(target, request.url).toString(), 302),
      session,
    );
  } catch (error) {
    if (error instanceof IdentityConflictError) {
      return errorRedirect(request, 'google-already-linked', stateRecord.returnTo);
    }
    return errorRedirect(request, 'google-verification-failed', stateRecord.returnTo);
  }
};
