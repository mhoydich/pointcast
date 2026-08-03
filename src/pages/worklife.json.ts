import type { APIRoute } from 'astro';
import {
  MANIC_MONDAY,
  WORKLIFE_DESKS,
  WORKLIFE_PUBLICATION,
} from '../lib/worklife-publication';

const publication = WORKLIFE_PUBLICATION;

export const GET: APIRoute = () => {
  const payload = {
    $schema: publication.schema,
    id: publication.id,
    title: publication.title,
    description: publication.description,
    human: publication.canonicalUrl,
    json: `https://pointcast.xyz${publication.jsonRoute}`,
    cadence: publication.cadence,
    desks: WORKLIFE_DESKS,
    issues: [
      {
        ...MANIC_MONDAY,
        human: MANIC_MONDAY.canonicalUrl,
        json: `https://pointcast.xyz${MANIC_MONDAY.jsonRoute}`,
        cover: `https://pointcast.xyz${MANIC_MONDAY.cover}`,
        block: `https://pointcast.xyz/b/${MANIC_MONDAY.blockId}`,
        playlistVisibility: 'public',
      },
    ],
    participation: publication.participation,
    publicationBoundary:
      'WORK/LIFE is broader than a weekday playlist. Monday is Issue 001 and the opener; future issues may use reporting, essays, reviews, diaries, tools, interviews, or other editorial forms.',
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
