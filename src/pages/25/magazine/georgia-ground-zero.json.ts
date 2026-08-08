import type { APIRoute } from 'astro';
import {
  GEORGIA_2026_LEDGER,
  GEORGIA_GROUND_ZERO_FEATURE,
  GEORGIA_GROUND_ZERO_READOUT,
  GEORGIA_GROUND_ZERO_SOURCES,
  GEORGIA_HEDGES_TEST,
  GEORGIA_MACHINE_INPUTS,
} from '../../../lib/pointcast-georgia-ground-zero';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...GEORGIA_GROUND_ZERO_FEATURE,
        counts: {
          machineInputs: GEORGIA_MACHINE_INPUTS.length,
          readoutSignals: GEORGIA_GROUND_ZERO_READOUT.length,
          hedgesTestQuestions: GEORGIA_HEDGES_TEST.length,
          scheduleSpineGames: GEORGIA_2026_LEDGER.length,
          sources: GEORGIA_GROUND_ZERO_SOURCES.length,
        },
        readout: GEORGIA_GROUND_ZERO_READOUT,
        machineInputs: GEORGIA_MACHINE_INPUTS,
        scheduleSpine2026: GEORGIA_2026_LEDGER,
        pointcastProposal: {
          adopted: false,
          name: 'The Hedges Test',
          description:
            'Seven editorial questions for testing whether a modern college-football operating system still serves its players, students, workers, town, state, and university.',
          questions: GEORGIA_HEDGES_TEST,
        },
        sources: GEORGIA_GROUND_ZERO_SOURCES,
        editorialBoundary: {
          official: false,
          prediction: false,
          ranking: false,
          auditedFinancialAnalysis: false,
          financialReportingNote:
            'EADA and NCAA categories are presented as institutional reporting categories, not a simple profit statement.',
          currentAsOf: GEORGIA_GROUND_ZERO_FEATURE.asOf,
          note: GEORGIA_GROUND_ZERO_FEATURE.boundary,
        },
        imageCredit: {
          generator: 'OpenAI image generation',
          artDirection: 'Codex / OpenAI for PointCast',
          date: '2026-08-08',
          documentaryPhotography: false,
          note: GEORGIA_GROUND_ZERO_FEATURE.visualCredit,
          promptSummary:
            'A 1970s sports-magazine and contemporary architectural collage of a vast football system embedded in a campus town, countered by students, band, chapel bell, local music, transit, and pre-sunrise workers.',
        },
        discovery: {
          human: GEORGIA_GROUND_ZERO_FEATURE.canonical,
          machine: GEORGIA_GROUND_ZERO_FEATURE.machineEdition,
          block: `https://pointcast.xyz/b/${GEORGIA_GROUND_ZERO_FEATURE.block}`,
          magazine: 'https://pointcast.xyz/25/magazine',
          beliefBoard: 'https://pointcast.xyz/25',
          coachesRoom: 'https://pointcast.xyz/25/magazine/coaches-50#coach-2',
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
