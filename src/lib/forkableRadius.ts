/**
 * The Forkable Radius — UES Working Paper 2026-11.
 * The integration thesis: parallel civic infrastructure for the 88-city
 * federation problem of Los Angeles County, with UES as the prototype
 * reference implementation.
 */

export const PAPER_META = {
  title: 'The Forkable Radius: Parallel Civic Infrastructure for the 88-City Federation Problem',
  shortTitle: 'The Forkable Radius',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  publication: 'UES Working Papers in Civic Infrastructure, Vol. 1',
  paperNumber: 'UES-WP-2026-11',
  date: '2026-05-07',
  thesis: 'Los Angeles County contains 88 incorporated cities plus large unincorporated zones, sharing watersheds, air, transit, fire risk, and homeless populations across borders that coordinate like sovereign nations. The University of El Segundo argues that the answer is not consolidation but federation — small, well-stewarded 25-mile-radius local networks running compatible parallel-civic-infrastructure stacks, connected by thin protocols. We propose six parallel-system shapes (civic personal agent · neighborhood OS · mutual aid mesh · micro-treasuries · voluntary association infrastructure · civic translation layer) and document UES as a working reference implementation across all six.',
};

export const ABSTRACT = `Los Angeles County is the largest local-government failure in the United States by every metric that matters: 88 incorporated cities and dozens of unincorporated communities cannot coordinate watershed management, post-fire response, transit, housing, or basic civic services across municipal borders. The University of El Segundo argues that the answer to the 88-city federation problem is not consolidation (politically impossible) and not super-app capture (extractive and brittle) but federation — small, well-stewarded local networks at the 25-mile-radius scale, each running a compatible parallel-civic-infrastructure stack, composing through thin protocols. This paper documents six parallel-system shapes that the University has either prototyped, designed, or is actively building: the civic personal agent, the neighborhood OS, the persistent mutual aid mesh, civic micro-treasuries, voluntary association infrastructure, and the multilingual civic translation layer. We close by relating each shape to existing UES programs (Marine Layer, Commons, Civic Layer, Geology, Honey League, Adventure Networks) and to the LA28 Olympics as a forcing function that makes the 2026–2027 build window structurally important.`;

export type SystemShape = {
  number: number;
  name: string;
  problem: string;
  parallelSystem: string;
  uesProto: string;
  status: 'prototype' | 'designed' | 'building' | 'shipping';
  forkability: string;
};

