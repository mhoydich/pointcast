import test from 'node:test';
import assert from 'node:assert/strict';
import { roomBrief } from '../src/lib/loom/hearth-summary.mjs';
import { loomBrief, briefHeadline } from '../src/lib/loom/hearth.mjs';
import { hearthActivity } from '../src/lib/loom/hearth-day.mjs';

const NOW = Date.parse('2026-11-25T20:00:00Z');
const hAgo = h => new Date(NOW - h * 3600000).toISOString();
let seq = 0;
const post = (name, body, hours, extra = {}) => ({ id: 'm' + ++seq, seq, at: hAgo(hours), body, from: { name, kind: 'agent' }, ...extra });
const log = { address: '#work', key: 'abc' };

test('a room brief reports last-day receipts and open claims, never older posts', () => {
  const messages = [
    post('Astra', 'DONE V2-4 read-only ledger https://github.com/mhoydich/pointcast/pull/1938', 2),
    post('Sol', 'MINE rooms in three lines', 3),
    post('Astra', 'MINE person cards', 5),
    post('Astra', 'DONE person cards', 4),
    post('Old', 'DONE something from last week', 200),
    post('Old', 'MINE an abandoned claim from last week', 190),
  ];
  const brief = roomBrief(messages, { log, now: NOW });
  assert.deepEqual(brief.done.map(i => i.text), ['V2-4 read-only ledger', 'person cards']);
  assert.equal(brief.done[0].href, 'https://github.com/mhoydich/pointcast/pull/1938');
  assert.equal(brief.done[0].by, 'Astra');
  assert.match(brief.done[1].href, /^\/loom\?to=%23work#m/);
  assert.deepEqual(brief.open.map(i => i.text), ['rooms in three lines']);
  // A quiet room gives nothing rather than digging up its last twenty posts.
  assert.deepEqual(roomBrief(messages.slice(4), { log, now: NOW }), { done: [], open: [] });
});

test('a room brief ignores hidden, withdrawn, mirrored and collator posts and caps each list', () => {
  const messages = [
    post('A', 'DONE hidden work', 1, { hidden: true }),
    post('A', 'DONE withdrawn work', 1, { withdrawn: true }),
    post('A', 'DONE mirrored work', 1, { via: '#elsewhere' }),
    { ...post('collator', 'DONE robot roll-up', 1), from: { name: 'collator', kind: 'robot' } },
    ...[1, 2, 3, 4, 5].map(n => post('A', `DONE real job ${n}`, n)),
  ];
  const brief = roomBrief(messages, { log, now: NOW });
  assert.deepEqual(brief.done.map(i => i.text), ['real job 1', 'real job 2', 'real job 3']);
});

test('front-page lines keep the sentence after a card or PR id, full names, and skip room-wide questions', () => {
  const messages = [
    post("Shwa (Mike's agent · QA)", 'DONE #1934 · The strip shows 12 recipients newest first at 390px. This does not change the home page. https://pointcast.xyz/x', 1),
    post('Sol', 'DONE V2-3 · Standalone runner draft: https://github.com/mhoydich/pointcast/pull/1942 · 347 tests pass', 2),
    post('Desk', 'Should we change the room colors?', 1, { kind: 'question' }),
    post('Desk', 'NEEDS mike pick the holders strip placement', 1),
  ];
  const brief = roomBrief(messages, { log, now: NOW });
  assert.equal(brief.done[0].text, '#1934 · The strip shows 12 recipients newest first at 390px');
  assert.equal(brief.done[0].by, "Shwa (Mike's agent · QA)");
  assert.equal(brief.done[1].text, 'V2-3 · Standalone runner draft');
  assert.deepEqual(brief.open.map(i => i.text), ['pick the holders strip placement']);
});

test('lit rooms carry a brief; quiet rooms do not', () => {
  const lit = hearthActivity([post('A', 'DONE a job', 1)], { now: NOW });
  assert.equal(lit.state, 'active');
  assert.equal(lit.brief, undefined, 'hearthActivity itself stays a pure activity count');
});

test('the board brief merges rooms newest first and counts repeated work once', () => {
  const item = (text, href, hours, by = 'Astra') => ({ text, href, at: hAgo(hours), by });
  const active = [
    { address: '#loom-v2', brief: { done: [item('ledger', 'https://x.test/1', 3), item('lend page', 'https://x.test/2', 1)], open: [item('runner', '/loom?to=%23loom-v2#m1', 2)] } },
    { address: '#efficiency', brief: { done: [item('ledger again', 'https://x.test/1', 2), item('Lend Page', '/loom?to=%23efficiency#m9', 4)], open: [] } },
    { address: '#old-server', human: true, humanName: 'Mike' },
    { address: '#bad', brief: { done: [{ text: 7 }, null], open: 'nope' } },
  ];
  const brief = loomBrief(active.map(r => ({ ...r, brief: r.brief && { done: [].concat(r.brief.done || []), open: Array.isArray(r.brief.open) ? r.brief.open : [] } })));
  assert.deepEqual(brief.done.map(i => [i.text, i.room]), [['lend page', '#loom-v2'], ['ledger again', '#efficiency']]);
  assert.deepEqual(brief.open.map(i => i.room), ['#loom-v2']);
  assert.equal(brief.doneCount, 2);
  assert.equal(loomBrief(active.slice(0, 1), { done: 1 }).done.length, 1);
  assert.equal(loomBrief(active.slice(0, 1), { done: 1 }).doneCount, 2, 'the count is the whole day, not the visible slice');
});

test('the headline counts work and names a person; with no reported work it is the old recap', () => {
  const snapshot = { active: [{ address: '#officenoun', human: true, humanName: 'Mike', lastAt: hAgo(1), lastHumanAt: hAgo(1) }], unavailable: [], since: NOW - 86400000, asOf: NOW };
  const bots = { ...snapshot, active: [{ address: '#loom-v2', human: false, lastName: 'Astra', lastAt: hAgo(1) }] };
  assert.equal(briefHeadline({ doneCount: 5, openCount: 2 }, bots), '5 things done, 2 still open.');
  assert.equal(briefHeadline({ doneCount: 1, openCount: 0 }, snapshot), 'Mike spoke in #officenoun. 1 thing done in the last day.');
  assert.equal(briefHeadline({ doneCount: 0, openCount: 1 }, bots), '1 thing still open.');
  assert.equal(briefHeadline({ doneCount: 0, openCount: 0 }, bots), 'Astra added a log to #loom-v2.');
});
