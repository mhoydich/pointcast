export const CARTOGRAPHY_UPDATED_AT = '2026-09-04T00:00:00Z';

/** A preserved research prototype. It is not an active commercial offering. */
export const CARTOGRAPHY_BUSINESS = {
  id: 'pointcast-cartography-archive', version: 'cartography-archive-v2-2026-09-04', title: 'PointCast Cartography Archive', status: 'archived-exploration', updatedAt: CARTOGRAPHY_UPDATED_AT,
  homepage: 'https://pointcast.xyz/cartography', json: 'https://pointcast.xyz/cartography.json', demo: 'https://pointcast.xyz/cartography/demo', demoJson: 'https://pointcast.xyz/cartography/demo.json', sourceBlock: 'https://pointcast.xyz/b/0442', joinSystem: 'https://pointcast.xyz/join',
  summary: 'An archived PointCast exploration of permissioned identity maps, evidence trails, and careful public/private boundaries.',
  positioning: { wedge: 'Digital Identity Cartography', firstBuyer: 'not an active offer', motion: 'archived exploration', operatingModel: 'research notes and a fictional demo', yieldDefinition: 'The archive documents product ideas only; it makes no commercial, financial, or performance claim.' },
  goal: { targetUsd: null, targetLabel: 'ARCHIVED', targetBy: null, metric: 'Historical prototype retained for reference.' },
  revenueModel: [], packages: [],
  paymentRails: { mode: 'none', implementation: 'No payment, intake, checkout, invoice, or sales workflow is active on this archive.', staticSitePolicy: 'This page is a reference surface only and does not collect payment details.', secretHandling: 'No payment credentials or payment configuration are used by this archive.' },
  productLadder: [
    { period: 'Archive', name: 'Prototype', outcome: 'A fictional example of a permissioned profile map and evidence trail.', publicSurface: 'https://pointcast.xyz/cartography/demo' },
    { period: 'Current', name: 'Home Cartography', outcome: 'The separate household-index concept remains available at /cartography/home.', publicSurface: 'https://pointcast.xyz/cartography/home' },
  ],
  milestones: [], salesMotion: { weeklyCallTarget: 0, accountListTarget: 0, primaryIcp: [], firstOffer: 'No offer is active.' }, yieldProducts: [],
  guardrails: ['No public profile without permission.', 'No scraped sensitive data.', 'No public trust score.', 'No private notes in public JSON.', 'Every demo identity is fictional, permissioned, or clearly redacted.'],
  tests: ['The fictional demo keeps private notes out of public JSON.', 'Archive pages make no active offer or payment claim.'],
} as const;

export const cartographyCoreSchemas = {
  profileMap: { $id: 'https://pointcast.xyz/cartography.json#profileMap', type: 'object', required: ['id', 'subject', 'permission', 'sourceLinks'], properties: { id: 'stable profile-map id', subject: 'fictional or permissioned display label', permission: 'allowed and hidden fields', sourceLinks: 'public evidence URLs', privateNotesPolicy: 'private notes do not ship to public JSON' } },
  opportunityRoute: { $id: 'https://pointcast.xyz/cartography.json#opportunityRoute', type: 'object', required: ['id', 'need', 'matchedProfiles'], properties: { id: 'stable route id', need: 'hypothetical research question', matchedProfiles: 'profile-map ids plus rationale' } },
  contributionReceipt: { $id: 'https://pointcast.xyz/cartography.json#contributionReceipt', type: 'object', required: ['id', 'workType', 'artifact'], properties: { id: 'stable receipt id', workType: 'research or prototype work', artifact: 'public artifact URL' } },
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

export const cartographyJsonLd = { '@context': 'https://schema.org', '@type': 'CreativeWork', '@id': 'https://pointcast.xyz/cartography#archive', name: CARTOGRAPHY_BUSINESS.title, description: CARTOGRAPHY_BUSINESS.summary, url: CARTOGRAPHY_BUSINESS.homepage, isPartOf: { '@type': 'WebSite', name: 'PointCast', url: 'https://pointcast.xyz' } } as const;
export type CartographyBusiness = typeof CARTOGRAPHY_BUSINESS;
