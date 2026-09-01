/**
 * pointcast-bloom — the Durable Object behind Bloom Party (/bloom-party).
 *
 * One DO per six-letter room code. It owns the round state machine, the
 * roster, and the scoreboard; it never touches audio. A bloom crosses the
 * wire as a ten-field spec and every phone synthesizes it locally, so a
 * fifteen-phone room costs the same bandwidth as a four-phone one.
 *
 * Structure, rate limiting, hibernation, and origin checks follow
 * `workers/pointcast-drum/src/index.ts`. The one thing with no precedent in
 * this repo is phase timing: it uses `ctx.storage.setAlarm()` rather than a
 * timer, because `setInterval` does not survive WebSocket hibernation.
 *
 * Author: cc.
 */

import { DurableObject } from "cloudflare:workers";

import {
  MAX_CONNECTIONS,
  MAX_OBSERVERS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PROMPT_MS,
  REVEAL_MS,
  ROUNDS_PER_GAME,
  SCOREBOARD_MS,
  buildMs,
  dealPrompt,
  heatAllowance,
  normalizeSpec,
  playbackMs,
  shortlistSlots,
  tallyRound,
  usesHeat,
  voteMs,
  type BloomSpec,
  type Phase,
  type RoundVote,
// Single source of truth, shared with the page and the tests. Wrangler's
// bundler resolves this out of the Pages project; do not fork a copy here or
// the two ends of the wire will drift.
} from "../../../src/lib/bloom-party";

const ROOM_CODE_RE = /^[A-HJKMNP-TV-Z2-9]{6}$/;
const MAX_FRAME_BYTES = 1024;
const MAX_MESSAGES_PER_SECOND = 10;
const MAX_ROOM_MESSAGES_PER_SECOND = 200;
const MAX_STRIKES = 4;
const IDLE_SHUTDOWN_MS = 45 * 60_000;

type Role = "player" | "stage";

interface SocketAttachment {
  playerId: string;
  role: Role;
  emoji: number;
  hue: number;
  joinedAt: number;
  rateStartedAt: number;
  rateCount: number;
  strikes: number;
}

interface PlayerRow {
  id: string;
  name: string;
  emoji: number;
  hue: number;
  score: number;
  joined_at: number;
  last_seen: number;
  is_host: number;
}

interface SubmissionRow {
  player_id: string;
  spec: string;
  slot: number;
  submitted_at: number;
}

interface VoteRow {
  voter_id: string;
  target_slot: number;
  kind: string;
}

type ClientMessage =
  | { v: 1; type: "hello"; role: Role; name: string }
  | { v: 1; type: "start" }
  | { v: 1; type: "submit"; spec: BloomSpec }
  | { v: 1; type: "unsubmit" }
  | { v: 1; type: "heat"; slot: number }
  | { v: 1; type: "vote"; slot: number }
  | { v: 1; type: "next" }
  | { v: 1; type: "ping" }
  | { v: 1; type: "sync" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSocketAttachment(value: unknown): value is SocketAttachment {
  if (!isRecord(value)) return false;
  return typeof value.playerId === "string"
    && (value.role === "player" || value.role === "stage")
    && typeof value.emoji === "number"
    && typeof value.hue === "number"
    && typeof value.joinedAt === "number"
    && typeof value.rateStartedAt === "number"
    && typeof value.rateCount === "number"
    && typeof value.strikes === "number";
}

export function normalizeRoom(value: string | null): string | null {
  const code = (value ?? "").trim().toUpperCase();
  return ROOM_CODE_RE.test(code) ? code : null;
}

/** Trim a display name to something that fits a phone roster without
 *  smuggling markup into fifteen other people's screens. */
function cleanName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f<>&]/g, "").trim().slice(0, 16);
}

export function decodeClientMessage(message: string | ArrayBuffer): ClientMessage | null {
  if (typeof message !== "string") return null;
  if (new TextEncoder().encode(message).byteLength > MAX_FRAME_BYTES) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(message);
  } catch {
    return null;
  }
  if (!isRecord(raw) || raw.v !== 1 || typeof raw.type !== "string") return null;

  switch (raw.type) {
    case "ping":
    case "sync":
    case "start":
    case "unsubmit":
    case "next":
      return { v: 1, type: raw.type };
    case "hello":
      return {
        v: 1,
        type: "hello",
        role: raw.role === "stage" ? "stage" : "player",
        name: cleanName(raw.name),
      };
    case "submit":
      return { v: 1, type: "submit", spec: normalizeSpec(raw.spec) };
    case "heat":
    case "vote": {
      if (typeof raw.slot !== "number" || !Number.isInteger(raw.slot)) return null;
      if (raw.slot < 0 || raw.slot >= MAX_PLAYERS) return null;
      return { v: 1, type: raw.type, slot: raw.slot };
    }
    default:
      return null;
  }
}

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(JSON.stringify(value), { ...init, headers });
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

