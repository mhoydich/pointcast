/**
 * Room Contract — the JSON shape every PointCast room exports.
 *
 * Sprint 1 of the 2026-05-14 live-artifacts arc. A "room" is a
 * PointCast surface that:
 *   - reads a small set of live status fields from elsewhere on the
 *     broadcast (mood, today's block, presence, now playing, ...)
 *   - offers one or more "programs" the visitor can pick between
 *     (breath patterns, brew styles, drum registers, tide phases)
 *   - exposes a small number of "verbs" the visitor or an agent can
 *     fire to mutate broadcast state (ring, sing, knock, cast, tap)
 *   - renders identically in three places: a Claude artifact, a
 *     pointcast.xyz page, and an embed dropped into someone else's site
 *
 * The first canonical room is /meditate. /meditate.json was already
 * shaped like this informally — this file formalizes the shape so any
 * future room (/coffee, /sunset, /window, /bath-house, /drum) writes
 * to the same contract and the renderer is one piece of code.
 *
 * See docs/room-contract.md for the human-readable companion.
 */

/** Top-level room descriptor. */
export interface RoomSpec {
  /** Pointer to the contract version that produced this payload. */
  $schema: string;
  /** Slug — used as the room's primary identifier. */
  id: string;
  /** Display title. */
  title: string;
  /** One-sentence description. */
  description: string;
  /** Canonical room URL on the originating node. */
  home: string;
  /** ISO timestamp; consumers compare to detect staleness. */
  generatedAt: string;
  /** Which broadcast block this room was born from, if any. */
  archiveBlock?: ArchiveBlock;
  /** Top-of-room live status badges (mood, today's block, etc.). */
  status: StatusBadge[];
  /** Optional centerpiece visualizer config (breath sphere, kettle, drum). */
  visualizer?: Visualizer;
  /** Programs the visitor can pick between. */
  programs: Program[];
  /** Per-room interactive controls (duration, intensity, …). */
  controls: Control[];
  /** Write-back actions. */
  verbs: Verb[];
  /** How presence is sourced and displayed in this room. */
  presence?: PresenceConfig;
  /** Attribution strip rendered at the foot of the room. */
  sources?: SourceLink[];
  /** Related surfaces — rendered as nav links out of the room. */
  related?: { label: string; url: string }[];
  /** Visual identity card. Used by embeds + the rooms index. */
  artifact?: { name: string; image: string };
}

export interface ArchiveBlock {
  id: string;
  url: string;
  jsonUrl?: string;
}

export interface StatusBadge {
  /** Stable id, e.g. "mood", "now-playing". */
  id: string;
  /** Human label, e.g. "NOW PLAYING". */
  label: string;
  /** Current value, e.g. "silent" or "pot on". */
  value: string;
  /** Optional URL that returns a fresh value for live re-reads. */
  source?: string;
}

/**
 * The centerpiece interactive element.
 *
 * - `breath` — a pulsing sphere driven by the active program's pattern
 * - `pour` — a kettle/pour visual driven by duration controls
 * - `tap` — a percussive disc (used by /drum-*)
 * - `wave` — a flat woodblock horizon driven by a tide source
 * - `lantern` — a single hanging lamp; brightness tracks intensity
 */
export interface Visualizer {
  type: 'breath' | 'pour' | 'tap' | 'wave' | 'lantern';
  /** Field on the active Program that drives the visual. */
  binding: string;
}

export interface Program {
  id: string;
  name: string;
  /** Generic numeric pattern; meaning depends on visualizer.type. */
  pattern?: number[];
  /** Short tone descriptor (one sentence or label). */
  tone?: string;
  /** Why this program exists / when to pick it. */
  purpose: string;
  /** Editorial prompts the room rotates through during a session. */
  prompts?: string[];
}

export interface Control {
  id: string;
  /** `duration` is special-cased by the renderer; others are generic. */
  type: 'duration' | 'intensity' | 'select';
  options: ControlOption[];
  defaultId?: string;
}

export interface ControlOption {
  id: string;
  label: string;
  value: string | number;
  /** Optional one-word program name, e.g. "Morning tide" for 2 min. */
  name?: string;
}

/**
 * A write-back action the visitor or an agent can fire from the room.
 *
 * The renderer turns each verb into a button. When clicked, it makes
 * `method` request to `endpoint` with `payload` and renders `receipt`
 * back to the visitor with `{template}` interpolated.
 *
 * Receipt template tokens:
 *   {actor}   — current visitor handle (or "you")
 *   {action}  — verb.id
 *   {arg}     — the payload value if simple
 *   {target}  — the verb.endpoint without scheme/host
 *   {time}    — current local time, HH:MM:SS
 */
