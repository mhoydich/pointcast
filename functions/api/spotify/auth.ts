import {
  OAUTH_STATE_TTL_SECONDS,
  randomUrlSafeString,
  safeReturnTo,
  type OAuthStateRecord,
} from '../auth/_oauth';
import {
  authJson,
  readSessionFromRequest,
} from '../auth/session';
import type { SpotifyBroadcastEnv } from './_broadcast';

const STATE_PREFIX = 'oauth-state:spotify:';

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET
    || !env.SPOTIFY_TOKEN_ENCRYPTION_KEY) {
    return authJson({
      ok: false,
      reason: 'spotify-not-configured',
      missingEnv: [
        'SPOTIFY_CLIENT_ID',
        'SPOTIFY_CLIENT_SECRET',
        'SPOTIFY_TOKEN_ENCRYPTION_KEY',
      ],
    }, { status: 503 });
  }

  const url = new URL(request.url);
  const current = await readSessionFromRequest(request, env);
  if (!current) {
    const returnTo = safeReturnTo(`${url.pathname}${url.search}`, '/api/spotify/auth');
    const google = new URL('/api/auth/google', url.origin);
    google.searchParams.set('returnTo', returnTo);
    return Response.redirect(google.toString(), 302);
  }
  if (!current.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  }

  const redirectUri = `${url.origin}/api/spotify/callback`;
  const state = randomUrlSafeString();
  const stateRecord: OAuthStateRecord = {
    nonce: randomUrlSafeString(),
    returnTo: safeReturnTo(url.searchParams.get('returnTo'), '/me'),
    currentUserId: current.user.userId,
    createdAt: new Date().toISOString(),
  };
  await env.USERS.put(`${STATE_PREFIX}${state}`, JSON.stringify(stateRecord), {
    expirationTtl: OAUTH_STATE_TTL_SECONDS,
  });

  const authorize = new URL('https://accounts.spotify.com/authorize');
  authorize.searchParams.set('client_id', env.SPOTIFY_CLIENT_ID);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'user-read-currently-playing');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('show_dialog', 'true');
  return Response.redirect(authorize.toString(), 302);
};
