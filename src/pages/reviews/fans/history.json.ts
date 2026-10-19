import history from '../../../data/fans-history.json';

export const GET = () =>
  new Response(
    JSON.stringify(
      {
        schema: 'pointcast.fans-history/v1',
        url: 'https://pointcast.xyz/reviews/fans/history',
        ...history,
        affiliateLinks: false,
        handsOn: false,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
