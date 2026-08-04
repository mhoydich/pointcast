import type { APIRoute } from 'astro';
import {
  OPEN_TO_WORK_BOARD,
  UNIFORMS_POST,
  WORKLIFE_PUBLICATION,
} from '../../lib/worklife-publication';

export const GET: APIRoute = () => {
  const board = OPEN_TO_WORK_BOARD;
  const payload = {
    $schema: board.schema,
    id: board.id,
    title: board.displayTitle,
    description: board.description,
    human: board.canonicalUrl,
    json: `https://pointcast.xyz${board.jsonRoute}`,
    datePublished: board.publishedAt,
    isPartOf: {
      title: WORKLIFE_PUBLICATION.title,
      human: WORKLIFE_PUBLICATION.canonicalUrl,
      json: `https://pointcast.xyz${WORKLIFE_PUBLICATION.jsonRoute}`,
    },
    status: {
      phase: 'founding-round',
      publicCards: board.privacy.publicCards,
      publicPeopleIndexed: 0,
      publicJobsIndexed: 0,
    },
    origin: board.origin,
    fields: board.fields,
    localDraftContract: {
      storageKey: 'pointcast.worklife.open-to-work.v1',
      maximumLocalCards: 24,
      ...board.privacy,
      userControlledActions: ['add to this device', 'copy card JSON', 'remove local card', 'clear local board'],
      pitchIsSeparateAction: true,
    },
    publicBoardContract: {
      optInRequired: true,
      humanReviewRequired: true,
      copyingIsNotPublication: true,
      submittingIsNotGuaranteedPublication: true,
      ranking: false,
      voting: false,
      contactImport: false,
      automaticCrawling: false,
    },
    companion: {
      title: UNIFORMS_POST.displayTitle,
      human: UNIFORMS_POST.canonicalUrl,
      json: `https://pointcast.xyz${UNIFORMS_POST.jsonRoute}`,
    },
    block: `https://pointcast.xyz/b/${board.blockId}`,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${board.canonicalUrl}>; rel="alternate"; type="text/html"`,
    },
  });
};
