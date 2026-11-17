import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, boardLink, editionWindow, morningCard, readBoard } from '../public/loom/morning/morning.mjs';

const NOW = new Date('2026-11-17T18:00:00Z');
const at = (hour) => `2026-11-17T${hour}:00Z`;
const id = (number) => `m_${String(number).padStart(10, '0')}`;
const note = (number, body, options = {}) => ({
  id: id(number), seq: number, at: at('08:00'), from: { name: 'Desk', kind: 'agent' }, body, ...options,
});
const board = (messages, log = {}) => ({
  ok: true, kvBound: true, exists: true, messages, log: { address: BOARD, ...log },
});
const hours = ({ from, until }) => [from, until].map((ms) => new Date(ms).toISOString());

test('the date rolls at exactly 7am in New York, independent of the viewer time zone', () => {
  const prior = editionWindow(new Date('2026-11-17T11:59:59.999Z'));
  assert.equal(new Date(prior.until).toISOString(), '2026-11-16T12:00:00.000Z');
  assert.equal(new Date(prior.next).toISOString(), '2026-11-17T12:00:00.000Z');
  assert.deepEqual(hours(editionWindow(new Date('2026-11-17T12:00:00Z'))),
    ['2026-11-17T00:00:00.000Z', '2026-11-17T12:00:00.000Z']);
});

test('the overnight window follows both daylight saving transitions', () => {
  assert.deepEqual(hours(editionWindow(new Date('2026-03-08T12:00:00Z'))),
    ['2026-03-08T00:00:00.000Z', '2026-03-08T11:00:00.000Z']);
  assert.deepEqual(hours(editionWindow(new Date('2026-11-01T12:00:00Z'))),
    ['2026-10-31T23:00:00.000Z', '2026-11-01T12:00:00.000Z']);
});

test('ship rows cite explicit publications in the overnight window and keep the compact list bounded', () => {
  const messages = [
    note(1, 'OFF-1 · Newcomer path', { at: at('00:01') }),
    note(2, 'SHIPPED: Newcomer path is live.', { parent: id(1), at: at('00:10') }),
    note(3, 'PUBLISHED · Welcome room', { at: at('03:05') }),
    note(4, 'SHIPPED OFF-49 on Mike’s word', { at: at('11:59') }),
    note(5, 'PUBLISH RUN · Pushing now', { at: at('05:00') }),
    note(6, 'MERGED, NOT YET LIVE · PR 123'),
    note(7, 'DONE · Draft opened'),
    note(8, 'PUBLISHED: morning item', { at: at('12:00') }),
    note(9, 'PUBLISHED: old item', { at: '2026-11-16T23:59:58Z' }),
    note(10, 'PUBLISHED: echo', { via: { id: id(4) }, at: at('11:55') }),
    note(11, 'PUBLISHED: hidden', { hidden: true, at: at('11:55') }),
    note(12, 'PUBLISHED: withdrawn', { withdrawn: true, at: at('11:55') }),
    note(13, 'PUBLISHED: changed late', { editedAt: at('17:00') }),
  ];
  const card = morningCard(board(messages), NOW);
  assert.deepEqual(card.shipped.map(({ title, href }) => [title, href]),
    [['OFF-49 on Mike’s word', boardLink(id(4))], ['Welcome room', boardLink(id(3))]]);
  assert.equal(card.more.shipped, 1);
  const single = morningCard(board(messages.slice(0, 2)), NOW).shipped[0];
  assert.equal(single.title, 'OFF-1 · Newcomer path');
  assert.equal(single.href, boardLink(id(2)), 'the receipt is cited even when the title is from the parent');
});

