import { BOOK_CHAPTERS } from './digital-pets-book.ts';
import { DIGITAL_PETS_PROMO_META } from './digital-pets-promo.ts';

export const DIGITAL_PETS_OFFICE_META = {
  schema: 'pointcast.digital-pets-office/v1',
  title: 'The Animal After the Internet — six-week office',
  description:
    'The live operating plan, editorial read loop, scorecard, roles, and decision gates for PointCast Future Book 001.',
  route: '/digital-pets/office',
  jsonRoute: '/digital-pets/office.json',
  campaignRoute: '/digital-pets/share',
  bookRoute: '/digital-pets',
  startsOn: '2026-07-27',
  endsOn: '2026-09-04',
  cadence: 'Tuesday and Thursday',
  pieces: 12,
  weeks: 6,
  updatedAt: '2026-07-27T20:05:00-07:00',
  operatingClaim: 'The launch is not the test. The read-and-reaction loop is the test.',
} as const;

export const DIGITAL_PETS_LAUNCH_EVIDENCE = {
  status: DIGITAL_PETS_PROMO_META.status,
  channel: DIGITAL_PETS_PROMO_META.launchChannel,
  account: DIGITAL_PETS_PROMO_META.launchAccount,
  url: DIGITAL_PETS_PROMO_META.launchUrl,
  launchedAt: DIGITAL_PETS_PROMO_META.launchedAt,
  posts: DIGITAL_PETS_PROMO_META.launchPosts,
  canonicalBook: 'https://pointcast.xyz/digital-pets',
} as const;

export const DIGITAL_PETS_NEXT_ACTIONS = [
  {
    id: 'launch-thread',
    status: 'complete',
    due: 'Mon Jul 27',
    owner: 'Michael + Codex',
    action: 'Publish and verify the seven-post X launch thread.',
    evidence: DIGITAL_PETS_PROMO_META.launchUrl,
  },
  {
    id: 'five-notes',
    status: 'next',
    due: 'Tue Jul 28',
    owner: 'Michael',
    action: 'Choose five people and send the chapter-specific note that matches each reader.',
    evidence: '/digital-pets/share#copy',
  },
  {
    id: 'architecture-signal',
    status: 'queued',
    due: 'Wed Jul 29',
    owner: 'PointCast desk',
    action: 'Publish “Personality must survive Wi‑Fi” as the first standalone signal.',
    evidence: '/digital-pets/share#copy',
  },
  {
    id: 'graveyard-signal',
    status: 'queued',
    due: 'Thu Jul 30',
    owner: 'PointCast desk',
    action: 'Publish the graveyard question and invite personal stories rather than applause.',
    evidence: '/digital-pets#every-digital-pet-needs-a-graveyard',
  },
  {
    id: 'first-read',
    status: 'queued',
    due: 'Fri Jul 31',
    owner: 'Michael + Codex',
    action: 'Record replies, DMs, saves, chapter clicks, and the first editorial read.',
    evidence: '/digital-pets/office#scorecard',
  },
] as const;

export const DIGITAL_PETS_ROLES = [
  {
    name: 'Michael Hoydich',
    role: 'Originator + editor',
    owns: [
      'The position, the voice, and every kill or reorder decision',
      'One concrete specification, scene, or story before each dispatch',
      'A one-line reaction after reading each dispatch',
      'Weekly reporting of replies, DMs, saves, and invitations',
    ],
  },
  {
    name: 'Codex / OpenAI',
    role: 'Production + instrumentation',
    owns: [
      'Question prompts, drafts, social compression, art direction, and implementation',
      'Human and machine-readable publishing surfaces',
      'Reaction logging, scorecard maintenance, testing, and release verification',
      'Pausing production after two consecutive unread dispatches',
    ],
  },
  {
    name: 'Sol / ChatGPT',
    role: 'Editorial system credit',
    owns: [
      'The initial twelve-position arc and read-loop structure',
      'Protecting origination and curation as the test variable',
      'No claim to Michael’s first-person experience or private product knowledge',
    ],
  },
  {
    name: 'Readers',
    role: 'Signal, not focus group',
    owns: [
      'Specific replies, objections, memories, saves, and invitations',
      'Evidence about which claims travel',
      'No authority to flatten the voice into consensus',
    ],
  },
] as const;

