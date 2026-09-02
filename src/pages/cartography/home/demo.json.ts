/**
 * /cartography/home/demo.json - fictional Home Cartography household index.
 */
import type { APIRoute } from 'astro';
import {
  DEMO_HOUSE,
  DEMO_ITEMS,
  DEMO_RECEIPTS,
  demoInsuranceSchedule,
  demoLendFlow,
  demoReceiptReconciliation,
  demoRollups,
  demoSellFlow,
} from '../../../lib/home-cartography-demo';
import { HOME_CARTOGRAPHY } from '../../../lib/home-cartography';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography/home/demo.json',
    generatedAt: new Date().toISOString(),
    note: 'Fictional demo household. Every item, price, and person is invented; no real inventory data is collected.',
    concept: {
      id: HOME_CARTOGRAPHY.id,
      homepage: HOME_CARTOGRAPHY.homepage,
      json: HOME_CARTOGRAPHY.json,
    },
    house: DEMO_HOUSE,
    items: DEMO_ITEMS,
    rollups: demoRollups,
    sellFlow: demoSellFlow,
    lendFlow: demoLendFlow,
    receipts: DEMO_RECEIPTS,
    receiptReconciliation: demoReceiptReconciliation,
    insuranceSchedule: demoInsuranceSchedule,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
