/**
 * pointcast-presence Worker — standalone Durable Object host.
 *
 * Cloudflare Pages Functions cannot export DO classes; DOs must live in
 * a dedicated Worker that Pages references via `script_name` binding.
 * This Worker holds the PresenceRoom class + a minimal fetch handler
 * that routes every request to the DO.
 *
 * Two consumption modes — same class, different name derivations:
 *   1. Global presence (functions/api/presence.ts → idFromName('global'))
 *      — visitor count, here grid, intel. Broadcasts at 1 Hz.
 *   2. Cursor/chat rooms (functions/api/room.ts → idFromName('room:<path>'))
 *      — per-URL multiplayer cursors + chat ring buffer. Broadcasts
 *      at 100 ms while any visitor is actively cursor-moving, then
 *      relaxes to 1 Hz when idle.
 *
 * New message types (Phase 2):
 *   cursor : { type:'cursor', x:int, y:int }  // viewport-normalized ×10000
 *   chat   : { type:'chat', msg:string }      // <=120 chars, ring buffered
 * These are additive — the broadcast payload simply gains `peers` and
 * `chat` arrays (empty in the global room since nobody sends there).
 *
 * The rope (/tug):
 *   GET  /tug  → { ok, tug: { humanPulls, machinePulls, knot, updatedAt }, now }
 *   POST /tug  ← { side:'human'|'machine', by?:string }  → same shape, 429 when rate-limited
 *   The `global` instance is the only one that is ever pulled. `tug` is
 *   also appended to the broadcast payload and /snapshot once the rope
 *   has been pulled at least once. Persistent — this is the only counter
 *   on PointCast that survives past a 60-second buffer.
 *
 * Site-wide bursts (/burst):
 *   POST /burst ← { kind, by:{handle?/noun?}, meta, clientId? }
 *   WS   /burst → normal presence payload + bursts (last 20 in memory)
 *   Kinds: mint, claim, tug, bell, ping-answered, cast. New broadcasts are globally
 *   capped at one per second; same-kind arrivals coalesce. No burst touches KV.
 *
 * Visitor intel (option-B privacy):
 *   Public surface (what every visitor sees about every other visitor):
 *     nounId, kind, joinedAt, mood, listening, where, country, deviceClass.
 *   Private surface (only visible to the session it belongs to, as `you`):
 *     city, region, timezone, asn, asOrg, colo, referrerHost, relay,
 *     walletAddress, nostrPubkey, pathTrail, isReturning, dwellSeconds.
 *   The DO personalizes every broadcast + /snapshot response per viewer
 *   — your own full detail arrives as `you`; everyone else is trimmed.
 *
 * Deploy: `cd workers/presence && npx wrangler deploy`.
 * Bind from Pages: root wrangler.toml has
 *   [[durable_objects.bindings]]
 *   name = "PRESENCE"
 *   class_name = "PresenceRoom"
 *   script_name = "pointcast-presence"
 */

interface Env {
  PRESENCE: DurableObjectNamespace;
}

type PresenceKind = 'human' | 'agent' | 'wallet';
type DeviceClass = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

interface EdgeContext {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  asn?: number;
  asOrg?: string;
  colo?: string;
  deviceClass?: DeviceClass;
  referrerHost?: string;
  relay?: string;
}

interface Connection {
  id: string;
  sessionId: string;
  ws: WebSocket;
  lastSeen: number;
}

interface VisitorSession {
  sessionId: string;
  nounId: number;
  mood?: string;
  listening?: string;
  where?: string;
  kind: PresenceKind;
  joinedAt: string;
  lastSeen: number;
  edge: EdgeContext;
  walletAddress?: string;
  nostrPubkey?: string;
  pathTrail: string[];
  isReturning: boolean;
  // Phase 2 — cursor/chat rooms. Null until the visitor starts moving.
  cursor?: { x: number; y: number; at: number } | null;
  tag?: string; // short display tag attached to cursor + chat ('visitor', '0x12…abcd')
  // Phase 3 — current page (broadcast publicly so peers can see + follow).
  // Distinct from `where` (self-reported town) and `pathTrail` (private
  // history). Always a leading-'/' relative URL with no query or fragment.
  currentPath?: string;
}

interface PeerView {
  sessionId: string; // opaque id used only client-side for DOM reuse
  nounId: number;
  kind: PresenceKind;
  tag: string;
  x: number; // quantized 0–10000
  y: number; // quantized 0–10000
  at: number; // server time of last cursor update
}

interface ChatEntry {
  id: string; // server-assigned; clients use this instead of timing-based echo guesses
  who: string; // tag
  nounId: number;
  msg: string;
  at: number; // server ms
  sid: string; // first 8 chars of session id — stable-per-visitor grouping
  // Phase 3 — sender's currentPath at send time. Snapshotted so the
  // client can scope the WIRE panel to "this room" vs "all"; subsequent
  // peer navigation does not retroactively re-tag this entry.
  room?: string;
  // Phase 4 — optional cursor anchor. When present, peers render this
  // entry as a floating bubble above the sender's cursor (also TTL'd)
  // in addition to the WIRE log line. Coords are 0..10000 quantized
  // viewport-normalized integers, mirroring the cursor protocol.
  bubble?: { x: number; y: number };
}

/**
 * Phase 3 — directional ephemeral signal between two visitors. Sender
 * broadcasts {to, emoji}; everyone sees it (so spectators can read the
 * social texture), but only the targeted noun's client renders the
 * "you got waved at" affordance. TTL 8s — receive then forget.
 */
interface WaveEntry {
  fromNoun: number;
  toNoun: number;
  emoji: string; // short opaque payload — 👋 default, capped + sanitized server-side
  at: number;
  // Phase 4 — optional "BRING" target. When set, the wave doubles as a
  // teleport invitation: recipient renders a one-click chip "noun X
  // wants you on /drum →". Path is sanitized server-side same as
  // currentPath (leading-/, no //, no query/fragment, ASCII subset).
  targetPath?: string;
}

/**
 * Phase 4 — broadcast vibe reaction. Lightweight, room-scoped, no
 * recipient. Anyone in PEOPLES HERE can tap an emoji and the chip
 * floats up the screen of every co-room peer. Acts as a feedback
 * pulse so the people running the broadcast (Mike, agents) can see
 * what lands. TTL 6s.
 */
interface VibeEntry {
  fromNoun: number;
  emoji: string;
  room?: string; // sender's currentPath at send time
  at: number;
}

/**
 * Generic room-scoped interaction pulse. Pages that only need "someone
 * clicked here" fan-out (Yee Choir, Aurora, lightweight games) can ride
 * the existing /api/room WebSocket without inventing a new Durable Object.
 * TTL 5s; clients dedupe via id and ignore their own sid echo when needed.
 */
interface SignalEntry {
  id: string;
  event: string;
  sid: string;
  fromNoun: number;
  at: number;
  room?: string;
  x?: number;
  y?: number;
  hue?: number;
}

