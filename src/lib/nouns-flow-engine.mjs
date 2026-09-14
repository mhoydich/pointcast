/** A finite local rhythm battle. All times are active-play milliseconds. */
export const FLOW_DURATION_MS = 35000;
export const FLOW_LOOKAHEAD_MS = 1800;
export const FLOW_PACES = Object.freeze({
  drift: Object.freeze({ bpm: 72, windowMs: 260, perfectMs: 90 }),
  gentle: Object.freeze({ bpm: 96, windowMs: 200, perfectMs: 90 }),
  playful: Object.freeze({ bpm: 120, windowMs: 160, perfectMs: 90 }),
});
const worlds = ['garden', 'rush', 'shell', 'storm'];
const pattern = [0, 1, 2, 1, 0, 2, 0, 1, 2, 2, 1, 0, 1, 2, 0, 1];
const round = number => Math.round(number * 100) / 100;

export function createFlow({ pace = 'gentle', world = 'garden' } = {}) {
  if (!Object.hasOwn(FLOW_PACES, pace)) throw new RangeError('Unknown pace');
  if (!worlds.includes(world)) throw new RangeError('Unknown world');
  const interval = 60000 / FLOW_PACES[pace].bpm;
  const leadIn = Math.ceil(FLOW_LOOKAHEAD_MS / interval) * interval;
  const worldOffset = worlds.indexOf(world);
  const notes = [];
  for (let index = 0, at = leadIn; at <= FLOW_DURATION_MS - 2200; index++, at = leadIn + index * interval) {
    notes.push({ id: index, lane: (pattern[index % pattern.length] + worldOffset) % 3, at: round(at), grade: 'pending' });
  }
  return {
    pace, world, status: 'ready', elapsedMs: 0, durationMs: FLOW_DURATION_MS, notes,
    health: 100, enemy: 100, score: 0, combo: 0, bestCombo: 0,
    hits: 0, misses: 0, perfects: 0, rescues: 0, mistaps: 0, lastMistapMs: -1000, lastTapMs: -1000,
  };
}

export function startFlow(state) {
  return state.status === 'ready' || state.status === 'paused' ? { ...state, status: 'playing' } : state;
}

export function pauseFlow(state) {
  return state.status === 'playing' ? { ...state, status: 'paused' } : state;
}

function finish(state, events) {
  if (state.health <= 0 || state.enemy <= 0 || state.elapsedMs >= state.durationMs) {
    state = { ...state, status: state.health > 0 && state.enemy <= 0 ? 'won' : 'lost' };
    events.push({ type: 'finish', status: state.status, score: state.score, combo: state.combo, elapsedMs: state.elapsedMs });
  }
  return state;
}

export function advanceFlow(previous, elapsedMs) {
  if (previous.status !== 'playing' || !Number.isFinite(elapsedMs)) return { state: previous, events: [] };
  let state = { ...previous, elapsedMs: Math.min(previous.durationMs, Math.max(previous.elapsedMs, elapsedMs)) };
  const events = [];
  const windowMs = FLOW_PACES[state.pace].windowMs;
  const expired = state.notes.filter(note => note.grade === 'pending' && state.elapsedMs > note.at + windowMs);
  if (expired.length) {
    state.notes = [...state.notes];
    const penalty = 100 / (state.notes.length * .75);
    for (const note of expired) {
      state.notes[note.id] = { ...note, grade: 'miss' };
      state.health = round(Math.max(0, state.health - penalty));
      state.combo = 0; state.misses++;
      events.push({ type: 'miss', lane: note.lane, noteId: note.id, combo: 0, health: state.health, elapsedMs: state.elapsedMs });
      if (state.health <= 0) break;
    }
  }
  state = finish(state, events);
  return { state, events };
}

export function hitFlow(previous, lane, elapsedMs) {
  if (!Number.isInteger(lane) || lane < 0 || lane > 2 || !Number.isFinite(elapsedMs)) return { state: previous, events: [] };
  const advanced = advanceFlow(previous, elapsedMs);
  let { state } = advanced;
  const events = [...advanced.events];
  if (state.status !== 'playing') return { state, events };
  // This chart has single notes, never chords. A brief shared debounce makes
  // each tap choose one lane instead of sweeping all three simultaneously.
  if (state.elapsedMs - state.lastTapMs < 80) return { state, events };
  state = { ...state, lastTapMs: state.elapsedMs };
  const timing = FLOW_PACES[state.pace];
  const candidate = state.notes.filter(note => note.grade === 'pending' && note.lane === lane && Math.abs(note.at - state.elapsedMs) <= timing.windowMs)
    .sort((a, b) => Math.abs(a.at - state.elapsedMs) - Math.abs(b.at - state.elapsedMs))[0];
  if (!candidate) {
    const penalized = state.elapsedMs - state.lastMistapMs >= 200;
    state = { ...state, combo: 0 };
    if (penalized) {
      state.health = Math.max(0, round(state.health - 1)); state.mistaps++; state.lastMistapMs = state.elapsedMs;
      events.push({ type: 'mistap', lane, combo: 0, health: state.health, elapsedMs: state.elapsedMs });
      state = finish(state, events);
    }
    return { state, events };
  }
  const grade = Math.abs(candidate.at - state.elapsedMs) <= timing.perfectMs ? 'perfect' : 'good';
  const combo = state.combo + 1;
  const damage = round(100 / (state.notes.length * .65) * (grade === 'perfect' ? 1.25 : 1) * (1 + Math.min(.2, Math.floor(combo / 8) * .04)));
  const hits = state.hits + 1;
  const rescue = hits % 8 === 0;
  state = {
    ...state, notes: state.notes.map(note => note.id === candidate.id ? { ...note, grade } : note),
    enemy: round(Math.max(0, state.enemy - damage)), score: state.score + (grade === 'perfect' ? 150 : 100) + Math.min(100, combo * 5),
    combo, bestCombo: Math.max(state.bestCombo, combo), hits,
    perfects: state.perfects + Number(grade === 'perfect'),
    health: rescue ? Math.min(100, state.health + 5) : state.health,
    rescues: state.rescues + Number(rescue),
  };
  events.push({ type: 'hit', lane, noteId: candidate.id, grade, combo, score: state.score, damage, rescue, health: state.health, elapsedMs: state.elapsedMs });
  state = finish(state, events);
  return { state, events };
}
