/**
 * PointCast Daily email scheduler contract.
 *
 * This is the shared source for /email-scheduler, /email-scheduler.json,
 * and the operator docs. The sending worker has its own tiny renderer so
 * it can deploy independently from the Astro site, but it follows this
 * schedule and section contract.
 */
import { todayPT } from './daily';

export const POINTCAST_DAILY_EMAIL_SCHEDULER_VERSION = 'v0.2.0';
export const POINTCAST_DAILY_WIRE_VERSION = 'v0.2.0';
export const POINTCAST_DAILY_EMAIL_CREATED_AT = '2026-04-30';

export const POINTCAST_DAILY_EMAIL_SCHEDULE = {
  cronUtc: '30 16 * * *',
  utcLabel: '16:30 UTC daily',
  localLabel: '9:30 AM America/Los_Angeles on April 30, 2026',
  timezone: 'America/Los_Angeles',
  note:
    'Cloudflare cron is UTC. 16:30 UTC maps to 9:30 AM Pacific Daylight Time on April 30, 2026; adjust the cron in winter if a fixed Pacific wall-clock send matters.',
} as const;

export const POINTCAST_DAILY_EMAIL_SOURCES = [
  {
    id: 'nouns-nation-battler',
    label: 'Nouns Nation Battler',
    human: '/nouns-nation-battler-v3/',
    json: '/nouns-nation-battler.json',
    cadence: 'daily lead story',
    coverage:
      'Season recap archive, MVP board, Season 6 sprint room, Builder Circuit rival-league watch, and live Battle Desk links.',
  },
  {
    id: 'nouns-nation',
    label: 'Nouns Nation',
    human: '/nouns-nation/',
    json: '/nouns-nation.json',
    cadence: 'federation desk',
    coverage:
      'Bring-your-own nation/team/gang/club/crew/DAO intake, federation levels, roadmap, and proof requirements.',
  },
  {
    id: 'blocks',
    label: 'PointCast Blocks',
    human: '/archive',
    json: '/blocks.json',
    cadence: 'fresh blocks',
    coverage:
      'Newest public blocks, channel movement, cited artifacts, and anything publishable from the day.',
  },
  {
    id: 'sprints',
    label: 'Sprint Log',
    human: '/sprints',
    json: '/sprints.json',
    cadence: 'operator receipts',
    coverage:
      'What shipped, what changed, what still needs a human decision, and what the next agent should pick up.',
  },
] as const;

export const POINTCAST_DAILY_EMAIL_SECTIONS = [
  {
    id: 'topline',
    label: 'Topline',
    title: 'What changed since yesterday',
    prompt:
      'Lead with the freshest shipped change and make the first paragraph useful even if someone reads nothing else.',
  },
  {
    id: 'nouns-desk',
    label: 'Nouns Desk',
    title: 'Nouns Nation battler and federation wire',
    prompt:
      'Summarize Battle Desk V3, season memory, MVP heat, expansion combine movement, and rival Builder Circuit pressure.',
  },
  {
    id: 'blocks',
    label: 'Blocks',
    title: 'Fresh PointCast blocks',
    prompt:
      'List the strongest new blocks or surfaces with citation links, not a generic site recap.',
  },
  {
    id: 'agent-ops',
    label: 'Agent Ops',
    title: 'Scheduler, sprints, and next actions',
    prompt:
      'Call out shipped sprint receipts, open setup tasks, provider health, and the one next move an operator can take.',
  },
] as const;

export const POINTCAST_DAILY_EMAIL_GUARDRAILS = [
  'Only send to explicit opt-in recipients from DAILY_EMAIL_TO or DAILY_EMAIL_AUDIENCE_KV.',
  'Default mode is dry-run; live sends require DAILY_EMAIL_SEND_MODE=live and RESEND_API_KEY.',
  'Every email must include unsubscribe/contact language and a public source link.',
  'If provider, recipients, or origin are missing, log the preview and skip sending.',
] as const;

