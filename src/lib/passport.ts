import type { CollectionEntry } from 'astro:content';
import {
  ANCHOR,
  NAME_DROPS,
  STATIONS,
  filterBlocksForStation,
  type Station,
} from './local';
import { POINTCAST_IMAGE_GENERATOR, passportStampImageSpec } from './image-generation';
import { passportStampMintPlan } from './passport-mint';

export const PASSPORT_STORAGE_KEY = 'pc:station-passport:v1';
export const PASSPORT_IMAGE_GENERATOR = POINTCAST_IMAGE_GENERATOR;

export type PassportStamp = {
  slug: string;
  stationSlug: string | null;
  code: string;
  name: string;
  shortName: string;
  miles: number;
  direction: string;
  coords: { lat: number; lng: number };
  color: string;
  band: string;
  prompt: string;
  proof: string;
  reward: string;
  routeNote: string;
  localAction: string;
  unlocks: string[];
  links: {
    passport: string;
    tv: string;
    local: string;
    search: string;
    map?: string;
  };
};

type StampCopy = {
  band: string;
  prompt: string;
  proof: string;
  reward: string;
  routeNote: string;
  localAction: string;
  unlocks: string[];
  map?: string;
};

const COLORS = [
  '#8A2432',
  '#185FA5',
  '#0F6E56',
  '#993C1D',
  '#534AB7',
  '#2A6F77',
  '#C95C2E',
  '#7B4968',
  '#2F5F3B',
  '#5F5E5A',
  '#A35B1F',
  '#1F6D83',
  '#6D4B8D',
  '#986C1F',
  '#285F4D',
  '#7D3F2C',
  '#204E6A',
  '#A44461',
  '#6B682A',
  '#8B4C8F',
  '#34656A',
  '#A1352B',
  '#4D6A9A',
  '#8C6E2F',
];

