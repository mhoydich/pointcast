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

test('a Spotify share link (or spotify: URI) keeps its full kind detection, tracking params are dropped, and the other six accepted services are a host check, never fetch() of their own', () => {
  assert.ok(shelf.includes(String.raw`/^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2,5}\/)?(track|album|playlist|episode|show)\/`));
  assert.ok(shelf.includes('url: `https://open.spotify.com/${m[1]}/${m[2]}`'));
  assert.match(shelf, /Nothing is posted until you press the button\./);
  for (const host of [String.raw`music\.apple\.com`, String.raw`youtube\.com`, String.raw`soundcloud\.com`, String.raw`bandcamp\.com`, String.raw`tidal\.com`, String.raw`deezer\.com`]) assert.ok(shelf.includes(host), host);
  assert.match(shelf, /a link from Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, Tidal or Deezer/);
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

// The listening wall (2026-09-21): opt-in, local-only analysis.
const viz = read('src/components/HomeMusicViz.astro');

test('the shelf opens with the wall, and listening is the way in', () => {
  assert.match(shelf, /<HomeMusicViz \/>\s+<ol class="musicon__steps">/);
  assert.match(viz, /class="mviz__cta" data-mviz-mic/);
  assert.match(viz, /Nothing is recorded and nothing leaves this browser\./);
});

test('the microphone is only opened by a click, is never played back, recorded or sent, and is always released', () => {
  assert.equal([...viz.matchAll(/getUserMedia\(/g)].length, 1);
  assert.match(viz, /micBtn\.addEventListener\('click', \(\) => void listen\('mic'\)\)/);
  assert.doesNotMatch(viz, /\.destination|MediaRecorder|\bfetch\(|sendBeacon|WebSocket|XMLHttpRequest/);
  assert.match(viz, /echoCancellation: false, noiseSuppression: false, autoGainControl: false/);
  assert.match(viz, /stream\?\.getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/);
  for (const hook of ["'astro:before-swap'", "'pagehide'", "addEventListener('ended'"]) assert.ok(viz.includes(hook), hook);
});

test('the wall only animates while it is on screen, and calms down for reduced motion', () => {
  assert.match(viz, /new IntersectionObserver\(/);
  assert.match(viz, /document\.visibilityState === 'visible'/);
  assert.match(viz, /prefers-reduced-motion: reduce/);
});