export const POINTCAST_DAILY_EMAIL_TASKS = [
  {
    id: 'provider',
    label: 'Provider',
    status: 'needs-secret',
    detail: 'Bind RESEND_API_KEY after pointcast.xyz is verified in Resend.',
  },
  {
    id: 'audience',
    label: 'Audience',
    status: 'needs-list',
    detail: 'Set DAILY_EMAIL_TO for a small opt-in list or bind DAILY_EMAIL_AUDIENCE_KV with sub:<email> records.',
  },
  {
    id: 'cron',
    label: 'Cron',
    status: 'ready',
    detail: `Deploy workers/pointcast-daily-email with ${POINTCAST_DAILY_EMAIL_SCHEDULE.cronUtc}.`,
  },
  {
    id: 'preview',
    label: 'Preview',
    status: 'ready',
    detail: 'Use /email-daily-preview.json, /email-scheduler.json, or /preview on the worker before live mode.',
  },
] as const;

export const POINTCAST_DAILY_EMAIL_SEND_CONTRACT = {
  worker: 'workers/pointcast-daily-email',
  provider: 'Resend',
  providerDocs: 'docs/setup/email-pointcast.md',
  audienceKvBinding: 'DAILY_EMAIL_AUDIENCE_KV',
  audienceKvKeyPrefix: 'sub:',
  envFallback: 'DAILY_EMAIL_TO',
  sendModeEnv: 'DAILY_EMAIL_SEND_MODE',
  liveModeValue: 'live',
  apiKeyEnv: 'RESEND_API_KEY',
  opsTokenEnv: 'DAILY_EMAIL_OPS_TOKEN',
  fromEnv: 'DAILY_EMAIL_FROM',
  originEnv: 'DAILY_EMAIL_ORIGIN',
} as const;

export interface DailyWireLink {
  label: string;
  href: string;
}

export interface DailyWireBlockInput {
  id: string;
  title: string;
  dek?: string | null;
  url: string;
  jsonUrl?: string;
  channel?: string;
  timestamp?: string;
}

export interface DailyWireSprintInput {
  id: string;
  title: string;
  status?: string | null;
  firedAt?: string | null;
  anchor?: string;
  shippedAs?: string | null;
}

export interface DailyWireSection {
  id: string;
  label: string;
  title: string;
  body: string;
  links: DailyWireLink[];
}

export interface DailyWireSourceHealth {
  id: string;
  label: string;
  route: string;
  status: 'ok' | 'empty' | 'contract-only';
  detail: string;
}

export interface DailyWireSetupStatus {
  id: string;
  label: string;
  status: 'ready' | 'locked' | 'needs-secret' | 'needs-list';
  detail: string;
}

export interface DailyWirePreview {
  $schema: string;
  name: string;
  version: string;
  generatedAt: string;
  datePT: string;
  subject: string;
  preheader: string;
  leadStory: DailyWireSection;
  nounsNationDesk: DailyWireSection;
  freshBlocks: DailyWireSection[];
  sprintReceipts: DailyWireSection[];
  nextOperatorAction: DailyWireSection;
  setupStatus: DailyWireSetupStatus[];
  sourceHealth: DailyWireSourceHealth[];
  emailSections: DailyWireSection[];
  routes: {
    scheduler: string;
    previewJson: string;
    battleDeskV3: string;
    seasonSixMissions: string;
  };
}

