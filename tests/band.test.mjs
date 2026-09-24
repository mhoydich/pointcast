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

test('seasons number the foxes from launch day', async () => {
  const { foxNumber, pad3 } = await import('../src/lib/band.ts');
  assert.equal(foxNumber('2026-09-24'), 1);
  assert.equal(foxNumber('2026-10-24'), 31);
  assert.equal(pad3(foxNumber('2026-09-25')), '002');
});

test('the Nightly Net runs 9:00–9:20 PM in El Segundo', async () => {
  const { netState, formatWait, netIcs } = await import('../src/lib/band.ts');
  assert.deepEqual(netState(new Date('2026-09-25T04:05:00Z')), { live: true, minutesUntil: 0, minutesLeft: 15 });
  const before = netState(new Date('2026-09-25T01:30:00Z')); // 6:30 PM PT
  assert.equal(before.live, false);
  assert.equal(before.minutesUntil, 150);
  assert.equal(netState(new Date('2026-09-25T04:20:00Z')).minutesUntil, 1420);
  assert.equal(formatWait(150), '2h 30m');
  assert.match(netIcs(), /RRULE:FREQ=DAILY/);
});

test('stamps rotate by day and gold marks a gathering', async () => {
  const { stampFor, isGold, GOLD_STAMP, towerLine } = await import('../src/lib/band.ts');
  for (let d = 1; d <= 28; d++) { const s = stampFor(`2026-10-${String(d).padStart(2, '0')}`); assert.ok(s >= 1 && s <= 9); }
  assert.equal(stampFor('2026-09-24', true), GOLD_STAMP);
  assert.equal(isGold(4, false), true);
  assert.equal(isGold(1, true), true);
  assert.equal(isGold(3, false), false);
  const line = towerLine({ kind: 'fox', date: '2026-09-24', mhz: '4.050', message: 'YOU ARE NOT ALONE OUT HERE', call: 'PC4-CMR', with: [{ call: 'PC1-ABC' }], note: 'with dad' });
  assert.match(line, /FOX NO\. 001 · 2026-09-24 · 4\.050 MHz/);
  assert.ok(line.length <= 280);
});
