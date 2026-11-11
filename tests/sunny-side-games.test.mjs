import test from 'node:test';
import assert from 'node:assert/strict';
import roofHop from '../public/games/sunny-side/modules/roof-hop.js';
import wireWalk from '../public/games/sunny-side/modules/wire-walk.js';
import puppyDream from '../public/games/sunny-side/modules/puppy-dream.js';
import pebblePop from '../public/games/sunny-side/modules/pebble-pop.js';
import gardenPairs from '../public/games/sunny-side/modules/garden-pairs.js';

const STEP = 1 / 60;
function harness(factory) {
  const scores = [], finishes = [], bursts = [], squirrels = [];
  const game = factory({
    W: 480, H: 600,
    score: value => scores.push(value),
    finish: message => finishes.push(message),
    burst: (...args) => bursts.push(args),
    drawSquirrel: (_ctx, x, y) => squirrels.push({ x, y }),
    drawPuppy() {},
  });
  return { game, scores, finishes, bursts, squirrels, score: () => scores.at(-1) ?? 0 };
}
function advance(h, seconds) {
  const frames = Math.ceil(seconds / STEP);
  for (let frame = 0; frame < frames; frame++) h.game.update(STEP);
}
function withRandom(random, run) {
  const original = Math.random;
  Math.random = random;
  try { return run(); } finally { Math.random = original; }
}
function canvas() {
  return new Proxy({}, {
    get(target, key) {
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop() {} });
      return key in target ? target[key] : () => {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
}
function card(h, index) {
  h.game.pointer(104 + (index % 3) * 136, 185 + Math.floor(index / 3) * 101, 'down');
}
function pebble(h, row, col) {
  h.game.pointer(95 + col * 58, 162 + row * 58, 'down');
}
function assertTerminal(h) {
  assert.equal(h.finishes.length, 1, 'a completed round reports its outcome once');
  const lastScore = h.score();
  advance(h, 3);
  h.game.pointer(240, 300, 'down');
  h.game.key('Enter', true);
  h.game.key(' ', true);
  advance(h, 3);
  assert.equal(h.finishes.length, 1, 'late updates and input cannot finish a second time');
  assert.equal(h.score(), lastScore, 'completed-round input cannot alter the result');
}

test('Roof Hop rewards a well-timed jump and ends a fallen run exactly once', () => withRandom(() => 0.5, () => {
  const walking = harness(roofHop);
  const jumping = harness(roofHop);
  advance(walking, 0.94);
  advance(jumping, 0.94);
  jumping.game.pointer(240, 300, 'down');
  advance(walking, 0.2);
  advance(jumping, 0.2);
  assert.ok(jumping.score() > walking.score(), 'jumping into an acorn earns more than distance alone');
  assert.ok(jumping.bursts.some(([, , color]) => color === '#ffcc55'), 'the collected acorn gives visible feedback');
  advance(walking, 10);
  assert.ok(walking.score() > 0, 'the runner earns distance points');
  assertTerminal(walking);
  walking.game.draw(canvas());
}));

test('Wire Walk catches acorns, applies bird collisions, and stops after the third hit', () => withRandom(() => 0.5, () => {
  const h = harness(wireWalk);
  advance(h, 20);
  assert.ok(h.score() > 0, 'catching acorns increases the score');
  assert.ok(h.bursts.some(([, , color]) => color === '#fff0ed'), 'a bird collision gives damage feedback');
  assertTerminal(h);
  h.game.draw(canvas());
}));

test('Wire Walk accepts drag and keyboard movement and also has a finite surviving round', () => withRandom(() => 0.5, () => {
  const h = harness(wireWalk);
  h.game.pointer(-500, 420, 'down');
  advance(h, 1);
  h.game.draw(canvas());
  const left = h.squirrels.at(-1).x;
  assert.ok(left >= 29 && left < 35, 'dragging outside the board clamps to its safe edge');
  h.game.key('ArrowRight', true);
  advance(h, 0.3);
  h.game.key('ArrowRight', false);
  h.game.draw(canvas());
  assert.ok(h.squirrels.at(-1).x > left + 50, 'arrow input moves the squirrel');
  h.game.pointer(30, 420, 'down');
  advance(h, 43);
  assert.equal(h.finishes.length, 0, 'a safe squirrel can continue until the timer runs out');
  advance(h, 1);
  assertTerminal(h);
}));

test('Puppy Dream scores the timing window, rejects duplicate taps, and ends after 30 seconds', () => {
  const h = harness(puppyDream);
  advance(h, 1.42);
  h.game.key(' ', true);
  const perfectScore = h.score();
  assert.ok(perfectScore > 0, 'a tap when the rings meet earns points');
  h.game.pointer(240, 285, 'down');
  assert.equal(h.score(), perfectScore, 'a second tap cannot score the same ring');
  advance(h, 0.45);
  h.game.pointer(240, 285, 'down');
  assert.equal(h.score(), perfectScore, 'a very early tap earns no points');
  h.game.draw(canvas());
  advance(h, 28.2);
  assertTerminal(h);
});

test('Pebble Pop ignores isolated stones and input outside the board', () => {
  let sample = 0;
  withRandom(() => ((sample++ % 5) + 0.25) / 5, () => {
    const h = harness(pebblePop);
    h.game.pointer(0, 0, 'down');
    pebble(h, 6, 5);
    assert.equal(h.score(), 0, 'an isolated pebble is not a scoring move');
    assert.equal(h.bursts.length, 0, 'invalid selections do not clear any stones');
    pebble(h, 0, 0);
    assert.ok(h.score() > 0, 'the guaranteed neighboring pair remains playable');
    h.game.draw(canvas());
  });
});

test('Pebble Pop drops remaining stones, refills the board, and finishes on its twentieth valid move', () => {
  let sample = 0;
  withRandom(() => {
    // Each initial row is a distinct color. Refills are the first color.
    const row = Math.floor(sample++ / 6);
    return row < 7 ? ((row % 5) + 0.25) / 5 : 0;
  }, () => {
    const h = harness(pebblePop);
    pebble(h, 6, 0);
    const firstScore = h.score();
    assert.ok(firstScore > 0);
    const cleared = h.bursts.length;
    pebble(h, 5, 0);
    assert.equal(h.score(), firstScore, 'input is locked while stones are disappearing');
    advance(h, 0.4);
    pebble(h, 0, 0);
    assert.ok(h.bursts.length - cleared > cleared, 'new top stones join the dropped row into a bigger group');
    assert.ok(h.score() - firstScore > firstScore, 'a bigger connected group earns a bigger reward');
    advance(h, 0.4);
    for (let move = 2; move < 19; move++) {
      pebble(h, 0, 0);
      advance(h, 0.4);
    }
    assert.equal(h.finishes.length, 0, 'nineteen valid moves leave one move to play');
    // The keyboard can make the final selection without a pointer.
    h.game.key('Enter', true);
    advance(h, 0.4);
    assertTerminal(h);
    h.game.draw(canvas());
  });
});

test('Garden Pairs shows mismatches long enough to remember and completes all six pairs once', () => withRandom(() => 0.999999, () => {
  const h = harness(gardenPairs);
  card(h, 0);
  card(h, 1);
  card(h, 6);
  assert.equal(h.score(), 0, 'mismatches and picks during their reveal cannot score');
  advance(h, 1);
  card(h, 0);
  card(h, 6);
  assert.ok(h.score() > 0, 'a remembered pair scores after the mismatch closes');
  const firstScore = h.score();
  card(h, 0);
  card(h, 6);
  assert.equal(h.score(), firstScore, 'a matched pair cannot be scored twice');
  for (let index = 1; index < 6; index++) { card(h, index); card(h, index + 6); }
  assert.equal(h.finishes.length, 0, 'the last match gets its own brief celebration');
  advance(h, 0.7);
  assertTerminal(h);
  assert.equal(h.bursts.length, 6, 'every matched pair gives feedback');
  h.game.draw(canvas());
}));

test('Garden Pairs supports choosing both cards with the keyboard', () => withRandom(() => 0.999999, () => {
  const h = harness(gardenPairs);
  h.game.key('Enter', true);
  for (let i = 0; i < 2; i++) h.game.key('ArrowDown', true);
  h.game.key(' ', true);
  assert.ok(h.score() > 0, 'arrow navigation and Space can match a pair');
}));
