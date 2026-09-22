/**
 * Small browser client for the Nouns Drum Club Durable Object room.
 *
 * It transports anonymous, live human hits only. Audio is deliberately left
 * to the page: a page must first receive a user gesture before it renders a
 * peer hit as sound.
 */

export const NOUNS_DRUM_CLUB_PADS = [
  "kick",
  "snare",
  "clap",
  "hat-closed",
  "hat-open",
  "tom-low",
  "tom-high",
  "rim",
  "shaker",
  "tambourine",
  "bass-c",
  "bass-d",
  "bass-e",
  "bass-f",
  "bass-g",
  "bass-a",
  "bass-b",
  "bass-c2",
  "bass-d2",
  "bass-e2",
  "mallet-c",
  "mallet-d",
  "mallet-e",
  "mallet-f",
  "mallet-g",
  "mallet-a",
  "mallet-b",
  "mallet-c2",
  "mallet-d2",
  "chord-c",
  "chord-dm",
  "chord-em",
  "chord-f",
  "chord-g",
  "chord-am",
  "sparkle",
] as const;

export type NounsDrumClubPad = (typeof NOUNS_DRUM_CLUB_PADS)[number];
export type NounsDrumClubStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "unavailable"
  | "closed";
export type NounsDrumClubHitOrigin = "self" | "peer" | "replay";

export interface NounsDrumClubPerson {
  id: string;
  avatar: number;
  hue: number;
  joinedAt: number;
}

export interface NounsDrumClubHit {
  id: string;
  clientId: string;
  avatar: number;
  hue: number;
  pad: NounsDrumClubPad;
  velocity: number;
  seq: number;
  serverAt: number;
  clientAt?: number;
  origin: NounsDrumClubHitOrigin;
}

export interface NounsDrumClubPresence {
  room: string;
  connected: number;
  target: number;
  capacity: number;
  people: NounsDrumClubPerson[];
  serverAt: number;
}

export interface NounsDrumClubStatusUpdate {
  state: NounsDrumClubStatus;
  attempt?: number;
  retryInMs?: number;
}

export interface NounsDrumClubRoomOptions {
  /** `sunshine` becomes `ndc-sunshine`; a valid `ndc-*` code is kept. */
  room: string;
  /** Useful for preview/tests. Defaults to this origin's `/api/drum/room`. */
  endpoint?: string;
  onStatus?: (update: NounsDrumClubStatusUpdate) => void;
  onPresence?: (presence: NounsDrumClubPresence) => void;
  onHit?: (hit: NounsDrumClubHit) => void;
  onReaction?: (reaction: {
    emoji: string;
    clientId: string;
    avatar: number;
    hue: number;
    serverAt: number;
  }) => void;
}

type RawMessage = Record<string, unknown>;

const ROOM_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const PADS = new Set<string>(NOUNS_DRUM_CLUB_PADS);
const REACTIONS = new Set(["⚡", "✦", "♥", "☻", "🔥", "🪩"]);
const MAX_RETRY_MS = 10_000;
const NDC_FEATURE = "ndc-36";
// The Worker retains at most 24 hits and 125 members. 64 KiB comfortably
// holds the largest valid welcome/presence payload while rejecting an
// unexpectedly large frame before JSON parsing.
const MAX_SERVER_FRAME_BYTES = 64 * 1024;
const MAX_RECENT_HITS = 24;
const MAX_PEOPLE = 125;

