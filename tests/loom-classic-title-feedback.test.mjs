import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('classic explains why a submitted title was declined without implying the post failed', () => {
  const source = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
  const result = source.match(/const titleNote =[\s\S]+?data\.reached \?\? \[\]\);/)[0].replace(' as Record<string, string>', '');
  const report = new Function('data', 'status', result);
  const status = (text, error, links) => [text, error, links];
  const results = [];
  const capture = (...args) => results.push(status(...args));
  report({ title: { applied: false, reason: 'title_already_set' }, reached: ['#other'] }, capture);
  report({ title: { applied: false, reason: 'title_on_reply' } }, capture);
  report({ title: { applied: true } }, capture);
  assert.deepEqual(results, [
    ['Appended. This thread already has a title. It also landed in', false, ['#other']],
    ['Appended. Titles can only be set from the thread, outside a reply.', false, []],
    ['Appended.', false, []],
  ]);
});
