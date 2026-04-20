/**
 * timezones — location string → IANA timezone + lat/lon resolver for the
 * Collab Clock companion (/clock/[id]). Keeps the clock block JSON honest:
 * instead of restating every collaborator's zone, the block opts into
 * `includeCollaborators` and this helper maps their `location` field onto
 * a real tz + coordinates. The coordinates power the planetary clock
 * (sunrise/sunset, planetary hour, season) without an external geocoder.
 *
 * Curated on purpose. A full geocoder is overkill for a roster that grows
 * one person at a time; when someone new joins, add a line here alongside
 * their collaborators.ts entry.
 */

import type { Collaborator } from './collaborators';

/** Manual zone from block JSON (authoring surface). Lat/lon optional —
 *  falls back to a lookup against the location map by label. */
export interface ClockZone {
  tz: string;            // IANA, e.g. "Asia/Tokyo"
  label: string;         // display, e.g. "Tokyo"
  sublabel?: string;     // optional second line, e.g. "quiet hours"
  lat?: number;          // decimal degrees, north +
  lon?: number;          // decimal degrees, east +
}

/** Resolved zone rendered on the clock page. Always carries lat/lon so
 *  downstream astronomy code (sunrise/sunset/planetary hour) can work.
 *  `cloud` zones collapse into one entry so three UTC cards don't stack. */
export interface ResolvedZone {
  tz: string;
  label: string;
  sublabel?: string;
  lat: number;
  lon: number;
  /** 'collab' when sourced from the roster; 'manual' when from block JSON. */
  origin: 'collab' | 'manual';
}

interface LocationEntry {
  needle: string;        // lowercase substring
  tz: string;            // IANA
  lat: number;           // decimal degrees, north +
  lon: number;           // decimal degrees, east +
}

/**
 * Curated location → (IANA, lat, lon) map. Keys are matched case-insensitively
 * as substrings of the collaborator's `location` string — so
 * "El Segundo, California, USA" matches "el segundo". Order matters: the
 * first hit wins. Put more specific tokens (cities) above country names.
 *
 * Coordinates are the city center, good enough for sunrise/sunset +
 * planetary hour math (±1min accuracy within ~50km of the point).
 */
