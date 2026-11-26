// Coast Commons (/coast-commons/): the data behind every page and the JSON twin.
// Every rule sentence here is a short paraphrase of a page that was opened on VERIFIED.
// Where a page was not opened, the entry says "Not verified" and carries no link.
// Written by Claude. Edit here, then run: node scripts/coast-commons/build.mjs

export const VERIFIED = '2026-11-11';
export const ORIGIN = { name: 'El Segundo City Hall', lat: 33.9192, lon: -118.4165 };

const S = (label, url, kind = 'official') => ({ label, url, kind });

// Sources. kind: official (a government site), official-file (a government document on its file host),
// copy (a third-party copy of a public code; read it, then check the adopted code).
export const SRC = {
  ccc: S('California Coastal Commission: permit applications', 'https://coastal.ca.gov/cdp/cdp-forms.html'),
  esStr: S('City of El Segundo: home share rental permit', 'https://www.elsegundo.gov/government/departments/community-development/short-term-home-sharing-rental-permit-pilot-program'),
  esAdu: S('City of El Segundo: ADU and JADU resources', 'https://www.elsegundo.gov/government/departments/community-development/housing-division/adu-resources'),
  esApps: S('City of El Segundo: planning applications', 'https://www.elsegundo.gov/government/departments/community-development/planning-division/planning-applications'),
  esCoastCopy: S('El Segundo Municipal Code, Title 15 Chapter 26 (third-party copy, October 2026 edition)', 'https://gocodebook.com/library/us/ca/el-segundo-zoning/chapter-26-coastal-zone-development-permits', 'copy'),
  mbStr: S('City of Manhattan Beach: short-term rentals', 'https://www.manhattanbeach.gov/departments/community-development/planning-zoning/short-term-vacation-rentals'),
  mbAdu: S('City of Manhattan Beach: ADUs and JADUs', 'https://www.manhattanbeach.gov/departments/community-development/planning-and-zoning/zoning-development-regulations/accessory-dwelling-units-adus-junior-adus-jadus'),
  mbCoast: S('City of Manhattan Beach: Local Coastal Program', 'https://www.manhattanbeach.gov/departments/community-development/planning-zoning/coastal-permit-procedures'),
  mbZone: S('City of Manhattan Beach: zoning and development regulations', 'https://manhattanbeach.gov/departments/community-development/planning-zoning/zoning-development-regulations'),
  hbStr: S('City of Hermosa Beach: short-term vacation rentals', 'https://hermosabeach.gov/our-government/city-departments/community-development/short-term-vacation-rentals'),
  hbAdu: S('City of Hermosa Beach: accessory dwelling units', 'https://www.hermosabeach.gov/our-government/city-departments/community-development/adu'),
  hbCoast: S('City of Hermosa Beach: Local Coastal Plan', 'https://hermosabeach.gov/our-government/community-development/applications-forms-handouts/local-coastal-plan'),
  rbStr: S('City of Redondo Beach: short-term rentals not permitted in residential zones (PDF)', 'https://cms2.revize.com/revize/redondobeachca/RB%20SHORT%20TERM%20RENTAL%20NOT%20PERMITTED.pdf', 'official-file'),
  rbPlan: S('City of Redondo Beach: planning procedures and forms', 'https://redondo.org/departments/community_development/planning/planning_procedures_and_application_forms.php'),
  toStr: S('City of Torrance: short term rentals', 'https://www.torranceca.gov/Government/Departments-Offices/Departments-Offices/Community-Development/Planning-Division/Land-Use-Plans-and-Standards/Short-Term-Rentals'),
  toAdu: S('City of Torrance: accessory dwelling units', 'https://www.torranceca.gov/our-city/community-development/planning-division/accessory-dwelling-units'),
  toLand: S('City of Torrance: land use plans and standards', 'https://www.torranceca.gov/Government/Departments-Offices/Departments-Offices/Community-Development/Planning-Division/Land-Use-Plans-and-Standards'),
  pveCode: S('City of Palos Verdes Estates: common code enforcement violations', 'https://pvestates.org/services/code-enforcement/common-types-of-code-enforcement-violations'),
  pveAdu: S('City of Palos Verdes Estates: ADUs', 'https://pvestates.org/services/planning/adus'),
  rpvStr: S('City of Rancho Palos Verdes: short term rentals', 'https://www.rpvca.gov/987/Short-Term-Rentals'),
  rpvAdu: S('City of Rancho Palos Verdes: ADUs and JADUs', 'https://rpvca.gov/1580/Accessory-Dwelling-Units-and-Junior-Acce'),
  rpvApps: S('City of Rancho Palos Verdes: planning applications', 'https://rpvca.gov/1223/Planning-Applications'),
  laStr: S('Los Angeles City Planning: Home-Sharing Program', 'https://planning.lacity.gov/node/132268'),
  laVenice: S('Los Angeles City Planning: Venice Local Coastal Program', 'https://planning.lacity.gov/venicelcp'),
  coStr: S('Los Angeles County Treasurer and Tax Collector: short-term rentals', 'https://ttc.lacounty.gov/?p=26642'),
  coCoast: S('Los Angeles County Regional Planning: coastal (archive page)', 'https://case.planning.lacounty.gov/coastal'),
  smStr: S('City of Santa Monica: how to apply for a home-share business license', 'https://www.santamonica.gov/process-explainers/how-to-apply-for-a-home-share-business-license'),
  smRegs: S('City of Santa Monica: Home-Sharing Ordinance rules and regulations (PDF, revised Nov 21, 2019)', 'https://www.santamonica.gov/media/Document%20Library/Business%20License%20Forms/INFO-Home-Share%20Admin%20Regs.pdf'),
  smPlan: S('City of Santa Monica: planning resources', 'https://santamonica.gov/planning-resources'),
  maStr: S('City of Malibu: short-term rental program', 'https://malibucity.org/str'),
  maAdu: S('City of Malibu: accessory dwelling units', 'https://malibucity.org/adu'),
  lbStr: S('City of Long Beach: short-term rentals', 'https://www.longbeach.gov/lbcd/enforcement/strs'),
  lbAdu: S('City of Long Beach: ADUs', 'https://www.longbeach.gov/lbcd/adus/'),
  lbCoast: S('City of Long Beach: coastal planning', 'https://longbeach.gov/lbcd/planning/current/coastal-planning/'),
  sbStr: S('City of Seal Beach: short term rental permits', 'https://sealbeachca.gov/Departments/Community-Development/Planning-Development/Short-Term-Rental-Permits'),
  sbFaq: S('City of Seal Beach: short-term rental FAQ (PDF)', 'https://www.sealbeachca.gov/Portals/0/Documents/STR%20Website%20FAQs.pdf'),
  sbCoast: S('City of Seal Beach: Local Coastal Plan project', 'https://www.sealbeachca.gov/Departments/Departments/Community-Development/Local-Coastal-Plan-Project'),
  bMalibu: S('LA County Beaches and Harbors: Malibu Surfrider Beach', 'https://beaches.lacounty.gov/malibu-surfrider-beach/'),
  bTopanga: S('LA County Beaches and Harbors: Topanga Beach', 'https://beaches.lacounty.gov/topanga-beach/'),
  bVenice: S('LA County Beaches and Harbors: Venice Beach', 'https://beaches.lacounty.gov/venice-beach/'),
  bMarina: S("LA County Beaches and Harbors: Marina (Mother's) Beach", 'https://beaches.lacounty.gov/marina-beach/'),
  bDock: S('LA County Beaches and Harbors: Dockweiler Beach', 'https://beaches.lacounty.gov/dockweiler-beach/'),
  bMb: S('LA County Beaches and Harbors: Manhattan Beach', 'https://beaches.lacounty.gov/manhattan-beach/'),
  bHb: S('LA County Beaches and Harbors: Hermosa Beach', 'https://beaches.lacounty.gov/hermosa-beach/'),
  bRb: S('LA County Beaches and Harbors: Redondo Beach', 'https://beaches.lacounty.gov/redondo-beach/'),
  bTo: S('LA County Beaches and Harbors: Torrance Beach', 'https://beaches.lacounty.gov/torrance-beach'),
  bWp: S('LA County Beaches and Harbors: White Point and Royal Palms', 'https://beaches.lacounty.gov/white-point-royal-palms-beach/'),
};

