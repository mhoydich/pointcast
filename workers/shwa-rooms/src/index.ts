import { DurableObject } from 'cloudflare:workers';
import type { SharedRoom, SharedPiece, ResourceRoute } from '../../../src/components/shwa/lib/shared-room';
interface Env { ROOMS: DurableObjectNamespace<ShwaRoom>; CREATION_LIMIT: RateLimit; JOIN_LIMIT: RateLimit }
type Attachment = { id?: string; seen: number; window: number; count: number };
const TOKEN = /^[a-f0-9]{64}$/;
const routes: ResourceRoute[] = ['house', 'own', 'x402'];
const DAY = 24 * 60 * 60 * 1000;
const GRACE = 90_000;
const allowed = new Set(['https://pointcast.xyz', 'https://www.pointcast.xyz', 'http://127.0.0.1:5173', 'http://localhost:5173']);
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const clean = (value: unknown, max: number) => typeof value === 'string' && value.length <= max ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim() : '';
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url), origin = request.headers.get('Origin') || '';
    const headers = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Cache-Control': 'no-store', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
    if (url.pathname === '/status' && request.method === 'GET') return Response.json({ available: true, seats: 5, retentionHours: 24, aiBilling: false }, { headers: { 'Cache-Control': 'no-store' } });
    if (!allowed.has(origin)) return new Response('Origin not allowed', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (url.pathname === '/rooms' && request.method === 'POST') {
      const limited = await env.CREATION_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'local' });
      if (!limited.success) return Response.json({ error: 'Please wait a minute before creating another room.' }, { status: 429, headers });
      const room = hex(crypto.getRandomValues(new Uint8Array(32)));
      const expiresAt = await env.ROOMS.getByName(room).initialize();
      return Response.json({ room, expiresAt }, { status: 201, headers });
    }
    const token = url.pathname.match(/^\/rooms\/([a-f0-9]{64})$/)?.[1];
    if (token && request.method === 'GET' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const limited = await env.JOIN_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'local' });
      if (!limited.success) return new Response('Too many joins. Please wait a minute.', { status: 429, headers });
      return env.ROOMS.getByName(token).fetch(request);
    }
    return new Response('Not found', { status: 404, headers });
  },
} satisfies ExportedHandler<Env>;