const STAMP_COPY: Record<string, StampCopy> = {
  'el-segundo': {
    band: 'origin',
    prompt: 'Run the HQ coffee loop: Main Street, Smoky Hollow, then the PCH edge.',
    proof: 'Open the coffee map, pick one stop, and stamp the origin.',
    reward: 'Origin stamp unlocks the passport rail and counts as home base.',
    routeNote: 'Best first stamp when someone asks where PointCast actually lives.',
    localAction: 'Scout coffee',
    unlocks: ['coffee map', 'local lens', 'TV station index'],
    map: '/collabs/map',
  },
  'manhattan-beach': {
    band: 'strand',
    prompt: 'Take the first beach hop from El Segundo toward the Strand.',
    proof: 'Find one block or place that feels walkable from the coast.',
    reward: 'Adds the north-beach edge to your passport.',
    routeNote: 'The easy extension: close enough for a spontaneous detour.',
    localAction: 'Walk the north edge',
    unlocks: ['strand route', 'coffee detour', 'station cast'],
  },
  hermosa: {
    band: 'pier',
    prompt: 'Tune the Hermosa station and log the pier mood.',
    proof: 'Stamp after checking the station feed or visiting the beach corridor.',
    reward: 'Adds the social-beach register to the route.',
    routeNote: 'Good second stop when the passport wants people outside.',
    localAction: 'Check the pier',
    unlocks: ['pier signal', 'station cast'],
  },
  'redondo-beach': {
    band: 'harbor',
    prompt: 'Trace the King Harbor side of the South Bay map.',
    proof: 'Open the station, then find a harbor-adjacent note or block.',
    reward: 'Adds the harbor edge to your route.',
    routeNote: 'Turns the South Bay line from a beach walk into a working coast.',
    localAction: 'Trace the harbor',
    unlocks: ['harbor route', 'station cast'],
  },
  venice: {
    band: 'makers',
    prompt: 'Catch the Venice maker signal: canals, boardwalk, workshop energy.',
    proof: 'Stamp after opening the station and choosing the most Venice-shaped block.',
    reward: 'Adds the creative-spine stamp.',
    routeNote: 'The station for artists, builders, and strange afternoons.',
    localAction: 'Find the maker cue',
    unlocks: ['creative spine', 'station cast'],
  },
  'santa-monica': {
    band: 'palisades',
    prompt: 'Follow the Palisades edge and look for the civic-tech register.',
    proof: 'Stamp when the station feels more city than beach.',
    reward: 'Adds the civic beach stamp.',
    routeNote: 'The north anchor before the route turns into PCH.',
    localAction: 'Read the civic edge',
    unlocks: ['north anchor', 'station cast'],
  },
  'palos-verdes': {
    band: 'ridge',
    prompt: 'Look south from the ridge: line-of-sight, coast, infrastructure.',
    proof: 'Stamp after reading the beacon or mesh angle.',
    reward: 'Adds the ridge/backhaul stamp.',
    routeNote: 'Best for the mesh-internet imagination.',
    localAction: 'Check the ridge',
    unlocks: ['backhaul cue', 'beacon route'],
  },
  'long-beach': {
    band: 'port',
    prompt: 'Tune the port station and find the working-waterfront energy.',
    proof: 'Stamp when a block or place feels like logistics plus culture.',
    reward: 'Adds the port stamp.',
    routeNote: 'The industrial-civic counterweight to the beach stations.',
    localAction: 'Tune the port',
    unlocks: ['port line', 'station cast'],
  },
  'los-angeles': {
    band: 'county',
    prompt: 'Use LA as the umbrella station: one city, many signals.',
    proof: 'Stamp after finding the block that best explains the county mood today.',
    reward: 'Adds the county anchor.',
    routeNote: 'The catch-all station for everything too large for one neighborhood.',
    localAction: 'Pick the county signal',
    unlocks: ['county view', 'station cast'],
  },
  malibu: {
    band: 'punchline',
    prompt: 'Take the PCH long look: cliff, surf, far edge.',
    proof: 'Stamp after opening the Malibu station from a non-Malibu place.',
    reward: 'Adds the horizon stamp.',
    routeNote: 'Good for a broadcast that needs more air in it.',
    localAction: 'Open the horizon',
    unlocks: ['PCH edge', 'station cast'],
  },
  pasadena: {
    band: 'library',
    prompt: 'Tune the inland old-town register: rose, library, foothills.',
    proof: 'Stamp after finding one archival or civic block.',
    reward: 'Adds the foothill stamp.',
    routeNote: 'The thinking-person inland station.',
    localAction: 'Find the archive',
    unlocks: ['foothill route', 'station cast'],
  },
  'anaheim-oc': {
    band: 'orange',
    prompt: 'Read the OC station as spectacle, sports, and Little Saigon.',
    proof: 'Stamp after choosing which of those three signals is loudest today.',
    reward: 'Adds the arena-and-theme-park stamp.',
    routeNote: 'The station with the biggest public-event gravity.',
    localAction: 'Pick the loud signal',
    unlocks: ['OC route', 'station cast'],
  },
  'newport-laguna': {
    band: 'cove',
    prompt: 'Follow PCH south into coves, galleries, and clean water.',
    proof: 'Stamp after the station gives you a quieter coast than Malibu.',
    reward: 'Adds the cove stamp.',
    routeNote: 'The polished coastal counterpoint.',
    localAction: 'Open the cove',
    unlocks: ['cove route', 'station cast'],
  },
  'santa-barbara': {
    band: 'edge',
    prompt: 'Reach the northern edge of the 100-mile idea.',
    proof: 'Stamp after checking the farthest station that still feels connected.',
    reward: 'Adds the north-edge stamp.',
    routeNote: 'The long-drive stamp. Keep it special.',
    localAction: 'Touch the north edge',
    unlocks: ['north edge', 'station cast'],
  },
  'north-san-diego': {
    band: 'southline',
    prompt: 'Reach the southern edge: Oceanside, Carlsbad, North County.',
    proof: 'Stamp after choosing whether the route still feels PointCast-local.',
    reward: 'Adds the southline stamp.',
    routeNote: 'The stamp that tests the radius.',
    localAction: 'Touch the southline',
    unlocks: ['south edge', 'station cast'],
  },
  'palm-springs': {
    band: 'desert',
    prompt: 'Break the rule just enough: desert station, just beyond the line.',
    proof: 'Stamp because the desert earns the exception.',
    reward: 'Adds the wildcard stamp.',
    routeNote: 'The out-of-bounds stamp that keeps the map from getting too tidy.',
    localAction: 'Break the line',
    unlocks: ['wildcard route', 'station cast'],
  },
  'lax-westchester': {
    band: 'airgate',
    prompt: 'Stand at the edge of the runway hum and claim the gate-next-door signal.',
    proof: 'Stamp after tracing the Sepulveda / Westchester airport edge.',
    reward: 'Adds the air-gate expansion stamp.',
    routeNote: 'The shortest hop with the loudest global reach.',
    localAction: 'Check the gate',
    unlocks: ['arrival route', 'airport edge', 'station cast'],
  },
  inglewood: {
    band: 'arena',
    prompt: 'Tune the arena lights: game day, concert night, Forum memory.',
    proof: 'Stamp when Inglewood feels like the county gathering in one parking lot.',
    reward: 'Adds the arena-loop stamp.',
    routeNote: 'The civic spectacle stamp that sits closer than people remember.',
    localAction: 'Read the arena',
    unlocks: ['arena route', 'event line', 'station cast'],
  },
  torrance: {
    band: 'workshop',
    prompt: 'Find the practical South Bay: shops, lunch counters, refinery horizon.',
    proof: 'Stamp after choosing one everyday place that keeps the map working.',
    reward: 'Adds the workshop stamp.',
    routeNote: 'The grounded counterweight to beach glamour.',
    localAction: 'Find the workshop',
    unlocks: ['shop-floor route', 'station cast'],
  },
  'culver-city': {
    band: 'studio',
    prompt: 'Follow the Expo / studio / design-office corridor.',
    proof: 'Stamp when the station feels like a meeting that became a show.',
    reward: 'Adds the studio-lot stamp.',
    routeNote: 'The creative office stamp: practical, polished, in motion.',
    localAction: 'Scout the studio',
    unlocks: ['studio route', 'station cast'],
  },
  'san-pedro': {
    band: 'breakwater',
    prompt: 'Walk the old-port edge: cranes, breakwater, cliff roads, harbor bars.',
    proof: 'Stamp after the waterfront feels like memory plus machinery.',
    reward: 'Adds the breakwater stamp.',
    routeNote: 'The port story with more salt and old neon.',
    localAction: 'Touch the breakwater',
    unlocks: ['harbor route', 'station cast'],
  },
  hollywood: {
    band: 'myth',
    prompt: 'Tune the myth machine: sign, boulevard, backroom screenings, bright lies.',
    proof: 'Stamp after finding the gap between glamour and work.',
    reward: 'Adds the myth-machine stamp.',
    routeNote: 'The stamp for spectacle as infrastructure.',
    localAction: 'Read the myth',
    unlocks: ['myth route', 'station cast'],
  },
  'burbank-glendale': {
    band: 'backlot',
    prompt: 'Follow the backlot air: studios, media offices, foothill streets.',
    proof: 'Stamp when the valley side of the story starts to feel operational.',
    reward: 'Adds the backlot stamp.',
    routeNote: 'The place where the show gets made before the show looks shiny.',
    localAction: 'Check the backlot',
    unlocks: ['backlot route', 'station cast'],
  },
  ventura: {
    band: 'orchard',
    prompt: 'Run the north-coast breath: harbor, orchards, point breaks, old highway.',
    proof: 'Stamp after Ventura feels like the last easy exhale before Santa Barbara.',
    reward: 'Adds the orchard-coast stamp.',
    routeNote: 'The north-coast bridge stamp: less polished, more weather.',
    localAction: 'Open the orchard coast',
    unlocks: ['north-coast route', 'station cast'],
  },
};

