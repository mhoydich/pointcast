/**
 * ONE GOAL — A goal-setting machine in browser-local persistence.
 *
 * Set one goal. Declare a daily action. Run the machine. Mark each
 * day. Cross 30 / 90 / 365. The page is the receipt; the streak is
 * the proof. Cohort give-back ledger weight accrues on milestone
 * crossings.
 *
 * "One goal at a time. The machine runs once a day or it does not run."
 */

export const MACHINE_META = {
  title: 'ONE GOAL',
  subtitle: 'Set it. Run the machine. Go.',
  tagline: 'A daily-action machine for the 25-mile radius.',
  thesis: 'You get one goal. You declare a daily action. You mark the day. You stop, or you continue. The page tracks the streak. The cohort sees the receipt. The ledger gains weight when the milestones land. There is no other interface.',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
};

export const MACHINE_PRINCIPLES = [
  'One goal at a time. Multiple parallel goals dilute the machine. Pick the one. Park the rest.',
  'Daily action over weekly intention. The machine runs once a day or it does not run.',
  'A streak is more honest than a plan. Plans negotiate; streaks accumulate.',
  'Mark the day even when the action was small. A two-minute version of the daily action counts as a tick. A zero day breaks the streak.',
  'Three horizons: thirty, ninety, three-hundred-sixty-five. Set the day count. Cross or restart.',
  'On milestone crossings, log a ledger entry at /commons. The streak earns Hours weight; the goal earns Custody weight.',
  'When the goal is complete, declare the next one in the same format. The machine does not retire; the operator does.',
];

export type GoalType = 'artifact' | 'ritual' | 'acquisition' | 'publication' | 'attendance';
export type GoalHorizon = 30 | 90 | 365;
export type GoalStatus = 'set' | 'running' | 'paused' | 'crossed' | 'restarted' | 'retired';

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  artifact: 'Artifact — one thing made (a paper, a bench, a plaque)',
  ritual: 'Ritual — one thing done daily (a sit, a walk, a read)',
  acquisition: 'Acquisition — one thing held (a parcel, an easement, a court)',
  publication: 'Publication — one thing posted (a paper, a note, a talk)',
  attendance: 'Attendance — one place shown up to (a council, a library, a court)',
};

export type Goal = {
  id: string;
  title: string;
  why: string;
  type: GoalType;
  dailyAction: string;
  horizon: GoalHorizon;
  uesProgram: string;
  cohortPartner: string;
  triggerCondition: string;
  status: GoalStatus;
  startedAt: string;
  ledgerToward: string;
};

export const SEED_GOALS: Goal[] = [
  {
    id: 'first-bench-built',
    title: 'First Bench at Hilltop, built and open by 2026-08-01',
    why: 'The pilot. The smallest useful unit. Proves the give-back loop works at the smallest possible unit.',
    type: 'artifact',
    dailyAction: 'Either: log a give-back at /commons, or attend a Marine Layer sit, or send one parks-department email, or move one sub-task on the bench permit forward.',
    horizon: 90,
    uesProgram: 'Commons + Marine Layer',
    cohortPartner: 'Marine Layer cohort + parks-department point person',
    triggerCondition: 'Bench permit issued by El Segundo Parks Department + bench fabricated + installation date scheduled.',
    status: 'running',
    startedAt: '2026-04-21',
    ledgerToward: 'First Bench',
  },
  {
    id: 'eight-week-marine-layer',
    title: 'Marine Layer eight-week cycle, completed end-to-end',
    why: 'The minimum unit of the cohort practice. One full cycle proves the format works.',
    type: 'ritual',
    dailyAction: 'Sit your daily ten minutes. Post the artifact within the same day.',
    horizon: 90,
    uesProgram: 'Marine Layer',
    cohortPartner: 'Marine Layer cohort, cap 12',
    triggerCondition: 'Eight weekly sits completed, eight artifacts logged, next steward named at the Pier Closer.',
    status: 'running',
    startedAt: '2026-05-09',
    ledgerToward: 'First Bench',
  },
  {
    id: 'clt-shell-filed',
    title: 'PointCast Commons CLT shell entity filed with CA Secretary of State',
    why: 'Phase 2 vehicle. Without it, no parcel acquisition. With it, the Commons can hold land that stays common.',
    type: 'acquisition',
    dailyAction: 'Either: review one paragraph of bylaws, or send one email to pro-bono counsel, or read one prior CLT case study, or log one Expertise give-back.',
    horizon: 365,
    uesProgram: 'Commons · Phase 2 Vehicle',
    cohortPartner: 'Pro-bono counsel + founding board (5 names, 3 not Mike)',
    triggerCondition: '100 ledger weight crossed + 1 offered easement + Articles filed + Form 1023-EZ submitted + EIN issued.',
    status: 'set',
    startedAt: '2026-05-06',
    ledgerToward: 'Phase 2 · Vehicle',
  },
  {
    id: 'ten-papers',
    title: 'Ten UES Working Papers in Material Culture, published',
    why: 'The series is the institutional memory. Ten papers establish UES Working Papers as a real publication track.',
    type: 'publication',
    dailyAction: 'Either: write one paragraph on the active paper, or read one source, or render one specimen plate, or commit one ledger entry for the work.',
    horizon: 365,
    uesProgram: 'UES Working Papers',
    cohortPartner: 'Marine Layer cohort + Codex review',
    triggerCondition: 'UES-WP-2026-01 through 2026-10 all published; Codex GREEN on at least eight; the series is its own cohort.',
    status: 'running',
    startedAt: '2026-05-02',
    ledgerToward: 'UES Working Papers',
  },
  {
    id: 'civic-witness',
    title: 'Forty civic-surface attendances logged across one year',
    why: 'Civic Layer literacy at scale. Forty attendances across the six surfaces is the floor for credible cohort civic competence.',
    type: 'attendance',
    dailyAction: 'On meeting days: attend, take notes, post artifact within 24 hours. On non-meeting days: read one packet, or walk one parcel, or talk to one regular.',
    horizon: 365,
    uesProgram: 'Civic Layer',
    cohortPartner: 'Civic Layer cohort (anyone in the radius)',
    triggerCondition: 'Forty attendance entries across at least four of the six surfaces (City Council, Planning Commission, Parks/Rec/Library, ESUSD, LAX Roundtable, Coastal Commission), with one prepared public comment.',
    status: 'set',
    startedAt: '2026-05-01',
    ledgerToward: 'Civic Layer',
  },
];