function hashToNumber(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 6), 16);
}

/** Stable identity from (room, sid). A phone that locks its screen mid-round
 *  reconnects with the same playerId and keeps its score — non-negotiable for
 *  a party game where someone always takes a call. */
async function identityFor(room: string, sid: string): Promise<{ playerId: string; emoji: number; hue: number }> {
  const bytes = new TextEncoder().encode(`${room}:${sid}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return {
    playerId: hex.slice(0, 12),
    emoji: hashToNumber(hex, 12) % 24,
    hue: hashToNumber(hex, 18) % 360,
  };
}

export class BloomPartyRoom extends DurableObject<Env> {
  private roomBurstStartedAt = 0;
  private roomBurstCount = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS players (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          emoji INTEGER NOT NULL,
          hue INTEGER NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          joined_at INTEGER NOT NULL,
          last_seen INTEGER NOT NULL,
          is_host INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS submissions (
          round INTEGER NOT NULL,
          player_id TEXT NOT NULL,
          spec TEXT NOT NULL,
          slot INTEGER NOT NULL,
          submitted_at INTEGER NOT NULL,
          PRIMARY KEY (round, player_id)
        );
        CREATE TABLE IF NOT EXISTS votes (
          round INTEGER NOT NULL,
          voter_id TEXT NOT NULL,
          target_slot INTEGER NOT NULL,
          kind TEXT NOT NULL,
          PRIMARY KEY (round, voter_id, kind, target_slot)
        );
        CREATE TABLE IF NOT EXISTS room_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    });
  }

  // ---------- HTTP -----------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const room = normalizeRoom(url.searchParams.get("room"));
    if (!room) return json({ error: "bad-room-code" }, { status: 400 });

    if (url.searchParams.get("stats") === "1" || url.pathname.endsWith("/stats")) {
      if (request.method !== "GET") return json({ error: "method-not-allowed" }, { status: 405 });
      return json(this.stats(room));
    }

    if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({
        service: "pointcast-bloom-party",
        room,
        websocket: true,
        protocolVersion: 1,
        maxPlayers: MAX_PLAYERS,
        rounds: ROUNDS_PER_GAME,
      });
    }

    if (!allowedOrigin(request.headers.get("Origin"))) {
      return json({ error: "origin-not-allowed" }, { status: 403 });
    }

    const requestedRole: Role = url.searchParams.get("role") === "stage" ? "stage" : "player";
    const open = this.ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN);
    if (open.length >= MAX_CONNECTIONS) {
      return json({ error: "room-full", connected: open.length, capacity: MAX_CONNECTIONS }, { status: 503 });
    }
    if (requestedRole === "stage" && this.countRole("stage") >= MAX_OBSERVERS) {
      return json({ error: "too-many-stages" }, { status: 503 });
    }

    const sid = (url.searchParams.get("sid") || crypto.randomUUID()).slice(0, 96);
    const identity = await identityFor(room, sid);
    const now = Date.now();

    // A returning player keeps their seat. A new player is only seated if
    // the room has room and the game has not already dealt them out.
    const existing = this.player(identity.playerId);
    if (requestedRole === "player" && !existing && this.playerCount() >= MAX_PLAYERS) {
      return json({ error: "game-full", maxPlayers: MAX_PLAYERS }, { status: 503 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const attachment: SocketAttachment = {
      playerId: identity.playerId,
      role: requestedRole,
      emoji: identity.emoji,
      hue: identity.hue,
      joinedAt: now,
      rateStartedAt: now,
      rateCount: 0,
      strikes: 0,
    };

    this.ctx.acceptWebSocket(server, [`room:${room}`, `role:${requestedRole}`]);
    server.serializeAttachment(attachment);

    if (requestedRole === "player") {
      const isFirst = this.playerCount() === 0;
      this.ctx.storage.sql.exec(
        `INSERT INTO players (id, name, emoji, hue, score, joined_at, last_seen, is_host)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen`,
        identity.playerId,
        existing?.name ?? "",
        identity.emoji,
        identity.hue,
        now,
        now,
        isFirst ? 1 : 0,
      );
      this.ensureHost();
    }

    this.send(server, this.welcome(room, identity.playerId, requestedRole));
    this.broadcastRoster();
    this.armAlarm();

    return new Response(null, { status: 101, webSocket: client });
  }

  // ---------- WebSocket ------------------------------------------------

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
      if (attachment.strikes >= MAX_STRIKES) socket.close(1008, "rate-limit");
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

    this.touch(attachment.playerId, now);
    this.handle(socket, attachment, message, now);
  }

  webSocketClose(socket: WebSocket): void {
    this.broadcastRoster(socket);
    this.ensureHost(socket);
    this.maybeAdvanceEarly();
  }

  webSocketError(socket: WebSocket, error: unknown): void {
    console.error(JSON.stringify({ message: "bloom-party-websocket-error", error: String(error) }));
    this.broadcastRoster(socket);
    this.ensureHost(socket);
    // A socket that dies by error rather than close still removes an
    // outstanding submitter or voter; without this the room waits out the
    // full deadline for someone who is already gone.
    this.maybeAdvanceEarly();
  }

  // ---------- the alarm is the clock -----------------------------------

  /**
   * Every phase deadline is an alarm. There is exactly one outstanding alarm
   * at a time; `phase_ends_at` is the authority and the alarm is just the
   * wake-up. If an alarm fires early (or twice), the deadline check below
   * re-arms rather than double-advancing.
   */
  async alarm(): Promise<void> {
    const endsAt = Number(this.meta("phase_ends_at") ?? "0");
    const now = Date.now();

    // `lobby` and `final` have no deadline, so an alarm there is the idle
    // sweep rather than a phase boundary.
    if (endsAt <= 0) {
      this.sweepIdle(now);
      return;
    }

    // Fired early. `phase_ends_at` is the authority, so re-arm rather than
    // advancing a phase that has not actually run out.
    if (endsAt > now + 50) {
      this.armAlarm();
      return;
    }
    this.advance(now);
  }

  // ---------- message handling -----------------------------------------

  private handle(socket: WebSocket, attachment: SocketAttachment, message: ClientMessage, now: number): void {
    const phase = this.phase();

    switch (message.type) {
      case "ping":
        this.send(socket, { v: 1, type: "pong", serverAt: now });
        return;

      case "sync":
        this.send(socket, this.welcome(this.roomFromSocket(socket), attachment.playerId, attachment.role));
        return;

      case "hello": {
        if (attachment.role !== "player") return;
        if (message.name) {
          this.ctx.storage.sql.exec("UPDATE players SET name = ? WHERE id = ?", message.name, attachment.playerId);
        }
        this.broadcastRoster();
        return;
      }

      case "start": {
        if (!this.isHost(attachment.playerId)) {
          this.send(socket, { v: 1, type: "error", code: "host-only" });
          return;
        }
        if (phase !== "lobby" && phase !== "final") {
          this.send(socket, { v: 1, type: "error", code: "wrong-phase" });
          return;
        }
        if (this.playerCount() < MIN_PLAYERS) {
          this.send(socket, { v: 1, type: "error", code: "need-more-players", minPlayers: MIN_PLAYERS });
          return;
        }
        this.startGame(now);
        return;
      }

      case "submit": {
        if (phase !== "build" || attachment.role !== "player") {
          this.send(socket, { v: 1, type: "error", code: "wrong-phase" });
          return;
        }
        const round = this.round();
        const existing = this.ctx.storage.sql
          .exec<{ slot: number }>("SELECT slot FROM submissions WHERE round = ? AND player_id = ?", round, attachment.playerId)
          .toArray()[0];
        const slot = existing?.slot ?? this.nextSlot(round);
        this.ctx.storage.sql.exec(
          `INSERT INTO submissions (round, player_id, spec, slot, submitted_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(round, player_id) DO UPDATE SET spec = excluded.spec, submitted_at = excluded.submitted_at`,
          round,
          attachment.playerId,
          JSON.stringify(message.spec),
          slot,
          now,
        );
        this.send(socket, { v: 1, type: "submitted", round, serverAt: now });
        this.broadcastRoster();
        this.maybeAdvanceEarly();
        return;
      }

      case "unsubmit": {
        if (phase !== "build" || attachment.role !== "player") return;
        this.ctx.storage.sql.exec(
          "DELETE FROM submissions WHERE round = ? AND player_id = ?",
          this.round(),
          attachment.playerId,
        );
        this.broadcastRoster();
        return;
      }

      case "heat": {
        if (phase !== "playback" || attachment.role !== "player") return;
        const frozen = this.roundPlayers();
        if (!usesHeat(frozen)) return;
        const round = this.round();
        if (this.ownsSlot(round, attachment.playerId, message.slot)) {
          this.send(socket, { v: 1, type: "error", code: "no-self-heat" });
          return;
        }
        // A slot with no submission behind it is not heatable. Without this a
        // heat aimed at a bloom whose author just unsubmitted is acked as a
        // success while the tally throws it away — the player silently loses
        // one of their picks.
        if (!this.slotsForRound(round).includes(message.slot)) {
          this.send(socket, { v: 1, type: "error", code: "no-such-bloom" });
          return;
        }
        const used = this.voteCount(round, attachment.playerId, "heat");
        if (used >= heatAllowance(frozen)) {
          this.send(socket, { v: 1, type: "error", code: "no-heats-left" });
          return;
        }
        this.ctx.storage.sql.exec(
          `INSERT INTO votes (round, voter_id, target_slot, kind) VALUES (?, ?, ?, 'heat')
           ON CONFLICT(round, voter_id, kind, target_slot) DO NOTHING`,
          round,
          attachment.playerId,
          message.slot,
        );
        this.send(socket, {
          v: 1,
          type: "heat-ack",
          slot: message.slot,
          remaining: Math.max(0, heatAllowance(frozen) - this.voteCount(round, attachment.playerId, "heat")),
        });
        return;
      }

      case "vote": {
        if (phase !== "vote" || attachment.role !== "player") {
          this.send(socket, { v: 1, type: "error", code: "wrong-phase" });
          return;
        }
        const round = this.round();
        if (this.ownsSlot(round, attachment.playerId, message.slot)) {
          this.send(socket, { v: 1, type: "error", code: "no-self-vote" });
          return;
        }
        if (!this.ballot().includes(message.slot)) {
          this.send(socket, { v: 1, type: "error", code: "not-on-ballot" });
          return;
        }
        if (this.voteCount(round, attachment.playerId, "vote") > 0) {
          this.send(socket, { v: 1, type: "error", code: "already-voted" });
          return;
        }
        this.ctx.storage.sql.exec(
          "INSERT INTO votes (round, voter_id, target_slot, kind) VALUES (?, ?, ?, 'vote')",
          round,
          attachment.playerId,
          message.slot,
        );
        this.send(socket, { v: 1, type: "voted", slot: message.slot, round });
        this.broadcastRoster();
        this.maybeAdvanceEarly();
        return;
      }

      case "next": {
        if (!this.isHost(attachment.playerId)) {
          this.send(socket, { v: 1, type: "error", code: "host-only" });
          return;
        }
        if (phase !== "reveal" && phase !== "scoreboard") return;
        this.advance(now);
        return;
      }
    }
  }

  // ---------- state machine --------------------------------------------

  private startGame(now: number): void {
    this.ctx.storage.sql.exec("DELETE FROM submissions");
    this.ctx.storage.sql.exec("DELETE FROM votes");
    this.ctx.storage.sql.exec("UPDATE players SET score = 0");
    this.setMeta("round", "0");
    this.setMeta("used_prompts", "[]");
    this.beginRound(now);
  }

  private beginRound(now: number): void {
    const round = this.round() + 1;
    const used: string[] = JSON.parse(this.meta("used_prompts") ?? "[]");
    const card = dealPrompt(used, () => Math.random());
    used.push(card.id);

    this.setMeta("round", String(round));
    this.setMeta("used_prompts", JSON.stringify(used));
    this.setMeta("prompt_id", card.id);
    this.setMeta("prompt_text", card.text);
    this.setMeta("ballot", "[]");
    this.setMeta("playback_index", "0");
    // Cleared here, re-frozen when this round reaches playback.
    this.setMeta("round_players", "0");
    this.enter("prompt", PROMPT_MS, now);
  }

  /** Move to the next phase. The only place `phase` ever changes. */
  private advance(now: number): void {
    const phase = this.phase();
    const players = this.livePlayerCount();

    switch (phase) {
      case "prompt":
        this.enter("build", buildMs(players), now);
        return;

      case "build": {
        const slots = this.slotsForRound(this.round());
        if (slots.length === 0) {
          // Nobody built anything. Skip straight past the empty round rather
          // than showing a room of fifteen people an empty ballot.
          this.finishRound(now, true);
          return;
        }
        // Freeze the room size for the rest of the round. Every rule that
        // depends on it — heat mode, heat allowance, how many blooms reach the
        // ballot — must agree from playback through tally. Re-reading the live
        // count at each step let a single reconnect flip a 6-player room into
        // 7-player shortlist mode with zero heats cast, silently dropping two
        // people's blooms off the ballot.
        this.setMeta("round_players", String(players));
        this.enter("playback", slots.length * playbackMs(players), now);
        this.emitPlayback(now);
        return;
      }

      case "playback": {
        const frozen = this.roundPlayers();
        const tallies = this.talliesForRound(this.round());
        const ballot = shortlistSlots(tallies, frozen)
          .filter((slot) => tallies.some((tally) => tally.slot === slot));
        this.setMeta("ballot", JSON.stringify(ballot));
        this.enter("vote", voteMs(ballot.length), now);
        // Everyone eligible may already have been eliminated from voting (a
        // one-bloom ballot owned by the only live player), in which case no
        // vote message will ever arrive to trigger the early advance.
        this.maybeAdvanceEarly();
        return;
      }

      case "vote":
        this.finishRound(now, false);
        return;

      case "reveal":
        this.enter("scoreboard", SCOREBOARD_MS, now);
        this.broadcastScoreboard();
        return;

      case "scoreboard": {
        if (this.round() >= ROUNDS_PER_GAME) {
          this.enter("final", 0, now);
          this.broadcastScoreboard();
          return;
        }
        this.beginRound(now);
        return;
      }

      default:
        return;
    }
  }

  private finishRound(now: number, empty: boolean): void {
    const round = this.round();
    if (!empty) {
      const submissions = this.submissionsForRound(round).map((row) => ({
        playerId: row.player_id,
        slot: row.slot,
        submittedAt: row.submitted_at,
      }));
      const votes = this.votesForRound(round, "vote");
      const heats = this.votesForRound(round, "heat");
      const result = tallyRound(submissions, votes, heats);

      for (const [playerId, points] of Object.entries(result.points)) {
        this.ctx.storage.sql.exec("UPDATE players SET score = score + ? WHERE id = ?", points, playerId);
      }

      this.broadcast({
        v: 1,
        type: "results",
        round,
        prompt: this.meta("prompt_text") ?? "",
        unanimous: result.unanimous,
        winningSlots: result.winningSlots,
        tallies: result.tallies.map((tally) => ({
          slot: tally.slot,
          votes: tally.votes,
          heats: tally.heats,
          playerId: tally.playerId,
          name: this.player(tally.playerId)?.name ?? "",
          spec: this.specForSlot(round, tally.slot),
        })),
        serverAt: now,
      });
    }
    this.enter("reveal", REVEAL_MS, now);
  }

  /** Write the phase and arm the alarm. */
  private enter(phase: Phase, durationMs: number, now: number): void {
    const endsAt = durationMs > 0 ? now + durationMs : 0;
    this.setMeta("phase", phase);
    this.setMeta("phase_ends_at", String(endsAt));
    this.broadcastPhase(now);
    this.armAlarm();
  }

  /**
   * Advance the moment everyone has acted, without waiting out the clock.
   * This is what keeps four players from staring at a forty-second timer,
   * and it is why a fifteen-player room still finishes a round in about the
   * same wall time.
   */
  private maybeAdvanceEarly(): void {
    const phase = this.phase();
    const live = this.livePlayerIds();
    if (live.length === 0) return;
    const round = this.round();

    if (phase === "build") {
      const submitted = new Set(this.submissionsForRound(round).map((row) => row.player_id));
      if (live.every((id) => submitted.has(id))) this.advance(Date.now());
      return;
    }
    if (phase === "vote") {
      const voted = new Set(this.votesForRound(round, "vote").map((vote) => vote.voterId));
      // A player whose own bloom is the only ballot option cannot vote, so
      // they are not counted as outstanding.
      const eligible = live.filter((id) => this.ballot().some((slot) => !this.ownsSlot(round, id, slot)));
      if (eligible.every((id) => voted.has(id))) this.advance(Date.now());
    }
  }

  private emitPlayback(now: number): void {
    const round = this.round();
    const players = this.roundPlayers();
    const per = playbackMs(players);
    const rows = this.submissionsForRound(round).sort((a, b) => a.slot - b.slot);

    // The whole playback order is sent in one frame. Clients schedule against
    // `startAt`, so a phone that reconnects mid-phase re-syncs to the same
    // timeline rather than restarting it.
    this.broadcast({
      v: 1,
      type: "playback",
      round,
      durationMs: per,
      total: rows.length,
      heats: usesHeat(players) ? heatAllowance(players) : 0,
      items: rows.map((row, index) => ({
        slot: row.slot,
        spec: JSON.parse(row.spec) as BloomSpec,
        startAt: now + index * per,
      })),
      serverAt: now,
    });
  }

  // ---------- payloads ---------------------------------------------------

  private welcome(room: string, playerId: string, role: Role): Record<string, unknown> {
    const now = Date.now();
    const round = this.round();
    const phase = this.phase();
    return {
      v: 1,
      type: "welcome",
      room,
      you: { playerId, role, isHost: this.isHost(playerId) },
      phase,
      round,
      rounds: ROUNDS_PER_GAME,
      prompt: phase === "lobby" ? "" : this.meta("prompt_text") ?? "",
      phaseEndsAt: Number(this.meta("phase_ends_at") ?? "0"),
      ballot: this.ballot(),
      players: this.roster(),
      maxPlayers: MAX_PLAYERS,
      minPlayers: MIN_PLAYERS,
      protocolVersion: 1,
      serverAt: now,
    };
  }

  private roster(exclude?: WebSocket): Array<Record<string, unknown>> {
    const connected = new Set(this.livePlayerIds(exclude));
    const submitted = new Set(this.submissionsForRound(this.round()).map((row) => row.player_id));
    const voted = new Set(this.votesForRound(this.round(), "vote").map((vote) => vote.voterId));
    return this.ctx.storage.sql
      .exec<PlayerRow>("SELECT * FROM players ORDER BY joined_at ASC")
      .toArray()
      .map((row) => ({
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        hue: row.hue,
        score: row.score,
        isHost: row.is_host === 1,
        connected: connected.has(row.id),
        submitted: submitted.has(row.id),
        voted: voted.has(row.id),
      }));
  }

  private broadcastRoster(exclude?: WebSocket): void {
    this.broadcast({
      v: 1,
      type: "roster",
      players: this.roster(exclude),
      connected: this.livePlayerIds(exclude).length,
      serverAt: Date.now(),
    }, exclude);
  }

  private broadcastPhase(now: number): void {
    this.broadcast({
      v: 1,
      type: "phase",
      phase: this.phase(),
      round: this.round(),
      rounds: ROUNDS_PER_GAME,
      prompt: this.meta("prompt_text") ?? "",
      promptId: this.meta("prompt_id") ?? "",
      phaseEndsAt: Number(this.meta("phase_ends_at") ?? "0"),
      ballot: this.ballot(),
      players: this.livePlayerCount(),
      serverAt: now,
    });
  }

  private broadcastScoreboard(): void {
    const standings = this.ctx.storage.sql
      .exec<PlayerRow>("SELECT * FROM players ORDER BY score DESC, joined_at ASC")
      .toArray()
      .map((row) => ({ id: row.id, name: row.name, emoji: row.emoji, hue: row.hue, score: row.score }));
    this.broadcast({
      v: 1,
      type: "scoreboard",
      standings,
      round: this.round(),
      rounds: ROUNDS_PER_GAME,
      roundsRemaining: Math.max(0, ROUNDS_PER_GAME - this.round()),
      final: this.phase() === "final",
      serverAt: Date.now(),
    });
  }

  // ---------- storage helpers -------------------------------------------

  private meta(key: string): string | null {
    return this.ctx.storage.sql
      .exec<{ value: string }>("SELECT value FROM room_meta WHERE key = ?", key)
      .toArray()[0]?.value ?? null;
  }

  private setMeta(key: string, value: string): void {
    this.ctx.storage.sql.exec(
      "INSERT INTO room_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      key,
      value,
    );
  }

  private phase(): Phase {
    return (this.meta("phase") as Phase | null) ?? "lobby";
  }

  private round(): number {
    return Number(this.meta("round") ?? "0");
  }

  private ballot(): number[] {
    try {
      const parsed: unknown = JSON.parse(this.meta("ballot") ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((slot): slot is number => typeof slot === "number") : [];
    } catch {
      return [];
    }
  }

  private player(id: string): PlayerRow | undefined {
    return this.ctx.storage.sql
      .exec<PlayerRow>("SELECT * FROM players WHERE id = ?", id)
      .toArray()[0];
  }

  private playerCount(): number {
    return this.ctx.storage.sql
      .exec<{ n: number }>("SELECT COUNT(*) AS n FROM players")
      .toArray()[0]?.n ?? 0;
  }

  private isHost(playerId: string): boolean {
    return this.player(playerId)?.is_host === 1;
  }

  /** Hand the host badge to the longest-present connected player whenever the
   *  current host drops. Without this, a host who leaves freezes the room. */
  private ensureHost(exclude?: WebSocket): void {
    const live = this.livePlayerIds(exclude);
    if (live.length === 0) return;
    const hostRow = this.ctx.storage.sql
      .exec<PlayerRow>("SELECT * FROM players WHERE is_host = 1")
      .toArray()[0];
    if (hostRow && live.includes(hostRow.id)) return;

    const heir = this.ctx.storage.sql
      .exec<PlayerRow>("SELECT * FROM players ORDER BY joined_at ASC")
      .toArray()
      .find((row) => live.includes(row.id));
    if (!heir) return;
    this.ctx.storage.sql.exec("UPDATE players SET is_host = 0");
    this.ctx.storage.sql.exec("UPDATE players SET is_host = 1 WHERE id = ?", heir.id);
    this.broadcastRoster(exclude);
  }

  private touch(playerId: string, now: number): void {
    this.ctx.storage.sql.exec("UPDATE players SET last_seen = ? WHERE id = ?", now, playerId);
  }

  private submissionsForRound(round: number): SubmissionRow[] {
    return this.ctx.storage.sql
      .exec<SubmissionRow>("SELECT player_id, spec, slot, submitted_at FROM submissions WHERE round = ? ORDER BY slot ASC", round)
      .toArray();
  }

  private slotsForRound(round: number): number[] {
    return this.submissionsForRound(round).map((row) => row.slot);
  }

  /** The player count this round's rules were frozen at, set when playback
   *  begins. Falls back to the live count before that point. */
  private roundPlayers(): number {
    const frozen = Number(this.meta("round_players") ?? "0");
    return frozen > 0 ? frozen : this.livePlayerCount();
  }

  /**
   * Pick a random free slot, not the lowest one.
   *
   * Slots are the anonymous handle a bloom is played and voted under, and
   * playback runs in slot order. Handing them out sequentially made playback
   * order identical to submission order — and the roster shows who has
   * submitted, live, as they do it. Anyone watching the lobby fill in could
   * name every bloom before it played, which defeats the entire point of an
   * anonymous vote. Randomising here decouples the two.
   */
  private nextSlot(round: number): number {
    const used = new Set(this.slotsForRound(round));
    const free: number[] = [];
    for (let slot = 0; slot < MAX_PLAYERS; slot++) {
      if (!used.has(slot)) free.push(slot);
    }
    if (free.length === 0) return used.size;
    return free[Math.floor(Math.random() * free.length)] ?? free[0]!;
  }

  private ownsSlot(round: number, playerId: string, slot: number): boolean {
    return this.ctx.storage.sql
      .exec<{ n: number }>(
        "SELECT COUNT(*) AS n FROM submissions WHERE round = ? AND player_id = ? AND slot = ?",
        round, playerId, slot,
      )
      .toArray()[0]?.n === 1;
  }

  private specForSlot(round: number, slot: number): BloomSpec | null {
    const row = this.ctx.storage.sql
      .exec<{ spec: string }>("SELECT spec FROM submissions WHERE round = ? AND slot = ?", round, slot)
      .toArray()[0];
    if (!row) return null;
    try {
      return normalizeSpec(JSON.parse(row.spec));
    } catch {
      return null;
    }
  }

  private votesForRound(round: number, kind: "vote" | "heat"): RoundVote[] {
    return this.ctx.storage.sql
      .exec<VoteRow>("SELECT voter_id, target_slot, kind FROM votes WHERE round = ? AND kind = ?", round, kind)
      .toArray()
      .map((row) => ({ voterId: row.voter_id, slot: row.target_slot }));
  }

  private voteCount(round: number, playerId: string, kind: "vote" | "heat"): number {
    return this.ctx.storage.sql
      .exec<{ n: number }>(
        "SELECT COUNT(*) AS n FROM votes WHERE round = ? AND voter_id = ? AND kind = ?",
        round, playerId, kind,
      )
      .toArray()[0]?.n ?? 0;
  }

  private talliesForRound(round: number) {
    const submissions = this.submissionsForRound(round).map((row) => ({
      playerId: row.player_id,
      slot: row.slot,
      submittedAt: row.submitted_at,
    }));
    return tallyRound(submissions, [], this.votesForRound(round, "heat")).tallies;
  }

  // ---------- socket helpers --------------------------------------------

  private liveSockets(exclude?: WebSocket): WebSocket[] {
    return this.ctx.getWebSockets().filter((socket) => socket !== exclude && socket.readyState === WebSocket.OPEN);
  }

  private livePlayerIds(exclude?: WebSocket): string[] {
    const ids = new Set<string>();
    for (const socket of this.liveSockets(exclude)) {
      const attachment: unknown = socket.deserializeAttachment();
      if (isSocketAttachment(attachment) && attachment.role === "player") ids.add(attachment.playerId);
    }
    return Array.from(ids);
  }

  private livePlayerCount(): number {
    return this.livePlayerIds().length;
  }

  private countRole(role: Role): number {
    return this.liveSockets().filter((socket) => {
      const attachment: unknown = socket.deserializeAttachment();
      return isSocketAttachment(attachment) && attachment.role === role;
    }).length;
  }

  private roomFromSocket(socket: WebSocket): string {
    const tag = this.ctx.getTags(socket).find((value) => value.startsWith("room:"));
    return normalizeRoom(tag?.slice(5) ?? null) ?? "------";
  }

  private broadcast(payload: unknown, exclude?: WebSocket): void {
    const encoded = JSON.stringify(payload);
    for (const socket of this.liveSockets(exclude)) {
      try {
        socket.send(encoded);
      } catch {
        // The runtime delivers close/error and reaps the dead socket.
      }
    }
  }

  private send(socket: WebSocket, payload: unknown): void {
    if (socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(JSON.stringify(payload));
    } catch {
      // A close event performs the roster update.
    }
  }

  /**
   * A Durable Object has exactly one alarm slot, and this room wants it for
   * two different things: the current phase deadline, and a far-out sweep that
   * reaps an abandoned room's storage. The phase deadline always wins.
   *
   * This is the only place that arms an alarm. Calling `setAlarm` directly
   * from a join handler is how a reconnecting phone used to silently push the
   * running phase's deadline 45 minutes into the future — which happened
   * constantly, because phones lock.
   */
  private armAlarm(): void {
    const endsAt = Number(this.meta("phase_ends_at") ?? "0");
    void this.ctx.storage.setAlarm(endsAt > 0 ? endsAt : Date.now() + IDLE_SHUTDOWN_MS);
  }

  private sweepIdle(now: number): void {
    if (this.liveSockets().length > 0) {
      this.armAlarm();
      return;
    }
    const lastSeen = this.ctx.storage.sql
      .exec<{ t: number }>("SELECT MAX(last_seen) AS t FROM players")
      .toArray()[0]?.t ?? 0;
    if (now - lastSeen < IDLE_SHUTDOWN_MS) {
      this.armAlarm();
      return;
    }
    void this.ctx.storage.deleteAll();
  }

  private stats(room: string): Record<string, unknown> {
    return {
      ok: true,
      service: "pointcast-bloom-party",
      room,
      phase: this.phase(),
      round: this.round(),
      rounds: ROUNDS_PER_GAME,
      players: this.playerCount(),
      connected: this.livePlayerCount(),
      stages: this.countRole("stage"),
      maxPlayers: MAX_PLAYERS,
      capacity: MAX_CONNECTIONS,
      phaseEndsAt: Number(this.meta("phase_ends_at") ?? "0"),
      standings: this.ctx.storage.sql
        .exec<PlayerRow>("SELECT * FROM players ORDER BY score DESC, joined_at ASC")
        .toArray()
        .map((row) => ({ name: row.name, emoji: row.emoji, score: row.score })),
      protocolVersion: 1,
      hibernation: true,
      serverAt: Date.now(),
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const room = normalizeRoom(url.searchParams.get("room"));
    if (!room) return json({ error: "bad-room-code" }, { status: 400 });
    const stub = env.BLOOM_ROOM.getByName(room);
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
