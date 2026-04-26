/**
 * pointcast-drum — standalone Cloudflare Worker hosting the DrumRoom
 * Durable Object. The Pages project (pointcast) binds to this worker
 * via wrangler.toml [[durable_objects.bindings]] script_name.
 *
 * Why a separate worker: Cloudflare Pages can't host DurableObject
 * classes inside functions/. The class needs to live in a Worker that
 * Pages binds to externally.
 *
 * Deploy from this directory:
 *   wrangler deploy
 *
 * After it's live, in the parent pointcast/wrangler.toml uncomment:
 *
 *   [[durable_objects.bindings]]
 *   name = "DRUM_ROOM"
 *   class_name = "DrumRoom"
 *   script_name = "pointcast-drum"  // ← this worker's name
 *
 * Push to main → Pages picks up the binding → /api/drum/room (which
 * lives in the Pages project's functions/api/drum/room.ts) starts
 * proxying WebSocket upgrades to this DO. v7/v8 (which try the WS
 * transport on load) flip from polling to live broadcast at
 * ~30–60ms p50.
 *
 * No client-side change required — the existing /api/drum/room
 * proxy in the Pages project does all the work.
 */

interface Env {
  DRUM_ROOM: DurableObjectNamespace;
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
  sessionId: string;
  pid?: string;
  t: number;
}

const RING_SIZE = 50;

export class DrumRoom {
  state: DurableObjectState;
  env: Env;
  sockets: Set<WebSocket> = new Set();
  ring: DrumEvent[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      this.acceptSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname.endsWith('/stats')) {
      return Response.json({
        connected: this.sockets.size,
        ringSize: this.ring.length,
        latest: this.ring[this.ring.length - 1] ?? null,
      });
    }

    return new Response('drum-room', { status: 200 });
  }

  acceptSocket(server: WebSocket) {
    server.accept();
    this.sockets.add(server);

    // Catch up the new joiner with the last 10 events so the room
    // doesn't feel "dead" before someone taps.
    for (const ev of this.ring.slice(-10)) {
      try { server.send(JSON.stringify(ev)); } catch {}
    }

    server.addEventListener('message', (msg) => {
      let raw: unknown;
      try {
        raw = JSON.parse(typeof msg.data === 'string' ? msg.data : '');
      } catch { return; }
      if (!raw || typeof raw !== 'object') return;
      const ev = { ...(raw as Partial<DrumEvent>), t: Date.now() } as DrumEvent;
      // Server-side pid derivation so receivers can dedup their own events.
      if (ev.sessionId && !ev.pid) {
        (async () => {
          try {
            const buf = new TextEncoder().encode(ev.sessionId);
            const hash = await crypto.subtle.digest('SHA-256', buf);
            ev.pid = Array.from(new Uint8Array(hash))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .slice(0, 10);
          } catch {}
          this.commitAndBroadcast(ev, server);
        })();
        return;
      }
      this.commitAndBroadcast(ev, server);
    });

    const cleanup = () => { this.sockets.delete(server); };
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);
  }

  commitAndBroadcast(ev: DrumEvent, sender: WebSocket) {
    this.ring.push(ev);
    if (this.ring.length > RING_SIZE) {
      this.ring.splice(0, this.ring.length - RING_SIZE);
    }

    // Fan out to every other connected socket. Sender already heard their
    // own tap locally; no need to echo.
    const payload = JSON.stringify(ev);
    const dead: WebSocket[] = [];
    for (const s of this.sockets) {
      if (s === sender) continue;
      try {
        if (s.readyState === 1 /* OPEN */) s.send(payload);
        else dead.push(s);
      } catch { dead.push(s); }
    }
    for (const d of dead) this.sockets.delete(d);
  }
}

// Worker entrypoint — every request gets routed to the singleton "main"
// DurableObject instance. The Pages project's /api/drum/room proxy
// forwards WS upgrades here, so this worker doesn't need to handle
// individual user routing — just hand off to the DO.
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (!env.DRUM_ROOM) {
      return new Response('DRUM_ROOM binding missing', { status: 503 });
    }
    const id = env.DRUM_ROOM.idFromName('main');
    const stub = env.DRUM_ROOM.get(id);
    return await stub.fetch(req);
  },
};
