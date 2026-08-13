import type { APIRoute } from 'astro';
import {
  TEXAS_2026_BOARD,
  TEXAS_FOOTBALL_FEATURE,
  TEXAS_FOOTBALL_LEDGER,
  TEXAS_HISTORY_OBJECTS,
  TEXAS_SOURCES,
} from '../../../lib/pointcast-texas-football-history';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...TEXAS_FOOTBALL_FEATURE,
        status: 'published',
        live: true,
        framing: {
          method: 'A reported history organized around ten material objects rather than a greatest-moments ranking.',
          thesis: TEXAS_FOOTBALL_FEATURE.thesis,
          omissions: 'This is a selective public essay, not a complete season-by-season record book, roster archive, or comprehensive social history of the university or state.',
        },
        counts: {
          objects: TEXAS_HISTORY_OBJECTS.length,
          ledgerFacts: TEXAS_FOOTBALL_LEDGER.length,
          selected2026Games: TEXAS_2026_BOARD.length,
          sources: TEXAS_SOURCES.length,
        },
        ledger: TEXAS_FOOTBALL_LEDGER.map(([value, label]) => ({ value, label })),
        objects: TEXAS_HISTORY_OBJECTS,
        songArchive: {
          claim: 'A living tradition must retain its researched footnotes, including facts community members experience differently.',
          officialReport: 'https://eyesoftexas.utexas.edu/full-report/',
          reportFinding: 'The university committee documented a racist debut setting and likely blackface, found no evidence the lyrics were intended as nostalgia for slavery, and found very low likelihood that the title originated with Robert E. Lee.',
        },
        operatingSystem: [
          ['capital', 'University Lands, donors, tickets, media, and facilities make scale possible while remaining distinct ledgers.'],
          ['place', 'Austin, the Forty Acres, Dallas in October, College Station in November, and Texas high-school towns make the program legible.'],
          ['repetition', 'Color, sign, Tower, fairgrounds, song, argument, and return become sacred through use.'],
          ['players', 'Institutions build stages; players create the moments and carry the human cost.'],
        ],
        season2026: {
          currentAsOf: TEXAS_FOOTBALL_FEATURE.asOf,
          enteringRecord: '2025 · 10–3 · Citrus Bowl champion',
          coach: 'Steve Sarkisian · 48–20 at Texas entering 2026',
          context: 'Three consecutive 10-win seasons, including CFP semifinals in 2023 and 2024.',
          selectedGames: TEXAS_2026_BOARD.map(([date, opponent, setting, meaning]) => ({ date, opponent, setting, meaning })),
        },
        sources: TEXAS_SOURCES.map(([id, label, outlet, url]) => ({ id, label, outlet, url })),
        imageCredit: {
          format: 'original vector editorial art',
          generator: 'PointCast / Codex-authored SVG',
          documentaryPhotography: false,
          officialSchoolMarks: false,
          note: TEXAS_FOOTBALL_FEATURE.visualCredit,
          assets: [
            { url: 'https://pointcast.xyz/images/pointcast-texas-football-history/texas-strata.svg', role: 'article hero field' },
            { url: 'https://pointcast.xyz/images/pointcast-texas-football-history/social-card.png', role: '1200 × 630 social preview' },
          ],
        },
        editorialBoundary: {
          official: false,
          bettingProduct: false,
          recruitingProjection: false,
          merchandise: false,
          completeHistory: false,
          currentAsOf: TEXAS_FOOTBALL_FEATURE.asOf,
          note: TEXAS_FOOTBALL_FEATURE.boundary,
        },
        discovery: {
          human: TEXAS_FOOTBALL_FEATURE.canonical,
          machine: TEXAS_FOOTBALL_FEATURE.machineEdition,
          block: `https://pointcast.xyz/b/${TEXAS_FOOTBALL_FEATURE.block}`,
          magazine: 'https://pointcast.xyz/25/magazine',
          beliefBoard: 'https://pointcast.xyz/25',
          applications: 'https://pointcast.xyz/apps.json',
          press: 'https://pointcast.xyz/press.json',
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
