/**
 * pointcast-presence Worker — standalone Durable Object host.
 *
 * Cloudflare Pages Functions cannot export DO classes; DOs must live in
 * a dedicated Worker that Pages references via `script_name` binding.
 * This Worker holds the PresenceRoom class + a minimal fetch handler
 * that routes every request to the DO. All behavior — WebSocket
 * upgrade, /snapshot HTTP endpoint, identify/update/ping messages,
 * 90s idle timeout, broadcast cap — is implemented inside PresenceRoom
 * exactly as it was when living in functions/api/presence.ts.
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
}

interface BroadcastSession {
  nounId: number;
  kind: PresenceKind;
  joinedAt: string;
  mood?: string;
  listening?: string;
  where?: string;
}

interface BroadcastPayload {
  humans: number;
  agents: number;
  sessions: BroadcastSession[];
}

type ClientMessage =
  | {
      type?: 'identify' | 'update' | 'ping';
      nounId?: unknown;
      mood?: unknown;
      listening?: unknown;
      where?: unknown;
    }
  | null
  | undefined;

const MAX_BROADCAST_SESSIONS = 50;
const STALE_AFTER_MS = 90_000;

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

export class PresenceRoom {
  state: DurableObjectState;
  connections: Map<string, Connection> = new Map();
  visitors: Map<string, VisitorSession> = new Map();
  broadcastInterval: ReturnType<typeof setInterval> | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname.endsWith('/snapshot')) {
      return Response.json(this.snapshot());
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const sessionId = url.searchParams.get('sid') ?? crypto.randomUUID();
    const kind = normalizeKind(url.searchParams.get('kind'));

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

    const existingVisitor = this.visitors.get(sessionId);
    if (existingVisitor) {
      existingVisitor.kind = mergeKinds(existingVisitor.kind, kind);
      existingVisitor.lastSeen = now;
    } else {
      this.visitors.set(sessionId, {
        sessionId,
        nounId: deriveNounId(sessionId),
        kind,
        joinedAt: new Date(now).toISOString(),
        lastSeen: now,
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

    this.applyVisitorPatch(sessionId, message);
    this.broadcast();
  }

  applyVisitorPatch(sessionId: string, patch: Record<string, unknown>) {
    const visitor = this.visitors.get(sessionId);
    if (!visitor) return;

    visitor.nounId = normalizeNounId(patch.nounId, visitor.nounId);

    if (visitor.kind === 'agent') {
      delete visitor.mood;
      delete visitor.listening;
      delete visitor.where;
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
      visitor.where = normalizeText(patch.where, 80);
      if (!visitor.where) delete visitor.where;
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

  snapshot(): BroadcastPayload {
    const visitors = Array.from(this.visitors.values()).sort((a, b) =>
      a.joinedAt.localeCompare(b.joinedAt),
    );

    let humans = 0;
    let agents = 0;
    for (const visitor of visitors) {
      if (visitor.kind === 'agent') agents += 1;
      else humans += 1;
    }

    const sessions = visitors.slice(0, MAX_BROADCAST_SESSIONS).map((visitor) => {
      const out: BroadcastSession = {
        nounId: visitor.nounId,
        kind: visitor.kind,
        joinedAt: visitor.joinedAt,
      };
      if (visitor.kind !== 'agent') {
        if (visitor.mood) out.mood = visitor.mood;
        if (visitor.listening) out.listening = visitor.listening;
        if (visitor.where) out.where = visitor.where;
      }
      return out;
    });

    return { humans, agents, sessions };
  }

  broadcast() {
    const payload = JSON.stringify(this.snapshot());
    for (const connection of this.connections.values()) {
      try {
        connection.ws.send(payload);
      } catch {}
    }
  }

  startBroadcast() {
    if (this.broadcastInterval) return;
    this.broadcastInterval = setInterval(() => {
      this.cleanupStaleConnections();
      if (this.connections.size === 0) {
        this.stopBroadcast();
        return;
      }
      this.broadcast();
    }, 1000);
  }

  stopBroadcast() {
    if (!this.broadcastInterval) return;
    clearInterval(this.broadcastInterval);
    this.broadcastInterval = null;
  }
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
