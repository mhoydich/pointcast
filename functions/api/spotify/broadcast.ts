import {
  authJson,
  readSessionFromRequest,
} from '../auth/session';
import {
  clearSpotifyBroadcast,
  hasSpotifyCredentials,
  resolveNowPlaying,
  type SpotifyBroadcastEnv,
} from './_broadcast';

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  const [current, connected, nowPlaying] = await Promise.all([
    readSessionFromRequest(request, env),
    hasSpotifyCredentials(env),
    resolveNowPlaying(env),
  ]);
  return authJson({
    ok: true,
    configured: Boolean(
      env.SPOTIFY_CLIENT_ID
      && env.SPOTIFY_CLIENT_SECRET
      && env.SPOTIFY_TOKEN_ENCRYPTION_KEY,
    ),
    connected,
    canManage: Boolean(current?.user.roles?.includes('broadcaster')),
    nowPlaying,
  });
};

export const onRequestDelete: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  }
  await clearSpotifyBroadcast(env);
  return authJson({ ok: true, connected: false });
};
