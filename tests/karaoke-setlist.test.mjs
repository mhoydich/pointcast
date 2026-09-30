import test from 'node:test';
import assert from 'node:assert/strict';
import { createSetlist } from '../src/lib/karaoke-setlist.mjs';

const songIds = ['first-song', 'second-song', 'third-song'];
const queue = options => createSetlist({ songIds, ...options });

test('starts empty with one singer, twelve places, and no implicit next turn', () => {
  const setlist = queue();
  assert.deepEqual(setlist.snapshot(), { entries: [], singers: 1, limit: 12 });
  assert.equal(setlist.next(), null);
  assert.equal(setlist.remove('turn-1'), false);
  assert.equal(setlist.clear(), 0);
  assert.deepEqual(setlist.add('first-song'), { id: 'turn-1', songId: 'first-song', singer: 0 });
});

test('duplicate songs are separate turns with unique sequence IDs and FIFO order', () => {
  const setlist = queue({ singers: 3 });
  const first = setlist.add('first-song', 2);
  const second = setlist.add('first-song', 0);
  const third = setlist.add('third-song', 1);
  assert.deepEqual([first.id, second.id, third.id], ['turn-1', 'turn-2', 'turn-3']);
  assert.deepEqual(setlist.next(), first);
  assert.deepEqual(setlist.next(), second);
  assert.deepEqual(setlist.next(), third);
  assert.equal(setlist.next(), null);
});

test('remove targets only an exact entry ID and preserves the remaining order', () => {
  const setlist = queue();
  const first = setlist.add('first-song');
  const second = setlist.add('second-song');
  const third = setlist.add('first-song');
  for (const invalid of [null, undefined, 2, {}, 'second-song', 'turn-02', 'turn-99']) {
    assert.equal(setlist.remove(invalid), false);
  }
  assert.equal(setlist.remove(second.id), true);
  assert.equal(setlist.remove(second.id), false);
  assert.deepEqual(setlist.snapshot().entries, [first, third]);
  assert.deepEqual(setlist.next(), first);
  assert.deepEqual(setlist.next(), third);
});

test('unknown or malformed song IDs are rejected without mutation or consuming an ID', () => {
  const setlist = queue();
  for (const invalid of ['', 'missing', ' first-song', 'first-song ', '__proto__',
    null, undefined, 1, {}, ['first-song'], new String('first-song')]) {
    assert.equal(setlist.add(invalid), false);
  }
  assert.deepEqual(setlist.snapshot().entries, []);
  assert.equal(setlist.add('first-song').id, 'turn-1');
});

test('singer slots must be integers inside the current group', () => {
  const setlist = queue({ singers: 3 });
  for (const invalid of [-1, 3, 7, 8, 1.5, NaN, Infinity, -Infinity, '1', null, true, {}]) {
    assert.equal(setlist.add('first-song', invalid), false);
  }
  assert.equal(setlist.add('first-song', 0).id, 'turn-1');
  assert.equal(setlist.add('second-song', 2).id, 'turn-2');
  const largestGroup = queue({ singers: 8 });
  assert.equal(largestGroup.add('third-song', 7).singer, 7);
  assert.equal(largestGroup.add('third-song', 8), false);
});

test('the default queue is capped at twelve and a rejected add does not consume an ID', () => {
  const setlist = queue({ singers: 8 });
  for (let i = 0; i < 12; i++) assert.equal(setlist.add('first-song', i % 8).id, `turn-${i + 1}`);
  const full = setlist.snapshot();
  assert.equal(setlist.add('second-song', 1), false);
  assert.deepEqual(setlist.snapshot(), full);
  assert.equal(setlist.next().id, 'turn-1');
  assert.equal(setlist.add('second-song', 1).id, 'turn-13');
  assert.equal(setlist.snapshot().entries.length, 12);
});

test('a smaller configured limit can be refilled after removal or clear', () => {
  const setlist = queue({ limit: 1 });
  assert.equal(setlist.add('first-song').id, 'turn-1');
  assert.equal(setlist.add('second-song'), false);
  assert.equal(setlist.remove('turn-1'), true);
  assert.equal(setlist.add('second-song').id, 'turn-2');
  assert.equal(setlist.clear(), 1);
  assert.equal(setlist.add('third-song').id, 'turn-3');
  assert.equal(setlist.snapshot().limit, 1);
});