export const SIX_SHAPES: SystemShape[] = [
  {
    number: 1, name: 'The Civic Personal Agent',
    problem: 'A typical LA household consumes hundreds of hours per year on bureaucratic interactions — permits, property tax, school district forms, HOA, jury duty, DMV, parking. Each interaction is individually trivial; collectively they are a tax on civic participation that disproportionately falls on the time-poor.',
    parallelSystem: 'One AI assistant per resident, scoped to handle the entire bureaucratic stack on the resident\'s behalf. Drafts the permit application; tracks the property-tax payment cycle; pulls the school-district announcements through a translator; reminds about jury duty; handles parking-citation appeals. Lives on the resident\'s device or in a personal-data vault, not a city server.',
    uesProto: 'Not yet built at UES. The Goal Machine (/goal) prototypes the personal-state-tracking layer; the Commons ledger (/commons) prototypes the receipts-over-promises principle; the Civic Layer (/civic-layer) prototypes the literacy-before-engagement principle. The next UES surface in this direction would be /civic-agent — a templated personal-civic-AI scaffold that any cohort member can deploy.',
    status: 'designed',
    forkability: 'High. The pattern is a personal AI scaffold with civic-API adapters; the adapters are city-specific, the scaffold is universal. El Segundo\'s scaffold can fork to Manhattan Beach with two days of API work.',
  },
  {
    number: 2, name: 'The Neighborhood OS',
    problem: 'Nextdoor is a feed, not a coordination surface. The neighborhood-scale problems — events, mutual-aid matching, micro-economic exchange (lend the ladder, watch the dog), small-group decision-making, treasury — fall through the cracks between Slack (too tight), Nextdoor (too loose), and city government (too distant). Most blocks have no shared coordination surface at all.',
    parallelSystem: 'A neighborhood OS scoped to walkable scale — not "all of LA," not even "all of El Segundo," but this block, this five-block radius. Scheduling, treasury, mutual-aid matching, micro-economic exchange, light governance for 30–150 households.',
    uesProto: 'PointCast Commons (/commons) is the prototype of the give-back-ledger layer. The Common Forms architectural plan (/common-forms) is the prototype of the shared-built-environment layer. Marine Layer cohort cap-12 (/marine-layer) is the prototype of the small-group governance layer. The next move is to package these as a "neighborhood OS in a box" any block captain could deploy in a weekend.',
    status: 'building',
    forkability: 'Highest of the six shapes. The product is templated: a block captain in Hermosa, Eagle Rock, or Highland Park forks the El Segundo template, swaps in their geography, and ships in 48 hours. Federation across blocks is via thin protocols (shared schemas, JSON mirrors).',
  },
  {
    number: 3, name: 'The Persistent Mutual Aid Mesh',
    problem: 'The Palisades and Eaton fires of January 2025 demonstrated that emergent neighborhood mutual-aid networks were faster and better-targeted than institutional response — and then mostly evaporated within months. Climate change will keep providing forcing functions; the next major event will rediscover the same ad-hoc patterns from scratch.',
    parallelSystem: 'Pre-built dormant infrastructure that lies inactive most of the time and activates under pressure: opt-in skill/resource registry, communication backbone independent of any single platform, light governance for who gets help first. Insurance-shaped: small contribution from everyone, coverage when needed.',
    uesProto: 'Not yet built. The closest UES analogue is the Commons stewardship circle structure (/commons), which is shaped for sustained low-load coordination rather than emergency activation. The next surface would be /mutual-aid-mesh — a templated dormant-infrastructure layer that any neighborhood OS can subscribe to.',
    status: 'designed',
    forkability: 'High. The dormant-infrastructure pattern is a registry plus a communication backbone plus a governance protocol; all three are templatable. The federation requirement is thin — every mesh needs to know how to reach its neighbors when their mesh activates.',
  },
  {
    number: 4, name: 'Civic Micro-Treasuries',
    problem: 'Block-scale and neighborhood-scale coordination problems require small pools of money — the new bench, the parklet, the block-party permit, the security camera, the kid\'s lemonade-stand insurance. City budgets cannot serve these because they require defensibility to a million stakeholders. Private money cannot serve them because the goods are shared. The middle layer — small treasuries, transparent governance, light fundraising — is missing in most of LA.',
    parallelSystem: 'Block-level and neighborhood-level pooled money for shared goods. Quadratic funding, Nouns-style auctions, RetroPGF, or simple proportional contribution all work better at this scale than at city or protocol scale because the stakeholders know each other.',
    uesProto: 'PointCast Commons (/commons) is exactly this — the give-back ledger, the First Bench pilot at $1,800, the five-phase acquisition thesis, the eventual CLT shell entity. The Sponsor a Bench surface (/sponsor-a-bench) prototypes the donor-facing side. The Common Forms architectural plan (/common-forms) prototypes the spending side.',
    status: 'shipping',
    forkability: 'Highest of the six shapes for proven forkability — the entire UES Commons surface set is forkable today by any neighborhood inside the radius. The CLT shell entity is the structural innovation; once filed, the legal vehicle accepts other neighborhoods\' parcels.',
  },
  {
    number: 5, name: 'Voluntary Association Infrastructure',
    problem: 'Parks departments are abandoning programming. The third-place problem in LA is acute and getting worse: post-COVID third places have hollowed out, car geography prevents walking-past discovery, and the institutions that historically aggregated voluntary association (churches, clubs, fraternal orders, parks-and-rec leagues) have declined. Running clubs, climbing communities, dad\'s basketball, kids\' chess clubs all run on volunteer time without infrastructure.',
    parallelSystem: 'A templated stack — membership, scheduling, treasury, communication, light governance — packaged so any organizer can deploy it in a weekend. The Squeeze (Mike\'s pickleball cooperative) is the proof-of-concept; the same logic applies to running clubs, climbing communities, dad\'s basketball, kids\' chess.',
    uesProto: 'The Marine Layer (/marine-layer), Court Craft (within /university-of-el-segundo), Honey League (referenced across surfaces), and Adventure Networks (forthcoming /adventure-networks-2) are all instances of voluntary-association infrastructure. The first three are running; AN2 is being scoped for Summer 2026.',
    status: 'shipping',
    forkability: 'High. The Squeeze model has been informally forked twice already. The infrastructure stack is templatable; the cohort identity is local.',
  },
  {
    number: 6, name: 'The Civic Translation Layer',
    problem: 'LA County speaks 200+ languages. Civic infrastructure defaults to English. School communications, HOA notices, ballot measures, permit interfaces, emergency alerts — all systematically fail non-English-dominant residents. AI translation is now nearly free and nearly perfect, but no neighborhood OS has wired it as a default.',
    parallelSystem: 'A multilingual default for every civic-information surface. Permit applications auto-translated; ballot-measure summaries available in the resident\'s language; emergency alerts pushed in the household\'s preferred language; school notices translated before the parent reads them. Whoever ships the multilingual default in LA captures a permanent civic position.',
    uesProto: 'Not yet built at UES, primarily because El Segundo is small and English-dominant. The shape is portable, however: any UES surface (Commons, Civic Layer, Marine Layer) could expose a translation toggle in the JSON mirror layer with negligible additional infrastructure. The first UES surface to ship this becomes the federation reference for the multilingual default.',
    status: 'designed',
    forkability: 'Highest of the six shapes for federation impact. A multilingual default that works for one neighborhood works for all neighborhoods at near-zero marginal cost; the LA28 Olympics is a natural forcing function for cross-municipal adoption.',
  },
];

