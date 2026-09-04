/**
 * almanac.ts — the data layer for /almanac/{place} and /almanac/{place}/{facet}.
 *
 * This is the hyperlocal utility surface: sun, moon, and daylight for the
 * places inside PointCast's lens. Everything here is *computed*, not fetched —
 * `sunTimes()` and `moonPhase()` in sky.ts implement the NOAA solar formulas
 * and the standard synodic-month model, so a static build is as correct next
 * month as it is the day it ships. Astronomy does not go stale.
 *
 * The one thing we do NOT compute is water. Tide prediction needs NOAA's
 * per-station harmonic constituents; approximating it would be inventing a
 * safety-relevant number. /almanac inherits the rule the original almanac page
 * set in v1 — "do not invent the water" — so tide is fetched live from NOAA
 * CO-OPS (see functions/api/tide.ts) with the station named, or it is absent.
 * Never add a tide number to this file.
 *
 * Places come from STATIONS in local.ts (the existing 100-mile lens) plus the
 * El Segundo anchor itself, so there is one place list on the site, not two.
 */
import { ANCHOR, STATIONS, type Station } from './local';
import { moonPhase, sunTimes, type MoonPhase, type SunTimes } from './sky';

export const TZ = 'America/Los_Angeles';
const MS_PER_DAY = 86_400_000;

// ────────────── places ──────────────

export type AlmanacPlace = {
  /** URL segment — /almanac/{slug} */
  slug: string;
  /** Short name used in prose: "El Segundo". */
  name: string;
  /** How the place is written when it needs disambiguating in a <title>. */
  formalName: string;
  lat: number;
  lng: number;
  /** Miles from the El Segundo anchor. 0 for the anchor itself. */
  miles: number;
  /** Compass direction from the anchor. '·' for the anchor itself. */
  direction: string;
  /** One line of local truth — why this place reads the way it does. */
  blurb: string;
  /**
   * Nearest NOAA CO-OPS tide station, when we are certain of the ID.
   *
   * DO NOT GUESS THESE. An invented station ID produces confidently wrong
   * tide predictions for a stretch of coast, which is exactly the failure the
   * "do not invent the water" rule exists to prevent. A place with no entry
   * here links to NOAA's station finder instead, which is the honest answer.
   */
  noaaStation?: { id: string; name: string };
};

/** The anchor. Everything on PointCast is measured from here. */
const EL_SEGUNDO: AlmanacPlace = {
  slug: 'el-segundo',
  name: 'El Segundo',
  formalName: 'El Segundo, California',
  lat: ANCHOR.coords.latitude,
  lng: ANCHOR.coords.longitude,
  miles: 0,
  direction: '·',
  blurb:
    'A grid of low streets between the dunes and the refinery, with LAX on the north fence. ' +
    'The marine layer arrives first here and leaves last.',
  noaaStation: { id: '9410660', name: 'Los Angeles (Outer Harbor)' },
};

/**
 * Per-place editorial + tide-station overlay, keyed by station slug.
 * Anything not listed inherits the station blurb from local.ts and gets no
 * NOAA station ID (see the warning on the type above).
 */
