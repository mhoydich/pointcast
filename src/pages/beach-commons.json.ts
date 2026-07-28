import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_EDITIONS,
  BEACH_COMMONS_PATHS,
  BEACH_COMMONS_SERIES,
  beachCommonsEditionUrl,
} from '../lib/beach-commons-series';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_SERIES,
        paths: BEACH_COMMONS_PATHS.map((path) => ({
          ...path,
          editions: BEACH_COMMONS_EDITIONS.filter(
            (edition) => edition.path === path.id,
          ).map((edition) => edition.edition),
        })),
        editions: BEACH_COMMONS_EDITIONS.map((edition) => ({
          ...edition,
          url: beachCommonsEditionUrl(edition),
          jsonUrl: `${beachCommonsEditionUrl(edition)}.json`,
          blockUrl: `https://pointcast.xyz/b/${edition.blockId}`,
          image: new URL(edition.image, BEACH_COMMONS_SERIES.url).href,
        })),
        localInstrument: {
          name: 'Choose a path',
          purpose:
            'Filters the thirteen edition cards by editorial path and can select a random edition.',
          storage: false,
          network: false,
          analytics: false,
          writes: false,
        },
        rights: {
          editorial:
            'Original PointCast editorial and interface by Michael Hoydich with Codex / OpenAI.',
          generatedImages:
            'Original AI-generated concept images credited per edition; product photography in V8 retains its source credits and review-use boundaries.',
          physicalStatus: BEACH_COMMONS_SERIES.status,
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
        Link: '<https://pointcast.xyz/beach-commons>; rel="alternate"; type="text/html"',
      },
    },
  );
