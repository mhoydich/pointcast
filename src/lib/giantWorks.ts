/**
 * Giant Works — Tier D civic projects.
 *
 * Common Forms (UES-WP-2026-XX) caps at Tier C — $150K+ pavilion-class
 * commissions a single instance can fund within a ~10-year window via
 * its own Commons treasury. Giant Works begin where Common Forms
 * end: $1M and up, multi-instance funding paths, multi-decade horizons,
 * civic infrastructure that requires a federation rather than an instance.
 *
 * The premise: a federated Pacific-coast corridor of four-plus instances
 * can credibly steward giant civic works that no single instance, and no
 * single municipal budget, would otherwise prioritize. The bath house,
 * the ocean tower, the geothermal pool, the stone garden, the fire
 * pavilion, the wind garden, the tide-pool restoration — each is a
 * one-element-coded brutalist civic instrument designed to outlast its
 * builders by a century.
 *
 * This page is the prospective catalog. Eight giant works specified.
 * No commitments yet; the federation council has not formed. The
 * specification exists so that when the council does form, the question
 * "what would we build together that no instance would build alone"
 * has a working answer.
 */

export const GW_META = {
  title: 'Giant Works',
  subtitle: 'Tier D civic projects · the federation\'s 50-year build queue',
  thesis: 'Common Forms taught the federation how to fund a $1,800 First Bench from 100 give-back receipts. Giant Works asks the next question: what would we build together that no single instance would build alone? This page specifies eight prospective giant civic works — bath house, ocean tower, geothermal pool, stone garden, fire pavilion, wind garden, tide-pool restoration, dark-sky observatory — each designed as a brutalist public instrument tied to one of the elements: earth, water, fire, air, or the synthesis of all four. None are committed; all are specified in enough detail that the federation council, when it forms, has a working build queue rather than starting from blank.',
  paperNumber: 'UES-Federation-02',
  date: '2026-05-07',
  parentPaper: 'UES-WP-2026-11 The Forkable Radius',
  audience: 'Federation council members (forming), local Lands across the four corridor instances, philanthropic partners considering multi-decade civic-infrastructure commitments, the LA28 legacy-projects circle, the California Coastal Conservancy.',
};

export const TIER_D_DEFINITION = {
  costFloor: '$1,000,000 USD',
  typicalRange: '$2M – $40M',
  fundingHorizon: 'Multi-year (3–15 years from trigger to ribbon)',
  fundingMix: 'Federation Commons aggregated across instances · matching philanthropy · public-private partnership where appropriate · NEVER conventional municipal bond financing as the primary instrument',
  governance: 'Joint stewardship circle drawn from all corridor instances, plus topic-coded specialists (architects, engineers, public-health authorities). Single-instance custody is forbidden; the work belongs to the federation, not the host city.',
  designLanguage: 'Brutalist concrete primary structure, exposed reinforcement at corners, board-form texture on visible walls, integrated permanent stone seating drawn from the local STONES catalog, no proprietary signage, Schema.org JSON-LD metadata on every plaque.',
  durability: 'Designed for 100-year service life minimum. Maintenance schedule and endowment funded at construction, not deferred to municipal operating budgets.',
  publicness: 'Free or near-free admission. Reservation-required slots permitted for capacity-coded works (bath house, observatory) but pricing must be set by Open Hours practice, not market.',
};

export type GiantWork = {
  id: string;
  title: string;
  tagline: string;
  element: 'earth' | 'water' | 'fire' | 'air' | 'synthesis';
  costBand: string;
  siteCandidates: { city: string; site: string; rationale: string }[];
  inspirations: string[];
  programDescription: string;
  triggerConditions: string[];
  fundingPath: string;
  governance: string;
  horizons: { year: string; milestone: string }[];
  precedentToCases: string;
};

