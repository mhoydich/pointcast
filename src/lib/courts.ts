// The Pickleball Board (/pickleball) — the South Bay courts, their sourced
// facts and schedules, and the shapes the board's API returns.
//
// src/data/courts-schedule.json holds sourced facts only. Every fact, hours
// object, block and reserve link carries {src, checked, confidence}:
// 'verified' renders, 'partial' renders tagged "unconfirmed", 'unverified'
// never renders, and a fact checked 45+ days ago reads "may have changed"
// (showable() in functions/_lib/court-board.mjs decides). Facts render at
// build time; GET /api/air/board carries only what changes (BoardPayload).
// What can be *reported* at a court lives in src/data/air-spots.json, keyed
// by the same id for every court with `air: true`.
//
// Like src/lib/air.ts, this module imports JSON without an import attribute,
// which Astro and Pages Functions bundle but plain node cannot load: code that
// runs under node tests takes the schedule as an argument (as the air rules
// take AIR_CONFIG) and imports only types from here.

import data from '../data/courts-schedule.json';
import type { AirShape } from './air';
import { monthDay, provenanceText } from './court-format';

export type Confidence = 'verified' | 'partial' | 'unverified';
/** A key of CourtsSchedule.sources: 'ES1', 'MB1', … 'MIKE'. */
export type SourceId = string;
/** `url: null` is a label, not a page ('MIKE': "Mike said"). */
export type Source = { label: string; url: string | null; note?: string };
/** `checked` is an LA day, 'YYYY-MM-DD'. */
export type Provenance = { src: SourceId; checked: string; confidence: Confidence };

/** One sourced line. `key` groups it on the card: address, courts, fee, queue, net, walk-on, … */
export type Fact = Provenance & { key: string; text: string };

/** Weekdays 0-6 (Sun 0), LA "HH:MM"; `close` may be 'dusk' (sunset that day). Open inclusive, close exclusive. */
export type HoursRule = { days: number[]; open: string; close: string };
export type Hours = Provenance & {
  rules: HoursRule[];
  /** Days no rule covers: 'closed', or 'unknown' when the source says nothing. */
  else: 'closed' | 'unknown';
  /** The same source says something else too. Show `text`; `rules` is the other reading. */
  conflict?: { text: string; rules: HoursRule[] };
};

export type BlockKind = 'dropin' | 'priority' | 'closed';
/**
 * A scheduled window. `days` are weekdays 0-6 (Sun 0); `start`/`end` LA
 * "HH:MM", end exclusive; `from`/`until` inclusive LA days, null when the
 * source gives no season. `fee` is display text ("$5"), null when none given.
 * 'priority' says who has the court in `label` ("Basketball priority").
 */
export type Block = Provenance & {
  kind: BlockKind;
  label: string;
  days: number[];
  start: string;
  end: string;
  from: string | null;
  until: string | null;
  fee: string | null;
};

/** A booking link (https: or mailto:), sourced like a fact. */
export type Reserve = Provenance & { label: string; url: string };

export type CourtShape = AirShape;
export type Court = {
  id: string;
  /** True when src/data/air-spots.json has a spot with this id (reports, confirms, readings). */
  air: boolean;
  /** 1-based; ties on the board go to the lower order. */
  order: number;
  name: string;
  short: string;
  city: string;
  /** null when the source gives no shape (a closed court). */
  shape: CourtShape | null;
  /** 'closed' is a standing closure (renovation), not today's hours. */
  status: 'open' | 'closed';
  facts: Fact[];
  hours: Hours | null;
  /** The fact that says you can walk on (key 'walk-on'), or null. */
  walkOn: Fact | null;
  blocks: Block[];
  reserve: Reserve | null;
};
/** Private and paid: listed, never asked about, never rated. */
export type PrivateCourt = { id: string; name: string; city: string; facts: Fact[]; hours: Hours | null; reserve: Reserve | null };
/** "Help us confirm": open questions, never facts. `courts` ids resolve to COURTS (may be empty). */
export type ConfirmItem = { id: string; label: string; courts: string[]; asks: string[]; note: string | null };
export type CourtsSchedule = { version: 1; sources: Record<SourceId, Source>; courts: Court[]; private: PrivateCourt[]; confirm: ConfirmItem[] };

export const COURTS_SCHEDULE = data as unknown as CourtsSchedule;
/** Every listed court, air or not, in board order. */
export const COURTS: Court[] = [...COURTS_SCHEDULE.courts].sort((a, b) => a.order - b.order);
export const PRIVATE_COURTS: PrivateCourt[] = COURTS_SCHEDULE.private;
export const CONFIRM_ITEMS: ConfirmItem[] = COURTS_SCHEDULE.confirm;
export const COURT_SOURCES: Record<SourceId, Source> = COURTS_SCHEDULE.sources;

