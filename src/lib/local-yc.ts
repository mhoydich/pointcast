/**
 * YC in the 25 miles — Y Combinator companies whose public YC listing puts
 * them within about 25 miles of El Segundo.
 *
 * Source: Y Combinator's own public pages only — the Startup Directory
 * (https://www.ycombinator.com/companies) and its Los Angeles location page
 * (https://www.ycombinator.com/companies/location/los-angeles). Nothing here
 * comes from member-only YC tools. One-line descriptions are PointCast's own
 * words, not YC's copy. No founder or personal details are listed.
 *
 * PointCast is not affiliated with, or endorsed by, Y Combinator.
 *
 * Shared by /local/yc and /local/yc.json so both stay in sync.
 */
import data from '../data/yc-25-mile.json';
import { ANCHOR } from './local';

export type YcStatus = 'Active' | 'Acquired' | 'Public' | 'Inactive';

export type YcCompany = {
  name: string;
  slug: string;
  /** Batch as YC shows it, normalised to a label like "Winter 2020". */
  batch: string;
  /** Sort key: year * 10 + season index. */
  batchKey: number;
  /** Status as shown on YC's location page; null when YC's card doesn't show one. */
  status: YcStatus | null;
  /** The location string exactly as YC lists it. */
  ycLocation: string;
  /** The PointCast city group this company sits in. */
  city: string;
  /** PointCast's own one-line read of what the company does. */
  line: string;
  /** Short topic tags (from YC's public industry tags). */
  tags: string[];
  /** Which public YC listing(s) it appears on. */
  foundOn: Array<'location-page' | 'directory'>;
  ycUrl: string;
};

export type YcCity = {
  name: string;
  slug: string;
  /** Approximate straight-line miles from El Segundo Rec Park. */
  miles: number;
  note: string;
  coords: { lat: number; lng: number };
};

/** City groups, nearest first. Coordinates are rough city centres. */
export const YC_CITIES: YcCity[] = [
  { name: 'El Segundo', slug: 'el-segundo', miles: 0, note: 'Home base.', coords: { lat: 33.9192, lng: -118.4165 } },
  { name: 'Hawthorne', slug: 'hawthorne', miles: 3, note: 'Next to the airport, and the old aerospace corridor.', coords: { lat: 33.9164, lng: -118.3526 } },
  { name: 'Manhattan Beach', slug: 'manhattan-beach', miles: 3, note: 'Next town south.', coords: { lat: 33.8847, lng: -118.4109 } },
  { name: 'Playa Vista', slug: 'playa-vista', miles: 4, note: 'Silicon Beach, north of LAX.', coords: { lat: 33.9737, lng: -118.4229 } },
  { name: 'Inglewood', slug: 'inglewood', miles: 4, note: 'East of the airport.', coords: { lat: 33.9617, lng: -118.3531 } },
  { name: 'Marina del Rey', slug: 'marina-del-rey', miles: 5, note: 'The harbor, between Venice and Playa.', coords: { lat: 33.9803, lng: -118.4517 } },
  { name: 'Redondo Beach', slug: 'redondo-beach', miles: 6, note: 'South Bay, past Hermosa.', coords: { lat: 33.8492, lng: -118.3884 } },
  { name: 'Culver City', slug: 'culver-city', miles: 6, note: 'Studios and startups off the 405.', coords: { lat: 34.0211, lng: -118.3965 } },
  { name: 'Venice', slug: 'venice', miles: 7, note: 'Abbot Kinney and the boardwalk.', coords: { lat: 33.9850, lng: -118.4695 } },
  { name: 'Torrance', slug: 'torrance', miles: 8, note: 'South Bay industry and the old Toyota campus.', coords: { lat: 33.8358, lng: -118.3406 } },
  { name: 'Santa Monica', slug: 'santa-monica', miles: 9, note: 'The original Silicon Beach.', coords: { lat: 34.0195, lng: -118.4912 } },
  { name: 'Beverly Hills', slug: 'beverly-hills', miles: 10, note: 'Westside.', coords: { lat: 34.0736, lng: -118.4004 } },
  { name: 'West Hollywood', slug: 'west-hollywood', miles: 12, note: 'Westside.', coords: { lat: 34.0900, lng: -118.3617 } },
  { name: 'Los Angeles', slug: 'los-angeles', miles: 14, note: 'YC lists these simply as "Los Angeles", so the exact neighborhood isn\'t on the listing. Mileage is to downtown.', coords: { lat: 34.0522, lng: -118.2437 } },
  { name: 'Long Beach', slug: 'long-beach', miles: 16, note: 'Port city, and a growing space and defense cluster.', coords: { lat: 33.7701, lng: -118.1937 } },
  { name: 'Glendale', slug: 'glendale', miles: 18, note: 'North of downtown.', coords: { lat: 34.1425, lng: -118.2551 } },
  { name: 'Burbank', slug: 'burbank', miles: 19, note: 'Media district.', coords: { lat: 34.1808, lng: -118.3090 } },
  { name: 'Pasadena', slug: 'pasadena', miles: 22, note: 'Caltech and JPL country.', coords: { lat: 34.1478, lng: -118.1445 } },
];

