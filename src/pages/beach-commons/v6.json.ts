import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V6,
  FIRE_RING_MODULES,
  FIRE_RING_PLATES,
} from '../../lib/beach-commons-v6';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V6,
        modules: FIRE_RING_MODULES,
        plates: FIRE_RING_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V6.url).href,
        })),
        officialContext: [
          {
            title: 'Dockweiler Beach Fire Pits',
            url: 'https://beaches.lacounty.gov/dockweiler-beach-fire-pits/',
            note: 'Current official location, availability, and ring-use rules.',
          },
          {
            title: 'LA County Special Event Permit',
            url: 'https://beaches.lacounty.gov/special-event-permit/',
            note: 'Current clearance requirement for organized groups and posted application timing.',
          },
        ],
        related: [
          {
            title: BEACH_COMMONS_V6.previousEdition.title,
            url: BEACH_COMMONS_V6.previousEdition.url,
            relation: 'previous field-study edition',
          },
          {
            title: 'PointCast Block 0516',
            url: BEACH_COMMONS_V6.blockUrl,
            relation: 'permanent feed record',
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
        Link: '<https://pointcast.xyz/beach-commons/v6>; rel="alternate"; type="text/html"',
      },
    },
  );
