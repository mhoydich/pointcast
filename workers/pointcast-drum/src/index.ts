import { DurableObject } from "cloudflare:workers";
export { DrumCounter } from "./drum-counter";

const ROOM_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const MAX_CONNECTIONS = 125;
const TARGET_CONNECTIONS = 100;
const MAX_FRAME_BYTES = 512;
const MAX_MESSAGES_PER_SECOND = 8;
const MAX_ROOM_MESSAGES_PER_SECOND = 300;
const RECENT_HIT_LIMIT = 24;
const PADS = new Set(["kick", "snare", "hat", "tom", "clap", "bell"]);
const REACTIONS = new Set(["⚡", "✦", "♥", "☻", "🔥", "🪩"]);

type Pad = "kick" | "snare" | "hat" | "tom" | "clap" | "bell";
type Reaction = "⚡" | "✦" | "♥" | "☻" | "🔥" | "🪩";

interface SocketAttachment {
  clientId: string;
  avatar: number;
  hue: number;
  joinedAt: number;
  rateStartedAt: number;
  rateCount: number;
  strikes: number;
}

interface HitInput {
  v: 1;
  type: "hit";
  pad: Pad;
  velocity: number;
  seq: number;
  clientAt?: number;
}

interface ReactionInput {
  v: 1;
  type: "reaction";
  emoji: Reaction;
}

type ClientMessage = HitInput | ReactionInput | { v: 1; type: "ping" } | { v: 1; type: "sync" };

interface PublicPerson {
  id: string;
  avatar: number;
  hue: number;
  joinedAt: number;
}

interface RecentHit {
  type: "hit";
  id: string;
  clientId: string;
  avatar: number;
  hue: number;
  pad: Pad;
  velocity: number;
  seq: number;
  serverAt: number;
  clientAt?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPad(value: unknown): value is Pad {
  return typeof value === "string" && PADS.has(value);
}

function isReaction(value: unknown): value is Reaction {
  return typeof value === "string" && REACTIONS.has(value);
}

function isSocketAttachment(value: unknown): value is SocketAttachment {
  if (!isRecord(value)) return false;
  return typeof value.clientId === "string"
    && Number.isInteger(value.avatar)
    && typeof value.hue === "number"
    && typeof value.joinedAt === "number"
    && typeof value.rateStartedAt === "number"
    && typeof value.rateCount === "number"
    && typeof value.strikes === "number";
}

export function normalizeRoom(value: string | null): string {
  const room = (value || "lobby").trim().toLowerCase();
  return ROOM_RE.test(room) ? room : "lobby";
}

export function decodeClientMessage(message: string | ArrayBuffer): ClientMessage | null {
  if (typeof message !== "string" || new TextEncoder().encode(message).byteLength > MAX_FRAME_BYTES) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(message);
  } catch {
    return null;
  }
  if (!isRecord(raw) || raw.v !== 1 || typeof raw.type !== "string") return null;

  if (raw.type === "ping" || raw.type === "sync") return { v: 1, type: raw.type };

  if (raw.type === "reaction" && isReaction(raw.emoji)) {
    return { v: 1, type: "reaction", emoji: raw.emoji };
  }

  if (raw.type !== "hit" || !isPad(raw.pad)) return null;
  if (typeof raw.velocity !== "number" || !Number.isFinite(raw.velocity)) return null;
  if (typeof raw.seq !== "number" || !Number.isInteger(raw.seq) || raw.seq < 0 || raw.seq > 1_000_000_000) return null;

  const clientAt = typeof raw.clientAt === "number" && Number.isFinite(raw.clientAt)
    ? Math.trunc(raw.clientAt)
    : undefined;

  return {
    v: 1,
    type: "hit",
    pad: raw.pad,
    velocity: Math.max(0.05, Math.min(1, raw.velocity)),
    seq: raw.seq,
    ...(clientAt === undefined ? {} : { clientAt }),
  };
}

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(JSON.stringify(value), { ...init, headers });
}

function hashToNumber(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 6), 16);
}

