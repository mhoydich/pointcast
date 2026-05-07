/**
 * Giant Works · Art — audio, light, and art Tier D civic projects.
 *
 * Companion catalog to /giant-works (UES-Federation-02), which specified
 * eight element-coded works (earth, water, fire, air, synthesis). This
 * page extends the federation's Tier D queue with eight art-coded works:
 * three audio-coded (Concert Hall, Audio Pavilion, Recording Studio),
 * three light-coded (Light Sanctuary, Light Tower, Cinema Brutalist),
 * and two art-coded (Art Library, Bell Garden).
 *
 * Together with the original eight, the federation has sixteen Tier D
 * works specified — enough for the council to sequence a half-century
 * of construction without revisiting the catalog.
 */

export const GWA_META = {
  title: 'Giant Works · Art',
  subtitle: 'Audio, light, and art Tier D civic projects · the federation\'s art-coded build queue',
  thesis: 'Giant Works (UES-Federation-02) catalogued eight element-coded civic instruments — bath house, ocean tower, geothermal pool, stone garden, fire pavilion, wind garden, tide-pool restoration, dark-sky observatory. This companion page catalogues eight art-coded works: three audio (Concert Hall, Audio Pavilion, Recording Studio Public Use), three light (Light Sanctuary, Light Tower, Cinema Brutalist), two art (Art Library, Bell Garden). Together the sixteen Tier D works give the federation a half-century build queue with no overlap and full coverage of the public-instrument categories the corridor needs.',
  paperNumber: 'UES-Federation-04',
  date: '2026-05-07',
  parentPaper: 'UES-Federation-02 Giant Works',
  audience: 'Federation council members, performing-arts presenters, classical-music institutions, light-architecture practitioners, public-cinema curators, philanthropic-arts circles, the LA28 cultural-program circle.',
};

export const ART_TIER_D_PRINCIPLES = [
  'Art-coded works carry the same Tier D guardrails as element-coded works: $1M floor, 100-year design life, federation joint-stewardship, brutalist concrete primary structure, free or near-free public access.',
  'Art-coded works require an additional layer: a curatorial council. Programming decisions — what plays, what exhibits, what circulates — sit with a curatorial council distinct from the operational stewardship circle. The curatorial council includes one practicing artist per discipline, rotating annually.',
  'No proprietary recording, no proprietary screening, no proprietary lending. Every art Tier D work operates on CC0 / open-source / public-domain principles where the IP layer is in the federation\'s control. Where commercial licenses are necessary (a 35mm print, a touring soloist), the federation negotiates one-time public-screening or public-performance rights, never permanent.',
  'The host city\'s existing arts infrastructure is partner, not predecessor. The Torrance Cultural Arts Center hosts the Concert Hall in partnership; the federation does not replace TCAC programming, it adds a complementary stream.',
  'Art works that fail to attract a curatorial council are art works that should not be built. Same logic as the operational Steward Council requirement on element-coded works.',
];

export type ArtWork = {
  id: string;
  title: string;
  tagline: string;
  category: 'audio' | 'light' | 'art';
  costBand: string;
  siteCandidates: { city: string; site: string; rationale: string }[];
  inspirations: string[];
  programDescription: string;
  curatorialCouncil: string;
  triggerConditions: string[];
  fundingPath: string;
  governance: string;
  horizons: { year: string; milestone: string }[];
  precedentToCases: string;
};

