import assert from 'node:assert/strict';
import test from 'node:test';
import { asOf, dayKey, historyUrl, readMergedToday } from '../src/lib/merged-today.mjs';

const now = new Date('2026-11-18T18:00:00Z');
const merged = {
  number: 1812, title: 'Room draft recovery', base: { ref: 'main', repo: { full_name: 'mhoydich/pointcast' } },
  state: 'closed', draft: false, merged_at: '2026-11-18T08:00:00Z', updated_at: '2026-11-18T17:00:00Z',
  merge_commit_sha: 'a'.repeat(40), html_url: 'https://example.org/wrong-target',
};
const closed = { ...merged, merged_at: null };
function reader(...pages) {
  let count = 0;
  return async (url, options) => {
    assert.equal(url.origin + url.pathname, 'https://api.github.com/repos/mhoydich/pointcast/pulls');
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      state: 'closed', base: 'main', sort: 'updated', direction: 'desc', per_page: '20', page: String(++count),
    });
    assert.equal(options.credentials, 'omit');
    assert.equal(options.signal instanceof AbortSignal, true);
    assert.ok(count <= pages.length, 'no extra requests');
    const page = pages[count - 1];
    if (page === 403) return { ok: false };
    return { ok: true, json: async () => page };
  };
}

test('the town day follows Pacific midnight in both winter and summer', () => {
  assert.equal(dayKey(new Date('2026-11-18T07:59:59Z')), '2026-11-17');
  assert.equal(dayKey(new Date('2026-11-18T08:00:00Z')), '2026-11-18');
  assert.equal(dayKey(new Date('2026-06-18T06:59:59Z')), '2026-06-17');
  assert.equal(dayKey(new Date('2026-06-18T07:00:00Z')), '2026-06-18');
  assert.match(asOf(now), /Nov 18.*10:00 AM PT/);
});

test('only confirmed same-day merges link to verified repo pull requests', async () => {
  const rows = [closed, { ...merged, draft: true }, { ...merged, state: 'open' },
    { ...merged, base: { ...merged.base, ref: 'other' } }, { ...merged, base: { ref: 'main', repo: { full_name: 'some/fork' } } },
    { ...merged, merged_at: '2026-11-18T07:59:59Z' }, { ...merged, merged_at: '2026-11-18T18:00:01Z' },
    { ...merged, merge_commit_sha: null }, { ...merged, number: -1 }, { ...merged, title: '' }, { ...merged, merged_at: 'n/a' },
    merged, merged];
  const result = await readMergedToday(now, reader(rows));
  assert.deepEqual(result, { items: [{ number: 1812, title: merged.title, href: 'https://github.com/mhoydich/pointcast/pull/1812' }], complete: true });
  assert.equal(new URL(historyUrl).searchParams.get('q'), 'is:pr is:merged base:main');
});

test('follows another page while same-day closures could hide a merge', async () => {
  const result = await readMergedToday(now, reader(Array(20).fill(closed), [merged]));
  assert.deepEqual(result.items.map(item => item.number), [1812]);
  assert.equal(result.complete, true);
});

test('empty coverage ends on a short page or an updated-before-today boundary', async () => {
  assert.deepEqual(await readMergedToday(now, reader([])), { items: [], complete: true });
  const yesterday = { ...closed, updated_at: '2026-11-18T07:59:59Z' };
  assert.deepEqual(await readMergedToday(now, reader([...Array(19).fill(closed), yesterday])), { items: [], complete: true });
});

test('three busy pages, or an unavailable continuation, cannot establish an empty day', async () => {
  const busy = Array(20).fill(closed);
  assert.deepEqual(await readMergedToday(now, reader(busy, busy, busy)), { items: [], complete: false });
  assert.deepEqual(await readMergedToday(now, reader(busy, 403)), { items: [], complete: false });
});

test('shows up to three distinct examples without assuming last updated means last merged', async () => {
  const result = await readMergedToday(now, reader([merged, merged, ...[1813, 1814, 1815].map(number => ({ ...merged, number }))]));
  assert.deepEqual(result.items.map(item => item.number), [1812, 1813, 1814]);
  assert.equal(result.complete, false);
});

test('unavailable or malformed first-page evidence stays unavailable', async () => {
  for (const page of [403, {}, [null]]) await assert.rejects(readMergedToday(now, reader(page)));
});