export function buildDailyWirePreview({
  now = new Date(),
  blocks = [],
  sprints = [],
}: {
  now?: Date;
  blocks?: DailyWireBlockInput[];
  sprints?: DailyWireSprintInput[];
} = {}): DailyWirePreview {
  const datePT = todayPT(now);
  const generatedAt = now.toISOString();
  const topBlock = blocks[0];
  const topSprint = sprints[0];
  const leadTitle = topBlock
    ? `Fresh lead: ${topBlock.title}`
    : 'Season 6 Daily Wire is ready for the morning desk';
  const leadBody = topBlock?.dek
    ? `${topBlock.dek} The desk should translate this into one sharp Nouns Nation or PointCast operator note.`
    : 'The Daily Wire packages the Nouns Nation desk, fresh blocks, sprint receipts, and the next operator action into one reusable morning preview.';

  const freshBlocks = blocks.slice(0, 3).map((block, index) => ({
    id: `block-${block.id}`,
    label: index === 0 ? 'Fresh block / lead candidate' : 'Fresh block',
    title: block.title,
    body: block.dek || `${block.channel || 'PointCast'} block ${block.id}.`,
    links: [
      { label: 'Read', href: block.url },
      { label: 'JSON', href: block.jsonUrl || `${block.url}.json` },
    ],
  }));

  const sprintReceipts = sprints.slice(0, 3).map((sprint, index) => ({
    id: `sprint-${sprint.id}`,
    label: index === 0 ? 'Latest sprint receipt' : 'Sprint receipt',
    title: sprint.title,
    body: [
      sprint.status ? `Status: ${sprint.status}.` : '',
      sprint.shippedAs ? `Shipped as ${sprint.shippedAs}.` : '',
    ].filter(Boolean).join(' ') || 'Sprint receipt logged for the operator desk.',
    links: [
      { label: 'Sprint log', href: sprint.anchor || 'https://pointcast.xyz/sprints' },
    ],
  }));

  const leadStory: DailyWireSection = {
    id: 'lead-story',
    label: 'Lead story',
    title: leadTitle,
    body: leadBody,
    links: [
      { label: 'Scheduler', href: 'https://pointcast.xyz/email-scheduler' },
      { label: 'Latest archive', href: topBlock?.url || 'https://pointcast.xyz/archive' },
    ],
  };

  const nounsNationDesk: DailyWireSection = {
    id: 'nouns-nation-desk',
    label: 'Nouns Nation desk',
    title: 'Season 6 needs a headline before it needs more noise',
    body:
      'Battle Desk V3, the Season 6 mission board, and the Builder Circuit preview now give the daily email a real sports-desk spine: lead, stakes, artifact, next assignment.',
    links: [
      { label: 'Battle Desk V3', href: 'https://pointcast.xyz/nouns-nation-battler-v3/' },
      { label: 'Season 6 missions', href: 'https://pointcast.xyz/nouns-nation-battler-sprint.json' },
    ],
  };

  const nextOperatorAction: DailyWireSection = {
    id: 'next-operator-action',
    label: 'Next operator action',
    title: 'Write tomorrow\'s Daily Wire lead',
    body:
      'Pick one Season 6 mission, turn it into a one-paragraph lead, cite the public surface, and leave the proof gap visible instead of inventing certainty.',
    links: [
      { label: 'Mission board', href: 'https://pointcast.xyz/nouns-nation-battler-sprint.json' },
      { label: 'Bring a nation', href: 'https://pointcast.xyz/nouns-nation/join/' },
    ],
  };

  const sourceHealth: DailyWireSourceHealth[] = [
    {
      id: 'blocks',
      label: 'PointCast Blocks',
      route: 'https://pointcast.xyz/blocks.json',
      status: blocks.length ? 'ok' : 'empty',
      detail: blocks.length ? `${blocks.length} recent block candidates available.` : 'No block candidates passed into this preview.',
    },
    {
      id: 'sprints',
      label: 'Sprint Log',
      route: 'https://pointcast.xyz/sprints.json',
      status: sprints.length ? 'ok' : 'empty',
      detail: sprints.length ? `${sprints.length} recent sprint receipts available.` : 'No sprint receipts passed into this preview.',
    },
    {
      id: 'nouns-nation-battler',
      label: 'Nouns Nation Battler',
      route: 'https://pointcast.xyz/nouns-nation-battler.json',
      status: 'contract-only',
      detail: 'Manifest supplies Battle Desk V3, Season 6, and Daily Wire context.',
    },
    {
      id: 'nouns-nation',
      label: 'Nouns Nation',
      route: 'https://pointcast.xyz/nouns-nation.json',
      status: 'contract-only',
      detail: 'Federation manifest supplies bring-your-own-nation framing.',
    },
  ];

  const setupStatus: DailyWireSetupStatus[] = [
    {
      id: 'preview',
      label: 'Preview',
      status: 'ready',
      detail: 'Public Daily Wire JSON is safe for agents and visitors.',
    },
    {
      id: 'cron',
      label: 'Cron',
      status: 'ready',
      detail: `Worker cron target remains ${POINTCAST_DAILY_EMAIL_SCHEDULE.cronUtc}.`,
    },
    {
      id: 'provider',
      label: 'Provider',
      status: 'needs-secret',
      detail: 'RESEND_API_KEY must be bound before live sends.',
    },
    {
      id: 'audience',
      label: 'Audience',
      status: 'needs-list',
      detail: 'DAILY_EMAIL_TO or DAILY_EMAIL_AUDIENCE_KV must hold explicit opt-ins.',
    },
    {
      id: 'live-send',
      label: 'Live send',
      status: 'locked',
      detail: 'DAILY_EMAIL_SEND_MODE must stay dry-run until provider and audience are verified.',
    },
  ];

  const blockSection: DailyWireSection = {
    id: 'fresh-blocks',
    label: 'Fresh blocks',
    title: freshBlocks[0]?.title || 'No fresh block candidate loaded',
    body: freshBlocks.length
      ? freshBlocks.map((block) => block.title).join(' / ')
      : 'The public preview did not receive block data; keep the email pointed at the archive.',
    links: [
      { label: 'Archive', href: 'https://pointcast.xyz/archive' },
      { label: 'Blocks JSON', href: 'https://pointcast.xyz/blocks.json' },
    ],
  };

  const sprintSection: DailyWireSection = {
    id: 'sprint-receipts',
    label: 'Sprint receipts',
    title: topSprint?.title || 'No sprint receipt loaded',
    body: sprintReceipts.length
      ? sprintReceipts.map((sprint) => sprint.title).join(' / ')
      : 'The public preview did not receive sprint data; keep the email pointed at the sprint log.',
    links: [
      { label: 'Sprint log', href: 'https://pointcast.xyz/sprints' },
      { label: 'Sprints JSON', href: 'https://pointcast.xyz/sprints.json' },
    ],
  };

  const emailSections = [leadStory, nounsNationDesk, blockSection, sprintSection, nextOperatorAction];

  return {
    $schema: 'https://pointcast.xyz/email-daily-preview.json',
    name: 'PointCast Daily Wire',
    version: POINTCAST_DAILY_WIRE_VERSION,
    generatedAt,
    datePT,
    subject: `PointCast Daily Wire - ${datePT} - ${leadTitle.slice(0, 68)}`,
    preheader:
      'Nouns Nation lead, fresh PointCast blocks, sprint receipts, and the next operator assignment.',
    leadStory,
    nounsNationDesk,
    freshBlocks,
    sprintReceipts,
    nextOperatorAction,
    setupStatus,
    sourceHealth,
    emailSections,
    routes: {
      scheduler: 'https://pointcast.xyz/email-scheduler',
      previewJson: 'https://pointcast.xyz/email-daily-preview.json',
      battleDeskV3: 'https://pointcast.xyz/nouns-nation-battler-v3/',
      seasonSixMissions: 'https://pointcast.xyz/nouns-nation-battler-sprint.json',
    },
  };
}

