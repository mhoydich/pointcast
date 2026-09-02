import {
  appendResult,
  safeReturnTo,
  type OAuthStateRecord,
} from '../auth/_oauth';
import {
  authJson,
  readSessionFromRequest,
} from '../auth/session';
import {
  resolveNowPlaying,
  storeSpotifyCredentials,
  type SpotifyBroadcastEnv,
} from './_broadcast';

interface SpotifyTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

const STATE_PREFIX = 'oauth-state:spotify:';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

function errorRedirect(request: Request, reason: string, returnTo = '/me'): Response {
  const target = appendResult(safeReturnTo(returnTo), 'spotify_error', reason);
  return Response.redirect(new URL(target, request.url).toString(), 302);
}

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  if (!env.USERS) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET
    || !env.SPOTIFY_TOKEN_ENCRYPTION_KEY) {
    return authJson({ ok: false, reason: 'spotify-not-configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get('error')) return errorRedirect(request, 'spotify-denied');
  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  if (!code || !state) return errorRedirect(request, 'spotify-missing-callback');

  const stateKey = `${STATE_PREFIX}${state}`;
  const stateRecord = await env.USERS.get<OAuthStateRecord>(stateKey, 'json');
  if (!stateRecord) return errorRedirect(request, 'spotify-state-expired');
  await env.USERS.delete(stateKey);

  const current = await readSessionFromRequest(request, env);
  if (!current
    || current.user.userId !== stateRecord.currentUserId
    || !current.user.roles?.includes('broadcaster')) {
    return errorRedirect(request, 'spotify-session-mismatch', stateRecord.returnTo);
  }

  const redirectUri = `${url.origin}/api/spotify/callback`;
  let response: Response;
  try {
    response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
  } catch {
    return errorRedirect(request, 'spotify-token-unreachable', stateRecord.returnTo);
  }

  const token = await response.json() as SpotifyTokenResponse;
  if (!response.ok || !token.access_token || !token.refresh_token) {
    return errorRedirect(request, 'spotify-token-failed', stateRecord.returnTo);
  }

  try {
    await storeSpotifyCredentials(env, {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    });
    await resolveNowPlaying(env, { force: true });
  } catch {
    return errorRedirect(request, 'spotify-storage-failed', stateRecord.returnTo);
  }

  const target = appendResult(stateRecord.returnTo, 'spotify', 'connected');
  return Response.redirect(new URL(target, request.url).toString(), 302);
};
