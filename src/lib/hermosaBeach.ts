/**
 * Hermosa Beach — second concrete fork of the El Segundo template.
 * Companion to /manhattan-beach (the first fork) and /coordinate
 * (the deployment grid). The pattern is now templated; this file is
 * the Hermosa-instance overlay following the same INSTANCE_META /
 * SNAPSHOT / INHERITED_FROM_ES / SPECIFIC_TERRAIN / SIX_SHAPES /
 * 90_DAYS / CORRIDOR shape established with Manhattan Beach.
 */

export const INSTANCE_META = {
  title: 'Hermosa Beach',
  subtitle: 'Second concrete fork of the El Segundo template',
  thesis: 'Hermosa Beach is the natural second fork. It sits between Manhattan Beach (the first fork) and Redondo Beach on the same Strand corridor; it shares the coastal radius with both ES and MB; it has the densest cohort-formation infrastructure in the South Bay (the Pier Plaza, the Comedy & Magic Club, the Hermosa Beach Surfers Walk of Fame) packed into 1.43 sq mi — the smallest by area of the four corridor cities. The forkable-radius pattern is now templated. This page is the Hermosa-instance overlay: what it inherits from the ES template, what is Hermosa-specific, and where the local Land would start.',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'Hermosa Beach Land', dept: '(open · awaiting local commitment)', email: '(forthcoming)' },
  ],
  affiliation: 'Hermosa Beach instance · co-administered with University of El Segundo',
  paperNumber: 'UES-Fork-HB-02',
  date: '2026-05-07',
  parentPaper: 'UES-WP-2026-11 The Forkable Radius',
};

export const HB_SNAPSHOT = {
  population: '~19,500',
  geography: 'South Bay coast, between Manhattan Beach (north) and Redondo Beach (south). 1.43 sq mi — the smallest of the four Strand-corridor cities. ~22 mi southwest of downtown LA.',
  borders: 'Manhattan Beach (north), Redondo Beach (south), Lawndale and Redondo Beach (east), Pacific Ocean (west).',
  medianIncome: '~$155K (high; below MB and ES, above LA County median).',
  techDensity: 'Moderate — many remote workers and small startups; dense walkable downtown along Pier Avenue with a coffee-shop coworking culture.',
  beachCorridor: 'Approximately 2.0 mi of Strand frontage. The Hermosa Pier sits at roughly the geographic mid-point of the four-instance corridor — the natural federation-meeting site.',
  parksAcres: '~25 acres total parkland (lowest absolute parkland of the four corridor cities); the beach itself functions as the de-facto civic commons. Clark Stadium / South Park, Valley Park, Noble Park as principal anchors.',
  existingCivic: 'Hermosa Beach Education Foundation, Hermosa Arts Foundation, Friends of the Hermosa Library, Surfrider South Bay (shared with MB), Hermosa Beach Volleyball, Project: Forward (after-school nonprofit).',
};

export const INHERITED_FROM_ES = [
  { item: 'The 25-mile radius commitment', detail: 'Hermosa\'s instance radius is also 25 miles, centered on Hermosa rather than ES. The ES, MB, and HB radii overlap by approximately 90% — together they cover essentially the same coastal South Bay + adjacent inland geography.' },
  { item: 'The six-shape framework', detail: 'Civic Personal Agent · Neighborhood OS · Mutual Aid Mesh · Civic Micro-Treasury · Voluntary Association Infrastructure · Civic Translation Layer. All six adopted by reference; HB-specific implementations follow.' },
  { item: 'The Commons Acquisition Thesis Phase 0–4', detail: 'Map → Steward → Vehicle → First Parcel → Open Hours. HB starts at Phase 0 alongside MB, but with a tighter geographic footprint — 1.43 sq mi means the mapping phase finishes faster.' },
  { item: 'The give-back ledger six categories', detail: 'Hours · Dollars · Objects · Easement · Expertise · Custody. HB ledger federates with ES and MB via shared schemas.' },
  { item: 'The Marine Layer eight-week practice template', detail: 'Eight-week place-based meditative cycle adopted as the cohort-formation pattern. Sit locations are HB-specific (see below).' },
  { item: 'The Common Forms architectural plan template', detail: 'Twelve commissions across three tiers. HB instance customizes site selection while inheriting the form vocabulary; small footprint means C-tier ($150K+) commissions are constrained.' },
  { item: 'JSON mirrors at every endpoint', detail: 'Federation L1 protocol — every HB surface exposes its data at predictable paths on the hermosabeach.pointcast.xyz subdomain (or equivalent path).' },
  { item: 'CC0 / MIT licensing', detail: 'No proprietary IP between ES, MB, and HB. Forks are free; improvements flow back to the shared template repo.' },
];