const NV = (what) => ({ text: `Not verified. ${what}`, src: [], verified: false });
const R = (text, ...src) => ({ text, src, verified: true });

// Rule sets by governing body. Towns that share a body share the set.
const RULES = {
  elSegundo: {
    body: 'City of El Segundo',
    stay: 'hosted',
    str: R('The City runs a home share permit. A homeowner may rent bedrooms for 30 days or less in the home they live in, and must be living there during the stay. The page caps guests at six on the parcel, bars parties and events, bars short stays in an ADU, and lists a permit registration fee of $396 and a renewal fee of $201. A whole house rented to a group for a weekend with no owner present is not what this permit covers.', 'esStr'),
    adu: R('The City says ADUs are allowed by right in any zone that allows housing, with standards in Municipal Code sections 15-4E-3 (ADUs) and 15-4F-2 (JADUs). It offers an application handout, a fee calculator and pre-approved plans.', 'esAdu'),
    coastal: R('The planning applications page lists a Coastal Development application guide. A third-party copy of Municipal Code Title 15, Chapter 26 says a coastal development permit is needed before development in the Coastal Zone and that the Planning Commission grants it. The adopted code itself was not opened.', 'esApps', 'esCoastCopy'),
    zoning: NV('The zoning map and the adopted zoning code were not opened. The planning applications page says to email Planning staff.'),
  },
  manhattan: {
    body: 'City of Manhattan Beach',
    stay: 'split',
    str: R('The City defines a short-term rental as under 30 days and bans it in residential zones (Ordinance 19-0007, 2019). The page says a Court of Appeal opinion of April 4, 2022 held the ban does not apply inside the Coastal Zone, where operators need a business license and must remit hotel tax. When the page was read it also described a temporary World Cup allowance outside the Coastal Zone as under Council consideration in January 2026; the outcome was not verified.', 'mbStr'),
    adu: R('Ordinance 25-0004 took effect May 1, 2025. ADUs are allowed in single-family and multi-family zones and JADUs in single-family zones, inside or outside the Coastal Zone. Until the Coastal Commission certifies the matching coastal amendments, the page says units in the Coastal Zone follow state law only.', 'mbAdu'),
    coastal: R('The City publishes its Local Coastal Program, including Chapter A.96 on coastal development permit procedures and application instructions. Recent amendments are listed as awaiting Coastal Commission certification.', 'mbCoast'),
    zoning: R('The zoning code is Title 10 of the Municipal Code. The City posts a zoning map that shows the coastal zone, and an interactive parcel map.', 'mbZone'),
  },
  hermosa: {
    body: 'City of Hermosa Beach',
    stay: 'narrow',
    str: R('Stays under 30 days are allowed only in older, lawfully established homes that sit in commercial zones C-2 and C-3 and specific plan areas 7, 8 and 11, and only with an administrative permit. Operating without one carries fines that start at $5,000.', 'hbStr'),
    adu: R('ADU rules are in Municipal Code Chapter 17.21. Rentals must run at least 30 days, so an ADU cannot be a short-term rental.', 'hbAdu'),
    coastal: R('Hermosa Beach has a certified coastal land use plan but not a fully certified Local Coastal Program. The City approves a project in concept and the Coastal Commission\'s South Coast District issues the coastal development permit.', 'hbCoast'),
    zoning: NV('The zoning map and code pages were not opened.'),
  },
  redondo: {
    body: 'City of Redondo Beach',
    stay: 'none',
    str: R('A City document treats lodging for 30 days or less as a hotel or motel use, which the municipal code bars in the single-family and multi-family residential zones (sections 10-2.402, 10-2.501 and 10-2.511). The document carries no date.', 'rbStr'),
    adu: NV('The planning forms page links to an ADU page, which was not opened.'),
    coastal: NV('The City\'s coastal permit pages were not opened.'),
    zoning: R('The planning page links the zoning ordinance, a GIS map and a 2025 zoning map PDF.', 'rbPlan'),
  },
  torrance: {
    body: 'City of Torrance',
    stay: 'hosted',
    str: R('In residential zones the only short-term rental allowed is a home share with the host living on site for the whole stay. Commercial zones allow them with or without a host. A City permit and business license are required. In the Coastal Zone the rules follow the Coastal Commission approval the page cites as CDP 5-20-0031.', 'toStr'),
    adu: R('ADU rules are in Municipal Code section 92.2.10, amended in October 2025. An ADU may not be rented for less than 30 days. For the Coastal Zone the page sends applicants to the Coastal Commission.', 'toAdu'),
    coastal: R('The land use page lists a Hillside and Local Coastal Overlay with its own boundaries and review procedure. The overlay page itself was not opened.', 'toLand'),
    zoning: NV('The land use page does not link a zoning map; none was opened.'),
  },
  pve: {
    body: 'City of Palos Verdes Estates',
    stay: 'none',
    str: R('The City lists short term or vacation rentals in the R1 zone as a common code violation and cites Municipal Code section 18.04.021. The code section itself was not opened.', 'pveCode'),
    adu: R('Local ADU rules are in Municipal Code Chapter 18.45, adopted by Ordinance O20-747 in October 2020. The process can include a recorded deed restriction and a yearly rent certification.', 'pveAdu'),
    coastal: NV('No City coastal permit page was opened.'),
    zoning: NV('The zoning map and code were not opened.'),
  },
  rpv: {
    body: 'City of Rancho Palos Verdes',
    stay: 'none',
    str: R('The City Council affirmed in 2016 that rentals under 30 days are prohibited in residential zones, and Ordinances 592U and 593 also bar advertising them. Fines listed run from $2,500 to $7,500.', 'rpvStr'),
    adu: R('ADUs are allowed on lots zoned for single-family or multi-family housing and JADUs on single-family lots, under Municipal Code Chapter 17.10. The page noted a Council item on October 6, 2026 to begin updating the ordinance.', 'rpvAdu'),
    coastal: R('The City has its own Coastal Permit application, required for most improvements on property seaward of Palos Verdes Drive West and South.', 'rpvApps'),
    zoning: R('The planning applications page carries a development standards handout for each single-family zone. The zoning map was not opened.', 'rpvApps'),
  },
  la: {
    body: 'City of Los Angeles',
    stay: 'registered',
    str: R('Under the Home-Sharing Ordinance a host may share only their primary residence, must register with the City and show the number on listings, and is limited to 120 days a year unless they hold an extended registration. Rent-stabilized units are not eligible, and renters need the landlord\'s notarized approval.', 'laStr'),
    adu: NV('The City\'s ADU pages were not opened.'),
    zoning: NV('The City\'s zoning map tools were not opened.'),
  },
  county: {
    body: 'County of Los Angeles (unincorporated)',
    stay: 'pending',
    str: R('The County\'s short-term rental ordinance took effect October 7, 2024 for unincorporated areas, with registration of a primary residence only. The County page says it does not apply in coastal areas, Marina del Rey included, until the Coastal Commission approves it and it is written into each Local Coastal Program. Whether that has happened since was not verified.', 'coStr'),
    adu: R('The same County page says ADUs and junior ADUs cannot be used as short-term rentals under the ordinance, and that the County\'s Title 22 ADU rules do not apply in the coastal zone. Marina del Rey\'s own coastal rules were not opened.', 'coStr'),
    coastal: R('Marina del Rey has a certified Local Coastal Program (1984, amended 2012), so coastal permits are handled by the County, with the Coastal Commission keeping tidelands and certain appeals. This comes from a County archive page that points to the current planning site for updates.', 'coCoast'),
    zoning: NV('The current Marina del Rey land use plan and zoning pages were not opened.'),
  },
  santaMonica: {
    body: 'City of Santa Monica',
    stay: 'hosted',
    str: R('Home-sharing means renting bedrooms for 30 days or less in the host\'s primary residence with the host living on site throughout. It needs a home-share permit and a business license. The City\'s rules treat a stay with no host on site as a prohibited vacation rental.', 'smStr', 'smRegs'),
    adu: R('The planning resources page carries ADU guides dated November 2025 for single-unit and multi-unit parcels, and a pre-approved ADU program.', 'smPlan'),
    coastal: R('The planning resources page links the Local Coastal Program land use plans of 1992 and 2018 and an update page. Who issues coastal development permits in Santa Monica was not verified.', 'smPlan'),
    zoning: R('The same page links an interactive zoning district lookup and the zoning ordinance.', 'smPlan'),
  },
  malibu: {
    body: 'City of Malibu',
    stay: 'permit',
    str: R('Since January 15, 2021 a City short-term rental permit is required to advertise or operate one (Ordinance 468, Municipal Code Chapter 17.55). A stricter hosted ordinance (472), with an on-site host and primary residence rule, was adopted in 2020 but waits on Coastal Commission certification; the page calls it in progress.', 'maStr'),
    adu: R('ADU rules are in Municipal Code 17.44 and the coastal implementation plan. The page says all of Malibu is in the Coastal Zone and its certified Local Coastal Program governs new development, ADUs included. A coastal amendment for ADUs was sent to the Coastal Commission in February 2024; its status was not stated.', 'maAdu'),
    coastal: R('All of Malibu is in the Coastal Zone and the City has a certified Local Coastal Program, per the City\'s ADU page. The City\'s coastal permit page was not opened.', 'maAdu'),
    zoning: NV('The zoning map and code were not opened.'),
  },
  longBeach: {
    body: 'City of Long Beach',
    stay: 'registered',
    str: R('Short-term rentals must be registered. A primary residence can host without limit when the registrant is on site, and for up to 90 days a registration period when not. Registrations for homes that are not a primary residence are capped at 800 citywide. ADUs cannot be short-term rentals. The page lists the fee as $400 in one place and $500 in another.', 'lbStr'),
    adu: R('Long Beach applies state ADU law directly while its own ordinance is rewritten. In the Coastal Zone an administrative local coastal development permit comes before the building permit.', 'lbAdu'),
    coastal: R('The Local Coastal Program was certified in 1980. The City issues coastal permits in most of its coastal zone, some areas stay with the Coastal Commission, and City decisions in the appealable area can be appealed to the Commission.', 'lbCoast'),
    zoning: NV('The zoning map and code pages were not opened.'),
  },
  sealBeach: {
    body: 'City of Seal Beach (Orange County)',
    stay: 'capped',
    str: R('Stays of 29 nights or fewer need a City permit and business license, are allowed only in the Coastal Zone south of Westminster Boulevard, and are capped at one percent of homes there. The FAQ counts 31 permits, first awarded by lottery in May 2023, with a waitlist. It lists a $600 first-year fee and $400 renewal. Permits do not transfer on sale.', 'sbFaq', 'sbStr'),
    adu: NV('The City\'s ADU pages were not opened.'),
    coastal: R('Seal Beach has no certified Local Coastal Program; a revised draft land use plan went to the Coastal Commission for comment on May 9, 2023. The page says the City takes over permitting only after certification, so permits appear to remain with the Commission.', 'sbCoast'),
    zoning: NV('The zoning map and code were not opened.'),
  },
};

