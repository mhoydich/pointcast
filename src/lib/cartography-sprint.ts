import { CARTOGRAPHY_BUSINESS, cartographyCoreSchemas } from './cartography-business';

export const CARTOGRAPHY_SPRINT_UPDATED_AT = '2026-09-04T00:00:00Z';

export const cartographyPilotOffer = {
  id: 'cartography-pilot-offer-archive', title: 'Cartography Pilot Archive', status: 'archived-not-for-sale', priceUsd: null,
  billing: 'No billing', buyer: 'No active buyer or intake', promise: 'A preserved record of an earlier Cartography exploration. This is not an offer or request for work.', timeline: 'No active timeline', cta: '/cartography', human: 'https://pointcast.xyz/cartography/pilot', json: 'https://pointcast.xyz/cartography/pilot.json',
  paymentRail: 'No payment rail is active.', qualification: [], deliverables: [], acceptanceGates: ['The fictional demo must keep private details out of public output.'],
} as const;

export const CARTOGRAPHY_NEXT_SPRINT = {
  id: 'cartography-sprint-archive-001', version: 'cartography-sprint-archive-v2-2026-09-04', title: 'Cartography Sprint Archive', status: 'archived', updatedAt: CARTOGRAPHY_SPRINT_UPDATED_AT,
  startDate: '2026-05-07', endDate: '2026-05-15', sourceBlock: 'https://pointcast.xyz/b/0443', human: 'https://pointcast.xyz/cartography/sprint', json: 'https://pointcast.xyz/cartography/sprint.json', pilotOffer: cartographyPilotOffer,
  business: { id: CARTOGRAPHY_BUSINESS.id, goal: CARTOGRAPHY_BUSINESS.goal, homepage: CARTOGRAPHY_BUSINESS.homepage, json: CARTOGRAPHY_BUSINESS.json },
  goal: { target: 'An earlier planning sprint, retained as an archive rather than an active operating plan.', targetPilotCount: 0, targetQualifiedAccounts: 0, targetFounderCalls: 0, targetContractedUsd: 0, pivotRule: 'No action is requested from this archived material.' },
  lanes: [], scorecard: [], tasks: [], operatingCadence: [], guardrails: CARTOGRAPHY_BUSINESS.guardrails, schemas: cartographyCoreSchemas,
} as const;

export const cartographySprintJsonLd = { '@context': 'https://schema.org', '@type': 'CreativeWork', '@id': 'https://pointcast.xyz/cartography/sprint#archive', name: CARTOGRAPHY_NEXT_SPRINT.title, url: CARTOGRAPHY_NEXT_SPRINT.human, description: CARTOGRAPHY_NEXT_SPRINT.goal.target, isPartOf: { '@type': 'CreativeWork', name: CARTOGRAPHY_BUSINESS.title, url: CARTOGRAPHY_BUSINESS.homepage } } as const;
