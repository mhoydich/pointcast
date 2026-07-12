import test from 'node:test';
import assert from 'node:assert/strict';

const { shrineState } = await import('../src/lib/drum-shrine.ts');

test('shrine rotation is deterministic within a UTC day', () => {
  const morning = shrineState(new Date('2026-07-12T00:00:01Z'));
  const evening = shrineState(new Date('2026-07-12T23:59:59Z'));

  assert.equal(morning.noun, evening.noun);
  assert.equal(morning.dayOfYear, 193);
  assert.equal(morning.rotatesAt, '2026-07-13T00:00:00.000Z');
});

test('shrine rotation advances to a different Noun at UTC midnight', () => {
  const before = shrineState(new Date('2026-07-12T23:59:59Z'));
  const after = shrineState(new Date('2026-07-13T00:00:00Z'));

  assert.notEqual(before.noun, after.noun);
  assert.equal(after.dayOfYear, before.dayOfYear + 1);
  assert.match(after.nounImage, new RegExp(`/${after.noun}\\.svg$`));
});
