/**
 * Concert Hall Working Paper — UES-WP-2026-17.
 *
 * Second per-Tier-D-work deep dive. Companion to /bath-house
 * (UES-WP-2026-14, water, $13M). The Concert Hall is the corridor's
 * audio-coded Tier D work, $22M total, 350-seat civic chamber-music
 * hall. Critically: this paper is the federation's anti-Disney-Hall
 * working position. Frank Gehry's Walt Disney Concert Hall (2003,
 * $274M) is the Los Angeles cultural-civic anti-precedent: spectacular
 * architecture, donor-driven programming, ticket prices that exclude
 * the cohort the federation is built for. The Concert Hall thesis is
 * the inverse: small, free or near-free, programmed by curatorial
 * council not management, recorded and open-licensed, sited in
 * partnership with TCAC in Torrance — the corridor's deepest existing
 * performing-arts institution.
 *
 * This paper is the second in the Tier D deep-dive series. The first
 * (Bath House) shipped at /bath-house. The third (Tide-Pool) is queued.
 */

export const PAPER_META = {
  title: 'The Concert Hall',
  subtitle: 'Architectural program, fundraising calendar, and operating manual for a 350-seat civic chamber-music hall · the federation\'s anti-Disney-Hall working position · UES Working Paper 2026-17',
  thesis: 'A 350-seat civic chamber-music hall, oval-in-rectangle plan, board-form concrete walls and Norwegian fjord-granite acoustic diffusers, cedar-bench seating in the round, Tuesday-Sunday programming at $5-25 sliding-scale tickets (members free), every concert recorded and open-licensed to the federation library in perpetuity. Sited adjacent to the Torrance Cultural Arts Center / Armstrong Theatre as a complementary stream rather than a competitive one. Programmed by a five-member curatorial council (chamber, early-music, new-music, jazz, corridor-resident programmer) plus a Concert Master on a 5-year renewable term. Funded by federation Commons aggregation + Annenberg + Mellon + a 350 Founding Audience tier + a parallel endowment campaign — explicitly NOT by LA28 partnership (anti-aligned per /la28-ready) and NOT by conventional municipal bond financing. Designed as the explicit anti-precedent to Walt Disney Concert Hall: small where Disney is large, free where Disney is ticketed, curatorial-council programmed where Disney is donor-driven, brutalist-honest where Disney is architectural-spectacle. The federation builds the small civic instrument LA does not have, not the spectacular civic instrument LA has plenty of.',
  paperNumber: 'UES-WP-2026-17',
  date: '2026-05-08',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['concert hall', 'chamber music', 'civic infrastructure', 'Tier D', 'University of El Segundo', 'Torrance', 'TCAC', 'anti-Disney-Hall', 'curatorial council', 'open-license recordings'],
  parentPaper: 'UES-Federation-02 Giant Works',
  relatedSurfaces: ['UES-WP-2026-14 The Bath House', 'UES-Federation-04 Giant Works · Art', 'UES-Federation-05 Federation Council Charter', 'UES-WP-2026-13 LA28 Forcing Function (Concert Hall is anti-aligned, defended from LA28 partnership)'],
};

