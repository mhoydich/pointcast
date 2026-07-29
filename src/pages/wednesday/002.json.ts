import type { APIRoute } from 'astro';
import {
  GOOD_WORK,
  GOOD_WORK_MOVEMENTS,
  GOOD_WORK_TRACKS,
  WEDNESDAY_PUBLICATION,
} from '../../lib/wednesday-publication';

const issue = GOOD_WORK;

export const GET: APIRoute = () => {
  const payload = {
    $schema: issue.schema,
    id: issue.id,
    issueNumber: issue.issueNumber,
    title: issue.displayTitle,
    description: issue.description,
    editorialNote: issue.editorialNote,
    human: issue.canonicalUrl,
    json: `https://pointcast.xyz${issue.jsonRoute}`,
    publishedAt: issue.publishedAt,
    isPartOf: {
      title: WEDNESDAY_PUBLICATION.title,
      human: WEDNESDAY_PUBLICATION.canonicalUrl,
      json: `https://pointcast.xyz${WEDNESDAY_PUBLICATION.jsonRoute}`,
      cadence: WEDNESDAY_PUBLICATION.cadence,
    },
    block: `https://pointcast.xyz/b/${issue.blockId}`,
    cover: {
      src: `https://pointcast.xyz${issue.cover}`,
      alt: issue.coverAlt,
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
      playlistId: issue.spotifyPlaylistId,
      url: issue.spotifyUrl,
      embedUrl: `https://open.spotify.com/embed/playlist/${issue.spotifyPlaylistId}`,
      listeningRoom: `https://pointcast.xyz${issue.listeningRoomUrl}`,
      playlistVisibility: 'public',
      playbackBoundary:
        'Spotify supplies playback through its official player. PointCast does not proxy or restream audio.',
    },
    sequence: {
      trackCount: issue.trackCount,
      duration: issue.duration,
      durationMinutes: issue.durationMinutes,
      movements: GOOD_WORK_MOVEMENTS.map((movement) => ({
        ...movement,
        tracks: GOOD_WORK_TRACKS.filter((track) => track.movement === movement.id),
      })),
      tracks: GOOD_WORK_TRACKS,
    },
    participation: issue.participation,
    provenance: {
      author: issue.author,
      source: issue.source,
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
      Link: `<${issue.canonicalUrl}>; rel="alternate"; type="text/html"`,
    },
  });
};
