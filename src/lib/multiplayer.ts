/**
 * multiplayer — shared base class for room-style Durable Objects.
 *
 * Used by Pulse (Brief #1), YeePlayer v1 (Brief #3), and any future
 * multi-client game / broadcast / collaboration primitive. Extracts the
 * shared plumbing that every "room with a host TV + N phone clients"
 * needs, so subclasses only write the game-specific logic.
 *
 * v0 scope: in-memory base class (no DO imports yet — the DO wrapper
 * ships in each consuming brief). Subclasses can adapt by instantiating
 * a `MultiplayerRoom` instance inside their `DurableObject` class and
 * delegating the WS + broadcast plumbing to it.
 *
 * Author: cc. Source: docs/briefs/2026-04-19-codex-multiplayer-primitive.md.
 */

// ---------- types ----------------------------------------------------------

export type Role = 'host' | 'player' | 'observer';

export interface Client {
  id: string;
  role: Role;
  joinedAt: number;
  lastSeen: number;
  /** Subclass-specific per-client state (score, score delta, last tap, etc.). */
  state: Record<string, unknown>;
  /** The underlying WebSocket-like sink. Intentionally typed as `any` so
   *  this module stays Cloudflare-independent; subclasses in a DO context
   *  pass a real `WebSocket`. */
  send: (msg: string) => void;
}

export interface RoomConfig {
  /** ms between broadcasts. Default 1000. */
  broadcastCadenceMs?: number;
  /** Max clients of role 'player'. Default 50. */
  maxPlayers?: number;
  /** ms of inactivity before the room auto-closes. Default 10 min. */
  idleTimeoutMs?: number;
  /** Per-client throttle for action events. Default 100ms. */
  actionThrottleMs?: number;
}

// ---------- session id helpers --------------------------------------------

const BASE32_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; // Crockford-ish, no 0/O/1/I/L

/** Generate a 6-char base32 session id. ~30^6 ≈ 730M combinations.
 *  Collision-safe enough for ephemeral rooms; add a check against an
 *  existing-ids set if you're writing to storage. */
export function generateSessionId(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const rand = Math.floor(Math.random() * BASE32_ALPHABET.length);
    s += BASE32_ALPHABET[rand];
  }
  return s;
}

/** Check if a candidate id already exists in a set; regenerate until free.
 *  Bounded retry (1000) to avoid infinite loops in a pathological collision
 *  storm. */
export function generateUniqueSessionId(existing: Set<string>): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const id = generateSessionId();
    if (!existing.has(id)) return id;
  }
  throw new Error('multiplayer: could not allocate a unique session id after 1000 attempts');
}

// ---------- throttle -------------------------------------------------------

/** Per-client action throttle. Subclasses call this before applying an action.
 *  Returns true if the action is allowed (and records the timestamp);
 *  returns false if the client tapped too soon. */
export class ActionThrottle {
  private lastAt = new Map<string, number>();
  constructor(private readonly windowMs: number) {}

  check(clientId: string, now: number = Date.now()): boolean {
    const prev = this.lastAt.get(clientId) ?? 0;
    if (now - prev < this.windowMs) return false;
    this.lastAt.set(clientId, now);
    return true;
  }

  clear(clientId: string) { this.lastAt.delete(clientId); }
}

// ---------- MultiplayerRoom -----------------------------------------------

/**
 * Base class. Subclasses implement game logic by overriding the hooks:
 *
 *   - onJoin(client)            — new client arrived
 *   - onLeave(client)           — client left
 *   - onAction(client, action)  — client sent a game-specific message
 *   - computeBroadcast()        — roll up state into the broadcast payload
 *
 * Subclasses call these from their DO's `fetch()` handler (WS open / message
 * / close). The base handles bookkeeping: client map, broadcast cadence,
 * idle shutdown, throttle.
 */
export abstract class MultiplayerRoom<Action = unknown, Broadcast = unknown> {
  readonly config: Required<RoomConfig>;
  readonly clients: Map<string, Client> = new Map();
  readonly throttle: ActionThrottle;

