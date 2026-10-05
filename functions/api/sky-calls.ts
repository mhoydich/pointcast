/**
 * /api/sky-calls — the public ledger for Sky Calls.
 *
 * GET  → definition, the open morning, the ledger, people and agent boards.
 *        Past mornings with calls and no verdict are settled here, at read
 *        time, from the Marine Layer Oracle (the burn-off rule in burnoff.ts).
 * POST { handle, call: "layer"|"clear", kind?: "human"|"agent", date? }
 *        One call per handle for the morning that is open. Calls close at
 *        9:00 PM Pacific the night before. Points, never cash.
 *
 * KV: VISITS `sky:book:v1`. Unbound store: GET is an empty ledger, POST is 503.
 */
import { answerMarine, type MarineDeps } from '../../src/lib/marine-oracle.ts';
// @ts-ignore — plain module shared with the tests
import {
  overBudget, placeCall, publicSky, readBody, readBook, settleOutstanding, writeBook,
} from '../_lib/sky-calls.mjs';

interface Env { VISITS?: KVNamespace }

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });

export const onRequestOptions = async () => new Response(null, { status: 204, headers: HEADERS });

function deps(): MarineDeps {
  return {
    fetch: (url) => fetch(url, { headers: { 'User-Agent': 'PointCast Sky Calls (pointcast.xyz/sky-calls)' } }),
    now: new Date(),
    cached: async (_url, _ttl, load) => load(),
  };
}

async function loadVerdict(date: string) {
  const answer = await answerMarine({ date }, deps());
  return answer.verdict;
}

async function settled(env: Env, now = Date.now()) {
  const book = await readBook(env.VISITS);
  if (!env.VISITS) return book;
  // Compute verdicts in memory; only a successful POST persists this book.
  await settleOutstanding(book, now, loadVerdict);
  return book;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(publicSky(await settled(env)));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, error: 'the sky-calls ledger is offline' }, 503);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'send {handle, call:"layer"|"clear"}' }, 400);
  if (await overBudget(env.VISITS, request)) return json({ ok: false, error: 'too many calls from here; try again in a few minutes' }, 429);
  const book = await settled(env);
  const placed = placeCall(book, body);
  if (!placed.ok) return json({ ok: false, error: placed.error, open: placed.open ?? null, date: placed.date ?? null }, placed.status);
  await writeBook(env.VISITS, book);
  return json({
    ok: true,
    date: placed.date,
    call: placed.entry,
    closesAt: placed.open.closesAt,
    points: 0,
    pointsNote: 'A correct call is worth 1 point when the marine-layer rule settles the morning. A miss is 0. A void morning is 0. Never cash.',
  }, 201);
};
