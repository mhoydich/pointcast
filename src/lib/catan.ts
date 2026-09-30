/**
 * Hex & Harbor — the shared core behind catan.pointcast.xyz.
 *
 * An unofficial fan club for Catan tables: meetups, a balanced board forge,
 * fair dice, and a sealed-dice table agents can pay for over x402. Everything
 * here is pure and deterministic so the page (Astro + browser), the Pages
 * Functions and the tests all agree on what a seed means.
 *
 *   forgeBoard(seed)     → the 19-hex base layout, no touching 6/8s, no
 *                           touching twins, harbours shuffled onto 9 slots
 *   sealRolls(secret, n) → the dice stream a sealed table reveals one roll at
 *                           a time; anyone holding the revealed secret can
 *                           recompute every roll and the commitment
 *   validateTable(body)  → the only shape a hosted meetup may take
 *
 * CATAN is a trademark of CATAN GmbH. This is a fan site with original art;
 * it is not affiliated with or endorsed by CATAN GmbH or its publishers.
 */

export const CATAN_ORIGIN = 'https://catan.pointcast.xyz';
export const CATAN_MIRROR = 'https://pointcast.xyz/catan';
export const CATAN_SITE = 'https://pointcast.xyz';
export const CATAN_VERSION = 'pointcast.catan/v1';
export const CATAN_LAUNCHED_ON = '2026-09-29';

export type Resource = 'lumber' | 'brick' | 'wool' | 'grain' | 'ore' | 'desert';
export type Harbor = 'any' | Exclude<Resource, 'desert'>;

export const RESOURCES: Record<Resource, { label: string; terrain: string; color: string; art: string; line: string }> = {
  lumber: { label: 'Lumber', terrain: 'Forest', color: '#3f6b3a', art: '/images/catan/lumber.jpg', line: 'Roads and settlements both want it. The quiet early-game engine.' },
  brick: { label: 'Brick', terrain: 'Hills', color: '#b5532f', art: '/images/catan/brick.jpg', line: 'Only three hills on the board. Scarce by design, so it trades dear.' },
  wool: { label: 'Wool', terrain: 'Pasture', color: '#d9cfae', art: '/images/catan/wool.jpg', line: 'Four pastures and the cheapest card at the table. A 2:1 wool harbour changes that.' },
  grain: { label: 'Grain', terrain: 'Fields', color: '#d7a336', art: '/images/catan/grain.jpg', line: 'The city-and-card resource. Pair it with ore and you are building up, not out.' },
  ore: { label: 'Ore', terrain: 'Mountains', color: '#5f6f80', art: '/images/catan/ore.jpg', line: 'Three mountains. Cities cost three of it. Everyone knows who holds the ore.' },
  desert: { label: 'Desert', terrain: 'Desert', color: '#e7d5a8', art: '/images/catan/robber.jpg', line: 'No number, no yield. The robber starts here and comes back to brood.' },
};

/** Base-game tile bag: 19 hexes, 18 number tokens, 9 harbours. */
const TILE_BAG: Resource[] = [
  'lumber', 'lumber', 'lumber', 'lumber',
  'wool', 'wool', 'wool', 'wool',
  'grain', 'grain', 'grain', 'grain',
  'brick', 'brick', 'brick',
  'ore', 'ore', 'ore',
  'desert',
];
const NUMBER_BAG = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
const HARBOR_BAG: Harbor[] = ['any', 'any', 'any', 'any', 'lumber', 'brick', 'wool', 'grain', 'ore'];

/** Axial coordinates of the radius-2 hexagon, read row by row top to bottom. */
export const HEX_COORDS: Array<{ q: number; r: number }> = (() => {
  const out: Array<{ q: number; r: number }> = [];
  for (let r = -2; r <= 2; r++) {
    for (let q = -2; q <= 2; q++) {
      if (Math.abs(q + r) <= 2) out.push({ q, r });
    }
  }
  return out;
})();

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/** Pixel centre of an axial hex (pointy-top, unit size). */
export function hexCenter(q: number, r: number): { x: number; y: number } {
  return { x: Math.sqrt(3) * (q + r / 2), y: 1.5 * r };
}

