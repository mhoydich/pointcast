import type { APIRoute } from 'astro';
import {
  CALIFORNIA_ATTENDANCE_2025,
  CALIFORNIA_CIRCUIT_2026,
  CALIFORNIA_CONFERENCE_MAP,
  CALIFORNIA_FOOTBALL_COMPACT,
  CALIFORNIA_FOOTBALL_FEATURE,
  CALIFORNIA_FOOTBALL_SOURCES,
  CALIFORNIA_PROGRAM_PULSE,
} from '../../../lib/pointcast-california-football';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...CALIFORNIA_FOOTBALL_FEATURE,
        counts: {
          fbsPrograms: CALIFORNIA_PROGRAM_PULSE.length,
          conferences: CALIFORNIA_CONFERENCE_MAP.length,
          attendancePrograms: CALIFORNIA_ATTENDANCE_2025.length,
          inStateCircuitGames: CALIFORNIA_CIRCUIT_2026.length,
          compactPromises: CALIFORNIA_FOOTBALL_COMPACT.length,
          sources: CALIFORNIA_FOOTBALL_SOURCES.length,
        },
        conferenceMap: CALIFORNIA_CONFERENCE_MAP,
        programPulse: CALIFORNIA_PROGRAM_PULSE,
        attendance2025: {
          unit: 'average home attendance',
          sourceId: 'ncaa-attendance',
          programs: CALIFORNIA_ATTENDANCE_2025,
        },
        participation2024_25: {
          boysElevenPlayer: 91411,
          boysElevenPlayerYearOverYear: '+1.9%',
          girlsFlag: 19921,
          girlsFlagYearOverYear: '+84%',
          sourceId: 'cif-participation',
        },
        circuit2026: CALIFORNIA_CIRCUIT_2026,
        pointcastProposal: {
          adopted: false,
          name: 'The California Football Compact',
          items: CALIFORNIA_FOOTBALL_COMPACT,
        },
        sources: CALIFORNIA_FOOTBALL_SOURCES,
        editorialBoundary: {
          official: false,
          adoptedPolicy: false,
          prediction: false,
          ranking: false,
          attendanceSource: 'NCAA 2025 football attendance report',
          participationSource: 'Reporting on the 2024–25 CIF participation survey',
          note: CALIFORNIA_FOOTBALL_FEATURE.boundary,
        },
        imageCredit: {
          generator: 'OpenAI image generation',
          artDirection: 'Codex / OpenAI for PointCast',
          date: '2026-08-03',
          documentaryPhotography: false,
          note: CALIFORNIA_FOOTBALL_FEATURE.visualCredit,
          promptSummary:
            'An art-forward California landscape at blue hour with eight stadium-light signals pulling toward five conference geographies, rendered as a risograph and architectural editorial collage.',
        },
        discovery: {
          human: CALIFORNIA_FOOTBALL_FEATURE.canonical,
          machine: CALIFORNIA_FOOTBALL_FEATURE.machineEdition,
          block: `https://pointcast.xyz/b/${CALIFORNIA_FOOTBALL_FEATURE.block}`,
          magazine: 'https://pointcast.xyz/25/magazine',
          beliefBoard: 'https://pointcast.xyz/25',
          seasonLedger: 'https://pointcast.xyz/25/season',
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