const laCoastal = {
  venice: R('The Venice Local Coastal Program is not certified: its land use plan was certified in 2001, the implementation plan was not. The Venice Coastal Zone Specific Plan (1999, revised 2004) sets use and density. Who signs coastal permits today was not stated on the page.', 'laVenice'),
  other: NV('The coastal permit path for this part of the City of Los Angeles was not opened.'),
};

// stay: a plain reading of whether a group could lawfully book a whole house for a weekend.
export const STAY = {
  hosted: { label: 'Hosted rooms only', note: 'A resident host must be home. No whole-house weekends.' },
  none: { label: 'No short stays in homes', note: 'Short stays are barred in residential zones.' },
  narrow: { label: 'A few permitted homes', note: 'Only permitted homes in certain commercial zones.' },
  split: { label: 'Depends on the Coastal Zone', note: 'Banned outside it; a court held the ban does not reach inside it.' },
  registered: { label: 'Registered homes', note: 'Lawful only in a home the host has registered with the city.' },
  permit: { label: 'Permitted homes', note: 'Lawful only in a home holding a city permit.' },
  capped: { label: 'Capped permits', note: 'A small fixed number of permitted homes.' },
  pending: { label: 'Rules pending', note: 'County rules were waiting on the Coastal Commission.' },
};

