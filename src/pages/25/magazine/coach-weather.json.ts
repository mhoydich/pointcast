import type { APIRoute } from 'astro';
import {
  COACH_AXIS_LABELS,
  POINTCAST_COACHES_50,
} from '../../../lib/pointcast-coaches-50';
import {
  COACH_WEATHER_BANDS,
  COACH_WEATHER_CADENCE,
  COACH_WEATHER_FEATURE,
  COACH_WEATHER_FRONTS,
  PROGRAM_BUILD_DEFAULT,
  normalizeProgramShape,
} from '../../../lib/pointcast-coach-weather';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...COACH_WEATHER_FEATURE,
        baseline: {
          note: COACH_WEATHER_FEATURE.baseline,
          movementCount: 0,
          currentAsOf: COACH_WEATHER_FEATURE.asOf,
          firstMovementEligibleAfter: 'Each coach has played a 2026 game.',
        },
        cadence: COACH_WEATHER_CADENCE,
        bands: COACH_WEATHER_BANDS.map((band) => ({
          ...band,
          fronts: COACH_WEATHER_FRONTS.filter(
            (front) => front.band === band.id,
          ).map((front) => ({
            order: front.order,
            band: front.band,
            pressure: front.pressure,
            movement: front.movement,
            exactRoom: front.exactRoom,
            headline: front.headline,
            forecast: front.forecast,
            trigger: front.trigger,
            coach: {
              rank: front.coach.rank,
              name: front.coach.coach,
              school: front.coach.school,
              conference: front.coach.conference,
              region: front.coach.region,
              signal: front.coach.signal,
            },
          })),
        })),
        roomOfTheWeek: {
          coach: 'Kyle Whittingham',
          school: 'Michigan',
          exactRoom: 'program',
          question:
            'Can a two-decade operating system become ordinary behavior inside a different institution before the first rivalry test?',
          sourceRanking: `${COACH_WEATHER_FEATURE.rankingBase}#coach-10`,
        },
        matcher: {
          title: 'Build Your Program',
          unit: '100 editorial points',
          axes: COACH_AXIS_LABELS,
          defaultBuild: PROGRAM_BUILD_DEFAULT,
          candidates: POINTCAST_COACHES_50.map((coach) => ({
            rank: coach.rank,
            coach: coach.coach,
            school: coach.school,
            conference: coach.conference,
            region: coach.region,
            signal: coach.signal,
            shape: normalizeProgramShape(coach.scores),
          })),
          method:
            'The visitor allocates 100 points across seven rooms. PointCast normalizes each published coach scorecard into a seven-axis shape, compares absolute distance, and returns the closest of 50 editorial profiles.',
          storage: 'No build is transmitted or stored by PointCast.',
          boundary: COACH_WEATHER_FEATURE.matcherBoundary,
        },
        editorialBoundary: {
          note: COACH_WEATHER_FEATURE.boundary,
          official: false,
          hotSeatReport: false,
          rumorMarket: false,
          employmentEvaluation: false,
          predictionModel: false,
          currentAsOf: COACH_WEATHER_FEATURE.asOf,
        },
        discovery: {
          human: COACH_WEATHER_FEATURE.canonical,
          machine: COACH_WEATHER_FEATURE.machineEdition,
          block: `https://pointcast.xyz/b/${COACH_WEATHER_FEATURE.block}`,
          ranking: COACH_WEATHER_FEATURE.rankingBase,
          seasonLedger: 'https://pointcast.xyz/25/season',
          magazine: 'https://pointcast.xyz/25/magazine',
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
      },
    },
  );