/**
 * The nine harbour slots: every coastal edge (a hex side facing the sea),
 * sorted clockwise around the island, then nine picked at even spacing.
 * `dir` indexes NEIGHBOR_DIRS; the harbour sits on that side of `hex`.
 */
export const HARBOR_SLOTS: Array<{ hex: number; dir: number }> = (() => {
  const edges: Array<{ hex: number; dir: number; angle: number }> = [];
  HEX_COORDS.forEach(({ q, r }, hex) => {
    NEIGHBOR_DIRS.forEach(([dq, dr], dir) => {
      if (Math.abs(q + dq) > 2 || Math.abs(r + dr) > 2 || Math.abs(q + dq + r + dr) > 2) {
        const a = hexCenter(q, r);
        const b = hexCenter(q + dq, r + dr);
        edges.push({ hex, dir, angle: Math.atan2((a.y + b.y) / 2, (a.x + b.x) / 2) });
      }
    });
  });
  edges.sort((x, y) => x.angle - y.angle);
  return Array.from({ length: 9 }, (_, i) => edges[Math.round((i * edges.length) / 9)]).map(({ hex, dir }) => ({ hex, dir }));
})();

export function pips(n: number | null): number {
  return n === null ? 0 : 6 - Math.abs(7 - n);
}

/** FNV-1a → 32-bit seed for mulberry32. Same result in Workers, Node and browsers. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const NEIGHBORS: number[][] = HEX_COORDS.map(({ q, r }) =>
  NEIGHBOR_DIRS
    .map(([dq, dr]) => HEX_COORDS.findIndex((c) => c.q === q + dq && c.r === r + dr))
    .filter((i) => i >= 0),
);

export function cleanSeed(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) : '';
  return s || 'harbor';
}

export interface ForgedHex {
  i: number;
  q: number;
  r: number;
  resource: Resource;
  number: number | null;
  pips: number;
}

export interface ForgedBoard {
  version: string;
  seed: string;
  hexes: ForgedHex[];
  harbors: Array<{ hex: number; dir: number; kind: Harbor; ratio: string }>;
  robber: number;
  pipsByResource: Record<Exclude<Resource, 'desert'>, number>;
  rules: string[];
  attempts: number;
  share: string;
}

/**
 * Forge a balanced base board from any seed string. Deterministic: the same
 * seed always forges the same island. Hard rules, retried until they hold:
 * no two red numbers (6/8) touch, and no identical numbers touch.
 */
export function forgeBoard(rawSeed: unknown): ForgedBoard {
  const seed = cleanSeed(rawSeed);
  const rand = mulberry32(hashSeed(seed));
  let attempts = 0;
  for (;;) {
    attempts++;
    const tiles = shuffle(TILE_BAG, rand);
    const numbers = shuffle(NUMBER_BAG, rand);
    let k = 0;
    const nums = tiles.map((t) => (t === 'desert' ? null : numbers[k++]));
    const ok = nums.every((n, i) => n === null || NEIGHBORS[i].every((j) => {
      const m = nums[j];
      if (m === null) return true;
      if (m === n) return false;
      return !((n === 6 || n === 8) && (m === 6 || m === 8));
    }));
    if (!ok && attempts < 5000) continue;
    const hexes: ForgedHex[] = HEX_COORDS.map((c, i) => ({ i, ...c, resource: tiles[i], number: nums[i], pips: pips(nums[i]) }));
    const harborKinds = shuffle(HARBOR_BAG, rand);
    const pipsByResource = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
    for (const h of hexes) if (h.resource !== 'desert') pipsByResource[h.resource] += h.pips;
    return {
      version: CATAN_VERSION,
      seed,
      hexes,
      harbors: HARBOR_SLOTS.map((slot, i) => ({ ...slot, kind: harborKinds[i], ratio: harborKinds[i] === 'any' ? '3:1' : '2:1' })),
      robber: hexes.findIndex((h) => h.resource === 'desert'),
      pipsByResource,
      rules: ['no touching 6 and 8', 'no touching twins', 'base 19-hex bag', 'harbours shuffled'],
      attempts,
      share: `${CATAN_ORIGIN}/?seed=${encodeURIComponent(seed)}#forge`,
    };
  }
}

