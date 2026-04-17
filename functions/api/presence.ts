/**
 * /api/presence — WebSocket endpoint into the PresenceRoom Durable Object.
 *
 * Client opens `wss://.../api/presence?sid=<uuid>&kind=<human|agent>`.
 * The DO adds the socket to its in-memory set, broadcasts the current
 * aggregate once per second, and evicts disconnects as they come in.
 *
 * No persistence, no auth. If the DO restarts the room starts empty; all
 * clients reconnect on the first error. Spend zero brain cycles on edge
 * cases — this is a "feel" feature, not source of truth.
 */

interface Env {
  PRESENCE: DurableObjectNamespace;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const upgradeHeader = ctx.request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Single global room. Tag the DO name "global" so all clients hit the
  // same instance regardless of which colo they connect from.
  const id = ctx.env.PRESENCE.idFromName('global');
  const stub = ctx.env.PRESENCE.get(id);
  return stub.fetch(ctx.request);
};

// The Durable Object class itself. Cloudflare Pages projects can expose
// the DO class from functions/ by re-exporting it — wrangler.toml has the
// binding + migration defined.

interface Session {
  kind: 'human' | 'agent';
  sid: string;
  ws: WebSocket;
  lastSeen: number;
}

export class PresenceRoom {
  state: DurableObjectState;
  sessions: Map<string, Session> = new Map();
  broadcastInterval: any = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sid = url.searchParams.get('sid') ?? crypto.randomUUID();
    const rawKind = url.searchParams.get('kind');
    const kind: 'human' | 'agent' = rawKind === 'agent' ? 'agent' : 'human';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();

    // If a session with this sid already exists, close the older socket —
    // a user refreshing a tab should not double-count.
    const existing = this.sessions.get(sid);
    if (existing) {
      try { existing.ws.close(1000, 'replaced'); } catch {}
    }

    const session: Session = { kind, sid, ws: server, lastSeen: Date.now() };
    this.sessions.set(sid, session);

    server.addEventListener('message', () => {
      // Ping-style: just update lastSeen so idle clients eventually time out.
      session.lastSeen = Date.now();
    });

    const onClose = () => {
      const cur = this.sessions.get(sid);
      if (cur && cur.ws === server) this.sessions.delete(sid);
      if (this.sessions.size === 0) this.stopBroadcast();
    };
    server.addEventListener('close', onClose);
    server.addEventListener('error', onClose);

    this.startBroadcast();
    // Send an immediate count so the client doesn't flicker CONNECTING→count.
    try { server.send(JSON.stringify(this.aggregate())); } catch {}

    return new Response(null, { status: 101, webSocket: client });
  }

  aggregate(): { humans: number; agents: number } {
    let humans = 0, agents = 0;
    for (const s of this.sessions.values()) {
      if (s.kind === 'agent') agents++; else humans++;
    }
    return { humans, agents };
  }

  startBroadcast() {
    if (this.broadcastInterval) return;
    this.broadcastInterval = setInterval(() => {
      // Evict sockets that haven't checked in for 90s — the client doesn't
      // ping, so this only fires for genuinely dead connections the runtime
      // hasn't surfaced a close event for yet.
      const cutoff = Date.now() - 90_000;
      for (const [sid, s] of this.sessions) {
        if (s.lastSeen < cutoff) {
          try { s.ws.close(1000, 'idle'); } catch {}
          this.sessions.delete(sid);
        }
      }
      const agg = JSON.stringify(this.aggregate());
      for (const s of this.sessions.values()) {
        try { s.ws.send(agg); } catch {}
      }
    }, 1000);
  }

  stopBroadcast() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }
}