async function identityFor(room: string, sid: string): Promise<{ clientId: string; avatar: number; hue: number }> {
  const bytes = new TextEncoder().encode(`${room}:${sid}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return {
    clientId: `${hex.slice(0, 10)}-${crypto.randomUUID().slice(0, 4)}`,
    avatar: hashToNumber(hex, 10) % 10_000,
    hue: hashToNumber(hex, 16) % 360,
  };
}

function allowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return host === "pointcast.xyz"
      || host.endsWith(".pointcast.pages.dev")
      || host === "localhost"
      || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export class DrumRoomV2 extends DurableObject<Env> {
  private roomBurstStartedAt = 0;
  private roomBurstCount = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_meta (
          key TEXT PRIMARY KEY,
          value INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recent_hits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS recent_hits_created_at ON recent_hits(created_at);
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const room = normalizeRoom(url.searchParams.get("room"));

    if (url.searchParams.get("stats") === "1" || url.pathname.endsWith("/stats")) {
      if (request.method !== "GET") return json({ error: "method-not-allowed" }, { status: 405 });
      return json(this.stats(room));
    }

    if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({
        service: "pointcast-drum-room",
        room,
        target: TARGET_CONNECTIONS,
        websocket: true,
        protocolVersion: 1,
      });
    }

    if (!allowedOrigin(request.headers.get("Origin"))) {
      return json({ error: "origin-not-allowed" }, { status: 403 });
    }

    const active = this.ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN);
    if (active.length >= MAX_CONNECTIONS) {
      return json({ error: "room-full", connected: active.length, capacity: MAX_CONNECTIONS }, { status: 503 });
    }

    const sid = (url.searchParams.get("sid") || crypto.randomUUID()).slice(0, 96);
    const identity = await identityFor(room, sid);
    const now = Date.now();
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const attachment: SocketAttachment = {
      ...identity,
      joinedAt: now,
      rateStartedAt: now,
      rateCount: 0,
      strikes: 0,
    };

    this.ctx.acceptWebSocket(server, [`room:${room}`]);
    server.serializeAttachment(attachment);
    this.send(server, {
      v: 1,
      type: "welcome",
      room,
      you: identity,
      connected: active.length + 1,
      target: TARGET_CONNECTIONS,
      capacity: MAX_CONNECTIONS,
      recentHits: this.recentHits(),
      totalHits: this.totalHits(),
      serverAt: now,
    });
    this.broadcastPresence(room);
    this.logThreshold("join", room, active.length + 1);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, frame: string | ArrayBuffer): void {
    const attachmentValue: unknown = socket.deserializeAttachment();
    if (!isSocketAttachment(attachmentValue)) {
      socket.close(1011, "missing-session");
      return;
    }
    const attachment = attachmentValue;
    const message = decodeClientMessage(frame);
    if (!message) {
      this.send(socket, { v: 1, type: "error", code: "invalid-message" });
      return;
    }

    const now = Date.now();
    if (now - attachment.rateStartedAt >= 1_000) {
      attachment.rateStartedAt = now;
      attachment.rateCount = 0;
      attachment.strikes = Math.max(0, attachment.strikes - 1);
    }
    attachment.rateCount += 1;
    if (attachment.rateCount > MAX_MESSAGES_PER_SECOND) {
      attachment.strikes += 1;
      socket.serializeAttachment(attachment);
      this.send(socket, { v: 1, type: "rate-limit", retryAfterMs: 1_000 });
      if (attachment.strikes >= 4) socket.close(1008, "rate-limit");
      return;
    }
    socket.serializeAttachment(attachment);

    if (now - this.roomBurstStartedAt >= 1_000) {
      this.roomBurstStartedAt = now;
      this.roomBurstCount = 0;
    }
    this.roomBurstCount += 1;
    if (this.roomBurstCount > MAX_ROOM_MESSAGES_PER_SECOND) {
      this.send(socket, { v: 1, type: "busy", retryAfterMs: 250 });
      return;
    }

    if (message.type === "ping") {
      this.send(socket, { v: 1, type: "pong", serverAt: now });
      return;
    }
    if (message.type === "sync") {
      this.send(socket, this.presencePayload(this.roomFromSocket(socket)));
      return;
    }
    if (message.type === "reaction") {
      this.broadcast({
        v: 1,
        type: "reaction",
        id: crypto.randomUUID(),
        clientId: attachment.clientId,
        avatar: attachment.avatar,
        hue: attachment.hue,
        emoji: message.emoji,
        serverAt: now,
      });
      return;
    }

    const event: RecentHit = {
      type: "hit",
      id: crypto.randomUUID(),
      clientId: attachment.clientId,
      avatar: attachment.avatar,
      hue: attachment.hue,
      pad: message.pad,
      velocity: message.velocity,
      seq: message.seq,
      serverAt: now,
      ...(message.clientAt === undefined ? {} : { clientAt: message.clientAt }),
    };

    this.ctx.storage.sql.exec(
      "INSERT INTO recent_hits (payload, created_at) VALUES (?, ?)",
      JSON.stringify(event),
      now,
    );
    this.ctx.storage.sql.exec(
      "DELETE FROM recent_hits WHERE id NOT IN (SELECT id FROM recent_hits ORDER BY id DESC LIMIT ?)",
      RECENT_HIT_LIMIT,
    );
    this.ctx.storage.sql.exec(`
      INSERT INTO room_meta (key, value) VALUES ('total_hits', 1)
      ON CONFLICT(key) DO UPDATE SET value = value + 1
    `);
    this.broadcast({ v: 1, ...event });
  }

  webSocketClose(socket: WebSocket, _code: number, _reason: string, _wasClean: boolean): void {
    const room = this.roomFromSocket(socket);
    this.broadcastPresence(room, socket);
    this.logThreshold("leave", room, this.connected(socket));
  }

  webSocketError(socket: WebSocket, error: unknown): void {
    console.error(JSON.stringify({ message: "drum-room-websocket-error", error: String(error) }));
    const room = this.roomFromSocket(socket);
    this.broadcastPresence(room, socket);
  }

  private totalHits(): number {
    return this.ctx.storage.sql
      .exec<{ value: number }>("SELECT value FROM room_meta WHERE key = 'total_hits'")
      .toArray()[0]?.value ?? 0;
  }

  private recentHits(): RecentHit[] {
    const rows = this.ctx.storage.sql
      .exec<{ payload: string }>("SELECT payload FROM recent_hits ORDER BY id DESC LIMIT ?", RECENT_HIT_LIMIT)
      .toArray()
      .reverse();
    const hits: RecentHit[] = [];
    for (const row of rows) {
      try {
        const value: unknown = JSON.parse(row.payload);
        if (
          isRecord(value)
          && value.type === "hit"
          && typeof value.id === "string"
          && typeof value.clientId === "string"
          && typeof value.avatar === "number"
          && typeof value.hue === "number"
          && isPad(value.pad)
          && typeof value.velocity === "number"
          && typeof value.seq === "number"
          && typeof value.serverAt === "number"
        ) {
          hits.push({
            type: "hit",
            id: value.id,
            clientId: value.clientId,
            avatar: value.avatar,
            hue: value.hue,
            pad: value.pad,
            velocity: value.velocity,
            seq: value.seq,
            serverAt: value.serverAt,
            ...(typeof value.clientAt === "number" ? { clientAt: value.clientAt } : {}),
          });
        }
      } catch {
        // Ignore a malformed historical row and continue serving the room.
      }
    }
    return hits;
  }

  private people(exclude?: WebSocket): PublicPerson[] {
    const people: PublicPerson[] = [];
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === exclude || socket.readyState !== WebSocket.OPEN) continue;
      const attachmentValue: unknown = socket.deserializeAttachment();
      if (!isSocketAttachment(attachmentValue)) continue;
      people.push({
        id: attachmentValue.clientId,
        avatar: attachmentValue.avatar,
        hue: attachmentValue.hue,
        joinedAt: attachmentValue.joinedAt,
      });
    }
    return people.sort((a, b) => a.joinedAt - b.joinedAt);
  }

  private presencePayload(room: string, exclude?: WebSocket): Record<string, unknown> {
    const people = this.people(exclude);
    return {
      v: 1,
      type: "presence",
      room,
      connected: people.length,
      target: TARGET_CONNECTIONS,
      capacity: MAX_CONNECTIONS,
      people,
      serverAt: Date.now(),
    };
  }

  private broadcastPresence(room: string, exclude?: WebSocket): void {
    this.broadcast(this.presencePayload(room, exclude), exclude);
  }

  private broadcast(payload: unknown, exclude?: WebSocket): void {
    const encoded = JSON.stringify(payload);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === exclude || socket.readyState !== WebSocket.OPEN) continue;
      try {
        socket.send(encoded);
      } catch {
        // The runtime will deliver close/error and remove a dead socket.
      }
    }
  }

  private send(socket: WebSocket, payload: unknown): void {
    if (socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(JSON.stringify(payload));
    } catch {
      // A close event will perform the presence update.
    }
  }

  private connected(exclude?: WebSocket): number {
    return this.ctx.getWebSockets().filter((socket) => socket !== exclude && socket.readyState === WebSocket.OPEN).length;
  }

  private roomFromSocket(socket: WebSocket): string {
    const tag = this.ctx.getTags(socket).find((value) => value.startsWith("room:"));
    return normalizeRoom(tag?.slice(5) || "lobby");
  }

  private stats(room: string): Record<string, unknown> {
    return {
      ok: true,
      room,
      connected: this.connected(),
      target: TARGET_CONNECTIONS,
      capacity: MAX_CONNECTIONS,
      totalHits: this.totalHits(),
      recentHitCount: this.recentHits().length,
      protocolVersion: 1,
      hibernation: true,
      serverAt: Date.now(),
    };
  }

  private logThreshold(event: "join" | "leave", room: string, connected: number): void {
    if (connected <= 1 || connected % 25 === 0 || connected === TARGET_CONNECTIONS) {
      console.log(JSON.stringify({ message: "drum-room-presence", event, room, connected, target: TARGET_CONNECTIONS }));
    }
  }
}

/**
 * Kept during the two-step rollout so the existing Pages binding can continue
 * serving its legacy namespace until Pages switches to DrumRoomV2.
 */
export class DrumRoom {
  private readonly sockets = new Set<WebSocket>();

  constructor(_state: DurableObjectState) {}

  fetch(request: Request): Response {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ service: "pointcast-drum-legacy", connected: this.sockets.size });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.sockets.add(server);
    server.addEventListener("message", (event) => {
      if (typeof event.data !== "string" || event.data.length > MAX_FRAME_BYTES) return;
      for (const socket of this.sockets) {
        if (socket === server || socket.readyState !== WebSocket.OPEN) continue;
        try { socket.send(event.data); } catch { this.sockets.delete(socket); }
      }
    });
    const cleanup = () => this.sockets.delete(server);
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);
    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const room = normalizeRoom(url.searchParams.get("room"));
    const stub = env.DRUM_ROOM.getByName(room);
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