const ORIGIN_TERMS = [
  'el segundo',
  'smoky hollow',
  'blue butterfly',
  'standard station',
  'big mike',
  'ginger',
  'vinny',
  'rec park',
  'recreation park',
  ...NAME_DROPS.map((drop) => drop.name.toLowerCase()),
];

function makeLinks(slug: string, stationSlug: string | null, name: string, map?: string) {
  const tv = stationSlug ? `/tv/${stationSlug}` : '/tv?station=los-angeles';
  return {
    passport: `/passport#${slug}`,
    tv,
    local: '/local',
    search: `/search?q=${encodeURIComponent(name)}`,
    ...(map ? { map } : {}),
  };
}

function stationStamp(station: Station, index: number): PassportStamp {
  const copy = STAMP_COPY[station.slug] ?? {
    band: 'station',
    prompt: `Tune ${station.name} and find the strongest local signal.`,
    proof: 'Stamp after opening the station feed.',
    reward: 'Adds one more station to the passport.',
    routeNote: station.blurb,
    localAction: 'Tune station',
    unlocks: ['station cast'],
  };

  return {
    slug: station.slug,
    stationSlug: station.slug,
    code: `P${String(index + 1).padStart(2, '0')}`,
    name: station.name,
    shortName: station.name.replace(' / ', '/'),
    miles: station.miles,
    direction: station.direction,
    coords: station.coords,
    color: COLORS[(index + 1) % COLORS.length],
    band: copy.band,
    prompt: copy.prompt,
    proof: copy.proof,
    reward: copy.reward,
    routeNote: copy.routeNote,
    localAction: copy.localAction,
    unlocks: copy.unlocks,
    links: makeLinks(station.slug, station.slug, station.name, copy.map),
  };
}

