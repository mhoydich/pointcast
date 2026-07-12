/**
 * Corridor Strengths — what each candidate fork city is uniquely good at.
 *
 * Five candidate corridor instances (ES, MB, HB, RB, Torrance) plus six
 * adjacent geographies that could federate as edge instances or remain
 * neighbor-states. Each entry names the city's signature strengths,
 * civic muscle memory, asymmetric advantages, and the giant-works
 * project it is most naturally positioned to host.
 */

export const CS_META = {
  title: 'Corridor Strengths',
  subtitle: 'What each candidate fork city is uniquely good at',
  thesis: 'A federation only works if every instance contributes from genuine strength. The four corridor cities (ES, MB, HB, RB) plus Torrance as the fifth candidate, plus six adjacent geographies, each have asymmetric civic advantages — institutions, geographies, populations, cultures — that no other instance can replicate. This page maps those strengths so the federation can match its giant-works queue to the cities best positioned to host each project, and so prospective local Lands can read which shape their city is structurally pulled toward. The framework prizes honest match: not every shape ships in every instance; the corridor is strongest when each city ships what it is best at.',
  paperNumber: 'UES-Federation-03',
  date: '2026-05-07',
  parentPaper: 'UES-WP-2026-11 The Forkable Radius',
};

export type CityStrengths = {
  id: string;
  name: string;
  status: 'parent' | 'scaffolded' | 'candidate' | 'edge' | 'neighbor';
  population: string;
  area: string;
  strengthHeadline: string;
  signatureStrengths: { domain: string; detail: string }[];
  civicMuscle: string[];
  asymmetricAdvantages: string;
  bestSuitedShapes: string[];
  bestSuitedGiantWorks: string[];
  whatThisCityShips: string;
  whatThisCityShouldNotHost: string;
};

