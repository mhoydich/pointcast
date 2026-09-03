import {
  X402_KEYS_ENDPOINT,
  X402_TREASURY_JWK,
} from '../../../src/lib/x402.ts';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

export const onRequestOptions = async () => new Response(null, { status: 204, headers: HEADERS });

export const onRequestGet = async () => new Response(
  JSON.stringify({
    issuer: 'pointcast.xyz',
    keys_endpoint: X402_KEYS_ENDPOINT,
    keys: [X402_TREASURY_JWK],
  }, null, 2),
  { status: 200, headers: HEADERS },
);