test('stuck rows use the board projection and the exact blocker receipt for multipart tasks', () => {
  const blocker = note(2, 'PARTIAL / BLOCKED C + E', { parent: id(1), at: at('10:25') });
  const root = note(1, 'OFF-57 · Fix reported problems\nC · ROOM COUNT. Check the form.\nE · WRONG DATE. Author edit.', {
    taskStatus: {
      status: 'open', reported: true, blocked: true, source: { id: id(3) },
      parts: [
        { part: 'B', status: 'done', blocked: false, source: { id: id(3) } },
        { part: 'C', status: 'open', blocked: true, source: { id: id(2) } },
        { part: 'E', status: 'open', blocked: true, source: { id: id(2) } },
      ],
    },
  });
  const messages = [root, blocker, note(3, 'DONE B', { parent: id(1), at: at('10:30') }), note(4, 'Was blocked yesterday, currently fixed')];
  const card = morningCard(board(messages), NOW);
  assert.deepEqual(card.stuck.map(({ title, href, detail }) => [title, href, detail]),
    [['OFF-57 · Fix reported problems', boardLink(id(2)), 'C · ROOM COUNT / E · WRONG DATE']]);
  root.taskStatus.status = 'done';
  assert.deepEqual(morningCard(board(messages), NOW).stuck, []);
});

test('the newest three explicit Mike gates are sourced, and only the same desk or Mike can clear a gate', () => {
  const messages = [
    note(1, 'NEEDS MIKE · Older choice'),
    note(2, 'NEEDS MIKE · Clear me'),
    note(3, 'A response to the gate', { parent: id(2) }),
    note(4, 'CLEARED', { parent: id(3), from: { name: 'Mike', address: '@mike' } }),
    note(5, 'NEEDS @Mike · Review timing · post the reply here'),
    note(6, 'CLEARED', { parent: id(5), from: { name: 'Stranger' } }),
    note(7, 'NEEDS MIKE: Choose title'),
    note(8, 'NEEDS MIKE — Pick order'),
    note(9, 'NEEDS MIKEY · Wrong person'),
    note(10, 'NEEDS MIKE · Hidden', { hidden: true }),
    note(11, 'NEEDS MIKE · From Mike himself', { from: { name: 'Mike' } }),
    note(12, 'NEEDS MIKE · Future', { at: at('23:00') }),
    note(13, 'NEEDS MIKE · Retracted by the desk'),
    note(14, 'CLEARED · Already decided in the thread', { parent: id(13) }),
    note(15, 'NEEDS MIKE · Still open', { at: at('06:00') }),
    note(16, 'CLEARED · Hidden', { parent: id(15), hidden: true }),
  ];
  const card = morningCard(board(messages), NOW);
  assert.deepEqual(card.decisions.map(({ title, href }) => [title, href]), [
    ['Pick order', boardLink(id(8))],
    ['Choose title', boardLink(id(7))],
    ['Review timing', boardLink(id(5))],
  ]);
  assert.equal(card.more.decisions, 2);
});

test('empty and trimmed boards stay honest and unavailable responses fail visibly', () => {
  const card = morningCard(board([], { trimmedBefore: 12 }), NOW);
  assert.equal(card.trimmed, true);
  assert.deepEqual([card.shipped, card.stuck, card.decisions], [[], [], []]);
  for (const invalid of [
    undefined,
    { ...board([]), kvBound: false },
    { ...board([]), exists: false },
    board([], { address: '#another-board' }),
    board([], { seed: true }),
  ]) assert.throws(() => morningCard(invalid, NOW), /unavailable/);
});

test('the page can only read the fixed public task board, including from the pinned preview', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url: url.href, method: options.method ?? 'GET', credentials: options.credentials });
    return new Response(JSON.stringify(board([])));
  };
  await readBoard(new URL('https://pointcast.xyz/loom/morning/'), request);
  await readBoard(new URL('https://rawcdn.githack.com/example/test/commit/public/loom/morning/index.html'), request);
  assert.deepEqual(calls, [
    { url: 'https://pointcast.xyz/api/loom?to=%23officenoun-tasks', method: 'GET', credentials: 'omit' },
    { url: 'https://pointcast.xyz/api/loom?to=%23officenoun-tasks', method: 'GET', credentials: 'omit' },
  ]);
  await assert.rejects(readBoard(new URL('http://localhost:8000'), async () => new Response(null, { status: 503 })), /read failed/);
  assert.equal(boardLink('javascript:alert(1)'), 'https://pointcast.xyz/loom?to=%23officenoun-tasks');
});
