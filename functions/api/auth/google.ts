import {
  OAUTH_STATE_TTL_SECONDS,
  randomUrlSafeString,
  safeReturnTo,
  type OAuthStateRecord,
} from './_oauth';
import {
  authJson,
  hasAuthStorage,
  readSessionFromRequest,
  writeAuthState,
} from './session';

type GoogleEnv = Cloudflare.Env;

const STATE_PREFIX = 'oauth-state:google:';

export const onRequestGet: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return authJson({
      ok: false,
      provider: 'google',
      reason: 'not-configured',
      missingEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    }, { status: 503 });
  }

  const url = new URL(request.url);
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = randomUrlSafeString();
  const nonce = randomUrlSafeString();
  const current = await readSessionFromRequest(request, env);
  const stateRecord: OAuthStateRecord = {
    nonce,
    returnTo: safeReturnTo(url.searchParams.get('returnTo')),
    currentUserId: current?.user.userId ?? null,
    createdAt: new Date().toISOString(),
  };
  await writeAuthState(env, `${STATE_PREFIX}${state}`, stateRecord, OAUTH_STATE_TTL_SECONDS);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('prompt', 'select_account');

  return Response.redirect(authUrl.toString(), 302);
};
