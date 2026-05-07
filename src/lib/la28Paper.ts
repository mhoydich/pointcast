/**
 * LA28 Forcing Function — UES-WP-2026-13.
 *
 * Three years out. The 2028 Los Angeles Olympics are the largest
 * civic-coordination event in Southern California's modern history.
 * Whether the federation acknowledges LA28 or not, it shapes the
 * federation's calendar: site permits move faster, philanthropic
 * dollars reorganize, host-city Parks departments become risk-averse,
 * the Coastal Commission accelerates some reviews and slows others.
 *
 * This paper maps the federation's sixteen Tier D works onto the
 * LA28 forcing function: which works the LA28 legacy circle could
 * accelerate, which works LA28 would warp, which works should be
 * defended from LA28 entirely. The federation has a working position
 * on LA28 by the end of this paper; it does not have one by default.
 */

export const PAPER_META = {
  title: 'LA28 Forcing Function',
  subtitle: 'How the 2028 Olympics shapes the federation\'s sixteen-work Tier D queue · UES Working Paper 2026-13',
  thesis: 'LA28 is three years from opening ceremonies. The federation faces a choice: ignore LA28 (the queue ships on its own cadence, slower, with no Olympic accelerant), partner with LA28 (some Tier D works move faster, some warp into Olympic-spectacle shape, some get axed), or selectively engage (specific works partner, specific works are defended from LA28 entirely, the federation council manages the boundary). This paper recommends the third path. Five Tier D works are LA28-aligned and should partner; six are LA28-neutral and should ship on their own cadence; five are LA28-anti-aligned and should be defended from any partnership conversation. The boundary itself is a federation product the council must own.',
  paperNumber: 'UES-WP-2026-13',
  date: '2026-05-07',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['LA28', 'Olympic legacy projects', 'civic infrastructure', 'parallel civic federation', 'University of El Segundo', 'Tier D', 'public-private partnership', 'venue siting'],
  relatedSurfaces: ['UES-Federation-02 Giant Works', 'UES-Federation-04 Giant Works · Art', 'UES-Federation-05 Federation Council Charter', 'UES-WP-2026-11 The Forkable Radius'],
};

export const LA28_CONTEXT = {
  openingCeremony: '2028-07-14 (estimated; LAOOC-final)',
  closingCeremony: '2028-07-30',
  paralympicsOpening: '2028-08-15',
  totalAthletes: 'approximately 11,000 Olympic + 4,400 Paralympic',
  totalEvents: 'approximately 30+ Olympic disciplines + 23 Paralympic disciplines',
  budgetTotal: '$6.9B operating budget per LAOOC May 2024 budget revision (no public infrastructure spend; LA28 is uniquely a "no new venues" Games)',
  southBayVenues: 'Beach volleyball at Santa Monica Pier (existing); skateboarding at Venice Skate Park (existing); marathon swimming and triathlon at Long Beach (~5 mi south of corridor); sailing at Long Beach harbor; soccer at LA Memorial Coliseum + Rose Bowl + SoFi (Inglewood, ~7 mi northeast of ES); rowing at Long Beach.',
  corridorVenues: 'No LA28 competition venues are sited within the four-Strand-frontage federation corridor (ES, MB, HB, RB). The closest competition venue is SoFi Stadium in Inglewood (soccer), approximately 7 miles northeast of El Segundo.',
  legacyProjects: 'LA28 is contractually committed to a Legacy Projects framework focused on (a) youth-sports infrastructure, (b) Olympic-route public art, (c) "no new venues" reusable-facility upgrade — distinct from venue construction. Legacy budget is partial-public partial-philanthropic.',
};