export type DesignPrinciple = { principle: string; meaning: string };

export const DESIGN_PRINCIPLES: DesignPrinciple[] = [
  { principle: 'Voluntary, not mandatory', meaning: 'Users can leave at any time. The system must earn participation. Forces quality.' },
  { principle: 'Composable, not totalizing', meaning: 'Small pieces, well-defined edges. Do not be the platform; be one of many tools that share a protocol.' },
  { principle: 'Self-sustaining economics', meaning: 'Membership, treasury, tokens, subscriptions — not grants. The system must generate the resources it needs.' },
  { principle: 'Captured value flows to participants', meaning: 'Economic surplus stays with the cohort. Not extracted upward to a platform owner.' },
  { principle: 'Forkable by default', meaning: 'Templated so other neighborhoods adopt it in a weekend. The protocol is the IP; the local instance is the deployment.' },
  { principle: 'AI-native, agent-friendly', meaning: 'Assume both human and AI participants. Every surface has a JSON mirror, an agents.json manifest, a machine-readable structure.' },
  { principle: 'Place-anchored, not place-blind', meaning: 'The 25-mile radius is the boundary. Federation across radii is via thin protocol; coordination within is via thick relationship.' },
];

export type ForcingFunction = { name: string; window: string; relevance: string };

export const FORCING_FUNCTIONS: ForcingFunction[] = [
  { name: 'LA28 Summer Olympics', window: 'Planning windows close 2026–2027; Games July–August 2028', relevance: 'The largest coordination event the LA region will see in our lifetimes. Anything built now that can plausibly point at "LA28-ready" gets pulled along by the gravitational field. Most operators are not yet thinking about it.' },
  { name: 'The next major fire', window: 'Statistically certain within 24 months', relevance: 'The Palisades and Eaton fires of January 2025 demonstrated the mutual-aid pattern; the next event will repeat it, with or without persistent infrastructure. Whoever has built the substrate before the next event captures the next decade of civic resilience.' },
  { name: 'AI agent commodification', window: 'Throughout 2026–2027', relevance: 'Civic personal agents become buildable in 2026 in a way they were not in 2024. The first team to ship a great LA-specific civic agent wins a defensible position because cities themselves cannot move at this speed.' },
  { name: 'Post-college credential collapse', window: '2026 onward, accelerating', relevance: 'College costs are visibly insane to current 17-year-olds; AI is collapsing entry-level white-collar work; employers are actively experimenting with alternative credentials. The Adventure Networks 2.0 season (UES Track, forthcoming) is positioned at this inflection.' },
  { name: 'Parks-department programming abandonment', window: 'Continuing, accelerating post-COVID', relevance: 'City parks departments are abandoning programming for cost reasons. Voluntary association infrastructure (running clubs, sports leagues, kids\' programs) is reverting to volunteer time without infrastructure. The Squeeze model is positioned at this gap.' },
];

