import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V17,
  BOOTH_RECIPE,
  FAIR_AVENUES,
  FAIR_AWARDS,
  FAIR_DAY,
  FAIR_SCORE,
  FAIR_SOURCES,
  POPULARITY_ENGINE,
  PUBLIC_PROOF,
  ROUTE_MOTIVES,
  ROUTE_OPTIONS,
  VISUAL_PLATES,
} from '../../lib/beach-commons-v17';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V17,
        premise:
          'Popularity is treated as a scientific design constraint: a visible phenomenon, a voluntary visitor move, accumulating public evidence, a locally useful question, many kinds of recognition, and an ending worth staying for.',
        popularityEngine: POPULARITY_ENGINE,
        boothProtocol: {
          sentence: 'Every booth proves one thing in public.',
          sequence: BOOTH_RECIPE,
        },
        fairPlan: {
          avenues: FAIR_AVENUES.length,
          experiments: FAIR_AVENUES.reduce((sum, avenue) => sum + avenue.booths.length, 0),
          avenueDetails: FAIR_AVENUES,
        },
        judging: {
          projectScore: FAIR_SCORE,
          totalPoints: FAIR_SCORE.reduce((sum, item) => sum + item.points, 0),
          publicAwards: FAIR_AWARDS,
          distinction:
            'Public recognition does not replace method or evidence, and applause is not treated as scientific data.',
        },
        fairDay: FAIR_DAY,
        routeBuilder: {
          availability: 'human HTML edition only',
          motives: ROUTE_MOTIVES,
          durationsMinutes: [15, 45, 120],
          routes: ROUTE_OPTIONS,
          storage: false,
          analytics: false,
          geolocation: false,
          registration: false,
          networkWrites: false,
          identity: false,
        },
        publicProof: PUBLIC_PROOF,
        visuals: VISUAL_PLATES.map((plate) => ({
          ...plate,
          src: new URL(plate.src, BEACH_COMMONS_V17.url).href,
        })),
        currentSources: FAIR_SOURCES,
        methodology: {
          researchCheckedAt: '2026-07-29T23:45:00-07:00',
          judgingBoundary:
            'The Commons score is an original editorial adaptation informed by current Society for Science guidance; this is not an ISEF-affiliated fair, ISEF scorecard, or pathway to ISEF.',
          exhibitBoundary:
            'Hands-on public exhibit practice informed the five-part booth. No museum or science center endorses this edition.',
          citizenScienceBoundary:
            'GLOBE Observer informed the idea of legible public contribution, teams, and shared results. No GLOBE project, team, data request, or observation campaign is announced.',
          placeBoundary:
            'Any actual organized visit, tables, chairs, vendors, field trip, or activity at an LA County-operated beach must begin with current County requirements. This page is not a permit, plan, or application.',
          activityBoundary:
            'No event, experiment, public data collection, registration, contribution drive, physical setup, habitat interaction, partnership, endorsement, or public program is announced.',
          safetyBoundary:
            'Imagined demonstrations remain low-energy, dry, enclosed, non-toxic, non-invasive, supervised, and on stable surfaces. Water models are small closed freshwater systems. Sand trials use clean brought material in contained trays. Living-coast work is observation only.',
          visuals:
            'Eight original speculative editorial images generated for PointCast with OpenAI image generation. They are not documentary photographs, approved plans, safety diagrams, or wayfinding.',
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
        Link: '<https://pointcast.xyz/beach-commons/v17>; rel="alternate"; type="text/html"',
      },
    },
  );
