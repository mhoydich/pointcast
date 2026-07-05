/**
 * GET /api/auth/google — start the Google OAuth 2.0 code flow.
 *
 * Redirects to Google's consent screen with a CSRF `state` that rides a
 * short-lived HttpOnly cookie (verified in ./callback.ts). Until
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set on the Pages project,
 * bounces back to /login?google=unconfigured so the login page can show
 * a status line instead of the user hitting raw JSON.
 *
 * Setup (operator): docs/briefs/2026-07-05-manus-google-oauth.md
 *   - OAuth client in Google Cloud Console, authorized redirect URI
 *     https://pointcast.xyz/api/auth/google/callback
 *   - npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name pointcast
 *   - npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name pointcast
 *
 * Scopes stay narrow: `openid email profile`. No offline access — we
 * never store Google tokens, only the verified identity.
 */

import type { AuthEnv } from '../session';

export interface GoogleEnv extends AuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_SCOPES?: string;
}

export const GOOGLE_STATE_COOKIE = 'pc_google_state';

/** Same-origin path only — anything else falls back to /login. */
export function safeReturnPath(candidate: string | null): string {
  if (!candidate) return '/login';
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/login';
  // Control characters would corrupt the Location header at redirect time —
  // new Response() throws on them, turning a bad param into a 500.
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return '/login';
  return candidate;
}

export const onRequestGet: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(`${origin}/login?google=unconfigured`, 302);
  }

  const redirectUri = env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google/callback`;
  const scope = env.GOOGLE_SCOPES ?? 'openid email profile';
  const returnTo = safeReturnPath(url.searchParams.get('redirect'));
  const state = crypto.randomUUID();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  // State + return path ride one cookie: "<state>.<encoded return path>".
  // Path-scoped to the google auth routes so it never travels site-wide.
  const headers = new Headers({ Location: authUrl.toString() });
  headers.append(
    'Set-Cookie',
    `${GOOGLE_STATE_COOKIE}=${state}.${encodeURIComponent(returnTo)}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  );
  return new Response(null, { status: 302, headers });
};