export const LEGACY_CIRCLE_FUNDERS = [
  { name: 'LA28 Legacy Foundation', focus: 'Olympic-route public art, youth sports facility upgrades, "Olympic Plaza" community gathering sites', engagementWindow: 'Open RFP cycles begin 2026 Q3; close 2027 Q2. Construction must complete by 2028 Q1 for any LA28-affiliated commission.' },
  { name: 'Annenberg Foundation', focus: 'Performing-arts infrastructure, Cultural Olympiad partnerships, public-art-in-public-spaces', engagementWindow: 'Annenberg has signaled LA28-cultural priority through 2027; standard RFP windows.' },
  { name: 'California Coastal Conservancy', focus: 'Coastal-access infrastructure, Olympic-route trail upgrades, beach-frontage public works', engagementWindow: 'CCC has accelerated coastal-access reviews for LA28-aligned projects; standard 12-month review compressed to 6 months for qualifying applications.' },
  { name: 'Mellon Foundation', focus: 'Public humanities + arts infrastructure, indigenous-land acknowledgment programming around LA28', engagementWindow: 'Mellon LA28 commitments through 2028 closing ceremonies.' },
  { name: 'Hewlett Foundation', focus: 'Civic-infrastructure capacity, Olympic-coordination governance', engagementWindow: 'Hewlett Olympic-Coordination Initiative active 2026-2029.' },
  { name: 'Knight Foundation', focus: 'Civic-tech infrastructure, public-art in transit corridors', engagementWindow: 'Knight LA28 Smart Cities Initiative active 2025-2028.' },
];

