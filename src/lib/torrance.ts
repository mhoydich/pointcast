/**
 * Torrance — fifth concrete fork of the El Segundo template.
 * Companion to /manhattan-beach (UES-Fork-MB-01), /hermosa-beach
 * (UES-Fork-HB-02), /redondo-beach (UES-Fork-RB-03). Torrance is the
 * corridor's natural inland-depth fifth instance and the first non-
 * Strand-frontage fork. With Torrance scaffolded, the federation gains
 * its inland anchor: 145K residents, 21 sq mi, manufacturing depth,
 * Japanese-American cultural anchor, Madrona Marsh ecological reserve,
 * the corridor's largest USD.
 */

export const INSTANCE_META = {
  title: 'Torrance',
  subtitle: 'Fifth concrete fork — the corridor\'s inland-depth instance',
  thesis: 'Torrance is the corridor\'s only non-Strand-frontage candidate fork at scale: 145,000 residents (eight times El Segundo, twice Redondo) across 21 sq mi, with Honda North America HQ as the only major non-aerospace corporate headquarters in the corridor footprint, the corridor\'s largest USD (TUSD ~24,000 students), the only vernal-pool ecological reserve in the South Bay (Madrona Marsh, 43 acres), the largest concentration of Japanese-Americans in California outside Gardena/Little Tokyo (~36% Asian-American population overall), a walkable historic downtown along Sartori Avenue, and the Armstrong Theatre + Cultural Arts Center anchoring the corridor\'s deepest performing-arts infrastructure. This page is the Torrance instance overlay: what it inherits from ES, what is Torrance-specific, and where the local Land would start. Torrance is the corridor\'s inland-depth instance — the fork that gives the federation a non-beach civic identity at scale.',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'Torrance Land', dept: '(open · awaiting local commitment)', email: '(forthcoming)' },
  ],
  affiliation: 'Torrance instance · co-administered with University of El Segundo',
  paperNumber: 'UES-Fork-TR-04',
  date: '2026-05-07',
  parentPaper: 'UES-WP-2026-11 The Forkable Radius',
};

export const TR_SNAPSHOT = {
  population: '~145,000',
  geography: 'South Bay inland + small coastal segment. ~21 sq mi (the largest of any candidate fork). Inland of Redondo Beach + Hermosa Beach; coastal segment at the northern tip of the city wraps the RAT Beach (Redondo / Torrance) shoreline.',
  borders: 'Redondo Beach (northwest), Hermosa Beach (north via panhandle), Lawndale (north), Gardena (northeast), Carson (east), Lomita (southeast), Rolling Hills Estates (south), Palos Verdes (south), Pacific Ocean (small western frontage at Torrance Beach).',
  medianIncome: '~$95K (lower than the four Strand-frontage cities; well above LA County median).',
  techDensity: 'Moderate — Honda North America HQ is the corporate anchor; less aerospace than ES; significant medical-device manufacturing base (Hi-Health, Alfred Mann Foundation legacy).',
  demographics: 'Approximately 36% Asian-American (largest Japanese-American population in California outside Gardena/Little Tokyo). ~16% Latino. ~7% Black. Most demographically diverse candidate instance by significant margin.',
  schoolDistrict: 'Torrance Unified School District (~24,000 students) — the corridor\'s largest USD by enrollment; one of California\'s top public-school districts.',
  parksAcres: '~700 acres total parkland (substantially larger than any beach city). Wilson Park, Columbia Park, Madrona Marsh Preserve, Charles Wilson Park, Entradero Park, Walteria Lake.',
  existingCivic: 'Torrance Education Foundation, Torrance Cultural Arts Center, Madrona Marsh Foundation, Torrance Historical Society + Torrance Historical Museum, Friends of the Torrance Library system (largest in corridor — 6 branches), Asian Pacific American Coalition Torrance, AYSO Region 24, Bushido Center, Toyota Foundation legacy programs, Honda Community Engagement programs.',
};