export const ART_WORKS: ArtWork[] = [
  {
    id: 'concert-hall',
    title: 'The Concert Hall',
    tagline: 'A small civic concert hall — 350 seats, exposed concrete + acoustic stone, free or near-free programming, Tuesday-Sunday.',
    category: 'audio',
    costBand: '$18M – $35M (plus $4M endowment)',
    siteCandidates: [
      { city: 'Torrance', site: 'Adjacent to the Cultural Arts Center / Armstrong Theatre, west lot', rationale: 'Co-locates with existing performing-arts infrastructure; TCAC is the corridor\'s deepest performing-arts partner; existing parking and back-of-house support reduces capital cost. Politically: TCAC programming is complementary, not competitive.' },
      { city: 'Manhattan Beach', site: 'Polliwog Park west meadow', rationale: 'Existing amphitheater infrastructure for outdoor overflow; mature parks-department partnership. Scale of MB\'s philanthropic base supports the higher cost band better than smaller cities.' },
      { city: 'Hermosa Beach', site: 'Pier-adjacent municipal lot at Pier Avenue + Hermosa Ave', rationale: 'Pier Plaza density delivers walking-distance audience; Comedy & Magic Club proximity creates a small-performance-venue district. Politically delicate — Pier Plaza foot-traffic competition.' },
    ],
    inspirations: [
      'Walt Disney Concert Hall, LA (Frank Gehry, 2003) — civic-scale concert venue, but commercially-operated; the federation\'s anti-precedent for governance.',
      'Boulez Saal, Berlin (Frank Gehry + Yasuhisa Toyota, 2017) — 682-seat oval-in-cube chamber-music hall; the spatial vocabulary the Concert Hall extends.',
      'Casa da Música, Porto (Rem Koolhaas, 2005) — 1,200-seat civic concert hall integrated with a public plaza; precedent for the Concert Hall\'s public-plaza inseparability.',
      'Jordan Hall, Boston (NEC, 1903) — 1,019-seat hall operating 120+ years; precedent for the durability + cultural-infrastructure model.',
      'Ojai Music Festival\'s Libbey Bowl — 1,200-capacity outdoor venue, civic in operating culture, demonstrating small-town concert-hall viability.',
    ],
    programDescription: '350-seat oval-in-rectangle chamber-music hall, single-tier seating, 12-foot stage. Exposed board-form concrete walls; acoustic stone (Norwegian fjord granite or Tehachapi quartzite, sourced via the corridor STONES catalog) on the rear wall as the primary diffuser. No proscenium; the audience surrounds three sides. Tuesday-Sunday programming at $5-25 sliding-scale tickets (members free). Wednesday afternoons: corridor-cohort open rehearsal access. Sunday afternoons: Family Concerts ($0). Two pianos on permanent loan from a piano partner (Steinway South Bay or equivalent). Recording infrastructure permanently installed for archive — every concert is recorded, every recording is open-licensed and archived to the federation library.',
    curatorialCouncil: 'Five practicing musicians: one chamber-music programmer (rotating annually), one early-music programmer, one new-music / contemporary programmer, one jazz / improvised-music programmer, one corridor-resident programmer. Plus one Concert Master (the hall\'s music director, salaried, 5-year term, advisory not autocratic). The Council programs the season; the Concert Master coordinates.',
    triggerConditions: [
      'Federation Commons ledger exceeds 2,000 receipts.',
      'TCAC partnership MOU (if Torrance site) or equivalent host-arts-institution partnership.',
      'Lead Concert Hall sponsor commitment of at least $8M.',
      'Acoustic engineering study completed ($300K, federation + lead-sponsor co-funded).',
      'Concert Master shortlist of three candidates committed to a 6-month consultation phase.',
    ],
    fundingPath: '~$3M federation Commons. ~$10–15M philanthropic match (Annenberg, Ahmanson, Mellon, plus a lead Concert Hall sponsor). ~$3–5M from a "350 Founding Audience" tier ($25K-50K each, lifetime priority reservation, named seat in the hall, transferable). ~$2M instrument-loan capital from piano + string + percussion partners. ~$4M endowment from a separate parallel campaign.',
    governance: 'Joint stewardship circle: federation delegates + Concert Master + curatorial council + Concert Operations Steward (salaried, day-to-day building manager) + a Recording Steward (volunteer, manages the archive). Pricing decisions sit with the stewardship circle; programming decisions sit with the curatorial council; recording-archive decisions sit with the Recording Steward.',
    horizons: [
      { year: 'Year 0-1', milestone: 'Federation council adopts. Site partnership formalized. Acoustic study.' },
      { year: 'Year 2-3', milestone: 'Architect competition. Concert Master appointed.' },
      { year: 'Year 4-6', milestone: 'Construction. Curatorial council formed. Founding Audience campaign.' },
      { year: 'Year 7', milestone: 'Soft open. First 90 days reservation-only for Founding Audience.' },
      { year: 'Year 8+', milestone: 'Public open. Tuesday-Sunday programming begins. Corridor concert-archive opens.' },
      { year: 'Year 100', milestone: 'The hall has hosted approximately 30,000 concerts. Recordings of all of them are in the federation library.' },
    ],
    precedentToCases: 'Bell Labs hosted physics colloquia open to the public for 50 years — the lab\'s commitment was that the cutting edge of research belonged in public discourse, not behind a paywall. The Concert Hall is the federation\'s parallel: the cutting edge of chamber music belongs in public, at affordable cost, with the recordings open-licensed in perpetuity. Commercial concert-hall economics (Disney Hall ticket prices, donor-driven programming) are the anti-precedent.',
  },
  {
    id: 'audio-pavilion',
    title: 'The Audio Pavilion',
    tagline: 'An outdoor brutalist amphitheater — 800 seats, no roof, summer programming May through October, free.',
    category: 'audio',
    costBand: '$3M – $7M (plus $700K endowment)',
    siteCandidates: [
      { city: 'Manhattan Beach', site: 'Polliwog Park amphitheater expansion + grading', rationale: 'Existing partial amphitheater; established parks-department program; grading + concrete shell upgrade brings it to brutalist Tier D specification at lower cost than greenfield.' },
      { city: 'Torrance', site: 'Wilson Park north meadow', rationale: '700+ acres of parkland accommodates the footprint; lower noise-conflict than urban sites; AYSO + community-event infrastructure already runs through Wilson Park.' },
      { city: 'Hawthorne', site: 'Memorial Park central lawn', rationale: 'Beach Boys cultural-heritage anchor — Hawthorne is where they formed in 1961; the Audio Pavilion is the corridor\'s natural site for celebrating that heritage. Politically: edge instance, requires Hawthorne local-Land formation.' },
      { city: 'Gardena', site: 'Rowley Memorial Park', rationale: 'Japanese-American taiko + Black-American gospel + multi-cultural music heritage. Edge / neighbor instance partnership.' },
    ],
    inspirations: [
      'Hollywood Bowl, LA — civic-amphitheater precedent at much larger scale; demonstrates the typology\'s durability.',
      'Ford Theatre (Cahuenga Pass), LA — 1,200-seat civic amphitheater operating since 1920; precedent for small-civic-amphitheater operating model.',
      'Greek Theatre, Berkeley — 8,500-seat civic amphitheater operating since 1903; large-scale precedent.',
      'The Ojai Libbey Bowl — 1,200-seat outdoor festival site; small-town precedent.',
      'Bryant Park summer concerts (NYC) — free urban-park outdoor programming; programming-side precedent.',
    ],
    programDescription: '800-seat outdoor brutalist amphitheater — concrete bowl seating, board-form concrete back wall as both acoustic shell and weather break, no roof. Stage 24 ft × 16 ft, raised 4 ft above bowl floor. Permanent installed audio: 8 stage-edge ground microphones + 4 audience-mic positions for binaural recording, archived per concert. May-October programming six nights/week ($0 admission; reservation suggested). Pre-show: Marine Layer-coded 30-minute sit before each performance, opt-in. Programming pulls from corridor cohort + curatorial council recruitment + festival-partnership tours (Ojai, Aspen, Marlboro touring artists). Closed Nov-April for substrate maintenance; the bowl receives Pacific weather.',
    curatorialCouncil: 'Three practicing musicians: one classical / chamber programmer, one folk / world / global-music programmer, one corridor-resident programmer. Plus a Festival Coordinator (volunteer, season-long role) who pairs with the Concert Master across the corridor for programming continuity.',
    triggerConditions: [
      'Federation Commons ledger exceeds 800 receipts.',
      'Host-city Parks Commission MOU.',
      'Acoustic-bowl engineering study ($150K, federation-funded).',
      'Festival Coordinator candidate identified.',
    ],
    fundingPath: '~$1M federation Commons. ~$2-4M philanthropic match (Aaron Copland Fund, Naumberg, Mellon, plus a lead Pavilion sponsor). ~$500K-1M from "100 Founding Audiences" tier ($5-10K each, lifetime priority reservation, named bench-row tile). ~$700K endowment.',
    governance: 'Joint stewardship circle: federation delegates + Festival Coordinator + curatorial council + a Bowl Steward (volunteer, manages substrate maintenance, weather-closure decisions). Pricing decisions are simple (always free); programming sits with the curatorial council.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts.' },
      { year: 'Year 1-2', milestone: 'Site selection. Acoustic study. Architect competition.' },
      { year: 'Year 3', milestone: 'Construction.' },
      { year: 'Year 4', milestone: 'Inaugural season May-October. Festival Coordinator runs the first programming year.' },
      { year: 'Year 5+', milestone: 'Pavilion is the corridor\'s summer civic-music backbone.' },
      { year: 'Year 25', milestone: 'The recording archive contains 25 seasons of corridor outdoor concerts; cross-corridor cohort members can identify "their" pavilion summer.' },
    ],
    precedentToCases: 'Edison\'s phonograph proved that recorded sound was civic infrastructure — Edison kept the recording rights restrictive, but the civic-cultural precedent of "you can play it back later" outlasted the Edison restriction. The Audio Pavilion is the federation\'s civic-recording infrastructure made explicit: every concert is recorded, every recording is open-licensed, the archive is the federation\'s permanent civic-cultural memory.',
  },
  {
    id: 'recording-studio',
    title: 'The Recording Studio · Public Use',
    tagline: 'A working recording studio — analog tape + 24-track digital, free for corridor cohort, low-cost for visitors.',
    category: 'audio',
    costBand: '$2M – $4M (plus $600K endowment)',
    siteCandidates: [
      { city: 'Hawthorne', site: 'Adjacent to Hawthorne Memorial Park civic complex', rationale: 'Beach Boys formed in Hawthorne; the city\'s music-cultural heritage anchor. Politically delicate (edge instance) but most natural placement.' },
      { city: 'Torrance', site: 'Cultural Arts Center north annex', rationale: 'Co-locates with existing TCAC infrastructure; cultural-arts staff support reduces operational overhead.' },
      { city: 'El Segundo', site: 'Smoky Hollow industrial-transition lot', rationale: 'Industrial-vernacular context; lower land cost; existing industrial sound-isolation infrastructure makes acoustic-build cheaper.' },
    ],
    inspirations: [
      'Sun Studio, Memphis — small civic-cultural recording site, 70+ year operating history.',
      'Sunset Sound Recorders, LA — independent studio with civic-cultural significance; counterprecedent (commercial) showing the typology\'s reach.',
      'EMI Studios / Abbey Road, London — large-scale civic-cultural recording site; institutional model.',
      'The Stax Museum + Stax Music Academy — historic-site-becomes-civic-instrument precedent.',
      'Fairview Studios, Hull (UK) — small, independently-operated, 50-year operating history; small-scale civic precedent.',
    ],
    programDescription: '1,200 sq ft live room + 600 sq ft control room + 200 sq ft isolation booth + 200 sq ft reference-listening room. Equipment: Studer A800 24-track tape (donated or restored), MCI JH-110 1/2", Pro Tools HDX system, vintage outboard (UREI 1176, Pultec EQP-1A, AKG C12, Neumann U47, etc.). Free for corridor cohort members (1-day session per quarter, max). $400/day for visitors (cost recovery). Sessions are scheduled via the Commons-ledger booking system. All cohort sessions release a copy to the federation archive (CC0 by default; opt-out preserved). Tape archive lives at the federation library — a parallel deep-time recording that outlasts hard-drive cycles.',
    curatorialCouncil: 'Three practicing engineers / producers: one analog-tape specialist, one contemporary digital programmer, one corridor-resident producer. Plus a Studio Master (salaried, manages equipment and session bookings, 5-year term).',
    triggerConditions: [
      'Federation Commons ledger exceeds 1,000 receipts.',
      'Equipment-donation commitment from at least one major recording institution.',
      'Studio Master candidate identified (5-year commitment minimum).',
      'Acoustic-build engineering study + room-tuning plan.',
    ],
    fundingPath: '~$700K federation Commons. ~$700K-$1.5M philanthropic match. ~$300K-700K from "50 Founding Sessions" tier ($10-15K each, lifetime free-session priority + named credit on archive sessions). ~$200K-500K equipment-donation in-kind. ~$600K endowment.',
    governance: 'Joint stewardship circle: federation delegates + Studio Master + curatorial council + a Tape Steward (volunteer, manages tape archive). Booking decisions: 70% cohort sessions, 30% visitor sessions. Archive-licensing decisions sit with the Tape Steward; CC0 is the default but session-specific opt-outs preserved.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts. Equipment-donation conversations begin.' },
      { year: 'Year 1-2', milestone: 'Site selection. Acoustic build.' },
      { year: 'Year 3', milestone: 'Equipment installation. Studio Master appointed.' },
      { year: 'Year 4', milestone: 'Soft open. First cohort session.' },
      { year: 'Year 5+', milestone: 'Studio is the corridor\'s permanent recording infrastructure.' },
      { year: 'Year 50', milestone: 'The tape archive contains 50 years of corridor session work — a deep-time recording the federation owns and curates.' },
    ],
    precedentToCases: 'Xerox PARC put working hardware in user offices because the research thesis was that civic infrastructure was something people used, not something people read about. The Recording Studio is the federation\'s civic-music-infrastructure made hands-on: a working tape machine, a working SSL-style console, a working Neumann mic — anyone in the corridor cohort can book the room and use them.',
  },
  {
    id: 'light-sanctuary',
    title: 'The Light Sanctuary',
    tagline: 'A chapel-of-light pavilion — solid concrete walls, programmed natural-light openings, no electricity, open dawn to dusk.',
    category: 'light',
    costBand: '$3M – $6M (plus $400K endowment)',
    siteCandidates: [
      { city: 'Palos Verdes', site: 'Portuguese Bend Reserve overlook', rationale: 'PV\'s topography + ecological-reserve depth + dark-sky access make it the natural light-sanctuary site. Edge instance — requires PV local Land.' },
      { city: 'Torrance', site: 'Madrona Marsh adjacent — a non-disruptive small-footprint addition', rationale: 'Vernal-pool ecology + brutalist-pavilion juxtaposition; existing Madrona Marsh foot traffic; lower-elevation site limits some light effects but adds wetland reflection.' },
      { city: 'El Segundo', site: 'Imperial Avenue dunes north of the existing overlook', rationale: 'Dune topography; LAX-flightpath programming opportunity (the sanctuary\'s light effects could integrate with LAX runway-25R approaches). Politically lowest friction.' },
    ],
    inspirations: [
      'Rothko Chapel, Houston (Philip Johnson + Mark Rothko, 1971) — non-denominational chapel-of-light, free admission, octagonal plan.',
      'Therme Vals quiet rooms (Peter Zumthor) — programmed-natural-light spatial vocabulary.',
      'Kimbell Art Museum, Fort Worth (Louis Kahn, 1972) — natural-light-on-concrete public art space, civic precedent.',
      'James Turrell Roden Crater (in progress, Arizona) — astronomical-naked-eye-coded light installation; the precedent for programmed-light civic instruments.',
      'Tadao Ando Church of Light, Osaka — concrete + cruciform light slot; small-scale light-architecture precedent.',
    ],
    programDescription: '40-foot square brutalist concrete pavilion, 18-foot ceilings. Three programmed natural-light openings: (1) east wall slot tracking sunrise from winter solstice through summer solstice, marking the year on the west floor; (2) skylight oculus tracking solar noon, marking the day on the floor; (3) west wall slot tracking sunset through the equinoxes. No electricity. No heating. No screens. One stone bench drawn from local granite, three sides of the chamber. Open dawn to dusk; closed at night. The walls are built so that the chamber is darkest at noon under the oculus — the moment of greatest light contrast. Quiet observance protocol: no audio above whisper; no photography after the first 90 days of opening (a federation policy choice).',
    curatorialCouncil: 'Two practicing light-artists + one practicing architect. Plus a Sanctuary Steward (volunteer, dawn-and-dusk hours; maintains the chamber\'s emptiness). Programming is light itself; the council shapes complement events (annual solstice gatherings, equinox sits) but does not program performances inside.',
    triggerConditions: [
      'Federation Commons ledger exceeds 600 receipts.',
      'Solar-trajectory engineering study ($75K, federation-funded).',
      'Quiet-protocol agreement with host-city (the Sanctuary requires explicit municipal acknowledgment that this is non-photography civic space after Day 90).',
      'Sanctuary Steward identified.',
    ],
    fundingPath: '~$700K federation Commons. ~$1.5-3M philanthropic match (Annenberg, Mellon, plus a lead Sanctuary sponsor — Rothko Chapel\'s funding model is the template). ~$300-500K from a small "100 Founders" tier ($5K each, lifetime priority access on solstice + equinox days, named brick in the entrance pavers). ~$400K endowment.',
    governance: 'Joint stewardship circle: federation delegates + Sanctuary Steward + curatorial council. Programming decisions are minimal — solstice and equinox gatherings, periodic quiet sits. Restoration decisions (the concrete weathers; the oculus seals require maintenance) sit with the stewardship circle.',
    horizons: [
      { year: 'Year 0-1', milestone: 'Federation council adopts. Solar-trajectory study. Architect competition (must include a solar-light specialist on each team).' },
      { year: 'Year 2-3', milestone: 'Construction.' },
      { year: 'Year 4', milestone: 'Open at the autumnal equinox. First photography-permitted period (90 days).' },
      { year: 'Year 4 + 90 days', milestone: 'Photography prohibition begins. The chamber becomes a non-image civic space.' },
      { year: 'Year 5+', milestone: 'Annual solstice + equinox gatherings.' },
      { year: 'Year 100', milestone: 'The concrete walls have weathered into the corridor\'s stone vocabulary. The light effects are unchanged. The chamber is older than any current visitor.' },
    ],
    precedentToCases: 'Polaroid solved instant photography by removing the wait-time between image capture and image. The Light Sanctuary inverts Polaroid: it removes the image entirely, after the first 90 days. The federation\'s thesis is that not-everything-must-be-imaged is itself civic infrastructure. A non-photography space is rare; the Sanctuary is the federation\'s commitment to keeping it.',
  },
  {
    id: 'light-tower',
    title: 'The Light Tower',
    tagline: 'A 90-foot brutalist beacon at the corridor\'s south anchor — programmed annual lighting cycles, navigable from offshore, free.',
    category: 'light',
    costBand: '$5M – $9M (plus $1M endowment)',
    siteCandidates: [
      { city: 'Redondo Beach', site: 'King Harbor breakwater terminus', rationale: 'Marine-navigation usefulness; existing harbor infrastructure; the beacon visible from Catalina, 26 mi southwest.' },
      { city: 'Palos Verdes', site: 'Point Vicente bluff (adjacent to existing Point Vicente Lighthouse)', rationale: 'Highest-elevation site; visibility extends to all four corridor cities + Catalina + the Channel Islands. Edge instance — requires PV local Land.' },
      { city: 'Manhattan Beach', site: 'Pier-end above the existing pier light', rationale: 'Strand-corridor-midpoint visibility; existing pier infrastructure. Politically: pier end is structurally constrained.' },
    ],
    inspirations: [
      'Point Vicente Lighthouse, Palos Verdes (1926) — operating civic light infrastructure; precedent for siting and durability.',
      'Long Beach Lighthouse / Lions Lighthouse — small civic light precedent.',
      'Cape Hatteras Light, NC — large-scale civic light infrastructure with 200-year-equivalent durability.',
      'Anish Kapoor\'s ArcelorMittal Orbit, London — observation tower precedent at civic scale, though not a beacon.',
      'Thomas Heatherwick\'s Bombay Sapphire pavilion or Vessel — programmable-light civic structures; both are partial precedents though the Light Tower is intentionally not photogenic-driven.',
    ],
    programDescription: '90-foot brutalist concrete tower, hexagonal plan, three internal stair flights to a top observation deck (no elevator; ADA-accessible ground-level vista platform). LED + traditional refractor lens at top — the beacon is functional marine navigation as well as civic instrument. Programmed annual cycle: white at solstices and equinoxes (4 nights), color-shifted on equinox + solstice eves, soft amber as default 360 nights/year. Programming submitted to USCG for navigation-compliance review. Open dawn to dusk for tower interior; beacon operates 24h. Top observation deck with the same analog instruments as the Ocean Tower (compass rose, tide clock, wind sock, marine spotting scope).',
    curatorialCouncil: 'Two practicing light-artists + one marine-navigation specialist (USCG-experienced). Plus a Beacon Steward (salaried part-time, manages annual programming + USCG coordination). The four programmed-color nights per year are the curatorial council\'s primary annual work.',
    triggerConditions: [
      'Federation Commons ledger exceeds 1,200 receipts.',
      'USCG approval of marine-navigation use + light-pollution-compliance plan.',
      'Coastal Commission permit (the principal regulatory hurdle).',
      'Lead lighthouse sponsor commitment of at least $3M.',
    ],
    fundingPath: '~$1.5M federation Commons. ~$3-5M philanthropic match (Annenberg, plus a lead Beacon sponsor). ~$500K-1M from "90 Founding Light Watchers" tier ($10-15K each, lifetime priority observation-deck access on solstice + equinox nights). ~$1M endowment.',
    governance: 'Joint stewardship circle: federation delegates + Beacon Steward + curatorial council + USCG liaison. Programming decisions sit with the curatorial council; navigation-compliance decisions sit with the Beacon Steward + USCG.',
    horizons: [
      { year: 'Year 0-1', milestone: 'Federation council adopts. USCG outreach. Coastal Commission permit campaign.' },
      { year: 'Year 2-3', milestone: 'Architect competition. Construction.' },
      { year: 'Year 4', milestone: 'Beacon lit at the autumnal equinox. First programmed cycle begins.' },
      { year: 'Year 5+', milestone: 'Annual cycle. Solstice + equinox observation-deck gatherings.' },
      { year: 'Year 100', milestone: 'The beacon has run continuously for 36,500+ nights. It is older than any current cohort member.' },
    ],
    precedentToCases: 'Bell Labs ran the Telstar satellite test in 1962 — the lab\'s public infrastructure proving that civic instruments can serve both functional purposes (communication relay) and cultural purposes (the world\'s first live transatlantic broadcast was Walter Cronkite at Telstar). The Light Tower carries Telstar\'s frame: it is functional navigation infrastructure AND civic-cultural instrument. The beacon serves both, never one at the expense of the other.',
  },
  {
    id: 'cinema-brutalist',
    title: 'The Cinema Brutalist',
    tagline: 'A small civic cinema — 200 seats, 16mm + 35mm + 4K digital projection, weekly free programming, brutalist-concrete house.',
    category: 'light',
    costBand: '$4M – $8M (plus $700K endowment)',
    siteCandidates: [
      { city: 'Torrance', site: 'Old Torrance / Sartori Avenue at El Prado', rationale: 'Walkable historic-downtown context; existing Torrance Theater (currently inactive) is architecturally adjacent and could be a partner site rather than competitor; Sartori Avenue\'s 1912 Pacific Electric heritage adds cultural depth.' },
      { city: 'Hermosa Beach', site: 'Pier-adjacent municipal lot', rationale: 'Pier Plaza density; complementary to Comedy & Magic Club; small-venue district forming.' },
      { city: 'El Segundo', site: 'Smoky Hollow industrial-transition lot', rationale: 'Industrial-vernacular context; lower land cost; existing post-industrial spaces have natural sound isolation.' },
    ],
    inspirations: [
      'Bay Theatre, Pacific Palisades (operating since 1948, restored 2018) — small civic cinema; restoration-and-civic-restitution precedent.',
      'Brattle Theatre, Cambridge MA (operating since 1953) — small civic cinema; 70-year operating history; programming-driven curatorial model.',
      'Anthology Film Archives, NYC — small-format archive + screening infrastructure, civic precedent.',
      'Hyde Park Theatre, Chicago — small civic cinema; non-profit operating model.',
      'New Beverly Cinema, LA — small civic cinema with strong programmatic identity.',
    ],
    programDescription: '200-seat single-screen cinema, raked floor, brutalist-concrete walls + ceiling, acoustic stone diffusers (drawn from local STONES). Projection booth equipped with 16mm Bauer + 35mm Kinoton + 4K Christie digital — three formats, three operators trained per format. Weekly free programming Sunday matinee + Tuesday evening + Thursday late. Other nights: $5-15 sliding-scale ticketed programming, member-priority. Permanent installed: a small lobby gallery rotating prints from the corridor STONES catalog + Art Library; a small reading-room with film-history reference materials, open during operating hours.',
    curatorialCouncil: 'Five practicing curators / programmers: one cinema historian, one experimental-film programmer, one international / world-cinema programmer, one documentary programmer, one corridor-resident programmer. Plus a Cinema Master (salaried, oversees the programming year, 5-year term).',
    triggerConditions: [
      'Federation Commons ledger exceeds 1,200 receipts.',
      'Lead Cinema sponsor commitment of at least $2M.',
      'Projector-equipment sourcing plan complete (16mm + 35mm machines are increasingly rare; sourcing is non-trivial).',
      'Cinema Master candidate identified.',
    ],
    fundingPath: '~$1M federation Commons. ~$2-4M philanthropic match (Annenberg, AFI partnership, Mellon, plus a lead Cinema sponsor). ~$500K-1M from "200 Founding Audiences" tier ($5-7.5K each, lifetime priority reservation, named seat). ~$500K-1M projector-and-equipment-grant via film-archive partnership. ~$700K endowment.',
    governance: 'Joint stewardship circle: federation delegates + Cinema Master + curatorial council + a Projection Steward (volunteer, manages the projection booth + format rotation). Pricing decisions sit with the stewardship circle; programming decisions sit with the curatorial council; format-rotation decisions sit with the Projection Steward.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts. Sponsor + projector-sourcing conversations.' },
      { year: 'Year 1-2', milestone: 'Site selection. Architect competition.' },
      { year: 'Year 3-4', milestone: 'Construction. Cinema Master appointed.' },
      { year: 'Year 5', milestone: 'Soft open. First curatorial season.' },
      { year: 'Year 6+', milestone: 'Weekly programming. Annual film-festival hosting (corridor-wide).' },
      { year: 'Year 50', milestone: 'The cinema has hosted ~12,500 screenings; the federation print + digital archive is among the deepest in the South Bay.' },
    ],
    precedentToCases: 'Polaroid\'s Cambridge laboratory developed the SX-70 in part because Edwin Land believed that imaging instruments belonged in the household, not the studio. The Cinema Brutalist is the federation\'s reciprocal commitment: cinema is communal, in a public-space architecture, in formats (16mm, 35mm) that are themselves the civic record. The household-camera + the civic-cinema together form the corridor\'s imaging culture.',
  },
  {
    id: 'art-library',
    title: 'The Art Library',
    tagline: 'A circulating-art lending library — paintings, prints, sculptures, ceramics borrowable for 3 months at a time, free.',
    category: 'art',
    costBand: '$3M – $6M (plus $800K endowment)',
    siteCandidates: [
      { city: 'Torrance', site: 'Cultural Arts Center adjacent (annex or interior wing)', rationale: 'TCAC infrastructure; cultural-arts staff continuity; the corridor\'s deepest existing public-arts institutional partnership.' },
      { city: 'Manhattan Beach', site: 'MB Library north annex', rationale: 'Library-system co-location simplifies operations; existing circulation infrastructure; MBPL has the corridor\'s mature library partnership precedent.' },
      { city: 'Redondo Beach', site: 'Riviera Village walkable downtown', rationale: 'Walkable-downtown civic concourse; merchant-neighbor cultural-anchor potential.' },
    ],
    inspirations: [
      'Newark Museum Art Lending Service (operating 1929-2016) — the canonical American precedent for circulating-art lending; demonstrating an 87-year operating history is feasible.',
      'Berkeley Public Library Art + Music (operating since 1962) — lending-art-from-public-libraries precedent, ongoing.',
      'Indianapolis Museum of Art Art Rental (operating since 1953) — museum-based art-rental precedent.',
      'Buenos Aires Art Lending Library, Argentina — international precedent for civic-scale art-lending.',
      'The University of El Segundo STONES Catalog — same operating principle (rotating loaned objects from a federated catalog).',
    ],
    programDescription: 'A 4,000-sq-ft library housing 1,500 lendable works at scale: 600 paintings + prints, 400 sculptures + ceramics, 300 textiles + fiber works, 200 photographs + works-on-paper. Circulation: 3-month loans, free to corridor cohort members + city library cardholders, $20 administrative fee for visitors per loan, max 2 works concurrent per borrower. Catalog is online (federation library schema), browseable by element, era, region, medium, size, sometimes color or theme. Submission process: artists submit work via curatorial-council review; selected works enter the catalog for 5-year terms (renewable). All works are insured by federation; damage protocol is no-fault for ordinary wear (collection budgets for 5% annual replacement). Opening hours: Tuesday-Saturday, 11am-6pm; Sundays 1-5pm; closed Mondays.',
    curatorialCouncil: 'Five practicing curators: one painting + works-on-paper, one sculpture + ceramics, one fiber + textile, one photography + new media, one corridor-resident artist. Plus an Art Librarian (salaried, manages catalog + circulation, 5-year term). The curatorial council reviews submissions quarterly.',
    triggerConditions: [
      'Federation Commons ledger exceeds 1,500 receipts.',
      'Initial collection of 100 works pledged (corridor artists, museum partners, donor collections).',
      'Circulation-insurance partnership formalized.',
      'Art Librarian candidate identified.',
    ],
    fundingPath: '~$800K federation Commons. ~$1.5-3M philanthropic match (Mellon, Ford, Knight, plus a lead Library sponsor). ~$500-800K from "300 Founding Borrowers" tier ($2-3K each, lifetime priority + named bookplate in 5 catalog works). ~$200-500K initial-collection in-kind via donations + museum-loan agreements. ~$800K endowment.',
    governance: 'Joint stewardship circle: federation delegates + Art Librarian + curatorial council + an Insurance Steward (volunteer, manages claims + risk). Catalog-curation sits with the curatorial council; circulation-policy sits with the stewardship circle; per-work damage-claim decisions sit with the Insurance Steward.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts. Initial collection-pledge campaign.' },
      { year: 'Year 1-2', milestone: 'Site selection. Construction. Catalog software build.' },
      { year: 'Year 3', milestone: 'Soft open. First 100 works in circulation.' },
      { year: 'Year 4', milestone: 'Public open. 500 works in circulation.' },
      { year: 'Year 7', milestone: 'Catalog hits 1,500-work scale.' },
      { year: 'Year 25', milestone: 'Approximately 100,000 individual circulation events have occurred. The federation knows what its members hang on their walls in a way no other institution does.' },
    ],
    precedentToCases: 'Bell Labs\' library was open to the public on weekdays — researchers from competing labs, journalists, and curious neighbors could access the lab\'s reference materials. The Art Library is the federation\'s civic-art reading-room made circulating: a public collection, accessible by reservation, lent to the corridor\'s households on a rotating basis. Art is not for the museum wall; art is for the home wall, on rotation, accessible by library card.',
  },
  {
    id: 'bell-garden',
    title: 'The Bell Garden',
    tagline: 'A bronze bell garden — 12 cast bells tunable to seasonal modes, struck by visitors, chimed by wind on equinoxes.',
    category: 'art',
    costBand: '$2M – $4M (plus $400K endowment)',
    siteCandidates: [
      { city: 'Hermosa Beach', site: 'Greenbelt midpoint', rationale: 'Linear-corridor visibility; corridor-midpoint accessibility; the Greenbelt\'s acoustic profile (bordered by residential streets, attenuated traffic noise) suits the bells\' tonal range.' },
      { city: 'Torrance', site: 'Madrona Marsh adjacent overlook', rationale: 'Vernal-pool ecology + bronze-bell juxtaposition; existing wildlife-observation foot traffic; bell sound carries across the wetland reflecting surface uniquely.' },
      { city: 'Palos Verdes', site: 'Portuguese Bend Reserve trail nexus', rationale: 'Highest-elevation acoustic profile; bell sound carries downhill; trail-walker accessibility; edge instance.' },
    ],
    inspirations: [
      'Boudhanath Stupa bells, Kathmandu — community-struck bronze prayer-bell tradition; civic-cultural precedent.',
      'Kyoto temple bell collections — bronze-bell-as-civic-instrument, 1,000+ year operating tradition.',
      'Whitechapel Bell Foundry, London — Western bell-casting tradition (operating 1570-2017); precedent for civic bronze infrastructure.',
      'Carillons of Belgium (St. Rombouts, Mechelen) — civic-scale bronze instrument operating 600+ years.',
      'The University of El Segundo STONES Catalog — federation\'s parallel rotating-tangible-object instrument.',
    ],
    programDescription: '12 cast-bronze bells suspended on a brutalist concrete frame, 80ft × 20ft footprint. Bells range from a 200-pound deepest bell to a 30-pound highest bell. Tuned to a flexible seasonal mode — the curatorial council retunes one bell per quarter to follow the corridor\'s seasonal acoustic profile (autumn equinox = pentatonic; winter solstice = harmonic minor; spring equinox = pentatonic; summer solstice = perfect mixolydian). Each bell has a hanging mallet attached by a 6-foot cord; visitors strike them. Equinox + solstice nights: a wind-actuated sail above the largest bell catches the prevailing wind and chimes it for 3 hours, recorded for the federation archive. Permanent stone benches (drawn from local granite) for listening. Open 24 hours; no entry fee; no staff.',
    curatorialCouncil: 'Three practicing musicians: one bell-tuner / carillonneur, one acoustic ecologist, one corridor-resident composer. Plus a Bell Steward (volunteer, manages the seasonal retuning ritual + bell-casting partnerships).',
    triggerConditions: [
      'Federation Commons ledger exceeds 800 receipts.',
      'Bell-foundry partnership (the original cast set + retuning capacity).',
      'Acoustic study confirming the site does not produce noise complaints from neighbors at the bells\' typical operating volume.',
      'Bell Steward identified.',
    ],
    fundingPath: '~$700K federation Commons. ~$1.5-2.5M philanthropic match. ~$300-500K from "12 Bell Sponsors" tier ($25-40K each, naming rights for one bell for 25 years). ~$300-500K bell-casting in-kind (foundry partnership). ~$400K endowment.',
    governance: 'Joint stewardship circle: federation delegates + Bell Steward + curatorial council. Seasonal-retuning decisions sit with the curatorial council; bell-recasting decisions (every ~30 years per bell) sit with the stewardship circle.',
    horizons: [
      { year: 'Year 0', milestone: 'Federation council adopts.' },
      { year: 'Year 1-2', milestone: 'Bell-casting. Site preparation. Acoustic study.' },
      { year: 'Year 3', milestone: 'Bells installed and tuned. Garden open.' },
      { year: 'Year 4+', milestone: 'Quarterly retuning ritual. Solstice + equinox wind-actuated chiming.' },
      { year: 'Year 30', milestone: 'First bell-recasting cycle (bronze fatigue).' },
      { year: 'Year 100', milestone: 'The bells have been struck approximately 1.5 million times. The audio archive of solstice + equinox chimings is the federation\'s longest continuous environmental-sound record.' },
    ],
    precedentToCases: 'Polaroid kept a copy of every test image of the SX-70 development in a vault — a deep-time visual record of the lab\'s thinking. The Bell Garden is the federation\'s acoustic vault: every solstice + equinox chime, recorded; every visitor strike, ambient-mixed; the audio record stretches across decades, deeper than any individual cohort\'s memory. The bells do not commemorate; the bells record. The recording is the civic act.',
  },
];

