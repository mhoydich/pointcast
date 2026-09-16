import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V19,
  BEACH_SEATS,
  POCKET_SEATS,
  POCKET_SEATS_INTRO,
  POCKET_SEATS_SHORTLIST,
  POCKET_SEAT_TESTS,
  ROOM_LAYOUTS,
} from '../../lib/beach-commons-v19';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V19,
        beachSeats: BEACH_SEATS,
        pocketSeats: {
          title: 'Pocket Seats',
          introduction: POCKET_SEATS_INTRO,
          filters: [
            { id: 'perch', label: 'Quick perch' },
            { id: 'backrest', label: 'Compact backrest' },
            { id: 'lounge', label: 'Car-camp lounge' },
          ],
          picks: POCKET_SEATS,
          firstToTryForPickleball: POCKET_SEATS_SHORTLIST,
          suggestedFieldTests: POCKET_SEAT_TESTS,
        },
        shopping: { pocketUrl: '/beach-commons/v19#shopping-pocket', profileUrl: '/me#shopping-pocket', savedItems: 'browser-local, not account-synced', checkout: 'external merchant', attribution: 'anonymous outbound clicks only', confirmedSales: null, commission: null, reportUrl: '/api/shopping-metrics' },
        roomLayouts: ROOM_LAYOUTS,
        methodology: {
          researchCheckedAt: BEACH_COMMONS_V19.priceCheckedAt,
          status: BEACH_COMMONS_V19.testingBoundary,
          productSources:
            'Each pick links to the maker or retailer page used for price and specifications. Additional sourceUrls identify the Helinox handling guide and Campman’s NEMO packed-weight figure. Unverified or conflicting figures remain explicitly marked.',
          weights:
            'Packed, product, minimum and unspecified listed weights are not interchangeable. Each weight states its source basis; the NEMO entry separates minimum weight from the retailer’s packed figure.',
          capacity:
            'All capacity values are maker claims or ratings. No independent load test is implied. Unknown values are marked Not verified.',
          availability:
            'Availability is a dated, variant-dependent snapshot. Unclear or sold-out offers are identified in the relevant caveat. No stock guarantee is made.',
          suggestedFieldTests:
            'The five Pocket Seats tests are a proposed evaluation method, not tests conducted for this edition.',
          links: BEACH_COMMONS_V19.linkBoundary,
          eventStatus: BEACH_COMMONS_V19.fieldBoundary,
        },
        rights: {
          illustration: BEACH_COMMONS_V19.illustrationBoundary,
          productMarks: 'Product and maker names belong to their respective owners.',
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
        Link: '<https://pointcast.xyz/beach-commons/v19>; rel="alternate"; type="text/html"',
      },
    },
  );