function isRecord(value: unknown): value is RawMessage {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function number(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function integer(value: unknown, low: number, high: number): value is number {
  return (
    number(value) && Number.isInteger(value) && value >= low && value <= high
  );
}

function boundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function normalizeRoom(value: string): string {
  const room = value
    .trim()
    .toLowerCase()
    .replace(/^ndc-+/, "ndc-");
  if (!room) return "ndc-lobby";
  const namespaced = room.startsWith("ndc-") ? room : `ndc-${room}`;
  return ROOM_RE.test(namespaced) ? namespaced : "ndc-lobby";
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join("-");
}

function sessionId(room: string): string {
  const key = `pc:nouns-drum-club:sid:${room}`;
  try {
    const previous = window.sessionStorage.getItem(key);
    if (previous) return previous;
    const next = newSessionId();
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return newSessionId();
  }
}

function socketUrl(
  endpoint: string | undefined,
  room: string,
  sid: string,
): string {
  const base =
    endpoint ?? new URL("/api/drum/room", window.location.href).toString();
  const url = new URL(base, window.location.href);
  if (url.protocol === "https:") url.protocol = "wss:";
  if (url.protocol === "http:") url.protocol = "ws:";
  url.searchParams.set("room", room);
  url.searchParams.set("sid", sid);
  return url.toString();
}

/** True when a server message is a valid, current 36-pad Club hit. */
function readHit(
  raw: RawMessage,
  origin: NounsDrumClubHitOrigin,
): NounsDrumClubHit | null {
  if (
    raw.type !== "hit" ||
    !boundedText(raw.id, 64) ||
    !boundedText(raw.clientId, 64) ||
    !PADS.has(raw.pad as string) ||
    !number(raw.velocity) ||
    raw.velocity < 0.05 ||
    raw.velocity > 1 ||
    !integer(raw.seq, 0, 1_000_000_000) ||
    !integer(raw.avatar, 0, 9_999) ||
    !integer(raw.hue, 0, 359) ||
    !integer(raw.serverAt, 0, Number.MAX_SAFE_INTEGER)
  )
    return null;
  return {
    id: raw.id,
    clientId: raw.clientId,
    avatar: raw.avatar,
    hue: raw.hue,
    pad: raw.pad as NounsDrumClubPad,
    velocity: Math.max(0.05, Math.min(1, raw.velocity)),
    seq: raw.seq,
    serverAt: raw.serverAt,
    ...(integer(raw.clientAt, 0, Number.MAX_SAFE_INTEGER)
      ? { clientAt: raw.clientAt }
      : {}),
    origin,
  };
}

export class NounsDrumClubRoom {
  readonly room: string;
  private readonly options: NounsDrumClubRoomOptions;
  private readonly sid: string;
  private socket: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private welcomeTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private sequence = 0;
  private stopped = false;
  private clientId = "";

  constructor(options: NounsDrumClubRoomOptions) {
    this.options = options;
    this.room = normalizeRoom(options.room);
    this.sid = sessionId(this.room);
  }

  connect(): void {
    if (this.stopped) this.stopped = false;
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    )
      return;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.options.onStatus?.({
      state: this.attempt ? "reconnecting" : "connecting",
      ...(this.attempt ? { attempt: this.attempt } : {}),
    });
    try {
      this.clientId = "";
      const socket = new WebSocket(
        socketUrl(this.options.endpoint, this.room, this.sid),
      );
      this.socket = socket;
      this.welcomeTimer = setTimeout(() => {
        if (this.socket !== socket || this.clientId) return;
        this.options.onStatus?.({ state: "unavailable" });
        socket.close(1008, "welcome-timeout");
      }, 4_000);
      socket.addEventListener("open", () => {
        if (this.socket !== socket) return;
        this.attempt = 0;
        // `welcome` carries the server's NDC capability. Do not report a
        // room as live merely because an older Worker accepted its socket.
        this.send({ v: 1, type: "sync" });
      });
      socket.addEventListener("message", (event) => {
        if (this.socket === socket) this.receive(event.data);
      });
      socket.addEventListener("error", () => {
        if (this.socket === socket && !this.stopped)
          this.options.onStatus?.({ state: "unavailable" });
      });
      socket.addEventListener("close", () => {
        if (this.socket !== socket) return;
        this.socket = null;
        if (this.welcomeTimer) clearTimeout(this.welcomeTimer);
        this.welcomeTimer = null;
        if (this.stopped) {
          this.options.onStatus?.({ state: "closed" });
          return;
        }
        this.scheduleReconnect();
      });
    } catch {
      this.options.onStatus?.({ state: "unavailable" });
      this.scheduleReconnect();
    }
  }

  /**
   * Accept a UI string at the public boundary and reject unknown IDs before
   * anything reaches the network. This keeps page-level pad maps ergonomic
   * without widening the server's fixed 36-pad contract.
   */
  hit(pad: string, velocity = 0.8): boolean {
    if (!PADS.has(pad)) return false;
    return this.send({
      v: 1,
      type: "hit",
      pad,
      velocity: Math.max(0.05, Math.min(1, velocity)),
      seq: ++this.sequence,
      clientAt: Date.now(),
    });
  }

  sendReaction(emoji: string): boolean {
    return REACTIONS.has(emoji) && this.send({ v: 1, type: "reaction", emoji });
  }

  disconnect(): void {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (this.welcomeTimer) clearTimeout(this.welcomeTimer);
    this.welcomeTimer = null;
    const socket = this.socket;
    this.socket = null;
    if (socket && socket.readyState < WebSocket.CLOSING)
      socket.close(1000, "leave-room");
    this.options.onStatus?.({ state: "closed" });
  }

  private send(message: Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.retryTimer) return;
    this.attempt += 1;
    const retryInMs = Math.min(
      MAX_RETRY_MS,
      500 * 2 ** Math.min(this.attempt - 1, 5),
    );
    this.options.onStatus?.({
      state: "reconnecting",
      attempt: this.attempt,
      retryInMs,
    });
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, retryInMs);
  }

  private receive(data: unknown): void {
    if (
      typeof data !== "string" ||
      new TextEncoder().encode(data).byteLength > MAX_SERVER_FRAME_BYTES
    )
      return;
    let raw: unknown;
    try {
      raw = JSON.parse(data);
    } catch {
      return;
    }
    if (!isRecord(raw) || raw.v !== 1 || typeof raw.type !== "string") return;

    if (raw.type === "welcome") {
      if (this.welcomeTimer) clearTimeout(this.welcomeTimer);
      this.welcomeTimer = null;
      if (!isRecord(raw.you) || typeof raw.you.clientId !== "string") {
        this.options.onStatus?.({ state: "unavailable" });
        this.socket?.close(1008, "missing-identity");
        return;
      }
      this.clientId = raw.you.clientId;
      const supportsNdc =
        Array.isArray(raw.features) && raw.features.includes(NDC_FEATURE);
      if (!supportsNdc) {
        this.options.onStatus?.({ state: "unavailable" });
        this.socket?.close(1008, "ndc-36-required");
        return;
      }
      this.options.onStatus?.({ state: "live" });
      if (Array.isArray(raw.recentHits)) {
        for (const item of raw.recentHits.slice(0, MAX_RECENT_HITS)) {
          if (!isRecord(item)) continue;
          const hit = readHit(item, "replay");
          if (hit) this.options.onHit?.(hit);
        }
      }
      return;
    }
    if (raw.type === "hit") {
      const hit = readHit(
        raw,
        raw.clientId === this.clientId ? "self" : "peer",
      );
      if (hit) this.options.onHit?.(hit);
      return;
    }
    if (raw.type === "presence") {
      const people = Array.isArray(raw.people)
        ? raw.people.slice(0, MAX_PEOPLE).flatMap((person) => {
            if (
              !isRecord(person) ||
              !boundedText(person.id, 64) ||
              !integer(person.avatar, 0, 9_999) ||
              !integer(person.hue, 0, 359) ||
              !integer(person.joinedAt, 0, Number.MAX_SAFE_INTEGER)
            )
              return [];
            return [
              {
                id: person.id,
                avatar: person.avatar,
                hue: person.hue,
                joinedAt: person.joinedAt,
              },
            ];
          })
        : [];
      if (
        boundedText(raw.room, 32) &&
        integer(raw.connected, 0, MAX_PEOPLE) &&
        integer(raw.target, 1, MAX_PEOPLE) &&
        integer(raw.capacity, 1, MAX_PEOPLE) &&
        raw.target <= raw.capacity &&
        raw.connected <= raw.capacity &&
        integer(raw.serverAt, 0, Number.MAX_SAFE_INTEGER)
      ) {
        this.options.onPresence?.({
          room: raw.room,
          connected: raw.connected,
          target: raw.target,
          capacity: raw.capacity,
          people,
          serverAt: raw.serverAt,
        });
      }
      return;
    }
    if (
      raw.type === "reaction" &&
      REACTIONS.has(raw.emoji as string) &&
      boundedText(raw.clientId, 64) &&
      integer(raw.avatar, 0, 9_999) &&
      integer(raw.hue, 0, 359) &&
      integer(raw.serverAt, 0, Number.MAX_SAFE_INTEGER)
    ) {
      this.options.onReaction?.({
        emoji: raw.emoji as string,
        clientId: raw.clientId,
        avatar: raw.avatar,
        hue: raw.hue,
        serverAt: raw.serverAt,
      });
    }
  }
}
