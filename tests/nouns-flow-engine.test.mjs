import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceFlow, createFlow, FLOW_DURATION_MS, FLOW_PACES, hitFlow, pauseFlow, startFlow } from '../src/lib/nouns-flow-engine.mjs';

test('every pace produces a deterministic finite chart with notes aligned to its beat', () => {
  for (const [pace, settings] of Object.entries(FLOW_PACES)) {
    const first = createFlow({ pace }), second = createFlow({ pace });
    assert.deepEqual(first, second);
    assert.equal(first.status, 'ready');
    assert.equal(first.durationMs, FLOW_DURATION_MS);
    assert.ok(first.notes.length >= 30 && first.notes.length <= 65);
    const interval = 60000 / settings.bpm;
    for (const [index, note] of first.notes.entries()) {
      assert.equal(note.id, index);
      assert.ok([0, 1, 2].includes(note.lane));
      assert.equal(note.grade, 'pending');
      assert.ok(note.at > 1800 && note.at + settings.windowMs < FLOW_DURATION_MS);
      assert.ok(Math.abs(note.at / interval - Math.round(note.at / interval)) < .0001);
      if (index) assert.ok(Math.abs(note.at - first.notes[index - 1].at - interval) < .02);
    }
  }
  assert.ok(createFlow({ pace: 'playful' }).notes.length > createFlow({ pace: 'drift' }).notes.length);
});

test('precise timing gives more damage and points, and input cannot hit a note twice', () => {
  const original = startFlow(createFlow()), note = original.notes[0];
  const perfect = hitFlow(original, note.lane, note.at);
  const good = hitFlow(original, note.lane, note.at + 110);
  assert.equal(perfect.events[0].grade, 'perfect');
  assert.equal(good.events[0].grade, 'good');
  assert.ok(perfect.state.enemy < good.state.enemy);
  assert.ok(perfect.state.score > good.state.score);
  assert.equal(original.notes[0].grade, 'pending', 'the engine does not mutate previous state');
  const repeated = hitFlow(perfect.state, note.lane, note.at);
  assert.equal(repeated.state.score, perfect.state.score);
  assert.equal(repeated.state.combo, 1);
  assert.equal(repeated.events.length, 0);
});

test('wrong-lane, early, invalid, and out-of-window taps never earn a hit', () => {
  const state = startFlow(createFlow()), note = state.notes[0];
  for (const [lane, time] of [[(note.lane + 1) % 3, note.at], [note.lane, note.at - 201], [-1, note.at], [3, note.at], [0.5, note.at]]) {
    const result = hitFlow(state, lane, time);
    assert.equal(result.state.hits, 0);
    assert.equal(result.state.score, 0);
  }
  const late = hitFlow(state, note.lane, note.at + 201);
  assert.equal(late.state.hits, 0);
  assert.equal(late.state.misses, 1);
  assert.ok(late.state.health < 100);
});

test('each pace accepts its inclusive timing boundary and misses just outside it', () => {
  for (const [pace, { windowMs }] of Object.entries(FLOW_PACES)) {
    const state = startFlow(createFlow({ pace })), note = state.notes[0];
    assert.equal(hitFlow(state, note.lane, note.at + windowMs).state.hits, 1);
    assert.equal(hitFlow(state, note.lane, note.at - windowMs).state.hits, 1);
    assert.equal(hitFlow(state, note.lane, note.at + windowMs + .1).state.misses, 1);
  }
});

test('roughly65 percent good notes can clear every pace without perfect timing', () => {
  for (const pace of Object.keys(FLOW_PACES)) {
    let state = startFlow(createFlow({ pace }));
    const chart = state.notes, wanted = Math.ceil(chart.length * .65);
    for (const [index, note] of chart.entries()) {
      if (state.status !== 'playing') break;
      if (Math.floor((index + 1) * wanted / chart.length) > Math.floor(index * wanted / chart.length)) {
        state = hitFlow(state, note.lane, note.at + 110).state;
      } else state = advanceFlow(state, note.at + FLOW_PACES[pace].windowMs + 1).state;
    }
    state = advanceFlow(state, FLOW_DURATION_MS).state;
    assert.equal(state.status, 'won', `${pace} remains forgiving`);
    assert.equal(state.perfects, 0);
    assert.ok(state.health > 0);
    assert.ok(state.hits <= wanted);
  }
});