const PLACE_OVERLAY: Record<string, Partial<AlmanacPlace>> = {
  'manhattan-beach': {
    formalName: 'Manhattan Beach, California',
    blurb:
      'Three miles north and one degree warmer. The Strand runs the length of it, ' +
      'and the sun sets over open water with no headland in the way.',
    noaaStation: { id: '9410660', name: 'Los Angeles (Outer Harbor)' },
  },
  hermosa: {
    name: 'Hermosa Beach',
    formalName: 'Hermosa Beach, California',
    blurb:
      'Pier, paddleboards, and the flattest sightline to the horizon in the South Bay. ' +
      'Good sunsets, and you can see the green flash on a clear evening.',
    noaaStation: { id: '9410660', name: 'Los Angeles (Outer Harbor)' },
  },
  'redondo-beach': {
    formalName: 'Redondo Beach, California',
    blurb:
      'King Harbor and Riviera Village. The breakwater changes how the water behaves here — ' +
      'check the harbor gauge, not the open-coast one.',
    noaaStation: { id: '9410660', name: 'Los Angeles (Outer Harbor)' },
  },
  venice: {
    formalName: 'Venice, Los Angeles, California',
    blurb:
      'Canals and boardwalk on the far side of LAX. Same ocean, different weather — ' +
      'the layer often burns off here an hour before it does in El Segundo.',
    noaaStation: { id: '9410840', name: 'Santa Monica' },
  },
  'santa-monica': {
    formalName: 'Santa Monica, California',
    blurb:
      'The bay turns here, so the coastline faces southwest and the sun sets down the length of it. ' +
      'The pier gauge is the reference station for this stretch.',
    noaaStation: { id: '9410840', name: 'Santa Monica' },
  },
  'palos-verdes': {
    name: 'Palos Verdes',
    formalName: 'Palos Verdes, California',
    blurb:
      'The hill. Line-of-sight to Catalina on a clear day, and high enough that sunset ' +
      'runs a minute or two later up top than it does at the water.',
  },
  'long-beach': {
    formalName: 'Long Beach, California',
    blurb:
      'Port, downtown, and the far edge of the circle. Sheltered water and a different sky — ' +
      'the marine layer often stops short of here.',
  },
  'los-angeles': {
    formalName: 'Los Angeles, California',
    blurb:
      'The basin proper. Inland enough that the horizon is hills, not water, so the ' +
      'sun disappears before the computed sunset.',
  },
  malibu: {
    formalName: 'Malibu, California',
    blurb:
      'The coast turns west here and the mountains come down to the water. ' +
      'Sunset over the ocean the whole year, which is rare on this coastline.',
  },
  pasadena: {
    formalName: 'Pasadena, California',
    blurb: 'Under the San Gabriels. No marine layer, ten degrees warmer, and an earlier practical sunset behind the ridge.',
  },
  'anaheim-oc': {
    name: 'Anaheim',
    formalName: 'Anaheim, Orange County, California',
    blurb: 'Inland Orange County. Flat horizon, dry air, and the clearest winter nights within an hour of the anchor.',
  },
  'newport-laguna': {
    name: 'Newport Beach',
    formalName: 'Newport Beach, Orange County, California',
    blurb: 'South-facing coast, so the sun sets across the water at an angle rather than straight down it.',
  },
  'santa-barbara': {
    formalName: 'Santa Barbara, California',
    blurb: 'The coast runs east–west here. The sun sets over the ocean to the west-southwest, and the islands sit on the horizon.',
  },
  'north-san-diego': {
    name: 'North San Diego County',
    formalName: 'North San Diego County, California',
    blurb: 'The southern edge of the lens. Later sunsets than the South Bay in winter, earlier in summer.',
  },
  'palm-springs': {
    formalName: 'Palm Springs, California',
    blurb: 'Desert floor under Mount San Jacinto. The mountain eats the sun well before the computed sunset — often by an hour.',
  },
};

function fromStation(station: Station): AlmanacPlace {
  const overlay = PLACE_OVERLAY[station.slug] ?? {};
  return {
    slug: station.slug,
    name: overlay.name ?? station.name,
    formalName: overlay.formalName ?? `${station.name}, California`,
    lat: station.coords.lat,
    lng: station.coords.lng,
    miles: station.miles,
    direction: station.direction,
    blurb: overlay.blurb ?? station.blurb,
    noaaStation: overlay.noaaStation,
  };
}

/** Every place with an almanac, anchor first, then outward by distance. */
export const ALMANAC_PLACES: AlmanacPlace[] = [
  EL_SEGUNDO,
  ...[...STATIONS].sort((a, b) => a.miles - b.miles).map(fromStation),
];

export function getPlace(slug: string | undefined): AlmanacPlace | undefined {
  return ALMANAC_PLACES.find((p) => p.slug === slug);
}

// ────────────── facets ──────────────

export type FacetSlug = 'sunset' | 'sunrise' | 'moon' | 'daylight';

export type Facet = {
  slug: FacetSlug;
  /** Noun used in headings: "Sunset". */
  label: string;
  /** Title template — the query someone actually types. */
  title: (place: AlmanacPlace) => string;
  description: (place: AlmanacPlace) => string;
};

