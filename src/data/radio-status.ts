/**
 * PointCast Radio Network — product status board. One source for
 * /radio-network/status and /radio-network/status.json.
 *
 * The product manager keeps this current: change a status, add a changelog
 * row, move STATUS_AS_OF. Owners are roles, not people, except decisions that
 * belong to Mike Hoydich. The network is a plan: nothing here is on air and no
 * seat is filled.
 */

import { DECISIONS, PHASES, RADIO_BASE, RADIO_STATUS } from './radio-network.ts';
import { PILOT_WEEKS } from './radio-kit.ts';

export const STATUS_AS_OF = '2026-10-22';

export const STATUSES = ['blocked', 'in progress', 'not started', 'done'] as const;
export type RadioStatus = (typeof STATUSES)[number];

export type Milestone = {
  id: string;
  track: string;
  title: string;
  status: RadioStatus;
  owner: string;
  note: string;
  ref?: { label: string; url: string };
};

const PR = (n: number) => ({ label: `PR #${n}`, url: `https://github.com/mhoydich/pointcast/pull/${n}` });

/** The publishing track: what PointCast itself has built and shipped. */
const PUBLISHING: Milestone[] = [
  {
    id: 'plan-published',
    track: 'Publishing',
    title: 'Network plan published',
    status: 'done',
    owner: 'Build agents',
    note: 'The plan for Radio El Segundo and six sister stations, with the hour clock, schedule, signal paths, phases, budget and open decisions. Block 0718.',
    ref: PR(1466),
  },
  {
    id: 'station-pages-kit',
    track: 'Publishing',
    title: 'Station pages and Phase 0 launch kit',
    status: 'done',
    owner: 'Build agents',
    note: 'Seven station pages with JSON twins, and the six-week kit for The Town Desk: rundown, gear, IDs, underwriting rules, consent form template. Block 0726.',
    ref: PR(1494),
  },
  {
    id: 'live-on-site',
    track: 'Publishing',
    title: 'Live on pointcast.xyz',
    status: 'blocked',
    owner: 'Mike Hoydich',
    note: 'Merged to main and the CI build is green, but the GitHub deploy step is skipped because the CLOUDFLARE_API_TOKEN repository secret is not set. Needs Mike to run scripts/deploy.sh or add the secret.',
  },
  {
    id: 'project-assignments',
    track: 'Publishing',
    title: 'Project assignments on the jobs board',
    status: 'done',
    owner: 'Build agents',
    note: 'RN-01 to RN-10 on /radio-network#assignments and /jobs/?project=radio. Educational briefs; applications are not open.',
  },
  {
    id: 'print-campaign',
    track: 'Publishing',
    title: 'Print campaign',
    status: 'in progress',
    owner: 'Build agents',
    note: 'Printable pieces for Main Street. Posting anything in town still needs permission from each place. Being built today.',
  },
  {
    id: 'mcp-tools',
    track: 'Publishing',
    title: 'MCP read tools: radio_network and radio_station',
    status: 'in progress',
    owner: 'Build agents',
    note: 'Read-only tools on /api/mcp so agents can read the plan and any station. Being built today.',
  },
  {
    id: 'status-board',
    track: 'Publishing',
    title: 'This status board',
    status: 'in progress',
    owner: 'Product manager',
    note: 'Dated board with milestones, blockers, decisions, risks and a changelog. Being built today.',
  },
];

const RESEARCH: Milestone[] = [
  {
    id: 'manus-phase0-research',
    track: 'Research',
    title: 'Manus Phase 0 research',
    status: 'not started',
    owner: 'Manus (browser and ops)',
    note: 'Brief written at docs/briefs/2026-10-22-manus-radio-phase0.md; the research itself has not run.',
  },
];

/** Phase 0, one row per pilot week from the launch kit. Nothing can start before week 1's decisions. */
const WEEK_STATUS: Record<number, { status: RadioStatus; owner: string; note: string }> = {
  1: { status: 'blocked', owner: 'Mike Hoydich', note: 'Waiting on the open decisions below: name, talk-first or music-first, fiscal sponsor, first host.' },
  2: { status: 'not started', owner: 'Producer (open seat)', note: 'Feed, stream test page, station IDs, printed consent form, story list.' },
  3: { status: 'not started', owner: 'Host (open seat)', note: 'No episode recorded. Needs a host and the consent form reviewed by counsel.' },
  4: { status: 'not started', owner: 'Host (open seat)', note: 'Second episode, first underwriting conversations, station rules page.' },
  5: { status: 'not started', owner: 'Producer (open seat)', note: 'Bank episodes 3 and 4; stream test on phones, a smart speaker and a car; Manus listener QA.' },
  6: { status: 'not started', owner: 'Network editor (open seat)', note: 'Publish episode 1, put up schedule cards with permission, count listeners.' },
};

