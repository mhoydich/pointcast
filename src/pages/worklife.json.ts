import type { APIRoute } from 'astro';
import {
  MANIC_MONDAY,
  OPEN_TO_WORK_BOARD,
  UNIFORMS_POST,
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
    latest: {
      ...UNIFORMS_POST,
      human: UNIFORMS_POST.canonicalUrl,
      json: `https://pointcast.xyz${UNIFORMS_POST.jsonRoute}`,
      cover: `https://pointcast.xyz${UNIFORMS_POST.cover}`,
      block: `https://pointcast.xyz/b/${UNIFORMS_POST.blockId}`,
    },
    posts: [
      {
        ...UNIFORMS_POST,
        human: UNIFORMS_POST.canonicalUrl,
        json: `https://pointcast.xyz${UNIFORMS_POST.jsonRoute}`,
        cover: `https://pointcast.xyz${UNIFORMS_POST.cover}`,
        block: `https://pointcast.xyz/b/${UNIFORMS_POST.blockId}`,
      },
    ],
    boards: [
      {
        ...OPEN_TO_WORK_BOARD,
        human: OPEN_TO_WORK_BOARD.canonicalUrl,
        json: `https://pointcast.xyz${OPEN_TO_WORK_BOARD.jsonRoute}`,
        block: `https://pointcast.xyz/b/${OPEN_TO_WORK_BOARD.blockId}`,
      },
    ],
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
      'WORK/LIFE is broader than a weekday playlist. Monday remains Issue 001 and the opener; Uniforms is the first standalone post, and OPEN TO WORK is the first consent-first utility board.',
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
