/**
 * /front-desk/agents.json — JSON twin of the who's-in-town board.
 * Same read as GET /api/front-desk. It does not write.
 */
// @ts-ignore — plain module shared with the tests
import { publicBoard } from '../_lib/front-desk.mjs';

type DeskEnv = { VISITS?: KVNamespace };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export const onRequestGet: PagesFunction<DeskEnv> = async ({ request, env }) => {
  const date = new URL(request.url).searchParams.get('date') || undefined;
  const board = await publicBoard(env.VISITS, date);
  return new Response(JSON.stringify(board, null, 2), { status: board.status || 200, headers: HEADERS });
};