const weekConfig = [
  {
    week: 1,
    dates: ['Tue Jul 28', 'Thu Jul 30'],
    focus: 'Creature before interface',
    origination:
      'Michael supplies one lived digital-pet memory and one physical limit that makes a creature believable.',
    review: 'Which claim earns curiosity without the reader needing category context?',
  },
  {
    week: 2,
    dates: ['Tue Aug 4', 'Thu Aug 6'],
    focus: 'Manufacturing and the shelf',
    origination:
      'Michael supplies one BOM-level choice and one sales-channel observation that is not generic web knowledge.',
    review: 'Did concrete manufacturing or retail detail change how seriously readers took the thesis?',
  },
  {
    week: 3,
    dates: ['Tue Aug 11', 'Thu Aug 13'],
    focus: 'The ownership architecture',
    origination:
      'Michael supplies the minimum viable offline self and the exact memory object a household should be able to carry.',
    review: 'Mid-test review: are architecture and custody outperforming the softer cultural claims?',
  },
  {
    week: 4,
    dates: ['Tue Aug 18', 'Thu Aug 20'],
    focus: 'Consequence and authored IP',
    origination:
      'Michael supplies one refusal behavior and one concrete edition or hardware-roadmap example.',
    review: 'Do readers understand consequence as emotional design and editions as publishing?',
  },
  {
    week: 5,
    dates: ['Tue Aug 25', 'Thu Aug 27'],
    focus: 'Economics and mortality',
    origination:
      'Michael supplies the acceptable recurring-revenue line and what the company owes when it dies first.',
    review: 'Does the graveyard create stories, objections, or invitations that the business-model claim does not?',
  },
  {
    week: 6,
    dates: ['Tue Sep 1', 'Thu Sep 3'],
    focus: 'Culture and the continuing creature',
    origination:
      'Michael supplies one scene of moral learning and the reason a single authored creature deserves a long life.',
    review: 'Verdict memo: did Michael-originated curation outperform generic AI content, and is there a print/media path?',
  },
] as const;

export const DIGITAL_PETS_WEEKS = weekConfig.map((config) => ({
  ...config,
  dispatches: BOOK_CHAPTERS.filter((chapter) => chapter.week === config.week).map((chapter, index) => ({
    number: chapter.number,
    date: config.dates[index],
    title: chapter.title,
    claim: chapter.claim,
    path: `/digital-pets#${chapter.slug}`,
    status: 'queued',
  })),
}));

export const DIGITAL_PETS_READ_LOOP = {
  before:
    'Ask no more than three questions. Extract Michael’s position, one concrete detail, and the line he refuses to soften.',
  publish:
    'One dispatch, one X-sized signal, one art plate, one human page, and one machine-readable update.',
  after:
    'Michael reads the dispatch and gives one line: stronger, weaker, wrong, or the missing sentence.',
  stopRule:
    'If Michael skips reading two dispatches in a row, production pauses. An unread series cannot test authored curation.',
  resumeRule:
    'Resume only after the missing reactions are logged or Michael explicitly kills those dispatches.',
} as const;

export const DIGITAL_PETS_DECISION_GATES = [
  {
    when: 'Fri Aug 14 · Week 3',
    name: 'Mid-test review',
    decision:
      'Keep, reorder, or kill the second-half sequence based on claim-specific replies, saves, DMs, and Michael’s own reactions.',
    questions: [
      'Are architecture and custody the clear center of gravity?',
      'Which concrete detail could only have come from Michael?',
      'Is the audience responding to the creature, the ownership thesis, or both?',
    ],
  },
  {
    when: 'Fri Sep 4 · Week 6',
    name: 'Verdict memo',
    decision:
      'Choose the next form: stop, revise, print, serialize a second future book, or develop a media/product partnership.',
    questions: [
      'Did originated curation beat generic AI fluency?',
      'Which three chapters deserve print treatment?',
      'Did the work attract readers, collaborators, or product conversations worth continuing?',
    ],
  },
] as const;

export const DIGITAL_PETS_SCORECARD = DIGITAL_PETS_WEEKS.flatMap((week) =>
  week.dispatches.map((dispatch) => ({
    piece: dispatch.number,
    week: week.week,
    date: dispatch.date,
    title: dispatch.title,
    url: dispatch.path,
    status: dispatch.status,
    michaelReaction: null,
    externalSignal: null,
    editorialRead: null,
  })),
);

export const DIGITAL_PETS_MEASUREMENT_RULES = [
  'Count claim-specific replies, not generic congratulations.',
  'Record DMs and saves only from Michael’s manual report; do not invent invisible analytics.',
  'Separate chapter-deep traffic from cover-page traffic.',
  'Tag invitations by kind: hardware, architecture, culture, publishing, or print.',
  'Write the editorial read before changing the next dispatch.',
] as const;
