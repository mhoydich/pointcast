/**
 * In-isolate realtime fallback for Cloudflare Pages Functions.
 *
 * Durable Objects are the preferred transport, but when the account's free
 * DO duration is exhausted the public /api/* WebSocket URLs still need to be
 * useful. This module keeps a best-effort live room inside the active Pages
 * Worker isolate. It is intentionally simple: fanout works for visitors who
 * land on the same isolate, while HTTP snapshots degrade gracefully.
 */

interface PresenceSession {
  sessionId: string;
  nounId: number;
  kind: 'human' | 'agent' | 'wallet';
  joinedAt: string;
  lastSeen: number;
  tag?: string;
}

interface PeerView {
  sessionId: string;
  nounId: number;
  kind: string;
  tag?: string;
  x: number;
  y: number;
  at: number;
}

interface ChatEntry {
  who: string;
  nounId: number;
  msg: string;
  at: number;
  sid: string;
}

interface PresenceRoomState {
  sockets: Map<WebSocket, string>;
  sessions: Map<string, PresenceSession>;
  peers: Map<string, PeerView>;
  chat: ChatEntry[];
}

interface DrumEvent {
  type: string;
  cellKey?: string;
  seatKey?: string;
  inst?: string;
  voice?: string;
  cat?: string;
  family?: string;
  pitch?: number;
  decay?: number;
  seed?: number;
  auto?: boolean;
  sessionId?: string;
  pid?: string;
  t: number;
}

interface RoomKvEvent {
  id: string;
  type: 'join' | 'leave' | 'cursor' | 'chat';
  sid: string;
  at: number;
  session?: PresenceSession;
  peer?: PeerView;
  chat?: ChatEntry;
}

interface RealtimeGlobals {
  __pcFallbackRooms?: Map<string, PresenceRoomState>;
  __pcFallbackRoomWrites?: Map<string, Promise<void>>;
  __pcFallbackDrumSockets?: Set<WebSocket>;
  __pcFallbackDrumRing?: DrumEvent[];
}

const ROOM_TTL_MS = 90_000;
const PEER_TTL_MS = 20_000;
const MAX_CHAT = 20;
const MAX_DRUM_RING = 50;
const KV_TTL_SECONDS = 120;
const KV_ROOM_EVENTS = 120;
const KV_DRUM_EVENTS = 80;
const KV_POLL_MS = 550;
const KV_ROOM_PREFIX = 'pc:rt:room:';
const KV_DRUM_KEY = 'pc:rt:drum:ring';

const globals = globalThis as typeof globalThis & RealtimeGlobals;
const rooms = globals.__pcFallbackRooms ??= new Map<string, PresenceRoomState>();
const roomWrites = globals.__pcFallbackRoomWrites ??= new Map<string, Promise<void>>();
const drumSockets = globals.__pcFallbackDrumSockets ??= new Set<WebSocket>();
const drumRing = globals.__pcFallbackDrumRing ??= [];

export function acceptPresenceWebSocketFallback(
  request: Request,
  roomKey: string,
  defaultKind: 'human' | 'agent' | 'wallet' = 'human',
  kv?: KVNamespace,
): Response {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sid') || crypto.randomUUID();
  const kind = normalizeKind(url.searchParams.get('kind') || defaultKind);
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
  const room = getRoom(roomKey);
  const now = Date.now();

  server.accept();
  room.sockets.set(server, sessionId);
  const session: PresenceSession = {
    sessionId,
    nounId: deriveNounId(sessionId),
    kind,
    joinedAt: new Date(now).toISOString(),
    lastSeen: now,
  };
  room.sessions.set(sessionId, session);

  let lastKvAt = now;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  if (kv) {
    queueRoomKvEvent(kv, roomKey, {
      id: eventId(sessionId, 'join'),
      type: 'join',
      sid: sessionId,
      at: now,
      session,
    });
    pollTimer = setInterval(() => {
      void syncRoomFromKv(kv, roomKey, room, sessionId, lastKvAt).then((nextKvAt) => {
        if (nextKvAt > lastKvAt) {
          lastKvAt = nextKvAt;
          broadcastPresence(room);
        }
      });
    }, KV_POLL_MS);
  }

  server.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return;
    touch(room, sessionId);
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(event.data) as Record<string, unknown>;
    } catch {
      return;
    }
    const kvEvent = handlePresenceMessage(room, sessionId, msg);
    if (kv && kvEvent) queueRoomKvEvent(kv, roomKey, kvEvent);
    broadcastPresence(room);
  });

  const cleanup = () => {
    if (pollTimer) clearInterval(pollTimer);
    if (kv) {
      queueRoomKvEvent(kv, roomKey, {
        id: eventId(sessionId, 'leave'),
        type: 'leave',
        sid: sessionId,
        at: Date.now(),
      });
    }
    room.sockets.delete(server);
    prune(room, true);
    broadcastPresence(room);
  };
  server.addEventListener('close', cleanup);
  server.addEventListener('error', cleanup);

  broadcastPresence(room);
  return new Response(null, { status: 101, webSocket: client });
}

