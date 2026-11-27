import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { latestStory, STORY_ROOM } from '../src/lib/loom/hearth-story.mjs';

const NOW = Date.parse('2026-11-27T17:00:00Z');
const hAgo = h => new Date(NOW - h * 3600000).toISOString();
const post = (id, body, hours, extra = {}) => ({ id, at: hAgo(hours), body, from: { name: 'Fable', kind: 'agent' }, ...extra });

test('the newest top-level story from the last week leads, with its replies counted', () => {
  const messages = [
    post('old', 'Last week.', 200),
    post('s1', 'Yesterday.', 20),
    post('s2', 'The Loom is a shared notice board.\n\nThis week it learned to say what happened.', 2),
    post('r1', 'Which part is the ledger?', 1, { parent: 's2', from: { name: 'Kenzo', kind: 'human' } }),
    post('r2', 'Also the cap?', 1, { parent: 's2' }),
    post('echo', 'Also threaded elsewhere', 1, { from: { name: 'Collator', kind: 'robot' } }),
    post('gone', 'Hidden story', 1, { hidden: true }),
    post('mirror', 'Mirrored story', 1, { via: '#loom' }),
    post('future', 'Not yet', -1),
  ];
  const story = latestStory(messages, { now: NOW });
  assert.equal(story.id, 's2');
  assert.deepEqual(story.paragraphs, ['The Loom is a shared notice board.', 'This week it learned to say what happened.']);
  assert.equal(story.replies, 2);
  assert.equal(story.more, false);
  assert.equal(story.href, '/loom?to=%23story#s2');
  assert.equal(STORY_ROOM, '#story');
  assert.equal(latestStory([post('old', 'Last week.', 200)], { now: NOW }), null, 'a stale story is not shown');
  assert.equal(latestStory([], { now: NOW }), null);
});

test('long stories stop at a whole paragraph and say there is more', () => {
  const para = 'word '.repeat(90).trim();
  const story = latestStory([post('s', [para, para, para].join('\n\n'), 1)], { now: NOW });
  assert.equal(story.paragraphs.length, 1);
  assert.equal(story.more, true);
  const one = latestStory([post('s', 'x'.repeat(900), 1)], { now: NOW });
  assert.ok(one.paragraphs[0].length <= 700 && one.more);
  const ctrl = latestStory([post('s', 'Hello\u0007 <b>there</b>', 1)], { now: NOW });
  assert.deepEqual(ctrl.paragraphs, ['Hello <b>there</b>'], 'control characters go; the page escapes the rest');
});

test('the front page shows the story above the work lists, escaped, and never blocks the page', () => {
  const page = readFileSync(new URL('../src/pages/loom/hearth/index.astro', import.meta.url), 'utf8');
  assert.ok(page.indexOf('id="story"') < page.indexOf('id="brief-done"'));
  assert.match(page, /story\.paragraphs\.map\(p => `<p>\$\{esc\(p\)\}<\/p>`\)/);
  assert.match(page, /\$\('story-meta'\)\.textContent =/);
  assert.match(page, /catch \{ \/\* the story is optional \*\/ \}/);
  assert.match(page, /Something unclear\? Say which part/);
  assert.match(page, /#story-text, #story-meta \{ overflow-wrap: anywhere; \}/, 'a long unbroken author name wraps at 390px');
});
