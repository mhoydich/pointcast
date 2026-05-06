/**
 * /cartography.json - machine-readable PointCast Cartography product and revenue board.
 */
import type { APIRoute } from 'astro';
import {
  CARTOGRAPHY_BUSINESS,
  cartographyCoreSchemas,
  cartographyDemo,
} from '../lib/cartography-business';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/cartography.json',
    ...CARTOGRAPHY_BUSINESS,
    schemas: cartographyCoreSchemas,
    demo: {
      human: CARTOGRAPHY_BUSINESS.demo,
      json: CARTOGRAPHY_BUSINESS.demoJson,
      sampleProfileMapId: cartographyDemo.profileMap.id,
      sampleOpportunityRouteIds: cartographyDemo.opportunityRoutes.map((route) => route.id),
      sampleContributionReceiptIds: cartographyDemo.contributionReceipts.map((receipt) => receipt.id),
    },
    related: {
      joinSystem: 'https://pointcast.xyz/join',
      joinJson: 'https://pointcast.xyz/join.json',
      agentsManifest: 'https://pointcast.xyz/agents.json',
      forAgents: 'https://pointcast.xyz/for-agents',
      block: CARTOGRAPHY_BUSINESS.sourceBlock,
      ping: 'https://pointcast.xyz/ping?intent=cartography',
    },
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