const T = (o) => o;
// lat/lon are approximate reference points chosen by Claude (a pier, cove or beach), used only for distance.
export const TOWNS = [
  T({ slug: 'malibu', name: 'Malibu', ref: 'Surfrider Beach', lat: 34.036, lon: -118.677, rules: 'malibu',
    character: [R('Surfrider Beach has almost a mile of ocean frontage and became famous through the surf films of the 1950s and 60s. Next to it, Malibu Lagoon is 22 acres of wetland used by more than 200 bird species.', 'bMalibu'), R('Topanga Beach, at the east end, breaks over cobblestone and reef and suits surfing more than swimming.', 'bTopanga')],
    house: 'A board barn more than a bunkhouse: a shared rack of longboards and wetsuits near the point, a rinse station, a bench, and a logbook. Members drive in for the morning and go home. The public-good share could be a monthly lagoon bird walk and beach clean.',
    edge: 'Malibu is 21 miles long. It is measured here at Surfrider Beach; the western end past Zuma is more than 25 miles out.' }),
  T({ slug: 'santa-monica', name: 'Santa Monica', ref: 'Santa Monica Pier', lat: 34.0094, lon: -118.4973, rules: 'santaMonica',
    character: [NV('No official beach page was opened for Santa Monica State Beach. Generally known: a wide, flat city beach with a pier, a bike path and gentle beach-break waves that suit beginners.')],
    house: 'A hosted house. One member household that already lives here holds the home-share permit and hosts a room or two; the commons is the garage: boards, bikes, a repair stand. The public-good share could be free loaner boards for a beginners\' morning.' }),
  T({ slug: 'venice', name: 'Venice', ref: 'Venice Breakwater', lat: 33.985, lon: -118.4735, rules: 'la', laCoastal: 'venice',
    character: [R('About three miles of coast and 238 acres of sand along Ocean Front Walk. The County calls the Venice Breakwater a well-regarded local surf spot.', 'bVenice')],
    house: 'A workshop with a couch. A ding-repair and shaping bay, a music corner, a wall of shared boards. Sleeping is secondary; making things is the point. The public-good share could be a free monthly repair clinic.' }),
  T({ slug: 'marina-del-rey', name: 'Marina del Rey', ref: "Mother's Beach", lat: 33.9803, lon: -118.4575, rules: 'county',
    character: [R("Mother's Beach is a human-made beach inside the harbor with nearly half a mile of sand and no surf in the swimming area. Kayaking and windsurfing are the main activities.", 'bMarina')],
    house: 'A boat, not a house. A shared small sailboat or a rack of kayaks and paddleboards with a booking sheet. The same recipe applies: ten people, open books, use-rights. The public-good share could be free harbor paddles for kids who have never been on the water.' }),
  T({ slug: 'playa-del-rey', name: 'Playa del Rey', ref: 'Dockweiler Beach', lat: 33.953, lon: -118.447, rules: 'la', laCoastal: 'other',
    character: [R('Dockweiler has 3.7 miles of ocean frontage and 288 acres of beach, fire rings, a hang gliding area, and an RV campground with more than 100 full hook-up spaces. The Marvin Braude Bike Trail runs alongside.', 'bDock')],
    house: 'A house on wheels. The County campground is a lawful place for a group to spend a weekend by the water, so the first step here could be a few campsites and a fire ring rather than a rental house. The public-good share could be a fire-ring supper open to anyone who brings a dish.' }),
  T({ slug: 'el-segundo', name: 'El Segundo', ref: 'City Hall', lat: 33.9192, lon: -118.4165, rules: 'elSegundo', flagship: true,
    character: [NV('No official page for El Segundo Beach was opened. Generally known: a short city shoreline along Vista del Mar between Dockweiler and Manhattan Beach, beside the refinery and the power plant, reached from the foot of Grand Avenue and by the bike path. The town itself sits on the bluff above.')],
    house: 'The flagship study. See the full page.' }),
  T({ slug: 'manhattan-beach', name: 'Manhattan Beach', ref: 'Manhattan Beach Pier', lat: 33.8847, lon: -118.4135, rules: 'manhattan',
    character: [R('More than two miles of ocean frontage, a 900-foot pier, and volleyball nets running south to Hermosa. The north end, El Porto, is a popular surf spot where lessons are offered.', 'bMb')],
    house: 'A dawn-patrol locker room near El Porto: racks, hot rinse, coffee, out by eight. A weekend house is only a live question inside the Coastal Zone, and that needs a lawyer\'s reading first. The public-good share could be free youth surf mornings with borrowed boards.' }),
  T({ slug: 'hermosa-beach', name: 'Hermosa Beach', ref: 'Hermosa Beach Pier', lat: 33.8617, lon: -118.4035, rules: 'hermosa',
    character: [R('Almost two miles of city-owned beach, known for surf and swimming, with The Strand along the sand and a concrete pier first built in 1913.', 'bHb')],
    house: 'A music room over a board room. Hermosa is where a clubhouse in a commercial district makes more sense than a house on a walk street: instruments upstairs, boards and volleyballs downstairs. The public-good share could be an open jam and a free ball-and-net loan.' }),
  T({ slug: 'redondo-beach', name: 'Redondo Beach', ref: 'Redondo Beach Pier', lat: 33.839, lon: -118.392, rules: 'redondo',
    character: [R('A mile and a half of beach south of the horseshoe pier, good for surfing, swimming and windsurfing, with King Harbor to the north. A statue of surfing pioneer George Freeth stands at the pier.', 'bRb')],
    house: 'A community kitchen by the harbor. A rented commercial kitchen day, a long table, and a paddle rack. The public-good share could be a monthly free supper cooked by members.' }),
  T({ slug: 'torrance', name: 'Torrance Beach', ref: 'Torrance Beach', lat: 33.814, lon: -118.392, rules: 'torrance',
    character: [R('About 40 acres of soft sand under the cliffs that run to the Palos Verdes Peninsula. The stretch shared with Redondo is often called RAT Beach.', 'bTo')],
    house: 'A hosted house with a garden. Torrance allows a home share when the host lives on site, so the pattern here is a member family that hosts, plus a shared vegetable plot and a tool shed. The public-good share could be a seed and tool library.' }),
  T({ slug: 'palos-verdes-estates', name: 'Palos Verdes Estates', ref: 'Malaga Cove', lat: 33.801, lon: -118.396, rules: 'pve',
    character: [NV('No official page was opened for the coves. Generally known: rocky reef and point breaks under high bluffs, reached by steep trails.')],
    house: 'No house. A stewardship crew with a shared shed: trail tools, tide-pool guides, a first-aid kit. The commons is the cove itself and the habit of looking after it. The public-good share is the work.' }),
  T({ slug: 'rancho-palos-verdes', name: 'Rancho Palos Verdes', ref: 'Abalone Cove', lat: 33.738, lon: -118.376, rules: 'rpv',
    character: [NV('No official page was opened for the shoreline. Generally known: coves, tide pools and bluff-top trails rather than sand beaches.')],
    house: 'A garden and a trailhead. Short stays are barred in homes here, so the pattern is a day commons: a shared garden plot, a native plant nursery bench, a walking group. The public-good share could be free tide-pool mornings led by members.' }),
  T({ slug: 'san-pedro', name: 'San Pedro', ref: 'Cabrillo Beach', lat: 33.708, lon: -118.283, rules: 'la', laCoastal: 'other',
    character: [R('White Point and Royal Palms have more than a mile and a half of rocky shore with some of the most varied tide pools in Southern California. Fishing, surfing and diving are popular; swimming is not advised. Construction limits parking through 2027.', 'bWp')],
    house: 'A workshop near the working harbor: wood, fiberglass, sailcloth, and a shared skiff. The public-good share could be a free boat-building Saturday for teenagers.' }),
  T({ slug: 'long-beach', name: 'Long Beach', ref: 'Belmont Pier', lat: 33.757, lon: -118.149, rules: 'longBeach',
    character: [NV('No official beach page was opened. Generally known: a long, flat city beach sheltered by the harbor breakwater, with little surf and steady wind, used for kiting, paddling, sailing and rowing.')],
    house: 'The most room on this coast for a lawful first weekend, because registered short-term rentals exist here in number. The house could lean to wind and flat water: kites, paddleboards, a rowing shell. The public-good share could be free paddle mornings.' }),
  T({ slug: 'seal-beach', name: 'Seal Beach', ref: 'Seal Beach Pier', lat: 33.7385, lon: -118.1065, rules: 'sealBeach',
    character: [NV('No official beach page was opened. Generally known: a small-town beach with a long wooden pier and beach-break surf beside it, just across the Orange County line.')],
    house: 'A small clubhouse off Main Street rather than a house, since only a few dozen permitted rentals exist. Boards, a table, a pot of coffee. The public-good share could be free pier-side surf mornings for local kids.' }),
];

