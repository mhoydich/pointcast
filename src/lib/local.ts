/**
 * Local-data constants for the 100-mile lens. Shared between the
 * human-facing `/local` page and the agent-facing `/local.json` mirror
 * so both surfaces stay in sync — editing one place updates both.
 *
 * Per Mike 2026-04-19 morning directive ("think local, 100 mile radius")
 * and Block 0282's broadcast-arc roadmap.
 */
import type { CollectionEntry } from 'astro:content';

/** El Segundo Rec Park is the anchor point for distance computations. */
export const ANCHOR = {
  name: 'El Segundo',
  coords: { latitude: 33.9192, longitude: -118.4165 },
} as const;

export const RADIUS_MILES = 100;
export const RADIUS_METERS = 160934;  // 100 mi in meters, for schema.org GeoCircle

/** Mike's verbatim list of ES institutions (Block 0276, 2026-04-18 chat). */
export type NameDrop = { name: string; kind: string; one: string };
export const NAME_DROPS: NameDrop[] = [
  { name: 'El Segundo Brewing',  kind: 'taproom',       one: 'Main St. The one brewed-here beer everyone asks about.' },
  { name: 'Recreation Park',     kind: 'park · courts', one: 'Pickleball league HQ, grass, picnic shelters, the hill.' },
  { name: 'Standard Station',    kind: 'filling',       one: 'Weird-hours gas + a vibe. Everyone knows Standard.' },
  { name: "Big Mike's",          kind: 'sandwiches',    one: 'Deli that does it the way the town likes it.' },
  { name: "Vinny's",             kind: 'italian',       one: 'Ceiling-tiles red-sauce. The Friday night play.' },
  { name: "Ginger's",            kind: 'breakfast',     one: 'The weekend-morning answer. No website, no reservation.' },
  { name: 'Pickleball League',   kind: 'community',     one: 'Courts at Rec Park, drills Thursday, tournaments Sundays.' },
];

