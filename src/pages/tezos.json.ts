import { TEZOS } from '../lib/october-shelf';

export const GET = () =>
  new Response(JSON.stringify(TEZOS, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