export type MachineLoop = { cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'; action: string; output: string };

export const MACHINE_LOOPS: MachineLoop[] = [
  { cadence: 'daily', action: 'Mark the day. Either you did the daily action or you did not. One tap. No paragraph required.', output: 'A streak counter. Visible on this page. Logged in localStorage.' },
  { cadence: 'weekly', action: 'Sunday review: one paragraph. What worked, what slipped, what is the smallest version of tomorrow\'s action.', output: 'One short note appended to the goal record. Optional but recommended.' },
  { cadence: 'monthly', action: 'On the first of each month: log a give-back ledger entry at /commons crediting the streak.', output: 'A real Hours entry on the public ledger. Weight equal to days marked × 1/30 hours.' },
  { cadence: 'quarterly', action: 'On the 30 / 60 / 90 day crossings: stop, walk, look at the goal again. Decide: continue, restart, or retire.', output: 'A horizon-check note. Status update on the goal record.' },
  { cadence: 'annual', action: 'On the 365-day crossing: declare the goal complete or retire it honestly. Pick the next one in the same format.', output: 'A retirement entry on the goal record. The next goal begins.' },
];

export const HORIZON_BANDS = [
  { day: 1, label: 'Day 01 · The first tick', meaning: 'You showed up once. The machine has begun.' },
  { day: 7, label: 'Day 07 · One week', meaning: 'A week is a real cohort unit. Most goals die before week one.' },
  { day: 30, label: 'Day 30 · Thirty', meaning: 'The first horizon. Log a Hours give-back at /commons (+1 weight).' },
  { day: 60, label: 'Day 60 · Sixty', meaning: 'A second Hours give-back. The machine has earned its place.' },
  { day: 90, label: 'Day 90 · Ninety', meaning: 'The second horizon. Quarterly review. Continue, restart, or retire.' },
  { day: 180, label: 'Day 180 · Half a year', meaning: 'Custody weight crosses (+4). The cohort can credibly point at the receipt.' },
  { day: 270, label: 'Day 270 · Three quarters', meaning: 'A third Custody weight (+4). The end horizon visible.' },
  { day: 365, label: 'Day 365 · One year', meaning: 'The final horizon. Goal completed or honestly retired. Next one declared.' },
];

export const MACHINE_NOTES = {
  storageKey: 'pointcast.goal.machine.v0',
  privacy: 'All goal data and streak ticks are stored in this browser only. Nothing leaves your device until you choose to log a corresponding ledger entry at /commons.',
  retirementClause: 'You are permitted, at any horizon crossing, to retire the goal. This is not failure; it is honesty. The cohort respects retirement more than perpetual zombie goals.',
};
