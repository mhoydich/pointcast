import { CARTOGRAPHY_BUSINESS, cartographyCoreSchemas } from './cartography-business';

export const CARTOGRAPHY_SPRINT_UPDATED_AT = '2026-05-07T07:15:00Z';

export const cartographyPilotOffer = {
  id: 'cartography-paid-pilot-offer-v1',
  title: '$50k Cartography Pilot',
  status: 'selling',
  priceUsd: 50000,
  billing: 'one-time or milestone invoice',
  buyer: 'brand, agency, accelerator, or community team with a real creator, AI-talent, or cultural partner need',
  promise:
    'Map one niche into permissioned profile maps, ranked opportunity routes, a campaign shortlist, and at least one measurable commercial yield artifact.',
  timeline: '14 days after kickoff',
  cta: 'https://pointcast.xyz/ping?intent=cartography-pilot',
  human: 'https://pointcast.xyz/cartography/pilot',
  json: 'https://pointcast.xyz/cartography/pilot.json',
  paymentRail:
    'Stripe-hosted Checkout or Stripe Invoicing. No card data, tax logic, or Stripe secret key belongs in the static PointCast repo.',
  qualification: [
    'Buyer has a named niche, roster, campaign, launch, or partner search.',
    'Buyer can review the first shortlist within 5 business days.',
    'Public profile output is limited to permissioned, fictional, or clearly redacted data.',
    'Success is measured as leads, intros, calls, shortlist acceptance, paid deals, or contribution receipts.',
  ],
  deliverables: [
    {
      id: 'pilot-brief',
      label: 'Pilot brief',
      due: 'day 2',
      detail: 'Buyer goal, niche boundary, permission policy, public/private field split, and success metric.',
    },
    {
      id: 'profile-map-set',
      label: '25 candidate profile maps',
      due: 'day 7',
      detail: 'Source links, identity signals, opportunity fit, and private-notes policy for each candidate.',
    },
    {
      id: 'shortlist',
      label: 'Campaign shortlist',
      due: 'day 10',
      detail: 'Ranked 10-profile shortlist with buyer-specific rationale and next action.',
    },
    {
      id: 'opportunity-routes',
      label: 'Opportunity routes',
      due: 'day 12',
      detail: 'At least three buyer-ready routes with owner, due date, artifact, and proof URL.',
    },
    {
      id: 'receipt-packet',
      label: 'Contribution receipt packet',
      due: 'day 14',
      detail: 'Accepted work receipt, yield type, contributors, artifact link, and financial disclaimer.',
    },
  ],
  acceptanceGates: [
    'Buyer accepts the pilot brief and private/public data boundary.',
    'No scraped sensitive data, public trust score, APY, staking, or financial-return language.',
    'At least one measurable yield artifact is shipped by day 14.',
    'Receipt packet names contributors and accepted artifacts without exposing private notes.',
  ],
} as const;

