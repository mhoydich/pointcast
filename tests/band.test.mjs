import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAND, FOX_MESSAGES, MORSE, advanceCopy, callSign, clarity, foxOf, formatMhz, mhzToStep,
  morseSchedule, packSeq, parseFreq, stepToMhz, townDate, unpackStep,
} from '../src/lib/band.ts';

test('steps and megahertz round-trip across the whole band', () => {
  for (let s = 0; s <= BAND.steps; s++) assert.equal(mhzToStep(stepToMhz(s)), s);
  assert.equal(formatMhz(0), '3.000');
  assert.equal(formatMhz(BAND.steps), '12.000');
  assert.equal(parseFreq('6.275'), 131);
  assert.equal(parseFreq('13'), null);
  assert.equal(parseFreq('nope'), null);
});

test('a tuning packed into seq survives the drum room ceiling', () => {
  for (const counter of [0, 1, 1_899_999, 1_900_000, 9_999_999]) {
    for (const step of [0, 131, 360]) {
      const seq = packSeq(counter, step);
      assert.ok(Number.isInteger(seq) && seq >= 0 && seq <= 1_000_000_000, `seq ${seq}`);
      assert.equal(unpackStep(seq), step);
    }
  }
});

test('the fox is the same for everyone on a day and stays off the ends of the dial', () => {
  const a = foxOf('2026-09-24');
  assert.deepEqual(a, foxOf('2026-09-24'));
  const seen = new Set();
  for (let d = 1; d <= 28; d++) {
    const fox = foxOf(`2026-10-${String(d).padStart(2, '0')}`);
    assert.ok(fox.step >= 24 && fox.step <= BAND.steps - 24);
    assert.ok(FOX_MESSAGES.includes(fox.message));
    seen.add(fox.step);
  }
  assert.ok(seen.size > 20, 'the fox moves');
});

test('town date follows El Segundo, not UTC', () => {
  assert.equal(townDate(new Date('2026-09-25T05:00:00Z')), '2026-09-24');
  assert.equal(townDate(new Date('2026-09-25T08:00:00Z')), '2026-09-25');
});

test('alone you must be dead on; company widens the window', () => {
  assert.ok(clarity(0, 0) >= 0.5);
  assert.ok(clarity(2, 0) < 0.5);
  assert.ok(clarity(2, 1) >= 0.5);
  assert.ok(clarity(0, 3) === 1);
  assert.equal(clarity(40, 4), 0);
  assert.equal(advanceCopy(0, 0.3, 1, 10), 0);
  assert.ok(advanceCopy(0, 1, 1, 10) > 1);
  assert.equal(advanceCopy(9.9, 1, 1, 10), 10);
});

test('every fox message keys cleanly in Morse', () => {
  for (const msg of FOX_MESSAGES) {
    assert.ok(msg.length <= 26, msg);
    for (const ch of msg.replace(/ /g, '')) assert.ok(MORSE[ch], `${msg}: ${ch}`);
  }
  const { marks, units } = morseSchedule('E T');
  assert.deepEqual(marks, [[0, 1], [8, 3]]);
  assert.equal(units, 11);
});

test('call signs are stable and shaped like PC4-QRX', () => {
  assert.equal(callSign('abc123-ffff'), callSign('abc123-ffff'));
  assert.match(callSign('abc123-ffff'), /^PC\d-[A-Z]{3}$/);
});
