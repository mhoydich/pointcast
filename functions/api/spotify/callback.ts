import {
  appendResult,
  safeReturnTo,
} from '../auth/_oauth.ts';
import {
  authJson,
  readSessionFromRequest,
} from '../auth/session.ts';
import {
  resolveNowPlaying,
  storeSpotifyCredentials,
  type SpotifyBroadcastEnv,
} from './_broadcast.ts';
import { storePersonalSpotifyCredentials, type SpotifyOAuthStateRecord } from './_personal.ts';

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
  const providerError = url.searchParams.get('error');
  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  if (!state || (!code && !providerError)) return errorRedirect(request, 'spotify-missing-callback');

  const stateKey = `${STATE_PREFIX}${state}`;
  const stateRecord = await env.USERS.get<SpotifyOAuthStateRecord>(stateKey, 'json');
  if (!stateRecord) return errorRedirect(request, 'spotify-state-expired');
  await env.USERS.delete(stateKey);

  const current = await readSessionFromRequest(request, env);
  if (!current
    || current.user.userId !== stateRecord.currentUserId
    || (stateRecord.personal !== true && !current.user.roles?.includes('broadcaster'))) {
    return errorRedirect(request, 'spotify-session-mismatch', stateRecord.returnTo);
  }
  if (providerError) return errorRedirect(request, 'spotify-denied', stateRecord.returnTo);

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

  let token: SpotifyTokenResponse;
  try {
    token = await response.json() as SpotifyTokenResponse;
  } catch {
    return errorRedirect(request, 'spotify-token-failed', stateRecord.returnTo);
  }
  if (!response.ok || !token.access_token || !token.refresh_token) {
    return errorRedirect(request, 'spotify-token-failed', stateRecord.returnTo);
  }
  if (stateRecord.personal === true && (typeof token.expires_in !== 'number'
    || !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0)) {
    return errorRedirect(request, 'spotify-token-failed', stateRecord.returnTo);
  }

  try {
    const credentials = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    };
    if (stateRecord.personal === true) {
      await storePersonalSpotifyCredentials(env, current.user.userId, credentials);
    } else {
      await storeSpotifyCredentials(env, credentials);
      await resolveNowPlaying(env, { force: true });
    }
  } catch {
    return errorRedirect(request, 'spotify-storage-failed', stateRecord.returnTo);
  }

  const target = appendResult(stateRecord.returnTo, 'spotify', 'connected');
  return Response.redirect(new URL(target, request.url).toString(), 302);
};
