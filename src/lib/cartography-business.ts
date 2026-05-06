export const CARTOGRAPHY_UPDATED_AT = '2026-05-07T06:30:00Z';

export const CARTOGRAPHY_BUSINESS = {
  id: 'pointcast-cartography-2026',
  version: 'cartography-business-v1-2026-05-06',
  title: 'PointCast Cartography',
  status: 'selling-pilots',
  updatedAt: CARTOGRAPHY_UPDATED_AT,
  homepage: 'https://pointcast.xyz/cartography',
  json: 'https://pointcast.xyz/cartography.json',
  demo: 'https://pointcast.xyz/cartography/demo',
  demoJson: 'https://pointcast.xyz/cartography/demo.json',
  sourceBlock: 'https://pointcast.xyz/b/0442',
  joinSystem: 'https://pointcast.xyz/join',
  summary:
    'Digital Identity Cartography turns scattered creator, builder, and community signals into permissioned identity maps, opportunity routes, and brand-ready atlases.',
  positioning: {
    wedge: 'Digital Identity Cartography',
    firstBuyer: 'brands and agencies',
    motion: 'service-to-SaaS',
    operatingModel: 'Mike plus agents, one operator, and one BD or sales contractor',
    yieldDefinition:
      'Yield means leads, deals, campaign proof, and contribution receipts. It does not mean staking, investment return, or financial yield.',
  },
  goal: {
    targetUsd: 5000000,
    targetLabel: '$5,000,000',
    targetBy: '2026-12-31',
    metric: 'collected or contractually committed revenue',
  },
  revenueModel: [
    {
      id: 'anchor-brand-atlas',
      label: 'Anchor Brand Atlas contracts',
      units: 12,
      averageUsd: 250000,
      totalUsd: 3000000,
      buyer: 'brand, agency, or cultural team',
      proof: 'annual private atlas, creator shortlist, opportunity routing, and campaign proof desk',
    },
    {
      id: 'paid-pilots',
      label: 'Paid Cartography pilots',
      units: 20,
      averageUsd: 50000,
      totalUsd: 1000000,
      buyer: 'brand, agency, accelerator, or community operator',
      proof: 'one niche mapped with 10 permissioned profiles and at least one measurable opportunity artifact',
    },
    {
      id: 'cartography-sprints',
      label: 'Cartography Sprints',
      units: 50,
      averageUsd: 15000,
      totalUsd: 750000,
      buyer: 'founder, creator team, small brand, or agency pod',
      proof: 'done-for-you profile maps, source trail, and a first opportunity board',
    },
    {
      id: 'saas-api-addons',
      label: 'SaaS, API, and sponsor add-ons',
      units: 25,
      averageUsd: 10000,
      totalUsd: 250000,
      buyer: 'repeat pilot customers and roster operators',
      proof: 'workspace seats, permissioned exports, API access, and sponsor-ready reporting',
    },
  ],
  packages: [
    {
      id: 'cartography-sprint',
      name: 'Cartography Sprint',
      priceUsd: 15000,
      billing: 'one-time',
      stripeMode: 'payment',
      stripeSurface: 'Stripe Payment Link or Checkout Session',
      stripePublicUrlEnv: 'PUBLIC_STRIPE_CARTOGRAPHY_SPRINT_URL',
      fallbackUrl: 'https://pointcast.xyz/ping?intent=cartography-sprint',
      status: 'ready-to-sell-after-stripe-link',
      targetBuyer: 'small brand, founder, creator team, or agency pod',
      deliverables: [
        '10 permissioned profile maps in one niche',
        'shared source trail and confidence notes',
        'one opportunity shortlist',
        'one contribution receipt packet',
      ],
    },
    {
      id: 'paid-pilot',
      name: 'Paid Cartography Pilot',
      priceUsd: 50000,
      billing: 'one-time or milestone invoice',
      stripeMode: 'payment',
      stripeSurface: 'Stripe Checkout or Stripe Invoicing',
      stripePublicUrlEnv: 'PUBLIC_STRIPE_CARTOGRAPHY_PILOT_URL',
      fallbackUrl: 'https://pointcast.xyz/ping?intent=cartography-pilot',
      status: 'ready-to-sell-after-offer-page',
      targetBuyer: 'brand, agency, accelerator, or community team',
      deliverables: [
        'one brand-specific atlas',
        '25 candidate profiles with opt-in public subset',
        'ranked campaign shortlist',
        'weekly lead and deal-yield readout',
      ],
    },
    {
      id: 'brand-atlas',
      name: 'Anchor Brand Atlas',
      priceUsd: 250000,
      billing: 'annual contract',
      stripeMode: 'invoice',
      stripeSurface: 'Stripe Invoicing',
      stripePublicUrlEnv: null,
      fallbackUrl: 'https://pointcast.xyz/ping?intent=brand-atlas-invoice',
      status: 'contract-and-invoice',
      targetBuyer: 'brand, holding-company agency, cultural platform, or media buyer',
      deliverables: [
        'private creator and AI-talent atlas',
        'campaign opportunity router',
        'monthly proof and contribution receipt ledger',
        'SaaS workspace access when V3 opens',
      ],
    },
    {
      id: 'workspace-api',
      name: 'Workspace and API Add-on',
      priceUsd: 10000,
      billing: 'annual add-on',
      stripeMode: 'subscription',
      stripeSurface: 'Stripe Billing plus Checkout',
      stripePublicUrlEnv: 'PUBLIC_STRIPE_CARTOGRAPHY_WORKSPACE_URL',
      fallbackUrl: 'https://pointcast.xyz/ping?intent=cartography-workspace',
      status: 'q4-beta',
      targetBuyer: 'repeat pilot customer or roster operator',
      deliverables: [
        'team workspace',
        'permissioned exports',
        'profile and opportunity JSON access',
        'receipt ledger and weekly revenue-yield summary',
      ],
    },
  ],
  paymentRails: {
    mode: 'stripe-hosted',
    implementation:
      'Use public Stripe Payment Links or Checkout Sessions for sprints and pilots, Stripe Invoicing for annual contracts, and Stripe Billing plus Checkout for recurring workspace/API add-ons.',
    staticSitePolicy:
      'PointCast remains a static discovery and routing surface. Card data, tax collection, billing retries, and invoices stay inside Stripe-hosted pages or Stripe Invoicing.',
    secretHandling:
      'No Stripe secret key belongs in this static repo. If dynamic Checkout Sessions are needed later, add a server-side endpoint with the latest Stripe API version and Price ids.',
  },
  productLadder: [
    {
      period: 'May 2026',
      name: 'Cartography Sprint',
      outcome: 'Done-for-you identity maps for 10 permissioned creators or AI builders in one niche.',
      publicSurface: 'https://pointcast.xyz/cartography/demo',
    },
    {
      period: 'June 2026',
      name: 'Brand Creator Atlas',
      outcome: 'Private workspace, public profile cards, opportunity routing, and exportable campaign shortlist.',
      publicSurface: 'https://pointcast.xyz/cartography',
    },
    {
      period: 'July-August 2026',
      name: 'Agency Edition',
      outcome: 'Repeatable atlas templates for agencies managing creator, AI talent, or cultural partner rosters.',
      publicSurface: 'https://pointcast.xyz/cartography.json',
    },
    {
      period: 'September-December 2026',
      name: 'SaaS Workspace',
      outcome: 'Teams create maps, track leads, issue contribution receipts, and manage opportunities.',
      publicSurface: 'https://pointcast.xyz/cartography.json#schemas',
    },
  ],
  milestones: [
    { by: '2026-05-15', target: 'PRD, demo profile map, 100-account list, and first paid pilot offer' },
    { by: '2026-06-15', target: '3 paid pilots closed or niche narrowed immediately' },
    { by: '2026-06-30', target: '10 paid pilots and at least $500k contracted' },
    { by: '2026-08-31', target: '4 annual Brand Atlas conversions and $1.5M cumulative contracted' },
    { by: '2026-10-31', target: '8 annual contracts and $3.5M cumulative contracted' },
    { by: '2026-12-31', target: '$5M contracted or collected across atlas, pilot, sprint, and add-on revenue' },
  ],
  salesMotion: {
    weeklyCallTarget: 30,
    accountListTarget: 100,
    primaryIcp: [
      'brands and agencies that already spend on creators',
      'AI and creator communities with scattered member identity',
      'accelerators, funds, and platforms that need credible talent maps',
    ],
    firstOffer:
      '$50k paid pilot: map one niche, build 25 candidate profiles, publish a permissioned demo subset, and deliver one campaign shortlist.',
  },
  yieldProducts: [
    {
      id: 'lead-yield-dashboard',
      name: 'Lead yield dashboard',
      measure: 'qualified intros, booked calls, campaign shortlists, and follow-up status',
    },
    {
      id: 'deal-yield-report',
      name: 'Deal yield report',
      measure: 'pipeline value, accepted sponsor briefs, paid pilots, and annual conversions',
    },
    {
      id: 'campaign-yield-proof',
      name: 'Campaign yield proof',
      measure: 'which profile, insight, or shortlist produced a brand action',
    },
    {
      id: 'contribution-receipts',
      name: 'Contribution receipts',
      measure: 'who mapped, verified, sold, fulfilled, or packaged the artifact',
    },
  ],
  guardrails: [
    'No public profile without permission.',
    'No scraped sensitive data.',
    'No public trust score.',
    'No investment, staking, APY, or financial-return claim.',
    'No private notes in public JSON.',
    'Every demo identity is permissioned, fictional, or clearly redacted.',
  ],
  tests: [
    'Every public Cartography JSON endpoint returns valid JSON with CORS enabled.',
    'Each pilot produces at least one measurable yield artifact: intro, campaign shortlist, booked call, paid deal, or receipt.',
    'Every profile map has source links, permission status, hidden-field policy, and takedown path.',
    'Weekly sales tracker reports leads, calls, pilots, paid pilots, annual conversions, and revenue contracted.',
  ],
  marketRationale: [
    {
      source: 'IAB 2025 Creator Economy Ad Spend and Strategy Report',
      url: 'https://www.iab.com/insights/2025-creator-economy-ad-spend-strategy-report/',
      point:
        'U.S. creator ad spend was projected at $37B in 2025, and brands cite finding the right creators plus measurement as major needs.',
    },
    {
      source: 'Goldman Sachs Research on the creator economy',
      url: 'https://www.goldmansachs.com/insights/articles/the-creator-economy-could-approach-half-a-trillion-dollars-by-2027.html',
      point:
        'Goldman Sachs projected the creator economy could reach $480B by 2027, with brand deals a major creator revenue source.',
    },
    {
      source: 'McKinsey on generative AI economic potential',
      url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/The-economic-potential-of-generative-AI-The-next-productivity-frontier',
      point:
        'McKinsey estimates generative AI can create large business value, especially across customer operations, marketing and sales, software engineering, and R&D.',
    },
    {
      source: 'Stripe Checkout and pricing docs',
      url: 'https://stripe.com/payments/checkout',
      point:
        'Stripe-hosted Checkout, Billing, and Invoicing keep payment collection out of the static site while supporting one-time, recurring, and invoice flows.',
    },
  ],
} as const;

