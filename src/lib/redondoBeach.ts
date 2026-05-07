/**
 * Redondo Beach — third concrete fork of the El Segundo template.
 * Companion to /manhattan-beach (UES-Fork-MB-01) and /hermosa-beach
 * (UES-Fork-HB-02). With Redondo scaffolded, all four candidate
 * Strand-corridor cities have an instance scaffold; the corridor
 * federation ladder is structurally complete.
 */

export const INSTANCE_META = {
  title: 'Redondo Beach',
  subtitle: 'Third concrete fork — the corridor\'s south anchor',
  thesis: 'Redondo Beach is the south terminus of the four-city Strand corridor. With approximately 70,000 residents across 6.2 sq mi (5.9 land + 0.3 water), it is the largest of the four corridor cities by population and the most complex by geography — combining the King Harbor commercial marina, the Esplanade bluff overlook, the Riviera Village walkable downtown, and a population almost twice Manhattan Beach\'s. Its civic infrastructure is correspondingly deeper: an established harbor commission, a separate Beach Cities Health District (shared with HB and MB), the Galleria-redevelopment-era civic muscle. This page is the Redondo-instance overlay: what it inherits from ES, what is RB-specific, and where the local Land would start. With this page shipped, the corridor scaffold is complete: ES + MB + HB + RB.',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'Redondo Beach Land', dept: '(open · awaiting local commitment)', email: '(forthcoming)' },
  ],
  affiliation: 'Redondo Beach instance · co-administered with University of El Segundo',
  paperNumber: 'UES-Fork-RB-03',
  date: '2026-05-07',
  parentPaper: 'UES-WP-2026-11 The Forkable Radius',
};

export const RB_SNAPSHOT = {
  population: '~70,000',
  geography: 'South Bay coast, immediately south of Hermosa Beach, immediately west of Torrance. 6.2 sq mi (5.9 land + 0.3 water — King Harbor and the harbor breakwater). The largest of the four corridor cities by population and area.',
  borders: 'Hermosa Beach (north), Torrance (south + east), Manhattan Beach (north via inland panhandle), Pacific Ocean (west).',
  medianIncome: '~$120K (lowest of the four corridor cities, but still well above LA County median).',
  techDensity: 'Moderate-low — fewer tech offices than MB; more aerospace heritage (Northrop Grumman partial presence; legacy TRW / Northrop campuses inland).',
  beachCorridor: 'Approximately 2.0 mi of Strand frontage — the corridor\'s south terminus. Strand transitions to Torrance Beach at the Redondo / Torrance city line (RAT Beach).',
  parksAcres: '~110 acres total parkland; Veterans Park, Aviation Park, Wilderness Park, Alta Vista Park as principal anchors. Plus King Harbor itself as a quasi-public maritime commons.',
  existingCivic: 'Redondo Beach Education Foundation, Beach Cities Health District (shared HB+MB+RB), Riviera Village Association, King Harbor Yacht Club, AYSO Region 6 (large), Redondo Beach Chamber, Friends of Redondo Beach Libraries.',
};

export const INHERITED_FROM_ES = [
  { item: 'The 25-mile radius commitment', detail: 'RB instance radius is 25 miles, centered on Redondo. Overlaps with ES, MB, HB radii by approximately 85%. Together the four radii cover essentially the same coastal South Bay + adjacent inland geography.' },
  { item: 'The six-shape framework', detail: 'Civic Personal Agent · Neighborhood OS · Mutual Aid Mesh · Civic Micro-Treasury · Voluntary Association Infrastructure · Civic Translation Layer. All six adopted by reference; RB-specific implementations follow.' },
  { item: 'The Commons Acquisition Thesis Phase 0–4', detail: 'Map → Steward → Vehicle → First Parcel → Open Hours. RB starts at Phase 0; the larger population means the mapping phase is heavier than for HB or MB but parallels ES in scope.' },
  { item: 'The give-back ledger six categories', detail: 'Hours · Dollars · Objects · Easement · Expertise · Custody. Same six. RB ledger federates with ES, MB, HB via shared schemas.' },
  { item: 'The Marine Layer eight-week practice template', detail: 'Eight-week place-based meditative cycle. RB has more candidate sit anchor sites than any other corridor city: the Pier complex, the Esplanade bluff, Veterans Park, Riviera Village, King Harbor breakwater. Cohort cycles can rotate.' },
  { item: 'The Common Forms architectural plan template', detail: 'Twelve commissions across three tiers. RB instance customizes site selection while inheriting form vocabulary; the Galleria redevelopment site offers the corridor\'s most plausible C-tier ($150K+) commission opportunity if the city signals openness.' },
  { item: 'JSON mirrors at every endpoint', detail: 'Federation L1 protocol — every RB surface exposes its data at predictable paths on the redondobeach.pointcast.xyz subdomain (or equivalent path).' },
  { item: 'CC0 / MIT licensing', detail: 'No proprietary IP between ES, MB, HB, RB. Forks are free; improvements flow back to the shared template repo.' },
];