export class ShwaRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS departures (id TEXT PRIMARY KEY, at INTEGER NOT NULL)');
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  read(): SharedRoom | null {
    const row = this.ctx.storage.sql.exec<{ data: string }>('SELECT data FROM room WHERE id=1').toArray()[0];
    return row ? JSON.parse(row.data) : null;
  }
  save(room: SharedRoom) { room.revision++; this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,data) VALUES (1,?)', JSON.stringify(room)); }
  async initialize(): Promise<number> {
    const existing = this.read(); if (existing) return existing.expiresAt;
    const room: SharedRoom = { revision: 0, expiresAt: Date.now() + DAY, members: [], pieces: [] };
    this.save(room); await this.ctx.storage.setAlarm(room.expiresAt); return room.expiresAt;
  }
  sockets() { return this.ctx.getWebSockets().filter(ws => ws.readyState === WebSocket.OPEN); }
  attachment(ws: WebSocket): Attachment { return ws.deserializeAttachment() as Attachment; }
  send(ws: WebSocket, value: unknown) { try { ws.send(JSON.stringify(value)); } catch { /* A disconnected client will rejoin from the saved snapshot. */ } }
  error(ws: WebSocket, message: string, code?: number) { this.send(ws, { type: 'error', message }); if (code) ws.close(code, message); }
  broadcast(room: SharedRoom) {
    const online = new Set(this.sockets().map(ws => this.attachment(ws).id).filter(Boolean));
    const state = { ...room, members: room.members.map(member => ({ ...member, online: online.has(member.id) })) };
    for (const ws of this.sockets()) if (this.attachment(ws).id) this.send(ws, { type: 'state', room: state });
  }
  async fetch(): Promise<Response> {
    const room = this.read();
    if (!room || room.expiresAt <= Date.now()) return new Response('This room has expired. Create a new room.', { status: 410 });
    if (this.sockets().length >= 10) return new Response('Room busy. Try again shortly.', { status: 429 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ seen: Date.now(), window: Date.now(), count: 0 } satisfies Attachment);
    await this.schedule(room);
    return new Response(null, { status: 101, webSocket: client });
  }
  async schedule(room: SharedRoom) {
    const departures = this.ctx.storage.sql.exec<{ at: number }>('SELECT at FROM departures').toArray();
    const deadlines = this.sockets().map(ws => {
      const a = this.attachment(ws);
      const ping = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() || 0;
      return Math.max(a.seen, ping) + (a.id ? GRACE : 15_000);
    });
    await this.ctx.storage.setAlarm(Math.min(room.expiresAt, ...deadlines, ...departures.map(row => row.at + GRACE)));
  }
  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const a = this.attachment(ws), now = Date.now();
    if (ws.readyState !== WebSocket.OPEN) return;
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 6000) { this.error(ws, 'That message is too large.', 1009); return; }
    if (now - a.window > 10_000) { a.window = now; a.count = 0; }
    a.count++; a.seen = now; ws.serializeAttachment(a);
    if (a.count > 30) { this.error(ws, 'Please slow down.'); return; }
    let event: Record<string, unknown>; try { event = JSON.parse(raw); if (!event || typeof event !== 'object' || Array.isArray(event)) throw Error(); } catch { this.error(ws, 'Invalid room message.'); return; }
    // Hash the reconnect secret before publishing any identity. Never store or broadcast the secret itself.
    let joiningId: string | undefined;
    if (event.type === 'join' && !a.id && typeof event.secret === 'string' && TOKEN.test(event.secret)) joiningId = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(event.secret))));
    // Read after the asynchronous hash so concurrent joins cannot each claim the fifth seat.
    const room = this.read();
    if (!room || room.expiresAt <= now) { this.error(ws, 'This room has expired.', 4004); return; }
    if (event.type === 'join' && !a.id) {
      const name = clean(event.name, 32), resource = event.resource as ResourceRoute;
      if (!joiningId || !name || !routes.includes(resource)) { this.error(ws, 'Choose a name and a resource route.', 4002); return; }
      let member = room.members.find(item => item.id === joiningId);
      if (!member && room.members.length >= 5) { this.error(ws, 'All five seats are taken. Try again after someone leaves.', 4005); return; }
      if (this.sockets().some(other => other !== ws && this.attachment(other).id === joiningId)) { this.error(ws, 'This seat is already open in another connection.', 4006); return; }
      if (!member) { member = { id: joiningId, name, resource, online: true }; room.members.push(member); }
      a.id = joiningId; ws.serializeAttachment(a);
      this.ctx.storage.sql.exec('DELETE FROM departures WHERE id=?', joiningId);
      this.save(room); this.send(ws, { type: 'joined', id: joiningId }); this.broadcast(room); await this.schedule(room); return;
    }
    const member = room.members.find(item => item.id === a.id);
    if (!member) { this.error(ws, 'Join the room first.', 4002); return; }
    if (event.type === 'leave') {
      this.remove(room, member.id); this.save(room); ws.serializeAttachment({ ...a, id: undefined }); ws.close(1000, 'Left room'); this.broadcast(room); await this.schedule(room); return;
    }
    if (event.type === 'profile') {
      const name = clean(event.name, 32), resource = event.resource as ResourceRoute;
      if (!name || !routes.includes(resource)) { this.error(ws, 'Choose a name and a resource route.'); return; }
      member.name = name; member.resource = resource;
    } else if (event.type === 'add') {
      const text = clean(event.text, 1600), kind = event.kind as SharedPiece['kind'];
      if (!text || !['note', 'proposal', 'image-idea'].includes(kind)) { this.error(ws, 'Add a note, proposal, or image idea under 1,600 characters.'); return; }
      if (room.pieces.length >= 40) { this.error(ws, 'The board has 40 pieces. Remove one of yours to make room.'); return; }
      const id = typeof event.id === 'string' && /^[0-9a-f-]{36}$/.test(event.id) ? event.id : crypto.randomUUID();
      const existing = room.pieces.find(piece => piece.id === id);
      if (existing) { if (existing.authorId === member.id) this.broadcast(room); else this.error(ws, 'That piece already exists.'); return; }
      room.pieces.push({ id, authorId: member.id, author: member.name, kind, text, createdAt: now, votes: {} });
    } else if (event.type === 'vote') {
      const piece = room.pieces.find(item => item.id === event.id);
      if (!piece || piece.kind !== 'proposal' || !['yes', 'no', null].includes(event.vote as never)) { this.error(ws, 'That proposal or vote is unavailable.'); return; }
      if (event.vote === null) delete piece.votes[member.id]; else piece.votes[member.id] = event.vote as 'yes' | 'no';
    } else if (event.type === 'remove') {
      const piece = room.pieces.find(item => item.id === event.id);
      if (!piece || piece.authorId !== member.id) { this.error(ws, 'You can only remove your own pieces.'); return; }
      room.pieces = room.pieces.filter(item => item.id !== piece.id);
    } else { this.error(ws, 'Unknown room action.'); return; }
    this.save(room); this.broadcast(room); await this.schedule(room);
  }
  remove(room: SharedRoom, id: string) {
    room.members = room.members.filter(member => member.id !== id);
    for (const piece of room.pieces) delete piece.votes[id];
    this.ctx.storage.sql.exec('DELETE FROM departures WHERE id=?', id);
  }
  async webSocketClose(ws: WebSocket) {
    const room = this.read(); if (!room || room.expiresAt <= Date.now()) return;
    const a = this.attachment(ws);
    if (a.id && room.members.some(member => member.id === a.id) && !this.sockets().some(other => other !== ws && this.attachment(other).id === a.id)) this.ctx.storage.sql.exec('INSERT OR IGNORE INTO departures (id,at) VALUES (?,?)', a.id, Date.now());
    this.broadcast(room); await this.schedule(room);
  }
  async webSocketError(ws: WebSocket) { ws.close(1011, 'Connection interrupted'); await this.webSocketClose(ws); }
  async alarm() {
    const room = this.read(); if (!room) return;
    const now = Date.now();
    if (room.expiresAt <= now) {
      for (const ws of this.sockets()) ws.close(4004, 'Room expired');
      this.ctx.storage.sql.exec('DELETE FROM departures');
      this.save({ revision: room.revision, expiresAt: room.expiresAt, members: [], pieces: [] }); return;
    }
    for (const ws of this.sockets()) {
      const a = this.attachment(ws), ping = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() || 0;
      if (now - Math.max(a.seen, ping) >= (a.id ? GRACE : 15_000)) {
        if (a.id) this.ctx.storage.sql.exec('INSERT OR IGNORE INTO departures (id,at) VALUES (?,?)', a.id, now - GRACE);
        ws.close(4008, 'Connection timed out');
      }
    }
    const online = new Set(this.sockets().map(ws => this.attachment(ws).id));
    const departed = this.ctx.storage.sql.exec<{ id: string; at: number }>('SELECT id,at FROM departures').toArray();
    for (const row of departed) if (!online.has(row.id) && now - row.at >= GRACE) this.remove(room, row.id);
    this.save(room); this.broadcast(room); await this.schedule(room);
  }
}
