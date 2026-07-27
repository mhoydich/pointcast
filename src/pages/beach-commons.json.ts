import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS,
  BEACH_COMMONS_PROTOTYPES,
} from '../lib/beach-commons';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS,
        prototypes: BEACH_COMMONS_PROTOTYPES.map((prototype) => ({
          ...prototype,
          image: new URL(prototype.image, BEACH_COMMONS.url).href,
        })),
        related: [
          {
            title: 'Beach Commons V2 — Superstructures + Living Games',
            url: 'https://pointcast.xyz/beach-commons/v2',
            relation: 'next field-study edition',
          },
          {
            title: 'Dockweiler State Beach',
            url: 'https://beaches.lacounty.gov/dockweiler-beach/',
            relation: 'place context and public facilities',
          },
          {
            title: 'LA County Living Shorelines',
            url: 'https://beaches.lacounty.gov/coastal-resilience/living-shorelines/',
            relation: 'current dune and coastal-resilience context',
          },
          {
            title: 'California Coastal Commission',
            url: 'https://coastal.ca.gov/whoweare.html',
            relation: 'coastal development and public-access context',
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
        Link: '<https://pointcast.xyz/beach-commons>; rel="alternate"; type="text/html"',
      },
    },
  );
