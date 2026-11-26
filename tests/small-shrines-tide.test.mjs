import assert from 'node:assert/strict';
import test from 'node:test';
import { SHRINES } from '../src/data/small-shrines.ts';
import { nextTide } from '../src/lib/small-shrines-tide.ts';

test('Tide is shrine 05 with four timed prompts and credited code-drawn art', () => {
  const tide = SHRINES.find((s) => s.id === 'tide');
  assert.ok(tide);
  assert.equal(tide.number, '05');
  assert.deepEqual(tide.phases.map((p) => p.at), [0, 15, 30, 45]);
  assert.equal(tide.image, '/images/small-shrines/tide.webp');
  assert.match(tide.credit, /drawn in code/);
});

test('nextTide picks the first prediction after now and never guesses', () => {
  const preds = [
    { time: '2026-11-08 04:10', heightFt: 5.1, kind: 'high' },
    { time: '2026-11-08 10:52', heightFt: 0.4, kind: 'low' },
    { time: '2026-11-08 17:30', heightFt: 4.2, kind: 'high' },
  ];
  assert.equal(nextTide(preds, '2026-11-08 11:00').kind, 'high');
  assert.equal(nextTide(preds, '2026-11-08 18:00'), null);
});
