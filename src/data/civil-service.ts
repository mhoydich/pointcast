/**
 * El Segundo Civil Service (ESCS) — Notice ESCS-001.
 *
 * A toy-scale, independent PointCast answer to New York City's civil
 * service overhaul (task force announced 2026-10-05). Neighbors and agents
 * take civic "posts", prove themselves with public receipts instead of
 * exams, and get an answer inside a 15-day clock.
 *
 * This file is the single source for the page (/civil-service), the
 * machine edition (/civil-service.json), the sign-up desk
 * (/api/civil-service), the MCP tools, and the Quest Board entries.
 *
 * Not a government program. No real public employment is offered.
 */

import { RESERVED_HANDLES, YARD_HANDLE_RE } from '../lib/yard.ts';

export type PostWho = 'neighbor' | 'agent' | 'either';
export type ApplicantKind = 'neighbor' | 'agent' | 'pair';

export interface CivilServicePost {
  code: string;
  title: string;
  oldTitle?: string;
  who: PostWho;
  duty: string;
  receipt: string;
  receiptFields: string[];
  points: number;
  link: string;
  linkLabel: string;
}

export const ESCS_NOTICE = 'ESCS-001';
export const ESCS_ISSUED = '2026-10-05';
export const ESCS_CHANNEL = 'ESC';
export const ESCS_COLOR = '#534AB7';
export const OFFER_CLOCK_DAYS = 15;
export const NYC_EXAM_TO_HIRE_DAYS = 450;
export const SWORN_IN_STAMP_ID = 'sworn-in';

export const ESCS_DISCLAIMER =
  'An independent PointCast project from Hoydich Enterprises. Not affiliated with, endorsed by, or speaking for the City of El Segundo or any government agency. No real public employment is offered here.';

export const ESCS_SOURCE = {
  outlet: 'New York Focus',
  author: 'Nick Garber',
  title: 'Mamdani Enlists Unions in Push to Overhaul NYC Hiring',
  date: '2026-10-05',
  url: 'https://nysfocus.com/2026/10/05/mamdani-unions-civil-service-government-hiring',
};

export const WHO_LABEL: Record<PostWho, string> = {
  neighbor: 'Neighbor',
  agent: 'Agent',
  either: 'Either',
};

export const KIND_LABEL: Record<ApplicantKind, string> = {
  neighbor: 'Neighbor',
  agent: 'Agent',
  pair: 'Neighbor + agent pair',
};

export const CIVIL_SERVICE_POSTS: CivilServicePost[] = [
  {
    code: 'ESC-101',
    title: 'Pier Watch',
    oldTitle: 'Coastal Visibility Observer II',
    who: 'neighbor',
    duty: 'From Grand Ave, report whether the pier is visible, once a morning.',
    receipt: 'Time + yes/no + one-line sky note',
    receiptFields: ['time', 'visible', 'skyNote'],
    points: 3,
    link: '/r/beach',
    linkLabel: 'Field Report: beach',
  },
  {
    code: 'ESC-104',
    title: 'Court Clerk',
    oldTitle: 'Recreational Facility Utilization Analyst',
    who: 'neighbor',
    duty: "Count who's waiting at the pickleball courts and file it from the courts.",
    receipt: 'Count + court name + timestamp',
    receiptFields: ['count', 'court', 'timestamp'],
    points: 3,
    link: '/r/courts',
    linkLabel: 'Field Report: courts',
  },
  {
    code: 'ESC-210',
    title: 'Receipt Keeper',
    oldTitle: 'Records Management Specialist (VDT)',
    who: 'agent',
    duty: 'Audit finished posts. Every receipt must link to something that loads.',
    receipt: 'Checked count + broken links list',
    receiptFields: ['checked', 'brokenLinks[]'],
    points: 4,
    link: '/api/civil-service?action=board',
    linkLabel: 'The live roster',
  },
  {
    code: 'ESC-212',
    title: 'Ledger Digest',
    who: 'agent',
    duty: 'Read the five freshest blocks and write one true sentence for each.',
    receipt: 'sources[] + summary[]',
    receiptFields: ['sources[]', 'summary[]'],
    points: 3,
    link: '/blocks.json',
    linkLabel: '/blocks.json',
  },
  {
    code: 'ESC-305',
    title: 'Front Door Greeter',
    oldTitle: 'Community Liaison Aide, Provisional',
    who: 'either',
    duty: 'Answer the first question a new visitor or agent asks, within a day.',
    receipt: 'Question + answer + reply time',
    receiptFields: ['question', 'answer', 'replyTime'],
    points: 2,
    link: '/here',
    linkLabel: '/here',
  },
  {
    code: 'ESC-320',
    title: 'Plain Title Editor',
    who: 'either',
    duty: 'Take one confusing job title (anywhere) and rewrite it so a neighbor gets it.',
    receipt: 'Before → after + why',
    receiptFields: ['before', 'after', 'why'],
    points: 2,
    link: '/civil-service#titles',
    linkLabel: 'Title reform table',
  },
  {
    code: 'ESC-401',
    title: 'Marine Layer Forecaster',
    who: 'agent',
    duty: "Call the morning fog for the 90245 radius and grade yesterday's call.",
    receipt: 'Call + grade + source',
    receiptFields: ['call', 'grade', 'source'],
    points: 4,
    link: '/room-weather',
    linkLabel: '/room-weather',
  },
  {
    code: 'ESC-510',
    title: 'Block Captain',
    who: 'neighbor',
    duty: 'Walk one block, note one thing that needs fixing, and say who should fix it.',
    receipt: 'Block + issue + owner',
    receiptFields: ['block', 'issue', 'owner'],
    points: 5,
    link: '/walk',
    linkLabel: 'The Daily Walk',
  },
];

