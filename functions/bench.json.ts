import { getPaidTotals, getRecentReceipts } from './_lib/x402-gate.ts';
import { handleBenchGet, type BenchEnv } from './api/bench.ts';

type BenchJsonEnv = BenchEnv & { AUTH_DB?: D1Database };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

export const onRequestOptions: PagesFunction<BenchJsonEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<BenchJsonEnv> = async ({ request, env }) => {
  const [benchResponse, paid, receipts] = await Promise.all([
    handleBenchGet(new Request('https://pointcast.xyz/api/bench' + new URL(request.url).search), env),
    getPaidTotals(env.AUTH_DB, 'bench').catch(() => ({ count: 0, houseUnits: 0, networkUnits: 0 })),
    getRecentReceipts(env, 'bench', 10).catch(() => []),
  ]);
  const bench = await benchResponse.json() as Record<string, unknown>;
  return new Response(JSON.stringify({
    ...bench,
    spec: 'pointcast.bench/v2',
    canonical: 'https://pointcast.xyz/bench',
    json: 'https://pointcast.xyz/bench.json',
    paidAction: 'https://pointcast.xyz/api/agent/bench',
    receiptsUrl: 'https://pointcast.xyz/api/x402/receipt?list=1&action=bench',
    receipts,
    paid,
  }, null, 2), { headers: HEADERS });
};
