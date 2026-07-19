import { ONLINE_SEASON_ONE, UES_SEASON_ONE_BUDGET, UES_SEASON_ONE_COURSES } from './ues-classes';

export type UesCourse = {
  code: string;
  slug: string;
  title: string;
  frame: string;
  delivery: string;
  publicOutcome: string;
  audience: string;
  boundary?: string;
  path?: string;
};

export type BudgetLine = {
  label: string;
  amountUsd: number;
  purpose: string;
};

export type ProgramBudget = {
  id: string;
  name: string;
  duration: string;
  totalUsd: number;
  lines: BudgetLine[];
};

export const UES_PROGRAM_IDENTITY = {
  name: 'University of El Segundo',
  shortName: 'UES',
  line: 'A university that starts with the place it is in.',
  character:
    'Local, art-forward, practical, collective, and public by default: people teach what they know, learners make something useful, and the institution shows its work.',
  status: 'forming',
  home: 'https://pointcast.xyz/university-of-el-segundo',
  contact: 'hello@pointcast.xyz',
} as const;

export const UES_PROGRAM = UES_PROGRAM_IDENTITY;

export const ONLINE_SEASON_ZERO = {
  name: 'Online Season 0',
  durationWeeks: 6,
  learnerCapacity: 60,
  courseCount: 8,
  classSize: {
    minimum: 12,
    maximum: 18,
  },
  weeklyRhythm: {
    liveStudioMinutes: 75,
    asynchronousFieldTasks: 1,
    publicNotesOrReceipts: 1,
  },
  staffingPerCourse: {
    faculty: 1,
    steward: 1,
  },
  learnerPriceUsd: 0,
  fundingModel:
    'Tuition-free for the launch cohort. Voluntary contributions fund faculty, stewards, access, production, and the shared public archive.',
  operatingNotes: [
    'Run one 75-minute live studio per course each week, with a recording or equivalent access path where faculty permission allows.',
    'Give every learner one small field task and one public note, artifact, or receipt each week.',
    'Use a faculty-plus-steward pair so teaching, access, attendance, and documentation do not compete for the same attention.',
    'Publish the syllabus, schedule, accessibility path, and expected public outcome before enrollment opens.',
  ],
} as const;

export const UES_LAUNCH_COURSES: UesCourse[] = [
  {
    code: 'UES-101',
    slug: 'the-rebuildable-town',
    title: 'The Rebuildable Town',
    frame:
      'Read a town as a system that can be repaired: streets, services, rituals, budgets, signs, and the relationships between them.',
    delivery: 'Six live studios, neighborhood observations, and one repair proposal.',
    publicOutcome: 'A small, costed proposal for one local repair.',
    audience: 'Residents, designers, builders, organizers, and civic beginners.',
    path: '/ues#launch-studios',
  },
  {
    code: 'UES-102',
    slug: 'local-systems-civic-practice',
    title: 'Local Systems & Civic Practice',
    frame:
      'Learn how agendas, fees, public records, departments, and neighborhood relationships become everyday civic power.',
    delivery: 'Live document labs, one public-meeting observation, and a local systems map.',
    publicOutcome: 'A plain-language guide to one local process.',
    audience: 'People who want to participate without pretending to be policy experts.',
  },
  {
    code: 'UES-103',
    slug: 'flower-commons',
    title: 'Flower Commons: Plant Beauty & Human Culture',
    frame:
      'Study plant form, cultivation, symbolism, public gardens, and the ways people build culture around living beauty.',
    delivery: 'Visual seminars, observation practice, and a shared seasonal field index.',
    publicOutcome: 'An illustrated plant note contributed to the Flower Commons.',
    audience: 'Artists, gardeners, naturalists, writers, and curious neighbors.',
  },
  {
    code: 'UES-104',
    slug: 'cannabis-studies',
    title: 'Cannabis Studies: Grow, Genetics & Society',
    frame:
      'An interdisciplinary study of plant biology, genetics, cultivation systems, visual culture, history, policy, and community stewardship.',
    delivery: 'Research-led seminars, botanical studies, and a sourced public glossary.',
    publicOutcome: 'A careful, cited field guide to one aspect of the plant or its culture.',
    audience: 'Adults interested in botany, history, design, culture, and public policy.',
    boundary:
      'Ages 21+ only. Education and cultural study; no consumption, medical advice, product sales, or instructions that conflict with local law.',
  },
  {
    code: 'UES-105',
    slug: 'type-as-public-language',
    title: 'Type as Public Language',
    frame:
      'Treat typography as civic material: a voice for signs, flyers, course covers, wayfinding, protest, welcome, and memory.',
    delivery: 'Weekly type studies, public-sign walks, critiques, and one deployable system.',
    publicOutcome: 'An open poster, sign, or cover system for a local use.',
    audience: 'Designers, students, organizers, and anyone who notices signs.',
  },
  {
    code: 'UES-106',
    slug: 'ai-studio',
    title: 'AI Studio: Tools, Judgment & Authorship',
    frame:
      'Use contemporary creative models with taste, disclosure, source awareness, and a strong human editorial point of view.',
    delivery: 'Prompt and critique studios, provenance notes, and a finished public work.',
    publicOutcome: 'A published work with a clear process and authorship statement.',
    audience: 'Artists, writers, educators, builders, and critical tool users.',
  },
  {
    code: 'UES-107',
    slug: 'archive-tezos-public-memory',
    title: 'Archive, Tezos & Public Memory',
    frame:
      'Build durable public archives, understand wallet-based publishing, and examine when minting adds value to a cultural record.',
    delivery: 'Archive labs, wallet literacy, metadata critique, and a test publication plan.',
    publicOutcome: 'A documented, portable public collection; minting remains optional.',
    audience: 'Artists, archivists, collectors, technologists, and community historians.',
    boundary: 'No promise of price appreciation, liquidity, financial return, or governance rights.',
  },
  {
    code: 'UES-108',
    slug: 'community-operations',
    title: 'Community Operations: Host, Feed, Fund',
    frame:
      'Practice the invisible work of a good gathering: invitations, access, hospitality, facilitation, budgets, conflict care, and public receipts.',
    delivery: 'Operations clinics, small hosting experiments, and a peer-reviewed event plan.',
    publicOutcome: 'A reusable run-of-show and transparent micro-budget.',
    audience: 'Hosts, stewards, teachers, producers, and neighborhood conveners.',
  },
];

