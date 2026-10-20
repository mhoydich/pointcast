import { DurableObject } from "cloudflare:workers";
import { decodeClientMessage } from "./index";
import { bytesToHex, hexToBytes, importAttestor, joinDigest, parseClaim, playerForKey, requestDigest, roomDigest, type Attestor, type SessionClaim } from "./attest";

const ROOM_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const MAX_BODY_BYTES = 16384;
const MAX_AGE_MS = 300_000;
const HISTORY_MS = 600_000;
const AUTH_TTL_MS = 1_800_000;
const MIN_DURATION = 10;
const MAX_DURATION = 300;
const MAX_SOCKETS = 64;
const te = new TextEncoder();

interface Attachment {
  room: string;
  challenge: string;
  challengeUntil: number;
  player?: string;
  authUntil?: number;
  rateSecond: number;
  rateCount: number;
  lastSeq: number;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
}

function allowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Native clients still have to prove their own key.
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && (url.hostname === "pointcast.xyz" || url.hostname.endsWith(".pointcast.pages.dev"))
      || ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch { return false; }
}

async function boundedJson(request: Request): Promise<unknown> {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) throw new Error("json-required");
  if (!request.body) throw new Error("body-required");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("body-too-large"); }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
}

/** Separate namespace: anonymous legacy room visitors never become chain evidence. */
export class DrumAttestRoom extends DurableObject<Env> {
  private attestor?: Promise<Attestor>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS evidence (player TEXT NOT NULL, second INTEGER NOT NULL, at_ms INTEGER NOT NULL, PRIMARY KEY(player, second));
        CREATE INDEX IF NOT EXISTS evidence_time ON evidence(at_ms);
        CREATE TABLE IF NOT EXISTS receipts (digest TEXT PRIMARY KEY, sender TEXT NOT NULL, nonce TEXT NOT NULL, response TEXT NOT NULL, at_ms INTEGER NOT NULL, UNIQUE(sender, nonce));
        CREATE TABLE IF NOT EXISTS consumed (player TEXT NOT NULL, start_ms INTEGER NOT NULL, end_ms INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS consumed_player ON consumed(player, end_ms);
        CREATE TABLE IF NOT EXISTS rate (bucket TEXT PRIMARY KEY, minute INTEGER NOT NULL, count INTEGER NOT NULL);
      `);
    });
  }

  private configured(room: string): boolean {
    return !!this.env.DRUM_ATTESTOR_SK
      && /^[A-Za-z0-9._-]{1,64}$/.test(this.env.DRUM_ATTEST_CHAIN_ID)
      && /^[a-f0-9]{64}$/.test(this.env.DRUM_ATTEST_GENESIS)
      && ROOM_RE.test(room)
      && this.env.DRUM_ATTEST_ROOMS.split(",").includes(room);
  }

  private signer(): Promise<Attestor> {
    return this.attestor ??= importAttestor(this.env.DRUM_ATTESTOR_SK || "");
  }

  private limit(bucket: string, maximum: number, now = Date.now()): boolean {
    const minute = Math.floor(now / 60_000);
    if (!this.ctx.storage.sql.exec("SELECT 1 FROM rate WHERE bucket = ?", bucket).toArray().length
      && this.ctx.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM rate").one().n >= 2048) return false;
    const row = this.ctx.storage.sql.exec<{ count: number }>(`
      INSERT INTO rate(bucket, minute, count) VALUES(?, ?, 1)
      ON CONFLICT(bucket) DO UPDATE SET count = CASE WHEN minute = excluded.minute THEN count + 1 ELSE 1 END, minute = excluded.minute
      RETURNING count`, bucket, minute).one();
    return row.count <= maximum;
  }

  private prune(now: number): void {
    this.ctx.storage.sql.exec("DELETE FROM rate WHERE minute < ?", Math.floor((now - HISTORY_MS) / 60000));
    this.ctx.storage.sql.exec("DELETE FROM evidence WHERE at_ms < ?", now - HISTORY_MS);
    this.ctx.storage.sql.exec("DELETE FROM consumed WHERE end_ms < ?", now - HISTORY_MS);
    this.ctx.storage.sql.exec("DELETE FROM receipts WHERE at_ms < ?", now - HISTORY_MS);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const room = url.searchParams.get("room") || "";
    if (!this.configured(room)) return json({ error: "attestor-not-configured" }, 503);
    if (!allowedOrigin(request.headers.get("Origin"))) return json({ error: "origin-not-allowed" }, 403);
    this.prune(Date.now());
    // CF-Connecting-IP is supplied by Cloudflare on public Worker/Pages ingress.
    // Missing trusted ingress identity shares one conservative native-client bucket.
    const client = request.headers.get("CF-Connecting-IP") || "native";
    const ingress = /^[a-fA-F0-9:.]{1,64}$/.test(client) ? client : "native";
    if (!this.limit(`ingress:${ingress}`, 30)) return json({ error: "ingress-rate-limit" }, 429);
    const signer = await this.signer().catch(() => undefined);
    if (!signer) return json({ error: "attestor-not-configured" }, 503);
    if (url.pathname === "/api/drum/attest") {
      if (request.method === "GET") return json({
        attestor: signer.publicKeyHex, room, chain_id: this.env.DRUM_ATTEST_CHAIN_ID,
        genesis: this.env.DRUM_ATTEST_GENESIS, protocol: "drum-join/v1", identities: ["direct-tz1-ed25519"],
        min_duration: MIN_DURATION, max_duration: MAX_DURATION, max_age_ms: MAX_AGE_MS,
      });
      if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
      let claim: SessionClaim;
      let input: unknown;
      try { input = await boundedJson(request); claim = parseClaim(input); }
      catch (error) { return json({ error: error instanceof Error ? error.message : "bad-claim" }, 400); }
      if (claim.room !== room || claim.chain_id !== this.env.DRUM_ATTEST_CHAIN_ID || claim.genesis !== this.env.DRUM_ATTEST_GENESIS) return json({ error: "wrong-domain" }, 403);
      if (claim.players.length > MAX_SOCKETS || !claim.players.includes(claim.sender) || claim.players.some(player => !/^tz1[1-9A-HJ-NP-Za-km-z]{33}$/.test(player))) return json({ error: "unsupported-players" }, 403);
      const now = Date.now();
      const end = Number(claim.ended_at_ms);
      const start = end - claim.duration * 1000;
      if (!Number.isSafeInteger(end) || start < 0 || end > now || end < now - MAX_AGE_MS || claim.duration < MIN_DURATION || claim.duration > MAX_DURATION) return json({ error: "session-out-of-window" }, 403);
      // Authorize the exact claim before producing a room signature or consuming evidence.
      // Knowing a public player's observed time and nonce must not let a bystander reserve it.
      try {
        const proof = input as Record<string, unknown>;
        if (typeof proof.public_key !== "string" || typeof proof.request_signature !== "string") throw new Error();
        const publicKey = hexToBytes(proof.public_key, 32);
        if (playerForKey(publicKey) !== claim.sender) throw new Error();
        const key = await crypto.subtle.importKey("raw", publicKey, "Ed25519", false, ["verify"]);
        const digest = requestDigest(claim);
        if (!await crypto.subtle.verify("Ed25519", key, hexToBytes(proof.request_signature, 64), digest)) throw new Error();
        const others = claim.players.filter(player => player !== claim.sender);
        const approvals = proof.player_proofs === undefined ? [] : proof.player_proofs;
        if (!Array.isArray(approvals) || approvals.length !== others.length) throw new Error();
        for (const [index, approval] of approvals.entries()) {
          if (!approval || typeof approval !== "object" || Array.isArray(approval)) throw new Error();
          const consent = approval as Record<string, unknown>;
          if (typeof consent.public_key !== "string" || typeof consent.request_signature !== "string") throw new Error();
          const playerKey = hexToBytes(consent.public_key, 32);
          if (playerForKey(playerKey) !== others[index]) throw new Error();
          const verifier = await crypto.subtle.importKey("raw", playerKey, "Ed25519", false, ["verify"]);
          if (!await crypto.subtle.verify("Ed25519", verifier, hexToBytes(consent.request_signature, 64), digest)) throw new Error();
        }
      } catch { return json({ error: "bad-request-proof" }, 403); }
      if (!this.limit("signing", 120)) return json({ error: "signing-rate-limit" }, 429);
      const digest = bytesToHex(roomDigest(claim));
      const signature = bytesToHex(await signer.sign(hexToBytes(digest, 32)));
      // Re-check and reserve after the crypto await. No await inside the atomic decision.
      return this.ctx.storage.transactionSync(() => {
        this.prune(Date.now());
        if (end < Date.now() - MAX_AGE_MS) return json({ error: "session-out-of-window" }, 403);
        const existing = this.ctx.storage.sql.exec<{ digest: string; response: string }>("SELECT digest, response FROM receipts WHERE sender = ? AND nonce = ?", claim.sender, claim.nonce.toString()).toArray()[0];
        if (existing) return existing.digest === digest ? json(JSON.parse(existing.response)) : json({ error: "nonce-already-attested" }, 409);
        for (const player of claim.players) {
          const used = this.ctx.storage.sql.exec("SELECT 1 FROM consumed WHERE player = ? AND start_ms < ? AND end_ms > ? LIMIT 1", player, end, start).toArray();
          if (used.length) return json({ error: "session-already-consumed" }, 409);
          const hit = this.ctx.storage.sql.exec<{ n: number; first: number | null; last: number | null }>("SELECT COUNT(*) AS n, MIN(at_ms) AS first, MAX(at_ms) AS last FROM evidence WHERE player = ? AND at_ms >= ? AND at_ms <= ?", player, start, end).one();
          if (hit.n < 2 || hit.first === null || hit.last === null || hit.last - hit.first < claim.duration * 1000 - 1000) return json({ error: "insufficient-room-evidence" }, 403);
        }
        const response = { attestor: signer.publicKeyHex, signature, room_digest: digest };
        this.ctx.storage.sql.exec("INSERT INTO receipts VALUES (?, ?, ?, ?, ?)", digest, claim.sender, claim.nonce.toString(), JSON.stringify(response), now);
        for (const player of claim.players) this.ctx.storage.sql.exec("INSERT INTO consumed VALUES (?, ?, ?)", player, start, end);
        return json(response);
      });
    }
    if (url.pathname !== "/api/drum/chain-room" || request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return json({ error: "method-not-allowed" }, 405);
    if (!this.limit("upgrades", 120)) return json({ error: "upgrade-rate-limit" }, 429);
    if (this.ctx.getWebSockets().length >= MAX_SOCKETS) return json({ error: "room-full" }, 503);
    const now = Date.now();
    if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(now + 60_000);
    const challenge = crypto.randomUUID();
    const pair = new WebSocketPair();
    const state: Attachment = { room, challenge, challengeUntil: now + 60_000, rateSecond: 0, rateCount: 0, lastSeq: -1 };
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment(state);
    pair[1].send(JSON.stringify({ v: 1, type: "challenge", room, chain_id: this.env.DRUM_ATTEST_CHAIN_ID, genesis: this.env.DRUM_ATTEST_GENESIS, challenge, digest: bytesToHex(joinDigest(this.env.DRUM_ATTEST_CHAIN_ID, this.env.DRUM_ATTEST_GENESIS, room, challenge)), expires_at_ms: state.challengeUntil }));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(socket: WebSocket, frame: string | ArrayBuffer): Promise<void> {
    const state = socket.deserializeAttachment() as Attachment;
    const now = Date.now();
    if (!this.configured(state.room) || typeof frame !== "string" || frame.length > 512 || te.encode(frame).length > 512) { socket.close(1008, "invalid-frame"); return; }
    const second = Math.floor(now / 1000);
    state.rateCount = state.rateSecond === second ? state.rateCount + 1 : 1;
    state.rateSecond = second;
    socket.serializeAttachment(state);
    if (state.rateCount > 8) { socket.close(1008, "rate-limit"); return; }
    if (!state.player) {
      if (!state.challenge || now > state.challengeUntil || !this.limit("auth", 120)) { socket.close(1008, "auth-expired"); return; }
      // Consume before awaiting verification; concurrent messages cannot re-use it.
      const challenge = state.challenge;
      const deadline = state.challengeUntil;
      state.challenge = "";
      socket.serializeAttachment(state);
      try {
        const body: unknown = JSON.parse(frame);
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
        const auth = body as Record<string, unknown>;
        if (auth.v !== 1 || auth.type !== "auth" || typeof auth.public_key !== "string" || typeof auth.signature !== "string") throw new Error();
        const publicKey = hexToBytes(auth.public_key, 32);
        const signature = hexToBytes(auth.signature, 64);
        const key = await crypto.subtle.importKey("raw", publicKey, "Ed25519", false, ["verify"]);
        if (!await crypto.subtle.verify("Ed25519", key, signature, joinDigest(this.env.DRUM_ATTEST_CHAIN_ID, this.env.DRUM_ATTEST_GENESIS, state.room, challenge))) throw new Error();
        if (Date.now() > deadline || socket.readyState !== WebSocket.OPEN) throw new Error();
        state.player = playerForKey(publicKey);
        state.authUntil = now + AUTH_TTL_MS;
        socket.serializeAttachment(state);
        socket.send(JSON.stringify({ v: 1, type: "authenticated", player: state.player, expires_at_ms: state.authUntil }));
      } catch { socket.close(1008, "bad-auth"); }
      return;
    }
    if (now > (state.authUntil || 0)) { socket.close(1008, "auth-expired"); return; }
    const hit = decodeClientMessage(frame);
    if (!hit || hit.type !== "hit" || hit.seq <= state.lastSeq) { socket.close(1008, "invalid-hit"); return; }
    state.lastSeq = hit.seq;
    socket.serializeAttachment(state);
    if (!this.limit(`player:${state.player}`, 480, now) || !this.limit("hits", 18000, now)) {
      socket.send(JSON.stringify({ v: 1, type: "rate-limit", retryAfterMs: 60000 }));
      return;
    }
    this.prune(now);
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO evidence VALUES (?, ?, ?)", state.player, second, now);
    const event = JSON.stringify({ v: 1, type: "hit", player: state.player, pad: hit.pad, velocity: hit.velocity, seq: hit.seq, serverAt: now });
    for (const peer of this.ctx.getWebSockets()) {
      const attachment = peer.deserializeAttachment() as Attachment;
      if (attachment.player && peer.readyState === WebSocket.OPEN) peer.send(event);
    }
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    this.prune(now);
    let active = false;
    for (const socket of this.ctx.getWebSockets()) {
      const state = socket.deserializeAttachment() as Attachment;
      if (now >= (state.authUntil || state.challengeUntil)) socket.close(1008, "auth-expired");
      else active = true;
    }
    const retained = this.ctx.storage.sql.exec<{ n: number }>("SELECT (SELECT COUNT(*) FROM evidence) + (SELECT COUNT(*) FROM receipts) AS n").one().n;
    if (active || retained) await this.ctx.storage.setAlarm(now + 60_000);
  }

  webSocketClose(): void {}
  webSocketError(socket: WebSocket): void { socket.close(1011, "socket-error"); }
}
