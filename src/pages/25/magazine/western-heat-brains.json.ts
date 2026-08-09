import type { APIRoute } from 'astro';
import {
  BRAINS_DIALS,
  BRAINS_POWER_25,
  BRAINS_SCOREBOARD,
  BRAINS_SOURCES,
  BRAINS_WESTERN_SCOUTING,
  WESTERN_HEAT_BRAINS_FEATURE,
  WESTERN_HEAT_PROGRAMS,
  WESTERN_HEAT_SOURCES,
} from '../../../lib/pointcast-western-heat-brains';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...WESTERN_HEAT_BRAINS_FEATURE,
        status: 'published',
        live: true,
        counts: {
          westernPrograms: WESTERN_HEAT_PROGRAMS.length,
          power25Institutions: BRAINS_POWER_25.length,
          categoryResults: BRAINS_SCOREBOARD.length,
          westernResearchScouting: BRAINS_WESTERN_SCOUTING.length,
          methodDials: BRAINS_DIALS.length,
          sources: WESTERN_HEAT_SOURCES.length + BRAINS_SOURCES.length,
        },
        westernHeat: {
          status: 'editorial index',
          scoringNote:
            'PointCast temperatures are disclosed editorial judgments about attention, leverage, pressure, and institutional stakes. They are not forecasts, odds, or betting advice.',
          programs: WESTERN_HEAT_PROGRAMS,
          forecast: {
            bestFootballProposition: 'Arizona State',
            mostWatchedConstructionSite: 'Colorado',
            mostMeaningPerWin: 'Wyoming',
            disappearanceTest:
              'If the football team vanished tomorrow, what part of the university would become harder to explain?',
          },
          sources: WESTERN_HEAT_SOURCES.map(([id, label, outlet, url]) => ({
            id,
            label,
            outlet,
            url,
          })),
        },
        brains25: {
          method: {
            power25:
              'The latest NSF/NCSES FY2024 higher-education R&D expenditure rank, published February 2026. This is a resource baseline, not a PointCast vote.',
            saturdayScoreboard:
              'Verified current missions, prototypes, deployments, and student competition results. Unlike competitions remain separate results.',
            editorialBallot: ['case', 'doubt', 'next proof', 'movement'],
            dials: BRAINS_DIALS.map(([number, name, description]) => ({
              number,
              name,
              description,
            })),
          },
          power25: BRAINS_POWER_25.map(([rank, institution, reading, rdMillions]) => ({
            rank,
            institution,
            reading,
            rdMillions,
          })),
          categoryOfTheDay: 'systems under pressure',
          saturdayScoreboard: BRAINS_SCOREBOARD,
          westernScouting: BRAINS_WESTERN_SCOUTING,
          sources: BRAINS_SOURCES.map(([id, label, outlet, url]) => ({
            id,
            label,
            outlet,
            url,
          })),
        },
        imageCredit: {
          generator: 'OpenAI image generation',
          artDirection: 'Codex / OpenAI for PointCast',
          date: '2026-08-08',
          documentaryPhotography: false,
          officialSchoolMarks: false,
          note: WESTERN_HEAT_BRAINS_FEATURE.visualCredit,
          assets: [
            {
              url: 'https://pointcast.xyz/images/pointcast-western-heat-brains/double-field.webp',
              role: 'double-issue cover',
              promptSummary:
                'A split abstract landscape moving from orange Western topography into a midnight fluorescent research ecology.',
            },
            {
              url: 'https://pointcast.xyz/images/pointcast-western-heat-brains/western-field.webp',
              role: 'Western Heat field plate',
              promptSummary:
                'Sonoran thermal waves, Colorado alpine geometry, and Wyoming high plains rendered as tactile cut paper and risograph grain.',
            },
            {
              url: 'https://pointcast.xyz/images/pointcast-western-heat-brains/brains-field.webp',
              role: 'Brains 25 field plate',
              promptSummary:
                'Roots and mycelium become circuits among quantum clocks, lunar dust, cells, ocean currents, and small exploratory machines.',
            },
          ],
        },
        editorialBoundary: {
          official: false,
          prediction: false,
          bettingProduct: false,
          auditedFinancialAnalysis: false,
          currentAsOf: WESTERN_HEAT_BRAINS_FEATURE.asOf,
          note: WESTERN_HEAT_BRAINS_FEATURE.boundary,
        },
        discovery: {
          human: WESTERN_HEAT_BRAINS_FEATURE.canonical,
          machine: WESTERN_HEAT_BRAINS_FEATURE.machineEdition,
          block: `https://pointcast.xyz/b/${WESTERN_HEAT_BRAINS_FEATURE.block}`,
          magazine: 'https://pointcast.xyz/25/magazine',
          beliefBoard: 'https://pointcast.xyz/25',
          applications: 'https://pointcast.xyz/apps.json',
          feed: 'https://pointcast.xyz/feed.xml',
          llms: 'https://pointcast.xyz/llms.txt',
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
