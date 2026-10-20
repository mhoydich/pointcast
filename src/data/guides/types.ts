/**
 * PointCast Guides — the About.com idea, rebuilt for 2028.
 *
 * One human Guide per topic, a small circle of contributors, agents doing
 * the clerical work, and every page mirrored as JSON. Topics here are
 * local: neighborhoods, community groups, pickleball teams, rec leagues.
 */

export type GuideCategory = 'local' | 'pickleball' | 'sports';

/** Seat states are honest: no guide has been appointed yet. */
export type SeatStatus = 'open' | 'intern-drafting' | 'guide-appointed';

export interface GuideSection {
  heading: string;
  /** Plain-text paragraphs. No invented facts about real people or venues. */
  body: string[];
}

export interface GuideChecklistItem {
  label: string;
  detail: string;
}

export interface Guide {
  slug: string;
  category: GuideCategory;
  title: string;
  /** One-line promise to the reader. */
  dek: string;
  /** Who this guide serves. */
  audience: string;
  seat: SeatStatus;
  /** Reading time in minutes. */
  minutes: number;
  sections: GuideSection[];
  checklist: GuideChecklistItem[];
  /** Things a contributor can send in to improve the guide. */
  wanted: string[];
  /** Related PointCast routes (paths starting with '/'), only ones that exist. */
  related: { label: string; href: string }[];
  tags: string[];
}

export interface InternAssignment {
  id: string; // e.g. "GA-01"
  title: string;
  track: 'reporting' | 'guide-writing' | 'data' | 'design' | 'community' | 'agent-ops';
  /** Guide slug this feeds, or null for network-wide work. */
  guide: string | null;
  weeks: number;
  brief: string;
  deliverables: string[];
  acceptance: string[];
  /** Skills practiced. */
  learns: string[];
  /** Anything that needs Mike's sign-off before it goes public. */
  needsApproval: string | null;
}
