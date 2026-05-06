/**
 * Nature Practice — UES Track 10. The Local-Nature-Architecture-Practice Pathway.
 *
 * Bridges the natural-environment tracks (Marine Layer/air, Geology/earth,
 * Ocean Wing/water, Fire forthcoming) with the built-environment work
 * (Common Forms civic architecture). The pathway is a 12-month
 * curriculum: monthly observational walks, twelve native species mastered,
 * one architectural intervention designed and proposed at the end.
 */

export const TRACK_META = {
  title: 'Nature Practice',
  subtitle: 'UES Track 10 · The Local-Nature-Architecture-Practice Pathway',
  thesis: 'A 12-month pathway. Each month a single native species, a single observational walk, and a single architectural question — what would it look like to build with this species, this slope, this sun? At the end of twelve months, the cohort member proposes one small civic-architecture intervention drawn from the year of attention. The pathway is the bridge between Marine Layer\'s atmospheric attention, Geology\'s subterranean attention, and Common Forms\' built-environment ambition.',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  paperNumber: 'UES-Track-10',
  date: '2026-05-06',
};

export const PRINCIPLES = [
  'One species per month. Twelve in a year. Mastery through restraint, not breadth.',
  'Build with the grain. The marine layer wants overhangs; the southwest sun wants thick walls; the sandy substrate wants light foundations. Design follows the local condition, not the catalog.',
  'Plant before pour. A pollinator garden precedes a pavilion. The native palette is the architectural site preparation.',
  'Walk the parcel monthly. Architecture without monthly walking is corporate; architecture with monthly walking is local.',
  'Photograph the same view twelve times. The annual photo-essay of one chosen vantage is the cohort member\'s receipt for the year.',
  'A proposal is an end, not a credential. The 12-month proposal can be a bench. It does not need to be a pavilion.',
];

export type NativeSpecies = {
  month: number; common: string; latin: string;
  family: string; habitat: string; bloomSeason: string;
  uesUseCase: string; commonsCommission?: string;
};