export interface Verb {
  id: string;
  label: string;
  description?: string;
  method: 'POST' | 'GET';
  endpoint: string;
  payload?: Record<string, unknown>;
  receipt: { template: string };
}

export interface PresenceConfig {
  /** /presence.json or similar; rendered as humans + agents counts. */
  source: string;
  showHumans: boolean;
  showAgents: boolean;
}

export interface SourceLink {
  label: string;
  url: string;
}

/** Current contract version. Bump when shape changes break consumers. */
export const ROOM_CONTRACT_VERSION = 'v1';
export const ROOM_CONTRACT_SCHEMA = `https://pointcast.xyz/room-contract/${ROOM_CONTRACT_VERSION}.json`;

/**
 * Lightweight runtime validator. Throws on the first violation with a
 * pointer to the offending path. Not a full JSON-schema check — just
 * enough to surface obvious shape bugs at build time when a room is
 * being registered or fetched from a federated node.
 */
export function validateRoomSpec(value: unknown, path = 'room'): RoomSpec {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path}: expected object, got ${typeof value}`);
  }
  const v = value as Record<string, unknown>;

  requireString(v.id, `${path}.id`);
  requireString(v.title, `${path}.title`);
  requireString(v.description, `${path}.description`);
  requireString(v.home, `${path}.home`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  requireArray(v.status, `${path}.status`);
  (v.status as unknown[]).forEach((s, i) => validateStatusBadge(s, `${path}.status[${i}]`));

  requireArray(v.programs, `${path}.programs`);
  if ((v.programs as unknown[]).length === 0) {
    throw new Error(`${path}.programs: at least one program required`);
  }
  (v.programs as unknown[]).forEach((p, i) => validateProgram(p, `${path}.programs[${i}]`));

  requireArray(v.controls, `${path}.controls`);
  (v.controls as unknown[]).forEach((c, i) => validateControl(c, `${path}.controls[${i}]`));

  requireArray(v.verbs, `${path}.verbs`);
  (v.verbs as unknown[]).forEach((vb, i) => validateVerb(vb, `${path}.verbs[${i}]`));

  if (v.visualizer !== undefined) validateVisualizer(v.visualizer, `${path}.visualizer`);
  if (v.archiveBlock !== undefined) validateArchiveBlock(v.archiveBlock, `${path}.archiveBlock`);
  if (v.presence !== undefined) validatePresence(v.presence, `${path}.presence`);

  return value as RoomSpec;
}

function requireString(v: unknown, path: string): void {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
}

function requireArray(v: unknown, path: string): void {
  if (!Array.isArray(v)) {
    throw new Error(`${path}: expected array`);
  }
}

function validateStatusBadge(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  requireString(o.label, `${path}.label`);
  requireString(o.value, `${path}.value`);
}

function validateProgram(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  requireString(o.name, `${path}.name`);
  requireString(o.purpose, `${path}.purpose`);
  if (o.pattern !== undefined && !Array.isArray(o.pattern)) {
    throw new Error(`${path}.pattern: expected array of numbers`);
  }
}

function validateControl(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  if (!['duration', 'intensity', 'select'].includes(o.type as string)) {
    throw new Error(`${path}.type: expected one of duration|intensity|select`);
  }
  requireArray(o.options, `${path}.options`);
}

function validateVerb(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  requireString(o.label, `${path}.label`);
  requireString(o.endpoint, `${path}.endpoint`);
  if (!['POST', 'GET'].includes(o.method as string)) {
    throw new Error(`${path}.method: expected POST or GET`);
  }
  if (!o.receipt || typeof o.receipt !== 'object') {
    throw new Error(`${path}.receipt: expected object with template`);
  }
  requireString((o.receipt as Record<string, unknown>).template, `${path}.receipt.template`);
}

function validateVisualizer(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  if (!['breath', 'pour', 'tap', 'wave', 'lantern'].includes(o.type as string)) {
    throw new Error(`${path}.type: expected one of breath|pour|tap|wave|lantern`);
  }
  requireString(o.binding, `${path}.binding`);
}

function validateArchiveBlock(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  requireString(o.url, `${path}.url`);
}

function validatePresence(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.source, `${path}.source`);
  if (typeof o.showHumans !== 'boolean') throw new Error(`${path}.showHumans: expected boolean`);
  if (typeof o.showAgents !== 'boolean') throw new Error(`${path}.showAgents: expected boolean`);
}

/**
 * Render a receipt template with a context.
 *
 * Example:
 *   renderReceipt("you sang {arg} into {target}", { arg: "alt-c", target: "/drum-v6" })
 *   → "you sang alt-c into /drum-v6"
 */
export function renderReceipt(template: string, ctx: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `{${k}}`);
}
