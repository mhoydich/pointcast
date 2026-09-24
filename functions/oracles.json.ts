/**
 * /oracles.json — the town's oracle catalog, live rail status, and the ledger:
 * settled calls per oracle and the data-dividend record per contributor.
 * Runtime (not prerendered) so the ledger is current. Never reveals secrets.
 */
import { baseRailConfig } from './_lib/x402-base.ts';
import { LIVE_ORACLES, oracleEndpoints } from './_lib/oracles/index.ts';
import { ORACLE_ROADMAP, ORACLE_YIELD_MODEL } from '../src/lib/oracle-roadmap.ts';

type Env = { AUTH_DB?: D1Database; CDP_API_KEY_ID?: string; CDP_API_KEY_SECRET?: string; X402_BASE_ENABLED?: string; X402_BASE_PAY_TO?: string };

interface LedgerRow { action: string; maker: string; maker_address: string | null; calls: number; units: number; network_units: number }

export async function handleOraclesJson(env: Env): Promise<Response> {
  const base = baseRailConfig(env);
  let ledger: LedgerRow[] | null = null;
  if (env.AUTH_DB) {
    const actions = LIVE_ORACLES.map((o) => o.action);
    try {
      const rows = await env.AUTH_DB.prepare(`
        SELECT action, maker, maker_address, COUNT(*) AS calls, SUM(amount_units) AS units, SUM(network_units) AS network_units
        FROM splits WHERE action IN (${actions.map(() => '?').join(', ')})
        GROUP BY action, maker, maker_address
      `).bind(...actions).all<LedgerRow>();
      ledger = rows.results ?? [];
    } catch { ledger = null; }
  }
  const usdc = (units: number) => (units / 1_000_000).toFixed(6).replace(/0+$/, '').replace(/\.$/, '.00');
  const body = {
    name: 'PointCast oracles',
    url: 'https://pointcast.xyz/oracles',
    price: { amount: '0.01', currency: 'USDC', split: '50/50 house / network (contributor)' },
    rails: {
      etherlink: { state: 'open' },
      base: { state: base.ready ? 'open' : base.state, note: base.ready ? 'Listed in the x402 Bazaar after the first settled call per route.' : 'Waiting on the operator to add CDP keys. Etherlink answers the same questions now.' },
    },
    oracles: LIVE_ORACLES.map((o) => {
      const rows = (ledger ?? []).filter((r) => r.action === o.action);
      return {
        id: o.id, name: o.name, room: o.room, description: o.description, tags: o.tags,
        endpoints: oracleEndpoints(o),
        contributor: o.contributor,
        ledger: ledger === null ? null : {
          settledCalls: rows.reduce((n, r) => n + Number(r.calls), 0),
          grossUsdc: usdc(rows.reduce((n, r) => n + Number(r.units), 0)),
          dataDividends: rows.map((r) => ({ contributor: r.maker, address: r.maker_address, calls: Number(r.calls), networkHalfUsdc: usdc(Number(r.network_units)) })),
        },
      };
    }),
    planned: ORACLE_ROADMAP,
    yield: ORACLE_YIELD_MODEL,
    generatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => handleOraclesJson(env);