export const UES_COURSES = UES_LAUNCH_COURSES;

export const ONLINE_SEASON_ZERO_BUDGET: ProgramBudget = {
  id: 'online-season-zero',
  name: 'Online Season 0',
  duration: 'six weeks',
  totalUsd: 30_500,
  lines: [
    { label: 'Faculty honoraria', amountUsd: 9_600, purpose: '48 live sessions at a $200 planning rate.' },
    { label: 'Two program stewards', amountUsd: 6_000, purpose: 'Enrollment, access, attendance, coordination, and public notes.' },
    { label: 'Learner access grants', amountUsd: 4_000, purpose: 'Connectivity, care, equipment, and other participation barriers.' },
    { label: 'Captions, transcripts, and accessibility', amountUsd: 2_800, purpose: 'Make the online studios meaningfully reachable.' },
    { label: 'Platform, production, and site', amountUsd: 2_100, purpose: 'Course pages, streaming, archive, and production utilities.' },
    { label: 'Legal, insurance, and fiscal-sponsor exploration', amountUsd: 2_500, purpose: 'Qualified review before the program makes new claims or commitments.' },
    { label: 'Contingency', amountUsd: 3_500, purpose: 'Protect the teaching plan from ordinary launch surprises.' },
  ],
};

export const UES_ONLINE_BUDGET = ONLINE_SEASON_ZERO_BUDGET;

export const TWENTY_FIVE_MILE_FIELD_BUDGET: ProgramBudget = {
  id: 'twenty-five-mile-field-layer',
  name: 'El Segundo + 25-mile field layer',
  duration: 'one six-week season',
  totalUsd: 29_000,
  lines: [
    { label: 'Partner rooms and field venues', amountUsd: 900, purpose: 'A blended planning allowance informed by published City of El Segundo rates.' },
    { label: 'Permits and insurance', amountUsd: 3_000, purpose: 'Event-specific coverage, permits, deposits, and compliance.' },
    { label: 'Materials', amountUsd: 6_000, purpose: 'Shared tools, print, plants, workshop supplies, and field kits.' },
    { label: 'Local faculty', amountUsd: 9_600, purpose: 'Pay the people teaching practical local knowledge.' },
    { label: 'Transit and access grants', amountUsd: 4_500, purpose: 'Help the 25-mile layer remain reachable without assuming a car.' },
    { label: 'Food, operations, and public receipts', amountUsd: 5_000, purpose: 'Hospitality, site operations, documentation, and transparent reporting.' },
  ],
};

