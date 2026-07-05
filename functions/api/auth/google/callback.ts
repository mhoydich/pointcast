/**
 * GET /api/auth/google/callback — finish the Google OAuth 2.0 code flow.
 *
 * Verifies the CSRF state against the pc_google_state cookie set by
 * ./index.ts, exchanges the code for tokens, reads the OpenID profile
 * from Google's userinfo endpoint (over TLS, straight from Google — no
 * JWT verification needed since we never accept an id_token from the
 * browser), then upserts the PointCast user keyed to the Google `sub`
 * and issues the same pc_session cookie the wallet flows use.
 *
 * Every failure redirects to /login?google=error&reason=<slug> so the
 * user always lands back on the login page with a status line, never on
 * raw JSON.
 */

import type { AuthIdentity } from '../../../../src/lib/auth/types';
import {
  IdentityConflictError,
  issueSession,
  readSessionFromRequest,
  upsertUserForIdentity,
} from '../session';
import { GOOGLE_STATE_COOKIE, safeReturnPath, type GoogleEnv } from './index';

const CLEAR_STATE_COOKIE = `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  return match ? match[1] : null;
}

function redirectTo(origin: string, path: string, extraCookies: string[] = []): Response {
  const headers = new Headers({ Location: `${origin}${path}` });
  headers.append('Set-Cookie', CLEAR_STATE_COOKIE);
  for (const cookie of extraCookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

function sessionCookie(sessionToken: string, expiresAt: string): string {
  const maxAge = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
  return `pc_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export const onRequestGet: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (reason: string) => redirectTo(origin, `/login?google=error&reason=${reason}`);

  if (!env.USERS) return fail('kv-not-bound');
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail('unconfigured');

  // User cancelled the consent screen — not an error worth alarming over.
  if (url.searchParams.get('error')) {
    return redirectTo(origin, '/login?google=cancelled');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return fail('missing-code');

  const cookieValue = getCookieValue(request, GOOGLE_STATE_COOKIE);
  if (!cookieValue) return fail('missing-state');
  const dot = cookieValue.indexOf('.');
  const cookieState = dot === -1 ? cookieValue : cookieValue.slice(0, dot);
  let returnTo = '/login';
  if (dot !== -1) {
    // A tampered cookie with bad percent-encoding must degrade to /login,
    // not throw a 500 that recurs until the cookie expires.
    try {
      returnTo = safeReturnPath(decodeURIComponent(cookieValue.slice(dot + 1)));
    } catch {
      returnTo = '/login';
    }
  }
  if (cookieState !== state) return fail('state-mismatch');

  const redirectUri = env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google/callback`;

  let accessToken = '';
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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
    if (!tokenResponse.ok) return fail('token-exchange');
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    accessToken = tokens.access_token ?? '';
  } catch {
    return fail('token-exchange');
  }
  if (!accessToken) return fail('no-access-token');

  let profile: { sub?: string; email?: string; name?: string; picture?: string };
  try {
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) return fail('userinfo');
    profile = (await profileResponse.json()) as typeof profile;
  } catch {
    return fail('userinfo');
  }
  if (!profile.sub) return fail('no-subject');

  const current = await readSessionFromRequest(request, env);
  const identity: AuthIdentity = {
    provider: 'google',
    id: profile.sub,
    name: profile.name || profile.email || 'google account',
    ...(profile.picture ? { avatar: profile.picture } : {}),
    verifiedAt: new Date().toISOString(),
  };

  try {
    const user = await upsertUserForIdentity(env, identity, {
      currentUserId: current?.user.userId ?? null,
    });
    const session = await issueSession(env, user.userId);
    return redirectTo(origin, returnTo, [
      sessionCookie(session.sessionToken, session.expiresAt),
    ]);
  } catch (error) {
    if (error instanceof IdentityConflictError) {
      return fail('identity-already-linked');
    }
    throw error;
  }
};
