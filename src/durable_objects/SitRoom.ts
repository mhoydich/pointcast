export interface SitRoomEnv {
  SIT_STATS?: KVNamespace;
}

interface Seat {
  ws: WebSocket;
  sitting: boolean;
}

type ClientMessage =
  | { type?: unknown }
  | null
  | undefined;

interface PresencePayload {
  type: 'presence';
  sitting: number;
  total_minutes: number;
}

type PresenceSnapshot = Omit<PresencePayload, 'type'>;

const TOTAL_MINUTES_KEY = 'sit:total_minutes';
const STORAGE_TOTAL_KEY = 'total_minutes';
const TICK_MS = 60_000;
const KV_PERSIST_TICKS = 5;
const WS_OPEN = 1;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function parseTotalMinutes(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export class SitRoom {
  state: DurableObjectState;
  env: SitRoomEnv;
  seats: Map<string, Seat> = new Map();
  sitting = 0;
  totalMinutes = 0;
  tickCount = 0;
  tickHandle: ReturnType<typeof setInterval> | null = null;
  hydrated = false;
  hydratePromise: Promise<void>;

  constructor(state: DurableObjectState, env: SitRoomEnv) {
    this.state = state;
    this.env = env;
    this.hydratePromise = this.hydrate();
  }

  async fetch(request: Request): Promise<Response> {
    await this.hydratePromise;

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname.endsWith('/presence')) {
      return json(this.presenceSnapshot());
    }

    const upgrade = request.headers.get('upgrade') ?? '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return json({
        endpoint: '/api/sit',
        type: 'websocket',
        websocket: 'wss://pointcast.xyz/api/sit',
        presence: '/api/sit/presence',
        server: this.snapshot(),
        client: [{ type: 'join' }, { type: 'leave' }],
      });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.accept(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return;

    const [storedTotal, kvTotal] = await Promise.all([
      this.state.storage.get<number>(STORAGE_TOTAL_KEY).catch(() => undefined),
      this.env.SIT_STATS?.get(TOTAL_MINUTES_KEY).catch(() => null) ?? Promise.resolve(null),
    ]);

    this.totalMinutes = Math.max(
      parseTotalMinutes(storedTotal),
      parseTotalMinutes(kvTotal),
    );
    this.hydrated = true;
  }

  accept(ws: WebSocket): void {
    ws.accept();

    const id = crypto.randomUUID();
    this.seats.set(id, { ws, sitting: true });
    this.sitting += 1;
    this.startTicker();
    this.broadcast();

    ws.addEventListener('message', (event) => {
      this.handleMessage(id, typeof event.data === 'string' ? event.data : '');
    });

    const cleanup = () => {
      this.removeSeat(id);
    };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  handleMessage(id: string, raw: string): void {
    let payload: ClientMessage;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    if (!payload || typeof payload !== 'object') return;

    if (payload.type === 'join') {
      this.markSitting(id, true);
      return;
    }

    if (payload.type === 'leave') {
      this.markSitting(id, false);
    }
  }

  markSitting(id: string, sitting: boolean): void {
    const seat = this.seats.get(id);
    if (!seat || seat.sitting === sitting) return;

    seat.sitting = sitting;
    this.sitting += sitting ? 1 : -1;
    if (this.sitting < 0) this.sitting = 0;

    if (this.sitting > 0) this.startTicker();
    else this.stopTicker();

    this.broadcast();
    if (!sitting) this.persistIfIdle();
  }

  removeSeat(id: string): void {
    const seat = this.seats.get(id);
    if (!seat) return;

    this.seats.delete(id);
    if (seat.sitting) {
      this.sitting -= 1;
      if (this.sitting < 0) this.sitting = 0;
    }

    if (this.sitting === 0) this.stopTicker();
    this.broadcast();
    this.persistIfIdle();
  }

  startTicker(): void {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => {
      this.tick();
    }, TICK_MS);
  }

  stopTicker(): void {
    if (!this.tickHandle) return;
    clearInterval(this.tickHandle);
    this.tickHandle = null;
  }

  tick(): void {
    this.pruneClosedSeats();
    if (this.sitting <= 0) {
      this.stopTicker();
      return;
    }

    this.totalMinutes += this.sitting;
    this.tickCount += 1;
    this.broadcast();
    this.state.waitUntil(this.persistToStorage());

    if (this.tickCount % KV_PERSIST_TICKS === 0) {
      this.state.waitUntil(this.persistToKv());
    }
  }

  pruneClosedSeats(): void {
    for (const [id, seat] of this.seats) {
      if (seat.ws.readyState !== WS_OPEN) this.removeSeat(id);
    }
  }

  broadcast(): void {
    const payload = JSON.stringify(this.snapshot());
    const dead: string[] = [];

    for (const [id, seat] of this.seats) {
      try {
        if (seat.ws.readyState === WS_OPEN) {
          seat.ws.send(payload);
        } else {
          dead.push(id);
        }
      } catch {
        dead.push(id);
      }
    }

    for (const id of dead) this.removeSeat(id);
  }

  snapshot(): PresencePayload {
    return {
      type: 'presence',
      sitting: this.sitting,
      total_minutes: this.totalMinutes,
    };
  }

  presenceSnapshot(): PresenceSnapshot {
    return {
      sitting: this.sitting,
      total_minutes: this.totalMinutes,
    };
  }

  persistIfIdle(): void {
    this.state.waitUntil(this.persistToStorage());
    if (this.sitting === 0) {
      this.state.waitUntil(this.persistToKv());
    }
  }

  async persistToStorage(): Promise<void> {
    await this.state.storage.put(STORAGE_TOTAL_KEY, this.totalMinutes);
  }

  async persistToKv(): Promise<void> {
    if (!this.env.SIT_STATS) return;
    await this.env.SIT_STATS.put(TOTAL_MINUTES_KEY, String(this.totalMinutes));
  }
}