test('the practice buddy restores health every eight successful notes, even across a broken streak', () => {
  let state = startFlow(createFlow());
  const first = state.notes[0];
  state = advanceFlow(state, first.at + 201).state;
  const health = state.health;
  for (const note of state.notes.slice(1, 8)) state = hitFlow(state, note.lane, note.at).state;
  assert.equal(state.rescues, 0);
  const note = state.notes[8];
  const rescued = hitFlow(state, note.lane, note.at);
  assert.equal(rescued.events[0].rescue, true);
  assert.equal(rescued.state.rescues, 1);
  assert.equal(rescued.state.health, Math.min(100, health + 5));
});

test('a finite unattended battle loses and emits finish exactly once', () => {
  const result = advanceFlow(startFlow(createFlow()), FLOW_DURATION_MS + 10000);
  assert.equal(result.state.status, 'lost');
  assert.equal(result.state.elapsedMs, FLOW_DURATION_MS);
  assert.equal(result.state.health, 0);
  assert.equal(result.events.filter(event => event.type === 'finish').length, 1);
  assert.equal(advanceFlow(result.state, 999999).events.length, 0);
  assert.equal(hitFlow(result.state, 0, 999999).events.length, 0);
});

test('paused state does not advance, stale timestamps do not rewind, and invalid time is ignored', () => {
  const running = advanceFlow(startFlow(createFlow()), 1000).state;
  const paused = pauseFlow(running);
  assert.equal(advanceFlow(paused, 100000).state, paused);
  assert.equal(hitFlow(paused, 0, 100000).state, paused);
  const resumed = startFlow(paused);
  assert.equal(resumed.elapsedMs, 1000);
  assert.equal(advanceFlow(resumed, 10).state.elapsedMs, 1000);
  assert.equal(advanceFlow(resumed, Number.NaN).state, resumed);
  assert.equal(advanceFlow(resumed, Infinity).state, resumed);
  assert.equal(hitFlow(resumed, 0, Number.NaN).state, resumed);
});

test('world selection changes the lane pattern while a new session resets all earned state', () => {
  const garden = createFlow(), diner = createFlow({ world: 'rush' });
  assert.notDeepEqual(garden.notes.map(note => note.lane), diner.notes.map(note => note.lane));
  const running = startFlow(garden), note = running.notes[0];
  const played = hitFlow(running, note.lane, note.at).state;
  assert.ok(played.score > 0);
  const restarted = createFlow({ pace: played.pace, world: played.world });
  assert.deepEqual(restarted, garden);
  assert.throws(() => createFlow({ pace: 'instant' }), /Unknown pace/);
  assert.throws(() => createFlow({ world: 'unknown' }), /Unknown world/);
});

test('mistaps break a streak and cost one health with a shared200ms penalty cooldown', () => {
  let state = startFlow(createFlow());
  const note = state.notes[0];
  state = hitFlow(state, note.lane, note.at).state;
  assert.equal(state.combo, 1);
  const miss = hitFlow(state, (note.lane + 1) % 3, note.at + 100);
  assert.equal(miss.state.combo, 0);
  assert.equal(miss.state.health, 99);
  assert.equal(miss.events[0].type, 'mistap');
  const cooling = hitFlow(miss.state, (note.lane + 2) % 3, note.at + 200);
  assert.equal(cooling.state.health, 99);
  const next = hitFlow(cooling.state, (note.lane + 1) % 3, note.at + 300);
  assert.equal(next.state.health, 98);
});

test('mashing all three lanes cannot sweep a chart or win without choosing its notes', () => {
  for (const pace of Object.keys(FLOW_PACES)) {
    let state = startFlow(createFlow({ pace }));
    for (let elapsed = 0; elapsed <= FLOW_DURATION_MS && state.status === 'playing'; elapsed += 50) {
      for (let lane = 0; lane < 3; lane++) state = hitFlow(state, lane, elapsed).state;
    }
    assert.equal(state.status, 'lost', pace);
    assert.ok(state.enemy > 0);
    assert.ok(state.hits < state.notes.length / 2);
  }
});
