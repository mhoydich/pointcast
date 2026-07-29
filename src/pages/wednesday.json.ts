import type { APIRoute } from 'astro';
import {
  WEDNESDAY_EDITORIAL_CALENDAR,
  WEDNESDAY_ISSUES,
  WEDNESDAY_PUBLICATION,
} from '../lib/wednesday-publication';

const publication = WEDNESDAY_PUBLICATION;

export const GET: APIRoute = () => {
  const payload = {
    $schema: publication.schema,
    id: publication.id,
    title: publication.title,
    description: publication.description,
    human: publication.canonicalUrl,
    json: `https://pointcast.xyz${publication.jsonRoute}`,
    cadence: publication.cadence,
    issues: WEDNESDAY_ISSUES.map((issue) => ({
      ...issue,
      human: `https://pointcast.xyz${issue.route}`,
      json: `https://pointcast.xyz${issue.jsonRoute}`,
      block: `https://pointcast.xyz/b/${issue.blockId}`,
      cover: `https://pointcast.xyz${issue.cover}`,
      playlistVisibility: 'public',
    })),
    editorialCalendar: WEDNESDAY_EDITORIAL_CALENDAR,
    participation: publication.participation,
    publicationBoundary:
      'Calendar entries are editorial briefs, not prewritten or automatically generated issues. An issue is live only after its public playlist, cover, exact sequence, PointCast page, JSON twin, Block, and playback have been checked.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${publication.canonicalUrl}>; rel="alternate"; type="text/html"`,
    },
  });
};