export const CARTOGRAPHY_NEXT_SPRINT = {
  id: 'cartography-pilot-close-sprint-001',
  version: 'cartography-sprint-v1-2026-05-07',
  title: 'Cartography Pilot Close Sprint',
  status: 'active',
  updatedAt: CARTOGRAPHY_SPRINT_UPDATED_AT,
  startDate: '2026-05-07',
  endDate: '2026-05-15',
  sourceBlock: 'https://pointcast.xyz/b/0443',
  human: 'https://pointcast.xyz/cartography/sprint',
  json: 'https://pointcast.xyz/cartography/sprint.json',
  pilotOffer: cartographyPilotOffer,
  business: {
    id: CARTOGRAPHY_BUSINESS.id,
    goal: CARTOGRAPHY_BUSINESS.goal,
    homepage: CARTOGRAPHY_BUSINESS.homepage,
    json: CARTOGRAPHY_BUSINESS.json,
  },
  goal: {
    target: 'Close 3 paid pilots or force a niche decision by May 15.',
    targetPilotCount: 3,
    targetQualifiedAccounts: 100,
    targetFounderCalls: 30,
    targetContractedUsd: 150000,
    pivotRule: 'If fewer than 3 serious buyer conversations happen by May 15, narrow the niche and rewrite the offer.',
  },
  lanes: [
    {
      id: 'demand',
      label: 'Demand',
      owner: 'Mike plus BD contractor',
      outcome: '100 brand or agency accounts, 30 founder-led sales calls, and 10 qualified follow-ups.',
    },
    {
      id: 'offer',
      label: 'Offer',
      owner: 'Mike plus Codex',
      outcome: 'One public $50k pilot offer and one private proposal template.',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      owner: 'operator plus agents',
      outcome: 'Three demo-ready profile maps and one buyer-specific shortlist sample.',
    },
    {
      id: 'payment',
      label: 'Payment',
      owner: 'operator',
      outcome: 'Stripe Payment Link, Checkout Price, or invoice template ready for pilots.',
    },
    {
      id: 'receipt',
      label: 'Receipt',
      owner: 'Codex plus operator',
      outcome: 'Contribution receipt template and pilot yield ledger ready before the first close.',
    },
  ],
  scorecard: [
    { id: 'target_accounts', label: 'Target accounts', target: 100, cadence: 'daily' },
    { id: 'founder_calls', label: 'Founder-led calls', target: 30, cadence: 'weekly' },
    { id: 'qualified_followups', label: 'Qualified follow-ups', target: 10, cadence: 'weekly' },
    { id: 'paid_pilots', label: 'Paid pilots', target: 3, cadence: 'by 2026-05-15' },
    { id: 'contracted_usd', label: 'Contracted USD', target: 150000, cadence: 'by 2026-05-15' },
  ],
  tasks: [
    {
      id: 'sprint-001-accounts',
      lane: 'demand',
      ask: 'Build the first 100-account brand and agency target list with buyer, budget signal, warm path, and first ask.',
      artifact: 'private CRM or redacted account-list schema',
      status: 'open',
      due: '2026-05-09',
    },
    {
      id: 'sprint-001-outbound',
      lane: 'demand',
      ask: 'Write 3 outbound angles for brands, agencies, and community operators, each tied to a measurable pilot artifact.',
      artifact: 'outbound copy bank',
      status: 'open',
      due: '2026-05-09',
    },
    {
      id: 'sprint-001-offer',
      lane: 'offer',
      ask: 'Publish the $50k pilot offer as a human page and JSON route.',
      artifact: 'https://pointcast.xyz/cartography/pilot',
      status: 'shipped-in-this-sprint',
      due: '2026-05-07',
    },
    {
      id: 'sprint-001-stripe',
      lane: 'payment',
      ask: 'Create Stripe Payment Link, Checkout Price, or invoice template for the paid pilot.',
      artifact: 'PUBLIC_STRIPE_CARTOGRAPHY_PILOT_URL or invoice template reference',
      status: 'blocked-on-stripe-dashboard',
      due: '2026-05-10',
    },
    {
      id: 'sprint-001-demo-maps',
      lane: 'evidence',
      ask: 'Turn the fictional demo into three niche-specific sample maps: AI creator, culture roster, and local brand partner.',
      artifact: 'redacted demo map packet',
      status: 'open',
      due: '2026-05-12',
    },
    {
      id: 'sprint-001-receipts',
      lane: 'receipt',
      ask: 'Prepare the receipt ledger for lead yield, deal yield, campaign yield, and accepted-work receipts.',
      artifact: 'receipt ledger template',
      status: 'open',
      due: '2026-05-12',
    },
  ],
  operatingCadence: [
    'Every morning: add accounts, send asks, and update the scorecard.',
    'Every sales call: capture buyer pain, budget signal, next action, and objection.',
    'Every pilot artifact: attach a receipt and label yield as lead, deal, campaign, or contribution only.',
    'Every Friday: decide continue, narrow niche, or rewrite the offer.',
  ],
  guardrails: CARTOGRAPHY_BUSINESS.guardrails,
  schemas: cartographyCoreSchemas,
} as const;

export const cartographySprintJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Project',
  '@id': 'https://pointcast.xyz/cartography/sprint#project',
  name: CARTOGRAPHY_NEXT_SPRINT.title,
  url: CARTOGRAPHY_NEXT_SPRINT.human,
  description: CARTOGRAPHY_NEXT_SPRINT.goal.target,
  isPartOf: {
    '@type': 'Service',
    name: CARTOGRAPHY_BUSINESS.title,
    url: CARTOGRAPHY_BUSINESS.homepage,
  },
};