export const ANTI_DISNEY_HALL = {
  title: 'The federation\'s working position on Walt Disney Concert Hall as anti-precedent',
  description: 'Walt Disney Concert Hall (Frank Gehry, 2003) is one of the most architecturally celebrated civic buildings in late-20th-century America. It is also a study in everything the federation\'s Concert Hall must not become. The two buildings can coexist on the LA cultural map; the federation does not propose displacing Disney Hall, only filling the cohort-scale civic-instrument gap that Disney Hall structurally cannot fill.',
  fivePoints: [
    { contrast: 'Scale', disneyHall: '~2,265 seats', concertHall: '350 seats', why: 'A 2,265-seat hall requires major-touring-artist economics to fill. A 350-seat hall can be filled by corridor cohort + walk-in audience for a Tuesday recital. The smaller hall is the more sustainable civic instrument.' },
    { contrast: 'Pricing', disneyHall: '$50-300 per ticket; partial $20 student / discount tiers', concertHall: '$5-25 sliding-scale; members free; every Sunday afternoon Family Concert at $0', why: 'Pricing is not a marketing decision; it is a thesis statement. Disney Hall\'s pricing thesis is "world-class music for those who can pay." The Concert Hall\'s pricing thesis is "civic music for the cohort that already shows up to the corridor."' },
    { contrast: 'Programming control', disneyHall: 'LA Phil music director + management + donor-influenced subscription series', concertHall: 'Five-member curatorial council (one chamber-music, one early-music, one new-music, one jazz/improvised, one corridor-resident) + Concert Master on advisory not autocratic role', why: 'Disney Hall programming is structurally responsive to LA Phil board governance; the Concert Hall programming is structurally responsive to the corridor cohort. The same piece of music programmed in both halls is selected for different reasons; we expect the programs to overlap on quality and diverge on context.' },
    { contrast: 'Architecture', disneyHall: 'Gehry titanium-clad expressionist sculpture; the building is a tourist destination as well as a concert hall', concertHall: 'Brutalist board-form concrete + Norwegian fjord granite + cedar; the building aspires to weather, not to be photographed', why: 'A spectacular building draws tourists; a brutalist civic building draws cohort. The federation has no interest in tourism revenue; it has every interest in the cohort-meeting density that small unspectacular civic instruments produce.' },
    { contrast: 'Recording and ownership', disneyHall: 'LA Phil recordings via commercial labels (Deutsche Grammophon, Decca, Disney-affiliated catalog) with restricted licensing', concertHall: 'Every concert recorded with binaural and stage-pair microphone arrays; recordings open-licensed (CC0 by default, opt-out preserved per artist) and archived to the federation library in perpetuity', why: 'A century of Concert Hall recordings is the corridor\'s permanent civic-cultural memory. A century of Disney Hall recordings is in commercial vaults under copyright control. The two archives serve different ends.' },
  ],
  whatThisIsNot: 'This is not a critique of Disney Hall. Disney Hall is one of LA\'s civic treasures and the federation has no objection to it on its own terms. The argument is that the typology Disney Hall fills (large, spectacular, ticketed, internationally programmed) is one typology of many, and Los Angeles already has its examples. The typology the Concert Hall fills (small, civic, sliding-scale, locally programmed, fully recorded) is a separate typology that LA structurally lacks at the corridor scale.',
};

export const PROGRAM = {
  totalArea: '11,800 sq ft (interior)',
  occupancyMax: '350 seated audience + 24 musicians on stage at peak ensemble',
  operatingHours: 'Tuesday-Sunday programming. Mondays closed for deep maintenance and tuning.',
  spaces: [
    { name: 'Hall (auditorium)', area: '4,800 sq ft', capacity: '350 seats single-tier surrounding three sides of the stage', notes: 'Oval-in-rectangle plan. 12-foot raised stage 24ft × 16ft. No proscenium. Single-tier to keep every seat within 50 feet of the performers. Acoustic stone diffusers (hand-tooled Norwegian fjord granite, QRD geometry) on rear wall and ceiling.' },
    { name: 'Lobby + plaza concourse', area: '1,400 sq ft', capacity: '~150 standing during intermission', notes: 'Pre-concert and intermission gathering; permanent display of corridor STONES catalog rotation paired with the season\'s programming; small bar serving tea, broth, and one wine selection (member-discounted; visitor cost recovery).' },
    { name: 'Backstage musician spaces (green room, dressing, instrument storage)', area: '1,800 sq ft', capacity: '24 musicians + 2 staff at peak', notes: 'Two main green rooms (chamber + larger ensemble); two dressing rooms (gender-neutral); permanent piano storage (two on permanent loan from a piano partner); string and percussion lockers for visiting ensembles; staff work room.' },
    { name: 'Recording control booth', area: '500 sq ft', capacity: '2 engineers + observation', notes: 'Permanent installation. Studer A800 24-track tape primary (donated), Pro Tools HDX secondary, Neumann + AKG mic locker. Every concert recorded; the Recording Steward operates the booth.' },
    { name: 'Curatorial / Concert Master office', area: '600 sq ft', capacity: '4-person work / 1 full-time desk', notes: 'Concert Master\'s working office. Curatorial council quarterly meeting space. Library of recorded archives, scores, and federation library reference materials.' },
    { name: 'Mechanical + HVAC', area: '900 sq ft', capacity: 'staff-only', notes: 'Below-grade. Quiet variable-air-volume HVAC sized for whisper-noise (NC-15 rating in the hall during operation). Heating: heat-pump primary; backup electric. Pre-concert temperature regulation begins 4 hours before downbeat to stabilize wood instruments.' },
    { name: 'Restrooms (audience, gender-neutral + accessible)', area: '900 sq ft', capacity: 'flow-through', notes: 'Three restroom suites including one fully accessible. Sized for 350-seat capacity at intermission peak.' },
    { name: 'Front desk + ticketing + reservation kiosk', area: '500 sq ft', capacity: '8-12 patron flow', notes: 'Cohort-member self-checkin terminal. Walk-up ticket sales for visitors. Will-call window. Schedule-board for the season.' },
    { name: 'Loading dock + instrument access', area: '400 sq ft', capacity: 'staff-only', notes: 'Direct stage-level access for instrument transport (concert grand pianos, harpsichord, marimba, etc.). Climate-controlled instrument-staging area for pre-concert tuning.' },
  ],
  totalProgrammedArea: '11,800 sq ft',
};

