import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_VISIT_DECK_VERSION,
  HOME_VISIT_DECK_STORAGE_KEY,
  HOME_VISIT_DECK_MAX_COUNT,
  chooseHomeDeckIndex,
  chooseAndSaveHomeDeck,
} from '../src/lib/home-visit-deck.mjs';

const ids = ['signal-atlas', 'listening-garden', 'paper-constellation', 'tide-observatory', 'making-room', 'night-arcade'];
const record = (id, version = HOME_VISIT_DECK_VERSION) => JSON.stringify({ version, id });
function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) { assert.equal(key, HOME_VISIT_DECK_STORAGE_KEY); return value; },
    setItem(key, next) { assert.equal(key, HOME_VISIT_DECK_STORAGE_KEY); value = next; },
    value() { return value; },
  };
}

test('every nonprevious deck is reachable and the immediate previous slot is excluded', () => {
  for (let previousIndex = 0; previousIndex < ids.length; previousIndex++) {
    const actual = Array.from({ length: ids.length - 1 }, (_, slot) => chooseHomeDeckIndex({
      count: ids.length, previousIndex, entropy: (slot + 0.5) / (ids.length - 1),
    }));
    const expected = Array.from({ length: ids.length }, (_, index) => index).filter((index) => index !== previousIndex);
    assert.deepEqual(actual, expected);
  }
});

test('repeated full visits remember IDs and avoid an immediate repeat across selections', () => {
  const storage = memoryStorage();
  let previous = null;
  for (let visit = 0; visit < 240; visit++) {
    const selected = chooseAndSaveHomeDeck({ ids, storage, entropy: ((visit * 47) % 101) / 101 });
    assert.ok(selected.index >= 0 && selected.index < ids.length);
    assert.equal(selected.id, ids[selected.index]);
    assert.notEqual(selected.id, previous);
    assert.equal(selected.storageRead, true);
    assert.equal(selected.storageSaved, true);
    assert.deepEqual(JSON.parse(storage.value()), { version: HOME_VISIT_DECK_VERSION, id: selected.id });
    previous = selected.id;
  }
});

test('persisted IDs remain correct after curated deck positions change', () => {
  const storage = memoryStorage(record('signal-atlas'));
  const reordered = [...ids].reverse();
  const selected = chooseAndSaveHomeDeck({ ids: reordered, storage, entropy: 1 });
  assert.equal(selected.id, 'listening-garden');
  assert.notEqual(selected.id, 'signal-atlas');
});

test('no storage keeps a predictable first deck while an explicit shuffle can avoid its current ID', () => {
  const first = chooseAndSaveHomeDeck({ ids });
  assert.deepEqual(first, { index: 0, id: ids[0], storageRead: false, storageSaved: false });
  let previousId = first.id;
  for (const entropy of [0, 0.9, 0.1, 1, -1, Number.NaN]) {
    const selected = chooseAndSaveHomeDeck({ ids, previousId, entropy });
    assert.notEqual(selected.id, previousId);
    previousId = selected.id;
  }
});

test('the current in-session ID takes precedence over persisted history for a shuffle', () => {
  const storage = memoryStorage(record('night-arcade'));
  const selected = chooseAndSaveHomeDeck({ ids, storage, previousId: 'signal-atlas', entropy: 0 });
  assert.equal(selected.id, 'listening-garden');
});

test('malformed, stale-version, unknown and oversized storage values cannot select invalid IDs', () => {
  const invalidValues = [
    null, '', '{', 'null', '[]', '3', '"signal-atlas"',
    record('signal-atlas', 0), record('signal-atlas', '1'), record('removed-card'),
    JSON.stringify({ id: 'signal-atlas' }), JSON.stringify({ version: 1, id: ['signal-atlas'] }),
    ' '.repeat(513), {}, 17,
  ];
  for (const value of invalidValues) {
    const storage = memoryStorage(value);
    const selected = chooseAndSaveHomeDeck({ ids, storage, entropy: 0 });
    assert.equal(selected.id, 'signal-atlas');
    assert.equal(selected.storageSaved, true);
  }
});