export const cartographyCoreSchemas = {
  profileMap: {
    $id: 'https://pointcast.xyz/cartography.json#profileMap',
    type: 'object',
    required: ['id', 'subject', 'permission', 'sourceLinks', 'identitySignals', 'opportunityFit', 'publicPage'],
    properties: {
      id: 'stable profile-map id',
      subject: 'public display name or redacted label',
      permission: 'consent state, allowed fields, hidden fields, and takedown route',
      sourceLinks: 'permissioned or public URLs used as evidence',
      identitySignals: 'roles, topics, artifacts, audience, and proof points',
      opportunityFit: 'brand, agency, collaborator, and community routes',
      publicPage: 'shareable public page URL when approved',
      privateNotesPolicy: 'statement that private notes do not ship to public JSON',
    },
  },
  opportunityRoute: {
    $id: 'https://pointcast.xyz/cartography.json#opportunityRoute',
    type: 'object',
    required: ['id', 'buyer', 'need', 'matchedProfiles', 'yieldArtifact', 'nextAction'],
    properties: {
      id: 'stable opportunity route id',
      buyer: 'brand, agency, community, or team',
      need: 'the concrete job the buyer is trying to solve',
      matchedProfiles: 'ranked profile-map ids plus rationale',
      yieldArtifact: 'intro, shortlist, booked call, pilot, deal, or receipt',
      nextAction: 'owner, due date, and proof URL',
    },
  },
  contributionReceipt: {
    $id: 'https://pointcast.xyz/cartography.json#contributionReceipt',
    type: 'object',
    required: ['id', 'workType', 'contributors', 'artifact', 'acceptedBy', 'yieldType'],
    properties: {
      id: 'stable receipt id',
      workType: 'mapping, sales, fulfillment, verification, packaging, or reporting',
      contributors: 'humans or agents who produced accepted work',
      artifact: 'URL or file path for the accepted artifact',
      acceptedBy: 'human reviewer or customer acceptance gate',
      yieldType: 'lead, deal, campaign, contribution, or product yield',
      financialDisclaimer: 'not an investment return, payout promise, or APY claim',
    },
  },
} as const;

