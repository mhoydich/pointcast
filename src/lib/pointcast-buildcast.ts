export const HAPTIC_BUILDCAST_PROJECT = 'haptic-dreams' as const;
export const HAPTIC_BUILDCAST_SESSION = 'saturday-kingdom-v1' as const;

export const BUILDCAST_AGENTS = ['terra', 'luna', 'codex', 'mike', 'system'] as const;
export const BUILDCAST_TYPES = [
  'session.started',
  'phase.started',
  'artifact.updated',
  'decision.published',
  'test.passed',
  'test.failed',
  'preview.ready',
  'release.published',
  'session.completed',
] as const;
export const BUILDCAST_PHASES = ['shape', 'build', 'playtest', 'release'] as const;
export const BUILDCAST_STATUSES = ['working', 'passed', 'needs-attention', 'shipped'] as const;

export type BuildcastAgent = (typeof BUILDCAST_AGENTS)[number];
export type BuildcastType = (typeof BUILDCAST_TYPES)[number];
export type BuildcastPhase = (typeof BUILDCAST_PHASES)[number];
export type BuildcastStatus = (typeof BUILDCAST_STATUSES)[number];

export interface BuildcastEvent {
  id: string;
  project: typeof HAPTIC_BUILDCAST_PROJECT;
  session: typeof HAPTIC_BUILDCAST_SESSION;
  sequence: number;
  at: string;
  agent: BuildcastAgent;
  type: BuildcastType;
  phase: BuildcastPhase;
  title: string;
  summary: string;
  status: BuildcastStatus;
  link?: string;
  metrics?: {
    testsPassed?: number;
    testsFailed?: number;
    pagesBuilt?: number;
  };
}

export interface BuildcastEventInput {
  agent: BuildcastAgent;
  type: BuildcastType;
  phase: BuildcastPhase;
  title: string;
  summary: string;
  status: BuildcastStatus;
  link?: string;
  metrics?: BuildcastEvent['metrics'];
}

export const HAPTIC_BUILDCAST_SEED_EVENTS: BuildcastEvent[] = [
  {
    id: 'seed-001',
    project: HAPTIC_BUILDCAST_PROJECT,
    session: HAPTIC_BUILDCAST_SESSION,
    sequence: 1,
    at: '2026-08-08T19:10:00.000Z',
    agent: 'mike',
    type: 'session.started',
    phase: 'shape',
    title: 'A football game becomes a felt world',
    summary: 'The brief joined real play data, a recognizable sleeve language, and two rival kingdoms that visibly remember the game.',
    status: 'passed',
  },
  {
    id: 'seed-002',
    project: HAPTIC_BUILDCAST_PROJECT,
    session: HAPTIC_BUILDCAST_SESSION,
    sequence: 2,
    at: '2026-08-08T19:28:00.000Z',
    agent: 'codex',
    type: 'decision.published',
    phase: 'shape',
    title: 'One event grammar, several outputs',
    summary: 'Possession, distance, intensity, and consequence now drive the world, sleeve, generated sound, and readable translation together.',
    status: 'passed',
    link: 'https://pointcast.xyz/haptic-dreams.json',
  },
  {
    id: 'seed-003',
    project: HAPTIC_BUILDCAST_PROJECT,
    session: HAPTIC_BUILDCAST_SESSION,
    sequence: 3,
    at: '2026-08-08T20:04:00.000Z',
    agent: 'codex',
    type: 'artifact.updated',
    phase: 'build',
    title: 'Saturday Kingdom takes the field',
    summary: 'Eighteen selected plays can now move the train, raise the two cities, pulse eight sleeve zones, and leave a visible event record.',
    status: 'passed',
    link: 'https://pointcast.xyz/haptic-dreams',
    metrics: { testsPassed: 4, testsFailed: 0 },
  },
  {
    id: 'seed-004',
    project: HAPTIC_BUILDCAST_PROJECT,
    session: HAPTIC_BUILDCAST_SESSION,
    sequence: 4,
    at: '2026-08-08T20:42:00.000Z',
    agent: 'luna',
    type: 'phase.started',
    phase: 'build',
    title: 'The studio window opens',
    summary: 'A quiet public ledger is being placed beside the playable artifact. It shares milestones, never private prompts, inboxes, secrets, or raw logs.',
    status: 'working',
  },
];

export const BUILDCAST_PUBLIC_BOUNDARY = {
  cadence: 'The page checks for authenticated, curated milestones every 3.5 seconds while visible.',
  notPublished: [
    'prompts or private model reasoning',
    'terminal output, stack traces, or full diffs',
    'email, inboxes, local paths, tokens, headers, or private URLs',
  ],
  liveClaim: 'Seeded milestones work without infrastructure. New public updates require a dedicated KV binding and writer token.',
} as const;
