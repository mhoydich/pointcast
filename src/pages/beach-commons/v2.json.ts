import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V2,
  BEACH_COMMONS_V2_PLATES,
} from '../../lib/beach-commons-v2';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V2,
        plates: BEACH_COMMONS_V2_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V2.url).href,
        })),
        related: [
          {
            title: 'Beach Commons V1 — Hardpoint + Softkit',
            url: BEACH_COMMONS_V2.previousEdition.url,
            relation: 'previous field-study edition',
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
        Link: '<https://pointcast.xyz/beach-commons/v2>; rel="alternate"; type="text/html"',
      },
    },
  );
