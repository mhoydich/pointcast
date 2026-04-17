/**
 * Apple auth stub.
 *
 * TODO:
 *  - Add Cloudflare Pages env vars:
 *      APPLE_CLIENT_ID
 *      APPLE_TEAM_ID
 *      APPLE_KEY_ID
 *      APPLE_PRIVATE_KEY
 *      APPLE_REDIRECT_URI
 *      APPLE_SCOPES
 *  - Generate the Apple client secret JWT server-side from team/key/private key.
 *  - Implement `/api/auth/apple/callback` to exchange the code, read the
 *    Apple user payload, then issue a PointCast session.
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
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
  APPLE_REDIRECT_URI?: string;
  APPLE_SCOPES?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const redirectUri = env.APPLE_REDIRECT_URI ?? `${origin}/api/auth/apple/callback`;
  const scope = env.APPLE_SCOPES ?? 'name email';
  const authUrl = new URL('https://appleid.apple.com/auth/authorize');
  authUrl.searchParams.set('client_id', env.APPLE_CLIENT_ID ?? 'TODO_APPLE_CLIENT_ID');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('scope', scope);

  if (env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY) {
    return Response.redirect(authUrl.toString(), 302);
  }

  return json({
    ok: false,
    provider: 'apple',
    status: 'coming-soon',
    authUrl: authUrl.toString(),
    missingEnv: [
      'APPLE_CLIENT_ID',
      'APPLE_TEAM_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY',
    ],
  }, { status: 501 });
};