export const FACETS: Facet[] = [
  {
    slug: 'sunset',
    label: 'Sunset',
    title: (p) => `Sunset time in ${p.name} today`,
    description: (p) =>
      `Today's sunset time in ${p.formalName}, plus tomorrow, the rest of the month, and how fast the evenings are changing. Computed, not forecast.`,
  },
  {
    slug: 'sunrise',
    label: 'Sunrise',
    title: (p) => `Sunrise time in ${p.name} today`,
    description: (p) =>
      `Today's sunrise time in ${p.formalName}, plus tomorrow, the rest of the month, and how fast the mornings are changing. Computed, not forecast.`,
  },
  {
    slug: 'moon',
    label: 'Moon',
    title: (p) => `Moon phase tonight in ${p.name}`,
    description: (p) =>
      `Tonight's moon phase over ${p.formalName}, how lit it is, and the dates of the next full and new moon.`,
  },
  {
    slug: 'daylight',
    label: 'Daylight',
    title: (p) => `How long is the day in ${p.name}`,
    description: (p) =>
      `Hours of daylight today in ${p.formalName}, whether the days are getting longer or shorter, and by how much.`,
  },
];

export function getFacet(slug: string | undefined): Facet | undefined {
  return FACETS.find((f) => f.slug === slug);
}

// ────────────── date plumbing ──────────────

/**
 * The current calendar date *in Pacific time*, as a UTC-midnight Date.
 *
 * This matters: at 6pm on July 25 in El Segundo it is already July 26 in UTC,
 * and `new Date()` would hand back the wrong day. sunTimes() anchors its math
 * on the UTC calendar date, so a UTC-midnight stamp of the Pacific date is
 * exactly the right input for a Pacific location.
 */
