/**
 * Fire — UES Track 11. The fourth element. The closing of the four-track
 * sensory frame: Earth (Geology) + Water (Ocean Wing) + Air (Marine Layer)
 * + Fire. The page treats fire as ecology (chaparral fire regime), as
 * civic infrastructure (hearths and fire pits), as risk (Santa Ana season),
 * and as practice (the cohort fire ring). Closes with the four-element
 * synthesis at the bottom — the unifier of the natural-environment tracks.
 */

export const TRACK_META = {
  title: 'Fire',
  subtitle: 'UES Track 11 · The fourth element',
  thesis: 'Fire is the most dangerous and most domestic element in the radius. It is the chaparral ecology that built California; it is the Santa Ana season threat from October to March; it is the small civic act of a backyard hearth on a Saturday night. The track holds all three together — fire ecology, fire safety, and fire as practice — and closes with the four-element synthesis: Geology / Ocean Wing / Marine Layer / Fire as the four sensory tracks of the University.',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  paperNumber: 'UES-Track-11',
  date: '2026-05-06',
};

export const PRINCIPLES = [
  'Fire is older than the city. Chaparral has burned on a 30-to-100-year cycle for 10,000 years; the city has been here for one cycle of that interval.',
  'Fire is honest. A Santa Ana wind reading 25 mph at 12% humidity is the truth in a way that a weather app under the same conditions is not. Read the wind directly.',
  'A hearth is the smallest civic architecture. A fire pit + four chairs + one bottle of water is a complete public square at residential scale.',
  'Burn small, burn often, burn legally. Annual permitted burns at parks departments and tribal lands are how the radius reduces catastrophic-fire risk.',
  'Carry a tarp. The marine layer is wet; the Santa Ana season is dry. The cohort fire ring carries one tarp, one bucket of water, and one shovel, every time.',
  'Honor the indigenous fire knowledge. Tongva and Chumash burning practices managed the radius for thousands of years before they were criminalized in 1850. Read Anderson (2005). Read Ostoja & Brooks. Read.',
];

export type FireRealm = { name: string; detail: string; cohortPosture: string };

export const FIRE_REALMS: FireRealm[] = [
  { name: 'Chaparral fire ecology', detail: 'The native vegetation of the inland radius is fire-adapted. Manzanita, ceanothus, scrub oak, and the dominant chaparral shrubs are pyrophytic — they regenerate from heat-cracked seed banks and crown sprouts. The natural fire-return interval is 30–100 years; suppression has lengthened it artificially, increasing the fuel load and the catastrophe risk.', cohortPosture: 'A monthly cohort observation walk through Palos Verdes Peninsula chaparral (Geology field walk #3 territory) reads the fire regime in real time. Document fire scars; date them; correlate with CalFire records.' },
  { name: 'The Santa Ana season', detail: 'October through March, dry offshore winds blow from the Mojave to the coast at 30–60 mph with relative humidity below 15%. These winds drive most of the radius\'s catastrophic fires. The 1961 Bel Air fire, the 1991 Painted Cave fire, the 2017 Skirball fire, the 2020 Bobcat fire — all Santa Ana driven.', cohortPosture: 'Daily wind/humidity check during Santa Ana season is a Marine Layer Practice 03 cousin. Read NWS Forecast Office Los Angeles RH and wind direction; if humidity <15% and wind >25 mph, no cohort outdoor fires that day. Document and post.' },
  { name: 'Indigenous burning practice', detail: 'The Tongva (Gabrieleño) and Chumash peoples managed the LA Basin, Channel Islands, and Santa Monica Mountains with regular controlled burns for at least 8,000 years before Spanish colonization. Burns kept fuel loads low, encouraged grassland for game, and prevented the catastrophic fire pattern that has dominated since 1850. The 1850 California Act for the Government and Protection of Indians criminalized indigenous burning; the resulting fuel-load accumulation is a primary driver of contemporary catastrophic fires.', cohortPosture: 'Acknowledge in every fire-related publication. Cite Anderson (2005), Lake (2007), and Roos et al. (2020). Support tribal-led fire-management efforts; the Karuk and Yurok in northern California are leading the contemporary recovery.' },
  { name: 'The hearth as civic infrastructure', detail: 'A residential or park-scale fire pit is the smallest unit of civic gathering architecture. Four chairs around a fire pit is a square; eight is a salon; a community fire pit at a public park (the El Segundo Recreation Park ring; the Dockweiler State Beach fire rings) is a civic room. The 1990s civic phase-out of beach fire rings (driven partly by air-quality regulation) is a real loss; the surviving Dockweiler rings are the largest civic-fire infrastructure inside the radius.', cohortPosture: 'The cohort\'s monthly Saturday-night fire ring (variable location: backyard, Dockweiler, Recreation Park) is a Honey League point category and a Marine Layer cousin. The fire is the bell.' },
];

export type FireSafetyChecklist = { item: string; detail: string };

