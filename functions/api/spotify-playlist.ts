/**
 * /api/spotify-playlist — bounded public playlist metadata endpoint.
 *
 * Uses the existing Spotify app-token helper to fetch bounded playlist
 * metadata via the official GET /playlists/{playlist_id} endpoint.
 *
 * Treats metadata as enhancement, not a precondition. Missing credentials,
 * restricted playlists, 403/404/429, and API changes all leave the embed,
 * notes, room, sharing, and receipt fully usable.
 *
 * Never caches or persists Spotify content beyond the shortest practical
 * HTTP cache. Never stores artwork in KV.
 */

import {
  SPOTIFY_JSON_HEADERS,
  spotifyError,
  spotifyFetch,
  type SpotifyEnv,
} from './spotify/_helpers';

const PLAYLIST_ID_RE = /^[A-Za-z0-9]{22}$/;

export const onRequest: PagesFunction<SpotifyEnv> = async (ctx) => {
  const reqUrl = new URL(ctx.request.url);
  const id = (reqUrl.searchParams.get('id') || '').trim();

  if (!id || !PLAYLIST_ID_RE.test(id)) {
    return spotifyError('invalid_playlist_id', 400);
  }

  try {
    const response = await spotifyFetch(
      ctx.env,
      `/playlists/${encodeURIComponent(id)}?fields=id,name,description,external_urls(spotify),owner(display_name),images,tracks(total,items(track(name,artists(name),duration_ms,external_urls(spotify))))`,
    );
    if (!response) {
      return spotifyError(
        'metadata_unavailable',
        503,
        'Spotify credentials or app token are unavailable',
      );
    }
    if (response.status === 404) return spotifyError('playlist_not_found', 404);
    if (response.status === 403) return spotifyError('playlist_restricted', 403);
    if (response.status === 429) return spotifyError('rate_limited', 429);
    if (!response.ok) return spotifyError('spotify_api_error', 502);

    const data = (await response.json()) as Record<string, any>;
    const meta = boundedPlaylistMeta(data, id);
    return json(meta, 200, { 'Cache-Control': 'public, max-age=120' });
  } catch {
    return spotifyError('upstream_error', 502);
  }
};

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SPOTIFY_JSON_HEADERS,
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function boundedPlaylistMeta(
  data: Record<string, any>,
  playlistId: string,
): Record<string, unknown> {
  // Return only the bounded fields we need. Do not echo the full API response.
  const tracks = Array.isArray(data.tracks?.items)
    ? data.tracks.items.slice(0, 100).map((item: any, i: number) => ({
        position: i + 1,
        name: String(item?.track?.name || ''),
        artists: Array.isArray(item?.track?.artists)
          ? item.track.artists.map((a: any) => String(a?.name || ''))
          : [],
        durationMs: typeof item?.track?.duration_ms === 'number' ? item.track.duration_ms : null,
        spotifyUrl: typeof item?.track?.external_urls?.spotify === 'string'
          ? item.track.external_urls.spotify
          : null,
      }))
    : [];

  return {
    id: String(data.id || playlistId),
    name: String(data.name || ''),
    description: typeof data.description === 'string' ? data.description : null,
    owner: typeof data.owner?.display_name === 'string' ? data.owner.display_name : null,
    spotifyUrl: typeof data.external_urls?.spotify === 'string'
      ? data.external_urls.spotify
      : `https://open.spotify.com/playlist/${playlistId}`,
    totalTracks: typeof data.tracks?.total === 'number' ? data.tracks.total : tracks.length,
    images: Array.isArray(data.images)
      ? data.images
          .filter((img: any) => typeof img?.url === 'string')
          .slice(0, 3)
          .map((img: any) => ({ url: img.url, width: img.width || null, height: img.height || null }))
      : [],
    tracks,
  };
}
