import review from '../../data/fans.json';

export const GET = () =>
  new Response(
    JSON.stringify(
      {
        schema: 'pointcast.fans/v1',
        url: 'https://pointcast.xyz/reviews/fans',
        ...review,
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