export const FEDERATION_PROTOCOL = {
  thesis: 'Federation across the 88-city LA County happens not through consolidation but through compatible local instances connected by thin protocols. Each instance is a 25-mile-radius local network running its own version of the parallel-civic-infrastructure stack. Federation is achieved through shared schemas, JSON mirrors, agent-readable surfaces, and a small set of cross-instance protocols.',
  layers: [
    { layer: 'L0 — Shared schemas', detail: 'JSON-LD types for civic events, give-back receipts, mutual-aid requests, treasury entries, voluntary-association memberships. Defined once, used by every instance.' },
    { layer: 'L1 — Per-instance JSON mirrors', detail: 'Every instance exposes its data at predictable paths: /commons.json, /events.json, /mutual-aid.json, /civic-agenda.json. Federation reads via simple HTTP GET.' },
    { layer: 'L2 — agents.json manifest', detail: 'Every instance ships an /agents.json that names its agents, capabilities, and contact protocols. AI agents from any instance can negotiate with agents from any other instance.' },
    { layer: 'L3 — Cross-instance treasury settlement', detail: 'When a cross-instance project happens — a regional fire-defensibility cooperative, a transit corridor cleanup, an LA28 site activation — settlement runs through a thin shared protocol. Tezos FA2 mints, Stripe Connect, or quadratic-funding pools all work as the settlement layer.' },
    { layer: 'L4 — Thin governance', detail: 'A federation council with one representative per active instance. Meets quarterly. Decides only on cross-instance protocol changes; never on local-instance affairs.' },
  ],
  antiPatterns: [
    'Super-app consolidation: any attempt to build "the LA super-app" extracts value upward and destroys local stewardship. Prevent by enforcing forkability.',
    'Mandatory adoption: any attempt to require neighborhoods to join the federation re-creates the political failure of LA County itself. Prevent by keeping joining and leaving costless.',
    'Platform-owned IP: any attempt to centralize the templates as proprietary IP destroys the forkability that makes the model work. Prevent by publishing every template under CC0 or equivalent.',
  ],
};

export const REFERENCES = [
  { id: 'la-county', cite: 'Los Angeles County. (2024). *Annual Report on Cities and Communities*. Los Angeles, CA.' },
  { id: 'palisades-eaton', cite: 'CalFire. (2025). *Palisades and Eaton Fire Incident Reports*. Sacramento, CA.' },
  { id: 'la28', cite: 'LA28 Organizing Committee. (Continuing). *LA28 Olympic and Paralympic Games Planning Documents*. la28.org.' },
  { id: 'pointcast-commons', cite: 'University of El Segundo. (2026). *PointCast Commons: Acquisition Thesis*. UES-WP-2026-02. https://pointcast.xyz/commons' },
  { id: 'pointcast-civic', cite: 'University of El Segundo. (2026). *Civic Layer: Show Up Before You Speak*. UES-WP-2026-03. https://pointcast.xyz/civic-layer' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer: A Place-Based Meditative Program*. UES-WP-2026-01. https://pointcast.xyz/marine-layer' },
  { id: 'pointcast-common-forms', cite: 'University of El Segundo. (2026). *Common Forms: A Civic Architecture Plan*. UES-WP-2026-11. https://pointcast.xyz/common-forms' },
  { id: 'pointcast-labs', cite: 'University of El Segundo. (2026). *The Lab and the Radius* [series hub]. https://pointcast.xyz/labs' },
  { id: 'pointcast-an2', cite: 'University of El Segundo. (2026, forthcoming). *Adventure Networks 2.0: Season 1 Operational Spec*. https://pointcast.xyz/adventure-networks-2' },
  { id: 'ostrom-1990', cite: 'Ostrom, E. (1990). *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge University Press.' },
  { id: 'olson-1965', cite: 'Olson, M. (1965). *The Logic of Collective Action: Public Goods and the Theory of Groups*. Harvard University Press.' },
  { id: 'jacobs-1961', cite: 'Jacobs, J. (1961). *The Death and Life of Great American Cities*. Random House.' },
];

export const PAPER_NOTES = {
  uesNote: 'UES Working Papers in Civic Infrastructure are non-peer-reviewed publications of the University of El Segundo. Comments to mh@pointcast.xyz.',
  acknowledgments: 'The thesis benefited substantially from a parallel conversation with another AI agent on May 7, 2026 — a generative coordination across two language models, each operating from different priors, neither of them institutionally affiliated. The pattern of multi-agent civic ideation deserves its own future paper. The University thanks the Marine Layer cohort, the Network El Segundo proof point, and the Adventure Networks 2017–2022 alumni network for the empirical base on which the six shapes rest.',
  closingThesis: 'The 88-city federation problem is not solvable by any institution that itself sits inside the failure mode. It is solvable by parallel infrastructure that runs alongside, earns trust through performance, federates through thin protocols, and refuses both consolidation and capture. The University of El Segundo holds 25 miles. The next 25 miles south, north, east, and inland are equally fork-ready. The protocol is the IP; the local instance is the deployment; the federation is the work.',
};
