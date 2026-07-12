/**
 * Bath House Working Paper — UES-WP-2026-14.
 *
 * The first per-Tier-D-work deep dive. /giant-works specified the Bath
 * House at $8-15M with three site candidates, five inspirations, a
 * 7-year horizon, and a parallel-to-Bell-Labs analysis. This paper
 * turns that specification into a fundraising-ready Working Paper:
 * full architectural program, structural-acoustic prose, mechanical
 * systems plan, fundraising calendar with named foundation targets,
 * parks-department MOU template, Bath Master role spec, and the
 * 100 Founding Bathers campaign launch document.
 *
 * The Bath House is also the federation's first LA28-aligned Tier D
 * work (per /la28-ready). This paper assumes LA28 partnership and
 * builds the timeline around the 2028 Q2 soft-opening target.
 */

export const PAPER_META = {
  title: 'The Bath House',
  subtitle: 'Architectural program, fundraising calendar, and operating manual for the federation\'s first Tier D civic instrument · UES Working Paper 2026-14',
  thesis: 'A small public bath house — three pools, one cold plunge, one steam room, one quiet room, one kitchen — built from board-form concrete and Norwegian fjord granite, sited at the corridor midpoint, free for corridor cohort members and sliding-scale-priced for visitors, governed by a joint stewardship circle drawn from the federation\'s active instances. Inspired by Sundlaugin í Hofsósi, Therme Vals, Funi-no-yu, Széchenyi, and the Russian and Turkish Baths NYC. Built to a 100-year service life. Funded by federation Commons aggregation + LA28 Legacy Foundation match + a 100 Founding Bathers tier + a parallel endowment campaign. The Bath House is what the canteen was to Bell Labs: physical infrastructure where informal civic exchange happens, free of commerce, free of screens, free of task. This paper makes it ready to break ground.',
  paperNumber: 'UES-WP-2026-14',
  date: '2026-05-07',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['bath house', 'civic infrastructure', 'Tier D', 'University of El Segundo', 'Hermosa Beach', 'LA28 legacy', 'parallel civic federation', 'public bathing'],
  parentPaper: 'UES-Federation-02 Giant Works',
  relatedSurfaces: ['UES-Federation-05 Federation Council Charter', 'UES-WP-2026-13 LA28 Forcing Function', 'UES-Federation-01 Strand Corridor'],
};

export const PROGRAM = {
  totalArea: '14,500 sq ft (interior)',
  occupancyMax: '96 guests at peak (eight 12-guest reservation slots/day)',
  operatingHours: 'Tuesday-Sunday, 06:00-22:00. Closed Mondays for deep maintenance.',
  spaces: [
    { name: 'Warm Pool', area: '900 sq ft', temp: '38°C', capacity: '24 guests', notes: 'Primary social pool. Stepped depth from 0.6m at entry to 1.4m at deep end. Skylight directly overhead; the warm pool tracks the sun.' },
    { name: 'Neutral Pool', area: '1,200 sq ft', temp: '33°C', capacity: '32 guests', notes: 'The lap-and-soak pool. Three lap lanes 25m × 1.2m wide on the west wall; open soaking on the east. Skylight series along the long axis.' },
    { name: 'Cool Pool', area: '600 sq ft', temp: '22°C', capacity: '16 guests', notes: 'The quiet pool. Single depth 1.2m. North-wall skylight for indirect light. The corridor\'s default for post-steam recovery.' },
    { name: 'Cold Plunge', area: '160 sq ft', temp: '≤10°C', capacity: '4 guests', notes: 'Single basin, 1.5m deep. Adjacent to steam room for the heat-cold cycle. Reservation-required only if usage data warrants; default is first-come.' },
    { name: 'Steam Room', area: '300 sq ft', temp: '45°C / 95% RH', capacity: '12 guests', notes: 'Full-tile interior; cedar-bench seating; integrated eucalyptus diffuser. Three 30-minute cycles per hour with 15-minute rest periods.' },
    { name: 'Quiet Room', area: '450 sq ft', temp: 'ambient (22°C)', capacity: '14 guests', notes: 'No electronics permitted. No conversation above whisper. Single horizon window facing west toward the Strand. Reading light only — no overhead. The Marine Layer sit room of the Bath House.' },
    { name: 'Kitchen + Tea Room', area: '650 sq ft', temp: 'ambient', capacity: '20 guests', notes: 'Small kitchen serving tea, broth, two breads, two soups — rotating from corridor seasonal Honey League produce. Open during all bath hours; soup bowls are clay, washed by guests.' },
    { name: 'Changing + Showers (men/women/family)', area: '2,800 sq ft total', temp: 'ambient', capacity: 'flow-through', notes: 'Three changing rooms with rinse showers. Lockers for cohort members (key-coded), day lockers for visitors. Family room is mixed-gender, accessible, with one shower stall.' },
    { name: 'Mechanical + Filtration', area: '2,200 sq ft', temp: 'n/a', capacity: 'staff-only', notes: 'Below-grade. Pool filtration (sand + UV), heating (heat-pump primary, electric-resistance backup), water-treatment, ventilation. Designed for 24/7 unattended operation with daily Bath Master inspection.' },
    { name: 'Front Desk + Waiting + Reception', area: '900 sq ft', temp: 'ambient', capacity: '16 guests', notes: 'Lobby plaza with one Bath Master desk, reservation kiosk (online + walk-up), small bench seating, single cohort-member self-checkin terminal. The room is the corridor\'s first impression.' },
  ],
  totalProgrammedArea: '14,200 sq ft (with 300 sq ft circulation buffer)',
};

