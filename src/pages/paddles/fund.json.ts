import { ledgerTotals } from '../../../functions/_lib/paddle-fund.mjs';
import ledger from '../../data/court-fund-ledger.json';

// The ledger, with its arithmetic done: money in, the split, payouts, the
// balance. Aggregates a reader can check against the lines.
export const GET = () =>
  new Response(JSON.stringify({ ...ledger, totals: ledgerTotals(ledger), pledgesAndVotes: 'https://pointcast.xyz/api/paddles/fund', checkout: 'https://pointcast.xyz/api/paddles/fund/checkout' }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
