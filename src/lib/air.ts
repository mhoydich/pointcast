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
 * - fact (the beach's tide, swell, sun, aqi): the early shift's agent rows
 *   only. People never report or confirm one; the judge says "no human check".
 */
export type AirRole = 'live' | 'side' | 'rating' | 'fact';
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
  /**
   * A desk kind (role 'side', a 30-day decay, 3 points): a stable sign fact
   * the desk may put out a call about. Reports of one are refused
   * (no-open-call) unless a call is live. isDeskKind() in air-kinds.mjs.
   */
  desk?: boolean;
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

/* ---------- the Desk: agents, early-shift feeds and calls (config) ---------- */

/** A house agent. `noun` is a Nouns seed for its portrait (noun.pics); null prints a mono lettermark. */
export type AirDeskAgent = { call: string; name: string; noun: number | null };
export type AirDeskFeedId = 'sky' | 'tides' | 'swell' | 'sun' | 'air';
/**
 * One early-shift feed: the beach kind it files, its one keeper (an agent
 * call), `says` for the byline ("Sol read NOAA at 6:02") and `needs`, the
 * Worker secret without which the feed records a `blocked` gap.
 */
export type AirDeskFeed = { id: AirDeskFeedId; name: string; kind: string; keeper: string; says: string; needs?: string };
/**
 * Every sentence a desk surface prints. `{name}` style placeholders, filled by
 * fill() in functions/_lib/air-desk.mjs from config values and numbers only:
 * no agent sentence ever reaches a page.
 */
export type AirDeskTemplates = {
  byline: string;
  callHead: string;
  belief: string;
  answered: string;
  /** "42 filed with no human check: Tides, Swell." (the agent card, when any fact rows exist). */
  noHumanCheck: string;
  /** The same line for fact rows from a feed the agent no longer keeps. */
  noHumanCheckBare: string;
  record: string;
  onTime: string;
  /** "Put out 3, answered 2, 1 checked." (the agent card's calls line). */
  calls: string;
  /** The agent card's Keeps line for an agent with no early-shift feed. */
  keepsNone: string;
  /** `blocked`: a feed whose key the house has not set — a house gap, never worded as the keeper's miss. */
  log: Record<'filed' | 'filedBare' | 'gap' | 'blocked' | 'ask' | 'pass' | 'answer' | 'expire', string>;
  gapReasons: Record<GapReason | 'missed', string>;
  passReasons: Record<PassReason, string>;
  /** The Morning Edition's sky lines: "cc read KLAX at 6:02: hazy." and "High tide 7:12 AM, low 1:40 PM (Sol, NOAA)." */
  edition: Record<'sky' | 'tides' | 'tide1', string>;
  tideWords: Record<'H' | 'L', string>;
};
export type AirDesk = {
  agents: AirDeskAgent[];
  feeds: AirDeskFeed[];
  /** LA "HH:MM": a feed filed by this counts as on time. */
  onTimeBy: string;
  calls: { perAgentPerDay: number; openPerSpot: number; expireHours: number; maxPasses: number };
  templates: AirDeskTemplates;
};

export type AirConfig = { version: number; reserved: string[]; spots: AirSpot[]; assignTemplates: AirAssignTemplate[]; desk: AirDesk };

/* ---------- the Desk: view contracts (built in functions/_lib/air-desk.mjs) ---------- */

/** air_shift_feeds.reason: `blocked` (the house has not set the key; never counts against On time), else a failed read. */
export type GapReason = 'blocked' | 'upstream' | 'stale' | 'shape';
export type PassReason = 'keeper' | 'off-shift' | 'better-source';
export type CallStatus = 'open' | 'answered' | 'expired';
/** judgeRow(): facts are 'no-check'; other agent rows wait 'pending', then 'unjudged' once decayMin passes unchecked. */
export type Verdict = 'checked' | 'overruled' | 'pending' | 'unjudged' | 'no-check';

/** Times in a detail are ISO seconds, "2026-10-02T13:02:00Z". Heights in feet, water in °F. */
export type SkyDetail = { obsAt: string; visMi: number; ceilFt: number | null; wx: string | null };
export type TideEvent = { type: 'H' | 'L'; at: string; ft: number };
export type TidesDetail = { next: TideEvent[] };
export type SwellDetail = { ft: number; periodS: number | null; dirDeg: number | null; waterF: number | null; obsAt: string };
export type SunDetail = { sunrise: string; sunset: string };
export type AirDetail = { aqi: number; param: string; obsAt: string };
export type DeskDetail = SkyDetail | TidesDetail | SwellDetail | SunDetail | AirDetail;

/**
 * An early-shift fact as a page shows it (deskFact()). `agent` is the call
 * sign, `label` the bucket's button label ("2–3 ft"), `byline` "Sol read NOAA
 * at 6:02" (filed time, LA). Tides are re-read at `now`: `value` is the
 * direction toward the next event and `detail.next` holds only events after now.
 */
export type DeskFact = {
  feed: AirDeskFeedId; agent: string; value: string; label: string; detail: DeskDetail;
  filedAt: string; observedAt: string; byline: string; sourceUrl: string; bars: number;
};
/** GET /api/air/[spot] `desk`: an agent reading, sent only while the human reading is 'none'. `reportId` is confirmable. */
export type DeskReading = DeskFact & { reportId: string; liveUntil: string };
/** BoardPayload.desk: the beach facts the board strip prints; a gap or an expired row is null. */
export type DeskFacts = { tides: DeskFact | null; swell: DeskFact | null; sun: DeskFact | null; air: DeskFact | null };

export type CallRelay = { from: string; to: string; reason: PassReason; at: string };
/**
 * A call from the desk (callView()). `agent` is the holder, `belief` the
 * asker's own agent row, `options` the kind's buckets with "Can't say" last.
 * `status` is 'expired' as soon as expiresAt passes, before any sweep.
 */
export type CallView = {
  id: string; spot: string; kind: string; agent: string; asker: string; question: string;
  belief: { value: string; label: string }; sourceHost: string; sourceUrl: string;
  options: AirOption[]; status: CallStatus; askedAt: string; expiresAt: string; relay: CallRelay[];
};

/**
 * One feed on one morning. `outcome` 'waiting' is today before onTimeBy with
 * no row yet; a morning with no row after that reads 'gap' with reason 'missed'.
 */
export type ShiftFeedView = {
  feed: AirDeskFeedId; keeper: string; outcome: 'filed' | 'gap' | 'waiting';
  reason: GapReason | 'missed' | null; at: string | null; onTime: boolean; reportId: string | null;
};
export type ShiftDay = { day: string; feeds: ShiftFeedView[] };
/** GET /api/air/desk `shift`: today's five feeds. */
export type ShiftView = ShiftDay & { onTimeBy: string };

export type AgentBadge = 'clockwork' | 'checked';
/** An agent stamp: dated the LA day a level was first reached; it survives a break. Never an air_stamps row. */
export type AgentStamp = { badge: AgentBadge; level: number; day: string };
/** /r/agent/[call] and GET /api/air/desk?agent=<call> (agentCard()). */
export type AgentCard = {
  agent: { call: string; name: string; noun: number | null; portrait: string | null };
  keeps: { feed: AirDeskFeedId; name: string; kind: string; says: string }[];
  record: { checked: number; overruled: number; judged: number; pending: number; noHumanCheck: number };
  onTime: { filed: number; mornings: number };
  calls: { asked: number; answered: number; checked: number };
  stamps: AgentStamp[];
  /** Newest first, 30 mornings at most. */
  shiftLog: ShiftDay[];
  nightEditor: null;
};

export type DeskLogKind = 'filed' | 'gap' | 'ask' | 'pass' | 'answer' | 'expire';
/** One Desk Log line (deskLog()): agents are named, people never are ("answered on site"). */
export type DeskLogLine = { at: string; kind: DeskLogKind; agent: string; spot: string; text: string };
/** GET /api/air/desk. */
export type DeskPayload = { calls: CallView[]; shift: ShiftView; log: DeskLogLine[]; nightEditor: null; serverTime: string };

export const AIR_CONFIG = data as unknown as AirConfig;
export const AIR_SPOTS: AirSpot[] = AIR_CONFIG.spots;
export const AIR_RESERVED: readonly string[] = AIR_CONFIG.reserved;
export const AIR_ASSIGN_TEMPLATES: AirAssignTemplate[] = AIR_CONFIG.assignTemplates;
export const AIR_DESK: AirDesk = AIR_CONFIG.desk;
export const AIR_HOME = '/r';
/** The Desk Log page. */
export const DESK_URL = '/r/desk';

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

/* ---------- the Desk: lookups for pages ---------- */

/** An agent by call sign ('sol'), or null. */
export function deskAgent(call: string | null | undefined): AirDeskAgent | null {
  return AIR_DESK.agents.find((a) => a.call === call) ?? null;
}

/** An early-shift feed by id ('tides'), or null. */
export function deskFeed(id: string | null | undefined): AirDeskFeed | null {
  return AIR_DESK.feeds.find((f) => f.id === id) ?? null;
}

/** "/r/agent/sol" */
export const agentUrl = (call: string): string => `${AIR_HOME}/agent/${call}`;

/** The agent's portrait: noun.pics for a Nouns seed (Frog, 779), else null for a lettermark. */
export function agentPortrait(agent: AirDeskAgent): string | null {
  return agent.noun == null ? null : `https://noun.pics/${agent.noun}.svg`;
}

/** The mono lettermark for an agent without a portrait: "C", "S", "T", "L", "M", "F". */
export const agentMark = (agent: AirDeskAgent): string => agent.name.slice(0, 1).toUpperCase();

/** getStaticPaths() for src/pages/r/agent/[call].astro. */
export function agentPaths(): { params: { call: string }; props: { agent: AirDeskAgent } }[] {
  return AIR_DESK.agents.map((agent) => ({ params: { call: agent.call }, props: { agent } }));
}

/** A spot's desk kinds in config order (the court card's hidden call shells): [{kind: 'sign', cfg}]. */
export function deskKinds(spot: AirSpot): { kind: string; cfg: AirKind }[] {
  return Object.entries(spot.kinds).filter(([, cfg]) => cfg.desk === true && cfg.role === 'side').map(([kind, cfg]) => ({ kind, cfg }));
}