export const STRUCTURE_AND_MATERIAL = {
  primaryStructure: 'Cast-in-place reinforced concrete, board-form texture on all visible interior walls (Douglas fir formwork, 1×8 horizontal). Exterior walls: same board-form, weathered to a soft gray over the first decade. Roof: post-tensioned concrete deck with integrated skylights at programmed locations.',
  primaryStone: 'Norwegian fjord granite for pool coping, deck slabs, and bench seating. Cool to the touch even in the warm pool environment; minimal water absorption; 200+ year weathering precedent (Norwegian harbor infrastructure). Sourced via the corridor STONES catalog\'s international-stone partnership.',
  secondaryStone: 'Tehachapi quartzite (California-sourced, 90-mile transport) for the cold plunge basin and the steam-room benches. The two-stone vocabulary is intentional: the federation\'s civic instruments speak in materials sourced both locally and internationally, signaling that the corridor is part of a wider civilization, not an isolated province.',
  woods: 'Cedar (USDA-certified, Pacific Northwest sourced) for steam-room benches and dressing-room seating. Douglas fir for board-form. No tropical hardwoods.',
  metals: 'Stainless steel 316L for pool ladders, plumbing fixtures, and exposed structural connections. Patina-allowed bronze for door hardware (the bronze ages the way the concrete weathers; the building is one organism).',
  glazing: 'Triple-pane low-e for the skylights and the horizon window in the quiet room. Frosted (acid-etched) for changing-room windows. No clear glass at street-facing elevations — the privacy of bath culture is non-negotiable.',
  acousticTreatment: 'Acoustic stone diffusers (Norwegian fjord granite slabs, hand-tooled) on the pool-room ceilings. Voice carries; impact noise (footfall, splash) is absorbed. The federation prefers the soundscape of a bath house to feel like a slow conversation, not a swim meet.',
};