test('shrinking a group remaps only removed slots and preserves songs, IDs, and order', () => {
  const setlist = queue({ singers: 8 });
  for (let singer = 0; singer < 8; singer++) setlist.add(songIds[singer % 3], singer);
  const before = setlist.snapshot().entries;
  assert.equal(setlist.setSingers(3), true);
  assert.deepEqual(setlist.snapshot(), {
    entries: before.map(entry => ({ ...entry, singer: entry.singer % 3 })),
    singers: 3,
    limit: 12,
  });
  assert.equal(setlist.add('first-song', 3), false);
  assert.equal(setlist.setSingers(1), true);
  assert.ok(setlist.snapshot().entries.every(entry => entry.singer === 0));
  assert.equal(setlist.add('first-song', 1), false);
});

test('growing a group does not undo remapping or reassign existing turns', () => {
  const setlist = queue({ singers: 8 });
  setlist.add('first-song', 7);
  setlist.setSingers(3);
  const remapped = setlist.snapshot().entries;
  assert.equal(setlist.setSingers(8), true);
  assert.deepEqual(setlist.snapshot().entries, remapped);
  assert.equal(setlist.add('second-song', 7).singer, 7);
  const sameCount = setlist.snapshot();
  assert.equal(setlist.setSingers(8), true);
  assert.deepEqual(setlist.snapshot(), sameCount);
});

test('invalid group changes leave every part of the queue unchanged', () => {
  const setlist = queue({ singers: 3 });
  setlist.add('first-song', 2);
  const before = setlist.snapshot();
  for (const count of [0, -1, 9, 2.5, NaN, Infinity, '2', null, undefined, true, {}]) {
    assert.equal(setlist.setSingers(count), false);
    assert.deepEqual(setlist.snapshot(), before);
  }
});

test('clear is idempotent, preserves configuration, and never reuses an old turn ID', () => {
  const setlist = queue({ singers: 4, limit: 2 });
  setlist.add('first-song', 3);
  setlist.add('second-song', 1);
  assert.equal(setlist.clear(), 2);
  assert.equal(setlist.clear(), 0);
  assert.deepEqual(setlist.snapshot(), { entries: [], singers: 4, limit: 2 });
  assert.equal(setlist.remove('turn-1'), false);
  assert.equal(setlist.next(), null);
  assert.equal(setlist.add('third-song', 2).id, 'turn-3');
});

test('callers cannot mutate internal queue state through returned entries or snapshots', () => {
  const setlist = queue({ singers: 2 });
  const added = setlist.add('first-song', 1);
  added.id = 'changed';
  added.songId = 'unknown';
  added.singer = 99;
  const firstSnapshot = setlist.snapshot();
  const expected = { id: 'turn-1', songId: 'first-song', singer: 1 };
  assert.deepEqual(firstSnapshot.entries, [expected]);
  firstSnapshot.entries[0].singer = 0;
  firstSnapshot.entries.push({ id: 'injected', songId: 'second-song', singer: 0 });
  firstSnapshot.singers = 8;
  firstSnapshot.limit = 100;
  assert.deepEqual(setlist.snapshot(), { entries: [expected], singers: 2, limit: 12 });
  const stableSnapshot = setlist.snapshot();
  setlist.setSingers(1);
  assert.equal(stableSnapshot.entries[0].singer, 1, 'future remapping cannot mutate older snapshots');
  const next = setlist.next();
  next.singer = 7;
  assert.deepEqual(setlist.snapshot(), { entries: [], singers: 1, limit: 12 });
});

test('known song IDs are copied from either an array or a Set', () => {
  const originalArray = ['first-song'];
  const arrayQueue = createSetlist({ songIds: originalArray });
  originalArray[0] = 'second-song';
  assert.notEqual(arrayQueue.add('first-song'), false);
  assert.equal(arrayQueue.add('second-song'), false);
  const originalSet = new Set(['first-song']);
  const setQueue = createSetlist({ songIds: originalSet });
  originalSet.clear();
  originalSet.add('second-song');
  assert.notEqual(setQueue.add('first-song'), false);
  assert.equal(setQueue.add('second-song'), false);
});