export const STRUCTURE_AND_MATERIAL = {
  primaryStructure: 'Cast-in-place reinforced concrete, board-form Douglas fir formwork (1×8 horizontal), exposed on hall interior surfaces. Roof: post-tensioned concrete deck with integrated low-noise ventilation diffusers; no roof skylights (diurnal light variation incompatible with chamber-music staging).',
  primaryStone: 'Norwegian fjord granite for hall acoustic diffusers and lobby benches. Hand-tooled QRD diffuser geometry. Sourced via the corridor STONES catalog\'s international-stone partnership (matching the Bath House primary stone for federation material continuity).',
  secondaryStone: 'Tehachapi quartzite (California-sourced) for stage-edge benches and audience seating frames. Same two-stone vocabulary as the Bath House: federation civic instruments speak in materials sourced both locally and internationally.',
  woods: 'Cedar (Pacific Northwest, USDA-certified) for audience seating slats and stage construction. Douglas fir for board-form formwork (visible). No tropical hardwoods.',
  metals: '316L stainless steel for plumbing and exposed structural connections. Patina-allowed bronze for door hardware. Brass for stage hardware (railings, instrument-stand fittings) — brass\'s acoustic damping properties are an asset in the hall.',
  glazing: 'Triple-pane low-e for lobby concourse street-facing windows. NO glazing in the hall itself — glass produces acoustic reflections that complicate diffuser tuning and is structurally inconsistent with the brutalist-acoustic vocabulary.',
  acousticTreatment: 'See dedicated acoustic-design section below. Stone diffusers + cedar absorbers are the primary acoustic instruments; no electronic acoustic treatment in the hall.',
};

export const MECHANICAL_SYSTEMS = {
  hvac: 'Variable-air-volume system sized for NC-15 noise rating in the hall during performance. Pre-concert ramping (4 hours before downbeat) to stabilize the hall to 70°F and 45% relative humidity — both targets calibrated for wood-instrument stability. Air-source heat pump primary; electric resistance backup; no fossil-fuel combustion in the building.',
  electrical: '480V 3-phase service, 400A. PV array 30 kW on roof (covers ~25% of annual electrical load at the hall\'s nighttime-peak operating profile). Backup generator (natural gas, 60 kW) for 48-hour limited operation during outage — chosen at 60 kW because Concert Hall night-of-show operation needs lighting + recording-booth electronics + minimal HVAC, not the full HVAC load.',
  plumbing: 'PEX-A domestic supply, copper at high-flow points. Cast-iron sanitary primary. No special plumbing requirements for the program.',
  lighting: 'Stage: tungsten-halogen primary (the standard chamber-music color temperature, 3200K) with LED accent for ambient lobby and corridor. Audience: dimmable LED warm-white tuned to non-flickering operation. NO color-changing or theatrical-spectacle lighting; the federation\'s commitment is that the hall is a hall, not a venue.',
  fireProtection: 'Wet-pipe sprinkler standard plus pre-action system in the hall to prevent accidental discharge into instruments. Smoke detection sensitive enough to alert before audible fire alarm to allow staff to escort audience without panic.',
  acousticAbsorptionSwitching: 'Variable absorption panels behind the rear-wall stone diffusers, manually adjustable per-program by the Concert Master. Allows tuning RT60 from 1.4s (chamber-music optimal) to 2.0s (early-music / choral optimal) by exposing or covering 800 sq ft of absorption surface.',
};

