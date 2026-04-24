/**
 * Federation registry — canonical list of federated sites.
 *
 * A federated site is any independent web property that:
 *   1. Publishes a feed (RSS 2.0 or JSON Feed 1.1) PointCast can ingest
 *   2. Optionally publishes `/compute.json` per the compute-ledger-v0 RFC
 *   3. Optionally ships BLOCKS.md-compatible JSON blocks
 *   4. Agrees to link back to pointcast.xyz from their site
 *
 * Growth model: mutual traffic. Federated sites get cross-promotion on
 * PointCast; PointCast gets backlinks + feed ingestion from their sites.
 * Not activitypub/mastodon federation — this is a lightweight reciprocal-
 * links protocol built for content-first partners.
 *
 * To federate: append an entry below, PR it. DAO ratifies new entries.
 * See /federate for the public-facing spec.
 */

export type FederationRole =
  | 'sibling'     // same operator, different property (Good Feels, Sparrow, Magpie)
  | 'partner'     // independent operator, shared audience + reciprocal promotion
  | 'mirror'      // content republisher, attribution-only (Medium/Mirror cross-posts)
  | 'pending';    // in-negotiation — not yet live

export interface FederatedSite {
  /** URL-safe slug for /federated/{slug} if we ever ship per-site pages. */
  slug: string;
  /** Display name. */
  name: string;
  /** Primary URL — always include scheme + host. */
  url: string;
  /** One-line description (~120 chars). Shown on /federated cards. */
  description: string;
  /** Topic tags — editorial overlap. */
  topics: string[];
  /** Relationship type. */
  role: FederationRole;
  /** Operator name (person or org). */
  operator: string;
  /** ISO date since federation. */
  since: string;
  /** Primary feed URL — RSS 2.0 or JSON Feed 1.1 preferred. */
  feed?: string;
  /** Compute-ledger-v0 mirror URL (if published). */
  computeJson?: string;
  /** BLOCKS.md-compatible JSON endpoint, if any. */
  blocksJson?: string;
  /** agents.json-compatible manifest URL, if any. */
  agentsJson?: string;
  /** llms.txt URL, if any. */
  llmsTxt?: string;
  /** Contact email for federation ops. */
  contact?: string;
  /** Twitter / X handle (with or without @). */
  twitter?: string;
  /** Farcaster handle. */
  farcaster?: string;
  /** GitHub username or org. */
  github?: string;
  /** Image for the card (relative to /public or absolute). */
  logo?: string;
  /**
   * Reciprocity verified — did the partner link back to pointcast.xyz?
   * Leave false until confirmed via manual check or webmention.
   */
  reciprocates?: boolean;
  /** Notes for PointCast ops. Shown on /federated as a small footnote. */
  notes?: string;
}

/**
 * Live registry. Entries are ordered by relationship tightness
 * (siblings first, then active partners, then mirrors, then pending).
 * Within a group: most recent federation date first.
 */
export const FEDERATED_SITES: FederatedSite[] = [
  // ── SIBLINGS — same operator, different property ────────────────────────
  {
    slug: 'good-feels',
    name: 'Good Feels',
    url: 'https://shop.getgoodfeels.com',
    description: 'Hemp-derived THC beverage company. Mike is COO. El Segundo HQ. Ships Schema.org product markup federated into CH.GF.',
    topics: ['hemp THC beverage', 'cannabis', 'El Segundo', 'commerce'],
    role: 'sibling',
    operator: 'Mike Hoydich',
    since: '2026-04-18',
    feed: 'https://shop.getgoodfeels.com/feed.xml',
    computeJson: 'https://getgoodfeels.com/compute.json',
    contact: 'mike@getgoodfeels.com',
    logo: '/images/og/og-home-v3.png',
    reciprocates: true,
    notes: 'Shop transactional terms live on getgoodfeels.com; PointCast CH.GF owns founder-story + editorial.',
  },
  {
    slug: 'sparrow',
    name: 'Sparrow',
    url: 'https://pointcast.xyz/sparrow',
    description: 'Hosted PointCast reader client. Blue-hour OKLCH palette, keyboard-first, local-first saved list. v0.4 shipped 2026-04-21.',
    topics: ['reader client', 'RSS', 'keyboard UI', 'PWA'],
    role: 'sibling',
    operator: 'Mike Hoydich',
    since: '2026-04-21',
    feed: 'https://pointcast.xyz/sparrow/feed.xml',
    agentsJson: 'https://pointcast.xyz/sparrow.json',
    reciprocates: true,
    notes: 'Reader sibling to Magpie (publisher). All three — PointCast, Magpie, Sparrow — share the collaborators registry.',
  },
  {
    slug: 'magpie',
    name: 'Magpie',
    url: 'https://pointcast.xyz/magpie',
    description: 'Multi-publisher broadcaster. Compose and ship Blocks to any PointCast-compatible target. macOS app + hosted UI.',
    topics: ['publisher', 'broadcast', 'content composition'],
    role: 'sibling',
    operator: 'Mike Hoydich',
    since: '2026-04-20',
    feed: 'https://pointcast.xyz/magpie/feed.xml',
    reciprocates: true,
    notes: 'Publisher sibling to Sparrow (reader). Both speak the Block primitive.',
  },

  // ── PARTNERS — independent operators ────────────────────────────────────
  // (Empty at launch — pending real onboarding. Add entries here as
  //  partners register via the /federate flow.)

  // ── MIRRORS — attribution-only cross-posts ──────────────────────────────
  // (Empty at launch — populated as we cross-post to Mirror / Paragraph /
  //  Substack / Medium with canonical back to /b/{id}.)

  // ── PENDING — in-negotiation ────────────────────────────────────────────
  // (Empty at launch. Add entries here as conversations progress.)
];

/** Role display labels + colors (used on /federated cards). */
export const ROLE_META: Record<FederationRole, { label: string; accent: string; note: string }> = {
  sibling: { label: 'Sibling',  accent: '#e89a2d', note: 'Same operator, different property.' },
  partner: { label: 'Partner',  accent: '#185FA5', note: 'Independent operator, reciprocal audience.' },
  mirror:  { label: 'Mirror',   accent: '#8A2432', note: 'Attribution-only cross-post.' },
  pending: { label: 'Pending',  accent: '#5F5E5A', note: 'In negotiation — not yet live.' },
};

/** Live-federation count — exposed on /federated and in meta. */
export function liveFederationCount(): number {
  return FEDERATED_SITES.filter((s) => s.role !== 'pending').length;
}

/** Group sites by role, in the order displayed on /federated. */
export function groupByRole() {
  const out: Array<{ role: FederationRole; sites: FederatedSite[] }> = [];
  const order: FederationRole[] = ['sibling', 'partner', 'mirror', 'pending'];
  for (const role of order) {
    const sites = FEDERATED_SITES.filter((s) => s.role === role);
    if (sites.length > 0) out.push({ role, sites });
  }
  return out;
}