export const CITIES: CityStrengths[] = [
  {
    id: 'el-segundo',
    name: 'El Segundo',
    status: 'parent',
    population: '~17,000',
    area: '~5.5 sq mi',
    strengthHeadline: 'The reference instance. The smallest population of the four corridor cities, the largest commercial-aerospace base, and the only city with both LAX and Chevron in its civic frame.',
    signatureStrengths: [
      { domain: 'Aerospace + tech density', detail: 'Approximately 200+ aerospace, defense, and software companies inside the 5.5 sq mi footprint — Raytheon, Boeing, Lockheed, Aerospace Corp, NextSilicon, et al. Working-engineer cohort recruitment is the easiest of the four corridor cities.' },
      { domain: 'LAX adjacency', detail: 'The Marine Layer Week 5 (Flight-Path Sit) is only possible here. ES is the corridor city that most directly experiences LAX as civic infrastructure.' },
      { domain: 'Smoky Hollow industrial transition', detail: 'A live industrial-to-mixed-use transition zone provides workshop space, light manufacturing capacity, and physical-build infrastructure no other corridor city offers.' },
      { domain: 'School district + civic operating tempo', detail: 'ESUSD is K-12 (rare among the corridor cities), and the city\'s budget is funded heavily by aerospace business taxes — civic operating tempo runs faster than tax-stressed cities.' },
    ],
    civicMuscle: ['ES Education Foundation (mature)', 'Smoky Hollow Specific Plan (active)', 'ES Police volunteer auxiliary', 'ES Public Library Foundation', 'Network ES (technology + business)', 'Honey League pickleball cooperative (ES original)'],
    asymmetricAdvantages: 'No other corridor city has aerospace-engineer density at this scale + a live industrial workshop zone + a K-12 USD + LAX adjacency. ES is the only instance where the Civic Personal Agent shape (Shape #1) can recruit working engineers at the cohort floor without specialized outreach.',
    bestSuitedShapes: ['Shape #1 (Civic Personal Agent — engineer recruitment)', 'Shape #2 (Neighborhood OS — small-population scale)', 'Shape #4 (Civic Micro-Treasury — established Commons momentum)'],
    bestSuitedGiantWorks: ['Wind Garden (LAX-adjacent prevailing-wind site)', 'Stone Garden (Smoky Hollow industrial-transition site low cost)', 'Ocean Tower (Imperial Avenue dunes — lowest political friction)'],
    whatThisCityShips: 'The reference framework itself. The first proof-of-concept for every shape. The original Marine Layer cohort. The First Bench. The Honey League. The radius commitment.',
    whatThisCityShouldNotHost: 'The Bath House (lower foot traffic than Hermosa). The Geothermal Pool (Hyperion smell objection real). The Tide-Pool Restoration (no rocky substrate).',
  },
  {
    id: 'manhattan-beach',
    name: 'Manhattan Beach',
    status: 'scaffolded',
    population: '~35,000',
    area: '~3.9 sq mi',
    strengthHeadline: 'The corridor\'s knowledge-worker engine. Highest median income, densest tech-employee daytime population, deepest existing voluntary-association base of the four corridor cities.',
    signatureStrengths: [
      { domain: 'MBEF + voluntary-association maturity', detail: 'MBEF raises ~$5M/year for MBUSD via established annual programs. Voluntary-association infrastructure (Shape #5) ships before any other city.' },
      { domain: 'Tech-employee density', detail: 'Apple, Google, Skechers, plus the entire Beach Cities tech corridor within 5 miles. Civic Personal Agent recruitment among tech employees is faster than ES, faster than HB.' },
      { domain: 'High-cohesion downtown', detail: 'Manhattan Beach Pier + downtown Manhattan + North End all within walkable footprint. Cohort-cap-12 Marine Layer cycles can rotate among 4-5 distinct neighborhood-feeling sites.' },
      { domain: 'Sand Dune Park asymmetry', detail: 'A regulated 100-ft sand-dune climb with reservation system; combines fitness practice with civic gathering in a way no other corridor city replicates.' },
    ],
    civicMuscle: ['MBEF (~$5M/yr)', 'North End Neighborhood Association', 'MB Recreation programs (mature)', 'Roundhouse Aquarium partnership', 'Surfrider South Bay (shared with HB)', 'MB Beach Sports volleyball (large)', 'Skechers Friendship Walk legacy event'],
    asymmetricAdvantages: 'MB is the only corridor city where the Voluntary Association Infrastructure shape can ship a fully-formed templated stack from Day 1 by partnering with MBEF. No other instance has voluntary-association infrastructure this mature.',
    bestSuitedShapes: ['Shape #5 (Voluntary Association — MBEF partnership)', 'Shape #1 (Civic Personal Agent — tech-employee recruitment)', 'Shape #2 (Neighborhood OS — established neighborhood structures)'],
    bestSuitedGiantWorks: ['Bath House (highest foot traffic, walking-distance population, plausible philanthropic match)', 'Stone Garden (Polliwog Park north meadow — mature parks-dept partnership)', 'Wind Garden (Sand Dune Park integration with existing dune-climb practice)'],
    whatThisCityShips: 'The Voluntary Association template extension. The Bath House (highest probability host). The corridor\'s deepest cohort recruitment pool.',
    whatThisCityShouldNotHost: 'The Geothermal Pool (no plausible site). The Tide-Pool Restoration (sandy substrate, not rocky). The Fire Pavilion (parks-dept tightly governed, fire-permit conversation hard).',
  },
  {
    id: 'hermosa-beach',
    name: 'Hermosa Beach',
    status: 'scaffolded',
    population: '~19,500',
    area: '1.43 sq mi',
    strengthHeadline: 'The corridor\'s federation midpoint. Smallest by area, densest civic concourse, the natural site for the annual federation council and the Bath House.',
    signatureStrengths: [
      { domain: 'Pier Plaza density', detail: 'The densest civic concourse on the four-city corridor — bars, restaurants, the Pier itself, the Surfers Walk of Fame. Daily foot traffic exceeds any single ES location.' },
      { domain: 'Comedy & Magic Club', detail: 'Operating since 1978. A 300-seat working performance venue with no equivalent in the four-city corridor. Annual federation gala / quarterly First-Cohort welcome candidate.' },
      { domain: 'The Greenbelt', detail: 'A linear pedestrian path on the bed of the former Santa Fe Railway — 2.4 mi running roughly the length of the city. Provides an inland-parallel to the Strand and the most distinctive Marine Layer Week 2 (Powerline Walk) anchor in the corridor.' },
      { domain: 'Geographic midpoint', detail: 'Hermosa Pier is approximately the midpoint of the four-instance corridor. Equal travel time from ES (~3 mi north) and Redondo (~3 mi south); the natural federation-meeting site.' },
    ],
    civicMuscle: ['HBEF', 'Hermosa Arts Foundation', 'Friends of the Hermosa Library', 'Surfrider South Bay HQ', 'Project: Forward (after-school)', 'Hermosa Beach Volleyball', 'Pier Plaza merchant association'],
    asymmetricAdvantages: 'Hermosa is the only corridor city that is (1) geographically midpoint, (2) hosts a 1978-vintage performance venue, (3) has a linear inland pedestrian corridor (the Greenbelt) parallel to the Strand. No other instance can host the annual federation council with the same midpoint convenience.',
    bestSuitedShapes: ['Shape #3 (Mutual Aid Mesh — small-area mapping completes faster)', 'Shape #5 (Voluntary Association — strong base on small footprint)'],
    bestSuitedGiantWorks: ['The Bath House (Pier-adjacent municipal lot at 11th & Hermosa Ave — primary recommended site)', 'Ocean Tower (Greenbelt at 8th Street terminus)', 'Stone Garden (Greenbelt midpoint)', 'Fire Pavilion (South Park / Clark Stadium)'],
    whatThisCityShips: 'The federation midpoint. The Bath House. The annual federation council (autumnal equinox at the Pier). The Greenbelt as the corridor\'s inland-parallel pedestrian infrastructure.',
    whatThisCityShouldNotHost: 'The Geothermal Pool (no industrial site). The Tide-Pool Restoration (urban Strand frontage, not rocky enough). The Dark-Sky Observatory (light-pollution from Pier Plaza too high).',
  },
  {
    id: 'redondo-beach',
    name: 'Redondo Beach',
    status: 'scaffolded',
    population: '~70,000',
    area: '6.2 sq mi',
    strengthHeadline: 'The corridor\'s south anchor. Largest population, most linguistic diversity, only commercial maritime infrastructure, working tri-city federation precedent (BCHD).',
    signatureStrengths: [
      { domain: 'King Harbor', detail: 'The corridor\'s only commercial marina — ~1,400 boat slips, working fishing fleet remnants, KHYC, RBYC, Tony\'s Bait & Tackle. Maritime civic infrastructure no other instance offers.' },
      { domain: 'Beach Cities Health District', detail: 'BCHD is a special-district public-health agency federating HB+MB+RB jointly via property tax. A working tri-city federation precedent the corridor council can study and partner with.' },
      { domain: 'Linguistic diversity', detail: '~30% non-English-at-home households per ACS — Spanish, Korean, Tagalog, Mandarin. The Civic Translation shape ships in RB before any other corridor city.' },
      { domain: 'AES site redevelopment opportunity', detail: 'The 51-acre AES decommissioned-power-plant site is in active redevelopment planning. A once-in-fifty-year opportunity for embedding a giant work in a major coastal redevelopment.' },
      { domain: 'Riviera Village', detail: 'A walkable downtown along Avenue I and Catalina, dense with independent merchants, functioning as a second civic concourse separate from the Pier complex.' },
    ],
    civicMuscle: ['Beach Cities Health District (tri-city)', 'RBEF', 'Riviera Village Association', 'KHYC + RBYC', 'AYSO Region 6 (very large)', 'Friends of Redondo Beach Libraries', 'Redondo Beach Chamber'],
    asymmetricAdvantages: 'RB is the only corridor city with (1) a commercial maritime infrastructure, (2) a working tri-city federation precedent at the special-district scale (BCHD), (3) the linguistic diversity to credibly ship the Civic Translation shape, and (4) a major active redevelopment site (AES). The combination is asymmetric.',
    bestSuitedShapes: ['Shape #6 (Civic Translation — strongest linguistic case)', 'Shape #5 (Voluntary Association — KHYC, RBYC, AYSO depth)', 'Shape #3 (Mutual Aid Mesh — BCHD partnership path)'],
    bestSuitedGiantWorks: ['Geothermal Pool (AES site — best probability across all eight Tier D works)', 'Tide-Pool Restoration (Esplanade rocks below Vista Drive — best substrate)', 'Bath House (King Harbor inner basin — saltwater-feed potential)'],
    whatThisCityShips: 'The Civic Translation shape. The Geothermal Pool. The corridor\'s maritime civic dimension. The tri-city BCHD partnership template the federation council can study.',
    whatThisCityShouldNotHost: 'Wind Garden (less prevailing-wind exposure than ES dunes). The Bath House midpoint role (Hermosa is naturally midpoint). The federation council (geographically south of midpoint).',
  },
  {
    id: 'torrance',
    name: 'Torrance',
    status: 'candidate',
    population: '~145,000',
    area: '~21 sq mi',
    strengthHeadline: 'The corridor\'s southern populous extension. Eight times ES\'s population, four times its area, with manufacturing depth (Toyota HQ historically, Honda still active), the corridor\'s largest school district, and the most diverse population of any candidate instance.',
    signatureStrengths: [
      { domain: 'Manufacturing + corporate HQ heritage', detail: 'Honda North America HQ, formerly Toyota HQ (relocated 2017). Industrial / aerospace base inland of the beach. The corridor\'s strongest connection to manufacturing-scale civic projects.' },
      { domain: 'Population diversity', detail: 'Approximately 36% Asian-American (largest Japanese-American population in California outside Gardena/Little Tokyo), ~16% Latino, ~7% Black. The most demographically diverse candidate instance by a wide margin.' },
      { domain: 'Torrance Unified School District', detail: 'TUSD is one of California\'s top public school districts and the corridor\'s largest USD by enrollment (~24,000 students). Voluntary-association recruitment around schools is asymmetric.' },
      { domain: 'Madrona Marsh', detail: 'A 43-acre vernal pool nature preserve inside the city — the only vernal pool habitat in the South Bay. Tide-Pool Restoration adjacent to a working ecological-restoration site provides scientific partnership infrastructure no beach city can match.' },
      { domain: 'Old Torrance + Downtown', detail: 'A walkable historic downtown along Sartori Avenue, with mature merchant culture and the existing Torrance Historical Society, Torrance Cultural Arts Center, and Armstrong Theatre infrastructure.' },
    ],
    civicMuscle: ['Torrance Education Foundation', 'Torrance Cultural Arts Center', 'Madrona Marsh Foundation', 'Torrance Historical Society', 'Friends of the Torrance Library system (largest in corridor)', 'Toyota Foundation legacy programs', 'Asian Pacific American Coalition Torrance', 'AYSO Region 24 (large)'],
    asymmetricAdvantages: 'Torrance is the only candidate instance with (1) a working manufacturing-scale corporate HQ presence, (2) a vernal pool ecological reserve, (3) a Japanese-American population at scale, (4) a USD of corridor-leading size, (5) a walkable historic downtown separate from any beach-frontage civic concourse. The asymmetry is "inland depth" — Torrance is the corridor\'s only candidate instance with a non-beach civic identity at scale.',
    bestSuitedShapes: ['Shape #5 (Voluntary Association — TEF + AYSO + cultural-arts depth)', 'Shape #6 (Civic Translation — Japanese, Spanish, Korean, Mandarin all justified)', 'Shape #3 (Mutual Aid Mesh — manufacturing-base disaster-response infrastructure)'],
    bestSuitedGiantWorks: ['Tide-Pool Restoration adjacent science partnership (Madrona Marsh + ecological-restoration expertise)', 'Concert Hall (Armstrong Theatre + Cultural Arts Center existing infrastructure)', 'Art Library (Cultural Arts Center anchor)', 'Audio Pavilion (Japanese-American cultural-music heritage)'],
    whatThisCityShips: 'The corridor\'s inland-depth instance. Manufacturing-scale civic-project capacity. Japanese-American cultural anchor. The corridor\'s largest cohort recruitment pool. The vernal-pool ecological reference site for the Tide-Pool Restoration.',
    whatThisCityShouldNotHost: 'The Bath House (no Strand frontage; a beach-corridor work). The Wind Garden (inland; less prevailing-wind exposure). The Ocean Tower (no coastal site).',
  },
  {
    id: 'lawndale',
    name: 'Lawndale',
    status: 'edge',
    population: '~33,000',
    area: '~2.0 sq mi',
    strengthHeadline: 'A potential edge instance. Inland, working-class, dense, with civic-infrastructure investments accelerating since the 2010s. Honest demographic counterweight to the beach cities\' affluence.',
    signatureStrengths: [
      { domain: 'Affordability + accessibility', detail: 'Median income ~$72K, well below the corridor cities. The corridor federation\'s honest demographic counterweight.' },
      { domain: 'Civic catch-up momentum', detail: 'The Lawndale Civic Center expansion + library renovation 2018-2024 demonstrate genuine recent civic-infrastructure investment from a city historically without such investment.' },
      { domain: 'Centinela Park', detail: '23 acres adjacent to the South Bay Galleria redevelopment site — a corridor-shared parkland resource at the corridor\'s east edge.' },
    ],
    civicMuscle: ['Lawndale Education Foundation (small)', 'Lawndale Senior Citizens Center', 'Lawndale Civic Center Foundation'],
    asymmetricAdvantages: 'Lawndale is the corridor\'s honest accessibility test case. If the federation framework only works in $200K-median cities, the framework is class-coded in a way that limits it. Lawndale is where the framework proves it can serve, or honestly cannot serve.',
    bestSuitedShapes: ['Shape #6 (Civic Translation — high Spanish, Tagalog presence)', 'Shape #1 (Civic Personal Agent — bureaucracy-survival case is sharper here)'],
    bestSuitedGiantWorks: ['Audio Pavilion (working-class music-culture anchor)', 'Art Library (free arts access has highest leverage where private alternatives are scarce)'],
    whatThisCityShips: 'The federation\'s honesty-test geography. Demographic counterweight. The Civic Personal Agent shape\'s sharpest use case.',
    whatThisCityShouldNotHost: 'The Bath House (no Strand frontage; budget pressure). The Geothermal Pool (cost prohibitive without major coastal-city co-funding).',
  },
  {
    id: 'hawthorne',
    name: 'Hawthorne',
    status: 'edge',
    population: '~88,000',
    area: '~6.1 sq mi',
    strengthHeadline: 'A potential edge instance. SpaceX HQ-coded, inland, dense, with the corridor\'s strongest case for a tech-employee-coded inland fork.',
    signatureStrengths: [
      { domain: 'SpaceX HQ presence', detail: 'SpaceX HQ + Boring Company + adjacent aerospace contractors. The corridor\'s densest non-ES aerospace-employee population.' },
      { domain: 'Memorial Park + civic-anchor potential', detail: 'A 6.5-acre central park with Hawthorne Memorial Center; existing public-arts programming.' },
      { domain: 'Beach Boys + Mattel cultural heritage', detail: 'The Beach Boys formed in Hawthorne in 1961; Mattel was founded here. Cultural-heritage anchors for an Audio Pavilion or music-coded Tier D work.' },
      { domain: 'Affordability', detail: 'Median income ~$75K; affordability counterweight to the beach corridor.' },
    ],
    civicMuscle: ['Hawthorne School District', 'Hawthorne Public Library Foundation', 'Hawthorne Cultural Heritage program', 'SpaceX-employee informal civic networks'],
    asymmetricAdvantages: 'Hawthorne is the only candidate edge instance with both (1) tech-employee density at SpaceX scale and (2) a 1960s music-cultural heritage (Beach Boys). The combination of working-engineer cohort + American-musical-history anchor is asymmetric.',
    bestSuitedShapes: ['Shape #1 (Civic Personal Agent — SpaceX-employee recruitment)', 'Shape #2 (Neighborhood OS)'],
    bestSuitedGiantWorks: ['Audio Pavilion (Beach Boys cultural-heritage anchor)', 'Recording Studio Public Use (music-history thread)'],
    whatThisCityShips: 'The corridor\'s SpaceX-coded engineering cohort. The Beach Boys cultural-heritage thread. The non-coastal tech-employee fork case.',
    whatThisCityShouldNotHost: 'Coastal Tier D works (no Strand frontage). The Tide-Pool Restoration (no coastline).',
  },
  {
    id: 'palos-verdes',
    name: 'Palos Verdes Peninsula (PV Estates, Rancho PV, Rolling Hills, Rolling Hills Estates)',
    status: 'edge',
    population: '~70,000 combined',
    area: '~25 sq mi combined',
    strengthHeadline: 'The corridor\'s peninsula. Dark-sky elevation, ecological reserves, equestrian heritage, the only candidate edge instance with true topography. Politically: the most internally-restricted geography of any candidate instance.',
    signatureStrengths: [
      { domain: 'Topography', detail: 'Hills rising to ~1,500 ft; the only candidate corridor instance with significant elevation. Trail systems extend 30+ miles.' },
      { domain: 'Dark-sky potential', detail: 'The peninsula has the corridor\'s best dark-sky access — 5+ miles from major streetlight density, hill-shielded from LAX glow. The Dark-Sky Observatory\'s natural site.' },
      { domain: 'Ecological reserves', detail: 'Portuguese Bend Reserve, Forrestal Reserve, multiple coastal ecological corridors. Among the largest contiguous open-space reserves within 25 mi of LA.' },
      { domain: 'Equestrian + private-trail culture', detail: 'Rolling Hills retains an equestrian zoning culture rare in coastal LA. Civic-trail-stewardship has 70+ years of operating practice.' },
    ],
    civicMuscle: ['Palos Verdes Land Conservancy (mature)', 'Peninsula Education Foundation', 'PV Library District', 'Multiple equestrian and trail-stewardship associations'],
    asymmetricAdvantages: 'PV is the only candidate corridor instance with (1) significant elevation, (2) genuine dark-sky access, (3) large contiguous ecological reserves, (4) equestrian heritage. The asymmetry is "ecological + dark-sky" — PV is where the federation\'s sky-coded and ecology-coded works find their natural home, despite the political restrictions.',
    bestSuitedShapes: ['Shape #5 (Voluntary Association — Land Conservancy depth)', 'Shape #3 (Mutual Aid Mesh — wildfire risk acute)'],
    bestSuitedGiantWorks: ['Dark-Sky Observatory (best site of any candidate instance)', 'Light Sanctuary (dark-sky + topography unique combination)'],
    whatThisCityShips: 'The Dark-Sky Observatory\'s natural site. The corridor\'s ecological reserve depth. The wildfire-risk Mutual Aid Mesh test case.',
    whatThisCityShouldNotHost: 'The Bath House (no urban density). The Strand-coded works (peninsula not on the Strand). The Civic Personal Agent shape (median income too high; bureaucracy-survival case is weakest of any candidate).',
  },
  {
    id: 'lomita',
    name: 'Lomita',
    status: 'neighbor',
    population: '~20,000',
    area: '~1.9 sq mi',
    strengthHeadline: 'A small neighbor city east of the corridor. Distinct from Torrance despite being surrounded by it. Strong working-class + Latino civic identity.',
    signatureStrengths: [
      { domain: 'Compact independence', detail: 'A small enclave city retaining independence despite Torrance encirclement; civic-identity strength rare at this scale.' },
      { domain: 'Lomita Railroad Museum', detail: 'A small civic museum operating since 1966 — example of long-cycle small-city civic infrastructure.' },
    ],
    civicMuscle: ['Lomita Historical Society', 'Lomita Railroad Museum', 'Lomita Education Foundation (small)'],
    asymmetricAdvantages: 'Lomita is the corridor\'s smallest-instance test case. If the framework can ship in 1.9 sq mi at $70K median, it can ship anywhere.',
    bestSuitedShapes: ['Shape #2 (Neighborhood OS — minimum-viable scale test)', 'Shape #5 (Voluntary Association)'],
    bestSuitedGiantWorks: ['(none Tier D — too small to host independently; partner with Torrance instance)'],
    whatThisCityShips: 'A minimum-viable scale test for the framework. A potential satellite of a Torrance instance.',
    whatThisCityShouldNotHost: '(All Tier D works require corridor-scale partnership; Lomita\'s contribution is voice + a satellite cohort.)',
  },
  {
    id: 'gardena',
    name: 'Gardena',
    status: 'neighbor',
    population: '~60,000',
    area: '~5.9 sq mi',
    strengthHeadline: 'A neighbor city with the most concentrated Japanese-American historical population in California outside Little Tokyo, plus a deep Black-American civic heritage.',
    signatureStrengths: [
      { domain: 'Japanese-American heritage', detail: 'Pre-WWII farming community; major Japanese-American population center. Major Tofu Plant, Bushido Center, Japanese-language church infrastructure.' },
      { domain: 'Black-American civic depth', detail: 'Gardena has been a center of Black-American civic life in the South Bay since the 1950s; Memorial Hospital, AME Church infrastructure, Black-Sigma sorority chapters.' },
      { domain: 'Casino tax base', detail: 'Two card-room casinos generate substantial city revenue; civic operating tempo runs faster than tax-stressed neighbors.' },
    ],
    civicMuscle: ['Gardena Buddhist Church (operating since 1926)', 'Gardena Valley JCI Foundation', 'Gardena Education Foundation', 'Memorial Hospital Foundation'],
    asymmetricAdvantages: 'Gardena is the corridor-adjacent instance with the deepest Japanese-American + Black-American civic infrastructure. The Civic Translation shape\'s strongest non-Spanish case (Japanese) is here.',
    bestSuitedShapes: ['Shape #6 (Civic Translation — Japanese case)', 'Shape #5 (Voluntary Association — depth)'],
    bestSuitedGiantWorks: ['Audio Pavilion (taiko + Black-music heritage anchors)', 'Art Library (cultural-arts heritage depth)'],
    whatThisCityShips: 'A federation neighbor instance with the corridor\'s deepest non-Spanish translation case + depth in two distinct American cultural traditions.',
    whatThisCityShouldNotHost: '(Gardena is a candidate edge instance, not a corridor-Strand instance; coastal Tier D works belong to the four-city corridor.)',
  },
];