export const MECHANICAL_SYSTEMS = {
  heating: 'Air-source heat pump primary (COP 3.2 at 38°C output, sized for peak load). Electric-resistance backup for cold-snap days. Pool heating runs 24/7 with night setback to 31°C neutral pool only.',
  filtration: 'Sand filtration primary (12 sq ft media area total across three pool circuits). UV-C secondary disinfection (12 mJ/cm² minimum dose). Chlorine residual maintained at 0.5 ppm — the federation\'s health-department compliance floor. NO ozone — the off-gassing risk is not worth the marginal water-clarity gain.',
  waterMakeup: 'Municipal connection primary; rainwater capture from roof (8,000 sq ft catchment, 5,000-gal cistern) provides ~40% of annual makeup water. Greywater from changing-room showers is treated and feeds toilet flushing only.',
  ventilation: 'ERV (Energy Recovery Ventilator) primary, 4 air-changes/hour during peak occupancy. Steam room has dedicated exhaust through chemically-resistant ducting. The pool rooms are kept at +0.05 inWG positive pressure to push moisture-laden air toward the exhaust path, away from changing rooms.',
  electrical: '480V 3-phase service, 600A. PV array 50 kW on roof (covers approximately 35% of annual electrical load, batteries store evening-occupancy peak). Backup generator (natural gas, 100 kW) for 72-hour operation at quiet-pool only during outage.',
  plumbing: 'Pool plumbing: schedule 80 PVC primary, copper at high-temperature locations. Domestic plumbing: PEX-A for hot/cold supply, cast iron for sanitary. The federation prefers materials that can be repaired by the Water Steward with off-the-shelf parts, not specialized service contracts.',
};

export const ACOUSTIC_DESIGN = {
  philosophy: 'A bath house is a slow space. Footfall echoes; conversations are paced; silence is part of the program. The acoustic design targets a soft reverberation profile — RT60 of approximately 1.2 seconds in the pool rooms (longer than swim-meet pools, shorter than cathedrals), 0.6 seconds in the quiet room, and 0.4 seconds in the steam room.',
  treatment: 'Hand-tooled Norwegian fjord granite slab diffusers on the pool-room ceilings, set in a non-repeating pattern based on Quadratic Residue Diffuser geometry. Cedar bench seating in the steam room provides the only soft absorption; otherwise the room is hard surfaces tuned acoustically. The quiet room is a Helmholtz chamber tuned to 250 Hz — speech-frequency suppression — with no electronic acoustic treatment.',
  isolation: 'Pool rooms isolated from changing rooms via mass-loaded vinyl in the wall assembly + hollow-core concrete block on the changing-room side. Mechanical-room isolation: the building\'s most-isolated assembly. Heat-pump compressor noise must not exceed 35 dB(A) at the front desk. The Bath Master\'s primary acoustic complaint historically has been mechanical, not occupant.',
};

export const FUNDING_CALENDAR = {
  total: '$11,500,000 capital + $1,500,000 endowment = $13,000,000',
  sourceMix: [
    { source: 'Federation Commons aggregated across instances', amount: '$2,200,000', timing: '2026 Q4 — 2027 Q4', notes: 'Each instance commits voluntarily; estimated split: ES $400K, MB $700K, HB $400K, RB $400K, Torrance $300K based on instance-population proportional capacity.' },
    { source: 'LA28 Legacy Foundation', amount: '$3,500,000', timing: '2026 Q3 RFP open → 2027 Q2 award', notes: 'LA28 partnership confirmed per /la28-ready — STRONG alignment band. Olympic-cultural-bath precedent (Beijing, Tokyo).' },
    { source: 'Annenberg Foundation', amount: '$2,500,000', timing: '2026 Q4 letter of intent → 2027 Q3 award', notes: 'Annenberg has signaled LA28-cultural priority through 2027. Bath House fits the civic-gathering-infrastructure category.' },
    { source: 'Hewlett Foundation', amount: '$1,500,000', timing: '2027 Q1 LOI → 2027 Q4 award', notes: 'Hewlett Olympic-Coordination Initiative active 2026-2029. Federation-governance angle is the lead.' },
    { source: '100 Founding Bathers tier', amount: '$1,000,000', timing: '2027 Q2 → 2028 Q1 (rolling)', notes: '100 individuals × $10,000 each. Lifetime priority reservation + named tile in the steam-room mosaic. Transferable.' },
    { source: 'Named Lead Donor (Bath House Sponsor)', amount: '$800,000', timing: '2026 Q4 (locked early)', notes: 'A single lead donor provides early momentum. Founding plaque in the entry plaza. Priority on the architect-selection jury.' },
    { source: 'Endowment campaign (parallel)', amount: '$1,500,000', timing: '2026 Q3 → 2028 Q1', notes: 'Funded SEPARATELY from capital; endowment must be fully funded before soft opening. 4% annual draw covers Bath Master salary + Water Steward retainer + utility cost overruns.' },
  ],
  stretchTargets: [
    { item: 'Mellon Foundation', amount: '$500,000', notes: 'Public-humanities partnership — possible if the Bath House programming includes a Cultural Olympiad poetry-reading or essay residency series during the Games.' },
    { item: 'California Coastal Conservancy', amount: '$500,000', notes: 'Coastal-access-infrastructure partnership — possible if the Strand-adjacent Hermosa site is selected and the building includes public Strand-frontage shower stations.' },
  ],
};