export function presenceSnapshotFallback(roomKey: string, viewerSid?: string): Record<string, unknown> {
  const room = getRoom(roomKey);
  prune(room, false);
  return snapshot(room, viewerSid);
}

export function acceptDrumWebSocketFallback(request: Request, kv?: KVNamespace): Response {
  const url = new URL(request.url);
  const ownSessionId = url.searchParams.get('sid') || '';
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
  server.accept();
  drumSockets.add(server);

  for (const ev of drumRing.slice(-10)) {
    try { server.send(JSON.stringify(ev)); } catch {}
  }

  server.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(event.data) as Record<string, unknown>;
    } catch {
      return;
    }

    const ev = {
      ...raw,
      sessionId: String(raw.sessionId || ownSessionId || ''),
      t: Date.now(),
    } as DrumEvent;

    Promise.resolve(pidFor(String(raw.sessionId || ''))).then((pid) => {
      if (pid && !ev.pid) ev.pid = pid;
      if (kv) void appendDrumKvEvent(kv, ev);
      else commitDrum(ev, server);
    });
  });

  let lastDrumKvAt = Date.now();
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  if (kv) {
    pollTimer = setInterval(() => {
      void syncDrumFromKv(kv, server, ownSessionId, lastDrumKvAt).then((nextKvAt) => {
        if (nextKvAt > lastDrumKvAt) lastDrumKvAt = nextKvAt;
      });
    }, KV_POLL_MS);
  }

  const cleanup = () => {
    if (pollTimer) clearInterval(pollTimer);
    drumSockets.delete(server);
  };
  server.addEventListener('close', cleanup);
  server.addEventListener('error', cleanup);

  return new Response(null, { status: 101, webSocket: client });
}

function getRoom(roomKey: string): PresenceRoomState {
  let room = rooms.get(roomKey);
  if (!room) {
    room = {
      sockets: new Map(),
      sessions: new Map(),
      peers: new Map(),
      chat: [],
    };
    rooms.set(roomKey, room);
  }
  return room;
}

function handlePresenceMessage(room: PresenceRoomState, sessionId: string, msg: Record<string, unknown>): RoomKvEvent | null {
  const session = room.sessions.get(sessionId);
  if (!session) return null;

  if (typeof msg.nounId === 'number' && Number.isFinite(msg.nounId)) {
    session.nounId = Math.max(0, Math.floor(msg.nounId));
  }
  if (typeof msg.tag === 'string') {
    session.tag = msg.tag.slice(0, 40);
  }

  if (msg.type === 'cursor') {
    const x = clampCoord(msg.x);
    const y = clampCoord(msg.y);
    const peer = {
      sessionId,
      nounId: session.nounId,
      kind: session.kind,
      tag: session.tag,
      x,
      y,
      at: Date.now(),
    };
    room.peers.set(sessionId, peer);
    return {
      id: eventId(sessionId, 'cursor'),
      type: 'cursor',
      sid: sessionId,
      at: peer.at,
      peer,
    };
  }

  if (msg.type === 'chat' && typeof msg.msg === 'string') {
    const text = msg.msg.trim().slice(0, 120);
    if (!text) return null;
    const entry = {
      who: session.tag || 'visitor',
      nounId: session.nounId,
      msg: text,
      at: Date.now(),
      sid: sessionId.slice(0, 8),
    };
    room.chat.push(entry);
    if (room.chat.length > MAX_CHAT) room.chat.splice(0, room.chat.length - MAX_CHAT);
    return {
      id: eventId(sessionId, 'chat'),
      type: 'chat',
      sid: sessionId,
      at: entry.at,
      chat: entry,
    };
  }
  return null;
}