/** Probability of each 2d6 total, in 36ths. */
export const TWO_D6_WAYS: Record<number, number> = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

// ── Sealed tables ──────────────────────────────────────────────────────────

export const SEAL_ROLLS = 240;

const enc = new TextEncoder();

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Roll i of a sealed table: sha256(`${secret}:${i}`), then read bytes in order,
 * rejecting any byte ≥ 252 so each die is exactly uniform over 1-6.
 * (The chance of running out of 32 bytes is ~1e-50; we fall back to a rehash.)
 */
export async function sealRoll(secret: string, i: number): Promise<[number, number]> {
  let salt = '';
  for (;;) {
    const hex = await sha256Hex(`${secret}:${i}${salt}`);
    const dice: number[] = [];
    for (let b = 0; b < hex.length && dice.length < 2; b += 2) {
      const byte = parseInt(hex.slice(b, b + 2), 16);
      if (byte < 252) dice.push((byte % 6) + 1);
    }
    if (dice.length === 2) return [dice[0], dice[1]];
    salt += '+';
  }
}

export async function sealCommitment(secret: string): Promise<string> {
  return sha256Hex(`pointcast.catan.seal:${secret}`);
}

// ── Hosted tables (meetups) ────────────────────────────────────────────────

export const EDITIONS = ['base', '5-6 players', 'seafarers', 'cities & knights', 'traders & barbarians', 'explorers & pirates', 'starfarers', 'other'] as const;
export const PACES = ['new here', 'casual', 'sharp'] as const;
export type Edition = (typeof EDITIONS)[number];
export type Pace = (typeof PACES)[number];

export interface TableInput {
  title: string;
  city: string;
  venue: string;
  when: string;
  seats: number;
  edition: Edition;
  pace: Pace;
  host: string;
  note: string;
  link: string | null;
}

const CONTROL = /[\u0000-\u001f\u007f]/g;
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '');
const URLISH = /(https?:\/\/|www\.)/i;

