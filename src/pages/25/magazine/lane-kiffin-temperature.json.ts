import type { APIRoute } from 'astro';
import {
  LANE_KIFFIN_FINEBAUM_CLOSE,
  LANE_KIFFIN_FOE_BOARD,
  LANE_KIFFIN_ROSTER_BOARD,
  LANE_KIFFIN_SOURCES,
  LANE_KIFFIN_TEMPERATURE_FEATURE,
  LANE_KIFFIN_TEMPERATURE_READINGS,
  LANE_KIFFIN_TIMELINE,
} from '../../../lib/pointcast-lane-kiffin-temperature';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...LANE_KIFFIN_TEMPERATURE_FEATURE,
        method: {
          unit: 'PointCast narrative pressure signal from 0 to 100',
          meaning:
            'Attention, expectation, change, and unresolved public meaning around each room.',
          doesNotMean: [
            'win probability',
            'player sentiment',
            'employment risk',
            'betting recommendation',
            'poll position',
            'audited financial rating',
          ],
          currentState: 'Preseason baseline; LSU has played zero 2026 games.',
        },
        readings: LANE_KIFFIN_TEMPERATURE_READINGS,
        timeline: LANE_KIFFIN_TIMELINE,
        rosterBoard: LANE_KIFFIN_ROSTER_BOARD,
        foeBoard: LANE_KIFFIN_FOE_BOARD,
        finebaumClose: LANE_KIFFIN_FINEBAUM_CLOSE,
        sources: LANE_KIFFIN_SOURCES,
        editorialBoundary: {
          official: false,
          prediction: false,
          hotSeatReport: false,
          playerSentimentMeasure: false,
          employmentEvaluation: false,
          auditedFinancialAnalysis: false,
          finebaumCloseIsQuotation: false,
          finebaumCloseIsPointCastSynthesis: true,
          note: LANE_KIFFIN_TEMPERATURE_FEATURE.boundary,
          finebaumNote:
            LANE_KIFFIN_TEMPERATURE_FEATURE.finebaumBoundary,
        },
        discovery: {
          human: LANE_KIFFIN_TEMPERATURE_FEATURE.canonical,
          machine: LANE_KIFFIN_TEMPERATURE_FEATURE.machineEdition,
          block: `https://pointcast.xyz/b/${LANE_KIFFIN_TEMPERATURE_FEATURE.block}`,
          coachRanking:
            'https://pointcast.xyz/25/magazine/coaches-50#coach-9',
          coachWeather: 'https://pointcast.xyz/25/magazine/coach-weather',
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