export const UES_FIELD_BUDGET = TWENTY_FIVE_MILE_FIELD_BUDGET;

export const SATELLITE_SEED_BUDGET: ProgramBudget = {
  id: 'satellite-seed',
  name: 'One city satellite seed',
  duration: 'six months',
  totalUsd: 37_500,
  lines: [
    { label: 'Local steward', amountUsd: 12_000, purpose: 'One accountable local operator for six months.' },
    { label: 'Faculty', amountUsd: 9_600, purpose: 'A locally selected teaching pool.' },
    { label: 'Partner rooms', amountUsd: 4_800, purpose: 'Libraries, studios, community rooms, cafes, parks, and schools before leases.' },
    { label: 'Learner access', amountUsd: 3_600, purpose: 'Local participation and care grants.' },
    { label: 'Materials', amountUsd: 2_500, purpose: 'Course-specific shared supplies.' },
    { label: 'Exchange travel', amountUsd: 2_500, purpose: 'One meaningful cross-city teaching exchange.' },
    { label: 'Insurance and administration', amountUsd: 2_500, purpose: 'Local compliance, agreements, bookkeeping, and reporting.' },
  ],
};

export const UES_FUNDING_MILESTONES = [
  { amountUsd: 6_000, name: 'Access foundation', unlocks: 'Core platform, captions, and the first learner access grants.' },
  { amountUsd: 15_000, name: 'First four tracks', unlocks: 'Faculty and stewardship for the first half of the launch catalog.' },
  { amountUsd: 46_600, name: 'Full active term', unlocks: 'All ten maintained self-paced course rooms plus the shared access and production pool.' },
  { amountUsd: 77_100, name: 'Online first', unlocks: 'The active self-paced term plus the Online Season 0 teaching foundation.' },
  { amountUsd: 106_100, name: 'Local field layer', unlocks: 'The full online base plus El Segundo and the 25-mile in-person layer.' },
  { amountUsd: 363_600, name: 'Five-city fellowship', unlocks: 'The current local program, five six-month satellite seeds, and a $70,000 network commons.' },
] as const;

export const UES_ACTIVE_ONLINE_BASE_USD = UES_SEASON_ONE_BUDGET.totalUsd
  + ONLINE_SEASON_ZERO_BUDGET.totalUsd;

export const UES_ACTIVE_LOCAL_BASE_USD = UES_ACTIVE_ONLINE_BASE_USD
  + TWENTY_FIVE_MILE_FIELD_BUDGET.totalUsd;

export const UES_SCALE_SCENARIOS = [
  { id: 'online', label: 'Active + online foundation', citySeeds: 0, networkCommonsUsd: 0, totalUsd: UES_ACTIVE_ONLINE_BASE_USD },
  { id: 'local', label: 'Online + 25-mile field layer', citySeeds: 0, networkCommonsUsd: 0, totalUsd: UES_ACTIVE_LOCAL_BASE_USD },
  { id: 'five-city', label: 'Five-city fellowship', citySeeds: 5, networkCommonsUsd: 70_000, totalUsd: UES_ACTIVE_LOCAL_BASE_USD + (5 * SATELLITE_SEED_BUDGET.totalUsd) + 70_000 },
  { id: 'twelve-city', label: 'Twelve-city network', citySeeds: 12, networkCommonsUsd: 120_000, totalUsd: UES_ACTIVE_LOCAL_BASE_USD + (12 * SATELLITE_SEED_BUDGET.totalUsd) + 120_000 },
  { id: 'twenty-five-city', label: 'Twenty-five-city network', citySeeds: 25, networkCommonsUsd: 210_000, totalUsd: UES_ACTIVE_LOCAL_BASE_USD + (25 * SATELLITE_SEED_BUDGET.totalUsd) + 210_000 },
] as const;

export const UES_SATELLITE_RULES = [
  'No permanent lease in year one; begin with trusted local partner spaces and prove the rhythm first.',
  'Every satellite has a paid local steward and a small local advisory table.',
  'Use a 70/20/10 curriculum mix: 70% locally authored, 20% shared UES commons, and 10% cross-city exchange.',
  'Publish a local budget, schedule, faculty roster, access path, and season receipt.',
  'Contributors can support the work but cannot purchase admissions decisions, curriculum control, governance power, or faculty appointments.',
] as const;