export const HB_SPECIFIC_TERRAIN = [
  { feature: 'Pier Plaza', uesAnalogue: 'Plaza El Segundo (the First Sit anchor)', hbDifference: 'Pier Plaza is the densest civic concourse on the Strand corridor — bars, restaurants, the Hermosa Pier itself, the Surfers Walk of Fame plaques. Daily foot traffic exceeds any single ES location. The trade-off: noise. A First Sit at Pier Plaza must be predawn (before 6:30am) or it does not work.' },
  { feature: 'The Hermosa Pier', uesAnalogue: 'Marine Layer Week 8 (Pier Closer) anchor — already cross-referenced', hbDifference: 'Approximately 1,140 ft long, the Hermosa Pier is the geographic midpoint of the four-instance Strand corridor. Natural federation-summit site. Lower visitor density than the MB Pier but a longer pier-base plaza for cohort gatherings.' },
  { feature: 'Comedy & Magic Club', uesAnalogue: 'No direct ES analogue (closest: ES Library reading room)', hbDifference: 'Operating since 1978; a working performance venue with a 300-seat house. A potential civic-host candidate for an annual Hermosa instance gala or quarterly First-Cohort welcomes — exists nowhere else in the four-corridor cities at this scale.' },
  { feature: 'Hermosa Greenbelt', uesAnalogue: 'Powerline easement (Marine Layer Week 2 — Powerline Walk)', hbDifference: 'A linear pedestrian / running path on the bed of the former Santa Fe Railway, ~2.4 mi running roughly the length of the city. Adapted Marine Layer Week 2 sit becomes Greenbelt Walk; same box-breath protocol, paced to footfall on a softer surface.' },
  { feature: 'Hermosa Beach School District (K-8 only)', uesAnalogue: 'No exact ES analogue (ESUSD is K-12)', hbDifference: 'HBSD is K-8 only; high-school students go to Mira Costa (in MB) via tuition agreement. This is a structural civic dependency between HB and MB and a natural federation seam for Shape #5 (Voluntary Association Infrastructure).' },
  { feature: 'No on-site high school + small footprint', uesAnalogue: 'ES has its own high school; ~5.5 sq mi', hbDifference: 'HB cohort recruitment skews younger-adult and older-adult, with a structural under-representation of teen-parent households compared to ES and MB. Plan accordingly: the Civic Personal Agent (Shape #1) recruitment pool is different.' },
  { feature: 'Surfrider South Bay (shared HQ)', uesAnalogue: 'Distributed across ES through volunteer chapters', hbDifference: 'The Surfrider South Bay chapter has historically anchored in HB. Coastal-stewardship and water-quality programs are mature; the Mutual Aid Mesh (Shape #3) coastal-flooding sub-program could partner from day one rather than building from zero.' },
];

export type ShapeStatus = {
  number: number;
  name: string;
  hbStatus: 'forming' | 'speculative' | 'building' | 'shipping' | 'dormant';
  startingPoint: string;
  firstNinetyDays: string;
};

