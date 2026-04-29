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
  who: string; // tag
  nounId: number;
  msg: string;
  at: number; // server ms
  sid: string; // first 8 chars of session id — stable-per-visitor grouping
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
  you?: PrivateSessionView;
}

type ClientMessage =
  | {
      type?: 'identify' | 'update' | 'ping' | 'cursor' | 'chat';
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
  lastActivity: number = 0;
  broadcastMode: 'idle' | 'fast' = 'idle';

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname.endsWith('/snapshot')) {
      const viewerSid = url.searchParams.get('sid') ?? undefined;
      return Response.json(this.snapshotFor(viewerSid));
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
      who,
      nounId: visitor.nounId,
      msg,
      at: Date.now(),
      sid: sessionId.slice(0, 8),
    };
    this.chatLog.push(entry);
    if (this.chatLog.length > MAX_CHAT_BUFFER) {
      this.chatLog.splice(0, this.chatLog.length - MAX_CHAT_BUFFER);
    }
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
