/**
 * /api/spotify-playlist — bounded public playlist metadata endpoint.
 *
 * Uses the existing Spotify app-token helper to fetch bounded playlist
 * metadata via the official GET /playlists/{playlist_id} endpoint. Spotify's
 * February 2026 API renamed playlist `tracks` to `items` and limits playlist
 * contents to playlists owned by or shared with the authenticated user, so an
 * empty `tracks` array is a supported metadata-only response.
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
      `/playlists/${encodeURIComponent(id)}?fields=id,name,description,external_urls(spotify),owner(display_name),images,items(total,items(item(type,uri,name,artists(name),duration_ms,external_urls(spotify))))`,
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
  const itemPage = data.items ?? data.tracks;
  const itemRows = Array.isArray(itemPage?.items) ? itemPage.items : [];
  const tracks = itemRows
    .slice(0, 100)
    .map((row: any, i: number) => {
      const item = row?.item ?? row?.track;
      return {
        position: i + 1,
        name: String(item?.name || ''),
        artists: Array.isArray(item?.artists)
          ? item.artists.map((a: any) => String(a?.name || ''))
          : [],
        durationMs: typeof item?.duration_ms === 'number' ? item.duration_ms : null,
        spotifyUrl: typeof item?.external_urls?.spotify === 'string'
          ? item.external_urls.spotify
          : (typeof item?.uri === 'string' && item.uri.startsWith('spotify:track:')
              ? `https://open.spotify.com/track/${item.uri.slice('spotify:track:'.length)}`
              : null),
      };
    });

  return {
    id: String(data.id || playlistId),
    name: String(data.name || ''),
    description: typeof data.description === 'string' ? data.description : null,
    owner: typeof data.owner?.display_name === 'string' ? data.owner.display_name : null,
    spotifyUrl: typeof data.external_urls?.spotify === 'string'
      ? data.external_urls.spotify
      : `https://open.spotify.com/playlist/${playlistId}`,
    totalTracks: typeof itemPage?.total === 'number' ? itemPage.total : tracks.length,
    metadataScope: tracks.length ? 'playlist_items' : 'playlist_metadata_only',
    itemsAvailable: tracks.length > 0,
    images: Array.isArray(data.images)
      ? data.images
          .filter((img: any) => typeof img?.url === 'string')
          .slice(0, 3)
          .map((img: any) => ({ url: img.url, width: img.width || null, height: img.height || null }))
      : [],
    tracks,
  };
}