export function buildDailyEmailPreview(
  now: Date = new Date(),
  dailyWire: DailyWirePreview = buildDailyWirePreview({ now }),
) {
  const datePT = todayPT(now);
  const generatedAt = now.toISOString();

  return {
    $schema: 'https://pointcast.xyz/email-scheduler.json',
    name: 'PointCast Daily Email Scheduler',
    version: POINTCAST_DAILY_EMAIL_SCHEDULER_VERSION,
    createdAt: POINTCAST_DAILY_EMAIL_CREATED_AT,
    generatedAt,
    datePT,
    schedule: POINTCAST_DAILY_EMAIL_SCHEDULE,
    subject: `PointCast Daily - ${datePT} - Nouns Nation and sprint wire`,
    preheader:
      'A daily operator-readable update with Nouns Nation, fresh blocks, shipped sprints, and next actions.',
    from: {
      name: 'PointCast',
      email: 'hello@pointcast.xyz',
    },
    audience: {
      policy: 'operator-curated opt-in only',
      sources: [
        POINTCAST_DAILY_EMAIL_SEND_CONTRACT.envFallback,
        `${POINTCAST_DAILY_EMAIL_SEND_CONTRACT.audienceKvBinding} keys prefixed ${POINTCAST_DAILY_EMAIL_SEND_CONTRACT.audienceKvKeyPrefix}`,
      ],
    },
    sources: POINTCAST_DAILY_EMAIL_SOURCES,
    sections: POINTCAST_DAILY_EMAIL_SECTIONS,
    guardrails: POINTCAST_DAILY_EMAIL_GUARDRAILS,
    tasks: POINTCAST_DAILY_EMAIL_TASKS,
    sendContract: POINTCAST_DAILY_EMAIL_SEND_CONTRACT,
    dailyWire,
    routes: {
      human: 'https://pointcast.xyz/email-scheduler',
      json: 'https://pointcast.xyz/email-scheduler.json',
      dailyWirePreview: 'https://pointcast.xyz/email-daily-preview.json',
      workerPreview: 'https://pointcast-daily-email.<account>.workers.dev/preview',
      docs: 'https://github.com/mhoydich/pointcast/blob/main/docs/setup/daily-email-scheduler.md',
    },
  };
}