test('empty catalogues reject all additions and duplicate declared IDs remain valid', () => {
  const empty = createSetlist({ songIds: [] });
  assert.equal(empty.add('first-song'), false);
  assert.equal(empty.next(), null);
  const duplicate = createSetlist({ songIds: ['first-song', 'first-song'] });
  assert.notEqual(duplicate.add('first-song'), false);
});

test('invalid constructor configuration fails explicitly rather than silently widening bounds', () => {
  for (const invalid of [undefined, null, 'first-song', {}, 1,
    [null], [''], [' first-song'], ['first-song '], [1], Array(1)]) {
    assert.throws(() => createSetlist({ songIds: invalid }), TypeError);
  }
  assert.throws(() => createSetlist(), TypeError);
  for (const invalid of [0, -1, 9, 1.5, NaN, Infinity, null, '2']) {
    assert.throws(() => queue({ singers: invalid }), RangeError);
  }
  for (const invalid of [0, -1, 13, 1.5, NaN, Infinity, null, '2']) {
    assert.throws(() => queue({ limit: invalid }), RangeError);
  }
});

test('separate queues have no shared entries, singer state, or sequence', () => {
  const first = queue();
  const second = queue();
  first.add('first-song');
  first.setSingers(8);
  assert.deepEqual(second.snapshot(), { entries: [], singers: 1, limit: 12 });
  assert.equal(second.add('second-song').id, 'turn-1');
  assert.equal(first.add('third-song', 7).id, 'turn-2');
  second.clear();
  assert.equal(first.snapshot().entries.length, 2);
});

test('mixed transitions retain valid slots, bounded size, stable order, and globally unique turn IDs', () => {
  const setlist = queue({ singers: 8, limit: 5 });
  const seenIds = new Set();
  let state = 42;
  let previousSequence = 0;
  const random = max => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % max;
  };
  for (let i = 0; i < 600; i++) {
    const before = setlist.snapshot();
    switch (random(6)) {
      case 0:
      case 1: {
        const songId = songIds[random(songIds.length)];
        const singer = random(10);
        const result = setlist.add(songId, singer);
        if (result) {
          assert.ok(!seenIds.has(result.id));
          seenIds.add(result.id);
          assert.equal(result.id, `turn-${++previousSequence}`);
          assert.deepEqual(setlist.snapshot().entries, [...before.entries, result]);
        } else {
          assert.ok(singer >= before.singers || before.entries.length === before.limit);
          assert.deepEqual(setlist.snapshot(), before);
        }
        break;
      }
      case 2: {
        const result = setlist.next();
        assert.deepEqual(result, before.entries[0] ?? null);
        assert.deepEqual(setlist.snapshot().entries, before.entries.slice(1));
        break;
      }
      case 3: {
        const selected = before.entries[random(before.entries.length + 1)];
        assert.equal(setlist.remove(selected?.id ?? 'missing'), Boolean(selected));
        assert.deepEqual(setlist.snapshot().entries, before.entries.filter(entry => entry.id !== selected?.id));
        break;
      }
      case 4: {
        const count = 1 + random(8);
        assert.equal(setlist.setSingers(count), true);
        assert.deepEqual(setlist.snapshot().entries,
          before.entries.map(entry => ({ ...entry, singer: entry.singer % count })));
        break;
      }
      case 5:
        assert.equal(setlist.clear(), before.entries.length);
        assert.deepEqual(setlist.snapshot().entries, []);
        break;
    }
    const after = setlist.snapshot();
    assert.ok(after.entries.length <= after.limit && after.limit <= 12);
    assert.ok(after.singers >= 1 && after.singers <= 8);
    assert.ok(after.entries.every(entry => songIds.includes(entry.songId) &&
      Number.isInteger(entry.singer) && entry.singer >= 0 && entry.singer < after.singers));
    assert.equal(new Set(after.entries.map(entry => entry.id)).size, after.entries.length);
  }
  assert.ok(seenIds.size > 10, 'the transition run exercised repeated additions');
});
