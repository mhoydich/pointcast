import type { Guide, GuideCategory } from './types';
import { LOCAL_GUIDES } from './local';
import { TEAM_GUIDES } from './teams';
import { INTERN_ASSIGNMENTS } from './interns';

export type { Guide, GuideCategory, InternAssignment } from './types';
export { INTERN_ASSIGNMENTS };

export const GUIDES_BASE = 'https://pointcast.xyz/guides';

export const GUIDES: Guide[] = [...LOCAL_GUIDES, ...TEAM_GUIDES];

export const CATEGORIES: { id: GuideCategory; label: string; blurb: string }[] = [
  {
    id: 'local',
    label: 'Local communities',
    blurb: 'Neighborhoods, community groups, newsletters, block parties and the newcomer map.',
  },
  {
    id: 'pickleball',
    label: 'Pickleball teams',
    blurb: 'Starting a team, running ladder night and keeping a team page people actually check.',
  },
  {
    id: 'sports',
    label: 'Sports teams',
    blurb: 'Rec leagues, youth teams, game-day recaps and the informal beach and run clubs.',
  },
];

/**
 * The participation model. About.com's original bet was one paid human
 * Guide per topic. The 2028 version keeps the human at the center and
 * widens the ring around them: readers who correct, contributors who
 * send material, interns who draft, agents who do the filing.
 */
export const LADDER = [
  {
    role: 'Reader',
    does: 'Uses a guide, flags what is wrong or missing.',
    how: 'One-tap “this is out of date” and “add this” on every guide.',
    earns: 'Nothing to sign up for. Corrections are credited by first name if you want.',
  },
  {
    role: 'Contributor',
    does: 'Sends in tips, photos (with consent), schedules, results and local links.',
    how: 'Answer a guide’s “wanted” list. Each accepted item is credited on the guide.',
    earns: 'Byline credit on the guide and a contributor line in its JSON.',
  },
  {
    role: 'Intern',
    does: 'Drafts and fact-checks guides, runs a numbered assignment end to end.',
    how: 'Pick an assignment from the board below. Work in public, hand in to review.',
    earns: 'A portfolio of shipped guides. Educational briefs; no pay or hiring terms are set.',
  },
  {
    role: 'Guide',
    does: 'Owns one topic: keeps it true, sets its voice, approves contributions.',
    how: 'Seats open per guide. A Guide is appointed after a trial month of edits.',
    earns: 'Their name on the topic, edit rights and a say in what the network covers next.',
  },
  {
    role: 'Editor',
    does: 'Keeps the network consistent: style, privacy, corrections, seat appointments.',
    how: 'Mike Hoydich for now. Editors are added as the network grows.',
    earns: 'Responsibility, mostly.',
  },
  {
    role: 'Agent',
    does: 'Clerical work: formatting, link checks, recap drafts from stat sheets, JSON.',
    how: 'Reads /guides.json. Every agent draft goes to a human before it is public.',
    earns: 'Agents never publish, contact people or appoint anyone.',
  },
];

export const RULES = [
  'One human Guide per topic. The Guide’s name is on it and they answer for it.',
  'Every guide has a human page and a JSON mirror at the same address plus .json.',
  'Nothing about a real person goes up without their consent. Minors: first names only, no faces without a guardian’s yes.',
  'Corrections are public, dated and kept. A guide shows when it was last checked.',
  'Agents draft and file. Humans decide, publish and talk to people.',
  'Local first: a guide is written for a place and a group, not for search traffic.',
];

export const THEN_AND_NOW = [
  { then: 'About.com, 1997–2017', now: 'PointCast Guides, 2028' },
  { then: 'One Guide per topic, national audience', now: 'One Guide per topic, one town or one team' },
  { then: 'Pages tuned for search and banner ads', now: 'Pages tuned for the people who show up on Tuesday' },
  { then: 'Forums beside the article', now: 'A contributor ring and a wanted list inside the guide' },
  { then: 'Guide writes everything', now: 'Guide decides; contributors, interns and agents help' },
  { then: 'HTML for readers', now: 'HTML for readers, JSON for agents, same address' },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guidesInCategory(category: GuideCategory): Guide[] {
  return GUIDES.filter((g) => g.category === category);
}

export function assignmentsForGuide(slug: string) {
  return INTERN_ASSIGNMENTS.filter((a) => a.guide === slug);
}

export function guideJson(g: Guide) {
  return {
    ...g,
    url: `${GUIDES_BASE}/${g.slug}`,
    json: `${GUIDES_BASE}/${g.slug}.json`,
    assignments: assignmentsForGuide(g.slug).map((a) => a.id),
  };
}

export function buildGuidesManifest() {
  return {
    name: 'PointCast Guides',
    tagline: 'About.com, rebuilt for 2028: local guides with a human at the center.',
    status: 'launched; all Guide seats open',
    published: '2026-10-20',
    url: GUIDES_BASE,
    json: `${GUIDES_BASE}.json`,
    rules: RULES,
    participation: LADDER,
    categories: CATEGORIES.map((c) => ({ ...c, guides: guidesInCategory(c.id).map((g) => g.slug) })),
    guides: GUIDES.map((g) => ({
      slug: g.slug,
      category: g.category,
      title: g.title,
      dek: g.dek,
      seat: g.seat,
      url: `${GUIDES_BASE}/${g.slug}`,
      json: `${GUIDES_BASE}/${g.slug}.json`,
    })),
    internAssignments: INTERN_ASSIGNMENTS,
    internNote:
      'Educational project briefs. Applications are not open; pay, hours and hiring entity are not set. See https://pointcast.xyz/intern.json.',
    agentProtocol: {
      read: 'Read freely. Each guide has a JSON mirror.',
      write: 'Agents may draft for human review only. Do not publish, contact people, or claim a Guide seat.',
    },
  };
}