export function cleanHandle(v: unknown): string {
  return clip(v, 32).replace(/[<>"'`]/g, '');
}

/** Validate a hosted table. Returns the clean shape or a human-readable error. */
export function validateTable(body: Record<string, unknown>, now = Date.now()): { ok: true; table: TableInput } | { ok: false; error: string } {
  const title = clip(body.title, 60);
  const city = clip(body.city, 60);
  const venue = clip(body.venue, 80);
  const note = clip(body.note, 280);
  const host = cleanHandle(body.host);
  if (!title) return { ok: false, error: 'title is required (60 characters max)' };
  if (!city) return { ok: false, error: 'city is required, e.g. "El Segundo, CA"' };
  if (!venue) return { ok: false, error: 'venue is required: a public place such as a game café, library or taproom' };
  if (!host) return { ok: false, error: 'host handle is required (32 characters max)' };
  for (const [k, v] of Object.entries({ title, city, venue, note, host })) {
    if (URLISH.test(v)) return { ok: false, error: `${k} cannot contain a link; use the link field` };
  }
  const t = Date.parse(String(body.when ?? ''));
  if (!Number.isFinite(t)) return { ok: false, error: 'when must be an ISO date-time, e.g. 2026-10-10T18:30:00-07:00' };
  if (t < now - 3600_000) return { ok: false, error: 'when is in the past' };
  if (t > now + 180 * 86400_000) return { ok: false, error: 'when must be within 180 days' };
  const seats = Number(body.seats ?? 4);
  if (!Number.isInteger(seats) || seats < 2 || seats > 6) return { ok: false, error: 'seats must be a whole number from 2 to 6' };
  const edition = String(body.edition ?? 'base').toLowerCase() as Edition;
  if (!EDITIONS.includes(edition)) return { ok: false, error: `edition must be one of: ${EDITIONS.join(', ')}` };
  const pace = String(body.pace ?? 'casual').toLowerCase() as Pace;
  if (!PACES.includes(pace)) return { ok: false, error: `pace must be one of: ${PACES.join(', ')}` };
  let link: string | null = null;
  if (body.link) {
    try {
      const u = new URL(String(body.link));
      if (u.protocol !== 'https:') throw new Error('https');
      link = u.toString().slice(0, 300);
    } catch {
      return { ok: false, error: 'link must be a full https:// URL (a Discord, Luma or club page)' };
    }
  }
  return { ok: true, table: { title, city, venue, when: new Date(t).toISOString(), seats, edition, pace, host, note, link } };
}

export const CATAN_ENDPOINTS = [
  { method: 'GET', href: '/api/catan/tables', label: 'Upcoming hosted tables (meetups), soonest first. ?city= filters by substring.' },
  { method: 'POST', href: '/api/catan/tables', label: 'Host a table: {title, city, venue, when, seats, edition, pace, host, note?, link?}. Returns hostKey once.' },
  { method: 'POST', href: '/api/catan/seat', label: 'Take a seat: {id, handle}. Or leave: {id, handle, leave:true}.' },
  { method: 'POST', href: '/api/catan/cancel', label: 'Cancel your table: {id, hostKey}.' },
  { method: 'GET', href: '/api/catan/board', label: 'Forge a balanced board: ?seed=any-words. Deterministic JSON.' },
  { method: 'GET', href: '/api/catan/seal', label: 'Read a sealed table: ?id=. Commitment, rolls so far, secret once revealed.' },
  { method: 'POST', href: '/api/catan/seal', label: 'Roll or reveal a sealed table: {id, rollKey, action:"roll"|"reveal"}.' },
  { method: 'GET', href: '/api/catan/daily', label: "The Daily Island: today's board, corner vertices, par, leaderboard. ?date= for past days (with the best pair revealed)." },
  { method: 'POST', href: '/api/catan/daily', label: 'Play the Daily Island: {handle, a, b, kind:"human"|"agent"}. One entry per handle per day.' },
  { method: 'GET', href: '/api/catan/ics', label: 'Tables as calendar: ?id= one invite, ?city= or nothing for a subscribable feed.' },
  { method: 'POST', href: '/api/agent/catan-seal', label: 'x402, 0.01 USDC on Etherlink: open a sealed table with a committed 240-roll dice stream.' },
] as const;

export const HOUSE_NOTES = [
  'Tables meet in public places: game cafés, libraries, taprooms, community rooms. Never post a home address.',
  'Handles only. No phone numbers or emails on the board; put a club link in the link field if you need one.',
  'Hosts get a one-time hostKey to cancel. Keep it.',
  'Unofficial fan site. CATAN is a trademark of CATAN GmbH; this site is not affiliated with or endorsed by CATAN GmbH or its publishers. All art is original.',
];

// ── The Daily Island (v2) ──────────────────────────────────────────────────
//
// One forged island per Pacific day. Pick two opening settlement corners;
// the score is production (pips), variety and harbour sense. Everyone —
// people and agents — plays the same island, and the best possible pair
// ("par") is computed by brute force so the leaderboard has a ceiling.

export const DAILY_EPOCH = '2026-09-29';

export function pacificDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function dailyNumber(date: string): number {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${DAILY_EPOCH}T12:00:00Z`)) / 86400_000) + 1;
}

export function dailySeed(date: string): string {
  return `daily-${date}`;
}

export interface IslandVertex {
  id: number;
  x: number;
  y: number;
  hexes: number[];
  /** index into HARBOR_SLOTS when this corner touches a harbour edge */
  slot: number | null;
  near: number[];
}

/** Every corner of the 19 land hexes, deduplicated, with adjacency. Unit hex size. */
export const ISLAND_VERTICES: IslandVertex[] = (() => {
  const key = (x: number, y: number) => `${Math.round(x * 1000)}:${Math.round(y * 1000)}`;
  const map = new Map<string, IslandVertex>();
  HEX_COORDS.forEach(({ q, r }, hex) => {
    const c = hexCenter(q, r);
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 180) * (60 * k - 30);
      const x = c.x + Math.cos(a);
      const y = c.y + Math.sin(a);
      const id = key(x, y);
      const v = map.get(id) ?? { id: 0, x, y, hexes: [], slot: null, near: [] };
      v.hexes.push(hex);
      map.set(id, v);
    }
  });
  const list = [...map.values()].sort((a, b) => a.y - b.y || a.x - b.x);
  list.forEach((v, i) => { v.id = i; });
  for (const v of list) {
    v.near = list.filter((w) => w !== v && Math.hypot(w.x - v.x, w.y - v.y) < 1.01).map((w) => w.id);
  }
  HARBOR_SLOTS.forEach(({ hex, dir }, slot) => {
    const { q, r } = HEX_COORDS[hex];
    const [dq, dr] = NEIGHBOR_DIRS[dir];
    const a = hexCenter(q, r);
    const b = hexCenter(q + dq, r + dr);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    for (const v of list) if (Math.abs(Math.hypot(v.x - mx, v.y - my) - 0.5) < 0.01) v.slot = slot;
  });
  return list;
})();

export interface OpeningScore {
  ok: boolean;
  error?: string;
  score: number;
  pips: number;
  variety: number;
  harbor: number;
  resources: Array<Exclude<Resource, 'desert'>>;
}

/** Score two opening settlements on a forged board. */
export function scoreOpening(board: ForgedBoard, a: number, b: number): OpeningScore {
  const empty = { score: 0, pips: 0, variety: 0, harbor: 0, resources: [] };
  const va = ISLAND_VERTICES[a];
  const vb = ISLAND_VERTICES[b];
  if (!Number.isInteger(a) || !Number.isInteger(b) || !va || !vb) return { ok: false, error: 'pick two corners by id', ...empty };
  if (a === b) return { ok: false, error: 'two different corners, please', ...empty };
  if (va.near.includes(b)) return { ok: false, error: 'the distance rule: settlements cannot sit on neighbouring corners', ...empty };
  let pipsTotal = 0;
  const produced = new Set<Exclude<Resource, 'desert'>>();
  for (const v of [va, vb]) {
    for (const h of v.hexes) {
      const hex = board.hexes[h];
      if (hex.resource === 'desert') continue;
      pipsTotal += hex.pips;
      produced.add(hex.resource);
    }
  }
  let harbor = 0;
  for (const v of [va, vb]) {
    if (v.slot === null) continue;
    const kind = board.harbors[v.slot].kind;
    if (kind === 'any') harbor += 1;
    else if (produced.has(kind)) harbor += 3;
  }
  const variety = produced.size * 2;
  return { ok: true, score: pipsTotal + variety + harbor, pips: pipsTotal, variety, harbor, resources: [...produced] };
}

/** The best opening on a board (brute force over ~1,400 legal pairs). */
export function bestOpening(board: ForgedBoard): { a: number; b: number; score: number } {
  let best = { a: 0, b: 0, score: -1 };
  for (let a = 0; a < ISLAND_VERTICES.length; a++) {
    for (let b = a + 1; b < ISLAND_VERTICES.length; b++) {
      const s = scoreOpening(board, a, b);
      if (s.ok && s.score > best.score) best = { a, b, score: s.score };
    }
  }
  return best;
}

export function shareLine(day: number, score: number, par: number): string {
  const filled = Math.max(0, Math.min(5, Math.round((score / Math.max(1, par)) * 5)));
  return `Hex & Harbor Daily Island #${day}\n${score}/${par} ${'⬢'.repeat(filled)}${'⬡'.repeat(5 - filled)}\n${CATAN_ORIGIN}/daily`;
}

export function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}