/**
 * TUG — the one rope across the town (/tug).
 *
 * Every other write surface on PointCast lands in a 60-second TTL buffer,
 * so an agent that visits leaves no trace once the minute is up. The rope
 * is the exception: two counters that never reset, kept in DO storage
 * rather than KV precisely because a tug-of-war is a ledger and KV's
 * read-modify-write races (see functions/api/duel.ts's own header) drop
 * events when two pullers land in the same millisecond. Inside a Durable
 * Object the mutation is a synchronous edit of one in-memory object, so
 * nothing is lost.
 *
 * `knot` is the live position, −1 (all the way to the people's end)
 * through 0 (dead centre) to +1 (all the way to the machines'). It is
 * never persisted "as of now" — it is persisted with `updatedAt`, and
 * every reader decays it lazily from that stamp. No alarm, no cron, no
 * background tick: the rope slackens on its own just by time passing.
 *
 * Only the `global` DO instance ever receives a pull; room instances
 * carry a zeroed state and are omitted from the payload entirely.
 */
interface TugState {
  humanPulls: number;
  machinePulls: number;
  knot: number; // −1 people … 0 centre … +1 machines, at `updatedAt`
  updatedAt: number;
}

/** Read-time view: `knot` decayed to now, tallies untouched. */
interface TugView {
  humanPulls: number;
  machinePulls: number;
  knot: number;
  updatedAt: number;
}

type BurstKind = 'mint' | 'claim' | 'tug' | 'bell' | 'ping-answered' | 'cast';

interface BurstBy {
  handle?: string;
  noun?: number;
}

/** Ephemeral site-wide event. Kept in DO memory only; never written to KV. */
interface BurstEvent {
  kind: BurstKind;
  at: number;
  by: BurstBy;
  meta: Record<string, string | number | boolean>;
}

interface PublicSessionView {
  nounId: number;
  kind: PresenceKind;
  joinedAt: string;
  mood?: string;
  listening?: string;
  where?: string;
  country?: string;
  deviceClass?: DeviceClass;
  // Phase 3 — peer current page. Public so any viewer can see + follow.
  currentPath?: string;
}

interface PrivateSessionView extends PublicSessionView {
  city?: string;
  region?: string;
  timezone?: string;
  asn?: number;
  asOrg?: string;
  colo?: string;
  referrerHost?: string;
  relay?: string;
  walletAddress?: string;
  nostrPubkey?: string;
  pathTrail?: string[];
  isReturning?: boolean;
  dwellSeconds?: number;
}

interface BroadcastPayload {
  humans: number;
  agents: number;
  sessions: PublicSessionView[];
  peers?: PeerView[]; // cursor positions of other active visitors (last 20s)
  chat?: ChatEntry[]; // room chat ring buffer (last 20 entries)
  waves?: WaveEntry[]; // directional waves emitted in the last WAVE_TTL_MS
  vibes?: VibeEntry[]; // broadcast emoji reactions, TTL 6s
  signals?: SignalEntry[]; // generic room-scoped interaction pulses, TTL 5s
  tug?: TugView; // the one rope — persistent tallies + lazily-decayed knot
  bursts?: BurstEvent[]; // site-wide ephemeral ring (last 20, memory only)
  you?: PrivateSessionView;
}

type ClientMessage =
  | {
      type?: 'identify' | 'update' | 'ping' | 'cursor' | 'chat' | 'wave' | 'vibe' | 'signal';
      nounId?: unknown;
      mood?: unknown;
      listening?: unknown;
      where?: unknown;
      walletAddress?: unknown;
      nostrPubkey?: unknown;
      tag?: unknown;
      x?: unknown;
      y?: unknown;
      msg?: unknown;
      currentPath?: unknown;
      event?: unknown;
      hue?: unknown;
      to?: unknown;
      emoji?: unknown;
      targetPath?: unknown;
      bubble?: unknown;
    }
  | null
  | undefined;

const MAX_BROADCAST_SESSIONS = 50;
const STALE_AFTER_MS = 90_000;
const MAX_PATH_TRAIL = 5;
const SEEN_KEY_PREFIX = 'seen:';

// Phase 2 — cursor/chat room tunables.
const CURSOR_COORD_MAX = 10_000; // viewport-normalized integer coords
const PEER_CURSOR_TTL_MS = 20_000; // hide peers whose last cursor > 20s old
const MAX_PEER_BROADCAST = 30; // cap broadcast peer list
const MAX_CHAT_BUFFER = 20; // ring buffer depth
const MAX_CHAT_MSG = 120; // char cap
const WAVE_TTL_MS = 8_000; // waves vanish from broadcast after 8s
const MAX_WAVE_BUFFER = 30; // cap concurrent in-flight waves
const MAX_WAVE_EMOJI_LEN = 8; // emoji payload byte cap (multi-codepoint allowed)
const WAVE_RATE_PER_SESSION = 4; // max 4 waves per WAVE_RATE_WINDOW_MS
const WAVE_RATE_WINDOW_MS = 10_000;
// Phase 4 — VIBE constants. Vibes are cheaper than waves (no `to`,
// reaction-only), so we allow a higher rate but a tighter TTL.
const VIBE_TTL_MS = 6_000;
const MAX_VIBE_BUFFER = 60;
const MAX_VIBE_EMOJI_LEN = 8;
const VIBE_RATE_PER_SESSION = 8;
const VIBE_RATE_WINDOW_MS = 10_000;
// Generic page-level interaction signals. These are intentionally small:
// event name + optional viewport coords/hue only.
const SIGNAL_TTL_MS = 5_000;
const MAX_SIGNAL_BUFFER = 80;
const SIGNAL_RATE_PER_SESSION = 24;
const SIGNAL_RATE_WINDOW_MS = 10_000;
const SIGNAL_EVENT_RE = /^[a-z0-9:_-]+$/i;

// ─── Tug tunables — three numbers, and the whole rope falls out of them ──
//
// TUG_HUMAN_PULL: one tap moves the knot 4% of the rope's length. Small
//   enough that a single tap is a nudge and not a verdict, large enough
//   that you can see your own tap land. ~25 unanswered taps buries the
//   knot at the people's end.
// TUG_MACHINE_PULL: one MCP call is worth three human taps. A person can
//   tap ten times in five seconds; an agent calls the tool once, on
//   purpose, and usually only once a session. Weighting the rarer, more
//   deliberate event heavier is what keeps the needle honest — otherwise
//   a single bored human out-pulls every machine that has ever visited.
// TUG_HALF_LIFE_MS: the knot loses half its offset every 90 seconds of
//   quiet. So the knot reads *now* (the last couple of minutes of the
//   town) while the two tallies underneath read *ever*.
const TUG_HUMAN_PULL = 0.04;
const TUG_MACHINE_PULL = 0.12;
const TUG_HALF_LIFE_MS = 90_000;
// Rate limits mirror the wave/vibe/signal pattern: per-puller sliding
// window, silently dropped when exceeded (no confirmation channel for
// anyone hammering the endpoint).
const TUG_HUMAN_RATE = 10; // taps per puller per window
const TUG_MACHINE_RATE = 6; // MCP pulls per agent per window
const TUG_RATE_WINDOW_MS = 10_000;
const MAX_TUG_RATE_KEYS = 500; // sweep the rate map above this size
const TUG_KNOT_EPSILON = 0.0005; // below this the rope is simply centred
const TUG_STORAGE_KEY = 'tug:v1';
const TUG_BURST_THRESHOLD = 0.6;

