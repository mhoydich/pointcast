/**
 * tank — shared client helpers for /play/tank.
 *
 * Tank is canvas-rendered. Fish positions are computed on the client from
 * a deterministic seed (sessionId hash + elapsed time) so we don't need
 * to round-trip 10Hz updates; the server only holds roster + mechanics
 * state (flake / plants / decor / waste).
 *
 * Keep this file zero-dependency — imported both by the Astro page and
 * potentially future components.
 */

export type FishKind = 'human' | 'agent' | 'wallet';

export interface TankFish {
  fishId: string;
  nounId: number;
  kind: FishKind;
  size: number;
  bornAt: number;
  lastSeen: number;
  ghost: boolean;
}

export interface TankFlake {
  id: string;
  x: number;
  y: number;
  age: number;
}

export interface TankPlant {
  id: string;
  x: number;
  y: number;
  placedBy: string;
  placedAt: number;
}

export type TankDecorType = 'rock' | 'castle' | 'bubbler' | 'sunken_ship';

export interface TankDecor {
  id: string;
  type: TankDecorType;
  x: number;
  y: number;
  placedBy: string;
  placedAt: number;
}

export interface TankEvent {
  id: string;
  kind: 'feed' | 'place' | 'dart' | 'vacuum' | 'join' | 'leave' | 'describe';
  by: string;
  at: number;
  payload?: Record<string, unknown>;
}

export interface TankLore {
  id: string;
  fishId: string;
  lore: string;
  author: string;
  at: number;
}

export interface TankSnapshot {
  tankId: string;
  now: number;
  fish: TankFish[];
  flake: TankFlake[];
  plants: TankPlant[];
  decor: TankDecor[];
  waste: number;
  events: TankEvent[];
  lore: TankLore[];
  stats: {
    fishCount: number;
    humans: number;
    agents: number;
    plantCount: number;
    decorCount: number;
    plantCap: number;
    decorCap: number;
    health: 'healthy' | 'warning' | 'polluted' | 'critical' | 'stub';
  };
}

export const TANK_W = 1000;
export const TANK_H = 600;

/** djb2 hash, matches the server. */
export function cheapHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * Deterministic fish motion. Given a fishId and current elapsed ms since
 * birth, return {x, y, heading} so every client computes the same path.
 * A lazy bounded Perlin-shaped curve using cheapHash-derived phase offsets.
 */
export function fishPosition(
  fishId: string,
  elapsedMs: number,
  darting: boolean,
): { x: number; y: number; heading: number } {
  const seed = cheapHash(fishId);
  const phaseX = (seed & 0xffff) / 0xffff; // 0..1
  const phaseY = ((seed >> 16) & 0xffff) / 0xffff; // 0..1
  const speed = darting ? 0.0018 : 0.00036; // slow drift, 5x dart
  // Two-frequency Lissajous keeps it readable + non-repeating-feeling
  const tx = elapsedMs * speed + phaseX * Math.PI * 2;
  const ty = elapsedMs * speed * 0.7 + phaseY * Math.PI * 2;
  const cx = TANK_W / 2 + Math.sin(tx) * (TANK_W * 0.38) + Math.cos(tx * 0.33 + phaseY) * 80;
  const cy = TANK_H * 0.45 + Math.sin(ty * 1.3) * (TANK_H * 0.28) + Math.cos(tx * 0.7) * 50;
  // heading: rough derivative
  const tx2 = tx + 0.01;
  const cx2 = TANK_W / 2 + Math.sin(tx2) * (TANK_W * 0.38) + Math.cos(tx2 * 0.33 + phaseY) * 80;
  const cy2 = TANK_H * 0.45 + Math.sin((ty + 0.007) * 1.3) * (TANK_H * 0.28) + Math.cos(tx2 * 0.7) * 50;
  const heading = Math.atan2(cy2 - cy, cx2 - cx);
  return { x: cx, y: cy, heading };
}

/** Find the nearest unclaimed flake within radius. Used by clients to
 *  visually steer fish toward food; server is source of truth for eats. */
export function nearestFlake(
  flake: TankFlake[],
  fx: number,
  fy: number,
  radius = 120,
): TankFlake | null {
  let best: TankFlake | null = null;
  let bestDist = radius * radius;
  for (const f of flake) {
    const dx = f.x - fx;
    const dy = f.y - fy;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return best;
}

/** Get a client session id from cookie/localStorage. Called on page mount. */
export function getClientSessionId(): string {
  if (typeof document === 'undefined') return 'ssr';
  const m = document.cookie.match(/pc_session=([A-Za-z0-9_-]{8,64})/);
  if (m) return m[1];
  const stored = localStorage.getItem('pc:session-id');
  if (stored) return stored;
  const minted = 'pc-' + Math.random().toString(36).slice(2, 12);
  try {
    localStorage.setItem('pc:session-id', minted);
  } catch {}
  return minted;
}