const LOCATION_MAP: LocationEntry[] = [
  // Current roster anchors
  { needle: 'el segundo',  tz: 'America/Los_Angeles', lat: 33.919, lon: -118.416 },
  { needle: 'mallorca',    tz: 'Europe/Madrid',       lat: 39.570, lon: 2.650 },
  { needle: 'majorca',     tz: 'Europe/Madrid',       lat: 39.570, lon: 2.650 },
  { needle: 'palma',       tz: 'Europe/Madrid',       lat: 39.570, lon: 2.650 },
  // Cloud sentinel — agents with `location: 'cloud'` collapse here. Lat/lon
  // at 0/0 would place them in the Gulf of Guinea; use London instead so
  // sunrise/planetary hour are at least plausible for "always-on UTC."
  { needle: 'cloud',       tz: 'UTC',                 lat: 51.507, lon: -0.128 },
  // Additional named zones Mike asked for
  { needle: 'medway',      tz: 'America/New_York',    lat: 42.141, lon: -71.398 },
  { needle: 'new york',    tz: 'America/New_York',    lat: 40.713, lon: -74.006 },
  { needle: 'nyc',         tz: 'America/New_York',    lat: 40.713, lon: -74.006 },
  { needle: 'brooklyn',    tz: 'America/New_York',    lat: 40.678, lon: -73.944 },
  { needle: 'boston',      tz: 'America/New_York',    lat: 42.360, lon: -71.058 },
  { needle: 'miami',       tz: 'America/New_York',    lat: 25.761, lon: -80.192 },
  { needle: 'chicago',     tz: 'America/Chicago',     lat: 41.878, lon: -87.630 },
  { needle: 'austin',      tz: 'America/Chicago',     lat: 30.267, lon: -97.743 },
  { needle: 'denver',      tz: 'America/Denver',      lat: 39.739, lon: -104.990 },
  { needle: 'los angeles', tz: 'America/Los_Angeles', lat: 34.052, lon: -118.244 },
  { needle: 'san francisco', tz: 'America/Los_Angeles', lat: 37.775, lon: -122.419 },
  { needle: 'seattle',     tz: 'America/Los_Angeles', lat: 47.606, lon: -122.332 },
  { needle: 'portland',    tz: 'America/Los_Angeles', lat: 45.515, lon: -122.680 },
  { needle: 'honolulu',    tz: 'Pacific/Honolulu',    lat: 21.307, lon: -157.858 },
  { needle: 'hawaii',      tz: 'Pacific/Honolulu',    lat: 21.307, lon: -157.858 },
  { needle: 'istanbul',    tz: 'Europe/Istanbul',     lat: 41.013, lon: 28.979 },
  { needle: 'turkey',      tz: 'Europe/Istanbul',     lat: 41.013, lon: 28.979 },
  { needle: 'london',      tz: 'Europe/London',       lat: 51.507, lon: -0.128 },
  { needle: 'dublin',      tz: 'Europe/Dublin',       lat: 53.350, lon: -6.260 },
  { needle: 'berlin',      tz: 'Europe/Berlin',       lat: 52.520, lon: 13.405 },
  { needle: 'paris',       tz: 'Europe/Paris',        lat: 48.857, lon: 2.352 },
  { needle: 'amsterdam',   tz: 'Europe/Amsterdam',    lat: 52.368, lon: 4.904 },
  { needle: 'lisbon',      tz: 'Europe/Lisbon',       lat: 38.722, lon: -9.139 },
  { needle: 'madrid',      tz: 'Europe/Madrid',       lat: 40.417, lon: -3.704 },
  { needle: 'mallorca',    tz: 'Europe/Madrid',       lat: 39.570, lon: 2.650 },
  { needle: 'palma',       tz: 'Europe/Madrid',       lat: 39.570, lon: 2.650 },
  { needle: 'barcelona',   tz: 'Europe/Madrid',       lat: 41.390, lon: 2.170 },
  { needle: 'spain',       tz: 'Europe/Madrid',       lat: 40.417, lon: -3.704 },
  { needle: 'barcelona',   tz: 'Europe/Madrid',       lat: 41.385, lon: 2.173 },
  { needle: 'spain',       tz: 'Europe/Madrid',       lat: 40.417, lon: -3.704 },
  { needle: 'reykjavik',   tz: 'Atlantic/Reykjavik',  lat: 64.146, lon: -21.942 },
  { needle: 'tokyo',       tz: 'Asia/Tokyo',          lat: 35.682, lon: 139.692 },
  { needle: 'kyoto',       tz: 'Asia/Tokyo',          lat: 35.012, lon: 135.768 },
  { needle: 'seoul',       tz: 'Asia/Seoul',          lat: 37.566, lon: 126.978 },
  { needle: 'shanghai',    tz: 'Asia/Shanghai',       lat: 31.230, lon: 121.474 },
  { needle: 'hong kong',   tz: 'Asia/Hong_Kong',      lat: 22.320, lon: 114.170 },
  { needle: 'singapore',   tz: 'Asia/Singapore',      lat: 1.352,  lon: 103.820 },
  { needle: 'bangkok',     tz: 'Asia/Bangkok',        lat: 13.756, lon: 100.502 },
  { needle: 'dubai',       tz: 'Asia/Dubai',          lat: 25.204, lon: 55.271 },
  { needle: 'mumbai',      tz: 'Asia/Kolkata',        lat: 19.076, lon: 72.878 },
  { needle: 'sydney',      tz: 'Australia/Sydney',    lat: -33.869, lon: 151.209 },
  { needle: 'melbourne',   tz: 'Australia/Melbourne', lat: -37.814, lon: 144.963 },
  { needle: 'auckland',    tz: 'Pacific/Auckland',    lat: -36.848, lon: 174.763 },
  { needle: 'mexico city', tz: 'America/Mexico_City', lat: 19.433, lon: -99.133 },
  { needle: 'são paulo',   tz: 'America/Sao_Paulo',   lat: -23.550, lon: -46.633 },
  { needle: 'sao paulo',   tz: 'America/Sao_Paulo',   lat: -23.550, lon: -46.633 },
  { needle: 'rio de janeiro', tz: 'America/Sao_Paulo', lat: -22.907, lon: -43.173 },
  { needle: 'buenos aires', tz: 'America/Argentina/Buenos_Aires', lat: -34.604, lon: -58.382 },
  { needle: 'santiago',    tz: 'America/Santiago',    lat: -33.449, lon: -70.669 },
  // California broad match — goes LAST so specific cities above take priority.
  { needle: 'california',  tz: 'America/Los_Angeles', lat: 36.779, lon: -119.418 },
];

