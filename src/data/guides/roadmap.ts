/**
 * PointCast Guides roadmap + changelog.
 * `shipped` entries are things that exist today. now/next/later are proposed
 * plans, not commitments; order and scope can change.
 */
export type RoadmapStatus = 'shipped' | 'now' | 'next' | 'later';

export interface RoadmapItem {
  id: string;
  title: string;
  status: RoadmapStatus;
  /** YYYY-MM-DD, shipped items only. */
  shipped?: string;
  summary: string;
}

export interface ChangelogEntry {
  date: string;
  title: string;
  summary: string;
  href?: string;
}

export const ROADMAP: RoadmapItem[] = [
  {
    id: 'launch',
    title: 'Launch',
    status: 'shipped',
    shipped: '2026-10-20',
    summary: '12 guides, the participation ladder and 12 intern assignments.',
  },
  {
    id: 'print-campaign',
    title: 'Print campaign',
    status: 'shipped',
    shipped: '2026-10-20',
    summary: '13 print ads for the network.',
  },
  {
    id: 'intake',
    title: 'Guides Intake',
    status: 'shipped',
    shipped: '2026-10-20',
    summary: 'Bot data collection and intern feedback, with a public API and MCP tools.',
  },
  {
    id: 'jobs-board',
    title: 'Jobs board',
    status: 'shipped',
    shipped: '2026-10-20',
    summary: '25 postings across Guides, Pacific Utility and Internship Lab.',
  },
  {
    id: 'intake-round-2',
    title: 'Intake round 2',
    status: 'shipped',
    shipped: '2026-10-22',
    summary: 'Honest bot task classification, "From contributors" on each guide and intern progress.',
  },
  {
    id: 'six-new-guides',
    title: 'Six new guides and status page',
    status: 'shipped',
    shipped: '2026-10-22',
    summary: 'Six more guides and this public status page.',
  },
  {
    id: 'appoint-first-guides',
    title: 'Appoint the first Guides',
    status: 'now',
    summary:
      'Needs the reviewer key set so material can be reviewed; the first seat claims come in through intake.',
  },
  {
    id: 'guide-rss',
    title: 'Guide-level RSS of accepted material',
    status: 'next',
    summary: 'A feed per guide of accepted contributions.',
  },
  {
    id: 'seat-claim-kind',
    title: 'Seat-claim kind in intake',
    status: 'next',
    summary: 'A dedicated intake kind for claiming a Guide seat.',
  },
  {
    id: 'assignments-new-guides',
    title: 'Intern assignments for the six new guides',
    status: 'next',
    summary: 'Numbered assignments for the guides added on 2026-10-22.',
  },
  {
    id: 'city-editions',
    title: 'Neighborhood and city editions',
    status: 'later',
    summary: 'Editions beyond El Segundo.',
  },
  {
    id: 'guide-cards',
    title: 'Printable guide cards',
    status: 'later',
    summary: 'Cards generated from the ads system.',
  },
  {
    id: 'agent-keys',
    title: 'Agent-verified submissions',
    status: 'later',
    summary: 'Submissions verified with signed PointCast agent keys.',
  },
];

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-10-22',
    title: 'Six new guides and the status page',
    summary:
      'Beach/park cleanup, community garden group, parent booster club, pickleball tournament day, first youth team coach and pickup game, plus this status page.',
    href: '/guides/status',
  },
  {
    date: '2026-10-22',
    title: 'Intake round 2',
    summary: 'Honest bot task classification, "From contributors" on each guide, intern progress.',
    href: '/guides/intake',
  },
  {
    date: '2026-10-20',
    title: 'Jobs board',
    summary: '25 postings (Guides, Pacific Utility, Internship Lab).',
    href: '/jobs/?project=guides',
  },
  {
    date: '2026-10-20',
    title: 'Guides Intake',
    summary: 'Bot data collection and intern feedback, with /guides/intake.json and MCP tools.',
    href: '/guides/intake',
  },
  {
    date: '2026-10-20',
    title: 'Print campaign',
    summary: '13 ads.',
    href: '/guides/ads',
  },
  {
    date: '2026-10-20',
    title: 'Launch',
    summary: '12 guides, participation ladder, 12 intern assignments.',
    href: '/guides',
  },
];
