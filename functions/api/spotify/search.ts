/**
 * /api/spotify/search?q=... — proxy Spotify Web API search.
 *
 * Returns top 10 track matches: id, name, artists, album, duration, preview.
 * Uses Client Credentials Flow (no user auth) — track metadata is public,
 * so app token is enough. If env vars not configured, returns 503 with
 * { ok: false, error: 'not_configured' } so the v3 page can hide search UI.
 *
 * GET /api/spotify/search?q=<query>&limit=10
 *   200: { ok: true, tracks: [{ id, name, artists: [{name}], album: {name, image}, durationMs, previewUrl }] }
 *   503: { ok: false, error: 'not_configured' }    — env not set, gracefully degrade
 *   400: { ok: false, error: 'missing_query' }     — no q param
 *   429: { ok: false, error: 'rate_limited' }      — Spotify is mad at us
 */

import {
  spotifyFetch,
  spotifyError,
  SPOTIFY_JSON_HEADERS,
  type SpotifyEnv,
} from './_helpers';

export const onRequestGet: PagesFunction<SpotifyEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '10', 10) || 10, 1), 20);
  if (!q) return spotifyError('missing_query', 400, 'q query param required');

  const res = await spotifyFetch(
    env,
    `/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}`,
  );
  if (!res) {
    return spotifyError(
      'not_configured',
      503,
      'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not set on Pages env',
    );
  }
  if (res.status === 429) return spotifyError('rate_limited', 429);
  if (!res.ok) return spotifyError('upstream_error', res.status);

  const data = await res.json() as {
    tracks?: {
      items?: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images: Array<{ url: string; height: number; width: number }> };
        duration_ms: number;
        preview_url: string | null;
        external_urls?: { spotify?: string };
      }>;
    };
  };

  const items = data.tracks?.items ?? [];
  const tracks = items.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => ({ name: a.name })),
    album: {
      name: t.album.name,
      // Smallest image >= 64px (avoids the 640px album-cover-of-doom)
      image: t.album.images.find((i) => i.height >= 64)?.url ?? t.album.images[0]?.url ?? null,
    },
    durationMs: t.duration_ms,
    previewUrl: t.preview_url,
    spotifyUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
  }));

  return new Response(JSON.stringify({ ok: true, tracks }), {
    headers: {
      ...SPOTIFY_JSON_HEADERS,
      'Cache-Control': 'public, max-age=60',
    },
  });
};

export const onRequestOptions: PagesFunction<SpotifyEnv> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