export const TWELVE_SPECIES: NativeSpecies[] = [
  { month:1, common:'Coastal sage scrub', latin:'Artemisia californica', family:'Asteraceae', habitat:'Open slopes, coastal bluffs; the dominant aromatic shrub of the radius south', bloomSeason:'Aug–Oct', uesUseCase:'Marine Layer Week 02 (Powerline Walk) — the dominant olfactory of the easement; brush a leaf and hold the smell for the duration of the box-breath cycle.' },
  { month:2, common:'California buckwheat', latin:'Eriogonum fasciculatum', family:'Polygonaceae', habitat:'Coastal scrub, dunes; abundant inside the radius', bloomSeason:'Apr–Sep', uesUseCase:'Larval host plant for the El Segundo Blue butterfly. Common Forms commission B1 (pollinator garden) is anchored by buckwheat.', commonsCommission:'B1' },
  { month:3, common:'Seacliff buckwheat', latin:'Eriogonum parvifolium', family:'Polygonaceae', habitat:'Coastal bluffs and stabilized dunes', bloomSeason:'Year-round (peak Jul–Oct)', uesUseCase:'The actual host plant of the federally-endangered ES Blue. Imperial Avenue Dunes overlook reads with this species literally underfoot.', commonsCommission:'A6' },
  { month:4, common:'California poppy', latin:'Eschscholzia californica', family:'Papaveraceae', habitat:'Disturbed slopes; everywhere in spring', bloomSeason:'Mar–Jun', uesUseCase:'The single most photographed wildflower of the radius. State flower since 1903; the painterly orange explosion every March.' },
  { month:5, common:'Toyon', latin:'Heteromeles arbutifolia', family:'Rosaceae', habitat:'Chaparral hillsides; the canonical "Hollywood" namesake', bloomSeason:'Jun–Aug (berries Nov–Jan)', uesUseCase:'A keystone evergreen for hilltop architecture. The red winter berries are the architectural ornament you do not pay for.' },
  { month:6, common:'Lemonadeberry', latin:'Rhus integrifolia', family:'Anacardiaceae', habitat:'Coastal sage scrub; abundant on bluffs', bloomSeason:'Feb–Apr', uesUseCase:'Drought-hardy hedge species. Reads architectural at three feet high; reads windbreak at six.' },
  { month:7, common:'Black sage', latin:'Salvia mellifera', family:'Lamiaceae', habitat:'South-facing slopes; sun-baked', bloomSeason:'Apr–Jul', uesUseCase:'Pollinator-magnet; one of three salvia species the Honey League season-zero ladders against.' },
  { month:8, common:'White sage', latin:'Salvia apiana', family:'Lamiaceae', habitat:'Disturbed slopes, coastal sage scrub', bloomSeason:'May–Jul', uesUseCase:'A cultural plant under increasing harvest pressure. The cohort\'s position: plant it, do not gather it from the wild.' },
  { month:9, common:'Coast live oak', latin:'Quercus agrifolia', family:'Fagaceae', habitat:'Riparian and inland; less common right at the coast', bloomSeason:'Acorns Sep–Nov', uesUseCase:'The architectural keystone tree of the radius. A Coast Live Oak is the slowest furniture you will own. Plan a two-hundred-year crown.' },
  { month:10, common:'Sycamore (California)', latin:'Platanus racemosa', family:'Platanaceae', habitat:'Streambeds, riparian corridors', bloomSeason:'Spring leaves emerging Mar–Apr; bark year-round', uesUseCase:'The ghost-bark tree. The white-mottled trunk is the architectural sculpture you do not commission.' },
  { month:11, common:'Catalina cherry', latin:'Prunus ilicifolia ssp. lyonii', family:'Rosaceae', habitat:'Channel Islands native; cultivated mainland', bloomSeason:'Apr–May (fruit Aug–Oct)', uesUseCase:'A 25-foot evergreen with edible cherries. A small pavilion shaded by Catalina cherry is its own piece of theater.' },
  { month:12, common:'California fan palm', latin:'Washingtonia filifera', family:'Arecaceae', habitat:'Desert oases native; the only true California native palm', bloomSeason:'Jun–Aug', uesUseCase:'The native palm. Most "palms of LA" are introduced Mexican fan palms (W. robusta); the California native is fatter, slower, more architectural. Plant for centuries.' },
];

export type ObservationalWalk = {
  month: number; route: string; pacing: string;
  observe: string; capture: string; uesProgram: string;
};