export const INHERITED_FROM_ES = [
  { item: 'The 25-mile radius commitment', detail: 'Torrance instance radius is 25 mi, centered on Torrance. Overlaps with the four Strand-frontage instances by ~80%, plus extends inland to cover Carson, Wilmington, San Pedro, parts of Long Beach — geography no Strand instance reaches at full depth.' },
  { item: 'The six-shape framework', detail: 'All six adopted by reference; Torrance-specific implementations follow.' },
  { item: 'The Commons Acquisition Thesis Phase 0–4', detail: 'Map → Steward → Vehicle → First Parcel → Open Hours. Torrance mapping phase is the heaviest of any candidate instance given the 21 sq mi footprint, but the larger civic-muscle base means Phase 1 (steward identification) ships faster.' },
  { item: 'The give-back ledger six categories', detail: 'Hours · Dollars · Objects · Easement · Expertise · Custody. TR ledger federates with ES, MB, HB, RB via shared schemas.' },
  { item: 'The Marine Layer eight-week practice template', detail: 'Eight-week place-based meditative cycle. TR has the most diverse cohort of candidate sit anchor sites — Madrona Marsh boardwalk, Wilson Park overlook, Old Torrance Sartori Avenue, Walteria Lake bench, Columbia Park amphitheater, Charles Wilson Park, the Cultural Arts Center plaza, RAT Beach overlook (the city\'s small coastal segment).' },
  { item: 'The Common Forms architectural plan template', detail: 'Twelve commissions across three tiers. Torrance\'s 21 sq mi footprint and existing Cultural Arts Center infrastructure make C-tier ($150K+) commissions especially viable. The Old Torrance walkable-downtown context invites Common Forms work distinct from beach-frontage forms.' },
  { item: 'JSON mirrors at every endpoint', detail: 'Federation L1 protocol — every TR surface exposes its data at predictable paths on the torrance.pointcast.xyz subdomain (or equivalent path).' },
  { item: 'CC0 / MIT licensing', detail: 'No proprietary IP between any instance.' },
];

export const TR_SPECIFIC_TERRAIN = [
  { feature: 'Madrona Marsh Preserve', uesAnalogue: 'No direct ES analogue', trDifference: '43-acre vernal pool nature preserve — the only vernal pool habitat in the South Bay. Existing Madrona Marsh Foundation operates docent-led tours, citizen-science programs, and ecological-restoration work. The Tide-Pool Restoration giant-work\'s natural scientific-partnership site; Marine Layer Week 1 sit anchor candidate.' },
  { feature: 'Honda North America HQ + manufacturing-base civic infrastructure', uesAnalogue: 'Aerospace base (ES) is the closest analogue but has different civic culture', trDifference: 'Honda HQ is the corridor\'s only major non-aerospace corporate headquarters; manufacturing-coded civic engagement (volunteer-fix-it days, manufacturing-tour public programs) is a Voluntary Association template Torrance can ship that no beach city can.' },
  { feature: 'Torrance Cultural Arts Center + Armstrong Theatre', uesAnalogue: 'No direct ES, MB, HB, or RB analogue (closest: HB Comedy & Magic Club but smaller scope)', trDifference: 'A 502-seat proscenium theater + multiple gallery spaces + dedicated rehearsal infrastructure. The corridor\'s only city-owned performing-arts center at this scale. The Audio Pavilion + Concert Hall + Art Library Tier D works find their natural home in Torrance.' },
  { feature: 'Old Torrance / Sartori Avenue', uesAnalogue: 'Riviera Village (RB) is the closest analogue; Smoky Hollow (ES) is partial', trDifference: 'A walkable historic downtown along Sartori Avenue, with the original 1912 Pacific Electric Red Car right-of-way still visible, mature merchant culture, the historic Torrance Theater (currently inactive but architecturally intact). Torrance is the only candidate instance with a 1910s-vintage walkable-downtown grid.' },
  { feature: 'Japanese-American + Asian-American cultural depth', uesAnalogue: 'No direct corridor analogue (Gardena nearby has comparable depth but is not a candidate fork)', trDifference: 'Bushido Center, multiple Japanese-language churches, the Torrance-Kashiwa sister-city relationship (since 1973), Lunar New Year + Cherry Blossom + Bon Odori festivals. The Civic Translation shape\'s strongest non-Spanish case is here.' },
  { feature: 'Torrance Beach (RAT Beach)', uesAnalogue: 'Strand-frontage cities have full Strand integration; Torrance has only the small RAT Beach segment', trDifference: 'The corridor\'s southern transition: where the Strand terminates and the Palos Verdes Peninsula begins. RAT Beach is the smallest civic-coastal frontage of any candidate fork, but it includes the Strand\'s south terminus marker and natural federation handoff to a future PV-edge instance.' },
  { feature: 'TUSD scale + AYSO Region 24', uesAnalogue: 'MB has MBEF + AYSO infrastructure; ES has ESEF; Torrance is larger than any of them', trDifference: 'TUSD enrolls ~24,000 students (more than ESUSD + MBUSD + HBSD + RBUSD combined). AYSO Region 24 enrollment exceeds 5,000 youth annually. Volunteer-association infrastructure exists at corridor-leading scale; Voluntary Association Infrastructure (Shape #5) ships at depth no beach-city instance can match.' },
];

