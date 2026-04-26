/**
 * /api/spotify/track?id=... — fetch a single track + its audio features.
 *
 * Combines two Spotify endpoints into one client call:
 *   GET /v1/tracks/{id}            → name, artists, album, preview_url
 *   GET /v1/audio-features/{id}    → tempo (BPM), key, time_signature, energy
 *
 * The v3 drum room uses the BPM to pulse the visual beat indicator in
 * sync with the track. Audio-analysis (precise beat positions) is the
 * deeper API and could be added later for true beat-locked drumming.
 *
 * GET /api/spotify/track?id=<spotify_track_id>
 *   200: { ok: true, track: { id, name, artists, album, durationMs, previewUrl, bpm, key, timeSignature, energy, danceability } }
 *   400: { ok: false, error: 'missing_id' | 'invalid_id' }
 *   404: { ok: false, error: 'not_found' }
 *   503: { ok: false, error: 'not_configured' }
 */

import {
  spotifyFetch,
  spotifyError,
  SPOTIFY_JSON_HEADERS,
  type SpotifyEnv,
} from './_helpers';

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;

const KEY_NAMES = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

export const onRequestGet: PagesFunction<SpotifyEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = (url.searchParams.get('id') ?? '').trim();
  if (!id) return spotifyError('missing_id', 400, 'id query param required');
  if (!SPOTIFY_ID_RE.test(id)) return spotifyError('invalid_id', 400, 'Spotify track ids are 22 alphanumeric chars');

  // Fire both Spotify calls in parallel.
  const [trackRes, featuresRes] = await Promise.all([
    spotifyFetch(env, `/tracks/${id}`),
    spotifyFetch(env, `/audio-features/${id}`),
  ]);

  if (!trackRes) {
    return spotifyError(
      'not_configured',
      503,
      'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not set on Pages env',
    );
  }
  if (trackRes.status === 404) return spotifyError('not_found', 404);
  if (!trackRes.ok) return spotifyError('upstream_error', trackRes.status);

  const track = await trackRes.json() as {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string; images: Array<{ url: string; height: number; width: number }> };
    duration_ms: number;
    preview_url: string | null;
    external_urls?: { spotify?: string };
  };

  // Audio features are nice-to-have — if they fail, return the track without.
  let features: {
    tempo?: number;
    key?: number;
    time_signature?: number;
    energy?: number;
    danceability?: number;
  } | null = null;
  if (featuresRes && featuresRes.ok) {
    try {
      features = await featuresRes.json();
    } catch { /* ignore */ }
  }

  const result = {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => ({ name: a.name })),
    album: {
      name: track.album.name,
      image: track.album.images.find((i) => i.height >= 64)?.url ?? track.album.images[0]?.url ?? null,
    },
    durationMs: track.duration_ms,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
    bpm: features?.tempo ? Math.round(features.tempo) : null,
    key: features?.key !== undefined && features.key >= 0 ? KEY_NAMES[features.key] : null,
    timeSignature: features?.time_signature ?? null,
    energy: features?.energy ?? null,
    danceability: features?.danceability ?? null,
  };

  return new Response(JSON.stringify({ ok: true, track: result }), {
    headers: {
      ...SPOTIFY_JSON_HEADERS,
      'Cache-Control': 'public, max-age=300', // metadata is stable
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