export const ACOUSTIC_DESIGN = {
  philosophy: 'A chamber-music hall is built around the acoustic experience of 50 feet from the music to the listener at the back row. Disney Hall and similar large halls use sophisticated electronic enhancement to make the back row hear what the front row hears acoustically; the Concert Hall has no such enhancement and does not need it because the back row is 50 feet from the stage. This is the small-civic-hall thesis at the technical layer: acoustic intimacy is the architectural feature, not a technological add-on.',
  rt60Targets: 'Variable: 1.4 seconds at 500 Hz with full absorption deployed (chamber music, lieder, jazz quartet); 2.0 seconds with absorption retracted (early music, choral, large ensemble). The 0.6-second variable range is wider than most concert halls and is the architectural decision that lets the same room serve six different musical traditions across a season.',
  treatment: 'Hand-tooled Norwegian fjord granite slab diffusers in QRD (Quadratic Residue Diffuser) geometry on rear wall and ceiling, set non-repeating to avoid coloration. Cedar audience seating provides distributed mid-frequency absorption; the seats themselves tune the room. Variable absorption panels behind the rear-wall stone diffusers allow per-program RT60 tuning.',
  isolation: 'Hall isolated from lobby and back-of-house via mass-loaded vinyl + double-stud wall assemblies. Mechanical-room isolation is the building\'s most-isolated assembly: HVAC compressor noise must not exceed 35 dB(A) in the hall during quiet passages. Loading dock isolated from stage via airlock vestibule to prevent street noise transmission during performances.',
  recording: 'Permanent recording infrastructure (see Recording control booth in PROGRAM): Studer A800 24-track tape, 24-track Pro Tools HDX, Neumann + AKG microphone locker. Recording paths permanently installed in the hall ceiling and stage so no temporary microphone setup is needed for routine recording. Every concert recorded by default; opt-out preserved per visiting artist.',
};