export const TIER_D_AGAINST_LA28 = {
  aligned: [
    { work: 'Bath House', alignment: 'STRONG — public bathing is an Olympic-cultural ritual (Beijing 2008, Tokyo 2020 both included municipal-bath cultural programs). LA28 Legacy Foundation has signaled openness to "civic gathering" infrastructure if construction completes by 2028 Q1.', risk: 'Construction-window pressure could force Hermosa pier-adjacent site over architecturally-superior alternatives. Architect competition timeline must not be compressed below 18 months.', recommendation: 'Partner with LA28 Legacy + Annenberg + Hewlett. Site decision locked in 2026 Q4 to allow 2027-2028 construction. Federation council retains program decisions; LA28 gets architectural opening-ceremony co-recognition.' },
    { work: 'Audio Pavilion', alignment: 'STRONG — Cultural Olympiad outdoor-music venues are a standard Olympic-legacy form (Sydney 2000, Atlanta 1996 both shipped permanent civic amphitheaters as legacy). MB Polliwog Park or Hawthorne Memorial Park sites both LA28-compatible.', risk: 'LA28-Cultural-Olympiad programming during the Games could require closing the venue to corridor cohort programming for 6+ weeks; the federation must reserve year-1 cohort programming time before signing.', recommendation: 'Partner with LA28 Cultural Olympiad + Annenberg + Mellon. Standard partnership; federation retains 70% programming weeks per year.' },
    { work: 'Light Tower', alignment: 'MODERATE — Olympic-route public-art commissions include programmable-light installations (Paris 2024 Eiffel Tower light show is the recent precedent). Redondo King Harbor breakwater is LA28-tourism-corridor-adjacent.', risk: 'LA28 may push for "Olympic Tower" branding or programmed Olympic-color cycles during the Games. The brutalist civic-instrument identity is at stake.', recommendation: 'Partner cautiously with LA28 Legacy + Annenberg. Federation retains all programmable-color decisions; LA28 gets one approved color sequence during the Games (closing-ceremony-eve only).' },
    { work: 'Cinema Brutalist', alignment: 'MODERATE — LA28 Cultural Olympiad film-programming circle is well-funded (Olympic-arts-festival precedent). Old Torrance Sartori Avenue site is LA28-tourism-corridor-adjacent.', risk: 'LA28 programming during the Games could displace cohort programming; LA28 may push for IMAX or large-format installation that warps the small-civic-cinema thesis.', recommendation: 'Partner with LA28 Cultural Olympiad + Mellon + Knight. Federation retains 16mm/35mm format requirement; LA28 gets one programming month during the Games.' },
    { work: 'Tide-Pool Restoration', alignment: 'STRONG — California Coastal Conservancy LA28-accelerated review window is the corridor\'s once-in-a-generation regulatory window. Esplanade rocks below Vista Drive overlook qualifies.', risk: 'CCC accelerated review compresses scientific-engineering review; ecosystem-seeding cycle (8 years) cannot be compressed for LA28 timeline. The accelerated permit is real; the construction acceleration is not.', recommendation: 'Partner with CCC + NOAA + LA28 Coastal Legacy. Use the CCC-accelerated permit window; do NOT compress the scientific-engineering or ecosystem-seeding cycles. Permit by 2027; construction begins 2028; ecosystem matures 2036+.' },
  ],
  neutral: [
    { work: 'Stone Garden', alignment: 'NEUTRAL — LA28 funders have no specific stone-garden interest; museum partnerships (LACMA, NHM, Petersen) are unaffected by Olympic timing.', risk: 'LA28-adjacent rush could degrade the catalog-rotation curatorial process. Trigger-condition discipline matters more here than Olympic timing.', recommendation: 'Ship on federation cadence. No LA28 partnership conversation. Annenberg/Mellon partnerships proceed normally outside the LA28 frame.' },
    { work: 'Geothermal Pool', alignment: 'NEUTRAL — Construction timeline (3M drilling + 6M building) cannot complete by 2028 Q1 even with LA28 acceleration. AES site redevelopment is its own multi-decade timeline.', risk: 'LA28 Legacy may try to badge a partial-completion "Olympic Geothermal Plaza" at the AES site; the federation must refuse — a half-built pool is not an Olympic legacy.', recommendation: 'Ship on federation cadence. Decline LA28 partnership; the work is structurally too long for the LA28 window.' },
    { work: 'Wind Garden', alignment: 'NEUTRAL — LA28 has no specific wind-art interest; Anthony Howe / Ned Kahn artist-commission cycles are independent of LA28.', risk: 'LA28-Coastal-Commission accelerated review could be used opportunistically here; this is more permission than partnership and is appropriate to use.', recommendation: 'Ship on federation cadence. Use CCC-accelerated review window if available; no LA28-Legacy partnership conversation.' },
    { work: 'Recording Studio', alignment: 'NEUTRAL — Equipment sourcing (Studer A800, vintage outboard) is unrelated to LA28. Hawthorne Beach Boys cultural-heritage anchor is LA28-incidental but not LA28-required.', risk: 'LA28-Cultural-Olympiad may try to commission "Olympic theme song" recording sessions; federation must reserve cohort-priority booking.', recommendation: 'Ship on federation cadence. No LA28 partnership; Annenberg/Mellon arts-recording partnerships proceed normally.' },
    { work: 'Art Library', alignment: 'NEUTRAL — Newark Lending precedent (1929-2016) is multi-decade civic infrastructure unrelated to Olympic cycles. LA28 has no specific art-lending-library interest.', risk: 'LA28-Cultural-Olympiad may try to badge an "Olympic Art Library" exhibition wing; federation declines.', recommendation: 'Ship on federation cadence. Mellon/Ford/Knight partnerships proceed normally outside LA28 frame.' },
    { work: 'Bell Garden', alignment: 'NEUTRAL — Bell-foundry partnerships and bronze-casting timelines are unrelated to LA28.', risk: 'LA28-Cultural-Olympiad may try to commission "Olympic Bells" tuning. Federation council retains all retuning decisions.', recommendation: 'Ship on federation cadence. No LA28 partnership.' },
  ],
  antiAligned: [
    { work: 'Light Sanctuary', alignment: 'ANTI — the photography-prohibited-after-Day-90 protocol is fundamentally incompatible with LA28-tourism-photography expectations. The civic-quiet identity cannot survive Olympic-spectacle co-recognition.', risk: 'LA28 partnership would force photography permission, programmed-color celebration nights, or Olympic-branded openings — each would destroy the work.', recommendation: 'DEFEND. No LA28 partnership conversation. Specifically refuse any LA28-Legacy or LA28-Cultural funding. Annenberg/Rothko-precedent-foundation partnerships only, on federation terms.' },
    { work: 'Concert Hall', alignment: 'ANTI — the small-civic 350-seat free-or-near-free programming is fundamentally incompatible with Olympic-spectacle scale. LA28 would push toward 1,000+ seats, ticketed pricing, donor-driven programming.', risk: 'LA28 partnership warps the entire thesis. The Concert Hall becomes Disney Hall South; the federation loses its anti-precedent.', recommendation: 'DEFEND. No LA28 partnership. Annenberg/Mellon partnerships only, on federation terms (350-seat cap, sliding-scale pricing, curatorial-council programming retention).' },
    { work: 'Dark-Sky Observatory', alignment: 'ANTI — the monthly Dark Hour requires negotiated lighting reduction with the host city. LA28 lighting-coordination is going in the opposite direction (Olympic Plaza lighting, route-illumination upgrades, broadcasting lighting compliance).', risk: 'LA28 partnership would compromise the Dark Hour thesis structurally; the negotiated lighting reduction is impossible during Olympic operations.', recommendation: 'DEFEND. No LA28 partnership. Specifically: target operational opening AFTER 2028 closing ceremonies, not before. Caltech/Mt. Wilson partnerships only.' },
    { work: 'Fire Pavilion', alignment: 'ANTI — air-quality compliance during LA28 will be elevated; permanent open-fire civic infrastructure is at risk of LA28-period closure orders. The Olympic Cauldron framing is also a category-mismatch (the Pavilion is a continuity-flame, not a spectacle-flame).', risk: 'LA28 may demand temporary closure for air-quality compliance; LA28-Cultural may try to co-recognize the Pavilion as an "Olympic Flame Companion" — both would damage the work.', recommendation: 'DEFEND. Target operational opening AFTER 2028 (the air-quality-permit conversation is much easier in 2029 than in 2027).' },
    { work: 'Ocean Tower', alignment: 'ANTI — the 70-foot brutalist civic-instrument identity is at risk of Olympic-sightline-platform co-option. LA28 broadcasters may demand camera-tower modifications during the Games.', risk: 'LA28 partnership compromises the architectural language; brutalist concrete becomes spectacle architecture; the no-elevator accessibility-equity choice may be challenged.', recommendation: 'DEFEND. Ship on federation cadence; if construction overlaps LA28, refuse all broadcaster-platform modifications.' },
  ],
};

