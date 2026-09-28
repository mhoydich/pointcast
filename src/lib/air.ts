// Field Reports (/r) — the spots, their questions and their frozen v1 buckets.
// One file (src/data/air-spots.json) feeds the pages, the API, the unfurl card
// and the tests; rename a spot there in one line. Pure rules live in
// functions/_lib/air-*.mjs, which take AIR_CONFIG as an argument. Court Call
// timing (COURT_CALL, courtCallState) lives in src/lib/band.ts with the dial.

import data from '../data/air-spots.json';

export type AirOption = { v: string; label: string };
export type AirKind = {
  question: string;
  decayMin: number;
  options: AirOption[];
  /** The reading line for a bucket: "1–4 waiting". Falls back to the option label. */
  readingLabels: Record<string, string>;
  extras: string[];
  editorGuess: string | null;
};
export type AirSpot = {
  id: string;
  name: string;
  short: string;
  channel: string;
  color: string;
  mhz: number;
  noun: number;
  /** Weekday 0-6 (Sun 0) and LA "HH:MM". Only spots with a standing call. */
  courtCall?: { weekday: number; time: string };
  /**
   * Open hours, LA "HH:MM", open inclusive and close exclusive. First Light
   * counts only inside them (inHours() in functions/_lib/air-reading.mjs); a
   * report outside still files, pays and stamps as usual.
   */
  hours: { open: string; close: string };
  kinds: Record<string, AirKind>;
};
export type AirConfig = { version: number; reserved: string[]; spots: AirSpot[] };

export const AIR_CONFIG = data as unknown as AirConfig;
export const AIR_SPOTS: AirSpot[] = AIR_CONFIG.spots;
export const AIR_RESERVED: readonly string[] = AIR_CONFIG.reserved;
export const AIR_HOME = '/r';

/** A spot by id, or null for unknown and reserved ids. */
export function airSpot(id: string | null | undefined): AirSpot | null {
  if (!id || AIR_RESERVED.includes(id)) return null;
  return AIR_SPOTS.find((s) => s.id === id) ?? null;
}

/** A kind config for a spot, or null. */
export function airKind(spotId: string, kind: string): AirKind | null {
  const spot = airSpot(spotId);
  return spot && Object.prototype.hasOwnProperty.call(spot.kinds, kind) ? spot.kinds[kind] : null;
}

/** The spot's first (in v1, only) question: { kind: 'wait', cfg }. */
export function primaryKind(spot: AirSpot): { kind: string; cfg: AirKind } {
  const kind = Object.keys(spot.kinds)[0];
  return { kind, cfg: spot.kinds[kind] };
}

/** The reading line for a stored bucket: labelFor('courts', 'wait', '1-4') → "1–4 waiting". */
export function labelFor(spotId: string, kind: string, value: string | null | undefined): string | null {
  if (value == null) return null;
  const cfg = airKind(spotId, kind);
  if (!cfg) return null;
  return cfg.readingLabels?.[value] ?? cfg.options.find((o) => o.v === value)?.label ?? value;
}

/** The button label for a bucket: optionLabel('courts', 'wait', '0') → "0 · walk on". */
export function optionLabel(spotId: string, kind: string, value: string): string | null {
  return airKind(spotId, kind)?.options.find((o) => o.v === value)?.label ?? null;
}

/** "7.500" */
export const mhzLabel = (spot: AirSpot): string => spot.mhz.toFixed(3);

export const spotUrl = (id: string): string => `${AIR_HOME}/${id}`;
export const spotOgUrl = (id: string): string => `/og/r/${id}.png`;

/** getStaticPaths() for src/pages/r/[spot].astro. */
export function airSpotPaths(): { params: { spot: string }; props: { spot: AirSpot } }[] {
  return AIR_SPOTS.map((spot) => ({ params: { spot: spot.id }, props: { spot } }));
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Fri 7:30 AM" for a spot with a standing Court Call, else null. */
export function courtCallLabel(spot: AirSpot): string | null {
  if (!spot.courtCall) return null;
  const [h, m] = spot.courtCall.time.split(':').map(Number);
  return `${DAYS[spot.courtCall.weekday]} ${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