// Places checked and left out, with the reason.
export const LEFT_OUT = [
  { name: 'Pacific Palisades', why: 'About 11 miles out and inside the City of Los Angeles. Left off for now while the neighborhood rebuilds after the January 2025 fire.' },
  { name: 'Sunset Beach and Huntington Beach', why: 'Sunset Beach is about 24 miles out and is part of Huntington Beach, whose pier is about 29 miles out. Treated as outside the circle.' },
  { name: 'Western Malibu (Zuma, Point Dume and beyond)', why: 'Zuma is about 24 miles out and the city continues west past 30. Malibu is measured at Surfrider.' },
  { name: 'Carson, Lomita, Rolling Hills, Rolling Hills Estates', why: 'Inside the circle but with no ocean beach of their own.' },
];

export const RULESETS = RULES;
export const LA_COASTAL = laCoastal;

export function miles(lat, lon) {
  const r = Math.PI / 180, R0 = 3958.8;
  const dLat = (lat - ORIGIN.lat) * r, dLon = (lon - ORIGIN.lon) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(ORIGIN.lat * r) * Math.cos(lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R0 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

export function rulesFor(town) {
  const set = RULES[town.rules];
  const coastal = town.rules === 'la' ? laCoastal[town.laCoastal] : set.coastal;
  return { body: set.body, stay: set.stay, str: set.str, adu: set.adu, coastal, zoning: set.zoning };
}
