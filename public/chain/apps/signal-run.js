// Signal Run rules. Local gameplay is replayable, never a trusted score oracle.
export const VERSION = 'signal-run/v1';
export const SIZE = 7;
export const STAGES = 3;
export const DIRECTIONS = Object.freeze({ U: -7, D: 7, L: -1, R: 1 });
export const STAGE_NAMES = ['The arrival', 'Crossed signals', 'Last light'];

export function validDay(day) {
  if (typeof day !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(day)) return false;
  const date = new Date(day + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day;
}
export function utcDay(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); }
function random(seed) {
  let n = 2166136261;
  for (const ch of seed) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
  return () => { n ^= n << 13; n ^= n >>> 17; n ^= n << 5; return (n >>> 0) / 4294967296; };
}
export function neighbor(pos, dir) {
  const next = pos + DIRECTIONS[dir];
  if (!Number.isInteger(next) || next < 0 || next >= 49) return -1;
  if ((dir === 'L' || dir === 'R') && Math.floor(next / 7) !== Math.floor(pos / 7)) return -1;
  return next;
}
function maskAt(map, pos, mask) {
  const i = map.shards.indexOf(pos);
  return i < 0 ? mask : mask | (1 << i);
}
// BFS over (position, collected shards), also used to guarantee every map is solvable.
export function shortestRoute(map, pos = map.start, mask = 0) {
  const queue = [{ pos, mask, route: '' }], seen = new Set([pos + ':' + mask]);
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i];
    if (at.pos === map.exit && at.mask === 7) return at.route;
    for (const dir of Object.keys(DIRECTIONS)) {
      const to = neighbor(at.pos, dir);
      if (to < 0 || map.walls.includes(to)) continue;
      const m = maskAt(map, to, at.mask), id = to + ':' + m;
      if (seen.has(id)) continue;
      seen.add(id); queue.push({ pos: to, mask: m, route: at.route + dir });
    }
  }
  return null;
}
export function makeMap(day, stage = 0) {
  if (!validDay(day) || !Number.isInteger(stage) || stage < 0 || stage >= STAGES) throw new Error('Invalid event or stage');
  const rng = random(VERSION + ':' + day + ':' + stage);
  const map = { start: 0, exit: 48, shards: [6, 24, 42], walls: [], stage };
  const reserved = [map.start, map.exit, ...map.shards];
  const candidates = Array.from({ length: 49 }, (_, i) => i).filter(i => !reserved.includes(i));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (const cell of candidates) {
    map.walls.push(cell);
    if (shortestRoute(map) === null) map.walls.pop();
    if (map.walls.length >= 10 + stage * 2) break;
  }
  map.optimal = shortestRoute(map).length;
  map.budget = map.optimal + [10, 8, 6][stage];
  return map;
}
export function initialState(map) { return { pos: map.start, mask: 0, route: '', status: 'playing' }; }
export function move(map, state, dir) {
  if (state.status !== 'playing') return state;
  const pos = neighbor(state.pos, dir);
  if (pos < 0 || map.walls.includes(pos)) return state;
  const mask = maskAt(map, pos, state.mask), route = state.route + dir;
  const status = pos === map.exit && mask === 7 ? 'won' : route.length >= map.budget ? 'lost' : 'playing';
  return { pos, mask, route, status };
}
export function replay(map, route) {
  if (typeof route !== 'string' || route.length > map.budget || /[^UDLR]/.test(route)) return null;
  let state = initialState(map);
  for (const dir of route) {
    const next = move(map, state, dir);
    if (next === state) return null; // no walls, no steps after the finish
    state = next;
  }
  return state;
}
export function completedEvent(value) {
  if (!value || !validDay(value.day) || !Array.isArray(value.routes) || value.routes.length !== STAGES) return null;
  const routes = value.routes;
  let moves = 0, spare = 0;
  for (let stage = 0; stage < STAGES; stage++) {
    const map = makeMap(value.day, stage), state = replay(map, routes[stage]);
    if (!state || state.status !== 'won') return null;
    moves += state.route.length; spare += map.budget - state.route.length;
  }
  return { version: VERSION, day: value.day, routes: [...routes], assisted: value.assisted === true, moves, spare };
}
export function eventBody(event) {
  const e = completedEvent(event);
  if (!e) throw new Error('Complete all three stages before preparing a receipt');
  return [VERSION, 'event:' + e.day, 'stages:3', 'moves:' + e.moves, 'spare:' + e.spare,
    'hints:' + (e.assisted ? 'yes' : 'no'), 'routes:' + e.routes.join('/'),
    'claim:player-reported; browser-replayable; not an independently verified score',
    'kind:participation receipt; not a token or ownership certificate'].join('\n');
}
export function loadPassport(storage, slot) {
  try {
    const values = JSON.parse(storage.getItem(slot));
    if (!Array.isArray(values)) return [];
    const found = new Map();
    for (const value of values.slice(0, 30)) {
      try { const e = completedEvent(value); if (e && !found.has(e.day)) found.set(e.day, e); } catch { /* malformed local data */ }
    }
    return [...found.values()].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 14);
  } catch { return []; }
}
