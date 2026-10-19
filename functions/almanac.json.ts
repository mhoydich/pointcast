/**
 * /almanac.json — JSON twin of the Daily Almanac cards.
 *
 * GET /almanac.json → the catalog plus today's card.
 * GET /almanac.json?date=YYYY-MM-DD → one card, No. 1 = 2026-10-05.
 *
 * Reads the sky-calls and price-wire books. Does not write them.
 * A missing source is marked missing.
 */
// @ts-ignore — plain module shared with the tests
import { almanacResponse } from './_lib/almanac-card.mjs';
import { marineForCard } from './_lib/almanac-marine.ts';

type Env = { VISITS?: KVNamespace; ASSETS?: { fetch: (input: Request | URL | string) => Promise<Response> } };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const result = await almanacResponse(env, request.url, { marine: marineForCard });
  return new Response(JSON.stringify(result.body, null, 2), { status: result.status, headers: HEADERS });
};
