import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    id: 'local-star-commons-001',
    name: 'LOCAL STAR COMMONS',
    publishedAt: '2026-07-23T19:21:10.000Z',
    status: 'founding-governance-prototype-published',
    canonicalUrl: 'https://pointcast.xyz/local-star-commons',
    releaseUrl: 'https://local-objects-tezos.mhoydich.chatgpt.site/commons',
    productionCompanion: 'https://pointcast.xyz/digital-pets/ping',
    productionCompanionJson: 'https://pointcast.xyz/digital-pets/ping.json',
    pointcastBlock: 'https://pointcast.xyz/b/0490',
    pressWire: 'https://pointcast.xyz/press/local-star-commons-opens-contribution-governed-quality-of-life-movement',
    campaignReceipt: 'https://pointcast.xyz/ads.json',
    daoManifest: 'https://local-objects-tezos.mhoydich.chatgpt.site/commons/dao/manifest.json',
    shareImage: 'https://local-objects-tezos.mhoydich.chatgpt.site/commons-og.png',
    premise: 'Useful local-first objects should be shaped, tested, repaired, and governed by the people who contribute to their shared life.',
    productionNote: 'PING / Local Pet 01 narrows the LOCAL STAR family into a first manufacturable five-signal companion. It is at Alpha 0 planning with zero physical units and no preorder.',
    products: [
      { id: 'local-star', name: 'LOCAL STAR', role: 'desktop satellite, local compute, sensor, and mesh hub' },
      { id: 'air', name: 'AIR', role: 'quiet room-air sensing and ventilation guidance' },
      { id: 'water', name: 'WATER', role: 'local water awareness, leak signals, and household resilience' },
      { id: 'light', name: 'LIGHT', role: 'adaptive illumination and neighbor-scale signaling' },
      { id: 'care', name: 'CARE', role: 'privacy-first reminders, check-ins, and practical mutual aid' },
      { id: 'power', name: 'POWER', role: 'small-scale energy awareness, backup readiness, and load coordination' },
    ],
    governance: {
      model: 'contribution-based off-chain founding commons',
      proposalStages: ['signal', 'shape', 'review', 'vote', 'field', 'learn'],
      workingCircles: ['Product', 'Field', 'Care', 'Stewardship', 'Story'],
      membership: 'Participation grows through visible contributions rather than a purchased token.',
      proposals: [
        { id: 'LSC-001', name: 'First Field Table', focus: 'host a public product and governance review in El Segundo' },
        { id: 'LSC-002', name: '25-Mile Pilot Ring', focus: 'identify useful test partners and locations within the pilot radius' },
        { id: 'LSC-003', name: 'Open Repair Ledger', focus: 'publish faults, fixes, replacement paths, and field learning' },
      ],
    },
    pilot: {
      center: 'El Segundo, California',
      radiusMiles: 25,
      opportunityFields: ['aerospace', 'aviation', 'logistics', 'manufacturing', 'media', 'health', 'education', 'civic infrastructure', 'hospitality', 'coastal resilience'],
      note: 'The map is a directional test-area study, not a claim of partnerships, installations, permits, or municipal affiliation.',
    },
    boundaries: {
      offChain: true,
      legalEntity: false,
      token: false,
      treasury: false,
      fundraising: false,
      mainnetActions: false,
      bindingSharedVote: false,
      siteSignals: 'device-local',
      physicalPilotLive: false,
    },
    disclosure: 'LOCAL STAR COMMONS is a public founding-governance prototype and creative direction. It is not a legal DAO, investment offering, token project, active treasury, certified hardware program, satellite service, emergency system, or operating physical mesh.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
