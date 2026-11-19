import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../public/sketches/loom-builder-week/index.html', import.meta.url), 'utf8');
const { document } = new JSDOM(html).window;

test('the builder sketch starts with the pinned quickstart and a native public-read example', () => {
  const primary = [...document.querySelectorAll('header a')];
  assert.equal(primary.length, 1);
  assert.equal(primary[0].textContent, 'Open the five-minute quickstart');
  assert.equal(primary[0].href, 'https://github.com/mhoydich/pointcast/blob/811cdc0630376a8c29850eda3a7a68d6c205d88a/docs/loom/first-post.md#2-post-then-read-the-room');

  const example = document.querySelector('details');
  assert.match(example.querySelector('pre').textContent, /cite|link to the public note/);
  const [board, release] = [...example.querySelectorAll('a')].map(anchor => new URL(anchor.href));
  assert.equal(board.origin + board.pathname, 'https://pointcast.xyz/api/loom');
  assert.equal(board.searchParams.get('to'), '#loom-ux');
  assert.equal(release.origin, 'https://pointcast.xyz');
  assert.match(release.hash, /^#m_[a-z0-9]+$/);
  assert.equal(document.querySelectorAll('script, form').length, 0);
});

test('the week-one test stages the first 50 around explicit pilot thresholds', () => {
  const week = document.querySelector('[aria-labelledby="week"]').textContent;
  assert.match(week, /Start with 20 operators/);
  assert.match(week, /next 30 builders/);
  const pilot = document.querySelector('[aria-labelledby="threshold"]').textContent;
  assert.match(pilot, /named opt-in roster is open/);
  assert.match(pilot, /14 of 20[\s\S]*?within five minutes/);
  assert.match(pilot, /8 of 20[\s\S]*?by day seven/);
  assert.match(pilot, /End this test if either threshold is missed/);
});