export const GIANT_WORKS: GiantWork[] = [
  {
    id: 'bath-house',
    title: 'The Bath House',
    tagline: 'A public concrete bath house on the corridor — three pools, one cold plunge, one steam room, one quiet room, one kitchen.',
    element: 'water',
    costBand: '$8M – $15M (plus $1.5M endowment)',
    siteCandidates: [
      { city: 'Hermosa Beach', site: 'Pier-adjacent municipal lot at 11th & Hermosa Ave', rationale: 'Walking distance from Pier Plaza; existing utility hookups; under-used municipal parking footprint that could be partially decked over. Politically: the Hermosa Pier is the corridor midpoint, the natural federation site.' },
      { city: 'Manhattan Beach', site: 'North end of 30th Street where Strand meets the dunes', rationale: 'Direct Strand frontage; dune-buffered from prevailing winds; a Gehry-era unbuilt MB civic-pool concept already legitimizes the site type. Politically harder than Hermosa — MB Parks is tightly governed.' },
      { city: 'Redondo Beach', site: 'King Harbor inner basin, north quay', rationale: 'Working-marina context offers a unique water-adjacent civic frame. Saltwater-feed potential for one of the three pools (precedent: Iceland geothermal saltwater pools). Politically: King Harbor redevelopment is in motion; the bath house could be the redevelopment\'s civic anchor.' },
    ],
    inspirations: [
      'Sundlaugin í Hofsósi, Iceland (Studio Granda, 2010) — small-town municipal pool with a horizon-line infinity edge, free entry, year-round use.',
      'Therme Vals, Switzerland (Peter Zumthor, 1996) — though hotel-attached, the spatial vocabulary of stacked stone, low ceilings, subdued light.',
      'Funi-no-yu, Yatsuomote, Japan — village onsen, free for residents, paid token for visitors, run by elderly stewards.',
      'Széchenyi Baths, Budapest — civic-scale operation, 18 indoor and outdoor pools, 100+ year operating history.',
      'The Russian and Turkish Baths, NYC East Village — operating since 1892, demonstrating century-plus durability in the American context.',
    ],
    programDescription: 'Three pools (one warm 38°C, one neutral 33°C, one cool 22°C). One steam room. One cold plunge (≤10°C). One quiet room with no electronics permitted. One small kitchen serving tea, broth, two breads, two soups — rotating from the corridor\'s seasonal Honey League produce. One Marine Layer sit room with a horizon window. Reservation-required two-hour slots with eight slots/day at 12 guests/slot = 96 guests/day capacity. Annual membership with sliding-scale dues; non-member day passes capped at 30/day to preserve quiet.',
    triggerConditions: [
      'Federation council formed (all four instances active).',
      'Aggregate Commons ledger across the four instances exceeds 1,000 give-back receipts.',
      'Philanthropic match commitment of at least $5M secured.',
      'Host city\'s Parks Commission has approved a Memorandum of Understanding granting 99-year lease at $1/year.',
      'Construction-coded local Land identified within the host city.',
    ],
    fundingPath: '~$2M from federation Commons aggregated across instances. ~$5–7M from philanthropic match (the LA28 legacy circle, the California Coastal Conservancy, named-donor lead gift). ~$1–2M from a "100 Founding Bathers" tier ($10K each, lifetime membership, named tile in the steam-room mosaic). ~$1.5M endowment funded at construction from a separate parallel campaign — no municipal operating subsidy.',
    governance: 'Joint stewardship circle: one delegate per active instance + one Bath Master (the building\'s daily operations lead, salaried) + one Water Steward (engineer, on retainer) + two rotating cohort seats elected annually. Hours decisions, pricing decisions, and capacity decisions sit with the stewardship circle, not the host city.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts the Bath House as Tier D Project #1. Site selection begins.' },
      { year: 'Year 1-2', milestone: 'Site secured. Architect competition (3 finalists selected, $50K honorarium each, jury draws from federation + 2 outside critics).' },
      { year: 'Year 3', milestone: 'Construction begins. "100 Founding Bathers" campaign launches.' },
      { year: 'Year 4-5', milestone: 'Construction. Endowment campaign closes.' },
      { year: 'Year 6', milestone: 'Soft open. First 90 days reservation-only for the founding bathers + cohort members.' },
      { year: 'Year 7+', milestone: 'Public open. The first century begins.' },
    ],
    precedentToCases: 'Bell Labs at Murray Hill kept a working canteen and a basement gym because the corporate research thesis was that informal physical spaces produced informal intellectual exchange. The Bath House is the federation\'s explicit version of that thesis: the corridor needs a place where its members are physically together without commerce, screens, or task — for an hour, three times a year. The bath house is to the federation what the canteen was to Bell.',
  },
  {
    id: 'ocean-tower',
    title: 'The Ocean Tower',
    tagline: 'A brutalist concrete observation tower at the corridor midpoint — 70 feet tall, three platforms, no elevator, free entry.',
    element: 'air',
    costBand: '$2.5M – $5M (plus $600K endowment)',
    siteCandidates: [
      { city: 'Hermosa Beach', site: 'Hermosa Greenbelt at 8th Street terminus', rationale: 'Inland-corridor parallel to the Strand; Greenbelt land is already municipally owned; minimal dune disturbance. The 8th Street terminus is the highest natural point in the south Greenbelt.' },
      { city: 'Manhattan Beach', site: 'Sand Dune Park summit', rationale: 'The dune is already 100 ft tall; tower would only need 30-50 ft to clear the surrounding tree canopy. Public-park land. Politically delicate because Sand Dune Park reservations are a contested commons.' },
      { city: 'El Segundo', site: 'Imperial Avenue dunes, north of the Marine Layer Week 3 overlook', rationale: 'LAX adjacent — under-the-flight-path frame becomes the tower\'s defining sensory experience. Parks-department land. Lowest political friction of the three sites.' },
    ],
    inspirations: [
      'Helsingør Harbor, Denmark — Cluster of brutalist observation perches by Spektrum Arkitekter, free entry.',
      'Pen Hadow\'s Lookout, Cornwall — small concrete coastal observation tower used for marine survey, public access.',
      'Nordkapp Hall, Norway (Eva Madshus) — coastal cliff observatory, brutalist concrete, public.',
      'Flatiron Pier (proposed), Brooklyn — never built, but the pier-tower hybrid is a recurring American typology.',
      'Old fire watchtowers in Big Sur — concrete pad, steel ladder, simple platform, century of service.',
    ],
    programDescription: '70-foot brutalist concrete tower with three viewing platforms at 25\', 50\', and 70\'. Open-air; no enclosure. External steel-ladder access between platforms (no elevator — explicit accessibility-equity choice paired with a ground-level vista platform that meets ADA via a ramped berm). Bench seating on each platform drawn from local STONES. Permanent installed analog instruments: a marine-traffic spotting scope, a cardinal-direction compass rose embedded in the top platform floor, a tide-clock, a wind sock. No screens. No power on the upper platforms. Open dawn to dusk.',
    triggerConditions: [
      'At least three of the four corridor instances active.',
      'Aggregate Commons ledger exceeds 500 receipts.',
      'Host-city Parks Commission MOU granting 75-year permit.',
      'Federation council vote with three-of-four instances voting yes.',
    ],
    fundingPath: '~$1M federation Commons. ~$1.5–2.5M philanthropic match (smaller campaign than Bath House). ~$500K from named-platform donations ("the Catalina Platform", "the LAX Platform", "the Equinox Platform" — three platforms, three named donors). $600K endowment.',
    governance: 'Joint stewardship circle: one delegate per active instance + one Tower Steward (volunteer, rotating) + a Wind Reader (volunteer, daily report posted at base). Operating decisions: hours, weather closures, ladder maintenance schedule.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts as Tier D Project #2.' },
      { year: 'Year 1', milestone: 'Site selection. Concept design.' },
      { year: 'Year 2', milestone: 'Construction.' },
      { year: 'Year 3', milestone: 'Open. Inaugural sunset gathering at autumnal equinox.' },
      { year: 'Year 25', milestone: 'First major refurbishment. Endowment funds it.' },
      { year: 'Year 100', milestone: 'Centennial. The tower is older than any current cohort member.' },
    ],
    precedentToCases: 'Polaroid kept a small architectural language (the SX-70, the camera shape, the Cambridge office) — physical objects so distinctive they signaled membership. The Ocean Tower is the corridor\'s SX-70: a small architectural object, repeatedly visited, that signals "you are inside the federation\'s geography." A teenager who climbs it in 2030 and again in 2080 has used the same instrument to take the same measurement of the same horizon.',
  },
  {
    id: 'geothermal-pool',
    title: 'The Geothermal Pool',
    tagline: 'A naturally-heated public pool tapping the LA Basin\'s known geothermal aquifer — outdoor, year-round, free.',
    element: 'earth',
    costBand: '$12M – $25M (plus $2M endowment)',
    siteCandidates: [
      { city: 'Redondo Beach', site: 'AES Redondo decommissioned-power-plant site (subject to redevelopment EIR)', rationale: 'The 51-acre AES site is in active redevelopment planning; existing industrial water infrastructure simplifies the geothermal-tap engineering. Politically: a once-in-fifty-year opportunity to embed civic infrastructure in a major coastal redevelopment.' },
      { city: 'El Segundo', site: 'Hyperion-adjacent municipal land at the southwest sewer-treatment perimeter', rationale: 'Adjacency to existing public-water infrastructure; LA County Sanitation District partnership pre-existing; the smell objection is real but addressable via prevailing-wind site planning.' },
    ],
    inspirations: [
      'Blue Lagoon, Iceland — though now privatized, the original civic-bath thermal-runoff use is the precedent.',
      'Glenwood Hot Springs, Colorado — operating since 1888; civic anchor of a town one-tenth the corridor\'s population.',
      'Ojai Hot Springs (historical, lost 1969 fire) — California precedent, recoverable typology.',
      'Saturnia, Tuscany — free public access at the cascade, paid spa upstream, century-long mixed model.',
    ],
    programDescription: 'Outdoor geothermal pool, capacity 200, 38°C heated by aquifer tap (estimated geothermal gradient at the LA Basin requires drilling 1,200-1,800 ft to reach 50°C source water — feasible, well-documented). One adjacent cold plunge fed by Strand seawater filtered. One open-air shower run. One outdoor changing pavilion. Open year-round, dawn to dusk. Free for corridor cohort members and verifiable corridor residents; $20 day pass for visitors with proceeds endowing operations.',
    triggerConditions: [
      'All four corridor instances active for at least 3 years.',
      'Aggregate Commons ledger exceeds 2,500 receipts.',
      'Geothermal-aquifer feasibility study completed by an independent consultant ($150K, federation-funded).',
      'A redevelopment opportunity (AES site or equivalent) opens.',
      'Host-city council passes a non-binding resolution endorsing the project.',
    ],
    fundingPath: '~$3M federation Commons. ~$8–12M LA County Department of Beaches and Harbors + California Coastal Conservancy match. ~$3–5M from a "1,000 Geothermal Founders" campaign ($5K each, lifetime free entry, named bench tile). ~$2M endowment from a separate parallel campaign. The geothermal-tap drilling cost (~$3M) may be eligible for federal geothermal-research grant funding.',
    governance: 'Joint stewardship circle: federation delegates + a Geothermal Engineer (on retainer, hydrology PhD or equivalent) + a Pool Steward (salaried) + a Resident Council elected from corridor membership. Pricing, hours, and capacity decisions sit with the stewardship circle.',
    horizons: [
      { year: 'Year 0-2', milestone: 'Feasibility study. Aquifer-tap engineering. EIR coordination.' },
      { year: 'Year 3-5', milestone: 'Site selection finalized. Permitting. Drilling.' },
      { year: 'Year 6-8', milestone: 'Construction. Founders campaign.' },
      { year: 'Year 9', milestone: 'Open. Inaugural sit at winter solstice — the corridor\'s first year-round outdoor warm-water civic gathering.' },
      { year: 'Year 25', milestone: 'First aquifer-recharge audit. Annual water-rights renegotiation.' },
      { year: 'Year 50', milestone: 'The pool is older than 90% of its current users.' },
    ],
    precedentToCases: 'Edison\'s Menlo Park ran a power station to demonstrate that electricity could be public infrastructure rather than a private commodity. The Geothermal Pool is the corridor\'s parallel: tapping a public-trust resource (the LA Basin aquifer) for civic, not extractive, use. Both projects assert that a public-good resource can be governed publicly without being municipalized in the conventional sense.',
  },
  {
    id: 'stone-garden',
    title: 'The Stone Garden',
    tagline: 'A walled brutalist plaza housing 30 stones from the catalog on rotating loan from corridor members and museums — open all hours.',
    element: 'earth',
    costBand: '$3M – $6M (plus $400K endowment)',
    siteCandidates: [
      { city: 'El Segundo', site: 'Smoky Hollow industrial-transition lot at Main & El Segundo Blvd', rationale: 'ES has the lowest land cost of the four corridor cities; Smoky Hollow is the explicit industrial-to-mixed-use transition zone; the brutalist program reads consistently with the existing industrial vernacular.' },
      { city: 'Manhattan Beach', site: 'Polliwog Park north meadow', rationale: 'Established botanical-garden infrastructure makes stewardship easier; existing parkland; Polliwog\'s amphitheater can host the inaugural events.' },
      { city: 'Hermosa Beach', site: 'Greenbelt midpoint at Pier Avenue', rationale: 'Direct Greenbelt access; existing pedestrian flow; small footprint fits within the linear corridor.' },
    ],
    inspirations: [
      'Noguchi Garden Museum, Long Island City — small-footprint stone-and-water garden, civic feel despite private origin.',
      'Ryōan-ji rock garden, Kyoto — 15 stones in raked gravel, 500-year operating history, no entry fee for residents in original era.',
      'Donald Judd\'s Marfa, TX — brutalist concrete on the high desert, public-private hybrid, demonstrating long-form stone-and-light installation viability.',
      'Storm King Art Center, NY — large-scale outdoor sculpture park, civic-feeling despite private foundation.',
      'The University of El Segundo Stones Catalog (UES Track 08) — 12 stones cataloged with full provenance, mineral notes, and Nouns pairing.',
    ],
    programDescription: 'A 60ft × 60ft walled brutalist plaza, 12-foot board-form concrete walls on three sides, west-facing open to the marine layer. 30 stone bays embedded in the floor, each bay 4ft × 4ft × 1ft deep. Stones rotate from the corridor STONES catalog (stewarded by corridor members) and from museum loans (LACMA, Natural History Museum, the Petersen, the Lapidary Society). One stone-tending bench per bay. One central long bench drawn from local granite. Permanently installed: a tide clock, a cardinal-direction compass rose, a 30-bay numbering system embedded in the concrete floor. Open 24 hours; no entry fee; no staff; CCTV and acoustic monitoring only.',
    triggerConditions: [
      'Federation Commons ledger exceeds 800 receipts.',
      'STONES catalog has at least 50 cataloged stones available for rotation.',
      'A museum partner (LACMA, NHM, Petersen, or Lapidary Society) commits to a 5-year loan agreement covering at least 5 of the 30 bays.',
      'Host-city Parks or Public Works Commission MOU.',
    ],
    fundingPath: '~$1.5M federation Commons. ~$2–3M from a "30 Stone Sponsors" tier ($75K each, naming rights for one bay for 25 years, transferable). ~$500K named lead gift. ~$400K endowment.',
    governance: 'Joint stewardship circle: federation delegates + a Stone Master (geologist or sculptor, salaried part-time) + a Loan Coordinator (volunteer, manages museum and member loans) + the corridor\'s STONES catalog editor (rotating). Loan-rotation decisions, bay-rotation cadence, and seasonal programming sit with the stewardship circle.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts as Tier D Project #4.' },
      { year: 'Year 1-2', milestone: 'Site selection. Architect competition.' },
      { year: 'Year 3', milestone: 'Construction. STONES catalog expansion campaign.' },
      { year: 'Year 4', milestone: 'Open. Inaugural stones placed.' },
      { year: 'Year 4+', milestone: 'Stones rotate seasonally; the garden is never the same garden twice.' },
      { year: 'Year 100', milestone: 'The walls have weathered into the corridor\'s stone vocabulary themselves.' },
    ],
    precedentToCases: 'Xerox PARC kept a hardware library — physical objects, available to handle, on rotation between the labs and storage. The Stone Garden is the corridor\'s civic-scale version: physical objects from the deep-time geology and human-craft heritage of the radius, available to handle, on rotation between the catalog stewards and the public bays.',
  },
  {
    id: 'fire-pavilion',
    title: 'The Fire Pavilion',
    tagline: 'A year-round outdoor public hearth, fire-tended by rotating stewards — the corridor\'s permanent campfire.',
    element: 'fire',
    costBand: '$1.2M – $2.5M (plus $250K endowment)',
    siteCandidates: [
      { city: 'Manhattan Beach', site: 'Polliwog Park amphitheater west berm', rationale: 'Existing amphitheater handles overflow gatherings; berm provides wind shelter; parkland allows fire permits.' },
      { city: 'El Segundo', site: 'Recreation Park north side, adjacent to Honey League courts', rationale: 'Co-locates with existing voluntary-association density; parks-department land; ES Fire Department is favorable to permitted permanent-hearth proposals.' },
      { city: 'Hermosa Beach', site: 'South Park / Clark Stadium north corner', rationale: 'High-elevation site for visibility; existing utility hookups; smaller footprint fits the city\'s geography.' },
    ],
    inspirations: [
      'Aalto\'s Säynätsalo Town Hall fireplace, Finland — civic hearth at the literal center of the building.',
      'The Vatnsmýri Burner, Reykjavík — outdoor public fire bowl, year-round.',
      'Council fires of Pacific Northwest indigenous peoples — millennia of practice, perpetual flame as civic continuity.',
      'Highgate Cemetery\'s perpetual flame, London — 175-year operating history.',
      'Kiln Court, Berkeley CA — small outdoor wood-fired kiln serving as informal civic gathering hearth.',
    ],
    programDescription: 'Open-air pavilion, brutalist concrete columns supporting a copper-roofed canopy 18ft × 18ft. Central stone hearth, 5ft diameter, fire-bricked. Fire is tended dawn-to-dusk year round by a rotating Fire Steward (volunteer, 2-hour shifts, signup via the Commons schedule). At dusk the fire is banked; at dawn the steward re-lights from coals or kindling. Permanent stone benches on three sides drawn from local granite. Wood storage rack on the north wall stocked from corridor cohort cuttings, sustainable-yield cull from public-easement trees, and pruning donations. Smoke management via passive draft + air-quality monitoring; closure protocol on red-flag warning days. No power. No screens. One simple hand pump for water.',
    triggerConditions: [
      'Federation council formed.',
      'Aggregate Commons ledger exceeds 400 receipts.',
      'Local Fire Marshal of host city issues conditional permit.',
      'Air-quality offset commitment: the federation funds a parallel particulate-air-quality monitoring station within 1/4 mile.',
    ],
    fundingPath: '~$500K federation Commons. ~$700K–$1.5M philanthropic match (smaller campaign than Bath House). ~$200K from a "100 Fire Sponsors" tier ($2K each, named brick in the hearth). $250K endowment.',
    governance: 'Joint stewardship circle: federation delegates + a Hearth Master (volunteer, monthly rotation) + a Wood Steward (volunteer, manages wood-supply chain) + a Fire Marshal liaison (the host-city FD designee, consultative). Fire-status decisions sit with the Hearth Master under FD red-flag protocol.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts. Fire Marshal conversation begins.' },
      { year: 'Year 1', milestone: 'Permitting. Site selection.' },
      { year: 'Year 2', milestone: 'Construction. Hearth Steward training program launches.' },
      { year: 'Year 3', milestone: 'First flame lit at the autumnal equinox.' },
      { year: 'Year 5+', milestone: 'The fire has been continuously tended for 1,800+ days.' },
      { year: 'Year 50', milestone: 'The flame has not gone out except by Fire Marshal closure. The Hearth Stewards across the half-century total approximately 1,200 individuals.' },
    ],
    precedentToCases: 'Bell Labs had a flame on its main lab bench (the Pressure Test Lab) that ran continuously for 47 years as a calibration reference. The Fire Pavilion is the federation\'s civic flame: not for calibration, but for continuity. The flame survives any single steward, any single instance, any single decade. It outlasts.',
  },
  {
    id: 'wind-garden',
    title: 'The Wind Garden',
    tagline: 'A coastal kinetic-sculpture park exploiting the corridor\'s prevailing onshore winds — 12 instruments, all moving.',
    element: 'air',
    costBand: '$2M – $4M (plus $400K endowment)',
    siteCandidates: [
      { city: 'El Segundo', site: 'El Porto sand south of Grand Ave beach lot', rationale: 'Maximum wind exposure of the four cities; LAX 25R landing path adds aircraft-induced wind interaction; existing dunes anchor the structures.' },
      { city: 'Manhattan Beach', site: 'Sand Dune Park summit + adjacent bowl', rationale: 'Topography channels wind; existing parkland; integrates with the existing dune-climb practice.' },
      { city: 'Redondo Beach', site: 'Esplanade bluff between Knob Hill and Avenue I', rationale: 'Bluff-edge wind acceleration; existing pedestrian flow; the Esplanade\'s 80ft elevation offers signature sightlines.' },
    ],
    inspirations: [
      'Anthony Howe kinetic sculptures (Easton Lighthouse, the 2016 Olympic cauldron) — engineering precedent for wind-driven civic-scale instruments.',
      'Ned Kahn\'s wind walls (San Francisco Exploratorium, the Brisbane GoMA) — wind-driven aluminum-disc kinetic facades, public, durable.',
      'The Singing Ringing Tree, Lancashire — concrete-and-galvanized-steel pipe instrument played by the wind, public.',
      'Goldsworthy installations along the coast — though typically ephemeral, the placement methodology informs siting.',
      'Theo Jansen\'s Strandbeests, NL — wind-walking sculptures; periodic public-walk events as civic practice.',
    ],
    programDescription: '12 kinetic instruments arrayed across a 200ft × 80ft sand-dune site. Each instrument sized 8-25 ft tall, wind-driven, no electricity. Mix of: rotating disc walls (Kahn-derived), passive-resonance pipe organs (Singing Ringing Tree-derived), kinetic mobiles (Howe-derived), and one wind-walking installation (Jansen-derived) restored periodically. Permanent stone seating drawn from the local STONES catalog. Open 24 hours; no entry fee. Audio recording station (analog) at the south edge captures the garden\'s ambient sound, archived monthly to the federation library.',
    triggerConditions: [
      'Federation Commons ledger exceeds 600 receipts.',
      'Coastal Commission permit secured (the principal regulatory hurdle).',
      'Wind-load engineering study completed ($100K, federation-funded).',
      'At least 3 of 12 instrument sponsors committed.',
    ],
    fundingPath: '~$800K federation Commons. ~$1.5–2.5M from "12 Instrument Sponsors" tier ($150K-200K each, named instrument for 25 years). ~$300K-500K named lead gift. ~$400K endowment.',
    governance: 'Joint stewardship circle: federation delegates + a Wind Curator (artist or engineer, on retainer) + an Acoustic Steward (audio archivist, volunteer) + the Coastal Commission liaison (consultative). Decisions: maintenance schedule, instrument retirement and replacement cycle (10-15 year turnover assumed).',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts. Coastal Commission outreach begins.' },
      { year: 'Year 1-2', milestone: 'Engineering study. Permitting. Artist commissioning.' },
      { year: 'Year 3', milestone: 'Installation phase 1: 6 instruments.' },
      { year: 'Year 4', milestone: 'Phase 2 complete: 12 instruments. Open at vernal equinox.' },
      { year: 'Year 15', milestone: 'First instrument retirement / replacement cycle.' },
      { year: 'Year 50', milestone: 'The audio archive contains 50 years of corridor wind, indexed by date and weather.' },
    ],
    precedentToCases: 'Polaroid\'s instant-photography invention proved that scientific imaging could be civic infrastructure (you carried it, you used it daily). The Wind Garden is the corridor\'s civic-scale version: scientific instruments — wind-load, acoustic, kinetic — that anyone can use without operator training, integrated into a free public space.',
  },
  {
    id: 'tide-pool',
    title: 'The Tide-Pool Restoration',
    tagline: 'An engineered intertidal restoration zone reviving the corridor\'s pre-1900 tide-pool ecosystem — 0.5 mi of restored shoreline.',
    element: 'water',
    costBand: '$15M – $30M (plus $3M endowment)',
    siteCandidates: [
      { city: 'Redondo Beach', site: 'South Esplanade rocks below Vista Drive overlook', rationale: 'Rockier substrate than MB or HB favors tide-pool ecosystem rebuild; lowest-traffic Strand segment of the four cities; coastal-bluff context provides natural enclosure.' },
      { city: 'Hermosa Beach', site: 'South-of-Pier rocky outcrop at 14th-21st Streets', rationale: 'Existing partial rock substrate; corridor-midpoint visibility for educational programming.' },
      { city: 'Multi-City', site: 'A federated four-instance project with one quarter-mile section per city', rationale: 'Best ecological outcome (gene-flow continuity along the restored corridor) but most complex permitting and most ambitious scope.' },
    ],
    inspirations: [
      'Reef Check California — citizen-science marine-protected-area monitoring, 25 years of corridor-relevant practice.',
      'Crystal Cove Conservancy, Newport Beach — public-private partnership restoring tide-pool ecology with educational programming.',
      'The Marine Mammal Center, Sausalito — small-footprint scientific civic infrastructure.',
      'San Francisco Bay Institute restoration projects — engineering-backed marsh and tide-pool restoration at scale.',
      'Heal the Bay — 30 years of South Bay coastal-ecology advocacy and educational programming.',
    ],
    programDescription: 'A 0.5-mile restored intertidal zone (or 4 × 0.125-mile if multi-city). Substrate engineering: imported native rock matching the South Bay\'s pre-1900 sandstone-and-granite pre-development geology. Ecosystem reseeding: native sea stars, anemones, surfgrass, mussels, hermit crabs — partnering with USC Wrigley Institute and the Cabrillo Aquarium for sourcing. Two permanent observation platforms at low-tide ramp-down points. Three weekly Marine Layer-coded "Tide Sit" programs at the spring tides. Permanent QR-code-free interpretive plaques drawn from the corridor\'s GLOSSARY. Open all hours, free entry; tide-window-coded — observation accessible 4-6 hours per day depending on the tide cycle.',
    triggerConditions: [
      'All four corridor instances active for at least 5 years.',
      'Aggregate Commons ledger exceeds 5,000 receipts.',
      'California Coastal Commission and California Department of Fish & Wildlife joint permit.',
      'Wrigley / Cabrillo / NHM scientific partnership formalized.',
      'A 50-year stewardship endowment is fully funded BEFORE construction begins (this is the only Tier D project where endowment-first is non-negotiable).',
    ],
    fundingPath: '~$3M federation Commons. ~$10–15M California Coastal Conservancy + NOAA grant funding. ~$2–4M from a "Tide-Pool Founders" tier ($25K each, lifetime educational-programming access, no naming rights — the rocks belong to the rocks). $3M endowment, raised first.',
    governance: 'Joint stewardship circle: federation delegates + a Marine Biologist (PhD, on retainer) + a Restoration Coordinator (salaried) + a Tide Steward Council elected from corridor cohort members + Coastal Commission and CDFW liaisons. Ecological decisions sit with the Marine Biologist; programming and access decisions sit with the stewardship circle.',
    horizons: [
      { year: 'Year 0-3', milestone: 'Endowment campaign. Permitting. Scientific partnership formalization.' },
      { year: 'Year 4-5', milestone: 'Site preparation. Substrate engineering.' },
      { year: 'Year 6-7', milestone: 'Ecosystem seeding. Initial monitoring.' },
      { year: 'Year 8', milestone: 'Public open. First Tide Sit at spring tide.' },
      { year: 'Year 15', milestone: 'First reef-fish recolonization measurable.' },
      { year: 'Year 50', milestone: 'The restoration is the corridor\'s longest-cycle living instrument.' },
    ],
    precedentToCases: 'Bell Labs\' transistor research project ran for 23 years before the integrated-circuit applications became civic. The tide-pool restoration is the corridor\'s longest-cycle infrastructure: most projects on this list pay back civically within a decade; the tide pool pays back over fifty years. The federation must commit to projects that outlast its founding generation, or the federation is short-term.',
  },
  {
    id: 'observatory',
    title: 'The Dark-Sky Observatory',
    tagline: 'A small public observatory and dark-sky park — fighting LAX glow with an 18-inch telescope, a planisphere wall, and one hour of true dark per month.',
    element: 'synthesis',
    costBand: '$4M – $7M (plus $700K endowment)',
    siteCandidates: [
      { city: 'Hermosa Beach', site: 'Greenbelt midpoint, sky-east-facing', rationale: 'East-facing protects against direct ocean-side LAX glow; Greenbelt land already municipally owned; corridor-midpoint accessibility.' },
      { city: 'Manhattan Beach', site: 'Polliwog Park north meadow', rationale: 'Polliwog\'s tree canopy provides partial sky shielding; existing parkland; co-locates with proposed Stone Garden.' },
      { city: 'Inland', site: 'Joint federation site at Kenneth Hahn State Recreation Area or Palos Verdes', rationale: 'True dark-sky conditions only achievable inland or at higher elevation; outside the four-city corridor strict scope; federation extension geography.' },
    ],
    inspirations: [
      'Mt. Wilson Observatory — historical Pasadena astronomy infrastructure, public access, 100+ year operating history.',
      'Griffith Observatory — civic-scale operating model for free public astronomy in an urban-glow environment.',
      'Australian Astronomy DARKSKY parks — dark-sky-defended civic infrastructure precedent.',
      'Sky\'s the Limit Observatory, Twentynine Palms — small-footprint public observatory model.',
      'The University of El Segundo Marine Layer track Week 5 (Flight-Path Sit) — the existing practice of using LAX flight density as the corridor\'s sky-bell.',
    ],
    programDescription: 'A small concrete-and-steel observatory housing one 18-inch reflecting telescope, one outdoor planisphere wall (engraved local-sky map updated monthly), one analog star chart in the entry plaza, one quiet sky-watching room with no electronics permitted. Once-monthly "Dark Hour" — a coordinated lights-out period (1am-2am, new moon dates) negotiated with the host city and adjacent property owners to achieve transient dark-sky conditions despite LAX glow. Public viewing nights at new moon and meteor showers. Open dawn-to-dusk for the planisphere; observatory by reservation Friday-Sunday evenings.',
    triggerConditions: [
      'Federation Commons ledger exceeds 1,500 receipts.',
      'Host-city Lighting Code amendment approved (the principal regulatory hurdle — "Dark Hour" requires negotiated lighting reduction).',
      'Telescope partnership with a research institution (Mt. Wilson, Caltech, USC, UCLA) for instrument loan or co-funding.',
      'Astronomer-in-Residence committed as primary public-program lead.',
    ],
    fundingPath: '~$1M federation Commons. ~$2–3M philanthropic match (named lead gift; the Carnegie / Hearst / Annenberg circle is targetable). ~$1M from a "100 Sky Watchers" tier ($10K each, lifetime reservation priority). ~$1M instrument grant from research-institution partner. $700K endowment.',
    governance: 'Joint stewardship circle: federation delegates + an Astronomer-in-Residence (salaried, rotating 3-year appointment) + an Optics Steward (volunteer, manages telescope maintenance) + a Sky-Council elected from corridor cohort. Programming decisions, reservation-system management, and Dark Hour coordination sit with the stewardship circle.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts. Lighting Code amendment campaign begins.' },
      { year: 'Year 1-2', milestone: 'Lighting Code negotiated. Site selection. Architect competition.' },
      { year: 'Year 3-4', milestone: 'Construction. Telescope installation.' },
      { year: 'Year 5', milestone: 'Open. First Dark Hour at the autumnal new moon.' },
      { year: 'Year 5+', milestone: 'Monthly Dark Hour as ongoing civic-coordination practice.' },
      { year: 'Year 30', milestone: 'The Dark Hour has accumulated 360 hours of coordinated coastal-LA dark-sky data, the longest such record in southern California.' },
    ],
    precedentToCases: 'Xerox PARC built the Alto computer at a workstation cost no individual could afford, then put it in user offices and watched what happened. The Observatory is the corridor\'s parallel: an 18-inch telescope is unaffordable individually but free at the federation; a coordinated Dark Hour is impossible individually but achievable at the federation; the synthesis-element observatory is the federation demonstrating that civic coordination produces sky access no commercial product matches.',
  },
];

