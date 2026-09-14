import { authJson, readSessionFromRequest } from '../auth/session.ts';
import type { SpotifyBroadcastEnv } from '../spotify/_broadcast.ts';
import { clearPersonalSpotify, personalSpotifyConfigured, resolvePersonalSpotify } from '../spotify/_personal.ts';

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized', error: 'Sign in required' }, { status: 401 });
    return authJson({ ok: true, ...await resolvePersonalSpotify(env, current.user.userId) });
  } catch {
    return authJson({ ok: false, connected: false, status: 'unavailable', track: null }, { status: 503 });
  }
};

export const onRequestDelete: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  if (request.headers.get('Origin') !== new URL(request.url).origin
    || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return authJson({ ok: false, reason: 'same-origin-required' }, { status: 403 });
  }
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized', error: 'Sign in required' }, { status: 401 });
    await clearPersonalSpotify(env, current.user.userId);
    return authJson({
      ok: true, configured: personalSpotifyConfigured(env), connected: false,
      status: 'disconnected', track: null, checkedAt: new Date().toISOString(),
    });
  } catch {
    return authJson({ ok: false, reason: 'spotify-disconnect-unavailable' }, { status: 503 });
  }
};