export const FUNDING_TIMELINE = [
  { quarter: '2026 Q3', milestone: 'LA28 Legacy Foundation RFP cycles open. Federation Council Charter ratified by 3-of-5 instances (prerequisite). LOIs to LA28, Annenberg, Hewlett.' },
  { quarter: '2026 Q4', milestone: 'Site selection LOCKED (Hermosa pier-adjacent municipal lot at 11th & Hermosa Ave is the recommended site). Lead Bath House Sponsor commitment closed. Architect competition launched (3 finalists, $50K honorarium each).' },
  { quarter: '2027 Q1', milestone: 'Architect selected. Design development begins. CCC permit application filed. Federation Commons aggregation campaign launched (instance-by-instance commitments).' },
  { quarter: '2027 Q2', milestone: 'LA28 Legacy Foundation award. Annenberg LOI converts to award. 100 Founding Bathers campaign launches.' },
  { quarter: '2027 Q3', milestone: 'Construction documents complete. Permit issued. Construction begins. Hewlett LOI award.' },
  { quarter: '2027 Q4', milestone: 'Foundation + slab + below-grade mechanical complete. Federation Commons aggregation reaches 75%.' },
  { quarter: '2028 Q1', milestone: 'Walls + roof structure complete. Endowment campaign closes (target reached). 100 Founding Bathers campaign closes.' },
  { quarter: '2028 Q2', milestone: 'Interior + mechanical commissioning. Bath Master + Water Steward hired. Soft-opening reservation system launches for Founding Bathers.' },
  { quarter: '2028 Q3 (Games)', milestone: 'Public soft opening 2028-07-10, four days before LA28 opening ceremonies. LA28-affiliated programming runs through Games.' },
  { quarter: '2028 Q4', milestone: 'Full public open Tuesday-Sunday. Federation Council Year-One Audit at autumnal-equinox meeting.' },
];

export const PARKS_DEPT_MOU = {
  tenor: 'A 99-year ground lease at $1/year, with reversion clauses. The federation does not own the land; the city remains the landlord. The federation owns the structure and operates the program.',
  keyTerms: [
    'Term: 99 years from soft-opening date.',
    'Rent: $1/year, with periodic CPI adjustments capped at +0.5% annually.',
    'Reversion conditions: (a) building unoccupied or unmaintained for 24+ months; (b) Bath Master role unfilled for 12+ months; (c) federation council formally dissolves; (d) host city declares the use inconsistent with general plan after public hearing process.',
    'Operational independence: the federation sets hours, pricing, programming, and staffing without city pre-approval, except for health-code compliance (LA County DPH).',
    'Maintenance: federation funds 100% of building maintenance from operating revenue + endowment draw. City provides no maintenance subsidy.',
    'Public access: the federation commits that the Bath House remains free or sliding-scale-priced for any LA County resident, in perpetuity. No federation-internal vote can convert it to ticketed-only operation.',
    'Termination by federation: 18-month notice; building reverts to city in serviceable condition; federation transfers reservation system + cohort membership data to city per data-handling protocol.',
    'Architectural review: city has design-review consultation rights at schematic and design-development phases; not approval rights.',
    'Compliance with LA28 partnership terms: city acknowledges LA28 Legacy Foundation co-recognition during 2028 calendar year; no permanent Olympic branding on the building.',
    'Sublease prohibition: federation may not sublease the building to any commercial operator without city + federation council approval.',
  ],
};