const BURST_KINDS = new Set<BurstKind>(['mint', 'claim', 'tug', 'bell', 'ping-answered', 'cast']);
const MAX_BURST_BUFFER = 20;
const BURST_MIN_INTERVAL_MS = 1_000;
const MAX_BURST_RATE_KEYS = 500;

const FAST_BROADCAST_MS = 100; // 10 Hz while active
const IDLE_BROADCAST_MS = 1000; // 1 Hz otherwise
const ACTIVITY_WINDOW_MS = 3000; // fast mode window after last cursor/chat

function cheapHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function deriveNounId(sessionId: string): number {
  return cheapHash(sessionId) % 1200;
}

function normalizeKind(rawKind: string | null): PresenceKind {
  if (rawKind === 'agent') return 'agent';
  if (rawKind === 'wallet') return 'wallet';
  return 'human';
}

function mergeKinds(current: PresenceKind, incoming: PresenceKind): PresenceKind {
  if (current === 'agent' || incoming === 'agent') return 'agent';
  if (current === 'wallet' || incoming === 'wallet') return 'wallet';
  return 'human';
}

function normalizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function normalizeBurstKind(value: unknown): BurstKind | undefined {
  return typeof value === 'string' && BURST_KINDS.has(value as BurstKind)
    ? value as BurstKind
    : undefined;
}

function normalizeBurstBy(value: unknown): BurstBy {
  if (!value || typeof value !== 'object') return { handle: 'someone' };
  const input = value as Record<string, unknown>;
  const handle = normalizeText(input.handle, 64);
  const rawNoun = Number(input.noun);
  const noun = Number.isFinite(rawNoun) && rawNoun >= 0 && rawNoun < 1200
    ? Math.trunc(rawNoun)
    : undefined;
  return {
    ...(handle ? { handle } : {}),
    ...(typeof noun === 'number' ? { noun } : {}),
    ...(!handle && typeof noun !== 'number' ? { handle: 'someone' } : {}),
  };
}

function normalizeBurstMeta(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>).slice(0, 10)) {
    const key = rawKey.replace(/[^a-z0-9_-]/gi, '').slice(0, 32);
    if (!key) continue;
    if (typeof rawValue === 'string') out[key] = rawValue.slice(0, 160);
    else if (typeof rawValue === 'number' && Number.isFinite(rawValue)) out[key] = rawValue;
    else if (typeof rawValue === 'boolean') out[key] = rawValue;
  }
  return out;
}

function normalizeSignalEvent(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 48) return undefined;
  if (!SIGNAL_EVENT_RE.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeCoord(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(CURSOR_COORD_MAX, Math.round(parsed)));
}

function normalizeHue(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return ((Math.round(parsed) % 360) + 360) % 360;
}

/**
 * Sanitize a peer-broadcast path. Must be a leading-'/' relative URL with
 * no scheme/authority/query/fragment, no consecutive slashes (avoids
 * protocol smuggling like `//evil.example`), printable ASCII only, and
 * length-capped. Returns undefined for anything suspicious so peers never
 * render an attacker-controlled link target.
 */
function normalizeCurrentPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return undefined;
  if (!trimmed.startsWith('/')) return undefined;
  if (trimmed.startsWith('//')) return undefined;
  if (/[?#]/.test(trimmed)) return undefined;
  // Reject any character outside printable ASCII (path-safe subset).
  if (!/^[A-Za-z0-9/_\-.]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeNounId(value: unknown, fallback: number): number {
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.trunc(parsed);
  if (rounded < 0 || rounded >= 1200) return fallback;
  return rounded;
}

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** A rope nobody has touched yet. */
function freshTugState(now: number): TugState {
  return { humanPulls: 0, machinePulls: 0, knot: 0, updatedAt: now };
}

/**
 * Coerce whatever came back out of storage into a TugState. Counters are
 * clamped non-negative and integral; the knot is clamped to [−1, 1].
 * Anything unreadable starts the rope over at centre rather than throwing
 * — a corrupt row should not take presence down with it.
 */
function normalizeTugState(raw: unknown, now: number): TugState {
  if (!raw || typeof raw !== 'object') return freshTugState(now);
  const value = raw as Record<string, unknown>;
  const humanPulls = Number(value.humanPulls);
  const machinePulls = Number(value.machinePulls);
  const knot = Number(value.knot);
  const updatedAt = Number(value.updatedAt);
  return {
    humanPulls: Number.isFinite(humanPulls) ? Math.max(0, Math.trunc(humanPulls)) : 0,
    machinePulls: Number.isFinite(machinePulls) ? Math.max(0, Math.trunc(machinePulls)) : 0,
    knot: Number.isFinite(knot) ? Math.max(-1, Math.min(1, knot)) : 0,
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : now,
  };
}

/**
 * Lazy decay. The knot drifts back toward centre by half every
 * TUG_HALF_LIFE_MS of elapsed quiet. Pure function of the stored value
 * and the clock, which is why the rope needs no alarm to slacken.
 */
function decayKnot(knot: number, elapsedMs: number): number {
  if (!Number.isFinite(knot) || knot === 0) return 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return knot;
  const decayed = knot * Math.pow(0.5, elapsedMs / TUG_HALF_LIFE_MS);
  return Math.abs(decayed) < TUG_KNOT_EPSILON ? 0 : decayed;
}

/** Identity of whoever pulled — a browser session id, or an agent's label. */
function normalizePullerId(value: unknown): string {
  if (typeof value !== 'string') return 'anon';
  const trimmed = value.trim().slice(0, 64);
  return trimmed || 'anon';
}

function parseDeviceClass(ua: string | null | undefined): DeviceClass {
  if (!ua) return 'unknown';
  const lower = ua.toLowerCase();
  if (/bot|crawler|spider|httpclient|curl|wget|headless/.test(lower)) return 'bot';
  if (/ipad|tablet/.test(lower)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile/.test(lower)) return 'mobile';
  if (/android|iphone|ipod/.test(lower)) return 'mobile';
  if (/mozilla|webkit|chrome|safari|firefox|edge|opera/.test(lower)) return 'desktop';
  return 'unknown';
}

function parseReferrerHost(referer: string | null | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    const host = url.host;
    if (!host) return undefined;
    if (host === 'pointcast.xyz' || host.endsWith('.pointcast.xyz')) return undefined;
    return host.slice(0, 80);
  } catch {
    return undefined;
  }
}

function extractEdge(request: Request): EdgeContext {
  const url = new URL(request.url);
  const ua = request.headers.get('User-Agent');
  const referer = request.headers.get('Referer');
  const cf = (request as unknown as { cf?: Record<string, unknown> }).cf ?? {};

  const country = typeof cf.country === 'string' ? cf.country.slice(0, 3) : undefined;
  const city = typeof cf.city === 'string' ? cf.city.slice(0, 64) : undefined;
  const region = typeof cf.region === 'string' ? cf.region.slice(0, 64) : undefined;
  const timezone = typeof cf.timezone === 'string' ? cf.timezone.slice(0, 64) : undefined;
  const asnRaw = cf.asn;
  const asn = typeof asnRaw === 'number' && Number.isFinite(asnRaw) ? asnRaw : undefined;
  const asOrg = typeof cf.asOrganization === 'string' ? cf.asOrganization.slice(0, 80) : undefined;
  const colo = typeof cf.colo === 'string' ? cf.colo.slice(0, 16) : undefined;

  const relayParam = url.searchParams.get('relay');
  const relay = relayParam ? normalizeText(relayParam, 40) : undefined;

  return {
    country,
    city,
    region,
    timezone,
    asn,
    asOrg,
    colo,
    deviceClass: parseDeviceClass(ua),
    referrerHost: parseReferrerHost(referer),
    relay,
  };
}

export class PresenceRoom {
  state: DurableObjectState;
  connections: Map<string, Connection> = new Map();
  visitors: Map<string, VisitorSession> = new Map();
  broadcastInterval: ReturnType<typeof setInterval> | null = null;

  // Phase 2 — per-room cursor/chat state.
  // `chatLog` is the room's ring buffer. `lastActivity` tracks the latest
  // cursor or chat message to decide broadcast cadence (fast vs idle).
  // `broadcastMode` is the current tick rate so we only reschedule when it
  // actually flips — setInterval churn is otherwise wasteful.
  chatLog: ChatEntry[] = [];
  // Phase 3 — directional waves. Ring buffer; entries older than WAVE_TTL_MS
  // are filtered out at broadcast time so receivers only see the live ones.
  waves: WaveEntry[] = [];
  // Per-session wave timestamps for rate limiting (sessionId → recent epochs).
  waveRate: Map<string, number[]> = new Map();
  // Phase 4 — broadcast vibes ring buffer + per-session rate map.
  vibes: VibeEntry[] = [];
  vibeRate: Map<string, number[]> = new Map();
  // Generic room signals + per-session rate map.
  signals: SignalEntry[] = [];
  signalRate: Map<string, number[]> = new Map();
  // The rope. `tug` is the authoritative in-memory copy of the stored
  // TugState — null until hydrated. `tugRate` is the per-puller sliding
  // window, same shape as signalRate. `tugHydrating` de-duplicates the
  // one storage read across concurrent first-touch requests.
  tug: TugState | null = null;
  tugRate: Map<string, number[]> = new Map();
  tugHydrating: Promise<TugState> | null = null;
  bursts: BurstEvent[] = [];
  burstClientAt: Map<string, number> = new Map();
  burstKindAt: Map<BurstKind, number> = new Map();
  pendingBursts: Map<BurstKind, BurstEvent> = new Map();
  burstFlushTimer: ReturnType<typeof setTimeout> | null = null;
  lastBurstBroadcastAt = 0;
  lastActivity: number = 0;
  broadcastMode: 'idle' | 'fast' = 'idle';

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname.endsWith('/snapshot')) {
      // Hydrate the rope in the background so subsequent snapshots and
      // broadcasts carry `tug` without any request ever blocking on it.
      if (!this.tug) void this.loadTug().catch(() => {});
      const viewerSid = url.searchParams.get('sid') ?? undefined;
      return Response.json(this.snapshotFor(viewerSid));
    }

    // ─── /tug — the one rope ──────────────────────────────────
    // GET reads the rope (tallies + knot decayed to now). POST pulls it:
    // { side: 'human' | 'machine', by?: string }. Everything else 405s.
    if (url.pathname.endsWith('/tug')) {
      if (request.method === 'GET') {
        const state = await this.loadTug();
        return Response.json({ ok: true, tug: this.viewTug(state, Date.now()), now: Date.now() });
      }
      if (request.method === 'POST') {
        let body: Record<string, unknown> = {};
        try {
          const parsed = await request.json();
          if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
        } catch {
          // Empty body is a valid human pull — the rope asks for nothing.
        }
        const side = body.side === 'machine' ? 'machine' : 'human';
        const by = normalizePullerId(body.by);
        const result = await this.applyTugPull(side, by);
        return Response.json(
          { ok: result.ok, reason: result.reason, tug: result.tug, now: Date.now() },
          { status: result.ok ? 200 : 429 },
        );
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    // ─── /burst — global ephemeral event bus ──────────────────
    // POST accepts a typed burst. GET without Upgrade returns the in-memory
    // tail; WebSocket GET falls through to the normal connection path.
    if (url.pathname.endsWith('/burst') && request.method === 'POST') {
      let body: Record<string, unknown> = {};
      try {
        const parsed = await request.json();
        if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
      } catch {
        return Response.json({ ok: false, reason: 'invalid-json' }, { status: 400 });
      }
      const result = this.submitBurst(body, request.headers.get('CF-Connecting-IP') ?? 'anonymous');
      const status = result.ok ? (result.coalesced ? 202 : 200) : result.reason === 'invalid-kind' ? 400 : 429;
      return Response.json(result, { status });
    }
    if (url.pathname.endsWith('/burst') && request.method === 'GET' && request.headers.get('Upgrade') !== 'websocket') {
      return Response.json({ ok: true, bursts: [...this.bursts], now: Date.now() });
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const sessionId = url.searchParams.get('sid') ?? crypto.randomUUID();
    const kind = normalizeKind(url.searchParams.get('kind'));
    const edge = extractEdge(request);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();

    const now = Date.now();
    const connectionId = crypto.randomUUID();
    const connection: Connection = {
      id: connectionId,
      sessionId,
      ws: server,
      lastSeen: now,
    };
    this.connections.set(connectionId, connection);

    const isReturning = await this.checkAndMarkSeen(sessionId);
    const existingVisitor = this.visitors.get(sessionId);
    if (existingVisitor) {
      existingVisitor.kind = mergeKinds(existingVisitor.kind, kind);
      existingVisitor.lastSeen = now;
      existingVisitor.edge = mergeEdge(existingVisitor.edge, edge);
    } else {
      this.visitors.set(sessionId, {
        sessionId,
        nounId: deriveNounId(sessionId),
        kind,
        joinedAt: new Date(now).toISOString(),
        lastSeen: now,
        edge,
        pathTrail: [],
        isReturning,
      });
    }

    server.addEventListener('message', (event) => {
      connection.lastSeen = Date.now();
      this.touchVisitor(sessionId, connection.lastSeen);
      this.handleMessage(sessionId, event.data);
    });

    const onClose = () => {
      this.connections.delete(connectionId);
      this.pruneVisitor(sessionId);
      this.broadcast();
      if (this.connections.size === 0) this.stopBroadcast();
    };
    server.addEventListener('close', onClose);
    server.addEventListener('error', onClose);

    this.startBroadcast();
    this.broadcast();

    return new Response(null, { status: 101, webSocket: client });
  }

  async checkAndMarkSeen(sessionId: string): Promise<boolean> {
    const key = SEEN_KEY_PREFIX + sessionId;
    try {
      const prior = await this.state.storage.get<number>(key);
      await this.state.storage.put(key, Date.now());
      return typeof prior === 'number';
    } catch {
      return false;
    }
  }

  touchVisitor(sessionId: string, at: number) {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return;
    visitor.lastSeen = at;
    for (const connection of this.connections.values()) {
      if (connection.sessionId === sessionId) connection.lastSeen = at;
    }
  }

  handleMessage(sessionId: string, rawData: string | ArrayBuffer | ArrayBufferView) {
    if (typeof rawData !== 'string') return;

    let payload: ClientMessage;
    try {
      payload = JSON.parse(rawData);
    } catch {
      return;
    }
    if (!payload || typeof payload !== 'object') return;

    const message = payload as Record<string, unknown>;
    const type = message.type;
    if (type === 'ping') return;

    // ─── Phase 2: cursor updates ──────────────────────────────
    // Accept high-frequency cursor events but DO NOT broadcast per-event
    // — the fast-mode interval handles that. Just mutate state + mark
    // activity so the next tick picks the new positions up.
    if (type === 'cursor') {
      this.applyCursorUpdate(sessionId, message);
      this.lastActivity = Date.now();
      this.ensureFastMode();
      return;
    }

    // ─── Phase 2: chat submit ─────────────────────────────────
    // Low frequency, broadcast immediately so the sender + peers see
    // the message without waiting for the next tick. Ring-buffered.
    if (type === 'chat') {
      this.applyChat(sessionId, message);
      this.lastActivity = Date.now();
      this.ensureFastMode();
      this.broadcast();
      return;
    }

    // ─── Phase 3: wave (directional ephemeral) ────────────────
    // Sender supplies `to` (target nounId) and optionally `emoji`. We
    // rate-limit, append to the wave ring buffer, and broadcast. Old
    // waves (>WAVE_TTL_MS) are filtered at snapshot time.
    if (type === 'wave') {
      const accepted = this.applyWave(sessionId, message);
      if (accepted) {
        this.lastActivity = Date.now();
        this.ensureFastMode();
        this.broadcast();
      }
      return;
    }

    // ─── Phase 4: vibe (broadcast emoji reaction) ─────────────
    // Sender supplies `emoji`; reaches every co-room peer's screen
    // as a floating chip. No recipient. Rate-limited per session.
    if (type === 'vibe') {
      const accepted = this.applyVibe(sessionId, message);
      if (accepted) {
        this.lastActivity = Date.now();
        this.ensureFastMode();
        this.broadcast();
      }
      return;
    }

    // ─── Generic room signal ─────────────────────────────────
    // Small page-level fan-out for click/ripple/burst interactions.
    if (type === 'signal') {
      const accepted = this.applySignal(sessionId, message);
      if (accepted) {
        this.lastActivity = Date.now();
        this.ensureFastMode();
        this.broadcast();
      }
      return;
    }

    this.applyVisitorPatch(sessionId, message);
    if (hasOwn(message, 'tag')) {
      const tag = normalizeText(message.tag, 40);
      const visitor = this.visitors.get(sessionId);
      if (visitor) {
        if (tag) visitor.tag = tag;
        else delete visitor.tag;
      }
    }
    this.broadcast();
  }

  applyCursorUpdate(sessionId: string, patch: Record<string, unknown>) {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return;
    const rawX = Number(patch.x);
    const rawY = Number(patch.y);
    if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return;
    // Quantize — coords arrive viewport-normalized ×10000. Clamp defensively.
    const x = Math.max(0, Math.min(CURSOR_COORD_MAX, Math.round(rawX)));
    const y = Math.max(0, Math.min(CURSOR_COORD_MAX, Math.round(rawY)));
    visitor.cursor = { x, y, at: Date.now() };
  }

  applyChat(sessionId: string, patch: Record<string, unknown>) {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return;
    const msg = normalizeText(patch.msg, MAX_CHAT_MSG);
    if (!msg) return;
    const who = visitor.tag ?? 'visitor';
    const entry: ChatEntry = {
      id: `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
      who,
      nounId: visitor.nounId,
      msg,
      at: Date.now(),
      sid: sessionId.slice(0, 8),
    };
    // Phase 3 — stamp the sender's room at send time. Server-derived from
    // the visitor's last-known currentPath; client cannot spoof the room
    // tag this way. Falls back to undefined when the visitor hasn't
    // emitted a currentPath yet.
    if (visitor.currentPath) entry.room = visitor.currentPath;
    // Phase 4 — optional cursor anchor. When the client supplies a
    // valid {x, y} pair, render this entry as a floating bubble above
    // the sender's cursor in addition to the WIRE log line.
    if (patch.bubble && typeof patch.bubble === 'object') {
      const b = patch.bubble as Record<string, unknown>;
      const bx = Number(b.x);
      const by = Number(b.y);
      if (Number.isFinite(bx) && Number.isFinite(by)) {
        entry.bubble = {
          x: Math.max(0, Math.min(10000, Math.round(bx))),
          y: Math.max(0, Math.min(10000, Math.round(by))),
        };
      }
    }
    this.chatLog.push(entry);
    if (this.chatLog.length > MAX_CHAT_BUFFER) {
      this.chatLog.splice(0, this.chatLog.length - MAX_CHAT_BUFFER);
    }
  }

  /**
   * Process an incoming wave from the given session. Returns true when the
   * wave is accepted and queued (broadcast on next tick), false on rate
   * limit / validation failure.
   */
  applyWave(sessionId: string, patch: Record<string, unknown>): boolean {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return false;
    // Agents can't wave — keeps the social layer human.
    if (visitor.kind === 'agent') return false;
    const toNoun = normalizeNounId(patch.to, -1);
    if (toNoun < 0) return false;
    if (toNoun === visitor.nounId) return false; // no self-waves
    // Emoji defaults to 👋 when missing/invalid. Keep payload tight.
    let emoji = '👋';
    if (typeof patch.emoji === 'string') {
      const trimmed = patch.emoji.trim();
      if (trimmed && trimmed.length <= MAX_WAVE_EMOJI_LEN) {
        emoji = trimmed;
      }
    }
    // Per-session rate limit. Drop waves silently when exceeded —
    // attackers don't get a confirmation channel.
    const now = Date.now();
    const recent = (this.waveRate.get(sessionId) ?? []).filter(
      (t) => now - t <= WAVE_RATE_WINDOW_MS,
    );
    if (recent.length >= WAVE_RATE_PER_SESSION) return false;
    recent.push(now);
    this.waveRate.set(sessionId, recent);

    const entry: WaveEntry = {
      fromNoun: visitor.nounId,
      toNoun,
      emoji,
      at: now,
    };
    // Phase 4 — BRING. Optional targetPath piggybacks on the wave so we
    // don't need a new message type. Sanitized server-side; if invalid,
    // we drop the field rather than rejecting the whole wave.
    const target = normalizeCurrentPath(patch.targetPath);
    if (target) entry.targetPath = target;
    this.waves.push(entry);
    if (this.waves.length > MAX_WAVE_BUFFER) {
      this.waves.splice(0, this.waves.length - MAX_WAVE_BUFFER);
    }
    return true;
  }

  /**
   * Phase 4 — process an incoming vibe (broadcast emoji reaction).
   * Returns true on accept, false on rate limit / validation fail.
   */
  applyVibe(sessionId: string, patch: Record<string, unknown>): boolean {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return false;
    if (visitor.kind === 'agent') return false;
    let emoji = '✨';
    if (typeof patch.emoji === 'string') {
      const trimmed = patch.emoji.trim();
      if (trimmed && trimmed.length <= MAX_VIBE_EMOJI_LEN) emoji = trimmed;
    }
    const now = Date.now();
    const recent = (this.vibeRate.get(sessionId) ?? []).filter(
      (t) => now - t <= VIBE_RATE_WINDOW_MS,
    );
    if (recent.length >= VIBE_RATE_PER_SESSION) return false;
    recent.push(now);
    this.vibeRate.set(sessionId, recent);

    const entry: VibeEntry = {
      fromNoun: visitor.nounId,
      emoji,
      at: now,
    };
    if (visitor.currentPath) entry.room = visitor.currentPath;
    this.vibes.push(entry);
    if (this.vibes.length > MAX_VIBE_BUFFER) {
      this.vibes.splice(0, this.vibes.length - MAX_VIBE_BUFFER);
    }
    return true;
  }

  applySignal(sessionId: string, patch: Record<string, unknown>): boolean {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return false;
    const event = normalizeSignalEvent(patch.event);
    if (!event) return false;

    const now = Date.now();
    const recent = (this.signalRate.get(sessionId) ?? []).filter(
      (t) => now - t <= SIGNAL_RATE_WINDOW_MS,
    );
    if (recent.length >= SIGNAL_RATE_PER_SESSION) return false;
    recent.push(now);
    this.signalRate.set(sessionId, recent);

    const entry: SignalEntry = {
      id: `${sessionId.slice(0, 8)}-${now.toString(36)}-${this.signals.length.toString(36)}`,
      event,
      sid: sessionId.slice(0, 8),
      fromNoun: visitor.nounId,
      at: now,
    };
    if (visitor.currentPath) entry.room = visitor.currentPath;
    const x = normalizeCoord(patch.x);
    const y = normalizeCoord(patch.y);
    const hue = normalizeHue(patch.hue);
    if (typeof x === 'number') entry.x = x;
    if (typeof y === 'number') entry.y = y;
    if (typeof hue === 'number') entry.hue = hue;

    this.signals.push(entry);
    if (this.signals.length > MAX_SIGNAL_BUFFER) {
      this.signals.splice(0, this.signals.length - MAX_SIGNAL_BUFFER);
    }
    return true;
  }

  submitBurst(
    input: Record<string, unknown>,
    fallbackClient: string,
    now = Date.now(),
  ): { ok: boolean; coalesced?: boolean; reason?: string; burst?: BurstEvent } {
    const kind = normalizeBurstKind(input.kind);
    if (!kind) return { ok: false, reason: 'invalid-kind' };

    const by = normalizeBurstBy(input.by);
    const client = normalizeText(input.clientId, 96) || by.handle || fallbackClient;
    const priorClient = this.burstClientAt.get(client) ?? 0;
    if (now - priorClient < BURST_MIN_INTERVAL_MS) {
      return { ok: false, reason: 'rate-limited' };
    }
    this.burstClientAt.set(client, now);
    this.sweepBurstRates(now);

    const burst: BurstEvent = {
      kind,
      at: now,
      by,
      meta: normalizeBurstMeta(input.meta),
    };
    const kindReady = now - (this.burstKindAt.get(kind) ?? 0) >= BURST_MIN_INTERVAL_MS;
    const busReady = now - this.lastBurstBroadcastAt >= BURST_MIN_INTERVAL_MS;
    if (kindReady && busReady && this.pendingBursts.size === 0) {
      this.publishBurst(burst);
      return { ok: true, coalesced: false, burst };
    }

    const pending = this.pendingBursts.get(kind);
    if (pending) {
      const count = Number(pending.meta.count || 1) + 1;
      burst.meta = { ...burst.meta, count };
    }
    this.pendingBursts.set(kind, burst);
    this.scheduleBurstFlush(now);
    return { ok: true, coalesced: true, burst };
  }

  sweepBurstRates(now: number) {
    if (this.burstClientAt.size <= MAX_BURST_RATE_KEYS) return;
    for (const [key, at] of this.burstClientAt) {
      if (now - at >= BURST_MIN_INTERVAL_MS) this.burstClientAt.delete(key);
    }
  }

  publishBurst(burst: BurstEvent) {
    this.bursts.push(burst);
    if (this.bursts.length > MAX_BURST_BUFFER) {
      this.bursts.splice(0, this.bursts.length - MAX_BURST_BUFFER);
    }
    this.lastBurstBroadcastAt = burst.at;
    this.burstKindAt.set(burst.kind, burst.at);
    this.broadcast();
  }

  scheduleBurstFlush(now = Date.now()) {
    if (this.burstFlushTimer || this.pendingBursts.size === 0) return;
    let nextAt = this.lastBurstBroadcastAt + BURST_MIN_INTERVAL_MS;
    for (const kind of this.pendingBursts.keys()) {
      nextAt = Math.max(nextAt, (this.burstKindAt.get(kind) ?? 0) + BURST_MIN_INTERVAL_MS);
    }
    this.burstFlushTimer = setTimeout(() => {
      this.burstFlushTimer = null;
      this.flushBurst();
    }, Math.max(0, nextAt - now));
  }

  flushBurst(now = Date.now()) {
    if (now - this.lastBurstBroadcastAt < BURST_MIN_INTERVAL_MS) {
      this.scheduleBurstFlush(now);
      return;
    }
    for (const [kind, burst] of this.pendingBursts) {
      if (now - (this.burstKindAt.get(kind) ?? 0) < BURST_MIN_INTERVAL_MS) continue;
      this.pendingBursts.delete(kind);
      this.publishBurst({ ...burst, at: now });
      break;
    }
    if (this.pendingBursts.size) this.scheduleBurstFlush(now);
  }

  /**
   * Hydrate the rope from DO storage exactly once per instance lifetime.
   * Concurrent callers share one read via `tugHydrating`. Never throws —
   * a storage failure yields a centred rope rather than a 500 on a
   * presence endpoint that every page on the site depends on.
   */
  async loadTug(): Promise<TugState> {
    if (this.tug) return this.tug;
    if (!this.tugHydrating) {
      this.tugHydrating = (async () => {
        const now = Date.now();
        let stored: unknown;
        try {
          stored = await this.state.storage.get(TUG_STORAGE_KEY);
        } catch {
          stored = undefined;
        }
        if (!this.tug) this.tug = normalizeTugState(stored, now);
        return this.tug;
      })();
    }
    return this.tugHydrating;
  }

  /**
   * Project stored state into a read-time view: tallies verbatim, knot
   * decayed from `updatedAt` to `now` and rounded to three places (the
   * client renders a percentage; more precision is just bytes).
   */
  viewTug(state: TugState, now: number): TugView {
    return {
      humanPulls: state.humanPulls,
      machinePulls: state.machinePulls,
      knot: Math.round(decayKnot(state.knot, now - state.updatedAt) * 1000) / 1000,
      updatedAt: state.updatedAt,
    };
  }

  /** Drop rate-window entries that have fully expired. Called on growth. */
  sweepTugRate(now: number) {
    if (this.tugRate.size <= MAX_TUG_RATE_KEYS) return;
    for (const [key, stamps] of this.tugRate) {
      const live = stamps.filter((t) => now - t <= TUG_RATE_WINDOW_MS);
      if (live.length) this.tugRate.set(key, live);
      else this.tugRate.delete(key);
    }
  }

  /**
   * Pull the rope. People pull toward −1, machines toward +1. The stored
   * knot is decayed to now FIRST, then the pull is added, so a pull
   * always lands relative to where the rope actually is rather than
   * where it was when someone last touched it.
   *
   * The read-modify-write here is what /api/duel and /api/meadow cannot
   * do in KV: `state` is one shared in-memory object inside a single
   * Durable Object, mutated synchronously between awaits, so two pullers
   * landing in the same millisecond both count. That is the entire
   * reason this lives in the DO.
   */
  async applyTugPull(
    side: 'human' | 'machine',
    by: string,
  ): Promise<{ ok: boolean; reason?: string; tug: TugView }> {
    const state = await this.loadTug();
    const now = Date.now();

    const key = `${side}:${by}`;
    const limit = side === 'machine' ? TUG_MACHINE_RATE : TUG_HUMAN_RATE;
    const recent = (this.tugRate.get(key) ?? []).filter((t) => now - t <= TUG_RATE_WINDOW_MS);
    if (recent.length >= limit) {
      return { ok: false, reason: 'rate-limited', tug: this.viewTug(state, now) };
    }
    recent.push(now);
    this.tugRate.set(key, recent);
    this.sweepTugRate(now);

    const drifted = decayKnot(state.knot, now - state.updatedAt);
    const delta = side === 'machine' ? TUG_MACHINE_PULL : -TUG_HUMAN_PULL;
    state.knot = Math.max(-1, Math.min(1, drifted + delta));
    if (side === 'machine') state.machinePulls += 1;
    else state.humanPulls += 1;
    state.updatedAt = now;
    this.tug = state;

    // Persist after the mutation. A failed write loses at most this one
    // pull from the permanent record; the in-memory rope stays correct.
    try {
      await this.state.storage.put(TUG_STORAGE_KEY, state);
    } catch {}

    const crossedThreshold = Math.abs(drifted) < TUG_BURST_THRESHOLD && Math.abs(state.knot) >= TUG_BURST_THRESHOLD;
    if (crossedThreshold) {
      this.submitBurst({
        kind: 'tug',
        clientId: `tug:${by}`,
        by: { handle: by },
        meta: {
          side,
          knot: Math.round(state.knot * 100) / 100,
          label: side === 'human' ? 'the people side' : 'the machine side',
          color: side === 'human' ? '#8a2432' : '#185fa5',
        },
      }, by, now);
    }

    // Only disturb the broadcast cadence when somebody is actually
    // holding a socket — a pull into an empty room should not spin up a
    // 10 Hz interval just to talk to nobody.
    if (this.connections.size > 0) {
      this.lastActivity = now;
      this.ensureFastMode();
      this.broadcast();
    }

    return { ok: true, tug: this.viewTug(state, now) };
  }

  applyVisitorPatch(sessionId: string, patch: Record<string, unknown>) {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return;

    visitor.nounId = normalizeNounId(patch.nounId, visitor.nounId);

    if (visitor.kind === 'agent') {
      delete visitor.mood;
      delete visitor.listening;
      delete visitor.where;
      delete visitor.currentPath;
      visitor.walletAddress = undefined;
      visitor.nostrPubkey = undefined;
      visitor.pathTrail = [];
      return;
    }

    if (hasOwn(patch, 'mood')) {
      visitor.mood = normalizeText(patch.mood, 32);
      if (!visitor.mood) delete visitor.mood;
    }
    if (hasOwn(patch, 'listening')) {
      visitor.listening = normalizeText(patch.listening, 120);
      if (!visitor.listening) delete visitor.listening;
    }
    if (hasOwn(patch, 'where')) {
      const nextWhere = normalizeText(patch.where, 80);
      const priorWhere = visitor.where;
      if (nextWhere) {
        visitor.where = nextWhere;
      } else {
        delete visitor.where;
      }
      if (priorWhere && priorWhere !== nextWhere) {
        visitor.pathTrail = [priorWhere, ...visitor.pathTrail.filter((p) => p !== priorWhere)].slice(
          0,
          MAX_PATH_TRAIL,
        );
      }
    }
    if (hasOwn(patch, 'walletAddress')) {
      const wallet = normalizeText(patch.walletAddress, 80);
      if (wallet) visitor.walletAddress = wallet;
      else visitor.walletAddress = undefined;
    }
    if (hasOwn(patch, 'nostrPubkey')) {
      const pk = normalizeText(patch.nostrPubkey, 80);
      if (pk) visitor.nostrPubkey = pk;
      else visitor.nostrPubkey = undefined;
    }
    if (hasOwn(patch, 'currentPath')) {
      const next = normalizeCurrentPath(patch.currentPath);
      if (next) visitor.currentPath = next;
      else delete visitor.currentPath;
    }
  }

  pruneVisitor(sessionId: string) {
    const stillConnected = Array.from(this.connections.values()).some(
      (connection) => connection.sessionId === sessionId,
    );
    if (!stillConnected) this.visitors.delete(sessionId);
  }

  cleanupStaleConnections() {
    const cutoff = Date.now() - STALE_AFTER_MS;
    const staleConnectionIds: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (connection.lastSeen >= cutoff) continue;
      staleConnectionIds.push(connectionId);
      try {
        connection.ws.close(1000, 'idle');
      } catch {}
    }

    if (staleConnectionIds.length === 0) return;

    for (const connectionId of staleConnectionIds) {
      const connection = this.connections.get(connectionId);
      if (!connection) continue;
      this.connections.delete(connectionId);
      this.pruneVisitor(connection.sessionId);
    }
  }

  toPublicView(visitor: VisitorSession): PublicSessionView {
    const out: PublicSessionView = {
      nounId: visitor.nounId,
      kind: visitor.kind,
      joinedAt: visitor.joinedAt,
    };
    if (visitor.kind !== 'agent') {
      if (visitor.mood) out.mood = visitor.mood;
      if (visitor.listening) out.listening = visitor.listening;
      if (visitor.where) out.where = visitor.where;
      if (visitor.currentPath) out.currentPath = visitor.currentPath;
    }
    if (visitor.edge.country) out.country = visitor.edge.country;
    if (visitor.edge.deviceClass && visitor.edge.deviceClass !== 'unknown') {
      out.deviceClass = visitor.edge.deviceClass;
    }
    return out;
  }

  toPrivateView(visitor: VisitorSession): PrivateSessionView {
    const base = this.toPublicView(visitor);
    const priv: PrivateSessionView = {
      ...base,
      dwellSeconds: Math.max(0, Math.round((visitor.lastSeen - Date.parse(visitor.joinedAt)) / 1000)),
      isReturning: visitor.isReturning,
    };
    if (visitor.edge.city) priv.city = visitor.edge.city;
    if (visitor.edge.region) priv.region = visitor.edge.region;
    if (visitor.edge.timezone) priv.timezone = visitor.edge.timezone;
    if (typeof visitor.edge.asn === 'number') priv.asn = visitor.edge.asn;
    if (visitor.edge.asOrg) priv.asOrg = visitor.edge.asOrg;
    if (visitor.edge.colo) priv.colo = visitor.edge.colo;
    if (visitor.edge.referrerHost) priv.referrerHost = visitor.edge.referrerHost;
    if (visitor.edge.relay) priv.relay = visitor.edge.relay;
    if (visitor.walletAddress) priv.walletAddress = visitor.walletAddress;
    if (visitor.nostrPubkey) priv.nostrPubkey = visitor.nostrPubkey;
    if (visitor.pathTrail.length) priv.pathTrail = [...visitor.pathTrail];
    return priv;
  }

  snapshotFor(viewerSessionId?: string): BroadcastPayload {
    const visitors = Array.from(this.visitors.values()).sort((a, b) =>
      a.joinedAt.localeCompare(b.joinedAt),
    );

    let humans = 0;
    let agents = 0;
    for (const visitor of visitors) {
      if (visitor.kind === 'agent') agents += 1;
      else humans += 1;
    }

    const sessions = visitors.slice(0, MAX_BROADCAST_SESSIONS).map((v) => this.toPublicView(v));

    const payload: BroadcastPayload = { humans, agents, sessions };

    // Phase 2 — attach peer cursors + chat when the room has any. Empty
    // arrays are omitted so global-room consumers see the same shape.
    const peers = this.collectPeers(viewerSessionId);
    if (peers.length) payload.peers = peers;
    if (this.chatLog.length) payload.chat = [...this.chatLog];

    // Phase 3 — only emit waves still inside the TTL. Also opportunistically
    // prune the in-memory ring so memory doesn't grow when the room stays
    // hot. Receivers use `at` to dedupe across re-broadcasts.
    if (this.waves.length) {
      const cutoff = Date.now() - WAVE_TTL_MS;
      this.waves = this.waves.filter((w) => w.at >= cutoff);
      if (this.waves.length) payload.waves = [...this.waves];
    }
    // Phase 4 — vibes are TTL-bounded the same way; broadcast every
    // entry still in the window so late joiners briefly catch the tail
    // of the room's reaction stream.
    if (this.vibes.length) {
      const cutoff = Date.now() - VIBE_TTL_MS;
      this.vibes = this.vibes.filter((v) => v.at >= cutoff);
      if (this.vibes.length) payload.vibes = [...this.vibes];
    }
    if (this.signals.length) {
      const cutoff = Date.now() - SIGNAL_TTL_MS;
      this.signals = this.signals.filter((s) => s.at >= cutoff);
      if (this.signals.length) payload.signals = [...this.signals];
    }

    // The rope. Only the instance that has actually been pulled carries
    // it — room-sharded instances hydrate a zeroed state and are omitted,
    // so per-URL rooms keep exactly the payload shape they had before.
    if (this.tug && (this.tug.humanPulls > 0 || this.tug.machinePulls > 0)) {
      payload.tug = this.viewTug(this.tug, Date.now());
    }
    if (this.bursts.length) payload.bursts = [...this.bursts];

    if (viewerSessionId) {
      const you = this.visitors.get(viewerSessionId);
      if (you) payload.you = this.toPrivateView(you);
    }
    return payload;
  }

  collectPeers(excludeSessionId?: string): PeerView[] {
    const cutoff = Date.now() - PEER_CURSOR_TTL_MS;
    const peers: PeerView[] = [];
    for (const visitor of this.visitors.values()) {
      if (excludeSessionId && visitor.sessionId === excludeSessionId) continue;
      const c = visitor.cursor;
      if (!c || c.at < cutoff) continue;
      peers.push({
        sessionId: visitor.sessionId.slice(0, 8),
        nounId: visitor.nounId,
        kind: visitor.kind,
        tag: visitor.tag ?? 'visitor',
        x: c.x,
        y: c.y,
        at: c.at,
      });
      if (peers.length >= MAX_PEER_BROADCAST) break;
    }
    return peers;
  }

  broadcast() {
    // Per-viewer personalization: peers excludes self, `you` carries private
    // edge intel. Base payload (no viewer context) computed once for fallback
    // on connections whose visitor record has been pruned.
    const basePayload = this.snapshotFor();
    const publicSerialized = JSON.stringify(basePayload);

    for (const connection of this.connections.values()) {
      try {
        const visitor = this.visitors.get(connection.sessionId);
        if (visitor) {
          const personalized: BroadcastPayload = {
            ...basePayload,
            you: this.toPrivateView(visitor),
          };
          // Recompute peers excluding this viewer so you don't see yourself
          const personalizedPeers = this.collectPeers(connection.sessionId);
          if (personalizedPeers.length) personalized.peers = personalizedPeers;
          else delete personalized.peers;
          connection.ws.send(JSON.stringify(personalized));
        } else {
          connection.ws.send(publicSerialized);
        }
      } catch {}
    }
  }

  startBroadcast() {
    if (this.broadcastInterval) return;
    this.scheduleTick(this.desiredMode());
  }

  desiredMode(): 'idle' | 'fast' {
    return this.lastActivity && Date.now() - this.lastActivity < ACTIVITY_WINDOW_MS
      ? 'fast'
      : 'idle';
  }

  ensureFastMode() {
    if (this.broadcastMode === 'fast') return;
    if (!this.broadcastInterval) {
      // No interval yet — start one now in fast mode.
      this.scheduleTick('fast');
      return;
    }
    clearInterval(this.broadcastInterval);
    this.broadcastInterval = null;
    this.scheduleTick('fast');
  }

  scheduleTick(mode: 'idle' | 'fast') {
    this.broadcastMode = mode;
    const delay = mode === 'fast' ? FAST_BROADCAST_MS : IDLE_BROADCAST_MS;
    this.broadcastInterval = setInterval(() => {
      this.cleanupStaleConnections();
      if (this.connections.size === 0) {
        this.stopBroadcast();
        return;
      }
      // Auto-relax from fast back to idle when no recent activity.
      const desired = this.desiredMode();
      if (desired !== this.broadcastMode) {
        if (this.broadcastInterval) {
          clearInterval(this.broadcastInterval);
          this.broadcastInterval = null;
        }
        this.scheduleTick(desired);
      }
      this.broadcast();
    }, delay);
  }

  stopBroadcast() {
    if (!this.broadcastInterval) return;
    clearInterval(this.broadcastInterval);
    this.broadcastInterval = null;
  }
}

function mergeEdge(current: EdgeContext, incoming: EdgeContext): EdgeContext {
  return {
    country: incoming.country ?? current.country,
    city: incoming.city ?? current.city,
    region: incoming.region ?? current.region,
    timezone: incoming.timezone ?? current.timezone,
    asn: incoming.asn ?? current.asn,
    asOrg: incoming.asOrg ?? current.asOrg,
    colo: incoming.colo ?? current.colo,
    deviceClass: incoming.deviceClass ?? current.deviceClass,
    referrerHost: incoming.referrerHost ?? current.referrerHost,
    relay: incoming.relay ?? current.relay,
  };
}

/**
 * Worker fetch handler — every incoming request routes to the singleton
 * PresenceRoom DO instance named 'global'. The DO itself branches on
 * path + Upgrade header (WebSocket vs /snapshot).
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.PRESENCE.idFromName('global');
    const stub = env.PRESENCE.get(id);
    return stub.fetch(request);
  },
};
