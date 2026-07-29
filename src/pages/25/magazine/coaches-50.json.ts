import type { APIRoute } from 'astro';
import {
  COACH_AXIS_LABELS,
  COACHES_50_PLATES,
  COACHES_50_SOURCES,
  COACHES_50_TIERS,
  POINTCAST_COACHES_50,
  POINTCAST_COACHES_FEATURE,
  weightedRoomIndex,
} from '../../../lib/pointcast-coaches-50';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...POINTCAST_COACHES_FEATURE,
        methodology: {
          note: POINTCAST_COACHES_FEATURE.methodology,
          axes: COACH_AXIS_LABELS,
          scoring:
            'Each axis is rated 1–10. The Room Index is the weighted 100-point profile. The numbered rank is an editorial judgment and is not mechanically sorted by the Room Index.',
          updatePolicy:
            'The edition is timestamped and may move when public evidence changes. The permanent Block preserves this release state.',
        },
        tiers: COACHES_50_TIERS,
        ranking: POINTCAST_COACHES_50.map((coach) => ({
          ...coach,
          roomIndex: weightedRoomIndex(coach.scores),
        })),
        visualPlates: COACHES_50_PLATES.map((plate) => ({
          ...plate,
          image: `https://pointcast.xyz${plate.image}`,
          generator: 'OpenAI image generation',
          imaginedScene: true,
          documentaryPhotograph: false,
          depictsRealCoach: false,
          depictsRealCampus: false,
          officialSchoolMarks: false,
        })),
        sources: COACHES_50_SOURCES.map((source) => ({
          ...source,
          accessedAt: '2026-07-29',
        })),
        editorialBoundary: {
          officialRanking: false,
          predictionModel: false,
          employmentEvaluation: false,
          auditedFinancialAnalysis: false,
          playerWelfareGrade: false,
          representsCoachOrSchoolEndorsement: false,
          currentAsOf: POINTCAST_COACHES_FEATURE.asOf,
        },
        discovery: {
          human: POINTCAST_COACHES_FEATURE.canonical,
          machine: POINTCAST_COACHES_FEATURE.machineEdition,
          magazine: POINTCAST_COACHES_FEATURE.magazine,
          block: `https://pointcast.xyz/b/${POINTCAST_COACHES_FEATURE.block}`,
          playlist: POINTCAST_COACHES_FEATURE.playlist.url,
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
