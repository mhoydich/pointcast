import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPiles } from '../src/lib/loom/for-you.mjs';

const at = '2026-11-18T17:00:00Z';
const now = new Date('2026-11-18T18:00:00Z');
function message(id, parent, name, kind, body, seq, extra = {}) {
  return { id, parent, from: { name, kind }, body, kind: 'note', seq, at, ...extra };
}
const room = (key, messages) => ({ address: '#' + key, key, messages });
const read = threads => buildPiles({ owner: 'mike', now, threads });

test('People counts visible replies at any depth and previews the latest author and first line', () => {
  const root = message('root', null, 'Sam', 'human', 'Question', 1);
  const first = message('one', 'root', 'Lea', 'agent', 'First', 2);
  const latest = message('two', 'one', 'Tess', 'agent', 'Latest line\nMore detail', 3);
  const hidden = message('hidden', 'root', 'Ada', 'agent', 'Hidden', 4, { hidden: true });
  const withdrawn = message('withdrawn', 'root', 'Ada', 'agent', 'Withdrawn', 5, { withdrawn: true });
  const robot = message('robot', 'root', 'Collator', 'robot', 'Routed', 6);
  const link = message('link', 'root', 'Ada', 'agent', 'Echo', 7, { kind: 'link' });
  const summary = read([room('source', [root, latest, hidden, robot, first, withdrawn, link])]);
  assert.deepEqual(summary.piles.people[0].replies, { count: 2, last: { name: 'Tess', snippet: 'Latest line' } });
  assert.equal(summary.piles.people[0].link, 'loom:source#root');
});

test('a known empty thread differs from an echo whose source was outside the scan', () => {
  const original = message('original', null, 'Sam', 'human', 'Question', 1);
  const echo = message('echo', null, 'Sam', 'human', 'Question', 1, {
    kind: 'link', via: { key: 'original-room', address: '#original-room', id: original.id },
  });
  const unknown = read([room('copy', [echo])]).piles.people;
  assert.equal(unknown[0].replies, null);
  assert.equal(unknown[0].url, 'https://pointcast.xyz/loom?to=%23original-room#original');
  const known = read([room('copy', [echo]), room('original-room', [original])]).piles.people;
  assert.equal(known.length, 1);
  assert.deepEqual(known[0].replies, { count: 0, last: null });
});

test('a parent cycle cannot count the source message or count a reply twice', () => {
  const root = message('root', 'answer', 'Sam', 'human', 'Question', 1);
  const answer = message('answer', 'root', 'Lea', 'agent', 'Answer', 2);
  assert.deepEqual(read([room('source', [root, answer])]).piles.people[0].replies, {
    count: 1, last: { name: 'Lea', snippet: 'Answer' },
  });
});
