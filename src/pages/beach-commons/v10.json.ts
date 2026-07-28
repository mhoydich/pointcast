import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V10,
  TIDE_CABINET_CYCLE,
  TIDE_CABINET_ECOLOGY,
  TIDE_CABINET_PLATES,
  TIDE_CABINET_REALITY_PATHS,
  TIDE_CABINET_ROLES,
  TIDE_CABINET_RULES,
  TIDE_CABINET_ZONES,
  TIDE_SCORE_VOICES,
} from '../../lib/beach-commons-v10';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V10,
        plates: TIDE_CABINET_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V10.url).href,
        })),
        zones: TIDE_CABINET_ZONES,
        roles: TIDE_CABINET_ROLES,
        borrowingCycle: TIDE_CABINET_CYCLE,
        currentEcology: TIDE_CABINET_ECOLOGY,
        realityPaths: TIDE_CABINET_REALITY_PATHS,
        operatingRules: TIDE_CABINET_RULES,
        interactiveAudio: {
          title: 'The Shoreline Score',
          availability: 'human HTML edition only',
          engine: 'browser-native Web Audio oscillators and generated noise',
          autoPlay: false,
          samplesOrRecordings: false,
          voices: TIDE_SCORE_VOICES,
        },
        rights: {
          visuals: 'Original images generated for this PointCast field study with OpenAI image generation.',
          audio: 'Original real-time browser synthesis; no samples, recordings, stems, lyrics, or third-party music.',
          wildlifeAffiliation: 'None. No agency, county, research group, or restoration organization endorses this speculative study.',
        },
        methodology: {
          researchCheckedAt: '2026-07-28T07:19:18-07:00',
          currentClaims:
            'Rules and ecology statements were checked against current California State Parks, California Department of Fish and Wildlife, LA County Beaches, NOAA Fisheries, and The Bay Foundation sources.',
          visualStatus:
            'Eight speculative concept plates; images are not photographs of an existing event, installation, monitoring program, habitat project, or restoration site.',
          takeBoundary:
            'Natural objects are observed in place or briefly examined only when lawful and clearly nonliving, then returned exactly. Living, occupied, attached, protected, or culturally sensitive material is never handled.',
          netBoundary:
            'The walking net is a dry-land visual frame, shadow grid, tabletop map, or litter carrier only. It is never used to sweep, drag, seine, trap, entangle, chase, or catch wildlife.',
          restorationBoundary:
            'No shellfish, plants, fish, habitat material, reef modules, cages, cultch, tags, or markers are released or placed. Actual restoration proceeds only through qualified partners and applicable authorizations.',
          eventStatus:
            'No gathering is announced, scheduled, permitted, ticketed, or open for contribution through this edition.',
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
        Link: '<https://pointcast.xyz/beach-commons/v10>; rel="alternate"; type="text/html"',
      },
    },
  );