export const FEDERATION_POSITION = {
  partnerWith: 'LA28 Legacy Foundation, Annenberg, Mellon, Hewlett, Knight, California Coastal Conservancy, NOAA — on the five aligned works (Bath House, Audio Pavilion, Light Tower, Cinema Brutalist, Tide-Pool Restoration), under explicit federation-council-retains-program-decisions terms.',
  declineFor: 'The six neutral works (Stone Garden, Geothermal Pool, Wind Garden, Recording Studio, Art Library, Bell Garden) — partnerships proceed via standard arts/civic-infrastructure circles outside the LA28 frame.',
  defendFrom: 'The five anti-aligned works (Light Sanctuary, Concert Hall, Dark-Sky Observatory, Fire Pavilion, Ocean Tower) — explicit LA28 partnership refusal. Two of the five (Dark-Sky Observatory, Fire Pavilion) should target post-2028 operational opening to avoid the Olympic permit/operating window entirely.',
  whoOwnsTheBoundary: 'The federation council. The boundary between aligned, neutral, and anti-aligned is not a one-time analysis; it requires ongoing maintenance as LA28 program evolves. The council reviews the boundary annually at the autumnal-equinox meeting.',
};

export const TIMELINE = [
  { year: '2026 Q3', milestone: 'LA28 Legacy Foundation opens RFP cycles. Federation council should be formed by this date to respond.' },
  { year: '2026 Q4', milestone: 'Federation Council Charter ratified (UES-Federation-05). LA28 partnership decisions go through the council, not individual instances.' },
  { year: '2027 Q1', milestone: 'Bath House site selection locked. CCC Tide-Pool permit application filed.' },
  { year: '2027 Q2', milestone: 'LA28 Legacy Foundation RFP cycles close. Aligned works submit; defended works do not engage.' },
  { year: '2027 Q3-Q4', milestone: 'Architect competitions for Bath House, Audio Pavilion, Light Tower. Cinema Brutalist site work begins.' },
  { year: '2028 Q1', milestone: 'Bath House construction phase 1 complete. Audio Pavilion construction. CCC permit cleared for Tide-Pool.' },
  { year: '2028 Q2', milestone: 'Bath House soft opening (LA28-aligned). Light Tower beacon lit (LA28-co-recognized closing-ceremony-eve color sequence).' },
  { year: '2028 Q3 (Games)', milestone: 'Bath House, Audio Pavilion, Light Tower, Cinema Brutalist all in operation. Defended works (Light Sanctuary, Concert Hall, etc.) NOT in operation.' },
  { year: '2028 Q4', milestone: 'Post-Games audit. Boundary review at autumnal-equinox council meeting.' },
  { year: '2029-2030', milestone: 'Defended-works construction window opens (Light Sanctuary, Concert Hall, Dark-Sky Observatory, Fire Pavilion, Ocean Tower). Tide-Pool ecosystem continues maturing through 2036.' },
];