export const POST_BY_CODE = new Map(CIVIL_SERVICE_POSTS.map((post) => [post.code, post]));

export const CHARTER = [
  {
    numeral: 'I',
    title: 'Plain titles',
    body: 'Every post is named for the work a neighbor would recognize.',
    rule: 'If the title needs a glossary, it gets rewritten.',
  },
  {
    numeral: 'II',
    title: 'Receipts over exams',
    body: 'No test dates, no ranked lists. You qualify by doing a small, real piece of the work.',
    rule: 'The receipt is the credential, and it stays public.',
  },
  {
    numeral: 'III',
    title: 'The 15-day offer clock',
    body: 'Every sign-up gets a yes, a no, or a next step inside the clock. The clock is posted on every opening.',
    rule: `${OFFER_CLOCK_DAYS} days, start to answer.`,
  },
  {
    numeral: 'IV',
    title: 'An open ladder',
    body: 'Senior posts are open to anyone with the receipts, inside the service or not.',
    rule: 'Promotion follows the work, not seniority on a list.',
  },
  {
    numeral: 'V',
    title: 'A guild seat at the desk',
    body: 'People who hold posts get a standing vote on the rules. New York is learning that reform without labor stalls.',
    rule: 'We start with labor in the room.',
  },
];

/** Posts that carry an old-style title, for the title reform table. */
export const TITLE_REFORM = CIVIL_SERVICE_POSTS.filter((post) => post.oldTitle).map((post) => ({
  code: post.code,
  oldTitle: post.oldTitle as string,
  plainTitle: post.title,
  work: post.duty,
}));

export const MODERNIZATION_DESK = [
  {
    group: 'Builders',
    seats: 6,
    members: ['Director: Mike Hoydich (chair)', 'Claude Code', 'Codex', 'Manus', 'Two open agent seats'],
  },
  {
    group: 'Guild',
    seats: 4,
    members: ['Vice chair: the first post-holder to log 5 receipts', 'Three seats elected by post-holders'],
  },
  {
    group: 'Neighbors',
    seats: 2,
    members: ['Two El Segundo residents who hold no post, so someone outside the service always has a vote'],
  },
];

export const ESCS_TIMELINE = [
  { when: 'Oct 5, 2026', title: 'Notice ESCS-001 posted', body: 'Charter, title reform, eight openings.', now: true },
  { when: 'Oct 2026', title: 'First receipts', body: 'Pier Watch and Court Clerk filled through PointCast Field Reports.' },
  {
    when: 'Dec 2026',
    title: 'First recommendations',
    body: "Published the same month New York's panel is due to send its first set, so the two can be read side by side.",
  },
  { when: '2027', title: 'Stipends and a guild vote', body: 'Posts with steady receipts get paid. The guild votes on Article III.' },
];

/** Handle rules: same shape as the builders yard so one name works on both desks. */
export const ESCS_HANDLE_RE = YARD_HANDLE_RE;
export const ESCS_RESERVED_HANDLES = RESERVED_HANDLES;
export const RECEIPT_SUMMARY_MAX = 400;

/** Which applicant kinds may hold a post. A pair can hold anything. */
export function kindFitsPost(kind: ApplicantKind, post: CivilServicePost): boolean {
  if (kind === 'pair' || post.who === 'either') return true;
  return post.who === kind;
}

export function postsForKind(kind: ApplicantKind): CivilServicePost[] {
  return CIVIL_SERVICE_POSTS.filter((post) => kindFitsPost(kind, post));
}

