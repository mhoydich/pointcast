import type { APIRoute } from 'astro';
import { POINTCAST_25 } from '../lib/pointcast-25';
import { POINTCAST_25_TEAMS } from '../lib/pointcast-25-audience';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...POINTCAST_25,
        canonical: 'https://pointcast.xyz/25',
        machineEdition: 'https://pointcast.xyz/25.json',
        block: 'https://pointcast.xyz/b/0510',
        discovery: {
          disagreementIndex: 'https://pointcast.xyz/25/disagreements',
          disagreementIndexJson: 'https://pointcast.xyz/25/disagreements.json',
          receiptBook: 'https://pointcast.xyz/25/receipts',
          receiptBookJson: 'https://pointcast.xyz/25/receipts.json',
          immutableBoard: 'https://pointcast.xyz/25/boards/000',
          immutableBoardJson: 'https://pointcast.xyz/25/boards/000.json',
          teamCases: POINTCAST_25_TEAMS.map((team) => ({
            team: team.school,
            human: `https://pointcast.xyz/25/teams/${team.slug}`,
            json: `https://pointcast.xyz/25/teams/${team.slug}.json`,
          })),
        },
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
