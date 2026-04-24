import { PASSPORT_STAMPS, type PassportStamp } from './passport';

export type PassportAchievement = {
  slug: string;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  reward: string;
  stampSlugs: string[];
  posterSlug?: string;
  color: string;
};

const allStampSlugs = PASSPORT_STAMPS.map((stamp) => stamp.slug);

export const PASSPORT_ACHIEVEMENTS: PassportAchievement[] = [
  {
    slug: 'origin-stamp',
    title: 'Origin Stamp',
    shortTitle: 'Origin',
    badge: 'HOME BASE',
    description: 'Start the book at El Segundo and prove the passport has an issuing office.',
    reward: 'Unlocks the rest of the station route.',
    stampSlugs: ['el-segundo'],
    posterSlug: 'origin-stamp',
    color: '#8A2432',
  },
  {
    slug: 'south-bay-run',
    title: 'South Bay Run',
    shortTitle: 'South Bay',
    badge: 'STRAND SET',
    description: 'Collect the close coastal line: Manhattan, Hermosa, and Redondo.',
    reward: 'Completes the beach-run page of the passport.',
    stampSlugs: ['manhattan-beach', 'hermosa', 'redondo-beach'],
    posterSlug: 'south-bay-run',
    color: '#185FA5',
  },
  {
    slug: 'westside-maker',
    title: 'Westside Maker Coast',
    shortTitle: 'Westside',
    badge: 'MAKER COAST',
    description: 'Stamp Venice and Santa Monica as the civic-creative north beach signal.',
    reward: 'Adds the maker coast visa to the book.',
    stampSlugs: ['venice', 'santa-monica'],
    posterSlug: 'westside-maker',
    color: '#7B4968',
  },
  {
    slug: 'ridge-port-mesh',
    title: 'Ridge / Port Mesh',
    shortTitle: 'Mesh',
    badge: 'BACKHAUL',
    description: 'Pair Palos Verdes line-of-sight with the Long Beach working waterfront.',
    reward: 'Completes the infrastructure route.',
    stampSlugs: ['palos-verdes', 'long-beach'],
    posterSlug: 'ridge-port-mesh',
    color: '#0F6E56',
  },
  {
    slug: 'county-signal',
    title: 'County Signal',
    shortTitle: 'County',
    badge: 'COUNTY VIEW',
    description: 'Claim Los Angeles as the umbrella station for the signals that do not fit one neighborhood.',
    reward: 'Adds the county visa.',
    stampSlugs: ['los-angeles'],
    posterSlug: 'county-signal',
    color: '#5F5E5A',
  },
  {
    slug: 'pch-horizon',
    title: 'PCH Horizon',
    shortTitle: 'PCH',
    badge: 'HORIZON',
    description: 'Run the long look west through Malibu and put a cliff-road stamp in the book.',
    reward: 'Adds the horizon visa.',
    stampSlugs: ['malibu'],
    posterSlug: 'pch-horizon',
    color: '#1F6D83',
  },
  {
    slug: 'foothill-archive',
    title: 'Foothill Archive',
    shortTitle: 'Foothill',
    badge: 'ARCHIVE',
    description: 'Collect Pasadena as the inland civic/archive stamp.',
    reward: 'Adds the archive visa.',
    stampSlugs: ['pasadena'],
    posterSlug: 'foothill-archive',
    color: '#A35B1F',
  },
  {
    slug: 'oc-spectacle',
    title: 'OC Spectacle',
    shortTitle: 'OC',
    badge: 'EVENT LINE',
    description: 'Stamp Anaheim / OC for arena lights, spectacle, and public-event gravity.',
    reward: 'Adds the loud-signal visa.',
    stampSlugs: ['anaheim-oc'],
    posterSlug: 'orange-county-spectacle',
    color: '#C95C2E',
  },
  {
    slug: 'cove-gallery',
    title: 'Cove Gallery',
    shortTitle: 'Cove',
    badge: 'COVE SET',
    description: 'Collect Newport / Laguna as the polished south-coast waterline.',
    reward: 'Adds the gallery-cove visa.',
    stampSlugs: ['newport-laguna'],
    posterSlug: 'cove-gallery',
    color: '#2A6F77',
  },
  {
    slug: 'north-edge',
    title: 'North Edge',
    shortTitle: 'North',
    badge: 'EDGE NORTH',
    description: 'Reach Santa Barbara and prove the 100-mile idea has a far north edge.',
    reward: 'Adds the long-drive north visa.',
    stampSlugs: ['santa-barbara'],
    color: '#6D4B8D',
  },
  {
    slug: 'southline',
    title: 'Southline',
    shortTitle: 'South',
    badge: 'SOUTH EDGE',
    description: 'Reach North San Diego and test the southern edge of the local radius.',
    reward: 'Adds the southline visa.',
    stampSlugs: ['north-san-diego'],
    color: '#285F4D',
  },
  {
    slug: 'desert-wildcard',
    title: 'Desert Wildcard',
    shortTitle: 'Desert',
    badge: 'WILDCARD',
    description: 'Break the radius just enough with Palm Springs, because the desert earns the exception.',
    reward: 'Adds the wildcard visa.',
    stampSlugs: ['palm-springs'],
    posterSlug: 'desert-wildcard',
    color: '#7D3F2C',
  },
  {
    slug: 'sky-gate',
    title: 'Sky Gate',
    shortTitle: 'Air Gate',
    badge: 'ARRIVALS',
    description: 'Collect LAX / Westchester as the passport stamp for arrivals, runways, and the global door next to home.',
    reward: 'Adds the air-gate visa.',
    stampSlugs: ['lax-westchester'],
    color: '#204E6A',
  },
  {
    slug: 'arena-loop',
    title: 'Arena Loop',
    shortTitle: 'Arena',
    badge: 'SHOWTIME',
    description: 'Stamp Inglewood for arena lights, Forum echoes, and game-day streets.',
    reward: 'Adds the event-night visa.',
    stampSlugs: ['inglewood'],
    color: '#A44461',
  },
  {
    slug: 'shop-breakwater',
    title: 'Shop Floor / Breakwater',
    shortTitle: 'Harbor Shops',
    badge: 'WORKING EDGE',
    description: 'Pair Torrance workshop practicality with San Pedro breakwater weather.',
    reward: 'Completes the working-edge visa.',
    stampSlugs: ['torrance', 'san-pedro'],
    color: '#34656A',
  },
  {
    slug: 'studio-backlot',
    title: 'Studio Backlot',
    shortTitle: 'Backlot',
    badge: 'MADE HERE',
    description: 'Collect Culver City, Hollywood, and Burbank / Glendale as the show-making route.',
    reward: 'Completes the media-machine visa.',
    stampSlugs: ['culver-city', 'hollywood', 'burbank-glendale'],
    color: '#8B4C8F',
  },
  {
    slug: 'ventura-breath',
    title: 'Ventura Breath',
    shortTitle: 'Ventura',
    badge: 'NORTH COAST',
    description: 'Stamp Ventura as the orchard-coast bridge before Santa Barbara.',
    reward: 'Adds the north-coast visa.',
    stampSlugs: ['ventura'],
    color: '#8C6E2F',
  },
  {
    slug: 'field-expansion',
    title: 'Field Expansion',
    shortTitle: 'Expansion',
    badge: 'P16-P23',
    description: 'Collect every expansion stamp: air gate, arena, workshop, studio, breakwater, myth, backlot, and orchard coast.',
    reward: 'Completes the second stamp sheet.',
    stampSlugs: [
      'lax-westchester',
      'inglewood',
      'torrance',
      'culver-city',
      'san-pedro',
      'hollywood',
      'burbank-glendale',
      'ventura',
    ],
    color: '#12110E',
  },
  {
    slug: 'full-passport',
    title: 'Full Passport',
    shortTitle: 'All Stamps',
    badge: 'COMPLETE SET',
    description: 'Collect every station stamp and expansion stamp to turn the browser passport into a finished field object.',
    reward: 'Completes the Station Passport collection.',
    stampSlugs: allStampSlugs,
    color: '#12110E',
  },
];

const stampBySlug = new Map(PASSPORT_STAMPS.map((stamp) => [stamp.slug, stamp]));

export function passportAchievementStamps(achievement: PassportAchievement): PassportStamp[] {
  return achievement.stampSlugs
    .map((slug) => stampBySlug.get(slug))
    .filter((stamp): stamp is PassportStamp => Boolean(stamp));
}

export function passportAchievementSummary(achievement: PassportAchievement) {
  const stamps = passportAchievementStamps(achievement);

  return {
    ...achievement,
    count: stamps.length,
    stamps: stamps.map((stamp) => ({
      slug: stamp.slug,
      code: stamp.code,
      name: stamp.name,
      shortName: stamp.shortName,
      color: stamp.color,
      miles: stamp.miles,
      direction: stamp.direction,
      art: `https://pointcast.xyz/passport/art/${stamp.slug}.svg`,
      metadata: `https://pointcast.xyz/passport/stamps/${stamp.slug}.json`,
      passportUrl: `https://pointcast.xyz${stamp.links.passport}`,
    })),
  };
}
