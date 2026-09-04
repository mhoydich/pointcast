import type { APIRoute } from 'astro';
import { POINTCAST_25, POINTCAST_25_EDITIONS } from '../../lib/pointcast-25';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        spec: 'pointcast.25-season-ledger/v1',
        season: POINTCAST_25.season,
        title: '25 FOR REASONS — 2026 Season Ledger',
        canonical: 'https://pointcast.xyz/25/season',
        machineEdition: 'https://pointcast.xyz/25/season.json',
        currentBoard: 'https://pointcast.xyz/25.json',
        currentBoardId: POINTCAST_25.board,
        nextBoardAt: POINTCAST_25.nextBoardAt,
        cadence: POINTCAST_25.cadence,
        boards: POINTCAST_25_EDITIONS,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
