import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    id: 'network-el-segundo-mesh-commons-004',
    name: 'Mesh Commons',
    publishedAt: '2026-07-23T19:15:00.000Z',
    status: 'physical-network-plan-published',
    canonicalUrl: 'https://pointcast.xyz/network-el-segundo/mesh-commons',
    releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/mesh-commons',
    sourcePlan: 'https://network-el-segundo.mhoydich.chatgpt.site/mesh-commons.json',
    pointcastBlock: 'https://pointcast.xyz/b/0489',
    pressRelease: 'https://pointcast.xyz/press/network-el-segundo-publishes-mesh-commons-two-year-plan',
    shareImage: 'https://network-el-segundo.mhoydich.chatgpt.site/og-mesh-commons.png',
    planningHorizon: {
      origin: 'El Segundo, California',
      radiusMiles: 25,
      durationMonths: 24,
      coverageGuarantee: false,
      meaning: 'A direction for linked rooftop clusters and one possible engineered horizon link, not blanket service.',
    },
    cheapestHonestStart: {
      proofLinkUsd: { low: 295, high: 395 },
      firstMeshTriangleUsd: { low: 950, high: 1500 },
      yearOneHardwareUsd: { low: 3000, high: 5000 },
      twoYearHardwareUsd: { low: 9500, high: 15000 },
      firstMeshShape: 'Three consented rooftops, three directional paths, one donated service computer.',
      assumptions: ['volunteer labor', 'donated roof access and power', 'member-owned edge radios', 'donated service compute'],
      excluded: ['professional roof/electrical/grounding work', 'engineering and permits', 'insurance', 'tower rent', 'internet backhaul'],
    },
    equipmentExamples: [
      { name: 'Ubiquiti LiteBeam 5AC', role: 'directional 5 GHz CPE or point-to-point link', currentManufacturerPriceFromUsd: 65 },
      { name: 'MikroTik SXTsq 5 ac', role: 'outdoor 5 GHz CPE/backbone radio with RouterOS and included PoE parts', suggestedPriceUsd: 65 },
      { name: 'MikroTik hEX lite', role: 'small indoor router', suggestedPriceUsd: 39.95 },
    ],
    sequence: [
      { months: '0–3', name: 'Find the triangle', target: '25 interested hosts, 10 safe panoramas, 3 candidate rooftops' },
      { months: '4–6', name: 'Prove one link', target: '2 roofs, 1 measured directional link, 3 local services' },
      { months: '7–12', name: 'Close the loop', target: '3–5 roofs, 3 independent paths, 10–25 people, 5 services' },
      { months: '13–18', name: 'Make two clusters', target: '6–10 roofs, 2 neighborhood hubs, 8 services' },
      { months: '19–24', name: 'Touch the horizon', target: '12–20 roofs, 4–6 hubs, 50+ neighbors, 12 services' },
    ],
    localOnlyServices: [
      'hello.mesh',
      'map.mesh',
      'play.mesh',
      'bbs.mesh',
      'radio.mesh',
      'library.mesh',
      'drop.mesh',
      'garden.mesh',
      'atelier.mesh',
    ],
    operatingModel: {
      mandatoryMonthlyPriceUsd: 0,
      suggestedDonation: '$5–$20 or volunteer time',
      internetRequiredForLocalServices: false,
      internetGateway: 'Optional, separately permitted, best-effort service',
      routing: 'OSPF for the small mesh; BGP only between mature regional hubs',
      matureClusterRedundancy: 'At least two directional uplinks',
      contentLogging: false,
      publicHomeAddresses: false,
      healthMetricsOnly: true,
    },
    nycMeshPatternsUsed: [
      'Potential node → panorama → line-of-sight viability → install',
      'Directional CPE into a hub sector',
      'Two uplinks in every mature cluster',
      'Local DNS and member-hosted services',
      'Network Commons freedoms to use, understand, offer services, and extend',
      'DIY and donation-supported access',
    ],
    disclosure: 'This is a public planning artifact, not an active mesh, coverage guarantee, internet service offering, emergency network, certified design, site survey, engineering opinion, municipal program, or authorization to install on any property.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