export const SAFETY_CHECKLIST: FireSafetyChecklist[] = [
  { item: 'Check the day\'s fire weather', detail: 'NWS LA Forecast Office. Red Flag Warning = no outdoor fires. Wind <15 mph + humidity >25% = generally OK. Document the reading on the cohort log before lighting.' },
  { item: 'Carry the kit', detail: 'One tarp, one 5-gallon bucket of water, one shovel. Always. Even at Dockweiler\'s rings.' },
  { item: 'Clear a 5-foot radius around any open flame', detail: 'Sweep down to mineral soil. Remove dry leaves, grass, paper. The marine-layer-damp ground inside the city is forgiving; the inland chaparral edge is not.' },
  { item: 'Burn seasoned hardwood, not chaparral or sage', detail: 'Oak, almond, and orchard prunings burn cleanly. Native chaparral and sage are chemically resinous and produce dangerous-flame embers in wind.' },
  { item: 'Do not leave the fire', detail: 'A staffed fire is a civic hearth. An unstaffed fire is a wildfire prelude. Two-person rule: at least two cohort members present at all times.' },
  { item: 'Drown the fire on departure', detail: 'Pour the entire bucket of water on the coals. Stir with the shovel. Pour again. The fire is out when the coals are cold to the touch. Document with a photograph.' },
  { item: 'Document the burn', detail: 'A Honey League "Bring" entry: photograph, weather conditions, who attended, what was burned. Logged to /commons within 24 hours.' },
];

export type FirePractice = { name: string; cadence: string; detail: string };

export const FIRE_PRACTICES: FirePractice[] = [
  { name: 'Saturday-night fire ring', cadence: 'monthly, October–April (no Santa Ana)', detail: 'Cohort gathers at a rotating location (backyard, Dockweiler ring, Recreation Park ring). Two-hour duration. One bottle of water per person. The fire is the bell. The cohort talks at the speed of the fire, not the speed of phones.' },
  { name: 'Daily Santa Ana check', cadence: 'daily October 1 – March 31', detail: '30 seconds: read NWS LA wind speed and relative humidity. Mark the day on the goal machine if it counts as your daily action. The seasonal practice trains the cohort to read fire weather like the marine layer.' },
  { name: 'Annual indigenous-fire-knowledge reading', cadence: 'one full year arc, three books, monthly', detail: 'Anderson (2005) *Tending the Wild*; Lake (2007) thesis on Karuk fire knowledge; Roos et al. (2020) on California prehistoric fire regimes. One book per four months. Annotate; share notes at the cohort fire ring.' },
  { name: 'Quarterly chaparral observation walk', cadence: 'four times per year', detail: 'Palos Verdes Peninsula or Santa Monica Mountains. Document fire scars: date, severity, recovery stage. Photograph the same scar across years. The annual photograph series is the receipt.' },
];

export const FOUR_ELEMENTS = [
  { element: 'EARTH', track: 'Geology', url: '/geology', paperNumber: 'UES Track 08', sensoryFocus: 'The ground beneath. Stratigraphy, fault, deep-time markers, twelve stones, four field walks, El Segundo Blue habitat.', practice: 'Stone in pocket; sit with stone; read the layer.' },
  { element: 'WATER', track: 'Ocean Wing', url: '/ocean-wing', paperNumber: 'UES Track 09', sensoryFocus: 'The Pacific edge. Twelve coastal sites, six tide-and-surf realities, NOAA buoy 46221, the marine-layer fog cycle.', practice: 'Tide-table read; beach walk; cold-water acclimation; tide-pool sit.' },
  { element: 'FIRE', track: 'Fire', url: '/fire', paperNumber: 'UES Track 11 · here', sensoryFocus: 'The chaparral cycle, the Santa Ana season, the indigenous burning tradition, the civic hearth.', practice: 'Saturday-night fire ring; daily Santa Ana check; annual reading arc; quarterly fire-scar walk.' },
  { element: 'AIR', track: 'Marine Layer', url: '/marine-layer', paperNumber: 'UES Track 07', sensoryFocus: 'The atmospheric fog cycle. Eight place-based sittings, breath protocols, the marine layer as bell.', practice: 'Eight-week sit cycle; one artifact per sit.' },
];

export const SYNTHESIS_NOTES = {
  closingThesis: 'The four sensory tracks together compose the University\'s natural-environment curriculum. Marine Layer is the daily atmospheric practice; Geology is the deep-time substrate; Ocean Wing is the Pacific boundary; Fire is the seasonal hazard and civic gathering element. The cohort member who has worked all four for one year has, by definition, read the radius across its principal natural dimensions. The Nature Practice pathway (UES Track 10) is the 12-month bridge that walks all four; Common Forms (UES Track 11 architecture) is the built response.',
  bibliography: [
    'Anderson, M. K. (2005). *Tending the Wild: Native American Knowledge and the Management of California\'s Natural Resources*. University of California Press.',
    'Lake, F. K. (2007). *Traditional Ecological Knowledge to Develop and Maintain Fire Regimes in Northwestern California, Klamath–Siskiyou Bioregion: Management and Restoration of Culturally Significant Habitats*. PhD dissertation, Oregon State University.',
    'Roos, C. I., et al. (2020). "Indigenous fire management and cross-scale fire-climate relationships in the Southwest United States from 1500 to 1900 CE." *Science Advances*, 6(51).',
    'Keeley, J. E., & Syphard, A. D. (2019). "Twenty-first century California, USA, wildfires: fuel-dominated vs. wind-dominated fires." *Fire Ecology*, 15(24).',
    'Halsey, R. W. (2005). *Fire, Chaparral, and Survival in Southern California*. Sunbelt Publications.',
    'NWS Forecast Office Los Angeles. (Continuing). *Fire Weather Forecasts and Red Flag Warnings*. weather.gov/lox.',
    'CalFire. (Continuing). *Incident Information*. fire.ca.gov.',
  ],
};
