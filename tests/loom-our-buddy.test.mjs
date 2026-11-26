import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../public/sketches/loom-our-buddy/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]+)<\/script>/)[1];
const createPracticeRoom = runInNewContext(script + '\ncreatePracticeRoom');

test('a practice post unlocks a sample resident reply and one local claim', () => {
  const room = createPracticeRoom();
  assert.ok(room.reply().error);
  assert.ok(room.claim('practice/first-link').error);

  const post = room.post(' Reader ', ' My first note. ');
  assert.equal(post.author, 'Reader');
  assert.equal(post.body, 'My first note.');
  assert.ok(room.claim('practice/first-link').error);

  const reply = room.reply();
  assert.match(reply.author, /sample resident/);
  assert.match(reply.body, /PRACTICE-1/);
  assert.ok(room.claim('invalid branch').error);
  const claim = room.claim('practice/first-link');
  assert.equal(claim.body, 'MINE · PRACTICE-1 · Reader · branch practice/first-link');
  assert.ok(room.claim('practice/second-link').error);
});

test('practice limits keep the draft intact and each room starts empty', () => {
  const room = createPracticeRoom();
  assert.ok(room.post('  ', 'My note').error);
  assert.ok(room.post('Reader', 'x'.repeat(281)).error);
  assert.equal(room.post('Reader', '<b>Literal note</b>').body, '<b>Literal note</b>');
  assert.ok(room.post('Reader', 'Duplicate note').error);
  assert.ok(createPracticeRoom().reply().error);
});

test('the sketch is standalone and the one-paste prompt stays local', () => {
  assert.match(html, /<textarea id="prompt"[^>]*>[^<]+Stay offline and return text only\.<\/textarea>/);
  assert.match(html, /<fieldset disabled>/);
  assert.doesNotMatch(html, /<(?:script|img|iframe)[^>]+\bsrc\s*=|<form[^>]+\baction\s*=/i);
  assert.doesNotMatch(script, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/);
  assert.match(html, /github\.com\/mhoydich\/pointcast\/blob\/main\/docs\/loom\/first-post\.md/);
  assert.match(html, /a1fd6f7c6758a80936c008c62474441868c11295\/public\/sketches\/loom-builder-week\/index\.html/);
  assert.match(html, /href="https:\/\/pointcast\.xyz\/loom\/relay"/);
});