export const RB_SPECIFIC_TERRAIN = [
  { feature: 'King Harbor + the Pier complex', uesAnalogue: 'No direct ES analogue (closest: ES Beach lifeguard line)', rbDifference: 'King Harbor is the corridor\'s only commercial marina — approximately 1,400 boat slips, working fishing fleet remnants, the horseshoe-pier complex with Tony\'s Bait & Tackle / Old Tony\'s. Adds a maritime-civic dimension no other corridor city offers; the pier complex itself is structurally aging and politically charged (long-running redevelopment debate).' },
  { feature: 'The Esplanade bluff', uesAnalogue: 'Imperial Avenue Dunes overlook (Marine Layer Week 3 — Imperial Blue Hour)', rbDifference: 'A continuous coastal bluff ~80 ft above the Strand running approximately 1.2 mi from the Pier south to the Torrance line. Provides a second-elevation Strand-parallel walkway with bench rings and the corridor\'s best sunset view points. Natural Marine Layer Week 3 anchor for the RB instance.' },
  { feature: 'Riviera Village', uesAnalogue: 'No direct ES analogue (closest: Smoky Hollow, but quieter)', rbDifference: 'A walkable downtown along Avenue I and Catalina Avenue at the Hollywood-Riviera neighborhood, dense with independent restaurants, small boutiques, and a strong pedestrian culture. Functions as the city\'s informal civic concourse separate from the Pier complex; Voluntary Association Infrastructure (Shape #5) anchor candidate.' },
  { feature: 'Galleria redevelopment site', uesAnalogue: 'No direct ES analogue (closest: Plaza El Segundo redevelopment but more advanced)', rbDifference: 'The South Bay Galleria, a struggling 1980s mall on Hawthorne Blvd, is in active redevelopment as Galleria 2030 — a 300+ unit mixed-use project. The 30-acre site is the corridor\'s largest active redevelopment opportunity and a natural Common Forms C-tier commission target if the developer engages.' },
  { feature: 'Beach Cities Health District', uesAnalogue: 'No direct ES analogue', rbDifference: 'BCHD is a special-district public-health agency serving HB + MB + RB jointly, funded by property tax. Existing tri-city institution that already operates at the federation scale the corridor seeks. Shape #3 (Mutual Aid Mesh) and Shape #5 (Voluntary Association) both have natural BCHD partnership paths.' },
  { feature: 'King Harbor Yacht Club + maritime culture', uesAnalogue: 'No direct ES analogue', rbDifference: 'KHYC and the Redondo Beach Yacht Club are organized voluntary associations with deep institutional memory and existing volunteer infrastructure. The Voluntary Association Infrastructure shape can partner from day one rather than building from zero.' },
  { feature: 'AYSO Region 6 + Sunday-Funday volunteer base', uesAnalogue: 'No direct ES analogue', rbDifference: 'AYSO Region 6 is one of the larger AYSO regions in California with thousands of volunteer parents annually. Existing voluntary-association muscle is comparable to MBEF in scale but sport-coded rather than education-coded; cohort recruitment skews family-with-kids.' },
];

export type ShapeStatus = {
  number: number;
  name: string;
  rbStatus: 'forming' | 'speculative' | 'building' | 'shipping' | 'dormant';
  startingPoint: string;
  firstNinetyDays: string;
};

