import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCALE, NOTES, FLIGHT_MS, MAX_PLANES, PLANS, normalizeRecord, createSession,
  toRecord, launch, advance, setPaused, setMode, restartPlan, nextPlan,
} from '../src/lib/ten-doors/takeoff.mjs';

const send = (state, ...lanes) => lanes.reduce((current, lane) => launch(current, lane).state, state);
const chord = (state) => send(state, ...PLANS[state.planIndex].lanes);
function freeze(value) {
  if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

test('the eight-note instrument and five finite chord invitations retain their musical identities', () => {
  assert.deepEqual(SCALE, [50, 53, 55, 57, 60, 62, 65, 67]);
  assert.deepEqual(NOTES, ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4']);
  assert.equal(PLANS.length, 5);
  assert.equal(new Set(PLANS.map((plan) => plan.id)).size, PLANS.length);
  for (const plan of PLANS) {
    assert.equal(plan.lanes.length, 3);
    assert.equal(new Set(plan.lanes).size, 3);
    assert.ok(plan.lanes.every((lane) => Number.isInteger(lane) && lane >= 0 && lane < SCALE.length));
    assert.ok(plan.title && plan.hint);
  }
});

test('a goal is earned by an actual arrival, while wrong and duplicate notes remain welcome', () => {
  let state = createSession();
  const target = PLANS[0].lanes[0];
  const other = SCALE.findIndex((_, lane) => !PLANS[0].lanes.includes(lane));
  const first = launch(state, target); state = first.state;
  const duplicate = launch(state, target); state = duplicate.state;
  const wrong = launch(state, other); state = wrong.state;
  assert.equal(first.matched, true);
  assert.equal(duplicate.accepted, true);
  assert.equal(duplicate.matched, false);
  assert.equal(wrong.accepted, true);
  assert.equal(wrong.matched, false);
  assert.deepEqual(state.arrived, []);
  assert.equal(state.launched, 3);
  const before = advance(state, FLIGHT_MS - 1);
  assert.deepEqual(before.state.arrived, []);
  const landed = advance(before.state, 1);
  assert.equal(landed.arrivals.length, 3);
  assert.deepEqual(landed.state.arrived, [target]);
  assert.equal(landed.state.landed, 3);
  assert.equal(landed.completed, false);
  assert.equal(landed.state.phase, 'playing');
});

test('60 Hz and 120 Hz reach the same flight state at the same elapsed time', () => {
  const finishAt = (fps) => {
    let state = chord(createSession());
    let completions = 0;
    for (let frame = 0; frame < FLIGHT_MS / 1000 * fps; frame++) {
      const step = advance(state, 1000 / fps);
      state = step.state; completions += Number(step.completed);
    }
    return { state, completions };
  };
  const sixty = finishAt(60), fast = finishAt(120);
  assert.equal(sixty.completions, 1);
  assert.equal(fast.completions, 1);
  assert.deepEqual(sixty.state, fast.state);
  assert.equal(sixty.state.phase, 'complete');
  assert.equal(sixty.state.planes.length, 0);
});

test('completion and its unique stamp occur once per real chord, including repeated play', () => {
  let state = chord(createSession());
  let result = advance(state, FLIGHT_MS); state = result.state;
  assert.equal(result.completed, true);
  assert.deepEqual(state.stamps, [PLANS[0].id]);
  assert.equal(advance(state, 100).completed, false);
  result = advance(send(state, ...PLANS[0].lanes), FLIGHT_MS); state = result.state;
  assert.equal(result.completed, false, 'extra notes after a complete invitation do not earn another completion');
  assert.deepEqual(state.stamps, [PLANS[0].id]);
  result = advance(chord(restartPlan(state)), FLIGHT_MS);
  assert.equal(result.completed, true, 'a deliberately repeated chord is a new completed round');
  assert.deepEqual(result.state.stamps, [PLANS[0].id], 'unique progress never becomes a fake duplicate stamp');
});

test('pause freezes both flight time and progress and rejects accidental launches', () => {
  let state = advance(chord(createSession()), 900).state;
  const paused = setPaused(state, true);
  const wait = advance(paused, 60000, { instant: true });
  assert.equal(wait.state, paused);
  assert.deepEqual(wait.arrivals, []);
  assert.equal(wait.completed, false);
  const blocked = launch(paused, 1);
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.reason, 'paused');
  assert.equal(blocked.state.launched, paused.launched);
  state = advance(setPaused(paused, false), FLIGHT_MS - 900).state;
  assert.equal(state.phase, 'complete');
});

test('rapid tapping is bounded without evicting a pending goal or inventing departures', () => {
  let state = chord(createSession());
  while (state.planes.length < MAX_PLANES) state = launch(state, 7).state;
  const waitingIds = state.planes.filter((plane) => plane.goal).map((plane) => plane.id);
  for (let i = 0; i < 500; i++) {
    const rejected = launch(state, i % SCALE.length);
    assert.equal(rejected.accepted, false);
    assert.equal(rejected.reason, 'sky-full');
    state = rejected.state;
  }
  assert.equal(state.planes.length, MAX_PLANES);
  assert.equal(state.launched, MAX_PLANES);
  assert.deepEqual(state.planes.filter((plane) => plane.goal).map((plane) => plane.id), waitingIds);
  const settled = advance(state, FLIGHT_MS);
  assert.equal(settled.state.landed, MAX_PLANES);
  assert.equal(settled.completed, true);
  assert.equal(launch(settled.state, 0).accepted, true);
});

test('changing mode or restarting cancels pending goals without deleting earned progress', () => {
  let state = advance(chord(createSession()), FLIGHT_MS).state;
  state = nextPlan(state);
  state = chord(state);
  const stamps = state.stamps;
  const launched = state.launched;
  const free = setMode(state, 'free');
  assert.equal(free.planes.length, 0);
  assert.deepEqual(free.arrived, []);
  assert.deepEqual(free.stamps, stamps);
  assert.equal(free.launched, launched);
  const freeNotes = advance(chord(free), FLIGHT_MS);
  assert.equal(freeNotes.completed, false);
  assert.deepEqual(freeNotes.state.arrived, []);
  assert.deepEqual(freeNotes.state.stamps, stamps);
  const guided = setMode(freeNotes.state, 'guide');
  assert.equal(guided.planIndex, state.planIndex);
  const restarted = restartPlan(setPaused(chord(guided), true));
  assert.equal(restarted.paused, false);
  assert.equal(restarted.planes.length, 0);
  assert.equal(restarted.phase, 'playing');
  assert.deepEqual(restarted.stamps, stamps);
  assert.equal(advance(restarted, FLIGHT_MS).completed, false);
});

test('reduced motion settles the same accepted notes immediately', () => {
  const state = chord(createSession());
  const instant = advance(state, 0, { instant: true });
  const ordinary = advance(state, FLIGHT_MS);
  assert.deepEqual(instant, ordinary);
  assert.equal(instant.completed, true);
});

test('five invitations cycle explicitly and saved progress contains only earned unique stamps', () => {
  let state = createSession();
  assert.equal(nextPlan(state), state, 'there is no automatic progression before a chord is complete');
  for (let i = 0; i < PLANS.length; i++) {
    assert.equal(state.planIndex, i);
    state = advance(chord(state), FLIGHT_MS).state;
    assert.equal(state.stamps.length, i + 1);
    state = nextPlan(state);
  }
  assert.equal(state.planIndex, 0);
  assert.equal(state.phase, 'playing');
  assert.deepEqual(Object.keys(toRecord(state)), ['version', 'planIndex', 'stamps']);
  assert.deepEqual(toRecord(state).stamps, PLANS.map((plan) => plan.id));
  const restored = createSession(toRecord(chord(state)));
  assert.deepEqual(restored.planes, [], 'an in-flight note cannot be restored as an earned goal');
  assert.deepEqual(restored.arrived, []);
  assert.equal(restored.launched, 0);
  assert.equal(restored.landed, 0);
});

test('malformed and future-version records cannot create invalid plans or stamps', () => {
  for (const value of [null, undefined, false, 2, 'bad', [], {}, { version: 3, planIndex: 4, stamps: ['first-light'] }]) {
    assert.deepEqual(normalizeRecord(value), { version: 2, planIndex: 0, stamps: [] });
  }
  for (const planIndex of [-1, PLANS.length, 0.5, NaN, Infinity, '2', null]) {
    assert.equal(normalizeRecord({ version: 2, planIndex, stamps: [] }).planIndex, 0);
  }
  const saved = normalizeRecord({ version: 2, planIndex: 2, stamps: ['sea-glass', 'first-light', 'sea-glass', '__proto__', {}, null] });
  assert.deepEqual(saved, { version: 2, planIndex: 2, stamps: ['first-light', 'sea-glass'] });
  assert.deepEqual(normalizeRecord({ version: 2, planIndex: 1, stamps: 'first-light' }).stamps, []);
});

test('invalid lanes and time values have no side effects', () => {
  const state = freeze(chord(createSession()));
  for (const lane of [-1, 8, 1.5, '1', NaN, null, Infinity]) {
    const result = launch(state, lane);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, 'invalid-lane');
    assert.equal(result.state, state);
  }
  for (const delta of [0, -10, NaN, Infinity, '1000', null, undefined]) {
    const result = advance(state, delta);
    assert.equal(result.state, state);
    assert.deepEqual(result.arrivals, []);
  }
  assert.equal(setMode(state, 'unknown'), state);
});

test('engine transitions never mutate their input and replay deterministically', () => {
  const run = () => {
    const first = freeze(createSession());
    const sent = launch(first, 0);
    assert.equal(first.planes.length, 0);
    const airborne = freeze(sent.state);
    const moved = advance(airborne, 300);
    assert.equal(airborne.planes[0].ageMs, 0);
    assert.equal(moved.state.planes[0].ageMs, 300);
    const paused = setPaused(freeze(moved.state), true);
    const reset = restartPlan(freeze(paused));
    const complete = advance(freeze(chord(reset)), FLIGHT_MS).state;
    return nextPlan(freeze(complete));
  };
  assert.deepEqual(run(), run());
});