const PILOT: Milestone[] = PILOT_WEEKS.map((w) => ({
  id: `phase0-week${w.week}`,
  track: 'Phase 0 pilot',
  title: `Week ${w.week}: ${w.name}`,
  ...WEEK_STATUS[w.week],
  ref: { label: 'Launch kit', url: `${RADIO_BASE}/kit#weeks` },
}));

const PHASE_OWNERS: Record<number, string> = {
  1: 'Station desk lead (open seat)',
  2: 'Network editor (open seat)',
  3: 'Nonprofit partner and board (not chosen)',
};

const LATER: Milestone[] = PHASES.filter((p) => p.n > 0).map((p) => ({
  id: `phase${p.n}`,
  track: `Phase ${p.n} ${p.name.toLowerCase()}`,
  title: `${p.name} (${p.span}): ${p.goal}`,
  status: 'not started' as RadioStatus,
  owner: PHASE_OWNERS[p.n],
  note: `Done when: ${p.done}`,
  ref: { label: 'Phases', url: `${RADIO_BASE}#phases` },
}));

export const MILESTONES: Milestone[] = [...PUBLISHING, ...RESEARCH, ...PILOT, ...LATER];

/** Short labels for the plan's open decisions, in DECISIONS order. All wait on Mike. */
const DECISION_LABELS = [
  'Network name',
  'Talk-first or music-first',
  'Nonprofit partner or fiscal sponsor',
  'First host of The Town Desk',
  'Synthetic voices on the conditions segment',
  'LPFM channel study now or later',
];

export const DECISION_BOARD = DECISIONS.map((detail, i) => ({
  id: `decision-${i + 1}`,
  title: DECISION_LABELS[i] ?? `Decision ${i + 1}`,
  detail,
  status: 'blocked' as RadioStatus,
  owner: 'Mike Hoydich',
  blocks: i < 4 ? 'Phase 0 week 1' : 'Phase 0 and later',
}));

export const RISKS = [
  { risk: 'The Los Angeles FM dial may have no usable LPFM frequency', impact: 'High', mitigation: 'Stream first; HD subchannel lease as the over-the-air path; a channel study before any LPFM spending.' },
  { risk: 'Music licensing cost and rules', impact: 'Medium', mitigation: 'Talk-first launch keeps licensing small; get current SoundExchange and PRO numbers before music blocks.' },
  { risk: 'Volunteer retention', impact: 'Medium', mitigation: 'Small weekly commitments, Listener Shift as a training slot, a clear ladder from contributor to host.' },
  { risk: 'Consent form and station rules not yet reviewed by counsel', impact: 'High', mitigation: 'No recording of neighbors until counsel signs off on the template.' },
  { risk: 'Deploy blocker: merged work is not live', impact: 'Medium', mitigation: 'Mike runs scripts/deploy.sh, or adds the CLOUDFLARE_API_TOKEN secret so CI deploys on merge.' },
  { risk: 'Nobody yet in any seat', impact: 'High', mitigation: 'Project assignments and the print campaign aim at a first host and producer; week 1 cannot finish without them.' },
];

export const CHANGELOG = [
  { date: '2026-10-22', shipped: 'Merged to main; CI build green; deploy step skipped (no CLOUDFLARE_API_TOKEN secret), so not yet live.', ref: null },
  { date: '2026-10-22', shipped: 'Ten project assignments, RN-01 to RN-10, on the plan and the jobs board.', ref: PR(1514) },
  { date: '2026-10-22', shipped: 'Seven station pages, JSON twins and the Phase 0 launch kit.', ref: { block: '0726', ...PR(1494) } },
  { date: '2026-10-20', shipped: 'Network plan published at /radio-network with /radio-network.json.', ref: { block: '0718', ...PR(1466) } },
];

export function statusCounts(items: { status: RadioStatus }[] = MILESTONES) {
  return Object.fromEntries(STATUSES.map((s) => [s, items.filter((m) => m.status === s).length])) as Record<RadioStatus, number>;
}

export function buildStatusManifest() {
  const order = (s: RadioStatus) => STATUSES.indexOf(s);
  return {
    name: 'PointCast Radio Network — status board',
    asOf: STATUS_AS_OF,
    networkStatus: RADIO_STATUS,
    url: `${RADIO_BASE}/status`,
    json: `${RADIO_BASE}/status.json`,
    counts: statusCounts(),
    blockers: MILESTONES.filter((m) => m.status === 'blocked'),
    milestones: [...MILESTONES].sort((a, b) => order(a.status) - order(b.status)),
    decisionsWaitingOnMike: DECISION_BOARD,
    risks: RISKS,
    changelog: CHANGELOG,
    note: 'A plan, not a station. Nothing is on air and no seat is filled. Owners are roles; open seats have no one in them yet.',
  };
}
