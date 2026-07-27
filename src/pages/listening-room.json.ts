/**
 * /listening-room.json — machine-readable capability manifest for the
 * PointCast Listening Room companion.
 *
 * Truthful declarations: input contract, privacy/storage, provider boundary,
 * room semantics, receipt schema/version, interaction vocabulary, degradation
 * behavior, and default playlist. Does not echo arbitrary query data.
 */
import type { APIRoute } from 'astro';

const manifest = {
  $schema: 'pointcast-listening-room/v1',
  name: 'PointCast Listening Room',
  description:
    'Drop a Spotify playlist into the room. Annotate the sequence. Share the receipt. Built for people who make playlists and argue lovingly about track 4.',
  human: 'https://pointcast.xyz/listening-room',
  generatedAt: new Date().toISOString(),

  input: {
    acceptedFormats: [
      'https://open.spotify.com/playlist/{id}',
      'https://open.spotify.com/intl-xx/playlist/{id}',
      'spotify:playlist:{id}',
    ],
    rejectedFormats: [
      'track URLs (use /b/* LISTEN blocks)',
      'album URLs',
      'artist URLs',
      'non-Spotify URLs',
    ],
    queryParameter: 'pl',
    queryParameterExample: '/listening-room?pl=35WC68tu9rrBoRrW3N2n0M',
    trackingParametersStripped: ['si', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'nd'],
  },

  privacy: {
    notesStorage: 'browser-local (localStorage)',
    notesSentToServer: false,
    notesSentToAI: false,
    receiptContainsLocalData: true,
    receiptSchemaVersion: 'pointcast-playlist-receipt/v1',
    serverSideNotePersistence: false,
  },

  provider: {
    name: 'Spotify',
    playbackMethod: 'official Spotify Embed/iFrame API',
    proxyOrRestream: false,
    attributionRequired: true,
    openInSpotifyAlwaysVisible: true,
    metadataEndpoint: '/api/spotify-playlist?id={playlist_id}',
    metadataIsEnhancement: true,
    metadataIsPrecondition: false,
    playlistItemsAccess:
      'Spotify limits full playlist contents to owned or collaborative playlists; public metadata may be playlist-only.',
    sequenceFallback:
      'The room discovers heard tracks from official iframe playingURI events and resolves bounded track metadata.',
    artworkPolicy: 'displayed unmodified and unobscured; never used as decorative background',
  },

  room: {
    keyFormat: '/listening-room/playlist/{spotifyPlaylistId}',
    defaultKey: '/listening-room/playlist/35WC68tu9rrBoRrW3N2n0M',
    differentPlaylistsDifferentRooms: true,
    presenceInfrastructure: 'existing per-URL CursorRoom + /api/room WebSocket',
    sharedByDefault: true,
  },

  interactions: {
    gestures: ['keep this', 'hinge', 'lift', 'closer', 'rewind'],
    gestureDelivery: 'posts to existing room chat event bus (pc:room:chat)',
    notesPrompts: [
      'What promise does the opener make?',
      'Where does the room change temperature?',
      'Which transition earns its surprise?',
      'What is the hidden hinge?',
      'Does the closer resolve, release, or reopen?',
    ],
    receiptFormats: ['JSON', 'Markdown'],
    activityStrip: 'derived from existing pc:room:log-update event',
  },

  degradation: {
    withoutJavaScript: 'default playlist embed renders with provider link',
    withoutMetadataCredentials:
      'embed, progressive heard-track sequence, notes, room, sharing, and receipt remain usable',
    withoutPresenceWorker: 'gestures remain private marked moments; shared activity is unavailable',
    withoutSpotifyAccount: 'Spotify may ask the visitor to sign in; PointCast notes and receipts remain usable',
  },

  defaultPlaylist: {
    id: '35WC68tu9rrBoRrW3N2n0M',
    embedUrl: 'https://open.spotify.com/embed/playlist/35WC68tu9rrBoRrW3N2n0M',
    openUrl: 'https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M',
    description: 'The PointCast house mix — the welcoming default for the listening room.',
  },

  related: {
    pointcast: 'https://pointcast.xyz/',
    sourceBlock: 'https://pointcast.xyz/b/0339',
    manifestJson: 'https://pointcast.xyz/listening-room.json',
    metadataApi: 'https://pointcast.xyz/api/spotify-playlist',
  },

  archiveBlock: {
    id: '0339',
    url: 'https://pointcast.xyz/b/0339',
  },
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
