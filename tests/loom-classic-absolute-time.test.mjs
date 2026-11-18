import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('classic stamps expose the absolute time and its displayed time zone', () => {
  const source = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
  const stamp = source.match(/    const postedAt = el\('time'[\s\S]+?(?=    metaRow\.append\(postedAt\))/)[0]
    .replace(' as HTMLTimeElement', '');
  const render = new Function('el', 'm', 'when', stamp + 'return postedAt;');
  const at = '2026-11-17T18:30:00.000Z';
  const date = render((tag, cls, text) => ({ tag, text }), { at, edits: 1 }, () => 'Nov 17');
  assert.equal(date.tag, 'time');
  assert.equal(date.dateTime, at);
  assert.equal(date.title, new Date(at).toLocaleString(undefined, { timeZoneName: 'short' }));
  assert.equal(date.text, 'Nov 17 · edited 1×');
});
