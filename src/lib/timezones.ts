/**
 * timezones — location string → IANA timezone resolver for the Collab Clock
 * companion (/clock/[id]). Keeps the clock block JSON honest: instead of
 * restating every collaborator's zone, the block opts into `includeCollaborators`
 * and this helper maps their `location` field onto a real tz.
 *
 * Curated on purpose. A full geocoder is overkill for a roster that grows
 * one person at a time; when someone new joins, add a line here alongside
 * their collaborators.ts entry.
 */

import type { Collaborator } from './collaborators';

/** Manual zone from block JSON (authoring surface). */
export interface ClockZone {
  tz: string;            // IANA, e.g. "Asia/Tokyo"
  label: string;         // display, e.g. "Tokyo"
  sublabel?: string;     // optional second line, e.g. "quiet hours"
}

/** Resolved zone rendered on the clock page. `cloud` zones collapse into
 *  one entry so three UTC cards don't stack. */
export interface ResolvedZone {
  tz: string;
  label: string;
  sublabel?: string;
  /** 'collab' when sourced from the roster; 'manual' when from block JSON. */
  origin: 'collab' | 'manual';
}

/**
 * Curated location → IANA map. Keys are matched case-insensitively as
 * substrings of the collaborator's `location` string — so
 * "El Segundo, California, USA" matches "el segundo". Order matters:
 * the first hit wins. Put more specific tokens (cities) above country names.
 */
const LOCATION_MAP: Array<[string, string]> = [
  // Current roster
  ['el segundo', 'America/Los_Angeles'],
  ['california', 'America/Los_Angeles'],
  ['istanbul', 'Europe/Istanbul'],
  ['turkey', 'Europe/Istanbul'],
  // Cloud sentinel — agents with `location: 'cloud'` collapse here
  ['cloud', 'UTC'],
  // Common cities (roster grows into these)
  ['new york', 'America/New_York'],
  ['nyc', 'America/New_York'],
  ['brooklyn', 'America/New_York'],
  ['boston', 'America/New_York'],
  ['miami', 'America/New_York'],
  ['chicago', 'America/Chicago'],
  ['austin', 'America/Chicago'],
  ['denver', 'America/Denver'],
  ['los angeles', 'America/Los_Angeles'],
  ['san francisco', 'America/Los_Angeles'],
  ['seattle', 'America/Los_Angeles'],
  ['portland', 'America/Los_Angeles'],
  ['london', 'Europe/London'],
  ['berlin', 'Europe/Berlin'],
  ['paris', 'Europe/Paris'],
  ['amsterdam', 'Europe/Amsterdam'],
  ['lisbon', 'Europe/Lisbon'],
  ['tokyo', 'Asia/Tokyo'],
  ['seoul', 'Asia/Seoul'],
  ['shanghai', 'Asia/Shanghai'],
  ['hong kong', 'Asia/Hong_Kong'],
  ['singapore', 'Asia/Singapore'],
  ['bangkok', 'Asia/Bangkok'],
  ['dubai', 'Asia/Dubai'],
  ['sydney', 'Australia/Sydney'],
  ['melbourne', 'Australia/Melbourne'],
  ['mexico city', 'America/Mexico_City'],
  ['são paulo', 'America/Sao_Paulo'],
  ['sao paulo', 'America/Sao_Paulo'],
  ['buenos aires', 'America/Argentina/Buenos_Aires'],
];

/** Resolve a free-text location to an IANA timezone. Returns null on miss. */
export function locationToTimezone(location: string | undefined): string | null {
  if (!location) return null;
  const hay = location.toLowerCase();
  for (const [needle, tz] of LOCATION_MAP) {
    if (hay.includes(needle)) return tz;
  }
  return null;
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
      { tz, label, sublabel: sublabel ?? name, origin, names: name ? [name] : [] },
    );
  };

  if (clock?.includeCollaborators !== false) {
    for (const c of collaborators) {
      const tz = locationToTimezone(c.location);
      if (!tz) continue;
      const label = labelFromCollaborator(c);
      push(tz, label, undefined, 'collab', c.name);
    }
  }

  for (const z of clock?.zones ?? []) {
    push(z.tz, z.label, z.sublabel, 'manual');
  }

  return Array.from(out.values()).map(({ names: _, ...rest }) => rest);
}
