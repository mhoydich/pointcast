import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V3,
  BEACH_COMMONS_V3_PLATES,
} from '../../lib/beach-commons-v3';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V3,
        plates: BEACH_COMMONS_V3_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V3.url).href,
        })),
        related: [
          {
            title: 'Beach Commons V2 — Superstructures + Living Games',
            url: BEACH_COMMONS_V3.previousEdition.url,
            relation: 'previous field-study edition',
          },
          {
            title: 'The Maximum Beach — PointCast Reviews',
            url: BEACH_COMMONS_V3.reviewUrl,
            relation: 'companion unofficial magazine feature',
          },
          {
            title: 'Dockweiler Beach Fire Pits',
            url: 'https://beaches.lacounty.gov/dockweiler-beach-fire-pits/',
            relation: 'official designated-fire context',
          },
          {
            title: 'LA County Living Shorelines',
            url: 'https://beaches.lacounty.gov/coastal-resilience/living-shorelines/',
            relation: 'dune and coastal-habitat context',
          },
          {
            title: 'LA County Beach Rules',
            url: 'https://beaches.lacounty.gov/la-county-beach-rules-faq/',
            relation: 'current public-use rules and fire-pit boundary',
          },
        ],
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: '<https://pointcast.xyz/beach-commons/v3>; rel="alternate"; type="text/html"',
      },
    },
  );