export type ShapeStatus = {
  number: number;
  name: string;
  trStatus: 'forming' | 'speculative' | 'building' | 'shipping' | 'dormant';
  startingPoint: string;
  firstNinetyDays: string;
};

export const TR_SIX_SHAPES: ShapeStatus[] = [
  { number: 1, name: 'Civic Personal Agent', trStatus: 'speculative', startingPoint: 'No TR-specific civic-AI infrastructure. ES adapters (LA County, CA, LADWP) apply unchanged. RB adapters (BCHD) do not apply (Torrance is not in BCHD).', firstNinetyDays: 'TR-specific adapters: City of Torrance (largest of the corridor cities, most active permitting volume), TUSD (largest USD), Torrance Memorial Medical Center (corridor-anchor hospital). Approximately 4-5 adapters × 15-25 hours = 60-100 hours given complexity.' },
  { number: 2, name: 'Neighborhood OS', trStatus: 'forming', startingPoint: 'No formal city-wide neighborhood-association infrastructure, but Old Torrance, Hollywood Riviera (shared with RB), Walteria, and West Torrance all have informal neighborhood identities. Madrona Marsh + Wilson Park + Cultural Arts Center are natural cohort-gathering anchors with more variety than any beach city.', firstNinetyDays: 'Recruit first 5-9 TR cohort members (likely faster than other instances given larger population pool). First TR Marine Layer eight-week cycle anchored at Madrona Marsh boardwalk. Establish TR Commons ledger.' },
  { number: 3, name: 'Mutual Aid Mesh', trStatus: 'forming', startingPoint: 'Torrance Memorial + Honda Community Engagement + the Toyota Foundation legacy network provide mutual-aid-adjacent infrastructure at corridor-leading scale. Earthquake (Newport-Inglewood + Palos Verdes Faults), wildfire (Madrona Marsh adjacent dry hills), and chemical-industrial events (Mobil refinery + Phillips 66 nearby) are TR-specific risk profiles.', firstNinetyDays: 'Phase 0 mapping: skill registry, resource registry. Honda Community Engagement partnership conversation. Refinery-emergency-response sub-program is TR-unique and could anchor a corridor-wide annual drill at Year 2.' },
  { number: 4, name: 'Civic Micro-Treasury', trStatus: 'speculative', startingPoint: 'No TR-specific Commons-equivalent. Wilson Park, Madrona Marsh, Old Torrance, the Cultural Arts Center plaza all have potential as treasury anchors. Lower median income than Strand-frontage cities but much larger total population means total fundraising potential is corridor-leading.', firstNinetyDays: 'Establish TR Commons ledger. Pick a "First Bench" pilot — Madrona Marsh boardwalk, Old Torrance Sartori Avenue, Wilson Park overlook, or Cultural Arts Center plaza. Cost band $1.8-2.5K. Trigger threshold: 25 ledger weight. Honda Foundation match-grant conversation.' },
  { number: 5, name: 'Voluntary Association Infrastructure', trStatus: 'forming', startingPoint: 'Strongest existing infrastructure of any candidate instance. TEF + AYSO Region 24 + Bushido + Torrance Cultural Arts Center + Madrona Marsh Foundation + APAC + Toyota Foundation + Honda CE + multiple Buddhist temples + Friends of the Library (6 branches). Catalog suggests 30+ active voluntary associations of cohort scale or larger.', firstNinetyDays: 'Catalog existing TR voluntary associations (estimate 30+). Identify 3-5 that would benefit from the templated Marine Layer / Court Craft / Honey League / Audio Pavilion stack. Offer the templates; partner rather than compete. The Cultural Arts Center is the highest-leverage partnership candidate.' },
  { number: 6, name: 'Civic Translation Layer', trStatus: 'forming', startingPoint: 'TR has the corridor\'s strongest case for the Civic Translation shape — Japanese, Korean, Spanish, Mandarin, Tagalog all justified by demographic data; the Asian Pacific American Coalition Torrance and the Bushido Center provide native-speaker cohort partnerships from Day 1.', firstNinetyDays: 'Inherit ES Civic Translation infrastructure. Wire TR JSON mirrors to expose ja / ko / es / zh / tl translation toggles. Native-speaker cohort reviewer recruitment via APAC + Bushido + the Spanish-speaking Catholic parishes. Civic Translation is TR\'s natural lead shape — the first shape to ship in TR if a translation-coded Land emerges.' },
];