export const FUNDING_PRINCIPLES = [
  'Endowment first, where the project is irreversible. The Tide Pool restoration is the canonical case: ecosystems take 8 years to seed and 50 to mature; the federation commits to the maintenance horizon before it commits to the build.',
  'Federation Commons aggregated, never extracted. Each instance contributes to giant-works funding from its own ledger; no instance is taxed or assessed; participation is voluntary at every step. An instance can decline a giant work without sanction.',
  'Philanthropic match where it accelerates without warping. Lead gifts are welcome; naming rights for 25-year terms (transferable, retiring at term end). No permanent naming. The Stone Garden\'s "30 Stone Sponsors" model shows the right scale of donor recognition: meaningful, finite, retirable.',
  'No municipal bond financing as the primary instrument. Bond financing pushes operating costs into perpetual debt service, which generates pressure to commercialize free public spaces. The federation\'s posture: bonds for operating utilities, not for civic instruments.',
  'Public-private partnership only where the public retains operational decisions. The Geothermal Pool may be co-funded with the AES site redeveloper; the redeveloper does not get to set hours, prices, or capacity. If those are negotiable, the partnership is wrong.',
];

export const SCALING_PRINCIPLES = [
  'One Tier D project at a time. The federation cannot run more than one giant-works construction concurrently without overstretching its volunteer steward base. Sequential, not parallel.',
  'A giant work pulls forward the framework. Each Tier D project funded triggers cohort growth across all four instances — concrete shared work attracts new local Lands faster than abstract framework documents.',
  'A giant work that fails to attract a Steward Council is a giant work that should not be built. The architecture and the engineering matter less than the ongoing volunteer leadership. If the Bath House cannot find a Bath Master, the Bath House should not break ground.',
  'A giant work outlasts its host city if it must. The Bath House remains a federation work even if Hermosa Beach is annexed by Manhattan in 2080 (geopolitically speculative; structurally must be planned for). The work belongs to the federation.',
  'Every giant work funds its successor. 5% of every Tier D project\'s capital campaign over its trigger threshold flows to the Federation Future Works Fund — seed capital for the next giant work.',
];

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'pointcast-common-forms', cite: 'University of El Segundo. (2026). *Common Forms · Civic Architecture Plan*. https://pointcast.xyz/common-forms' },
  { id: 'pointcast-stones', cite: 'University of El Segundo. (2026). *Stones Catalog*. https://pointcast.xyz/stones' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer' },
  { id: 'pointcast-fire', cite: 'University of El Segundo. (2026). *Fire*. UES Track 11. https://pointcast.xyz/fire' },
  { id: 'pointcast-geology', cite: 'University of El Segundo. (2026). *Geology*. UES Track 08. https://pointcast.xyz/geology' },
  { id: 'pointcast-ocean-wing', cite: 'University of El Segundo. (2026). *Ocean Wing*. UES Track 09. https://pointcast.xyz/ocean-wing' },
  { id: 'zumthor-vals', cite: 'Zumthor, P. (1996). *Therme Vals*. Architectural documentation, multiple sources.' },
  { id: 'studio-granda-iceland', cite: 'Studio Granda. (2010). *Sundlaugin í Hofsósi*. Project documentation, hofsos.is.' },
  { id: 'noguchi', cite: 'Noguchi Museum. (Continuing). *The Isamu Noguchi Garden Museum*. noguchi.org.' },
  { id: 'aalto-saynatsalo', cite: 'Aalto, A. (1952). *Säynätsalo Town Hall*. Architectural documentation, multiple sources.' },
  { id: 'kahn-wind', cite: 'Kahn, N. (Continuing). *Kinetic Public Wind Walls*. nedkahn.com.' },
  { id: 'mt-wilson', cite: 'Mt. Wilson Observatory. (Continuing). *Public Programs and Astronomy Operations*. mtwilson.edu.' },
  { id: 'crystal-cove', cite: 'Crystal Cove Conservancy. (Continuing). *Tide-Pool Educational Programs*. crystalcove.org.' },
  { id: 'la28-legacy', cite: 'LA28 Olympic Organizing Committee. (Continuing). *Legacy Projects Framework*. la28.org.' },
];

export const GW_NOTES = {
  uesNote: 'Giant Works is a prospective catalog, not a build schedule. Eight projects specified to give the federation council a working build queue when it forms. Of the eight, the Bath House and the Stone Garden are the lowest-cost-of-failure first projects; the Tide Pool restoration is the highest-leverage but longest-horizon. None are committed. All are ready to commit.',
  invitation: 'If you are an architect, engineer, philanthropist, public-health authority, marine biologist, astronomer, kinetic-sculpture artist, or a corridor cohort member who wants to help the federation council prioritize this catalog, email mh@pointcast.xyz with subject line "Giant Works · {project-id}". The catalog will move from prospective to active when at least three of the four corridor instances vote yes on a specific project AND a primary steward commits.',
};
