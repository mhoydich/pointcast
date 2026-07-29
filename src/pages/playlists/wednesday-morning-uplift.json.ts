import type { APIRoute } from 'astro';
import {
  WEDNESDAY_MORNING_UPLIFT,
  UPLIFT_MOVEMENTS,
  UPLIFT_TRACKS,
} from '../../lib/wednesday-morning-uplift';

const playlist = WEDNESDAY_MORNING_UPLIFT;

export const GET: APIRoute = () => {
  const payload = {
    $schema: playlist.schema,
    id: playlist.id,
    title: playlist.title,
    edition: playlist.edition,
    description: playlist.description,
    editorialNote: playlist.editorialNote,
    human: playlist.canonicalUrl,
    json: `https://pointcast.xyz${playlist.jsonRoute}`,
    visualBoard: {
      human: 'https://pointcast.xyz/wednesday/001/board',
      json: 'https://pointcast.xyz/wednesday/001/board.json',
    },
    publishedAt: playlist.publishedAt,
    block: `https://pointcast.xyz/b/${playlist.blockId}`,
    cover: {
      src: `https://pointcast.xyz${playlist.cover}`,
      alt: playlist.coverAlt,
      width: 1536,
      height: 1536,
      format: 'image/png',
      credits: {
        direction: 'Michael Hoydich directive translated by Codex / OpenAI',
        generation: 'OpenAI image generation',
        workflow: 'PointCast poster-image-engine',
      },
    },
    spotify: {
      playlistId: playlist.spotifyPlaylistId,
      url: playlist.spotifyUrl,
      embedUrl: `https://open.spotify.com/embed/playlist/${playlist.spotifyPlaylistId}`,
      listeningRoom: `https://pointcast.xyz${playlist.listeningRoomUrl}`,
      playbackBoundary: 'Spotify supplies playback through its official player. PointCast does not proxy or restream audio.',
      playlistVisibility: 'public',
    },
    sequence: {
      trackCount: playlist.trackCount,
      duration: playlist.duration,
      movements: UPLIFT_MOVEMENTS.map((movement) => ({
        ...movement,
        tracks: UPLIFT_TRACKS.filter((track) => track.movement === movement.id),
      })),
      tracks: UPLIFT_TRACKS,
    },
    participation: playlist.participation,
    provenance: {
      author: playlist.author,
      source: playlist.source,
      editorialBoundary:
        'PointCast selected and sequenced the playlist. Artist names, recording titles, album titles, playback, and provider metadata remain the property and responsibility of their respective rights holders and Spotify.',
      endorsementBoundary:
        'This is independent PointCast editorial curation. No artist, label, publisher, estate, or Spotify endorsement is claimed.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${playlist.canonicalUrl}>; rel="alternate"; type="text/html"`,
    },
  });
};