export function pacificDate(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** "7:58 PM" in Pacific time. */
export function fmtTime(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** "Saturday, July 25, 2026" */
export function fmtDateLong(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/** "Jul 25" */
export function fmtDateShort(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** "Sat" */
export function fmtWeekday(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(d);
}

/** ISO calendar date, "2026-07-25". */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** "14h 02m" */
export function fmtDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** "+1m 47s" / "−2m 03s" / "no change" — signed, for day-over-day deltas. */
export function fmtSignedDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec === 0) return 'no change';
  const sign = totalSec > 0 ? '+' : '−';
  const abs = Math.abs(totalSec);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return m > 0 ? `${sign}${m}m ${String(s).padStart(2, '0')}s` : `${sign}${s}s`;
}

// ────────────── the day model ──────────────

export type AlmanacDay = {
  /** UTC-midnight stamp of the Pacific calendar date. */
  date: Date;
  iso: string;
  sun: SunTimes;
  moon: MoonPhase;
  /** Daylight change vs the previous day, in ms. Positive = getting longer. */
  daylightDeltaMs: number;
  /** Sunset change vs the previous day, in ms. Positive = setting later. */
  sunsetDeltaMs: number;
  /** Sunrise change vs the previous day, in ms. Positive = rising later. */
  sunriseDeltaMs: number;
};

/**
 * Build one day of almanac data for a place.
 *
 * `now` is threaded through to sunTimes so the "sun is up right now" flags are
 * meaningful on the current day; on any other day they are not used.
 */
export function buildDay(place: AlmanacPlace, date: Date, now: Date = date): AlmanacDay {
  const sun = sunTimes(date, place.lat, place.lng, now);
  const prev = sunTimes(addDays(date, -1), place.lat, place.lng);
  return {
    date,
    iso: isoDate(date),
    sun,
    // Moon phase is global, not per-place — the same face is lit everywhere.
    // Anchor it to local noon so the phase named matches the evening people see.
    moon: moonPhase(new Date(date.getTime() + 12 * 3600_000)),
    daylightDeltaMs: sun.dayLengthMs - prev.dayLengthMs,
    sunsetDeltaMs:
      sun.sunset && prev.sunset
        ? sun.sunset.getTime() - prev.sunset.getTime() - MS_PER_DAY
        : 0,
    sunriseDeltaMs:
      sun.sunrise && prev.sunrise
        ? sun.sunrise.getTime() - prev.sunrise.getTime() - MS_PER_DAY
        : 0,
  };
}

/** `count` consecutive days starting at `start`. */
export function buildRange(place: AlmanacPlace, start: Date, count: number): AlmanacDay[] {
  return Array.from({ length: count }, (_, i) => buildDay(place, addDays(start, i)));
}

/**
 * The four solar turning points of a calendar year, for the "shortest and
 * longest day" table. Computed by scanning, which is exact to the day and
 * avoids hardcoding solstice dates that drift.
 */
export type YearExtremes = {
  longest: AlmanacDay;
  shortest: AlmanacDay;
  earliestSunset: AlmanacDay;
  latestSunset: AlmanacDay;
  earliestSunrise: AlmanacDay;
  latestSunrise: AlmanacDay;
};

export function yearExtremes(place: AlmanacPlace, year: number): YearExtremes {
  const days: AlmanacDay[] = [];
  for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d = addDays(d, 1)) {
    days.push(buildDay(place, d));
  }
  // Minutes-past-midnight in Pacific time, for comparing clock times across a
  // year that contains a DST shift. Comparing raw UTC timestamps would rank
  // "5:00 PM PST" against "5:00 PM PDT" as an hour apart.
  const clockMin = (d: Date | null) => {
    if (!d) return Number.NaN;
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
    return g('hour') * 60 + g('minute');
  };
  const byMin = (pick: (day: AlmanacDay) => Date | null, cmp: (a: number, b: number) => boolean) =>
    days.reduce((best, day) =>
      cmp(clockMin(pick(day)), clockMin(pick(best))) ? day : best,
    );

  return {
    longest: days.reduce((a, b) => (b.sun.dayLengthMs > a.sun.dayLengthMs ? b : a)),
    shortest: days.reduce((a, b) => (b.sun.dayLengthMs < a.sun.dayLengthMs ? b : a)),
    earliestSunset: byMin((d) => d.sun.sunset, (a, b) => a < b),
    latestSunset: byMin((d) => d.sun.sunset, (a, b) => a > b),
    earliestSunrise: byMin((d) => d.sun.sunrise, (a, b) => a < b),
    latestSunrise: byMin((d) => d.sun.sunrise, (a, b) => a > b),
  };
}

// ────────────── direct answers ──────────────

/**
 * The one-sentence answer that leads each facet page.
 *
 * Written to be liftable verbatim into a featured snippet or an AI answer:
 * subject, place, date, value, full stop. The date is always named, so a page
 * served a few days after the build is stale-but-honest rather than wrong —
 * the client-side hydration in AlmanacToday.astro then corrects it to today.
 */
export function directAnswer(place: AlmanacPlace, facet: FacetSlug, day: AlmanacDay): string {
  const when = fmtDateLong(day.date);
  switch (facet) {
    case 'sunset':
      return `Sunset in ${place.name} on ${when} is at ${fmtTime(day.sun.sunset)} Pacific time.`;
    case 'sunrise':
      return `Sunrise in ${place.name} on ${when} is at ${fmtTime(day.sun.sunrise)} Pacific time.`;
    case 'moon':
      return `The moon over ${place.name} on ${when} is a ${day.moon.label}, ${Math.round(
        day.moon.illumination * 100,
      )}% illuminated.`;
    case 'daylight':
      return `${place.name} gets ${fmtDuration(day.sun.dayLengthMs)} of daylight on ${when} — ${
        day.daylightDeltaMs >= 0 ? 'longer' : 'shorter'
      } than yesterday by ${fmtSignedDuration(Math.abs(day.daylightDeltaMs)).replace('+', '')}.`;
  }
}

/** The value a facet page is "about", for the hero readout. */
export function facetValue(facet: FacetSlug, day: AlmanacDay): string {
  switch (facet) {
    case 'sunset':
      return fmtTime(day.sun.sunset);
    case 'sunrise':
      return fmtTime(day.sun.sunrise);
    case 'moon':
      return `${Math.round(day.moon.illumination * 100)}%`;
    case 'daylight':
      return fmtDuration(day.sun.dayLengthMs);
  }
}

// ────────────── NOAA ──────────────

/** Station finder, for places where we do not asserting a specific gauge. */
export const NOAA_STATION_FINDER =
  'https://tidesandcurrents.noaa.gov/map/index.html?region=California';

export function noaaStationUrl(id: string): string {
  return `https://tidesandcurrents.noaa.gov/stationhome.html?id=${id}`;
}