export type NatureNote = {
  slug: string;
  name: string;
  scientific?: string;
  kind: 'plant' | 'pollinator' | 'habitat';
  season: string;
  signal: string;
  localRead: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type NatureOverviewArea = {
  slug: 'ocean' | 'flora' | 'trees' | 'wildlife';
  label: string;
  title: string;
  share: number;
  color: string;
  summary: string;
  signals: string[];
};

export const NATURE_OVERVIEW_AREAS: NatureOverviewArea[] = [
  {
    slug: 'ocean',
    label: 'Ocean',
    title: 'Pacific shoreline',
    share: 36,
    color: '#1f7a8c',
    summary:
      'The west edge is surf, marine layer, salt air, beach sand, and nearshore birds. It sets the weather and the tempo for the whole local nature register.',
    signals: ['surf line', 'morning fog', 'gulls and pelicans', 'offshore marine life'],
  },
  {
    slug: 'flora',
    label: 'Flora',
    title: 'Dune plants',
    share: 27,
    color: '#ba7517',
    summary:
      'Seacliff buckwheat, beach suncups, deerweed, coyote brush, and other coastal scrub plants make El Segundo nature legible close to the ground.',
    signals: ['seacliff buckwheat', 'beach suncups', 'deerweed', 'coastal scrub'],
  },
  {
    slug: 'trees',
    label: 'Trees',
    title: 'Wind-shaped canopy',
    share: 21,
    color: '#3b6d11',
    summary:
      'The exposed dune edge is more scrub than woodland, while streets, parks, and yards carry shade, nesting structure, and human-scale refuge.',
    signals: ['park shade', 'street canopy', 'yard edges', 'bird perches'],
  },
  {
    slug: 'wildlife',
    label: 'Wildlife',
    title: 'Small but active',
    share: 16,
    color: '#534ab7',
    summary:
      'The signature species is the endangered El Segundo blue butterfly, with shorebirds, seabirds, lizards, pollinators, and occasional marine mammals in the broader coastal pass.',
    signals: ['El Segundo blue', 'shorebirds', 'lizards', 'pollinators'],
  },
];

/**
 * El Segundo nature signals: dune plants, one signature pollinator, and
 * the coastal habitat grammar around LAX / Dockweiler / the South Bay.
 * Sources are intentionally exposed in /local.json for agent readers.
 */
export const NATURE_NOTES: NatureNote[] = [
  {
    slug: 'seacliff-buckwheat',
    name: 'Seacliff buckwheat',
    scientific: 'Eriogonum parvifolium',
    kind: 'plant',
    season: 'summer bloom',
    signal: 'Cream-pink flowerheads on sandy bluffs and restored dunes.',
    localRead: 'The anchor plant: El Segundo blue larvae feed in buckwheat flowerheads, so more buckwheat means more possible butterfly.',
    sourceLabel: 'U.S. Fish & Wildlife Service',
    sourceUrl: 'https://www.fws.gov/story/2020-05/saving-socals-rarest-butterflies',
  },
  {
    slug: 'el-segundo-blue',
    name: 'El Segundo blue',
    scientific: 'Euphilotes allyni',
    kind: 'pollinator',
    season: 'summer flight',
    signal: 'Small blue butterflies moving low over buckwheat, mostly in protected dune habitat.',
    localRead: 'The town-name species. Treat it like a broadcast from the dunes: watch from paths, leave habitat alone.',
    sourceLabel: 'Xerces Society',
    sourceUrl: 'https://xerces.org/endangered-species/species-profiles/at-risk-butterflies-moths/el-segundo-blue',
  },
  {
    slug: 'beach-suncups',
    name: 'Beach suncups',
    scientific: 'Camissoniopsis cheiranthifolia',
    kind: 'plant',
    season: 'spring to summer',
    signal: 'Low yellow flowers tucked into open sand.',
    localRead: 'A small dune flash: the kind of plant you miss if you scan for trees instead of reading the ground.',
    sourceLabel: 'LAX Dunes garden tour',
    sourceUrl: 'https://www.2022.nativeplantgardentour.org/30-the-lax-dunes/',
  },
  {
    slug: 'deerweed',
    name: 'Deerweed',
    scientific: 'Acmispon glaber',
    kind: 'plant',
    season: 'spring bloom',
    signal: 'Fine green stems, yellow pea flowers, seed pods later.',
    localRead: 'Restoration workhorse. It reads humble, but it helps rebuild a plant community in tired sand.',
    sourceLabel: 'LAX Dunes garden tour',
    sourceUrl: 'https://www.2022.nativeplantgardentour.org/30-the-lax-dunes/',
  },
  {
    slug: 'coyote-brush',
    name: 'Coyote brush',
    scientific: 'Baccharis pilularis',
    kind: 'plant',
    season: 'late-season structure',
    signal: 'Rounded coastal scrub, evergreen mass, pale seed fluff when it goes.',
    localRead: 'The background note of coastal scrub: shelter, pollen, edge habitat, and wind-proof structure.',
    sourceLabel: 'CNPS South Coast',
    sourceUrl: 'https://sccnps.org/local-plants-suitable-for-gardening/',
  },
  {
    slug: 'lax-dunes',
    name: 'LAX dunes',
    kind: 'habitat',
    season: 'all year',
    signal: 'One of the last big fragments of the old coastal dune system beside the runways.',
    localRead: 'El Segundo nature is not wilderness over there; it is a protected remnant, still speaking through sand, buckwheat, and repair.',
    sourceLabel: 'Native Plant Garden Tour',
    sourceUrl: 'https://www.2022.nativeplantgardentour.org/30-the-lax-dunes/',
  },
];

export type NativePlantPick = {
  slug: string;
  name: string;
  scientific: string;
  form: 'groundcover' | 'perennial' | 'shrub' | 'tree';
  place: string;
  why: string;
  caution?: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const NATIVE_PLANTING_PALETTE: NativePlantPick[] = [
  {
    slug: 'seacliff-buckwheat',
    name: 'Seacliff buckwheat',
    scientific: 'Eriogonum parvifolium',
    form: 'shrub',
    place: 'Sunny coastal edge, sandy strip, or dry front yard.',
    why: 'Pollinator magnet and the strongest symbolic link to the El Segundo blue.',
    caution: 'Best treated as habitat planting, not a clipped ornamental.',
    sourceLabel: 'CNPS coastal native garden',
    sourceUrl: 'https://www.cnps.org/gardening/the-coastal-native-garden-5526',
  },
  {
    slug: 'beach-suncups',
    name: 'Beach suncups',
    scientific: 'Camissoniopsis cheiranthifolia',
    form: 'groundcover',
    place: 'Open sandy pocket, parkway edge, or low pot with fast drainage.',
    why: 'Low yellow bloom that keeps the dune register close to the ground.',
    sourceLabel: 'CNPS South Coast plant list',
    sourceUrl: 'https://chapters.cnps.org/southcoast/2024/10/07/ca-native-plants-for-the-s-ca-habitat-garden/',
  },
  {
    slug: 'deerweed',
    name: 'Deerweed',
    scientific: 'Acmispon glaber',
    form: 'perennial',
    place: 'Dry slope, sandy border, or restoration patch that can look loose.',
    why: 'Fast, useful structure for rebuilding poor soil and feeding insects.',
    sourceLabel: 'CNPS South Coast plant list',
    sourceUrl: 'https://chapters.cnps.org/southcoast/2024/10/07/ca-native-plants-for-the-s-ca-habitat-garden/',
  },
  {
    slug: 'coyote-brush',
    name: 'Coyote brush',
    scientific: 'Baccharis pilularis',
    form: 'shrub',
    place: 'Wind-facing hedge, slope, or rear edge where structure matters.',
    why: 'Evergreen mass, late-season pollen, and shelter for small wildlife.',
    caution: 'Give it room or choose a prostrate form for smaller spaces.',
    sourceLabel: 'CNPS South Coast plant list',
    sourceUrl: 'https://chapters.cnps.org/southcoast/2024/10/07/ca-native-plants-for-the-s-ca-habitat-garden/',
  },
  {
    slug: 'lemonade-berry',
    name: 'Lemonade berry',
    scientific: 'Rhus integrifolia',
    form: 'shrub',
    place: 'Larger yard edge, privacy screen, or coastal slope.',
    why: 'Classic coastal scrub mass: glossy leaves, flowers, berries, bird value.',
    caution: 'Too large for most balcony containers.',
    sourceLabel: 'CNPS coastal native garden',
    sourceUrl: 'https://www.cnps.org/gardening/the-coastal-native-garden-5526',
  },
  {
    slug: 'coast-sunflower',
    name: 'Coast sunflower',
    scientific: 'Encelia californica',
    form: 'shrub',
    place: 'Sunny dry bed where a bright, informal bloom is welcome.',
    why: 'South Coast scrub signal: yellow flowers, pollinator traffic, easy visual read.',
    sourceLabel: 'CNPS South Coast plant list',
    sourceUrl: 'https://chapters.cnps.org/southcoast/2024/10/07/ca-native-plants-for-the-s-ca-habitat-garden/',
  },
];

export type PlantingYieldMetric = {
  label: string;
  signal: string;
  measure: string;
};

export type PlantingYieldSite = {
  slug: 'balcony' | 'parkway' | 'yard' | 'wild-edge';
  name: string;
  scale: string;
  siteRead: string;
  value: string;
  water: string;
  mix: Array<{
    slug: NativePlantPick['slug'];
    units: string;
    role: string;
  }>;
  nextMoves: string[];
};

export const PLANTING_VALUE_SYSTEM = {
  sourceBlock: '0331',
  title: 'Block 0331 native planting value system',
  yieldDefinition:
    'Value yield means local habitat signal, water fit, repeatable action, and legible public learning. It is not an investment or financial return.',
  operatingPrinciple:
    'Turn one short block into an installable palette, a 90-day care loop, and a machine-readable plan that another human or agent can reuse.',
  metrics: [
    {
      label: 'Habitat lift',
      signal: 'native flowers, shelter, seedheads, and insect traffic',
      measure: 'Count how many palette species survive to second bloom.',
    },
    {
      label: 'Water fit',
      signal: 'rain-season establishment with lower dry-season demand',
      measure: 'Track weeks watered after establishment, then reduce when roots hold.',
    },
    {
      label: 'Local literacy',
      signal: 'neighbors can name buckwheat, suncups, deerweed, and scrub',
      measure: 'A plant label, a block link, or one shared cutting/seed note.',
    },
    {
      label: 'Repeatability',
      signal: 'balcony, parkway, and yard versions all use the same grammar',
      measure: 'Document the site type, plant mix, and what changed after 90 days.',
    },
  ] satisfies PlantingYieldMetric[],
  operatingRules: [
    'Match plants to sun, drainage, mature size, and foot traffic before buying anything.',
    'Plant during the cool rainy season when possible; use the first dry season as establishment, not performance.',
    'Leave some seedheads and imperfect structure so the garden can work as habitat.',
    'Avoid invasive groundcovers, especially iceplant near dune-adjacent places.',
  ],
  phases: [
    { label: 'Read', action: 'Map sun, drainage, wind, container depth, and where people walk.' },
    { label: 'Plant', action: 'Install the smallest useful mix and water deeply through establishment.' },
    { label: 'Watch', action: 'Log bloom, insect traffic, leaf stress, and irrigation changes for 90 days.' },
    { label: 'Share', action: 'Publish the mix, misses, and one photo back to the block or local channel.' },
  ],
} as const;

export const PLANTING_YIELD_SITES: PlantingYieldSite[] = [
  {
    slug: 'balcony',
    name: 'Balcony tray',
    scale: '3-5 containers',
    siteRead: 'Windy, bright, shallow, and fully visible. Keep the mix low and tough.',
    value: 'A tiny public-facing native signal that teaches the palette without pretending to be dune restoration.',
    water: 'Hand-water through the first dry season; use fast drainage and do not let pots sit in runoff.',
    mix: [
      { slug: 'beach-suncups', units: '2 low pots', role: 'ground-level dune note' },
      { slug: 'coast-sunflower', units: '1 medium pot', role: 'bright bloom and pollinator draw' },
      { slug: 'seacliff-buckwheat', units: '1 deep pot', role: 'anchor plant and block reference' },
    ],
    nextMoves: [
      'Choose containers with drainage holes and enough weight for coastal wind.',
      'Top-dress with mineral mulch; skip rich, wet potting mixes.',
      'Photo-log bloom and leaf stress once a week for 90 days.',
    ],
  },
  {
    slug: 'parkway',
    name: 'Parkway strip',
    scale: '20-80 square feet',
    siteRead: 'Hot, walked-by, compacted at the edges, and easy to over-tidy.',
    value: 'Turns a dead strip into a low-water learning strip with flowers, structure, and visible seasonal change.',
    water: 'Deep establishment water beats frequent sprinkles; keep water off sidewalks.',
    mix: [
      { slug: 'seacliff-buckwheat', units: '3 plants', role: 'pollinator anchor' },
      { slug: 'beach-suncups', units: '6 starts', role: 'low sandy edge' },
      { slug: 'deerweed', units: '3 plants', role: 'repair texture and nitrogen-fixing rhythm' },
      { slug: 'coast-sunflower', units: '2 plants', role: 'yellow bloom marker' },
    ],
    nextMoves: [
      'Check city parkway rules and keep sightlines clear.',
      'Break compaction gently and avoid imported high-fertility soil.',
      'Mulch around starts, not over crowns, and leave a walking edge.',
    ],
  },
  {
    slug: 'yard',
    name: 'Front yard patch',
    scale: '100-400 square feet',
    siteRead: 'Enough room for layers: low flowers, loose repair plants, and evergreen coastal scrub.',
    value: 'Creates a durable local habitat patch that can replace thirsty ornamental area over time.',
    water: 'Rain-season planting plus monthly deep checks during the first dry season.',
    mix: [
      { slug: 'coyote-brush', units: '2 shrubs', role: 'evergreen structure and shelter' },
      { slug: 'seacliff-buckwheat', units: '5 plants', role: 'pollinator and El Segundo signal' },
      { slug: 'deerweed', units: '5 plants', role: 'loose restoration fill' },
      { slug: 'coast-sunflower', units: '4 plants', role: 'visual bloom field' },
      { slug: 'beach-suncups', units: '10 starts', role: 'low edge and seasonal groundcover' },
    ],
    nextMoves: [
      'Place shrubs first by mature size, then fill between them with lower plants.',
      'Group plants by water need so establishment does not punish the dry-adapted ones.',
      'Remove invasive groundcover in phases so bare soil is not left open too long.',
    ],
  },
  {
    slug: 'wild-edge',
    name: 'Wild edge',
    scale: '400+ square feet',
    siteRead: 'A larger slope, fence line, or back edge that can look wilder and carry real structure.',
    value: 'Builds a recognizable coastal scrub edge: shelter, flowers, berries, and seasonal roughness.',
    water: 'Establish with deep infrequent water, then let dry-season structure be part of the look.',
    mix: [
      { slug: 'lemonade-berry', units: '2 shrubs', role: 'large coastal mass and bird value' },
      { slug: 'coyote-brush', units: '4 shrubs', role: 'wind-proof structure' },
      { slug: 'seacliff-buckwheat', units: '8 plants', role: 'pollinator field' },
      { slug: 'deerweed', units: '8 plants', role: 'fast repair and seasonal looseness' },
      { slug: 'coast-sunflower', units: '6 plants', role: 'bright scrub note' },
    ],
    nextMoves: [
      'Mark paths before planting so habitat does not get stepped through.',
      'Plant larger shrubs with their mature width in mind, not nursery size.',
      'Keep a simple quarterly log: bloom, seed, bird/insect activity, water used.',
    ],
  },
];

export type SeasonalSignal = {
  season: string;
  months: string;
  read: string;
  fieldNote: string;
};

export const SEASONAL_SIGNALS: SeasonalSignal[] = [
  {
    season: 'Winter setup',
    months: 'Dec-Feb',
    read: 'Cool-season rain wakes roots before the visible show.',
    fieldNote: 'Planting and light establishment work belong here when rain is helping.',
  },
  {
    season: 'Spring push',
    months: 'Mar-May',
    read: 'Deerweed, suncups, and scrub flowers start making the ground legible.',
    fieldNote: 'Watch for yellow first, then seed pods and insect traffic.',
  },
  {
    season: 'Buckwheat summer',
    months: 'Jun-Aug',
    read: 'Seacliff buckwheat becomes the headline; El Segundo blue flight season sits close to it.',
    fieldNote: 'Stay on paths near dune habitat. Small movement matters.',
  },
  {
    season: 'Dry structure',
    months: 'Sep-Nov',
    read: 'Flower color drops; seedheads, coyote brush, and wind-shaped forms carry the page.',
    fieldNote: 'This is when the scrub looks quiet but still holds shelter and food.',
  },
];

export const STATION_SHORTCUTS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Q', 'W', 'E', 'R', 'T', 'Y'] as const;

/** Cities within ~100 miles of El Segundo, cardinal-direction + approx mileage. */
export type Station = {
  name: string;
  slug: string;
  miles: number;
  direction: 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
  blurb: string;
  coords: { lat: number; lng: number };
};

export const STATIONS: Station[] = [
  {
    name: 'Manhattan Beach',
    slug: 'manhattan-beach',
    miles: 3,
    direction: 'N',
    blurb: 'next town over. The Strand.',
    coords: { lat: 33.88, lng: -118.41 },
  },
  {
    name: 'Hermosa',
    slug: 'hermosa',
    miles: 5,
    direction: 'N',
    blurb: 'pier, paddleboards, pickleball courts.',
    coords: { lat: 33.86, lng: -118.40 },
  },
  {
    name: 'Redondo Beach',
    slug: 'redondo-beach',
    miles: 6,
    direction: 'S',
    blurb: 'Riviera Village, King Harbor.',
    coords: { lat: 33.85, lng: -118.39 },
  },
  {
    name: 'Venice',
    slug: 'venice',
    miles: 8,
    direction: 'N',
    blurb: 'canals + boardwalk. The other side of LAX.',
    coords: { lat: 33.99, lng: -118.47 },
  },
  {
    name: 'Santa Monica',
    slug: 'santa-monica',
    miles: 10,
    direction: 'N',
    blurb: 'pier, third street, the Palisades.',
    coords: { lat: 34.02, lng: -118.49 },
  },
  {
    name: 'Palos Verdes',
    slug: 'palos-verdes',
    miles: 10,
    direction: 'S',
    blurb: "the peninsula. Ocean Trails, Trump Nat'l.",
    coords: { lat: 33.77, lng: -118.39 },
  },
  {
    name: 'Long Beach',
    slug: 'long-beach',
    miles: 16,
    direction: 'SE',
    blurb: 'the port, Belmont Shore, the Queen Mary.',
    coords: { lat: 33.77, lng: -118.19 },
  },
  {
    name: 'Los Angeles',
    slug: 'los-angeles',
    miles: 17,
    direction: 'E',
    blurb: 'DTLA, Arts District, county anchor.',
    coords: { lat: 34.05, lng: -118.24 },
  },
  {
    name: 'Malibu',
    slug: 'malibu',
    miles: 20,
    direction: 'N',
    blurb: 'PCH from Pepperdine to the county line.',
    coords: { lat: 34.03, lng: -118.69 },
  },
  {
    name: 'Pasadena',
    slug: 'pasadena',
    miles: 27,
    direction: 'NE',
    blurb: 'Old Town, Huntington Library, Rose Bowl.',
    coords: { lat: 34.15, lng: -118.14 },
  },
  {
    name: 'Anaheim / OC',
    slug: 'anaheim-oc',
    miles: 34,
    direction: 'SE',
    blurb: 'Angels, Ducks, Disneyland, Little Saigon.',
    coords: { lat: 33.84, lng: -117.91 },
  },
  {
    name: 'Newport / Laguna',
    slug: 'newport-laguna',
    miles: 46,
    direction: 'SE',
    blurb: 'PCH south. Crystal Cove. Art walks.',
    coords: { lat: 33.61, lng: -117.93 },
  },
  {
    name: 'Santa Barbara',
    slug: 'santa-barbara',
    miles: 92,
    direction: 'NW',
    blurb: 'the edge of the radius. State Street, the Mesa.',
    coords: { lat: 34.42, lng: -119.70 },
  },
  {
    name: 'North San Diego',
    slug: 'north-san-diego',
    miles: 99,
    direction: 'SE',
    blurb: "Oceanside + Carlsbad — SoCal's southern seam.",
    coords: { lat: 33.16, lng: -117.35 },
  },
  {
    name: 'Palm Springs',
    slug: 'palm-springs',
    miles: 104,
    direction: 'E',
    blurb: 'just past the line; included because the desert earns it.',
    coords: { lat: 33.83, lng: -116.55 },
  },
];

/** Loose-match tokens for deciding whether a block's `meta.location` is in range.
 *  The list is editorial, not legal — false positives are fine. */
export const SOCAL_TOKENS = [
  'el segundo', 'los angeles', 'manhattan beach', 'hermosa', 'redondo',
  'torrance', 'santa monica', 'venice', 'culver city', 'playa', 'inglewood',
  'long beach', 'palos verdes', 'malibu', 'pasadena', 'glendale', 'burbank',
  'hollywood', 'downtown', 'orange county', 'anaheim', 'santa ana', 'irvine',
  'huntington', 'newport', 'laguna', 'san diego', 'oceanside', 'santa barbara',
  'ventura', 'palm springs', 'riverside', 'temecula', 'south bay', 'socal',
];

const STATION_MATCH_TERMS: Record<string, string[]> = {
  'manhattan-beach': ['manhattan beach'],
  'hermosa': ['hermosa beach', 'hermosa'],
  'redondo-beach': ['redondo beach', 'redondo'],
  'venice': ['venice'],
  'santa-monica': ['santa monica'],
  'palos-verdes': ['palos verdes', 'rancho palos verdes', 'palos verdes estates'],
  'long-beach': ['long beach'],
  'malibu': ['malibu'],
  'pasadena': ['pasadena'],
  'anaheim-oc': ['anaheim', 'orange county', 'santa ana', 'irvine', 'oc'],
  'newport-laguna': ['newport beach', 'newport', 'laguna beach', 'laguna'],
  'santa-barbara': ['santa barbara'],
  'north-san-diego': ['north san diego', 'north county san diego', 'oceanside', 'carlsbad'],
  'palm-springs': ['palm springs'],
};

/** Whether a given location string resolves inside the SoCal radius. */
export function isInRange(location: string | undefined): boolean {
  if (!location) return false;
  const loc = location.toLowerCase();
  return SOCAL_TOKENS.some((t) => loc.includes(t));
}

/** Filter a blocks collection to only those whose meta.location is in range. */
export function filterInRangeBlocks(blocks: CollectionEntry<'blocks'>[]): CollectionEntry<'blocks'>[] {
  return blocks.filter((b) => isInRange(b.data.meta?.location));
}

export function getStationBySlug(slug: string | undefined): Station | undefined {
  if (!slug) return undefined;
  return STATIONS.find((station) => station.slug === slug);
}

export function getStationPath(station: Pick<Station, 'slug'>): string {
  return `/tv/${station.slug}`;
}

/**
 * Station-level match. Most stations do a permissive substring match against
 * `meta.location`; Los Angeles is the intentional exception and acts as the
 * county-level umbrella for every in-range block.
 */
export function stationMatchesLocation(station: Station, location: string | undefined): boolean {
  if (!location) return false;
  if (station.slug === 'los-angeles') return isInRange(location);

  const loc = location.toLowerCase();
  const terms = STATION_MATCH_TERMS[station.slug] ?? [station.name.toLowerCase()];
  return terms.some((term) => loc.includes(term));
}

export function filterBlocksForStation(
  blocks: CollectionEntry<'blocks'>[],
  station: Station,
): CollectionEntry<'blocks'>[] {
  return blocks.filter((block) => stationMatchesLocation(station, block.data.meta?.location));
}