export const BATH_MASTER_ROLE = {
  title: 'Bath Master',
  type: 'Salaried full-time, 5-year initial term, renewable',
  reportsTo: 'Joint stewardship circle (federation delegates per /federation-council)',
  primaryDuties: [
    'Daily building inspection (open, mid-day, close)',
    'Reservation system management (cohort + visitor scheduling)',
    'Front-desk leadership during peak hours (Saturday + Sunday mornings)',
    'Bath Steward training and rotation (volunteer Bath Stewards run 2-hour shifts on the floor)',
    'Mechanical-systems coordination with Water Steward (engineer on retainer)',
    'Health-code compliance with LA County DPH',
    'Programming coordination with curatorial council (poetry residency, etc.)',
    'Federation Council quarterly reporting',
    'Annual budget submission to stewardship circle',
    'Crisis response (closures, equipment failure, guest incidents)',
  ],
  qualifications: [
    'Operations experience at a public bath, civic pool, or equivalent facility (minimum 5 years)',
    'Comfort with health-code compliance and LA County DPH inspection cycles',
    'Demonstrated capacity to lead a volunteer team of 12-25 Bath Stewards',
    'Federation cultural alignment (no commercial bath / spa industry pedigree without strong civic-mission alignment)',
    'Spanish or Korean language fluency a plus (corridor demographic match)',
  ],
  compensation: {
    base: '$110,000-$140,000 annually + benefits (LA County prevailing-wage match for civic-facility-manager roles)',
    housing: 'No federation-provided housing; the Bath Master is expected to live within 5 miles of the building.',
    sabbatical: 'Six-week sabbatical in years 3 and 5 (federation hires a Bath Sub during sabbatical from the Water Steward bench)',
    pension: 'Federation contributes 8% of base to a portable retirement account.',
  },
  termination: 'Stewardship circle may terminate for cause with 60-day notice + 6-month severance. Bath Master may resign with 90-day notice. No automatic renewal at end of 5-year term — formal renewal review by stewardship circle.',
};

export const HUNDRED_FOUNDING_BATHERS = {
  thesis: 'A community of 100 individuals who fund the Bath House at the structural-financial level commensurate with their commitment. $10,000 each. Lifetime priority reservation. A named ceramic tile in the steam-room mosaic. Transferable to direct heirs once.',
  whoTheyAre: 'Corridor residents and aligned non-residents who want the Bath House to exist. Federation framework requires that no Founding Bather be a sole-source-of-funds for any single instance — the 100 must be distributed across at least 5 instances\' constituency.',
  rights: [
    'Lifetime priority reservation (Sundays + Wednesdays AM, before public reservation opens)',
    'Named ceramic tile in the steam-room mosaic (artist-fabricated, signed)',
    'Annual founders\' breakfast on the autumnal equinox at the Bath House',
    'Standing invitation to attend any federation-council Bath-House-related deliberation as observers',
    'Right to nominate one corridor cohort member per year to the Bath Steward training program',
  ],
  obligations: [
    'No special programming requests (Founding Bather status confers access, not influence)',
    'Confidentiality of fellow Bathers\' identities (a Bather may publicly self-identify; cannot publicly identify others)',
    'Annual federation report attendance (in person or recorded)',
  ],
  campaign: 'Launches 2027 Q2 after LA28 + Annenberg awards confirmed. Closes 2028 Q1 before soft opening. Announcements via /commons + corridor cohort newsletters; no paid advertising.',
};

