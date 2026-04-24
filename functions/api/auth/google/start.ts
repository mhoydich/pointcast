/**
 * GET /api/auth/google/start
 *
 * OAuth 2.0 authorization-code start endpoint. Redirects to Google with
 * a state cookie planted for CSRF defense; the callback at
 * /api/auth/google/callback validates that state and exchanges the code
 * for tokens.
 *
 * Per super-sprint directive 2026-04-21 ~00:35 PT: "and yah, the google
 * auth, try something with tezos."
 *
 * Required env vars (set in Cloudflare Pages dashboard or wrangler.toml):
 *   GOOGLE_CLIENT_ID       — OAuth 2.0 client ID from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET   — OAuth 2.0 client secret (used in callback)
 *   GOOGLE_REDIRECT_URI    — must exactly match an authorized redirect URI
 *                            in the Google Cloud Console (e.g.
 *                            https://pointcast.xyz/api/auth/google/callback)
 *   GOOGLE_SCOPES          — space-separated, default: 'openid email profile'
 *
 * If env is missing, returns a JSON 503 with a friendly error so dev
 * deploys don't crash.
 */

interface Env {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_SCOPES?: string;
}

function randomState(len = 32): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

function jsonError(message: string, status = 503): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const env = ctx.env || ({} as Env);
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_REDIRECT_URI || 'https://pointcast.xyz/api/auth/google/callback';
  const scopes = env.GOOGLE_SCOPES || 'openid email profile';

  if (!clientId) {
    return jsonError(
      'Google OAuth not configured. Set GOOGLE_CLIENT_ID + GOOGLE_REDIRECT_URI on the Cloudflare Pages project. See functions/api/auth/google/start.ts header for details.',
      503,
    );
  }

  // Optional `next` redirect target after successful login
  const url = new URL(ctx.request.url);
  const next = url.searchParams.get('next') || '/cos';

  // CSRF state — random opaque token, mirrored back in the callback.
  // We pack the `next` target into the state so the callback can route.
  const stateToken = randomState(24);
  const statePayload = JSON.stringify({ s: stateToken, n: next });
  const stateB64 = btoa(statePayload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', scopes);
  auth.searchParams.set('state', stateB64);
  auth.searchParams.set('access_type', 'online');
  auth.searchParams.set('prompt', 'select_account');

  const cookieAttrs = [
    `pc_oauth_state=${stateToken}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=600',
  ].join('; ');

  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      'Set-Cookie': cookieAttrs,
      'Cache-Control': 'no-store',
    },
  });
};