export const FIRST_NINETY_DAYS_PLAN = [
  { week: '0', milestone: 'Local Land identified', detail: 'A founder-figure inside Torrance commits to ~8 hours/week for 90 days. The role is coordinator, demonstration-walker, stewardship-circle convener. Translation-coded Lands explicitly welcome — TR has the strongest case for Shape #6 of any candidate instance.' },
  { week: '1-2', milestone: 'Forkable Radius reading + corridor walks', detail: 'Local Land reads /forkable-radius, /coordinate, /manhattan-beach, /hermosa-beach, /redondo-beach, /strand-corridor, /forkable-template, /corridor-strengths, /giant-works, /giant-works-art (when shipped). Walks any First Bench sites if shipped by then. Total reading + walking: approximately 10 hours.' },
  { week: '3-4', milestone: 'First TR cohort recruitment', detail: 'Recruit 5-9 Torrance residents willing to commit to a Marine Layer eight-week cycle plus monthly Commons stewardship. Cap 12; floor 5. Larger pool means recruitment is the easiest of all candidate instances. Selection should oversample Asian-American + Latino voices to match demographic geography.' },
  { week: '5-6', milestone: 'First TR sit at Madrona Marsh', detail: 'Adapted Marine Layer Week 1 sit at Madrona Marsh boardwalk, predawn, before docent hours. Same 4-7-8 breath protocol. The vernal-pool ecology coded sit is the corridor\'s most distinct from any beach-frontage instance.' },
  { week: '7-8', milestone: 'TR Commons ledger live', detail: 'A separate TR ledger surface goes live with the same six give-back categories. First five seed receipts logged. Federation L1 handshake with ES, MB, HB, RB ledgers — completing the five-instance federation.' },
  { week: '9-10', milestone: 'First Bench site identified', detail: 'Cohort identifies the TR First Bench pilot. Most likely candidates: Madrona Marsh boardwalk overlook, Old Torrance Sartori Avenue at El Prado, Wilson Park terrace, Cultural Arts Center plaza. Cost band $1.8-2.5K. Honda Foundation match-grant conversation initiated.' },
  { week: '11-12', milestone: 'Federation handshake formalized · five-instance corridor live', detail: 'TR instance opens its JSON mirrors. ES, MB, HB, RB instances subscribe; TR subscribes to the four. The federation council gains its fifth active instance. The four Strand cities + Torrance are the corridor\'s primary federation core.' },
  { week: '13', milestone: 'Public review and decision', detail: 'Local Land reports on the first 90 days. Cohort decides: continue, restart, or honestly retire. Decision published on /torrance as a status update. With TR live, the corridor council\'s autumnal-equinox annual meeting at Hermosa Pier draws delegates from all five instances.' },
];