export const PHILOSOPHICAL_NOTES = {
  whyABathHouse: 'Civic infrastructure that is not commerce. A library is the obvious template, but libraries have been claimed and contested. A bath house is older — Roman, Russian, Hungarian, Japanese, Icelandic — and has no contemporary American template. The federation builds it BECAUSE it has no template; the corridor needs civic instruments that resist standardization.',
  whyConcrete: 'Brutalist concrete is honest about its construction. The board-form texture records the formwork. The reinforcement is not hidden. The building does not aspire to be beautiful in the way commercial architecture aspires; it aspires to weather. In 100 years the concrete will be gray, the granite will be soft, the cedar will be silver. The building will look more like itself than it did at opening.',
  whyAtTheCorridorMidpoint: 'Hermosa Pier is geographically equidistant from the four-instance corridor. The Bath House cannot belong to any one city; sited at the midpoint, it belongs to the federation. The MOU\'s 99-year lease structure makes this explicit: Hermosa is the landlord; the federation is the operator; neither is the owner.',
  whyNotPrivate: 'The model commercial precedent (Wi Spa, Aroma, Korean Bell Spa, Olympic Spa, Crystal Spa, Spa Castle) demonstrates that a bath house can be commercially viable in Southern California. The federation\'s commitment is that the bath house should be civic, not commercial — free or sliding-scale, governed by stewardship not management, programmed by the corridor not by spa industry. The framework\'s Tier D guardrails apply.',
  whyNotJustAPool: 'A municipal pool is what beach cities already have. The Bath House is structurally different: indoor + outdoor; warm + cool; pool + steam + plunge + quiet room; food + tea; rotating poetry residencies and Marine Layer sit programs. It is not a pool with extras; it is a different category of public infrastructure.',
};

export const REFERENCES = [
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works*. UES-Federation-02. https://pointcast.xyz/giant-works' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council' },
  { id: 'pointcast-la28', cite: 'University of El Segundo. (2026). *LA28 Forcing Function*. UES-WP-2026-13. https://pointcast.xyz/la28-ready' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'studio-granda', cite: 'Studio Granda. (2010). *Sundlaugin í Hofsósi · Hofsós Outdoor Pool*. Architectural documentation, hofsos.is.' },
  { id: 'zumthor-vals', cite: 'Zumthor, P. (1996). *Therme Vals*. Architectural documentation, multiple sources.' },
  { id: 'szechenyi', cite: 'Széchenyi Bath. (1913–Continuing). *Operating History and Civic Programs*. szechenyibath.com.' },
  { id: 'russian-turkish', cite: 'Russian and Turkish Baths NYC. (1892–Continuing). *Operating History and Cultural Memory*. russianturkishbaths.com.' },
  { id: 'funi-no-yu', cite: 'Funi-no-yu. (Continuing). *Yatsuomote Village Onsen Stewardship*. Multiple sources.' },
  { id: 'la28-legacy', cite: 'LA28 Olympic Organizing Committee. (Continuing). *Legacy Projects Framework*. la28.org/legacy.' },
  { id: 'annenberg-la28', cite: 'Annenberg Foundation. (2024). *LA28 Cultural Initiatives Funding Priority*. annenberg.org/la28.' },
  { id: 'hewlett', cite: 'Hewlett Foundation. (2024). *Olympic Coordination Initiative*. hewlett.org/olympic-coordination.' },
  { id: 'mellon', cite: 'Mellon Foundation. (Continuing). *Public Humanities Funding Priorities*. mellon.org.' },
  { id: 'ostrom', cite: 'Ostrom, E. (1990). *Governing the Commons*. Cambridge University Press. Theoretical foundation for federation-stewardship governance.' },
  { id: 'la-dph', cite: 'Los Angeles County Department of Public Health. (Continuing). *Public Pool and Spa Code*. publichealth.lacounty.gov.' },
];

export const PAPER_NOTES = {
  uesNote: 'This Working Paper is the prototype for per-Tier-D-work deep dives. Concert Hall, Tide-Pool Restoration, and the remaining 13 Tier D works will follow the same template: program block, structure-and-material block, mechanical systems, fundraising calendar, host-city MOU, principal role spec, philosophical notes. The federation\'s build queue is now broken into per-work fundraising-ready documents, not just specifications.',
  invitation: 'If you are an architect interested in submitting to the Bath House competition (open 2026 Q4), a foundation program officer at LA28 Legacy / Annenberg / Hewlett / Mellon, a prospective Bath Master with civic-pool operations experience, or one of the prospective 100 Founding Bathers, email mh@pointcast.xyz with subject line "Bath House · {role}". Federation Council Charter ratification by 3-of-5 instances unlocks the next phase; the architect competition launches the quarter after ratification.',
};