export const PASSPORT_STAMPS: PassportStamp[] = [
  {
    slug: 'el-segundo',
    stationSlug: null,
    code: 'P00',
    name: 'El Segundo',
    shortName: 'El Segundo',
    miles: 0,
    direction: 'ORIGIN',
    coords: { lat: ANCHOR.coords.latitude, lng: ANCHOR.coords.longitude },
    color: COLORS[0],
    band: STAMP_COPY['el-segundo'].band,
    prompt: STAMP_COPY['el-segundo'].prompt,
    proof: STAMP_COPY['el-segundo'].proof,
    reward: STAMP_COPY['el-segundo'].reward,
    routeNote: STAMP_COPY['el-segundo'].routeNote,
    localAction: STAMP_COPY['el-segundo'].localAction,
    unlocks: STAMP_COPY['el-segundo'].unlocks,
    links: makeLinks('el-segundo', null, 'El Segundo', STAMP_COPY['el-segundo'].map),
  },
  ...STATIONS.map((station, index) => stationStamp(station, index)),
];

export function passportDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function passportDaySeed(date = new Date()): number {
  return passportDateKey(date)
    .replace(/-/g, '')
    .split('')
    .reduce((sum, char, index) => sum + Number(char) * (index + 3), 0);
}

export function getDailyPassportRoute(date = new Date(), count = 4): PassportStamp[] {
  const origin = PASSPORT_STAMPS[0];
  const stations = PASSPORT_STAMPS.slice(1);
  const seed = passportDaySeed(date);
  const route = [origin];
  const used = new Set([origin.slug]);
  let cursor = seed % stations.length;

  while (route.length < count && used.size < PASSPORT_STAMPS.length) {
    const stamp = stations[cursor % stations.length];
    if (!used.has(stamp.slug)) {
      route.push(stamp);
      used.add(stamp.slug);
    }
    cursor += 7;
  }

  return route;
}

export function filterBlocksForPassportStamp(
  blocks: CollectionEntry<'blocks'>[],
  stamp: PassportStamp,
): CollectionEntry<'blocks'>[] {
  if (stamp.stationSlug) {
    const station = STATIONS.find((item) => item.slug === stamp.stationSlug);
    return station ? filterBlocksForStation(blocks, station) : [];
  }

  return blocks.filter((block) => {
    const location = block.data.meta?.location?.toLowerCase() ?? '';
    const title = block.data.title.toLowerCase();
    const body = block.data.body?.toLowerCase() ?? '';
    return ORIGIN_TERMS.some(
      (term) => location.includes(term) || title.includes(term) || body.includes(term),
    );
  });
}

export function passportStampSummary(
  stamp: PassportStamp,
  blocks: CollectionEntry<'blocks'>[],
) {
  const matchedBlocks = filterBlocksForPassportStamp(blocks, stamp);
  const nearbyBlocks = matchedBlocks
    .slice(0, 4)
    .map((block) => ({
      id: block.data.id,
      title: block.data.title,
      type: block.data.type,
      location: block.data.meta?.location ?? null,
      url: `https://pointcast.xyz/b/${block.data.id}`,
      jsonUrl: `https://pointcast.xyz/b/${block.data.id}.json`,
    }));

  return {
    ...stamp,
    image: passportStampImageSpec(stamp),
    mint: passportStampMintPlan(stamp),
    blockCount: matchedBlocks.length,
    nearbyBlocks,
  };
}