export const RB_SIX_SHAPES: ShapeStatus[] = [
  { number: 1, name: 'Civic Personal Agent', rbStatus: 'speculative', startingPoint: 'No RB-specific civic-AI infrastructure. County / state / utility adapters built for ES apply unchanged.', firstNinetyDays: 'RB-specific adapters: City of RB permits & parks, Redondo Beach Unified School District, Beach Cities Health District (tri-city; shared work with HB + MB), King Harbor permits and slip fees. Approximately 4 adapters × 10-20 hrs each = 40-80 hours.' },
  { number: 2, name: 'Neighborhood OS', rbStatus: 'forming', startingPoint: 'No formal neighborhood-association infrastructure equivalent to MB\'s North End. Riviera Village Association and the various harbor-district groups are partial protos. King Harbor breakwater, Veterans Park, the Esplanade are natural cohort-gathering anchors.', firstNinetyDays: 'Recruit first 5-9 RB cohort members. Run first RB Marine Layer eight-week cycle anchored at the King Harbor breakwater. Establish RB Commons ledger.' },
  { number: 3, name: 'Mutual Aid Mesh', rbStatus: 'forming', startingPoint: 'Beach Cities Health District is the most mature mutual-aid-adjacent institution in the corridor. The 2024 King Harbor sea-lion die-off demonstrated existing inter-agency response capacity. Earthquake (Newport-Inglewood Fault traces inland through RB) and tsunami (King Harbor amplification risk) are the principal risks.', firstNinetyDays: 'Phase 0 mapping: skill registry intake from first cohort. BCHD partnership conversation. The harbor-tsunami-amplification risk is RB-unique and deserves a corridor-wide drill scenario at Year 2.' },
  { number: 4, name: 'Civic Micro-Treasury', rbStatus: 'speculative', startingPoint: 'No RB-specific Commons-equivalent. Veterans Park, the Esplanade, the Pier complex, Riviera Village all have potential as treasury anchors. Lower median household income than MB but larger population means total fundraising potential is comparable.', firstNinetyDays: 'Establish RB Commons ledger as first deliverable. Pick a "First Bench" pilot — likely the Esplanade at Vista Drive overlook (the corridor\'s best sunset bench), Veterans Park overlook, or King Harbor breakwater. Cost band $1.8-2.5K. Trigger threshold: 25 ledger weight.' },
  { number: 5, name: 'Voluntary Association Infrastructure', rbStatus: 'forming', startingPoint: 'Strongest existing infrastructure of the four corridor cities. KHYC, RBYC, AYSO Region 6, RBEF, Riviera Village Association, the Chamber. Catalog suggests 12-15 active voluntary associations of cohort scale or larger.', firstNinetyDays: 'Catalog existing RB voluntary associations (estimate 12-15). Identify 2-3 that would benefit from the templated Marine Layer / Court Craft / Honey League stack. Offer the template; partner rather than compete. AYSO and the harbor associations are highest-leverage candidates.' },
  { number: 6, name: 'Civic Translation Layer', rbStatus: 'speculative', startingPoint: 'RB has notably more linguistic diversity than MB or HB — approximately 30% non-English-at-home households per ACS 5-year, principally Spanish, Korean (significant Korean-American population in the south part of the city), and Tagalog.', firstNinetyDays: 'Inherit ES Civic Translation infrastructure. Wire RB JSON mirrors to expose es / ko / tl translation toggles. RB has the strongest case among the four corridor cities for the Civic Translation shape; this is RB\'s natural lead shape if a translation-coded local Land emerges.' },
];

export const FIRST_NINETY_DAYS_PLAN = [
  { week: '0', milestone: 'Local Land identified', detail: 'A founder-figure inside Redondo Beach commits to ~8 hours/week for 90 days. Same role spec as MB and HB: coordinator, demonstration-walker, stewardship-circle convener. The larger RB population means cohort recruitment is faster but the radius mapping is heavier.' },
  { week: '1-2', milestone: 'Forkable Radius reading + corridor walks', detail: 'Local Land reads /forkable-radius, /coordinate, /manhattan-beach, /hermosa-beach, /strand-corridor, /forkable-template. Walks the MB and HB First Bench sites if they exist by then. Total reading + walking: approximately 8 hours.' },
  { week: '3-4', milestone: 'First RB cohort recruitment', detail: 'Recruit 5-9 Redondo Beach residents willing to commit to a Marine Layer eight-week cycle plus monthly Commons stewardship. Cap 12; floor 5. Larger pool means recruitment is the easiest of the four corridor cities — the bottleneck shifts to selection.' },
  { week: '5-6', milestone: 'First RB sit at King Harbor breakwater', detail: 'Adapted Marine Layer Week 1 sit at the King Harbor breakwater base, predawn, before the working-fishing-fleet remnants depart. Same 4-7-8 breath protocol. The maritime-coded sit is the corridor\'s most distinct from the ES Plaza.' },
  { week: '7-8', milestone: 'RB Commons ledger live', detail: 'A separate RB ledger surface goes live with the same six give-back categories. First five seed receipts logged. Federation L1 handshake with ES, MB, HB ledgers — completing the four-instance federation when MB and HB are also live.' },
  { week: '9-10', milestone: 'First Bench site identified', detail: 'Cohort identifies the RB First Bench pilot. Most likely candidates: Esplanade at Vista Drive (corridor\'s best sunset bench), Veterans Park overlook, King Harbor breakwater. Cost band $1.8-2.5K. Parks-department conversation begins.' },
  { week: '11-12', milestone: 'Federation handshake formalized · corridor complete', detail: 'RB instance opens its JSON mirrors. ES, MB, HB instances subscribe; RB subscribes to the three. The federation council gains its fourth active instance. The four-city Strand corridor is structurally live.' },
  { week: '13', milestone: 'Public review and decision · corridor inaugural sit', detail: 'Local Land reports on the first 90 days. If timing aligns with the autumnal equinox, the first quarterly four-instance corridor sit can be hosted at the Hermosa Pier with all four instances represented. The federation\'s first physical convening.' },
];