const SEASONS: Record<string, { label: string; index: number }> = {
  W: { label: 'Winter', index: 1 },
  X: { label: 'Spring', index: 2 },
  P: { label: 'Spring', index: 2 },
  S: { label: 'Summer', index: 3 },
  F: { label: 'Fall', index: 4 },
};

export const YC_SNAPSHOT = data as {
  asOf: string;
  asOfLabel: string;
  sources: Array<{ label: string; url: string; note: string }>;
  companies: Array<Omit<YcCompany, 'batchKey' | 'ycUrl'>>;
};

function batchKey(label: string): number {
  const [season, year] = label.split(' ');
  const s = Object.values(SEASONS).find((x) => x.label === season);
  return Number(year) * 10 + (s?.index ?? 0);
}

/** Every company in the snapshot, newest batch first, then by name. */
export const YC_COMPANIES: YcCompany[] = YC_SNAPSHOT.companies
  .map((c) => ({ ...c, batchKey: batchKey(c.batch), ycUrl: `https://www.ycombinator.com/companies/${c.slug}` }))
  .sort((a, b) => b.batchKey - a.batchKey || a.name.localeCompare(b.name));

export function companiesInCity(city: string): YcCompany[] {
  return YC_COMPANIES.filter((c) => c.city === city);
}

/** City groups that have at least one company, nearest first. */
export function cityGroups() {
  return YC_CITIES.map((city) => ({ city, companies: companiesInCity(city.name) })).filter((g) => g.companies.length > 0);
}

export function ycCounts() {
  const byStatus: Record<string, number> = {};
  for (const c of YC_COMPANIES) {
    const key = c.status ?? 'Not shown';
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }
  const byCity = Object.fromEntries(cityGroups().map((g) => [g.city.name, g.companies.length]));
  const thisYear = YC_COMPANIES.filter((c) => c.batch.endsWith('2026')).length;
  return { total: YC_COMPANIES.length, byStatus, byCity, batches2026: thisYear };
}

/** Companies tagged with any of the given tags (case-insensitive). */
export function companiesTagged(tags: string[]): YcCompany[] {
  const want = tags.map((t) => t.toLowerCase());
  return YC_COMPANIES.filter((c) => c.tags.some((t) => want.includes(t.toLowerCase())));
}

export const YC_HARD_TECH_TAGS = [
  'aerospace', 'aviation and space', 'space', 'satellites', 'defense', 'drones', 'hard-tech',
  'manufacturing', 'manufacturing and robotics', 'robotics', 'airplanes', 'rockets',
];

export const YC_ANCHOR = ANCHOR;
export const YC_RADIUS_MILES = 25;
export const YC_CANONICAL = 'https://pointcast.xyz/local/yc';
export const YC_MACHINE = 'https://pointcast.xyz/local/yc.json';
