/**
 * pointcast-tank Worker — standalone Durable Object host for /play/tank.
 *
 * Pages Functions cannot export DO classes; TankRoom lives here and gets
 * bound into Pages via script_name. Same pattern as workers/presence/.
 *
 * State model (TankRoom):
 *   - fish: Map<fishId, { sessionId, nounId, kind, size, bornAt, lastSeen }>
 *           Positions are NOT authoritative on the server — clients draw
 *           fish at deterministic positions derived from sessionId + time,
 *           so we don't need to sync x/y at 10Hz. Server just holds the
 *           roster + event log + ecosystem numbers.
 *   - flake: Array<{ id, x, y, droppedAt, eatenAt? }>   (recent 120s)
 *   - plants: Array<{ id, x, y, placedBy, placedAt }>   (cap 12)
 *   - decor: Array<{ id, type, x, y, placedBy, placedAt }>  (cap 6)
 *   - waste: number   (0-300+)
 *   - events: ring buffer of recent ambient events (dart, feed, ghost)
 *
 * Tick (every 5s): age flake, convert waste via plants, ghost fish stale
 * by >60s, prune event ring buffer.
 *
 * HTTP surface (routed from the stub fetch at the bottom):
 *   GET  /state       → full snapshot { fish, flake, plants, decor, waste, events, stats }
 *   POST /join        → { sessionId, nounId, kind } registers a fish
 *   POST /leave       → marks a fish as ghost (fades over 60s then removed)
 *   POST /feed        → { position? } drops a flake, decrements rhythm
 *   POST /place       → { item_type, position } places plant or decor
 *   POST /dart        → { sessionId } triggers a dart event
 *   POST /vacuum      → reduces waste by 20, rate-limited per session
 *   POST /describe    → { fish_id, lore, agent } logs fish lore to ring buffer
 *
 * Rate limits are enforced at the Pages Function layer (functions/api/tank/*).
 * The DO just trusts the caller.
 */

interface Env {
  TANK: DurableObjectNamespace;
}

type FishKind = 'human' | 'agent' | 'wallet';

interface Fish {
  fishId: string;
  sessionId: string;
  nounId: number;
  kind: FishKind;
  size: number; // 1-3, grows with tenure
  bornAt: number; // epoch ms
  lastSeen: number; // epoch ms
  ghostSince?: number; // epoch ms if ghosting
}

interface Flake {
  id: string;
  x: number;
  y: number;
  droppedBy: string;
  droppedAt: number;
  eatenBy?: string;
  eatenAt?: number;
}

interface Plant {
  id: string;
  x: number;
  y: number;
  placedBy: string;
  placedAt: number;
}

type DecorType = 'rock' | 'castle' | 'bubbler' | 'sunken_ship';

interface Decor {
  id: string;
  type: DecorType;
  x: number;
  y: number;
  placedBy: string;
  placedAt: number;
}

type EventKind = 'feed' | 'place' | 'dart' | 'vacuum' | 'join' | 'leave' | 'describe';

interface TankEvent {
  id: string;
  kind: EventKind;
  by: string; // sessionId
  at: number; // epoch ms
  payload?: Record<string, unknown>;
}

interface Lore {
  id: string;
  fishId: string;
  lore: string;
  author: string; // agent slug
  at: number;
}

const PLANT_CAP = 12;
const DECOR_CAP = 6;
const FLAKE_TTL_MS = 120_000;
const FISH_GHOST_MS = 60_000;
const TICK_MS = 5_000;
const EVENT_RING_SIZE = 40;
const HUMAN_FISH_CAP = 3;
const AGENT_FISH_CAP = 5;
const WASTE_PER_FISH_PER_MIN = 1;
const WASTE_PER_FLAKE_UNEATEN = 1;
const PLANT_WASTE_CONVERT_PER_MIN = 5;
const VACUUM_REDUCTION = 20;

function now(): number {
  return Date.now();
}

