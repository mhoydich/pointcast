/**
 * DrumRoom — Cloudflare Durable Object for sub-100ms drum-event fan-out.
 *
 * One instance per drum room (we use a single global "main" room for now;
 * could shard per surface later). Holds a Set of attached WebSockets, an
 * in-memory ring buffer of the last 50 events for late-joiners, and an
 * optional KV mirror so the existing /api/sounds polling endpoint keeps
 * working as a fallback.
 *
 * Wire-up (one-time, requires Pages Functions paid tier):
 *   wrangler.toml:
 *     [[durable_objects.bindings]]
 *     name = "DRUM_ROOM"
 *     class_name = "DrumRoom"
 *
 *     [[migrations]]
 *     tag = "v1"
 *     new_classes = ["DrumRoom"]
 *
 * The proxy endpoint is at functions/api/drum/room.ts which forwards
 * upgrade requests to this DO.
 *
 * Per-event cost: one Set iteration + one WebSocket.send() per attached
 * client. At 50 concurrent clients that's <1ms per event in practice.
 *
 * Per docs/briefs/2026-04-26-drum-realtime.md.
 */

interface Env {
  DRUM_ROOM: DurableObjectNamespace;
  VISITS?: KVNamespace;
}

interface DrumEvent {
  type: string;
  cellKey?: string;
  inst?: string;
  voice?: string;
  cat?: string;
  pitch?: number;
  decay?: number;
  seed?: number;
  auto?: boolean;
  sessionId: string;
  pid?: string;
  t: number;
}

const RING_SIZE = 50;
const KV_MIRROR_KEY = 'sounds:buffer';
const KV_MIRROR_TTL = 60; // 1 minute — enough overlap for the polling fallback

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

    // Health check / debug — GET / returns the connected count + ring size
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
    // doesn't feel "dead" until someone taps.
    for (const ev of this.ring.slice(-10)) {
      try { server.send(JSON.stringify(ev)); } catch {}
    }

    server.addEventListener('message', (msg) => {
      let raw: unknown;
      try { raw = JSON.parse(typeof msg.data === 'string' ? msg.data : ''); } catch { return; }
      if (!raw || typeof raw !== 'object') return;
      const ev = { ...(raw as Partial<DrumEvent>), t: Date.now() } as DrumEvent;
      // Compute a stable "pid" for the broadcast (first 10 hex of sha256(sessionId))
      // so receivers can dedup their own events.
      if (ev.sessionId && !ev.pid) {
        // Edge runtime crypto.subtle is available
        // We can't await inside this synchronous handler easily — derive
        // pid asynchronously and wait before broadcasting. Use a small IIFE.
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
    if (this.ring.length > RING_SIZE) this.ring.splice(0, this.ring.length - RING_SIZE);

    // Fan out to every other connected socket. Sender hears their own tap
    // locally already; no need to echo.
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

    // Mirror to KV so /api/sounds polling still works for clients on the
    // fallback transport. Best-effort, non-blocking.
    if (this.env.VISITS) {
      this.state.waitUntil((async () => {
        try {
          const raw = await this.env.VISITS!.get(KV_MIRROR_KEY);
          const existing: DrumEvent[] = raw ? JSON.parse(raw) : [];
          existing.push(ev);
          const trimmed = existing.slice(-RING_SIZE);
          await this.env.VISITS!.put(KV_MIRROR_KEY, JSON.stringify(trimmed), {
            expirationTtl: KV_MIRROR_TTL,
          });
        } catch {}
      })());
    }
  }
}