export const FEDERATION_SHAPE = {
  thesis: 'A five-instance Pacific corridor (ES, MB, HB, RB, Torrance) plus four edge instances (Lawndale, Hawthorne, Palos Verdes, Gardena) plus one neighbor instance (Lomita) plus inland adjacent (San Pedro, Carson, Wilmington — not yet specified) sketches a federation of approximately 600,000-800,000 people across approximately 80-100 sq mi. That is the corridor\'s realistic outer scope: not all of LA, but a coherent South Bay federation matching the historical "Beach Cities + South Bay inland" frame.',
  whyThisScaleMatters: [
    'A federation of ~700,000 people is large enough to host every Tier D giant work but small enough to remain genuinely federated rather than centralized.',
    'The coastal corridor (ES, MB, HB, RB + the Strand) is small enough to share weekly civic instruments — the Bath House, the Tide-Pool Restoration, the Ocean Tower — without travel becoming a barrier.',
    'The edge and neighbor instances expand cohort recruitment, demographic representation, and shape-specialization without diluting the four-city corridor\'s coherence.',
    'A 700K federation matches the population scale of small countries (Iceland, Cyprus, Luxembourg) — large enough to be civically meaningful, small enough to be operationally tractable.',
    'The federation can credibly negotiate with LA County, the State of California, and the LA28 Olympic Organizing Committee at this scale; it cannot at smaller scale, and it loses local coherence at significantly larger.',
  ],
  whatComesNext: 'After the four-city corridor scaffold is shipped (ES + MB + HB + RB; current state with this PR), the next instance to scaffold is Torrance — the corridor\'s natural inland-depth extension. After Torrance, edge instances (Lawndale, Hawthorne, PV, Gardena) follow as cohort recruitment matures. Lomita and the inland-adjacent geographies are deferred until the federation council has tested its decision-making procedures with the five primary instances.',
};

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-coordinate', cite: 'University of El Segundo. (2026). *Coordinate · Six-Shape Deployment Grid*. https://pointcast.xyz/coordinate' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works*. UES-Federation-02. https://pointcast.xyz/giant-works' },
  { id: 'pointcast-mb', cite: 'University of El Segundo. (2026). *Manhattan Beach Instance*. UES-Fork-MB-01. https://pointcast.xyz/manhattan-beach' },
  { id: 'pointcast-hb', cite: 'University of El Segundo. (2026). *Hermosa Beach Instance*. UES-Fork-HB-02. https://pointcast.xyz/hermosa-beach' },
  { id: 'pointcast-rb', cite: 'University of El Segundo. (2026). *Redondo Beach Instance*. UES-Fork-RB-03. https://pointcast.xyz/redondo-beach' },
  { id: 'pointcast-tr', cite: 'University of El Segundo. (2026). *Torrance Instance*. UES-Fork-TR-04. https://pointcast.xyz/torrance' },
  { id: 'acs', cite: 'U.S. Census Bureau. (Continuing). *American Community Survey 5-Year Estimates*. census.gov.' },
];

export const CS_NOTES = {
  uesNote: 'This page is a strengths overview of corridor candidate cities, not a ranked list. Every city contributes asymmetrically; the federation is strongest when each instance ships from its native muscle. Do not read this as "which city is best" — read it as "which work fits which city."',
  invitation: 'If you live in any of the five corridor cities or four edge cities and want to add depth or correction to your city\'s strengths section, email mh@pointcast.xyz with subject line "Strengths · {your-city}". This page is meant to be revised by people who actually live there.',
};
