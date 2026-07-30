import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V16,
  COMPANIONS,
  FIRST_SEASON,
  OYSTER_SOURCES,
  OYSTER_STATS,
  PINTEREST_BOARDS,
  RADIUS_RESOURCES,
  SCOREBOARDS,
} from '../../lib/beach-commons-v16';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V16,
        verdict: {
          civic: 'A clear success: a durable school, restaurant, science, volunteer, and harbor-literacy loop.',
          ecological:
            'A real local restoration achievement with survival, growth, habitat, and improved methods; natural recruitment remains uneven and intervention is still required.',
          numerical:
            'The public headline count is approximately 150 million restored oysters. Reaching one billion by 2035 would require a much faster annual pace.',
          waterQualityBoundary:
            'Oyster reefs can provide meaningful habitat and filtration benefits, but wastewater treatment, stormwater systems, overflow control, regulation, and monitoring remain central to harbor water quality.',
        },
        reportedMeasures: OYSTER_STATS,
        twoScoreboards: SCOREBOARDS,
        elSegundoRadiusDesk: {
          origin: 'El Segundo, California',
          bands: ['0–5 miles', '5–12 miles', '12–25 miles'],
          precision:
            'Broad editorial orientation bands, not geocoded travel distances. Confirm current access, programs, requirements, and conditions with each organization.',
          resources: RADIUS_RESOURCES,
        },
        firstSeason: {
          status: 'editorial rehearsal only; no event or program is announced',
          principles: [
            'observation before intervention',
            'existing organizations before a new institution',
            'authorized work only',
            'two independent scoreboards',
            'a public receipt of claims, unknowns, and boundaries',
          ],
          steps: FIRST_SEASON,
        },
        companions: COMPANIONS,
        visualCompanions: PINTEREST_BOARDS,
        currentSources: OYSTER_SOURCES,
        localInstrument: {
          title: 'El Segundo 25-mile desk',
          availability: 'human HTML edition only',
          storage: false,
          analytics: false,
          networkWrites: false,
          geolocation: false,
          registration: false,
          inputs: ['broad distance band', 'type of useful work'],
          actions: ['filter current resource cards', 'open an independent organization’s current page'],
        },
        methodology: {
          researchCheckedAt: '2026-07-29T15:30:00-07:00',
          countBoundary:
            'Billion Oyster Project pages may display figures from different update cycles. This edition uses the current homepage headline count and identifies study-specific measures in context.',
          placeBoundary:
            'The New York and Southern California coasts have different species, substrates, exposures, histories, and regulatory conditions. The proposed transfer is institutional method, not oyster habitat.',
          affiliation:
            'No organization, agency, school, aquarium, nonprofit, public owner, scientist, restaurant, or publication named or linked endorses PointCast or Beach Commons.',
          activityBoundary:
            'No collection, planting, monitoring protocol, habitat intervention, event, volunteer shift, restoration project, partnership, permit, contribution drive, municipal affiliation, or public program is announced.',
          visuals:
            'Three original editorial illustrations generated for PointCast with OpenAI image generation; they are not documentary photographs or maps for navigation.',
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
        Link: '<https://pointcast.xyz/beach-commons/v16>; rel="alternate"; type="text/html"',
      },
    },
  );
