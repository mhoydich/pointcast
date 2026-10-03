import test from 'node:test';
import assert from 'node:assert/strict';
import { inningAt, plays, parseMemory, memoryText } from '../src/data/baseball.mjs';

test('composed inning accounts for every batter and ends at three outs', () => {
  let previous = inningAt(0);
  for (let step = 1; step <= plays.length; step++) {
    const state = inningAt(step);
    assert.equal(step, state.runs + state.outs + state.bases.filter(Boolean).length + state.leftOnBase);
    assert.ok(state.outs >= previous.outs && state.outs <= 3);
    assert.ok(state.runs >= previous.runs);
    assert.equal(new Set(state.bases.filter(Boolean)).size, state.bases.filter(Boolean).length);
    previous = state;
  }
  assert.equal(previous.runs, 2);
  assert.equal(previous.hits, 2);
  assert.equal(previous.outs, 3);
  assert.equal(previous.leftOnBase, 1);
  assert.equal(previous.complete, true);
});

test('walk forces runners; sacrifice fly scores a run without adding a hit', () => {
  assert.deepEqual(inningAt(3).bases, ['03', '01', null]);
  assert.equal(inningAt(3).hits, inningAt(2).hits);
  assert.equal(inningAt(5).runs, inningAt(4).runs + 1);
  assert.equal(inningAt(5).outs, inningAt(4).outs + 1);
  assert.equal(inningAt(5).hits, inningAt(4).hits);
});

test('replay bounds and corrupt local memory are handled', () => {
  for (const step of [-3, NaN, Infinity]) assert.equal(inningAt(step).step, 0);
  assert.equal(inningAt(99).step, 6);
  for (const raw of ['bad', 'null', '3', '{}', '{"note":3}']) assert.equal(parseMemory(raw), null);
  assert.deepEqual(parseMemory('{"note":"hello","ritual":"invalid"}'), { note: 'hello', ritual: 'company' });
  assert.equal(parseMemory(JSON.stringify({ note: 'a'.repeat(400) })).note.length, 280);
  assert.ok(memoryText(' a memory ', 'company').includes('a memory\n\nCome watch an inning'));
});
