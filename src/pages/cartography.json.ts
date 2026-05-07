/**
 * /cartography.json - machine-readable PointCast Cartography product and revenue board.
 */
import type { APIRoute } from 'astro';
import {
  CARTOGRAPHY_BUSINESS,
  cartographyCoreSchemas,
  cartographyDemo,
} from '../lib/cartography-business';
import { CARTOGRAPHY_NEXT_SPRINT, cartographyPilotOffer } from '../lib/cartography-sprint';

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
    pilotOffer: {
      id: cartographyPilotOffer.id,
      title: cartographyPilotOffer.title,
      status: cartographyPilotOffer.status,
      priceUsd: cartographyPilotOffer.priceUsd,
      human: cartographyPilotOffer.human,
      json: cartographyPilotOffer.json,
      cta: cartographyPilotOffer.cta,
    },
    nextSprint: {
      id: CARTOGRAPHY_NEXT_SPRINT.id,
      title: CARTOGRAPHY_NEXT_SPRINT.title,
      status: CARTOGRAPHY_NEXT_SPRINT.status,
      updatedAt: CARTOGRAPHY_NEXT_SPRINT.updatedAt,
      startDate: CARTOGRAPHY_NEXT_SPRINT.startDate,
      endDate: CARTOGRAPHY_NEXT_SPRINT.endDate,
      human: CARTOGRAPHY_NEXT_SPRINT.human,
      json: CARTOGRAPHY_NEXT_SPRINT.json,
      sourceBlock: CARTOGRAPHY_NEXT_SPRINT.sourceBlock,
      goal: CARTOGRAPHY_NEXT_SPRINT.goal,
      scorecard: CARTOGRAPHY_NEXT_SPRINT.scorecard,
    },
    related: {
      joinSystem: 'https://pointcast.xyz/join',
      joinJson: 'https://pointcast.xyz/join.json',
      agentsManifest: 'https://pointcast.xyz/agents.json',
      forAgents: 'https://pointcast.xyz/for-agents',
      block: CARTOGRAPHY_BUSINESS.sourceBlock,
      sprintBlock: CARTOGRAPHY_NEXT_SPRINT.sourceBlock,
      pilot: cartographyPilotOffer.human,
      pilotJson: cartographyPilotOffer.json,
      sprint: CARTOGRAPHY_NEXT_SPRINT.human,
      sprintJson: CARTOGRAPHY_NEXT_SPRINT.json,
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
