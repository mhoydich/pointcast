import type { APIRoute } from 'astro';
import {
  MANIC_MONDAY,
  MANIC_MONDAY_MOVEMENTS,
  MANIC_MONDAY_TRACKS,
  WORKLIFE_PUBLICATION,
} from '../../lib/worklife-publication';

const issue = MANIC_MONDAY;

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
      title: WORKLIFE_PUBLICATION.title,
      human: WORKLIFE_PUBLICATION.canonicalUrl,
      json: `https://pointcast.xyz${WORKLIFE_PUBLICATION.jsonRoute}`,
      description: WORKLIFE_PUBLICATION.description,
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
        design: 'Original PointCast vector timecard, clock, and schedule composition',
      },
    },
    spotify: {
      playlistId: issue.spotifyPlaylistId,
      url: issue.spotifyUrl,
      embedUrl: `https://open.spotify.com/embed/playlist/${issue.spotifyPlaylistId}`,
      playlistVisibility: 'public',
      playbackBoundary:
        'Spotify supplies playback through its official player. PointCast does not proxy or restream audio.',
    },
    sequence: {
      trackCount: issue.trackCount,
      duration: issue.duration,
      durationMinutes: issue.durationMinutes,
      movements: MANIC_MONDAY_MOVEMENTS.map((movement) => ({
        ...movement,
        tracks: MANIC_MONDAY_TRACKS.filter((track) => track.movement === movement.id),
      })),
      tracks: MANIC_MONDAY_TRACKS,
    },
    interaction: {
      localOnly: true,
      storage: false,
      analytics: false,
      networkWrites: false,
      note: 'The working-day selector changes only the text and progress bar in the current browser page.',
    },
    participation: issue.participation,
    provenance: {
      author: issue.author,
      source: issue.source,
      editorialBoundary:
        'PointCast selected the prompt, verified the public playlist, removed a duplicate opener, and authored the movement and track notes around the resulting Spotify order.',
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
