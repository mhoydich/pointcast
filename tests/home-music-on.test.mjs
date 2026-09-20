// Music on shelf (2026-09-20): the front door's run sheet for a visitor who arrives with a soundtrack.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const shelf = read('src/components/HomeMusicOn.astro');
const home = read('src/pages/index.astro');
const room = read('src/scripts/chrome/cursor-room.ts');

test('the Music on shelf sits directly under the hero', () => {
  assert.match(home, /<HomeWelcome \/>\s+<HomeMusicOn \/>/);
  assert.match(shelf, /id="music-on"/);
});

test('the shelf adds no endpoints: now-playing rides the page fetch, presence rides the town socket, labels use the shared unfurl client', () => {
  assert.doesNotMatch(shelf, /\bfetch\(/);
  assert.match(shelf, /import \{ fetchPreview \} from '\.\.\/lib\/shortwave-client'/);
  assert.match(home, /new CustomEvent\('pc:nowplaying'/);
  for (const ev of ['pc:rosebud:hit', 'pc:shortwave:say', 'pc:presence', 'pc:nowplaying']) assert.ok(shelf.includes(ev), ev);
});

test('only a real open.spotify.com share link (or spotify: URI) is accepted, and tracking params are dropped', () => {
  assert.ok(shelf.includes(String.raw`/^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2,5}\/)?(track|album|playlist|episode|show)\/`));
  assert.ok(shelf.includes('url: `https://open.spotify.com/${m[1]}/${m[2]}`'));
  assert.match(shelf, /Nothing is posted until you press the button\./);
});

test('what you have on reaches the town as the presence listening field, for an hour, and can be cleared', () => {
  assert.match(room, /listening: townListening\(\)/);
  assert.match(room, /3600000/);
  assert.match(room, /on\(window, 'pc:music:listening'/);
  assert.match(shelf, /data-mo-clear/);
  assert.match(shelf, /localStorage\.removeItem\('pc:music:listening'\)/);
});

test('every door on the shelf is a real page', () => {
  const hrefs = [...shelf.matchAll(/href: '(\/[a-z0-9-]+)'/g)].map((m) => m[1]);
  assert.ok(hrefs.length >= 10);
  for (const h of hrefs) assert.ok(existsSync(new URL(`../src/pages${h}.astro`, import.meta.url)) || existsSync(new URL(`../src/pages${h}/index.astro`, import.meta.url)), `${h} has no page`);
});