export const HB_SIX_SHAPES: ShapeStatus[] = [
  { number: 1, name: 'Civic Personal Agent', hbStatus: 'speculative', startingPoint: 'No HB-specific civic-AI infrastructure. The county / state / utility adapters built for ES (LA County Assessor, CA DMV, LA Court, LADWP) all apply unchanged.', firstNinetyDays: 'HB-specific adapters: City of HB permits & parks, Hermosa Beach School District (K-8), HB Recreation. Approximately 3 adapters × 10-20 hours each = 30-60 hours of cohort engineering work. Smaller than MB because no separate USD.' },
  { number: 2, name: 'Neighborhood OS', hbStatus: 'forming', startingPoint: 'No formal neighborhood association infrastructure equivalent to MB\'s North End. The Hermosa Beach Education Foundation and the Hermosa Arts Foundation are the closest existing structures. Pier Plaza and the Greenbelt are natural cohort-gathering anchors.', firstNinetyDays: 'Recruit first 5-9 HB cohort members. Run first HB Marine Layer eight-week cycle anchored at the Hermosa Pier. Establish the HB Commons ledger at /commons (HB instance) with the same six give-back categories.' },
  { number: 3, name: 'Mutual Aid Mesh', hbStatus: 'dormant', startingPoint: 'Like MB, post-Palisades and Eaton 2025 informal networks emerged in HB and dissipated. Coastal flooding (HB sits at the lowest median elevation of the four corridor cities) and earthquake (Newport-Inglewood Fault traces through the eastern edge) are the principal risks.', firstNinetyDays: 'Phase 0 mapping: skill registry, resource registry, communication backbone. Surfrider partnership for the coastal-flooding sub-program. The annual federation drill — see /mutual-aid-mesh — is queued for Year 2.' },
  { number: 4, name: 'Civic Micro-Treasury', hbStatus: 'speculative', startingPoint: 'No HB-specific Commons-equivalent. Pier Plaza, the Greenbelt, the Pier itself are all potential treasury anchors. Median household income lower than MB but higher than ES; fundraising potential per cohort member is mid-pack of the four corridor cities.', firstNinetyDays: 'Establish HB Commons ledger as first deliverable. Pick a "First Bench" pilot — likely the Greenbelt at 8th Street, or the Pier base. Cost band $1.8-2.5K. Trigger threshold: 25 ledger weight.' },
  { number: 5, name: 'Voluntary Association Infrastructure', hbStatus: 'forming', startingPoint: 'Existing infrastructure: Hermosa Beach Education Foundation, Hermosa Arts Foundation, Friends of the Hermosa Library, HB Volleyball, Project: Forward, Surfrider South Bay. Strong base — comparable to MB on a smaller footprint.', firstNinetyDays: 'Catalog existing HB voluntary associations. Identify 2 that would benefit from the Marine Layer / Court Craft / Honey League stack. Offer the template; do not compete. Prioritize the Greenbelt-stewardship co-op as a templated form Surfrider South Bay could adopt.' },
  { number: 6, name: 'Civic Translation Layer', hbStatus: 'speculative', startingPoint: 'HB is more English-dominant than even MB; lower priority than for inland cohort sites. A modest Spanish (es) translation toggle is justified by Recreation-program participants and the South Bay\'s wider Spanish-speaking population.', firstNinetyDays: 'Inherit ES Civic Translation infrastructure as-is. Wire HB JSON mirrors to expose the es toggle. Lowest priority of the six shapes for the first 90 days.' },
];

export const FIRST_NINETY_DAYS_PLAN = [
  { week: '0', milestone: 'Local Land identified', detail: 'A founder-figure inside Hermosa Beach commits to ~8 hours/week for 90 days. Same role specification as MB: coordinator, demonstration-walker, stewardship-circle convener. Without this role filled, none of the rest happens.' },
  { week: '1-2', milestone: 'Forkable Radius reading + MB visit', detail: 'Local Land reads /forkable-radius, /coordinate, /manhattan-beach (the MB scaffold), and the four prior Lab and Radius case papers. Walks the MB First Bench site, if one exists by then. Total reading and walking time approximately 6 hours.' },
  { week: '3-4', milestone: 'First HB cohort recruitment', detail: 'Recruit 5-9 Hermosa Beach residents willing to commit to a Marine Layer eight-week cycle plus monthly Commons stewardship. Cap 12; floor 5.' },
  { week: '5-6', milestone: 'First HB sit at the Pier', detail: 'Adapted Marine Layer Week 1 sit at the Hermosa Pier base, predawn. Same 4-7-8 breath protocol. Pier Plaza is the cohort\'s anchor location.' },
  { week: '7-8', milestone: 'HB Commons ledger live', detail: 'A separate HB ledger surface goes live with the same six give-back categories. First five seed receipts logged. Federation L1 handshake with ES and MB ledgers.' },
  { week: '9-10', milestone: 'First Bench site identified', detail: 'Cohort identifies the HB First Bench pilot site. Most likely candidates: Greenbelt at 8th Street, Pier base, or Clark Stadium overlook. Cost band $1.8-2.5K. Parks-department conversation begins.' },
  { week: '11-12', milestone: 'Federation handshake formalized', detail: 'HB instance opens its JSON mirrors at predictable paths. ES and MB instances subscribe; HB subscribes to both. The federation council adds HB as the third active instance. The corridor now has three of four cities live.' },
  { week: '13', milestone: 'Public review and decision', detail: 'Local Land reports on the first 90 days. Cohort decides: continue, restart, or honestly retire. Decision published on /hermosa-beach as a status update.' },
];