export const CORRIDOR_SOUTH_ANCHOR = {
  thesis: 'Redondo Beach is the south anchor of the four-city corridor. The Strand terminates at the Redondo / Torrance line; King Harbor adds a maritime-civic dimension no other corridor city offers; the Beach Cities Health District provides a working tri-city federation precedent at the public-health scale. RB completes the corridor not as the geographic midpoint (Hermosa) or the densest-traffic city (MB) but as the south anchor — the corridor\'s last stop before it dissolves into Torrance and the southern South Bay.',
  whyAnchorMatters: [
    'The corridor needs both anchors. Will Rogers in the north (outside the four-city scope) and Torrance Beach in the south define the Strand\'s terminating geography. RB is the four-city instance closest to the Strand\'s south terminus.',
    'The harbor adds a category. King Harbor is the corridor\'s only maritime commercial infrastructure — boats, slips, working fleet remnants. The federation gains a maritime stewardship sub-category that none of the other three instances host.',
    'The Beach Cities Health District is a federation precedent. BCHD already federates HB + MB + RB at the public-health scale. The corridor federation has an institutional sibling to learn from rather than reinvent.',
    'The population distribution balances. With RB scaffolded, the four corridor cities span ~17K (ES) → 19.5K (HB) → 35K (MB) → 70K (RB) — a useful range from small-instance to large-instance for testing how the framework scales.',
    'Lowest median income of the four cities means RB is the corridor\'s natural test case for the Civic Personal Agent shape\'s "make bureaucracy survivable" thesis. The Personal Data Vault matters more here than in MB.',
  ],
  parallelToCases: 'Bell Labs at Murray Hill anchored the north end of a research corridor running from Manhattan finance through Murray Hill to Princeton academia. RCA at Princeton anchored the south. Without both anchors the corridor was just a commute. The Strand corridor needs ES (north anchor, parent instance), HB (midpoint), and now RB (south anchor) — the in-between instances are corridor; the anchors define what the corridor connects.',
};

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-coordinate', cite: 'University of El Segundo. (2026). *Coordinate · Six-Shape Deployment Grid*. https://pointcast.xyz/coordinate' },
  { id: 'pointcast-mb', cite: 'University of El Segundo. (2026). *Manhattan Beach Instance*. UES-Fork-MB-01. https://pointcast.xyz/manhattan-beach' },
  { id: 'pointcast-hb', cite: 'University of El Segundo. (2026). *Hermosa Beach Instance*. UES-Fork-HB-02. https://pointcast.xyz/hermosa-beach' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'pointcast-template', cite: 'University of El Segundo. (2026). *Forkable Template*. UES-Template-01. https://pointcast.xyz/forkable-template' },
  { id: 'rb-city', cite: 'City of Redondo Beach. (Continuing). *City Services and Programs*. redondo.org.' },
  { id: 'bchd', cite: 'Beach Cities Health District. (Continuing). *Tri-City Public Health Programs*. bchd.org.' },
  { id: 'rbef', cite: 'Redondo Beach Education Foundation. (Continuing). *Programs and Funding*. rbef.org.' },
  { id: 'la-county-strand', cite: 'Los Angeles County Department of Beaches and Harbors. (Continuing). *Marvin Braude Bike Trail · The Strand*. beaches.lacounty.gov.' },
];

export const INSTANCE_NOTES = {
  uesNote: 'This page is the Redondo Beach instance scaffold — the third concrete fork after Manhattan Beach and Hermosa Beach. With RB scaffolded, the four-city Strand corridor has an instance scaffold for every candidate city. The corridor federation is structurally complete; it awaits four local Lands.',
  invitation: 'If you live in Redondo Beach and want to be the local Land for the third concrete fork — the founder-figure who runs the first 90 days, recruits the first cohort, and convenes the stewardship circle — email mh@pointcast.xyz with one paragraph on what brings you to this and which shape you would start with. Approximately 8 hours per week for 90 days. After Day 90, the RB instance is yours to administer, federate, or honestly retire. Civic-Translation-coded Lands are especially welcome — RB has the strongest case for that shape.',
};