function broadcastPresence(room: PresenceRoomState) {
  prune(room, false);
  const dead: WebSocket[] = [];
  for (const [socket, sid] of room.sockets.entries()) {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(snapshot(room, sid)));
      } else {
        dead.push(socket);
      }
    } catch {
      dead.push(socket);
    }
  }
  for (const socket of dead) room.sockets.delete(socket);
}

function snapshot(room: PresenceRoomState, viewerSid?: string): Record<string, unknown> {
  const now = Date.now();
  const sessions = Array.from(room.sessions.values()).map((session) => ({
    nounId: session.nounId,
    kind: session.kind,
    joinedAt: session.joinedAt,
    tag: session.tag,
  }));
  const peers = Array.from(room.peers.values())
    .filter((peer) => peer.sessionId !== viewerSid && now - peer.at < PEER_TTL_MS)
    .slice(0, 30);
  const humans = sessions.filter((session) => session.kind !== 'agent').length;
  const agents = sessions.filter((session) => session.kind === 'agent').length;
  return {
    humans,
    agents,
    sessions,
    peers,
    chat: room.chat.slice(-MAX_CHAT),
    you: viewerSid ? room.sessions.get(viewerSid) : undefined,
    source: 'pages-isolate-fallback',
  };
}

function prune(room: PresenceRoomState, removeDisconnected: boolean) {
  const now = Date.now();
  const activeSids = new Set(room.sockets.values());
  for (const [sid, session] of room.sessions.entries()) {
    if (removeDisconnected && !activeSids.has(sid)) {
      room.sessions.delete(sid);
      room.peers.delete(sid);
      continue;
    }
    if (now - session.lastSeen > ROOM_TTL_MS) {
      room.sessions.delete(sid);
      room.peers.delete(sid);
    }
  }
  for (const [sid, peer] of room.peers.entries()) {
    if (now - peer.at > PEER_TTL_MS) room.peers.delete(sid);
  }
}

function touch(room: PresenceRoomState, sessionId: string) {
  const session = room.sessions.get(sessionId);
  if (session) session.lastSeen = Date.now();
}

function commitDrum(ev: DrumEvent, sender: WebSocket) {
  drumRing.push(ev);
  if (drumRing.length > MAX_DRUM_RING) drumRing.splice(0, drumRing.length - MAX_DRUM_RING);
  const payload = JSON.stringify(ev);
  const dead: WebSocket[] = [];
  for (const socket of drumSockets) {
    if (socket === sender) continue;
    try {
      if (socket.readyState === WebSocket.OPEN) socket.send(payload);
      else dead.push(socket);
    } catch {
      dead.push(socket);
    }
  }
  for (const socket of dead) drumSockets.delete(socket);
}

async function syncRoomFromKv(
  kv: KVNamespace,
  roomKey: string,
  room: PresenceRoomState,
  ownSid: string,
  since: number,
): Promise<number> {
  const events = await loadRoomKvEvents(kv, roomKey);
  let next = since;
  for (const event of events) {
    if (!event || event.at <= since) continue;
    next = Math.max(next, event.at);
    if (event.sid === ownSid) continue;
    applyRoomKvEvent(room, event);
  }
  return next;
}

