/**
 * Google auth stub.
 *
 * TODO:
 *  - Add Cloudflare Pages env vars:
 *      GOOGLE_CLIENT_ID
 *      GOOGLE_CLIENT_SECRET
 *      GOOGLE_REDIRECT_URI
 *      GOOGLE_SCOPES
 *  - Register the redirect URI in Google Cloud Console.
 *  - Default scopes should stay narrow: `openid email profile`.
 *  - Implement `/api/auth/google/callback` to exchange `code` for tokens,
 *    read the Google profile, then issue a PointCast session.
 */

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      ...(init?.headers ?? {}),
    },
  });
}

interface Env {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_SCOPES?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const redirectUri = env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google/callback`;
  const scope = env.GOOGLE_SCOPES ?? 'openid email profile';
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID ?? 'TODO_GOOGLE_CLIENT_ID');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(authUrl.toString(), 302);
  }

  return json({
    ok: false,
    provider: 'google',
    status: 'coming-soon',
    authUrl: authUrl.toString(),
    missingEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  }, { status: 501 });
};