export const REFERENCES = [
  { id: 'la28-budget', cite: 'LA28 Olympic Organizing Committee. (2024). *Budget Revision May 2024*. la28.org/budget.' },
  { id: 'la28-legacy', cite: 'LA28 Olympic Organizing Committee. (Continuing). *Legacy Projects Framework*. la28.org/legacy.' },
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works*. UES-Federation-02. https://pointcast.xyz/giant-works' },
  { id: 'pointcast-giant-art', cite: 'University of El Segundo. (2026). *Giant Works · Art*. UES-Federation-04. https://pointcast.xyz/giant-works-art' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council' },
  { id: 'ccc', cite: 'California Coastal Commission. (2025). *LA28 Accelerated Review Window Guidance*. coastal.ca.gov.' },
  { id: 'annenberg-la28', cite: 'Annenberg Foundation. (2024). *LA28 Cultural Initiatives Funding Priority*. annenberg.org/la28.' },
  { id: 'mellon-la28', cite: 'Mellon Foundation. (2024). *LA28 Public Humanities Commitment*. mellon.org/la28.' },
  { id: 'sydney-2000', cite: 'Sydney Olympic Organizing Committee. (2001). *Olympic Legacy: Cultural Olympiad Outdoor Venues*. Historical analysis, multiple sources.' },
  { id: 'paris-2024-light', cite: 'Paris 2024 Olympic Organizing Committee. (2024). *Olympic-Route Public Art and the Eiffel Tower Light Programming*. Multiple sources.' },
];

export const PAPER_NOTES = {
  uesNote: 'This paper takes a position. The federation\'s default in the absence of this paper is to either ignore LA28 entirely (slow ship, no acceleration) or partner indiscriminately (fast ship, identity warp). Neither serves the federation. The recommendation is selective engagement under explicit boundary maintenance, owned by the federation council.',
  invitation: 'If you are LA28 Legacy Foundation staff, an Annenberg / Mellon / Hewlett / Knight program officer, a Coastal Commission counsel, or a federation council prospective delegate who wants to discuss specific work alignments, email mh@pointcast.xyz with subject line "LA28 · {work-id}". The boundary is negotiable per work; the principle of council-owned boundaries is not.',
};