function rid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const b = await req.json();
    return (b as T) ?? ({} as T);
  } catch {
    return {} as T;
  }
}

export class TankRoom {
  state: DurableObjectState;
  fish: Map<string, Fish> = new Map();
  flake: Flake[] = [];
  plants: Plant[] = [];
  decor: Decor[] = [];
  waste = 0;
  events: TankEvent[] = [];
  lore: Lore[] = [];
  lastVacuumBy: Map<string, number> = new Map();
  tickHandle: ReturnType<typeof setInterval> | null = null;
  lastPersist = 0;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      await this.hydrate();
      this.startTicker();
    });
  }

  async hydrate(): Promise<void> {
    const snap = (await this.state.storage.get('snap')) as {
      fish?: [string, Fish][];
      flake?: Flake[];
      plants?: Plant[];
      decor?: Decor[];
      waste?: number;
      events?: TankEvent[];
      lore?: Lore[];
    } | undefined;
    if (!snap) return;
    this.fish = new Map(snap.fish ?? []);
    this.flake = snap.flake ?? [];
    this.plants = snap.plants ?? [];
    this.decor = snap.decor ?? [];
    this.waste = snap.waste ?? 0;
    this.events = snap.events ?? [];
    this.lore = snap.lore ?? [];
  }

  async persist(): Promise<void> {
    const snap = {
      fish: [...this.fish.entries()],
      flake: this.flake,
      plants: this.plants,
      decor: this.decor,
      waste: this.waste,
      events: this.events,
      lore: this.lore,
    };
    await this.state.storage.put('snap', snap);
    this.lastPersist = now();
  }

  startTicker(): void {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => this.tick(), TICK_MS);
  }

  tick(): void {
    const t = now();

    // Age flake → waste
    const survivors: Flake[] = [];
    for (const f of this.flake) {
      if (f.eatenAt) continue;
      const age = t - f.droppedAt;
      if (age >= FLAKE_TTL_MS) {
        this.waste += WASTE_PER_FLAKE_UNEATEN;
      } else {
        survivors.push(f);
      }
    }
    this.flake = survivors;

    // Plants convert waste (per tick, proportional to TICK_MS)
    const convertPerTick = Math.round(
      (this.plants.length * PLANT_WASTE_CONVERT_PER_MIN * TICK_MS) / 60_000,
    );
    this.waste = Math.max(0, this.waste - convertPerTick);

    // Fish generate waste
    const wastePerTick = Math.round(
      (this.fish.size * WASTE_PER_FISH_PER_MIN * TICK_MS) / 60_000,
    );
    this.waste += wastePerTick;

    // Ghost stale fish
    for (const [id, f] of this.fish) {
      const age = t - f.lastSeen;
      if (!f.ghostSince && age > FISH_GHOST_MS) {
        f.ghostSince = t;
        this.pushEvent({ kind: 'leave', by: f.sessionId, at: t });
      }
      if (f.ghostSince && t - f.ghostSince > FISH_GHOST_MS) {
        this.fish.delete(id);
      }
    }

    // Persist every 5 ticks (~25s)
    if (t - this.lastPersist > 25_000) {
      this.persist().catch(() => {});
    }
  }

  pushEvent(ev: Omit<TankEvent, 'id'>): void {
    const full: TankEvent = { ...ev, id: rid('ev') };
    this.events.push(full);
    if (this.events.length > EVENT_RING_SIZE) {
      this.events = this.events.slice(-EVENT_RING_SIZE);
    }
  }

  snapshot(): Record<string, unknown> {
    const t = now();
    return {
      tankId: 'v0',
      now: t,
      fish: [...this.fish.values()].map((f) => ({
        fishId: f.fishId,
        nounId: f.nounId,
        kind: f.kind,
        size: f.size,
        bornAt: f.bornAt,
        lastSeen: f.lastSeen,
        ghost: !!f.ghostSince,
      })),
      flake: this.flake.map((f) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        age: t - f.droppedAt,
      })),
      plants: this.plants,
      decor: this.decor,
      waste: this.waste,
      events: this.events.slice(-20),
      lore: this.lore.slice(-10),
      stats: {
        fishCount: this.fish.size,
        humans: [...this.fish.values()].filter((f) => f.kind === 'human' && !f.ghostSince).length,
        agents: [...this.fish.values()].filter((f) => f.kind === 'agent' && !f.ghostSince).length,
        plantCount: this.plants.length,
        decorCount: this.decor.length,
        plantCap: PLANT_CAP,
        decorCap: DECOR_CAP,
        health:
          this.waste < 100 ? 'healthy' : this.waste < 200 ? 'warning' : this.waste < 300 ? 'polluted' : 'critical',
      },
    };
  }

  async handleJoin(body: { sessionId?: string; nounId?: number; kind?: FishKind }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    const nounId = clamp(Number(body.nounId ?? 0), 0, 1199);
    const kind: FishKind = body.kind === 'agent' ? 'agent' : body.kind === 'wallet' ? 'wallet' : 'human';
    if (!sessionId) return json({ ok: false, error: 'session required' }, 400);

    const t = now();
    const existing = [...this.fish.values()].find((f) => f.sessionId === sessionId);
    if (existing) {
      existing.lastSeen = t;
      if (existing.ghostSince) delete existing.ghostSince;
      // grow size if tenure warrants
      const tenure = t - existing.bornAt;
      existing.size = tenure > 3_600_000 ? 3 : tenure > 600_000 ? 2 : 1;
      return json({ ok: true, fish: existing });
    }

    const cap = kind === 'agent' ? AGENT_FISH_CAP : HUMAN_FISH_CAP;
    const mine = [...this.fish.values()].filter((f) => f.sessionId === sessionId).length;
    if (mine >= cap) return json({ ok: false, error: 'fish cap' }, 429);

    const fish: Fish = {
      fishId: rid('fish'),
      sessionId,
      nounId,
      kind,
      size: 1,
      bornAt: t,
      lastSeen: t,
    };
    this.fish.set(fish.fishId, fish);
    this.pushEvent({ kind: 'join', by: sessionId, at: t, payload: { fishId: fish.fishId, nounId, kind } });
    return json({ ok: true, fish });
  }

  async handleLeave(body: { sessionId?: string }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    if (!sessionId) return json({ ok: false, error: 'session required' }, 400);
    const t = now();
    for (const f of this.fish.values()) {
      if (f.sessionId === sessionId && !f.ghostSince) {
        f.ghostSince = t;
        this.pushEvent({ kind: 'leave', by: sessionId, at: t });
      }
    }
    return json({ ok: true });
  }

  async handleFeed(body: { sessionId?: string; x?: number; y?: number }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    if (!sessionId) return json({ ok: false, error: 'session required' }, 400);
    const x = clamp(Number(body.x ?? 500 + (Math.random() - 0.5) * 200), 50, 950);
    const y = clamp(Number(body.y ?? 100), 50, 300);
    const t = now();
    const flake: Flake = { id: rid('flk'), x, y, droppedBy: sessionId, droppedAt: t };
    this.flake.push(flake);
    if (this.flake.length > 80) this.flake = this.flake.slice(-80);
    this.pushEvent({ kind: 'feed', by: sessionId, at: t, payload: { x, y } });
    return json({ ok: true, flake });
  }

  async handlePlace(body: {
    sessionId?: string;
    itemType?: string;
    x?: number;
    y?: number;
  }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    if (!sessionId) return json({ ok: false, error: 'session required' }, 400);
    const item = String(body.itemType || '').toLowerCase();
    const x = clamp(Number(body.x ?? 500), 40, 960);
    const y = clamp(Number(body.y ?? 500), 350, 560);
    const t = now();

    if (item === 'plant') {
      if (this.plants.length >= PLANT_CAP) return json({ ok: false, error: 'plant cap' }, 429);
      const p: Plant = { id: rid('pl'), x, y, placedBy: sessionId, placedAt: t };
      this.plants.push(p);
      this.pushEvent({ kind: 'place', by: sessionId, at: t, payload: { type: 'plant', x, y } });
      return json({ ok: true, plant: p });
    }

    const decorTypes: DecorType[] = ['rock', 'castle', 'bubbler', 'sunken_ship'];
    if (decorTypes.includes(item as DecorType)) {
      if (this.decor.length >= DECOR_CAP) return json({ ok: false, error: 'decor cap' }, 429);
      const d: Decor = {
        id: rid('dc'),
        type: item as DecorType,
        x,
        y,
        placedBy: sessionId,
        placedAt: t,
      };
      this.decor.push(d);
      this.pushEvent({ kind: 'place', by: sessionId, at: t, payload: { type: item, x, y } });
      return json({ ok: true, decor: d });
    }

    return json({ ok: false, error: 'unknown item type' }, 400);
  }

  async handleDart(body: { sessionId?: string }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    if (!sessionId) return json({ ok: false, error: 'session required' }, 400);
    const t = now();
    this.pushEvent({ kind: 'dart', by: sessionId, at: t });
    // Also mark fish seen
    for (const f of this.fish.values()) if (f.sessionId === sessionId) f.lastSeen = t;
    return json({ ok: true });
  }

  async handleVacuum(body: { sessionId?: string }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    if (!sessionId) return json({ ok: false, error: 'session required' }, 400);
    const t = now();
    const last = this.lastVacuumBy.get(sessionId) ?? 0;
    if (t - last < 3_600_000) {
      return json({ ok: false, error: 'cooldown', nextAt: last + 3_600_000 }, 429);
    }
    this.waste = Math.max(0, this.waste - VACUUM_REDUCTION);
    this.lastVacuumBy.set(sessionId, t);
    this.pushEvent({ kind: 'vacuum', by: sessionId, at: t, payload: { reduction: VACUUM_REDUCTION } });
    return json({ ok: true, waste: this.waste });
  }

  async handleDescribe(body: {
    sessionId?: string;
    fishId?: string;
    lore?: string;
    author?: string;
  }): Promise<Response> {
    const sessionId = String(body.sessionId || '').slice(0, 64);
    const fishId = String(body.fishId || '').slice(0, 64);
    const lore = String(body.lore || '').slice(0, 300);
    const author = String(body.author || sessionId).slice(0, 32);
    if (!sessionId || !fishId || !lore) return json({ ok: false, error: 'missing' }, 400);
    if (!this.fish.has(fishId)) return json({ ok: false, error: 'no such fish' }, 404);

    const t = now();
    const l: Lore = { id: rid('lr'), fishId, lore, author, at: t };
    this.lore.push(l);
    if (this.lore.length > 60) this.lore = this.lore.slice(-60);
    this.pushEvent({
      kind: 'describe',
      by: sessionId,
      at: t,
      payload: { fishId, author, preview: lore.slice(0, 60) },
    });
    return json({ ok: true, lore: l });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    if (path === '/state' && req.method === 'GET') return json(this.snapshot());
    if (path === '/join' && req.method === 'POST') return this.handleJoin(await readJson(req));
    if (path === '/leave' && req.method === 'POST') return this.handleLeave(await readJson(req));
    if (path === '/feed' && req.method === 'POST') return this.handleFeed(await readJson(req));
    if (path === '/place' && req.method === 'POST') return this.handlePlace(await readJson(req));
    if (path === '/dart' && req.method === 'POST') return this.handleDart(await readJson(req));
    if (path === '/vacuum' && req.method === 'POST') return this.handleVacuum(await readJson(req));
    if (path === '/describe' && req.method === 'POST') return this.handleDescribe(await readJson(req));
    return text('not found', 404);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const id = env.TANK.idFromName('pointcast-tank-v0');
    const stub = env.TANK.get(id);
    return stub.fetch(req);
  },
};
