import type { APIRoute } from 'astro';
import {
  BOOK_CHAPTERS,
  BOOK_CREDITS,
  BOOK_META,
  BOOK_SOURCES,
  MIDJOURNEY_SPACERS,
} from '../lib/digital-pets-book';

const base = 'https://pointcast.xyz';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        schema: 'pointcast.future-book/v1',
        id: 'digital-pets-001',
        ...BOOK_META,
        url: `${base}${BOOK_META.route}`,
        jsonUrl: `${base}${BOOK_META.jsonRoute}`,
        thesis:
          'In a world where AI can generate anything, origination, voice, and curation still command attention.',
        editorialCompass: 'What should a person own in an AI world?',
        disclosure:
          'Michael Hoydich originated and locked the twelve positions. Codex / OpenAI developed this first-edition manuscript, research ledger, visual system, and PointCast implementation. This is a transparent collaboration, not an undisclosed imitation of Michael’s reviewed prose voice.',
        creators: BOOK_CREDITS,
        chapters: BOOK_CHAPTERS.map((chapter) => ({
          ...chapter,
          url: `${base}${BOOK_META.route}#${chapter.slug}`,
          plate: chapter.plate
            ? {
                ...chapter.plate,
                src: new URL(chapter.plate.src, base).href,
              }
            : undefined,
          sources: chapter.sources.map((sourceId) => {
            const source = BOOK_SOURCES.find((candidate) => candidate.id === sourceId);
            return source
              ? {
                  id: source.id,
                  label: source.label,
                  publisher: source.publisher,
                  url: source.url,
                }
              : { id: sourceId };
          }),
        })),
        visualSystem: {
          generatedPlates: [
            `${base}/images/digital-pets/plate-01-cover.webp`,
            ...BOOK_CHAPTERS.flatMap((chapter) =>
              chapter.plate ? [new URL(chapter.plate.src, base).href] : [],
            ),
          ],
          generatedWith: 'OpenAI image generation',
          interstitials: MIDJOURNEY_SPACERS.map((spacer) => ({
            ...spacer,
            src: new URL(spacer.src, base).href,
            generatedWith: 'Midjourney',
            directionAndCuration: 'Michael Hoydich',
          })),
        },
        research: {
          accessedAt: '2026-07-27',
          sources: BOOK_SOURCES,
          note: 'Commercial specifications and service terms use manufacturer sources; law uses regulator text; cultural and moral claims use original scholarship.',
        },
        companions: {
          block: `${base}/b/${BOOK_META.blockId}`,
          pointcastPets: `${base}/pets`,
          localPet: `${base}/pet`,
          sourceLedger: `${base}${BOOK_META.route}#sources`,
          credits: `${base}${BOOK_META.route}#credits`,
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: `<${base}${BOOK_META.route}>; rel="alternate"; type="text/html"`,
      },
    },
  );