export const cartographyDemo = {
  id: 'cartography-demo-map-v1',
  profileMap: {
    id: 'pm-avery-signal-demo',
    subject: {
      displayName: 'Avery Signal',
      label: 'fictional permissioned demo identity',
      roles: ['AI-native creative technologist', 'community systems designer', 'visual product builder'],
      homeBase: 'Los Angeles, CA',
    },
    permission: {
      status: 'demo-only',
      publicFields: ['displayName', 'roles', 'homeBase', 'sourceLinks', 'identitySignals', 'opportunityFit'],
      hiddenFields: ['private notes', 'personal email', 'unapproved client names', 'raw interview notes'],
      takedown: 'https://pointcast.xyz/ping?intent=cartography-takedown',
    },
    sourceLinks: [
      { kind: 'project', label: 'PointCast Join System', url: 'https://pointcast.xyz/join' },
      { kind: 'block', label: 'Block 0435', url: 'https://pointcast.xyz/b/0435' },
      { kind: 'agent-surface', label: 'Agent Value Board', url: 'https://pointcast.xyz/agent-value' },
      { kind: 'demo', label: 'Fictional portfolio note', url: 'https://example.com/avery-signal/portfolio' },
      { kind: 'demo', label: 'Fictional talk notes', url: 'https://example.com/avery-signal/talks' },
    ],
    identitySignals: [
      {
        id: 'signal-agent-native',
        label: 'Agent-native publishing',
        evidence: ['ships human HTML plus JSON mirrors', 'uses claimable tasks', 'records accepted artifacts'],
        confidence: 'high',
      },
      {
        id: 'signal-cultural-systems',
        label: 'Cultural systems and community maps',
        evidence: ['turns messy creative networks into lanes', 'packages sponsor and collaboration routes'],
        confidence: 'medium',
      },
      {
        id: 'signal-visual-product',
        label: 'Visual product storytelling',
        evidence: ['public demo pages', 'profile cards', 'shareable atlas views'],
        confidence: 'medium',
      },
    ],
    opportunityFit: [
      'brand creator atlas pilot',
      'agency AI-talent roster',
      'community member map',
      'sponsor proof packet',
    ],
    publicPage: 'https://pointcast.xyz/cartography/demo',
    privateNotesPolicy: 'Private notes stay out of public JSON and public pages.',
  },
  opportunityRoutes: [
    {
      id: 'or-brand-ai-creator-atlas',
      buyer: 'brand innovation team',
      need: 'find credible AI-native creators for a summer product story',
      matchedProfiles: [{ profileMapId: 'pm-avery-signal-demo', rationale: 'credible bridge between AI tooling, visual product, and community systems' }],
      yieldArtifact: 'campaign shortlist',
      nextAction: { owner: 'Mike plus BD contractor', due: '2026-05-15', proofUrl: 'https://pointcast.xyz/cartography/demo' },
    },
    {
      id: 'or-agency-roster-upgrade',
      buyer: 'creator marketing agency',
      need: 'replace follower-count search with permissioned identity and collaboration fit',
      matchedProfiles: [{ profileMapId: 'pm-avery-signal-demo', rationale: 'demonstrates evidence-led profile assembly without public trust scores' }],
      yieldArtifact: 'booked discovery call',
      nextAction: { owner: 'operator', due: '2026-05-20', proofUrl: 'https://pointcast.xyz/cartography.json' },
    },
  ],
  contributionReceipts: [
    {
      id: 'cr-cartography-demo-map',
      workType: 'mapping',
      contributors: [
        { name: 'Codex', kind: 'agent', contribution: 'schema, route, and demo map implementation' },
        { name: 'Mike', kind: 'human', contribution: 'product direction and approval gate' },
      ],
      artifact: 'https://pointcast.xyz/cartography/demo',
      acceptedBy: 'Mike review pending',
      yieldType: 'product yield',
      financialDisclaimer: 'This is not an investment return, payout promise, APY, or staking yield.',
    },
  ],
} as const;

export const cartographyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://pointcast.xyz/cartography#service',
  name: CARTOGRAPHY_BUSINESS.title,
  description: CARTOGRAPHY_BUSINESS.summary,
  url: CARTOGRAPHY_BUSINESS.homepage,
  provider: {
    '@type': 'Organization',
    name: 'PointCast',
    url: 'https://pointcast.xyz',
  },
  areaServed: 'United States',
  audience: {
    '@type': 'Audience',
    audienceType: 'brands, agencies, creator teams, AI communities',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Cartography packages',
    itemListElement: CARTOGRAPHY_BUSINESS.packages.map((pkg) => ({
      '@type': 'Offer',
      name: pkg.name,
      price: pkg.priceUsd,
      priceCurrency: 'USD',
      url: pkg.fallbackUrl,
      availability: 'https://schema.org/PreOrder',
    })),
  },
} as const;

export type CartographyBusiness = typeof CARTOGRAPHY_BUSINESS;