export const TWELVE_WALKS: ObservationalWalk[] = [
  { month:1, route:'Powerline easement → Plaza El Segundo → Imperial overlook', pacing:'90 min slow walk', observe:'Coastal sage scrub aromatic intensity (early month); first flush of black sage growth (late month).', capture:'One photo of the same plant on the first and last walk of the month.', uesProgram:'Marine Layer Week 02' },
  { month:2, route:'Library Park → Recreation Park → Hilltop Park', pacing:'120 min loop', observe:'California buckwheat — sites in the radius where it grows wild vs. landscaped.', capture:'A monthly buckwheat census: count of distinct buckwheat plants observed.', uesProgram:'Honey League · Common Forms B1' },
  { month:3, route:'Imperial overlook → LAX dunes preserve perimeter', pacing:'60 min observational; do not enter the preserve', observe:'Seacliff buckwheat in flower; ES Blue butterfly emergence (mid-month if conditions).', capture:'A single ES Blue butterfly photograph or honest report of "did not see one this month."', uesProgram:'Geology · ES Blue habitat · Marine Layer Week 03' },
  { month:4, route:'Recreation Park → wildflower belt south of El Segundo Blvd', pacing:'45 min', observe:'California poppy fields; orange-density mapping by tenths-of-an-acre.', capture:'A six-photograph series along a single 100m transect at noon.', uesProgram:'Marine Layer · seasonal flagship' },
  { month:5, route:'Palos Verdes Peninsula trails (Portuguese Bend)', pacing:'180 min hike', observe:'Toyon hillsides; mature trees vs. recovery from prior fire scars.', capture:'One panorama of a south-facing toyon slope and one of a north-facing.', uesProgram:'Geology · Palos Verdes uplift terraces' },
  { month:6, route:'Vista del Mar bluffs walking south from Dockweiler', pacing:'120 min', observe:'Lemonadeberry hedges along bluff edge; active sea-cliff retreat features.', capture:'A photo of any new bluff-edge fissures since the prior month\'s walk.', uesProgram:'Geology · sea-cliff retreat · Common Forms B3' },
  { month:7, route:'Recreation Park → Library Park → return via Main Street', pacing:'90 min', observe:'Black sage in bloom; pollinator activity (bee and hummingbird counts).', capture:'A 5-minute pollinator count at one black sage stand.', uesProgram:'Honey League · pollinator infrastructure' },
  { month:8, route:'Hilltop Park → Powerline easement → return', pacing:'60 min', observe:'White sage stands; document harvest pressure (cut stems, tracks).', capture:'Photograph any harvest evidence found, with date stamp.', uesProgram:'Civic Layer · Coastal Commission stewardship · cultural-plant ethics' },
  { month:9, route:'Sycamore Grove or Kenneth Hahn State Recreation Area', pacing:'150 min', observe:'Coast live oak acorn drop; squirrel and acorn-woodpecker activity.', capture:'A handful of acorns in the photograph; do not remove from the site.', uesProgram:'Geology · Pleistocene oak-savanna ecology' },
  { month:10, route:'Ballona Creek riparian corridor → Ballona Wetlands edge', pacing:'180 min', observe:'California sycamore mottled-bark trunks; the surviving riparian corridor of the LA River pre-1928.', capture:'A bark-detail photograph framed at one square foot scale.', uesProgram:'Geology · Ballona Wetlands estuarine sediment' },
  { month:11, route:'A nursery field trip — Theodore Payne Foundation, Sun Valley', pacing:'180 min off-radius (~25 mi)', observe:'Catalina cherry availability; nursery practice for native landscaping.', capture:'A receipt for one Catalina cherry purchased and planted in your own yard or shared cohort plot.', uesProgram:'Honey League · Common Forms B1 nursery sourcing' },
  { month:12, route:'Anza-Borrego or Joshua Tree National Park (off-radius pilgrimage)', pacing:'1–2 day field trip', observe:'California fan palms in their native oasis context.', capture:'A panorama of a palm oasis. The pilgrimage is annual; the photograph is the receipt.', uesProgram:'Geology · Mojave volcanic field · the radius edge' },
];

export const ARCHITECTURE_PRINCIPLES = [
  'Build with the marine layer, not against it. Overhangs east-and-west; the building must read in 95% humidity.',
  'Build with the southwest sun. Thick walls or shaded breezeways on the southwest face; the radius overheats from May to October.',
  'Build with the sandy substrate. Light foundations, not deep ones. Pleistocene aeolian sand carries weight differently than continental bedrock.',
  'Build with the wind direction. Onshore in the afternoon; onshore-veering-offshore at night. The chimney goes on the leeward face.',
  'Build with the local palette before the imported palette. Sage grey, buckwheat pink, oak shadow, fog white, sand cream, refinery rust at the horizon.',
  'Build for the year-round 58–66°F water. Outdoor showers run cold; design accordingly.',
  'Build for the El Segundo Blue. If your project is inside the dune habitat, the butterfly is the architect.',
];

export const PROPOSAL_FORMAT = {
  duration: '12 months of monthly walks + one written proposal at month 13',
  proposalLength: '~1500 words',
  proposalSections: [
    'The chosen site (one specific parcel inside the 25-mile radius)',
    'The chosen species (one of the twelve mastered, or a documented substitute)',
    'The chosen practice (the one you walked at this site every month for a year)',
    'The architectural ask (one small intervention — bench, sign, deck, garden, marker — at one specific location)',
    'The Common Forms tier and cost band the proposal would fall into',
    'The trigger condition (what would have to be true for this to be built)',
    'Twelve photographs (one per month) of the chosen vantage',
  ],
  cohortReview: 'The proposal is reviewed by the Marine Layer cohort at one of the regular sit cycles. Approved proposals enter the Common Forms wishlist as new commissions. Declined proposals are filed publicly as honest no-builds.',
};
