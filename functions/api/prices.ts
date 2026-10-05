/**
 * /api/prices — file a local El Segundo price, or read the wire.
 *
 * GET  → latest accepted price per item, a short trend, the basket, held
 *        reports, and reporter points. Same body as /prices.json.
 * POST { handle, item, price, place, date?, source?, kind?: "human"|"agent" }
 *        One report per handle, per item, per day. Points for filing an
 *        accepted report, never for what the price says, never cash.
 *
 * KV: VISITS `prices:book:v1`. Unbound store: GET is an empty wire, POST is 503.
 */
// @ts-ignore — plain module shared with the tests
import {
  fileReport, formatUsd, overBudget, publicPrices, readBody, readBook, writeBook,
} from '../_lib/price-wire.mjs';

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

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(publicPrices(await readBook(env.VISITS)));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, error: 'the price wire is offline' }, 503);
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'send {handle, item, price, place}' }, 400);
  if (await overBudget(env.VISITS, request)) return json({ ok: false, error: 'too many reports from here; try again in a few minutes' }, 429);
  const book = await readBook(env.VISITS);
  const filed = fileReport(book, body);
  if (!filed.ok) return json({ ok: false, error: filed.error }, filed.status);
  await writeBook(env.VISITS, book);
  const report = filed.report;
  return json({
    ok: true,
    report: {
      id: report.id,
      item: report.item,
      label: filed.item.label,
      priceCents: report.priceCents,
      price: formatUsd(report.priceCents),
      place: report.place,
      date: report.date,
      source: report.source,
      handle: report.handle,
      kind: report.kind,
      status: report.status,
      reason: report.reason,
    },
    points: report.points,
    held: report.status === 'held',
    pointsNote: report.status === 'ok'
      ? '2 points for an accepted report, the same whatever the price says. Never cash.'
      : `Held (${report.reason}). It stays on the ledger and out of the latest price, the trend and the basket. 0 points.`,
  }, 201);
};
