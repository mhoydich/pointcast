/**
 * PointCast Daily email scheduler contract.
 *
 * This is the shared source for /email-scheduler, /email-scheduler.json,
 * and the operator docs. The sending worker has its own tiny renderer so
 * it can deploy independently from the Astro site, but it follows this
 * schedule and section contract.
 */
import { todayPT } from './daily';

export const POINTCAST_DAILY_EMAIL_SCHEDULER_VERSION = 'v0.1.0';
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
    detail: 'Use /email-scheduler.json on the site or /preview on the worker before live mode.',
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

export function buildDailyEmailPreview(now: Date = new Date()) {
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
    routes: {
      human: 'https://pointcast.xyz/email-scheduler',
      json: 'https://pointcast.xyz/email-scheduler.json',
      workerPreview: 'https://pointcast-daily-email.<account>.workers.dev/preview',
      docs: 'https://github.com/mhoydich/pointcast/blob/main/docs/setup/daily-email-scheduler.md',
    },
  };
}