export const INLAND_DEPTH_POSITION = {
  thesis: 'Torrance is the corridor\'s inland-depth instance — the only candidate fork that is not primarily a Strand-frontage city. With Torrance scaffolded, the federation gains: a non-beach civic identity at scale, manufacturing-base civic-engagement infrastructure (Honda CE, Toyota Foundation legacy), the largest school district + voluntary-association inventory of any instance, the corridor\'s only vernal-pool ecological reserve, and the corridor\'s strongest Civic Translation case (Japanese, Korean, Spanish, Mandarin, Tagalog all demographically justified). The federation\'s reach extends from the Pacific waterline (the four Strand instances) inland through Torrance\'s 21 sq mi to the corridor\'s eastern edge.',
  whyInlandDepthMatters: [
    'A federation that is only beach-frontage is class-coded. Beach-frontage cities have median incomes $120-200K; inland-corridor extension via Torrance ($95K) and edge instances (Lawndale $72K, Hawthorne $75K) brings the federation\'s realistic median much closer to LA County\'s $80K median.',
    'Manufacturing depth is irreplaceable. The Strand cities lost their light-manufacturing bases by the 1990s; Torrance retains an active manufacturing presence (Honda assembly facilities, medical devices, food production). The federation\'s capacity to support physical-build civic projects (Tier D works) is greater with Torrance than without.',
    'Cultural-arts infrastructure at Cultural Arts Center scale exists nowhere else in the corridor. The Audio Pavilion + Concert Hall + Art Library + Recording Studio Tier D works find their natural home in Torrance.',
    'Ecological depth via Madrona Marsh is unique. The Tide-Pool Restoration giant-work has its scientific-partnership site here; the federation\'s ecological sophistication ships at Madrona\'s 43 acres before it ships anywhere else.',
    'Translation depth via Bushido + APAC + the Spanish-speaking parishes is unique. Civic Translation Layer (Shape #6) ships in Torrance at depth that beach-frontage cohorts cannot match.',
    'TR + the four Strand cities form a 5-instance federation of ~285K residents — a federation council scale (one delegate per instance + open seats) that operates well at five and would strain at ten.',
  ],
  parallelToCases: 'Bell Labs at Murray Hill was a beach-corridor analogue for the federation, but the deep research happened at Holmdel (the inland-depth Bell campus, 30 mi south of Murray Hill). Holmdel had the radio antenna, the Unix kernel, the C compiler — work that Murray Hill\'s coastal-suburban culture could not have hosted at the same intensity. Torrance is the federation\'s Holmdel: the inland-depth instance where the deep work — manufacturing-base civic-engagement, Cultural Arts Center programming, the Civic Translation shape\'s native-speaker review — naturally resides.',
};

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-coordinate', cite: 'University of El Segundo. (2026). *Coordinate · Six-Shape Deployment Grid*. https://pointcast.xyz/coordinate' },
  { id: 'pointcast-mb', cite: 'University of El Segundo. (2026). *Manhattan Beach Instance*. UES-Fork-MB-01. https://pointcast.xyz/manhattan-beach' },
  { id: 'pointcast-hb', cite: 'University of El Segundo. (2026). *Hermosa Beach Instance*. UES-Fork-HB-02. https://pointcast.xyz/hermosa-beach' },
  { id: 'pointcast-rb', cite: 'University of El Segundo. (2026). *Redondo Beach Instance*. UES-Fork-RB-03. https://pointcast.xyz/redondo-beach' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'pointcast-cs', cite: 'University of El Segundo. (2026). *Corridor Strengths*. UES-Federation-03. https://pointcast.xyz/corridor-strengths' },
  { id: 'pointcast-template', cite: 'University of El Segundo. (2026). *Forkable Template*. UES-Template-01. https://pointcast.xyz/forkable-template' },
  { id: 'tr-city', cite: 'City of Torrance. (Continuing). *City Services and Programs*. torranceca.gov.' },
  { id: 'madrona-marsh', cite: 'Madrona Marsh Foundation. (Continuing). *Vernal Pool Conservation Programs*. friendsofmadronamarsh.com.' },
  { id: 'tcac', cite: 'Torrance Cultural Arts Center. (Continuing). *Programs and the Armstrong Theatre*. torranceca.gov/government/community-services/torrance-cultural-arts-center.' },
  { id: 'tusd', cite: 'Torrance Unified School District. (Continuing). *District Programs and Foundation Partnerships*. tusd.org.' },
  { id: 'bushido', cite: 'Bushido Center. (Continuing). *Japanese-American Cultural Programs*. bushidocenter.org.' },
];

export const INSTANCE_NOTES = {
  uesNote: 'This page is the Torrance instance scaffold — the fifth concrete fork after Manhattan Beach, Hermosa Beach, and Redondo Beach. With TR scaffolded, the corridor\'s primary federation core (5 instances: ES + MB + HB + RB + TR) has a complete scaffold. The federation council has its working five-delegate quorum. The candidate inland-depth + non-Strand civic dimension is now structurally part of the corridor.',
  invitation: 'If you live in Torrance and want to be the local Land for the fifth concrete fork — the founder-figure who runs the first 90 days, recruits the first cohort, and convenes the stewardship circle — email mh@pointcast.xyz with subject line "Torrance Land · {your-name}". Approximately 8 hours per week for 90 days. The role is open to coordinator-coded, translation-coded (Civic Translation is TR\'s strongest shape), or arts-coded (Cultural Arts Center partnership is TR-unique) Lands. After Day 90, the TR instance is yours to administer, federate, or honestly retire.',
};