  private broadcastInterval: ReturnType<typeof setInterval> | null = null;
  private lastActivityAt: number = Date.now();

  constructor(config: RoomConfig = {}) {
    this.config = {
      broadcastCadenceMs: config.broadcastCadenceMs ?? 1000,
      maxPlayers:         config.maxPlayers ?? 50,
      idleTimeoutMs:      config.idleTimeoutMs ?? 10 * 60_000,
      actionThrottleMs:   config.actionThrottleMs ?? 100,
    };
    this.throttle = new ActionThrottle(this.config.actionThrottleMs);
  }

  // ---------- lifecycle the subclass calls ---------------------------------

  /** Call when a WS connects. Returns the assigned Client, or null if room is full. */
  addClient(role: Role, send: Client['send']): Client | null {
    if (role === 'player') {
      const playerCount = Array.from(this.clients.values()).filter((c) => c.role === 'player').length;
      if (playerCount >= this.config.maxPlayers) return null;
    }
    const now = Date.now();
    const client: Client = {
      id: generateUniqueSessionId(new Set(this.clients.keys())),
      role,
      joinedAt: now,
      lastSeen: now,
      state: {},
      send,
    };
    this.clients.set(client.id, client);
    this.touch();
    this.onJoin(client);
    this.startBroadcast();
    return client;
  }

  /** Call when a WS closes or errors. */
  removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    this.clients.delete(clientId);
    this.throttle.clear(clientId);
    this.onLeave(client);
    if (this.clients.size === 0) this.stopBroadcast();
  }

  /** Call when a WS message arrives. Enforces throttle; subclass gets the payload. */
  receiveAction(clientId: string, action: Action): { accepted: boolean; reason?: string } {
    const client = this.clients.get(clientId);
    if (!client) return { accepted: false, reason: 'unknown-client' };
    if (!this.throttle.check(clientId)) return { accepted: false, reason: 'throttled' };
    client.lastSeen = Date.now();
    this.touch();
    this.onAction(client, action);
    return { accepted: true };
  }

  /** Send a message to every connected client. */
  broadcast(msg: string) {
    for (const client of this.clients.values()) {
      try { client.send(msg); } catch { /* socket closed — removeClient will clean up */ }
    }
  }

  // ---------- broadcast cadence --------------------------------------------

  private startBroadcast() {
    if (this.broadcastInterval) return;
    this.broadcastInterval = setInterval(() => {
      this.tick();
    }, this.config.broadcastCadenceMs);
  }

  private stopBroadcast() {
    if (!this.broadcastInterval) return;
    clearInterval(this.broadcastInterval);
    this.broadcastInterval = null;
  }

  private tick() {
    if (this.isIdleExpired()) {
      this.broadcast(JSON.stringify({ type: 'room-closed', reason: 'idle' }));
      this.stopBroadcast();
      this.clients.clear();
      return;
    }
    const payload = this.computeBroadcast();
    if (payload == null) return;
    this.broadcast(JSON.stringify({ type: 'broadcast', payload }));
  }

  private isIdleExpired(): boolean {
    return Date.now() - this.lastActivityAt > this.config.idleTimeoutMs;
  }

  private touch() { this.lastActivityAt = Date.now(); }

  // ---------- hooks subclasses implement -----------------------------------

  /** Called once per new client. Subclass may send an initial message back. */
  protected onJoin(_client: Client): void { /* no-op default */ }

  /** Called once per leaving client. */
  protected onLeave(_client: Client): void { /* no-op default */ }

  /** Called on every (non-throttled) incoming action. Subclass mutates
   *  `client.state` and/or its own room-scope state. */
  protected abstract onAction(client: Client, action: Action): void;

  /** Called on each broadcast tick. Return a serializable payload to
   *  send to all clients. Return `null` to skip this tick (quiet room). */
  protected abstract computeBroadcast(): Broadcast | null;
}
