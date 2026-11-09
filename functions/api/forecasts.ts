/**
 * /api/forecasts — the 25-Mile Forecast Board.
 *
 * GET              → rules, open questions with the crowd average, closed
 *                    questions waiting on their source, the resolved archive
 *                    with every forecaster's Brier score, and the accuracy board.
 * GET ?id=<id>     → one question, same shape as a row of the board.
 * POST { handle, key, id, p, kind? }
 *                  → file or change one forecast before the close. p is how
 *                    likely YES is, a whole percent from 1 to 99. The key holds
 *                    the handle: the first forecast binds it, and only the same
 *                    key can change that handle's forecasts.
 *
 * Forecasts only: no money, no tokens, no points, no prizes.
 * Questions: src/data/forecasts.json (resolved by a reviewed edit).
 * KV: VISITS `forecast:book:v1`. Unbound store: GET shows questions with an
 * empty crowd, POST is 503.
 */
import data from '../../src/data/forecasts.json';
// @ts-ignore — plain module shared with the tests
import { oneQuestion, overBudget, placeForecast, publicBoard, readBody, readBook, writeBook } from '../_lib/forecasts.mjs';

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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const book = await readBook(env.VISITS);
  const id = new URL(request.url).searchParams.get('id');
  if (id) {
    const one = oneQuestion(data, book, id);
    return one ? json({ ok: true, question: one, money: 'none: forecasts only' }) : json({ ok: false, error: 'no question with that id' }, 404);
  }
  return json(publicBoard(data, book));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, error: 'the forecast board is offline' }, 503);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'send {handle, key, id, p}' }, 400);
  if (await overBudget(env.VISITS, request)) return json({ ok: false, error: 'too many forecasts from here; try again in a few minutes' }, 429);
  const book = await readBook(env.VISITS);
  const placed = await placeForecast(book, data.questions, body);
  if (!placed.ok) return json({ ok: false, error: placed.error }, placed.status);
  await writeBook(env.VISITS, book);
  return json({
    ok: true,
    updated: placed.updated,
    id: placed.question,
    forecast: placed.entry,
    closesAt: placed.closesAt,
    note: 'Forecasts only. Your last forecast before the close is scored with a Brier score when the question resolves. No points, no prizes.',
  }, placed.status);
};