export const UES_CITY_TIERS = [
  {
    id: 'major',
    label: 'Major-city studio',
    examples: ['Los Angeles', 'New York', 'Mexico City'],
    annualPlanningRangeUsd: { minimum: 75_000, maximum: 110_000 },
    character: 'A neighborhood-scale program inside a large city, not a citywide brand office.',
  },
  {
    id: 'mid-major',
    label: 'Mid-major city studio',
    examples: ['Detroit', 'Pittsburgh', 'Minneapolis'],
    annualPlanningRangeUsd: { minimum: 55_000, maximum: 75_000 },
    character: 'A strong local steward, recurring partner room, and courses built around the city\'s actual knowledge.',
  },
  {
    id: 'small-city',
    label: 'Small-city studio',
    examples: ['Santa Fe', 'Providence', 'Chattanooga'],
    annualPlanningRangeUsd: { minimum: 35_000, maximum: 50_000 },
    character: 'A light physical footprint with high local authorship and direct neighbor-to-neighbor accountability.',
  },
] as const;

export const UES_SATELLITE_MODEL = {
  seedBudget: SATELLITE_SEED_BUDGET,
  rules: UES_SATELLITE_RULES,
  cityTiers: UES_CITY_TIERS,
} as const;

export const UES_GOVERNANCE = {
  rules: [
    'Publish the operating budget, material changes, and a plain-language receipt at least monthly while funds are active.',
    'Require two named stewards to approve any single expenditure above $2,500.',
    'Keep learner data minimal, private by default, and separate from public course artifacts.',
    'Pay faculty and local operators before spending on permanent space or institutional spectacle.',
    'Review each season with learners, faculty, stewards, and local partners before opening the next one.',
  ],
  caveats: [
    'Contributions are voluntary support, not an investment, security, membership interest, or promise of financial return.',
    'Do not describe a contribution as tax-deductible unless it is formally received by a qualified organization or approved fiscal sponsor.',
    'Tezos contributions are mainnet transactions, may incur network fees, and should require explicit wallet confirmation.',
    'Budgets, city examples, and expansion ranges are planning estimates rather than contracts or announced locations.',
    'The cannabis course is for adults 21+ and is educational; it does not provide medical, legal, consumption, or unlawful cultivation advice.',
  ],
} as const;

export const UES_SOURCES = {
  cityFees: {
    title: 'City of El Segundo Financial Reports and Master Fee Schedules',
    url: 'https://www.elsegundo.gov/government/departments/finance/financial-reports/-fsiteid-1',
    use: 'Official index for current budget and fee materials. The public index still exposes FY 2025-2026 rates, so every room, park, permit, and deposit must be re-quoted before booking.',
  },
  cityFees2026Agenda: {
    title: 'City Council agenda: FY 2026-2027 Master Fee Schedule adoption',
    url: 'https://www.elsegundo.gov/home/showpublisheddocument/12765/639131412165730000',
    use: 'Evidence that the FY 2026-2027 fee schedule was placed before Council in May 2026; the program does not treat prior-year line items as current quotes.',
  },
  irsPublication526: {
    title: 'IRS Publication 526: Charitable Contributions',
    url: 'https://www.irs.gov/publications/p526',
    use: 'Basis for the program\'s conservative tax-deductibility language.',
  },
  tezosWallets: {
    title: 'Tezos developer documentation: Wallets',
    url: 'https://docs.tezos.com/dApps/wallets',
    use: 'Official wallet-connection reference.',
  },
  tezosTransactions: {
    title: 'Tezos developer documentation: Sending transactions',
    url: 'https://docs.tezos.com/dApps/sending-transactions',
    use: 'Official transaction and wallet-confirmation reference.',
  },
} as const;

export const UES_PROGRAM_PAYLOAD = {
  identity: UES_PROGRAM,
  operatingModel: ONLINE_SEASON_ZERO,
  courses: UES_COURSES,
  nextOnlineTerm: ONLINE_SEASON_ONE,
  nextCourses: UES_SEASON_ONE_COURSES,
  budgets: {
    online: UES_ONLINE_BUDGET,
    nextOnlineTerm: UES_SEASON_ONE_BUDGET,
    fieldLayer: UES_FIELD_BUDGET,
    satelliteSeed: UES_SATELLITE_MODEL.seedBudget,
  },
  fundingMilestones: UES_FUNDING_MILESTONES,
  scaleScenarios: UES_SCALE_SCENARIOS,
  satelliteRules: UES_SATELLITE_RULES,
  cityTiers: UES_CITY_TIERS,
  satelliteModel: UES_SATELLITE_MODEL,
  governance: UES_GOVERNANCE,
  sources: UES_SOURCES,
} as const;