export const FUNDING_CALENDAR = {
  total: '$22,000,000 capital + $4,000,000 endowment = $26,000,000',
  notLa28: 'CONCERT HALL DOES NOT TAKE LA28 LEGACY FUNDING. Per /la28-ready, the Concert Hall is in the DEFEND band — LA28 partnership warps the small-civic anti-Disney-Hall thesis structurally. The federation may NOT accept LA28 Legacy Foundation, LA28 Cultural Olympiad, or LA28-affiliated philanthropy without explicit federation council vote (3-of-N threshold) AND a documented finding that the partnership preserves the federation\'s 350-seat sliding-scale-pricing thesis.',
  sourceMix: [
    { source: 'Federation Commons aggregated across instances', amount: '$3,500,000', timing: '2027 Q1 — 2028 Q3', notes: 'Each instance commits voluntarily; estimated split: ES $600K, MB $900K, HB $500K, RB $600K, Torrance $900K based on Torrance hosting and instance-population proportional capacity.' },
    { source: 'Annenberg Foundation', amount: '$5,000,000', timing: '2027 Q2 LOI → 2028 Q3 award', notes: 'Annenberg has a multi-decade chamber-music funding history; the small-civic-hall thesis is a strong match. Federation must explicitly state in the LOI that the Hall does NOT take LA28 funding to preserve the anti-Disney-Hall thesis.' },
    { source: 'Mellon Foundation', amount: '$4,000,000', timing: '2027 Q3 LOI → 2028 Q4 award', notes: 'Mellon Public Humanities priorities include performing-arts infrastructure with poetry/essay residency components — the Hall\'s annual poetry residency at the Hall qualifies.' },
    { source: 'Andrew W. Mellon Foundation Music in the Round program', amount: '$2,000,000', timing: '2028 Q1 application → 2028 Q4 award', notes: 'Specific program for chamber-music infrastructure. The Hall\'s in-the-round seating qualifies.' },
    { source: '350 Founding Audience tier', amount: '$3,500,000', timing: '2028 Q1 → 2029 Q1 (rolling)', notes: '350 individuals × $10,000 each. Lifetime priority reservation, named seat (engraved bench plaque), transferable to direct heirs once.' },
    { source: 'Lead Concert Hall Sponsor', amount: '$1,500,000', timing: '2027 Q1 (locked early)', notes: 'Single lead donor. Founding plaque in the lobby. Priority on the architect-selection jury. Standing observer rights at curatorial council.' },
    { source: 'Piano + instrument partner equipment grants', amount: '$1,000,000 in-kind', timing: '2028 Q1 — 2028 Q4', notes: 'Two pianos on permanent loan (Steinway South Bay or equivalent + Yamaha or Bösendorfer secondary). Recording equipment partial donation (Studer A800 restoration + Neumann mic locker).' },
    { source: 'Federation Future Works Fund', amount: '$1,500,000', timing: '2027-2028 (5% of Bath House campaign overage)', notes: 'The Bath House campaign\'s overage flows 5% to the Future Works Fund per the Tier D scaling principle; the Concert Hall is the next work in queue.' },
    { source: 'Endowment campaign (parallel)', amount: '$4,000,000', timing: '2027 Q1 → 2029 Q2', notes: 'Funded SEPARATELY from capital; endowment must be fully funded before soft opening. 4% annual draw covers Concert Master salary + Recording Steward retainer + Steinway maintenance + visiting-artist fee floor.' },
  ],
  stretchTargets: [
    { item: 'Anonymous family foundation (named after capital campaign)', amount: '$2,000,000', notes: 'Standing in the federation\'s working donor pipeline; commitment letter pending Concert Master appointment.' },
    { item: 'Recording-archive partnership (BBC Music, NPR Music, or Spotify Open Access)', amount: '$500,000', notes: 'Distribution partnership for the open-licensed concert archive; revenue-sharing returns to the Hall endowment.' },
  ],
};

export const FUNDING_TIMELINE = [
  { quarter: '2027 Q1', milestone: 'Federation Council Charter ratified by 5-of-5 instances (Bath House precedent path). Lead Concert Hall Sponsor commitment closed. TCAC partnership MOU signed (host-site agreement). LOIs to Annenberg, Mellon.' },
  { quarter: '2027 Q2', milestone: 'Architect competition launched (3 finalists, $75K honorarium each — chamber-music acoustic specialist required on each finalist team). Annenberg LOI converts to formal application.' },
  { quarter: '2027 Q3', milestone: 'Architect selected. Design development begins. Concert Master shortlist of 3 candidates initiated for 6-month consultation.' },
  { quarter: '2027 Q4', milestone: 'Acoustic engineering study completed ($300K, federation + lead-sponsor co-funded). Mellon LOI submitted. Endowment campaign launches.' },
  { quarter: '2028 Q1', milestone: 'Construction documents complete. Permit issued. Construction begins. 350 Founding Audience campaign launches.' },
  { quarter: '2028 Q2', milestone: 'Foundation + slab + below-grade complete. Annenberg award. Concert Master appointed; consultation phase ends.' },
  { quarter: '2028 Q3', milestone: 'Walls + roof structure complete. Mellon award. Curatorial council convened (5 practitioners + Concert Master, advisory).' },
  { quarter: '2028 Q4', milestone: 'Interior + acoustic treatment installation. First inaugural-season programming locked. Mellon Music-in-the-Round award.' },
  { quarter: '2029 Q1', milestone: 'Final acoustic tuning + piano installation. Recording Steward hired. Endowment campaign closes.' },
  { quarter: '2029 Q2', milestone: 'Soft opening for Founding Audience members. First inaugural concert at the autumnal equinox 2029 with corridor cohort + curatorial council attendance.' },
  { quarter: '2029 Q3+', milestone: 'Full Tuesday-Sunday programming begins. Federation Council year-one audit at autumnal-equinox 2030 meeting.' },
];

