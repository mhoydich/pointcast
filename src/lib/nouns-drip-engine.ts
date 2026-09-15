/** A small, forgiving toy: every visible Noun can be popped at any time. */
export const DRIP_DURATION_MS = 35000;
export const DRIP_GOAL = 12;
export const DRIP_MAX_NOUNS = 6;
export const DRIP_INTERVAL_MS = 900;
export type DripPhase = 'gather' | 'groove' | 'fire' | 'finale';
export const dripPhase = (count: number): DripPhase => count >= DRIP_GOAL ? 'finale' : count >= 8 ? 'fire' : count >= 4 ? 'groove' : 'gather';
export type DripNoun = { id: number; slot: number; lane: number; rosterIndex: number; bornAt: number };
export type DripState = {
  status: 'ready' | 'playing' | 'paused' | 'finished';
  elapsedMs: number; durationMs: number; count: number; score: number;
  phase: DripPhase; levelComplete: boolean;
  nextId: number; nextAt: number; seed: number; nouns: DripNoun[]; collected: number[];
};
type DripProgress = { count: number; score: number; phase: DripPhase; goal: number; levelComplete: boolean };
export type DripEvent = (DripProgress & { type: 'pop'; nodeId: number; lane: number; rosterIndex: number; milestone: 4 | 8 | 12 | null })
  | (DripProgress & { type: 'finish' });
export type DripTransition = { state: DripState; events: DripEvent[] };
const noun = (id: number, slot: number, bornAt: number, seed: number): DripNoun => ({
  id, slot, lane: slot % 3, rosterIndex: (id + seed) % 8, bornAt,
});

export function createDrip(seed = 0): DripState {
  const safeSeed = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % 8 : 0;
  return { status: 'ready', elapsedMs: 0, durationMs: DRIP_DURATION_MS, count: 0, score: 0,
    phase: 'gather', levelComplete: false,
    nextId: 3, nextAt: DRIP_INTERVAL_MS, seed: safeSeed, collected: [],
    nouns: [0, 1, 2].map(slot => noun(slot, slot, -6000, safeSeed)) };
}
export const startDrip = (state: DripState): DripState => state.status === 'ready' || state.status === 'paused' ? { ...state, status: 'playing' } : state;
export const pauseDrip = (state: DripState): DripState => state.status === 'playing' ? { ...state, status: 'paused' } : state;

export function advanceDrip(previous: DripState, elapsedMs: number): DripTransition {
  if (previous.status !== 'playing' || !Number.isFinite(elapsedMs)) return { state: previous, events: [] };
  const elapsed = Math.max(previous.elapsedMs, Math.min(previous.durationMs, elapsedMs));
  if (elapsed >= previous.durationMs) {
    const state: DripState = { ...previous, elapsedMs: elapsed, status: 'finished' };
    return { state, events: [{ type: 'finish', count: state.count, score: state.score,
      phase: state.phase, goal: DRIP_GOAL, levelComplete: state.levelComplete }] };
  }
  const state = { ...previous, elapsedMs: elapsed, nouns: [...previous.nouns] };
  if (elapsed >= state.nextAt) {
    // Skip stale spawn intervals instead of emitting a catch-up shower.
    state.nextAt = elapsed + DRIP_INTERVAL_MS;
    if (state.nouns.length < DRIP_MAX_NOUNS) {
      const slot = Array.from({ length: DRIP_MAX_NOUNS }, (_, index) => index).find(index => !state.nouns.some(item => item.slot === index))!;
      state.nouns.push(noun(state.nextId++, slot, elapsed, state.seed));
    }
  }
  return { state, events: [] };
}

export function popDrip(previous: DripState, nodeId: number, elapsedMs: number): DripTransition {
  if (!Number.isFinite(elapsedMs)) return { state: previous, events: [] };
  const advanced = advanceDrip(previous, elapsedMs), state = advanced.state;
  if (state.status !== 'playing' || !Number.isInteger(nodeId)) return advanced;
  const target = state.nouns.find(item => item.id === nodeId);
  if (!target) return advanced;
  const count = state.count + 1, score = count * 10, phase = dripPhase(count), levelComplete = count >= DRIP_GOAL;
  const milestone = count === 4 || count === 8 || count === 12 ? count : null;
  return { state: { ...state, count, score, phase, levelComplete, nouns: state.nouns.filter(item => item.id !== nodeId),
    nextAt: Math.min(state.nextAt, state.elapsedMs + 350), collected: [...new Set([...state.collected, target.rosterIndex])] },
    events: [...advanced.events, { type: 'pop', nodeId, lane: target.lane, count, score, rosterIndex: target.rosterIndex,
      phase, goal: DRIP_GOAL, levelComplete, milestone }] };
}
