import { SPELLS } from '../src/data/spells.ts';
import { getPaidTotals, getRecentReceipts } from './_lib/x402-gate.ts';

type SpellsJsonEnv = Cloudflare.Env & { AUTH_DB?: D1Database; VISITS?: KVNamespace };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

export const onRequestOptions: PagesFunction<SpellsJsonEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<SpellsJsonEnv> = async ({ env }) => {
  const [paid, receipts] = await Promise.all([
    getPaidTotals(env.AUTH_DB, 'cast').catch(() => ({ count: 0, houseUnits: 0, networkUnits: 0 })),
    getRecentReceipts(env, 'cast', 10).catch(() => []),
  ]);
  return new Response(JSON.stringify({
    spec: 'pointcast.spells/v2',
    canonical: 'https://pointcast.xyz/spells',
    json: 'https://pointcast.xyz/spells.json',
    count: SPELLS.length,
    kinds: ['burst', 'companion', 'ambient'],
    spells: SPELLS,
    paidAction: 'https://pointcast.xyz/api/agent/cast',
    receiptsUrl: 'https://pointcast.xyz/api/x402/receipt?list=1&action=cast',
    receipts,
    paid,
  }, null, 2), { headers: HEADERS });
};