test('blocked read, blocked write, and throwing method getters leave selection usable', () => {
  const readBlocked = { getItem() { throw new Error('read denied'); }, setItem() {} };
  assert.deepEqual(chooseAndSaveHomeDeck({ ids, storage: readBlocked, previousId: ids[0], entropy: 0 }),
    { index: 1, id: ids[1], storageRead: false, storageSaved: true });
  const writeBlocked = { getItem() { return record(ids[0]); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(chooseAndSaveHomeDeck({ ids, storage: writeBlocked, entropy: 0 }),
    { index: 1, id: ids[1], storageRead: true, storageSaved: false });
  const bothBlocked = { get getItem() { throw new Error('blocked getter'); }, get setItem() { throw new Error('blocked getter'); } };
  assert.deepEqual(chooseAndSaveHomeDeck({ ids, storage: bothBlocked, previousId: ids[0], entropy: 0 }),
    { index: 1, id: ids[1], storageRead: false, storageSaved: false });
});

test('finite entropy is clamped and other samples fall back without leaving the deck range', () => {
  assert.equal(chooseHomeDeckIndex({ count: 6, entropy: -2 }), 0);
  assert.equal(chooseHomeDeckIndex({ count: 6, entropy: 1 }), 5);
  assert.equal(chooseHomeDeckIndex({ count: 6, entropy: 10 }), 5);
  assert.equal(chooseHomeDeckIndex({ count: 6, entropy: 0.5 }), 3);
  for (const entropy of [Number.NaN, Infinity, -Infinity, null, undefined, '0.9', {}, false]) {
    assert.equal(chooseHomeDeckIndex({ count: 6, entropy }), 0);
  }
  for (let count = 2; count <= HOME_VISIT_DECK_MAX_COUNT; count++) {
    for (const previousIndex of [0, count - 1]) {
      for (const entropy of [-1, 0, 0.5, 1, 2, Number.NaN]) {
        const selected = chooseHomeDeckIndex({ count, previousIndex, entropy });
        assert.ok(selected >= 0 && selected < count);
        assert.notEqual(selected, previousIndex);
      }
    }
  }
});

test('invalid previous indexes and IDs are ignored rather than corrupting the selection', () => {
  for (const previousIndex of [-1, 6, 1.5, '0', Number.NaN, null, undefined]) {
    assert.equal(chooseHomeDeckIndex({ count: 6, previousIndex, entropy: 0 }), 0);
  }
  assert.equal(chooseAndSaveHomeDeck({ ids, previousId: 'unknown', storage: memoryStorage(record(ids[0])), entropy: 0 }).id, ids[1]);
});

test('empty or invalid inputs have no storage effects; a single deck can repeat safely', () => {
  const storage = { getItem() { assert.fail('should not read'); }, setItem() { assert.fail('should not write'); } };
  for (const count of [0, -1, 1.5, '6', Number.NaN, Infinity, 65, undefined]) {
    assert.equal(chooseHomeDeckIndex({ count }), null);
  }
  assert.equal(chooseHomeDeckIndex(), null);
  assert.equal(chooseHomeDeckIndex(null), null);
  assert.equal(chooseAndSaveHomeDeck(), null);
  assert.equal(chooseAndSaveHomeDeck(null), null);
  for (const invalidIds of [[], null, {}, 'signal-atlas', [1], [''], ['Uppercase'], ['with space'], ['x'.repeat(97)], ['same', 'same'], Array.from({ length: 65 }, (_, n) => `deck-${n}`)]) {
    assert.equal(chooseAndSaveHomeDeck({ ids: invalidIds, storage }), null);
  }
  assert.equal(chooseHomeDeckIndex({ count: 1, previousIndex: 0, entropy: 1 }), 0);
  const one = chooseAndSaveHomeDeck({ ids: ['only-deck'], storage: memoryStorage(record('only-deck')), entropy: 1 });
  assert.deepEqual(one, { index: 0, id: 'only-deck', storageRead: true, storageSaved: true });
});
