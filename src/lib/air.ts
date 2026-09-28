// Field Reports (/r) — the spots, their questions and their frozen v1 buckets.
// One file (src/data/air-spots.json) feeds the pages, the API, the unfurl card
// and the tests; rename a spot there in one line. Pure rules live in
// functions/_lib/air-*.mjs, which take AIR_CONFIG as an argument. Court Call
// timing (COURT_CALL, courtCallState) lives in src/lib/band.ts with the dial.

import data from '../data/air-spots.json';

export type AirOption = { v: string; label: string };
/**
 * What a kind does beyond filing (kindRole() in functions/_lib/air-kinds.mjs):
 * - live (the default when absent, today's behavior): a reading and confirms,
 *   First Light, the station post and the crew.
 * - side (parking): a reading and confirms; no First Light, post or crew.
 * - rating (vibe): a 30-day aggregate; no reading on the board, no confirms.
 */
export type AirRole = 'live' | 'side' | 'rating';
/** The question set a spot asks and its card's schedule block (src/data/courts-schedule.json). */
export type AirShape = 'paddle-rack' | 'reservation+drop-in' | 'first-come';
export type AirKind = {
  question: string;
  decayMin: number;
  options: AirOption[];
  /** The reading line for a bucket: "1–4 waiting". Falls back to the option label. */
  readingLabels: Record<string, string>;
  extras: string[];
  editorGuess: string | null;
  /** Absent is 'live'. */
  role?: AirRole;
  /** Units an on-site report pays (a "cant" still pays 1). Absent is 6. */
  points?: number;
  /** 'week': a report pays once per spot per LA Monday-week (ref `spot:kind:w<weekOf(day)>`). Absent: once per decay window. */
  payEvery?: 'week';
};
export type AirSpot = {
  id: string;
  name: string;
  short: string;
  channel: string;
  color: string;
  mhz: number;
  noun: number;
  /** Pickleball spots only: its shape in src/data/courts-schedule.json. */
  shape?: AirShape;
  /** Weekday 0-6 (Sun 0) and LA "HH:MM". Only spots with a standing call. */
  courtCall?: { weekday: number; time: string };
  /**
   * Open hours, LA "HH:MM", open inclusive and close exclusive. First Light
   * counts only inside them (inHours() in functions/_lib/air-reading.mjs); a
   * report outside still files, pays and stamps as usual. Set only where the
   * hours are verified: a spot without them never counts First Light.
   */
  hours?: { open: string; close: string };
  kinds: Record<string, AirKind>;
};
/**
 * An assignment template (/r/assign): a spot, one of its existing question
 * kinds, a default LA start "HH:MM" inside the spot's hours, a window length
 * in minutes and a default seat count (1-3). The house picks a template, a
 * date and seats; nothing else is typed in. Rules live in
 * functions/_lib/air-assign.mjs.
 */
export type AirAssignTemplate = { id: string; spot: string; kind: string; label: string; start: string; min: number; seats: number };
export type AirConfig = { version: number; reserved: string[]; spots: AirSpot[]; assignTemplates: AirAssignTemplate[] };

export const AIR_CONFIG = data as unknown as AirConfig;
export const AIR_SPOTS: AirSpot[] = AIR_CONFIG.spots;
export const AIR_RESERVED: readonly string[] = AIR_CONFIG.reserved;
export const AIR_ASSIGN_TEMPLATES: AirAssignTemplate[] = AIR_CONFIG.assignTemplates;
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

/** The spot's first question, the one /r/[spot] asks: { kind: 'wait', cfg }. Key order in the JSON is the contract. */
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
