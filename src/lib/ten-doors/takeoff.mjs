/**
 * Takeoff Organ v2: a small, deterministic flight-and-music state machine.
 * No clocks, rendering, audio, storage or network access live here. A caller
 * supplies visible elapsed time; pausing and changing rooms cannot earn goals.
 */

export const SCALE = Object.freeze([50, 53, 55, 57, 60, 62, 65, 67]);
export const NOTES = Object.freeze(['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4']);
export const FLIGHT_MS = 3600;
export const MAX_PLANES = 12;

export const PLANS = Object.freeze([
  { id: 'first-light', title: 'First light', hint: 'Let a little open D chord rise over the bay.', lanes: [0, 3, 5] },
  { id: 'sea-glass', title: 'Sea glass', hint: 'Send a bright F chord out over the water.', lanes: [1, 4, 6] },
  { id: 'golden-hour', title: 'Golden hour', hint: 'Three warm notes for a golden little sky.', lanes: [1, 3, 4] },
  { id: 'blue-horizon', title: 'Blue horizon', hint: 'Give the horizon a wide, ringing G chord.', lanes: [2, 5, 7] },
  { id: 'evening-glow', title: 'Evening glow', hint: 'A soft D minor chord to finish the evening.', lanes: [0, 1, 3] },
].map((plan) => Object.freeze({ ...plan, lanes: Object.freeze(plan.lanes) })));

const validPlanIndex = (value) => Number.isInteger(value) && value >= 0 && value < PLANS.length;
const validLane = (value) => Number.isInteger(value) && value >= 0 && value < SCALE.length;
const increment = (value, amount = 1) => Math.min(Number.MAX_SAFE_INTEGER, value + amount);

/** Read only earned, bounded progress. Active planes are never restored. */
export function normalizeRecord(value) {
  const record = value && typeof value === 'object' && !Array.isArray(value) && value.version === 2 ? value : {};
  const stamps = Array.isArray(record.stamps) ? record.stamps : [];
  return {
    version: 2,
    planIndex: validPlanIndex(record.planIndex) ? record.planIndex : 0,
    stamps: PLANS.filter((plan) => stamps.includes(plan.id)).map((plan) => plan.id),
  };
}

export function createSession(record) {
  const saved = normalizeRecord(record);
  return {
    mode: 'guide',
    planIndex: saved.planIndex,
    stamps: saved.stamps,
    planes: [],
    arrived: [],
    phase: 'playing',
    paused: false,
    nextId: 1,
    launched: 0,
    landed: 0,
  };
}

export function toRecord(state) {
  return normalizeRecord({ version: 2, planIndex: state.planIndex, stamps: state.stamps });
}

/** Any valid note is welcome. Only its first pending departure earns a goal. */
export function launch(state, lane) {
  const reject = (reason) => ({ state, accepted: false, matched: false, reason, plane: null });
  if (!validLane(lane)) return reject('invalid-lane');
  if (state.paused) return reject('paused');
  if (state.planes.length >= MAX_PLANES) return reject('sky-full');

  const matched = state.mode === 'guide' && state.phase === 'playing' &&
    PLANS[state.planIndex].lanes.includes(lane) && !state.arrived.includes(lane) &&
    !state.planes.some((plane) => plane.goal && plane.lane === lane);
  const plane = { id: state.nextId, lane, ageMs: 0, durationMs: FLIGHT_MS, goal: matched };
  return {
    state: {
      ...state,
      planes: [...state.planes, plane],
      nextId: increment(state.nextId),
      launched: increment(state.launched),
    },
    accepted: true,
    matched,
    reason: null,
    plane,
  };
}

/**
 * Advance a visible flight. Reduced motion can settle the same departures
 * immediately; it does not change which notes qualify for a chord.
 */
export function advance(state, dtMs, { instant = false } = {}) {
  const unchanged = () => ({ state, arrivals: [], completed: false });
  if (state.paused || state.planes.length === 0) return unchanged();
  const delta = typeof dtMs === 'number' && Number.isFinite(dtMs) && dtMs > 0 ? Math.min(dtMs, 60000) : 0;
  if (!instant && delta === 0) return unchanged();

  const arrivals = [], planes = [];
  for (const plane of state.planes) {
    const ageMs = instant ? plane.durationMs : Math.min(plane.durationMs, plane.ageMs + delta);
    // Tiny float differences between 60 Hz and 120 Hz must not add a frame.
    if (ageMs >= plane.durationMs - 1e-7) arrivals.push({ ...plane, ageMs: plane.durationMs });
    else planes.push({ ...plane, ageMs });
  }

  let arrived = state.arrived;
  let phase = state.phase;
  let stamps = state.stamps;
  let completed = false;
  if (state.mode === 'guide' && state.phase === 'playing') {
    const lanes = PLANS[state.planIndex].lanes;
    const earned = new Set([...state.arrived, ...arrivals.filter((plane) => plane.goal).map((plane) => plane.lane)]);
    arrived = lanes.filter((lane) => earned.has(lane));
    if (arrived.length === lanes.length) {
      phase = 'complete';
      completed = true;
      const id = PLANS[state.planIndex].id;
      if (!stamps.includes(id)) stamps = [...stamps, id];
    }
  }
  return {
    state: { ...state, planes, arrived, phase, stamps, landed: increment(state.landed, arrivals.length) },
    arrivals,
    completed,
  };
}

export function setPaused(state, paused) {
  const value = Boolean(paused);
  return state.paused === value ? state : { ...state, paused: value };
}

function freshPlan(state, mode, planIndex) {
  return { ...state, mode, planIndex, planes: [], arrived: [], phase: 'playing', paused: false };
}

export function setMode(state, mode) {
  return mode === 'guide' || mode === 'free' ? freshPlan(state, mode, state.planIndex) : state;
}

export function restartPlan(state) {
  return freshPlan(state, state.mode, state.planIndex);
}

export function nextPlan(state) {
  if (state.mode !== 'guide' || state.phase !== 'complete') return state;
  return freshPlan(state, state.mode, (state.planIndex + 1) % PLANS.length);
}