export const STRAND_CORRIDOR_POSITION = {
  thesis: 'Hermosa is the geographic midpoint of the four-instance Strand corridor (ES → MB → HB → Redondo). The Hermosa Pier is the natural site for the annual federation council meeting. The Hermosa Greenbelt is the natural inland-parallel to the Strand: a second linear corridor running north-south through the city, connecting the corridor instances by a parallel non-coastal route.',
  whyMidpointMatters: [
    'Equal travel time from ES (~3 mi north) and Redondo (~3 mi south); the four-instance council can meet at HB Pier without burdening any single instance.',
    'Hermosa Greenbelt + Strand creates a corridor doubling — a coastal corridor and an inland corridor, both linear, both walkable. Federation drills can use either based on weather, event, or risk profile.',
    'Smallest footprint of the four corridor cities means HB cohort can map its entire 1.43 sq mi in one quarter — a useful pace-setting reference for the larger MB and ES cohorts.',
    'Hermosa Pier is approximately the median-foot-traffic pier of the four; a quieter civic concourse than MB Pier, busier than the Strand at any single ES access point. A Goldilocks cohort-gathering site.',
  ],
  parallelToCases: 'Bell Labs at Murray Hill sat 25 mi west of Manhattan, equidistant between corporate finance (NYC) and university research (Princeton). Hermosa is the South-Bay equivalent midpoint between the four-corridor cities — equidistant from Strand-northern (ES, MB) and Strand-southern (Redondo) instances. The midpoint is not the busiest, but it is where the corridor knits.',
};

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-coordinate', cite: 'University of El Segundo. (2026). *Coordinate · Six-Shape Deployment Grid*. https://pointcast.xyz/coordinate' },
  { id: 'pointcast-manhattan-beach', cite: 'University of El Segundo. (2026). *Manhattan Beach Instance*. UES-Fork-MB-01. https://pointcast.xyz/manhattan-beach' },
  { id: 'pointcast-commons', cite: 'University of El Segundo. (2026). *PointCast Commons*. UES-WP-2026-02. https://pointcast.xyz/commons' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer' },
  { id: 'pointcast-common-forms', cite: 'University of El Segundo. (2026). *Common Forms · Civic Architecture Plan*. https://pointcast.xyz/common-forms' },
  { id: 'pointcast-mutual-aid', cite: 'University of El Segundo. (2026). *Mutual Aid Mesh*. UES-Shape-03. https://pointcast.xyz/mutual-aid-mesh' },
  { id: 'hb-city', cite: 'City of Hermosa Beach. (Continuing). *City Services and Programs*. hermosabeach.gov.' },
  { id: 'hbef', cite: 'Hermosa Beach Education Foundation. (Continuing). *Programs and Funding*. hbef.org.' },
  { id: 'hb-greenbelt', cite: 'City of Hermosa Beach. (Continuing). *Hermosa Greenbelt Master Plan*. hermosabeach.gov/parks.' },
  { id: 'la-county-strand', cite: 'Los Angeles County Department of Beaches and Harbors. (Continuing). *Marvin Braude Bike Trail · The Strand*. beaches.lacounty.gov.' },
];

export const INSTANCE_NOTES = {
  uesNote: 'This page is the Hermosa Beach instance scaffold — the second concrete fork after Manhattan Beach. The HB instance is currently in Phase 0 (mapping) and will remain so until a local Land commits. The framework is fully forkable; deployment is awaiting human commitment. The cloning is faster than MB was; a third fork (Redondo) is templatable in days.',
  invitation: 'If you live in Hermosa Beach and want to be the local Land for the second concrete fork — the founder-figure who runs the first 90 days, recruits the first cohort, and convenes the stewardship circle — email mh@pointcast.xyz with one paragraph on what brings you to this and which shape you would start with. Approximately 8 hours per week for 90 days. After Day 90, the HB instance is yours to administer, federate, or honestly retire.',
};
