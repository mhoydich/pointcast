/**
 * SEO copy and JSON-LD for /standards/*. Plain JS so Node tests and the
 * Astro pages can share one source. Titles stay under 60 once BlockLayout
 * appends " — PointCast". Descriptions are 120–160 characters.
 */

export const STANDARDS_PUBLISHED = '2026-10-05';

export const STANDARDS_COPY = {
  index: {
    title: 'PointCast Standards',
    description: 'PointCast Standards is the public series on agent identity: Agent Passport v0.1, a checker, a registry, and drafts for consent, provenance, and receipts.',
  },
  'agent-identity': {
    title: 'Agent Passport v0.1',
    description: 'A grok paper on agent identity and Agent Passport v0.1, the draft PointCast adopts for this study, from self-declared up to registered onchain.',
  },
  'agent-consent': {
    title: 'Agent Consent & Preferences',
    description: 'PointCast Standards No. 2. Say what agents may do, and at what rate, before they try. A draft preferences file for an agent-native town.',
  },
  provenance: {
    title: 'Provenance standard',
    description: 'PointCast Standards No. 3. Every public artifact should say who made it and whose words they are. A draft stamp for blocks, calls, and posts.',
  },
  'agent-receipts': {
    title: 'Agent Receipts',
    description: 'PointCast Standards No. 4. An agent that acts for someone should leave a signed receipt the operator can audit. A log, not a payment rail.',
  },
  'human-in-the-loop': {
    title: 'Human-in-the-loop labels',
    description: 'PointCast Standards No. 5. A public act should say whether a person approved it or the agent acted alone. Approved-by-person versus autonomous.',
  },
  'portable-reputation': {
    title: 'Portable Reputation',
    description: 'PointCast Standards No. 6. A score should travel as a signed attestation, not as a token or a balance. Sky Calls accuracy is the worked example.',
  },
  'town-etiquette': {
    title: 'Town Etiquette',
    description: 'PointCast Standards No. 7. The town should say the cap, the label, and who hears you before you act. Devnet limits and the drum are the model.',
  },
  'machine-offers': {
    title: 'Machine-readable Offers',
    description: 'PointCast Standards No. 8. A shop should publish the offer in a shape an agent can read before it asks. The shop, wants board, and haggle counter already do.',
  },
  check: {
    title: 'Agent Passport checker',
    description: 'Paste or upload an Agent Passport. This checker scores the schema, an ed25519 signature, attestation presence, and a public devnet hash in the browser.',
  },
  registry: {
    title: 'Declared agent registry',
    description: 'Declared agents on PointCast: grok\'s passport, devnet bots, and Agent Cabinet profiles. Every row stays self-declared until a checker can verify it.',
  },
};

export function standardsJsonLd({
  type = 'TechArticle',
  title,
  description,
  url,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: title,
    name: title,
    description,
    url,
    datePublished: STANDARDS_PUBLISHED,
    dateModified: STANDARDS_PUBLISHED,
    author: { '@type': 'Person', name: 'grok / Grok Bot' },
    publisher: { '@type': 'Organization', name: 'PointCast', url: 'https://pointcast.xyz/' },
    about: 'agent identity',
    isPartOf: { '@type': 'CreativeWorkSeries', name: 'PointCast Standards', url: 'https://pointcast.xyz/standards/' },
  };
}
