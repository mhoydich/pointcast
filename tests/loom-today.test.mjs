import test from 'node:test';
import assert from 'node:assert/strict';
import { loadToday, todayChanges } from '../public/loom/today/today.mjs';

const NOW = new Date('2026-11-18T19:40:00Z');
const UPDATES = '#updates';
const BOARD = '#officenoun-tasks';
const DESK = { name: "Loom desk (Mike's agent)", kind: 'agent' };
const id = (number) => 'm_' + String(number).padStart(10, '0');
const post = (number, body, overrides = {}) => ({
  id: id(number), at: '2026-11-18T17:14:26Z', body, from: DESK, ...overrides,
});
const room = (address, messages, log = {}) => ({
  ok: true, kvBound: true, exists: true, log: { address, ...log }, messages,
});
const feeds = (updates, board) => ({
  [UPDATES]: room(UPDATES, updates),
  [BOARD]: room(BOARD, board),
});

test('today uses the recorded timestamp in Eastern time instead of the browser zone or words in a post', () => {
  const notes = [
    post(1, 'Yesterday', { at: '2026-11-18T04:59:59Z' }),
    post(2, 'UPDATE · yesterday’s timestamp in the note\nToday’s change\n- Details for visitors', { at: '2026-11-18T05:00:00Z' }),
    post(3, 'At noon', { at: '2026-11-18T17:00:00Z' }),
    post(4, 'Future', { at: '2026-11-18T21:00:00Z' }),
  ];
  const result = todayChanges(feeds(notes, []), NOW);
  assert.equal(result.date, 'Wednesday, November 18');
  assert.deepEqual(result.items.map(({ title, time }) => [title, time]), [
    ['At noon', '12:00 PM'], ['Today’s change', '12:00 AM'],
  ]);
  assert.equal(result.items[1].detail, 'Details for visitors');
  assert.equal(result.items[1].href, 'https://pointcast.xyz/loom?to=%23updates#' + id(2));
});

test('the updates room contributes original posts without its room note or discussion replies', () => {
  const result = todayChanges(feeds([
    post(1, 'New guide today'),
    post(2, 'ROOM NOTE: About this room'),
    post(3, 'Nice work!', { parent: id(1) }),
    post(4, 'New guide today', { via: { id: id(1) } }),
    post(5, 'Hidden', { hidden: true }),
    post(6, 'Withdrawn', { withdrawn: true }),
    post(7, 'Robot update', { from: { kind: 'robot' } }),
    post(8, 'Hidden by invalid date', { at: 'invalid' }),
  ], []), NOW);
  assert.deepEqual(result.items.map(({ title }) => title), ['New guide today']);
});

test('the task board contributes explicit release reports from the Loom desk, with original sources', () => {
  const result = todayChanges(feeds([], [
    post(1, "The Office is live. Mike said go and the page loads on a phone."),
    post(2, 'PUBLISH RUN · Merged and deploying'),
    post(3, 'MERGED, NOT YET LIVE · PR 1764'),
    post(4, 'DONE · Draft ready'),
    post(5, 'The Office is live.', { from: { name: 'Loom launch integration (Codex)', kind: 'agent' } }),
    post(6, 'OFF-57 · Thread status for visitors · posted by Loom desk'),
    post(7, 'PUBLISHED · OFF-57 — Thread status is live.', { parent: id(6), at: '2026-11-18T18:10:00Z' }),
  ]), NOW);
  assert.deepEqual(result.items.map(({ title, href }) => [title, href]), [
    ['Thread status for visitors', 'https://pointcast.xyz/loom?to=%23officenoun-tasks#' + id(7)],
    ['The Office is live.', 'https://pointcast.xyz/loom?to=%23officenoun-tasks#' + id(1)],
  ]);
});

test('absent sources, trimmed history and the six-post cap are explicit', () => {
  const results = todayChanges({
    [UPDATES]: room(UPDATES, Array.from({ length: 7 }, (_, i) => post(i + 1, 'Change ' + i)), { trimmedBefore: 300 }),
    [BOARD]: room('#unrelated-board', [post(12, 'The Office is live.')]),
  }, NOW);
  assert.equal(results.items.length, 6);
  assert.equal(results.more, true);
  assert.deepEqual(results.unavailable, [BOARD]);
  assert.deepEqual(results.trimmed, [UPDATES]);
  assert.deepEqual(todayChanges(feeds([], []), NOW).items, []);
});

test('reads only the two public rooms and can render when one fails', async () => {
  const urls = [];
  const result = await loadToday(async (url, options) => {
    urls.push([url, options.credentials, options.method ?? 'GET']);
    if (url.includes('%23updates')) return new Response(JSON.stringify(room(UPDATES, [])));
    return new Response(null, { status: 503 });
  });
  assert.deepEqual(urls, [
    ['/api/loom?to=%23updates', 'omit', 'GET'],
    ['/api/loom?to=%23officenoun-tasks', 'omit', 'GET'],
  ]);
  assert.deepEqual(result.unavailable, [BOARD]);
});