export const TCAC_PARTNERSHIP_MOU = {
  tenor: 'A 75-year ground lease at $1/year on a TCAC-adjacent municipal lot, with the federation responsible for design, construction, operation, and endowment of the Concert Hall. TCAC retains its existing Armstrong Theatre programming and adds a co-marketing relationship with the Hall.',
  keyTerms: [
    'Term: 75 years from soft-opening date.',
    'Rent: $1/year, with periodic CPI adjustments capped at +0.5% annually.',
    'Reversion conditions: (a) building unoccupied or unmaintained for 24+ months; (b) Concert Master role unfilled for 12+ months; (c) federation council formally dissolves; (d) host city declares the use inconsistent with general plan after public hearing process.',
    'Programming independence: the federation curatorial council sets all programming. TCAC has co-marketing rights but no programming-approval rights.',
    'Co-marketing: TCAC includes Concert Hall season in its annual cultural-arts season brochure; the Hall includes TCAC season in its program. Cross-promotion is bidirectional.',
    'TCAC priority booking: TCAC may book the Hall for up to 8 nights per year for non-conflicting Cultural Arts Center programming at no rental fee — federation hospitality, not commercial relationship.',
    'Maintenance: federation funds 100% of building maintenance from operating revenue + endowment draw. Torrance provides no maintenance subsidy.',
    'Public access: the federation commits that the Concert Hall remains free or sliding-scale-priced for any LA County resident, in perpetuity.',
    'Termination by federation: 18-month notice; building reverts to city in serviceable condition.',
    'Architectural review: city has design-review consultation rights at schematic and design-development phases; not approval rights.',
    'Specific exclusion of LA28 partnership: this MOU explicitly acknowledges that the Concert Hall does NOT participate in LA28 Legacy programming. Torrance acknowledges this position and does not pressure the federation to accept LA28 funding.',
  ],
};

export const CONCERT_MASTER_ROLE = {
  title: 'Concert Master',
  type: 'Salaried full-time, 5-year initial term, renewable',
  reportsTo: 'Joint stewardship circle (federation delegates) + curatorial council (advisory)',
  primaryDuties: [
    'Coordinate the curatorial council\'s programming decisions across the 200+ concerts per year',
    'Schedule Tuesday-Sunday programming season ~6 months ahead',
    'Visiting-artist coordination (~80 visiting ensembles per year on chamber-music tours)',
    'Sunday-afternoon Family Concert programming (free, $0 admission)',
    'Wednesday-afternoon corridor-cohort open rehearsal access',
    'Recording archive coordination with the Recording Steward',
    'Annual poetry residency program coordination (Mellon-funded)',
    'Federation Council quarterly reporting',
    'Curatorial council quarterly meeting facilitation',
    'Press and external partnership liaison (BBC Music, NPR Music, archive partners)',
  ],
  qualifications: [
    'Concert-hall artistic-direction experience (minimum 5 years; ideally chamber-music focused)',
    'Demonstrated capacity to program a 200+ concert season',
    'Federation cultural alignment (no commercial-orchestra-management pedigree without strong civic-mission alignment)',
    'Multi-genre programming literacy (chamber + early + new-music + jazz + corridor-resident voices)',
    'Federation prefers but does not require Spanish, Korean, Japanese, or Mandarin language fluency (corridor demographic match)',
  ],
  compensation: {
    base: '$140,000-$170,000 annually + benefits',
    sabbatical: 'Six-week sabbatical in years 3 and 5 (federation hires a Concert Sub during sabbatical from the curatorial council)',
    pension: 'Federation contributes 8% of base to a portable retirement account.',
  },
  termination: 'Stewardship circle may terminate for cause with 60-day notice + 6-month severance. Concert Master may resign with 90-day notice. No automatic renewal at end of 5-year term — formal renewal review by stewardship circle plus consultation with curatorial council.',
};