/** Internal resolver: return full (tz, lat, lon) tuple for a location string. */
function resolveLocation(location: string | undefined): LocationEntry | null {
  if (!location) return null;
  const hay = location.toLowerCase();
  for (const entry of LOCATION_MAP) {
    if (hay.includes(entry.needle)) return entry;
  }
  return null;
}

/** Resolve a free-text location to an IANA timezone. Returns null on miss. */
export function locationToTimezone(location: string | undefined): string | null {
  return resolveLocation(location)?.tz ?? null;
}

/** Produce a short display label from a collaborator. Prefers the first
 *  token of their location (city) over the full string. Cloud agents get
 *  a vendor-aware label so the UI can merge them. */
function labelFromCollaborator(c: Collaborator): string {
  if (!c.location || c.location.toLowerCase() === 'cloud') {
    return c.vendor ? `Cloud · ${c.vendor}` : 'Cloud';
  }
  // "El Segundo, California, USA" → "El Segundo"
  return c.location.split(',')[0].trim();
}

/**
 * Merge collaborator-derived zones with manual extras. Dedupes by tz:
 * if two people share a zone, the second name goes into the sublabel
 * ("Mike Hoydich + 1 more"). Cloud collaborators always collapse.
 * Every resolved zone carries lat/lon so downstream astronomy can work.
 */
export function resolveZones(
  clock: {
    includeCollaborators?: boolean;
    zones?: ClockZone[];
  } | undefined,
  collaborators: Collaborator[],
): ResolvedZone[] {
  const out = new Map<string, ResolvedZone & { names: string[] }>();

  const push = (
    tz: string,
    label: string,
    sublabel: string | undefined,
    lat: number,
    lon: number,
    origin: 'collab' | 'manual',
    name?: string,
  ) => {
    const key = `${origin}:${tz}:${label}`;
    const existing = out.get(key) ?? (origin === 'collab' ? out.get(`collab:${tz}`) : undefined);
    if (existing) {
      if (name && !existing.names.includes(name)) existing.names.push(name);
      if (existing.names.length > 1) {
        existing.sublabel = `${existing.names[0]} + ${existing.names.length - 1} more`;
      }
      return;
    }
    out.set(
      origin === 'collab' ? `collab:${tz}` : key,
      { tz, label, sublabel: sublabel ?? name, lat, lon, origin, names: name ? [name] : [] },
    );
  };

  if (clock?.includeCollaborators !== false) {
    for (const c of collaborators) {
      const entry = resolveLocation(c.location);
      if (!entry) continue;
      const label = labelFromCollaborator(c);
      push(entry.tz, label, undefined, entry.lat, entry.lon, 'collab', c.name);
    }
  }

  for (const z of clock?.zones ?? []) {
    // Prefer authored lat/lon; fall back to a label or tz lookup.
    let lat = z.lat;
    let lon = z.lon;
    if (lat === undefined || lon === undefined) {
      const entry = resolveLocation(z.label) ?? resolveLocation(z.tz);
      if (entry) {
        lat = entry.lat;
        lon = entry.lon;
      }
    }
    if (lat === undefined || lon === undefined) {
      // Last resort — use the prime meridian. Sun/planetary math will be
      // wildly off but the card still renders. Shouldn't happen in
      // practice; LOCATION_MAP covers every manual zone we author.
      lat = 0;
      lon = 0;
    }
    push(z.tz, z.label, z.sublabel, lat, lon, 'manual');
  }

  return Array.from(out.values()).map(({ names: _, ...rest }) => rest);
}