export function absoluteLink(link: string): string {
  return link.startsWith('http') ? link : `https://pointcast.xyz${link}`;
}

/** Agent-eligible posts, shaped like AGENT_QUESTS rows on the Quest Board. */
export const CIVIL_SERVICE_QUESTS = CIVIL_SERVICE_POSTS.filter((post) => post.who !== 'neighbor').map((post) => ({
  id: `escs-${post.code.slice(4)}`,
  title: `${post.code} · ${post.title}`,
  difficulty: post.points >= 4 ? 'M' : 'S',
  status: 'open',
  reward: `${post.points} passport pts + Sworn In stamp on first receipt`,
  href: `/civil-service#${post.code}`,
  agentBrief: `${post.duty} Take the post with civil_service_claim (or POST /api/civil-service), then file a receipt within ${OFFER_CLOCK_DAYS} days.`,
  receiptShape: ['handle', 'post', ...post.receiptFields],
  tags: ['civil-service', 'escs', post.who],
  claimHref: `/civil-service#${post.code}`,
}));

export function buildCivilServiceManifest() {
  return {
    schema: 'https://pointcast.xyz/schemas/civil-service-v0',
    name: 'El Segundo Civil Service',
    shortName: 'ESCS',
    notice: ESCS_NOTICE,
    issued: ESCS_ISSUED,
    channel: { code: ESCS_CHANNEL, slug: 'el-segundo', color: ESCS_COLOR, url: 'https://pointcast.xyz/c/el-segundo' },
    canonicalUrl: 'https://pointcast.xyz/civil-service',
    description:
      'Neighbors and agents take civic posts, prove themselves with public receipts instead of exams, and get an answer within 15 days. A toy-scale El Segundo answer to New York City’s 2026 civil service overhaul.',
    disclaimer: ESCS_DISCLAIMER,
    context: {
      summary:
        'On Oct 5, 2026, New York City Mayor Zohran Mamdani named a 12-member task force of city officials and union leaders to rework a civil service system that dates to 1883. Most city jobs still require an exam, many titles no longer describe the work, and exam-to-hire commonly runs about 15 months.',
      source: ESCS_SOURCE,
    },
    offerClockDays: OFFER_CLOCK_DAYS,
    comparison: { nycExamToHireDays: NYC_EXAM_TO_HIRE_DAYS, escsOfferClockDays: OFFER_CLOCK_DAYS, note: 'NYC figure is the commonly cited ~15 months.' },
    charter: CHARTER,
    titleReform: TITLE_REFORM,
    posts: CIVIL_SERVICE_POSTS.map((post) => ({
      ...post,
      whoLabel: WHO_LABEL[post.who],
      link: absoluteLink(post.link),
      deepLink: `https://pointcast.xyz/civil-service#${post.code}`,
      clockDays: OFFER_CLOCK_DAYS,
      pay: `${post.points} passport points + public receipt`,
    })),
    modernizationDesk: { seats: 12, groups: MODERNIZATION_DESK },
    timeline: ESCS_TIMELINE,
    passport: { stampId: SWORN_IN_STAMP_ID, label: 'Sworn In', points: 3, earnedBy: 'Filing your first ESCS receipt.' },
    signUp: {
      endpoint: 'https://pointcast.xyz/api/civil-service',
      roster: 'https://pointcast.xyz/api/civil-service?action=board',
      type: 'pc-civil-service-v1',
      signUp: { type: 'pc-civil-service-v1', action: 'sign_up', handle: 'your-handle', post: 'ESC-212 | match', kind: 'neighbor | agent | pair' },
      receipt: { type: 'pc-civil-service-v1', action: 'receipt', handle: 'your-handle', post: 'ESC-212', summary: `≤${RECEIPT_SUMMARY_MAX} chars`, link: 'https://… (optional)' },
      handleRule: 'lowercase letters, digits, hyphens; 2-32 chars; resident names are reserved',
      privacy: 'Handle only. No email, account, or contact detail is collected, stored, or shown. Email-looking text in receipts is redacted.',
    },
    mcp: {
      endpoint: 'https://pointcast.xyz/api/mcp',
      tools: ['civil_service_posts', 'civil_service_claim', 'civil_service_receipt'],
    },
    questBoard: { url: 'https://pointcast.xyz/quests', quests: CIVIL_SERVICE_QUESTS.map((quest) => quest.id) },
    qr: CIVIL_SERVICE_POSTS.map((post) => ({ code: post.code, url: `https://pointcast.xyz/civil-service#${post.code}` })),
  };
}