export const CURATORIAL_COUNCIL = {
  composition: 'Five practicing musicians on rotating 3-year terms. One chamber-music programmer; one early-music programmer; one new-music / contemporary programmer; one jazz / improvised-music programmer; one corridor-resident programmer (this seat may be filled by a non-musician programmer practicing in the corridor — composer, audio engineer, music journalist).',
  selection: 'Each instance\'s stewardship circle nominates candidates; the joint stewardship circle confirms by 3-of-N vote. The corridor-resident seat must always be filled by a corridor cohort member.',
  termLength: 'Three-year staggered terms (one of five rotates each year). No consecutive-term limit.',
  duties: [
    'Quarterly programming meetings (4 per year, scheduled at solstices + equinoxes)',
    'Visiting-ensemble selection (~80 per year)',
    'Annual poetry-residency-paired programming',
    'Sunday Family Concert curation (~52 per year)',
    'Annual Concert Master review (advisory, not autocratic)',
    'Federation Council quarterly reporting (one council member rotates)',
  ],
  decisionRule: 'Simple majority of 5 council members with one tie-breaking vote retained by the Concert Master only on programming-blocking issues. Federation council reviews curatorial council decisions only on appeal.',
};

export const THREE_FIFTY_FOUNDING_AUDIENCE = {
  thesis: '350 individuals who fund the Concert Hall at the structural-financial level. $10,000 each. Lifetime priority reservation. A named bench plaque in the hall. Transferable to direct heirs once. The number 350 matches the seat count exactly — every founder has a seat.',
  whoTheyAre: 'Corridor residents and aligned non-residents who want the Concert Hall to exist. Federation framework requires that no Founding Audience member be a sole-source-of-funds for any single instance — the 350 must be distributed across at least 5 instances\' constituency. No single instance supplies more than 30% of the 350.',
  rights: [
    'Lifetime priority reservation (Sundays + Tuesdays AM, before public reservation opens)',
    'Named bench plaque in the hall (artist-fabricated, signed)',
    'Annual founders\' breakfast at the autumnal equinox at the Hall',
    'Standing invitation to attend any federation-council Concert-Hall-related deliberation as observers',
    'Right to nominate one corridor cohort member per year for curatorial council corridor-resident seat consideration',
  ],
  obligations: [
    'No special programming requests (Founding Audience status confers access, not influence)',
    'Confidentiality of fellow founders\' identities (a founder may publicly self-identify; cannot publicly identify others)',
    'Annual federation report attendance (in person or recorded)',
  ],
  campaign: 'Launches 2028 Q1 after Annenberg award confirmed. Closes 2029 Q1 before soft opening. Announcements via /commons + corridor cohort newsletters + curatorial council network; no paid advertising.',
};

export const PHILOSOPHICAL_NOTES = {
  whyConcertHallNotConcertVenue: 'A "concert venue" books touring acts and rents to producers. A concert hall has its own programming, its own ensemble culture, its own recording archive, its own pedagogy. The federation\'s commitment is to a Concert Hall — the federation owns the programming, owns the recordings, owns the curatorial intent. The same building, called a venue, would serve different ends.',
  whyChamberMusicAndNotOrchestra: 'Chamber music — small-ensemble repertoire from solo through quartet through octet — is the music that survives at the human scale of conversation. Orchestra requires 60-100 performers and a major capital structure (LA Phil, NY Phil, Boston Symphony) that the federation cannot support. Chamber music thrives at the federation scale. The decision is structural; the federation can support a chamber-music hall in perpetuity at a way it cannot support a symphony orchestra.',
  whyEveryConcertRecorded: 'A century of Concert Hall recordings is the corridor\'s permanent civic-cultural memory. A concert that is performed and lost is a concert that exists in the moment but does not enter the corridor\'s archive. The recording is not a commercial product; it is a civic act. The artist may opt out for any specific concert; the default is record-and-archive open-licensed.',
  whyTuesdayThroughSundayNotFridayThroughSunday: 'Most concert halls program Friday-Saturday-Sunday because that is when paid audiences are available. The Concert Hall programs Tuesday-Sunday because the federation\'s commitment is to civic music, not to maximum revenue. Tuesday afternoon Family Concerts and Wednesday afternoon corridor-cohort open rehearsals are programming that ticketed-revenue-only halls cannot afford to schedule. The Concert Hall can.',
  whyNoLA28: 'See ANTI_DISNEY_HALL section. The Concert Hall is anti-aligned with Olympic-spectacle architecture and Olympic-tourism pricing. LA28 partnership would force scale increases, ticketing-only operation, broadcaster-platform modifications, and Olympic-cultural-program co-recognition — each of which warps the small-civic-anti-Disney-Hall thesis structurally. The federation\'s defended position is non-negotiable.',
  whyTorranceAndNotMB: 'Manhattan Beach is the higher-foot-traffic site and would seat the Concert Hall in walking distance of the corridor\'s densest tech-employee population. Torrance is the right host for three reasons: (1) TCAC + Armstrong Theatre give the federation institutional partnership infrastructure no beach city can match; (2) Torrance\'s linguistic-and-cultural diversity (~36% Asian-American, multiple non-English communities) makes the Hall\'s curatorial council\'s multi-genre programming structurally more useful here; (3) Old Torrance / Sartori Avenue\'s walkable-historic-downtown context fits a brutalist-civic-instrument better than MB\'s beachfront commercial context.',
};

