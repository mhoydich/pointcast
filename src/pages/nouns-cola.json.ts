/**
 * /nouns-cola.json - machine-readable Nouns Cola operating plan.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Cola',
  status: 'alpha operating board',
  human: 'https://pointcast.xyz/nouns-cola',
  image: 'https://pointcast.xyz/images/nouns-cola/nouns-cola-pack.png',
  intent: 'Create a Nouns Cola pilot on PointCast covering formulation, fundraising, production, profit, and yield.',
  formulation: {
    product: '12 oz carbonated cola concept',
    targets: {
      brix: 10.8,
      phRange: '2.8-3.2',
      caffeineMgPer12oz: 34,
      sodiumMgPer12oz: 35,
      qaRounds: 3,
    },
    notes: [
      'Recipe and nutrition details require beverage formulator and co-packer validation before sale.',
      'Brand language uses Nouns-inspired CC0 visual grammar.',
    ],
  },
  fundraising: {
    targetUsd: 120000,
    uses: [
      { item: 'Recipe R&D and lab validation', amountUsd: 12000 },
      { item: 'Pilot can run deposit', amountUsd: 38000 },
      { item: 'Inventory, freight, cold storage', amountUsd: 44000 },
      { item: 'PointCast launch media and sampling', amountUsd: 16000 },
      { item: 'Compliance, reserve, surprises', amountUsd: 10000 },
    ],
    routes: ['preorder crates', 'sponsor pallets', 'DAO-style proposal', 'direct community support'],
  },
  production: {
    pilotCases: 2400,
    cansPerCase: 24,
    steps: [
      'bench formula',
      'co-packer sample',
      'label and carton',
      'pilot run',
      'PointCast drop',
    ],
  },
  modelDefaults: {
    cases: 2400,
    directSharePct: 64,
    directPricePerCanUsd: 3.75,
    wholesalePricePerCanUsd: 1.85,
    productionCostPerCanUsd: 0.82,
    fixedLaunchCostUsd: 42000,
    raiseTargetUsd: 120000,
    surplusYieldSplitPct: 30,
    freightPerCaseUsd: 4.2,
    paymentAndSpoilagePerCanUsd: 0.16,
  },
  surplusPolicy: [
    { bucket: 'next production run', pct: 40 },
    { bucket: 'PointCast treasury', pct: 30 },
    { bucket: 'Nouns Cola growth', pct: 20 },
    { bucket: 'team bonus pool', pct: 10 },
  ],
  caveats: [
    'Planning math only.',
    'Not an offer, investment product, or promise of financial return.',
    'Food, label, and nutrition compliance require qualified review before sale.',
  ],
  links: {
    human: 'https://pointcast.xyz/nouns-cola',
    yieldSandbox: 'https://pointcast.xyz/yield',
    pointcast: 'https://pointcast.xyz/',
  },
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
