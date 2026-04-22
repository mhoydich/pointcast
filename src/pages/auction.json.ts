/**
 * /auction.json — agent-readable snapshot of the current daily auction.
 *
 * Mirrors /auction but for agent consumers. Schema
 * `pointcast-auction-v0`. Forwards live contract storage from TzKT +
 * adds docs pointers + tool list. CORS open, 15s cache.
 */
import type { APIRoute } from 'astro';
import contracts from '../data/contracts.json';
import { fetchAuctionStorage, toView, fetchSettlementHistory } from '../lib/auction';

export const prerender = true;

export const GET: APIRoute = async () => {
  const daily = (contracts as Record<string, Record<string, string>>).daily_auction;
  const mainnetAddr = daily?.mainnet ?? '';
  const shadownetAddr = daily?.shadownet ?? '';
  const network: 'mainnet' | 'shadownet' = mainnetAddr ? 'mainnet' : 'shadownet';
  const contractAddr = mainnetAddr || shadownetAddr;
  const visitNounsAddr =
    (contracts as Record<string, Record<string, string>>).visit_nouns?.[network] ?? '';

  const base = {
    schema: 'pointcast-auction-v0',
    host: 'pointcast.xyz',
    generated_at: new Date().toISOString(),
    network,
    contract: contractAddr || null,
    visit_nouns_fa2: visitNounsAddr || null,
    docs: {
      block: 'https://pointcast.xyz/b/0330',
      research: 'https://github.com/mhoydich/pointcast/blob/main/docs/research/2026-04-21-tezos-nouns-builder.md',
      brief: 'https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-21-daily-auction-spec.md',
      contract_source: 'https://github.com/mhoydich/pointcast/blob/main/contracts/v2/daily_auction.py',
    },
    proposed_agent_tools: [
      'pointcast_auction_observe',
      'pointcast_auction_history',
      'pointcast_auction_bid_preview',
    ],
  };

  if (!contractAddr) {
    return new Response(
      JSON.stringify(
        {
          ...base,
          status: 'not-originated',
          note: 'Contract pending origination. See docs + brief for v0 scope.',
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      },
    );
  }

  try {
    const [storage, history] = await Promise.all([
      fetchAuctionStorage(contractAddr, network),
      fetchSettlementHistory(contractAddr, network, 10),
    ]);
    const view = storage ? toView(storage) : null;

    return new Response(
      JSON.stringify(
        {
          ...base,
          status: view ? 'live' : 'storage-unavailable',
          state: view,
          history,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=15',
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify(
        {
          ...base,
          status: 'error',
          detail: String(err),
        },
        null,
        2,
      ),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
};
