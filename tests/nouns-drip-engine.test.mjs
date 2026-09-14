import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceDrip, createDrip, DRIP_MAX_NOUNS, pauseDrip, popDrip, startDrip } from '../src/lib/nouns-drip-engine.ts';

test('a fresh shower has three immediate Nouns and any visible Noun can be popped without a timing window', () => {
  let state = startDrip(createDrip());
  assert.equal(state.nouns.length, 3);
  const instant = popDrip(state, state.nouns[0].id, 0);
  assert.equal(instant.state.count, 1);
  state = advanceDrip(instant.state, 1000).state;
  const falling = state.nouns.at(-1);
  assert.equal(falling.bornAt, 1000);
  assert.equal(popDrip(state, falling.id, 1000).state.count, 2, 'newly arriving Nouns are immediately tappable');
  const old = state.nouns[0];
  assert.equal(popDrip(state, old.id, 30000).state.count, 2, 'settled Nouns remain tappable much later');
});

test('distinct simultaneous pops count, while duplicate and invalid targets do not', () => {
  const initial = startDrip(createDrip());
  const first = popDrip(initial, 0, 20);
  const second = popDrip(first.state, 1, 20);
  assert.equal(second.state.count, 2);
  assert.equal(second.state.score, 20);
  for (const id of [0, -1, 100000, 1.5, NaN]) assert.equal(popDrip(second.state, id, 20).state.count, 2);
  assert.equal(popDrip(second.state, 2, NaN).state.count, 2);
  assert.equal(initial.count, 0, 'transitions leave prior state unchanged');
});

test('waiting is harmless, Nouns and collections are bounded, and missed frames never create a catch-up shower', () => {
  let state = startDrip(createDrip());
  state = advanceDrip(state, 12000).state;
  assert.equal(state.nouns.length, 4, 'one arrival after a long frame gap');
  for (let elapsed = 13000; elapsed < 35000; elapsed += 1000) state = advanceDrip(state, elapsed).state;
  assert.equal(state.nouns.length, DRIP_MAX_NOUNS);
  assert.equal(new Set(state.nouns.map(item => item.slot)).size, DRIP_MAX_NOUNS);
  assert.equal(state.count, 0); assert.equal(state.score, 0);
  assert.equal(state.status, 'playing');
  state = startDrip(createDrip());
  for (let elapsed = 0; elapsed < 35000; elapsed += 100) {
    state = advanceDrip(state, elapsed).state;
    if (state.nouns[0]) state = popDrip(state, state.nouns[0].id, elapsed).state;
    assert.ok(state.nouns.length <= DRIP_MAX_NOUNS); assert.ok(state.collected.length <= 8);
  }
  assert.ok(state.count > 20);
});

test('pause freezes play, time never reverses, and completion occurs once without a loss state', () => {
  let state = advanceDrip(startDrip(createDrip()), 4000).state;
  state = pauseDrip(state);
  assert.equal(advanceDrip(state, 100000).state, state);
  assert.equal(popDrip(state, state.nouns[0].id, 4000).state.count, 0);
  state = startDrip(state);
  assert.equal(advanceDrip(state, 1000).state.elapsedMs, 4000);
  const ended = advanceDrip(state, 35000);
  assert.equal(ended.state.status, 'finished');
  assert.deepEqual(ended.events, [{ type: 'finish', count: 0, score: 0 }]);
  assert.equal(advanceDrip(ended.state, 90000).events.length, 0);
  assert.equal(popDrip(ended.state, 0, 35000).events.length, 0);
});
