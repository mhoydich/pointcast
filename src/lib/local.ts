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