function applyRoomKvEvent(room: PresenceRoomState, event: RoomKvEvent) {
  if (event.type === 'join' && event.session) {
    room.sessions.set(event.sid, { ...event.session, lastSeen: Date.now() });
    return;
  }
  if (event.type === 'leave') {
    room.sessions.delete(event.sid);
    room.peers.delete(event.sid);
    return;
  }
  if (event.type === 'cursor' && event.peer) {
    room.peers.set(event.sid, event.peer);
    if (!room.sessions.has(event.sid)) {
      room.sessions.set(event.sid, {
        sessionId: event.sid,
        nounId: event.peer.nounId,
        kind: normalizeKind(event.peer.kind),
        tag: event.peer.tag,
        joinedAt: new Date(event.at).toISOString(),
        lastSeen: event.at,
      });
    }
    return;
  }
  if (event.type === 'chat' && event.chat) {
    const exists = room.chat.some((entry) =>
      entry.at === event.chat!.at && entry.sid === event.chat!.sid && entry.msg === event.chat!.msg);
    if (!exists) {
      room.chat.push(event.chat);
      if (room.chat.length > MAX_CHAT) room.chat.splice(0, room.chat.length - MAX_CHAT);
    }
  }
}

async function appendRoomKvEvent(kv: KVNamespace, roomKey: string, event: RoomKvEvent) {
  const key = roomKvKey(roomKey);
  const now = Date.now();
  const events = (await loadRoomKvEvents(kv, roomKey))
    .filter((item) => now - item.at < ROOM_TTL_MS)
    .slice(-(KV_ROOM_EVENTS - 1));
  events.push(event);
  await kv.put(key, JSON.stringify(events), { expirationTtl: KV_TTL_SECONDS });
}

function queueRoomKvEvent(kv: KVNamespace, roomKey: string, event: RoomKvEvent) {
  const key = roomKvKey(roomKey);
  const previous = roomWrites.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => appendRoomKvEvent(kv, roomKey, event))
    .catch((err) => {
      console.error('[realtime-fallback] room KV write failed:', err);
    });
  roomWrites.set(key, next);
}

async function loadRoomKvEvents(kv: KVNamespace, roomKey: string): Promise<RoomKvEvent[]> {
  const raw = await kv.get(roomKvKey(roomKey));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendDrumKvEvent(kv: KVNamespace, event: DrumEvent) {
  const now = Date.now();
  const events = (await loadDrumKvEvents(kv))
    .filter((item) => now - item.t < ROOM_TTL_MS)
    .slice(-(KV_DRUM_EVENTS - 1));
  events.push(event);
  await kv.put(KV_DRUM_KEY, JSON.stringify(events), { expirationTtl: KV_TTL_SECONDS });
}

async function loadDrumKvEvents(kv: KVNamespace): Promise<DrumEvent[]> {
  const raw = await kv.get(KV_DRUM_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function syncDrumFromKv(
  kv: KVNamespace,
  socket: WebSocket,
  ownSessionId: string,
  since: number,
): Promise<number> {
  const events = await loadDrumKvEvents(kv);
  let next = since;
  for (const event of events) {
    if (!event || event.t <= since) continue;
    next = Math.max(next, event.t);
    if (ownSessionId && event.sessionId === ownSessionId) continue;
    try {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
    } catch {
      break;
    }
  }
  return next;
}

function roomKvKey(roomKey: string): string {
  return KV_ROOM_PREFIX + keyHash(roomKey);
}

function eventId(sessionId: string, type: string): string {
  return `${Date.now()}:${sessionId.slice(0, 24)}:${type}:${Math.random().toString(36).slice(2, 8)}`;
}

function keyHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeKind(raw: string): 'human' | 'agent' | 'wallet' {
  if (raw === 'agent' || raw === 'wallet') return raw;
  return 'human';
}

function deriveNounId(sessionId: string): number {
  let hash = 5381;
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) + hash + sessionId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 1200;
}

function clampCoord(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(10_000, Math.round(n)));
}

async function pidFor(sessionId: string): Promise<string> {
  if (!sessionId) return 'anon';
  const buf = new TextEncoder().encode(sessionId);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 10);
}