export const REFERENCES = [
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works · Art*. UES-Federation-04. https://pointcast.xyz/giant-works-art' },
  { id: 'pointcast-bath', cite: 'University of El Segundo. (2026). *The Bath House*. UES-WP-2026-14. https://pointcast.xyz/bath-house' },
  { id: 'pointcast-la28', cite: 'University of El Segundo. (2026). *LA28 Forcing Function*. UES-WP-2026-13. https://pointcast.xyz/la28-ready (the Concert Hall is in the DEFEND band)' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council' },
  { id: 'pointcast-torrance', cite: 'University of El Segundo. (2026). *Torrance Instance*. UES-Fork-TR-04. https://pointcast.xyz/torrance' },
  { id: 'gehry-disney', cite: 'Gehry, F. (2003). *Walt Disney Concert Hall*. Los Angeles Philharmonic. The federation\'s anti-precedent.' },
  { id: 'boulez-saal', cite: 'Gehry, F. + Toyota, Y. (2017). *Pierre Boulez Saal*. Berlin. Architectural documentation. Closer in scale and intent to the Concert Hall thesis.' },
  { id: 'koolhaas-porto', cite: 'Koolhaas, R. + OMA. (2005). *Casa da Música*. Porto. Architectural documentation.' },
  { id: 'jordan-hall', cite: 'New England Conservatory. (1903-Continuing). *Jordan Hall*. nec.edu/jordan-hall.' },
  { id: 'tcac', cite: 'Torrance Cultural Arts Center. (Continuing). *Programs and the Armstrong Theatre*. torranceca.gov.' },
  { id: 'mellon', cite: 'Andrew W. Mellon Foundation. (Continuing). *Public Humanities and Music in the Round Programs*. mellon.org.' },
  { id: 'annenberg', cite: 'Annenberg Foundation. (Continuing). *Performing Arts Funding Priorities*. annenberg.org.' },
  { id: 'la-dph', cite: 'Los Angeles County Department of Public Health. (Continuing). *Public Assembly Code*. publichealth.lacounty.gov.' },
];

export const PAPER_NOTES = {
  uesNote: 'Second per-Tier-D-work Working Paper. Same template as /bath-house: program block, structure-and-material, mechanical, acoustic, funding calendar, host-city MOU, principal role spec (Concert Master rather than Bath Master), curatorial council composition, founders campaign, philosophical notes. Notably distinct: explicit ANTI_DISNEY_HALL section + explicit refusal of LA28 partnership.',
  invitation: 'If you are an architect interested in submitting to the Concert Hall competition (open 2027 Q2), a foundation program officer at Annenberg / Mellon (the Hall\'s lead philanthropic partners), a prospective Concert Master with chamber-music artistic-direction experience, a curatorial council candidate (chamber / early / new-music / jazz / corridor-resident programming), or one of the prospective 350 Founding Audience members, email mh@pointcast.xyz with subject line "Concert Hall · {role}". Federation Council Charter ratification by 5-of-5 instances unlocks the next phase; the architect competition launches the quarter after ratification.',
};