export const ART_FUNDING_NOTES = {
  totalScope: 'Eight art-coded Tier D works in this catalog, plus eight element-coded works in Giant Works, equals sixteen Tier D works specified for the federation. At a half-decade construction cadence, that is 80 years of build queue.',
  matchingPhilanthropy: 'The art Tier D works draw on the philanthropic-arts circle, which is a different funder ecosystem than the element-coded civic-infrastructure circle. The federation should pursue both in parallel rather than asking the same donors twice. Annenberg, Mellon, Ahmanson, Ford, Knight, Hewlett, MacArthur, the Doris Duke Charitable Foundation are art-Tier-D natural partners; the California Coastal Conservancy and federal infrastructure circles are element-Tier-D natural partners.',
  laBalanced: 'The 16-work catalog distributes across five candidate instances: ES (4 works hosted across 16), MB (3), HB (3), RB (3), Torrance (4). No single instance hosts more than four. The federation does not concentrate giant works in one host city.',
};

export const REFERENCES = [
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works*. UES-Federation-02. https://pointcast.xyz/giant-works' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'pointcast-cs', cite: 'University of El Segundo. (2026). *Corridor Strengths*. UES-Federation-03. https://pointcast.xyz/corridor-strengths' },
  { id: 'pointcast-tr', cite: 'University of El Segundo. (2026). *Torrance Instance*. UES-Fork-TR-04. https://pointcast.xyz/torrance' },
  { id: 'pointcast-stones', cite: 'University of El Segundo. (2026). *Stones Catalog*. https://pointcast.xyz/stones' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer' },
  { id: 'rothko-chapel', cite: 'Rothko Chapel. (Continuing). *Mission and Operations*. rothkochapel.org.' },
  { id: 'newark-art-lending', cite: 'Newark Museum. (1929-2016). *Art Lending Service Archive*. newarkmuseum.org.' },
  { id: 'tcac', cite: 'Torrance Cultural Arts Center. (Continuing). *Programs and the Armstrong Theatre*. torranceca.gov.' },
  { id: 'brattle', cite: 'Brattle Film Foundation. (Continuing). *Brattle Theatre Programming*. brattlefilm.org.' },
  { id: 'point-vicente', cite: 'Point Vicente Lighthouse. (1926-Continuing). *USCG Operating History*. uscg.mil.' },
  { id: 'whitechapel', cite: 'Whitechapel Bell Foundry. (1570-2017). *Bell Casting Tradition*. Historical archive, multiple sources.' },
  { id: 'sun-studio', cite: 'Sun Studio. (Continuing). *Memphis Music History*. sunstudio.com.' },
];

export const GWA_NOTES = {
  uesNote: 'Giant Works · Art is a prospective catalog, not a build schedule. Eight projects specified to extend Giant Works to a sixteen-work federation Tier D queue. Of the eight art-coded projects, the Audio Pavilion and the Art Library are the lowest-cost-of-failure first projects; the Concert Hall is the highest-cost most-complex; the Light Sanctuary is the most-philosophically-distinct. None are committed.',
  invitation: 'If you are a performing-arts presenter, classical-music institution, light-architecture practitioner, public-cinema curator, bell-foundry operator, art-lending-library historian, or a corridor cohort member who wants to help the federation council prioritize this art catalog, email mh@pointcast.xyz with subject line "Giant Works Art · {project-id}".',
};