/** A listed court by id, or null. */
export function courtById(id: string | null | undefined): Court | null {
  if (!id) return null;
  return COURTS.find((c) => c.id === id) ?? null;
}

/** A source by id, or null. */
export function sourceOf(src: SourceId, schedule: CourtsSchedule = COURTS_SCHEDULE): Source | null {
  return Object.prototype.hasOwnProperty.call(schedule.sources, src) ? schedule.sources[src] : null;
}

/** "Sep 28" for '2026-09-28'. */
export function checkedLabel(day: string): string {
  return monthDay(day);
}

/**
 * The provenance line every rendered fact carries: "from rec.us, checked Sep 28".
 * A label source (no url) reads "Mike said, Sep 28". Tags ("unconfirmed",
 * "may have changed") come from showable(), not from here.
 */
export function provenanceLine(p: Provenance, schedule: CourtsSchedule = COURTS_SCHEDULE): string {
  // One wording for the page and the client (src/lib/court-format.ts carries no JSON, so the browser can use it too).
  return provenanceText(p, schedule.sources);
}

/* ---------- GET /api/air/board: the payload (group A builds it, B and C read it) ---------- */

/** KLAX conditions (court-conditions.ts). Every part may be null when its feed is down. */
export type Conditions = {
  /** When the KLAX METAR row was observed, ISO; null without one. */
  observedAt: string | null;
  /** `dir` is degrees true, 'VRB', or null. `words` is windWords(): null under 15 mph. */
  wind: { mph: number; gustMph: number | null; dir: number | 'VRB' | null; words: string | null } | null;
  tempF: number | null;
  /** heatWords(): "court runs 10–20° hotter than the air" over 85°F, else null. */
  heat: string | null;
  /** wetWords(): "wet paint, no traction" when the METAR shows DZ or RA, else null. */
  wet: string | null;
  /** The marine-layer oracle's line ("burned off 10:40") and when it opened, ISO. */
  marine: { label: string; openedAt: string | null } | null;
  /** Today's sunset in El Segundo, ISO. */
  sunset: string | null;
  /** nwsNext3h(): the next three hours from NWS LOX/148,40. */
  next3h: { maxWindMph: number | null; maxPop: number | null; short: string | null } | null;
};

/** Every feed down: the response is still 200 with this. */
export const EMPTY_CONDITIONS: Conditions = Object.freeze({
  observedAt: null, wind: null, tempF: null, heat: null, wet: null, marine: null, sunset: null, next3h: null,
}) as Conditions;

/** A live reading (reading() in air-reading.mjs, trimmed). null when there is none. `crew` is null for non-live kinds. */
export type BoardReading = {
  value: string;
  label: string;
  status: 'single' | 'agree';
  support: number;
  /** The report "Still true?" confirms; null when every supporter has since changed it. */
  reportId: string | null;
  ageMin: number;
  bars: number;
  liveUntil: string;
  bylines: string[];
  crew: { id: string; n: number; at: string } | null;
};
/** Today's last on-site report at a spot for a kind, live or not. */
export type BoardLast = { value: string; label: string; observedAt: string; byline: string };
/**
 * qualityVibe(): 30 days of on-site ratings, latest per phone; null under 3.
 * `mode`/`label` are the most-rated bucket and its reading label ("Solid");
 * `runnerUp` is the second bucket's label, only at 30%+ of `n`; `chips` are
 * extras by count, most first.
 */
export type BoardVibe = { mode: string; label: string; runnerUp: string | null; n: number; chips: { v: string; n: number }[] };
/** A block running now; `until` is its LA end, "7 PM" / "12:30 PM". */
export type BoardSession = { block: Block; until: string };
/** The soonest block within 7 days, never past its `until`; `when` is "Sat 9 AM" / "today 5 PM". */
export type BoardNext = { block: Block; when: string };

export type BoardCourt = {
  id: string;
  /** openState(): 'closed' for a closed court; 'unknown' without verified hours. */
  status: 'open' | 'closed' | 'unknown';
  now: BoardSession[];
  next: BoardNext | null;
  readings: { wait: BoardReading | null; parking: BoardReading | null };
  last: { wait: BoardLast | null; parking: BoardLast | null };
  vibe: BoardVibe | null;
};
/**
 * bestBet(): the first rule that matches, ties to `order`. `line` is the hero
 * line. `prov` is where a scheduled answer came from (the running or next
 * block, or the walk-on fact) so the hero can print its source and date;
 * null for a live reading, which is its own evidence.
 */
export type BoardBest = { court: string; reason: 'live' | 'dropin' | 'open' | 'next'; line: string; prov: Provenance | null };

export type BoardPayload = {
  serverTime: string;
  /** Distinct on-site phones and courts today (reports plus on-site "still" confirms). */
  validatorsToday: { phones: number; courts: number };
  conditions: Conditions;
  best: BoardBest | null;
  /** One per COURTS entry, in board order (air: false courts carry null readings). */
  courts: BoardCourt[];
};
