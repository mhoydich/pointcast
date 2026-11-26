// The Pages Function worker was counting every static file because root
// middleware compiles to include "/*". These excludes put hashed assets and
// images back on the static path. Function routes stay included.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function ruleMatches(rule, path) {
  const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
}

function invokesFunction(routes, path) {
  if (routes.exclude.some((rule) => ruleMatches(rule, path))) return false;
  return routes.include.some((rule) => ruleMatches(rule, path));
}

test('static assets skip the Pages Function and dynamic routes do not', () => {
  const routes = JSON.parse(read('public/_routes.json'));
  assert.equal(routes.version, 1);
  assert.deepEqual(routes.include, ['/*']);
  assert.ok(routes.include.length + routes.exclude.length <= 100);
  const excluded = [
    '/_astro/BlockLayout.CvpvXm24.css',
    '/_astro/app.BQmMf-Ee.js',
    '/images/segundo-line/line-hero.webp',
    '/images/home-share/2026-10/02-listening-garden.png',
    '/fonts/inter.woff2',
    '/js/pc-layers.js',
    '/favicon.svg',
    '/art/after-hours-2026-11-02/piece.webp',
    '/downloads/spaceship-gardens/pack.zip',
    '/games/nouns-drum-club/app.js',
  ];
  const included = [
    '/',
    '/for-agents',
    '/for-agents/',
    '/api/weather',
    '/api/presence/snapshot',
    '/api/shortwave',
    '/og/page.png',
    '/og/kennel-club/today.png',
    '/og/live/drum.png',
    '/og/almanac/2026-11-03.png',
    '/morning.json',
    '/kennel-club.json',
    '/now-playing.json',
    '/morning.xml',
    '/audio/starjam/welcome.m4a',
    '/chime/chime-demo.wav',
    '/googlef8cd34fe0ae765d9.html',
  ];
  for (const path of excluded) assert.equal(invokesFunction(routes, path), false, path);
  for (const path of included) assert.equal(invokesFunction(routes, path), true, path);
  const splats = routes.exclude.filter((rule) => rule.endsWith('/*'));
  for (const splat of splats) {
    const prefix = splat.slice(0, -1);
    for (const rule of routes.exclude) {
      if (rule !== splat) assert.equal(rule.startsWith(prefix), false, `${splat} overlaps ${rule}`);
    }
  }
});

test('hashed Astro bundles drop the site-wide no-store header', () => {
  const headers = read('public/_headers');
  const block = headers.slice(headers.indexOf('/_astro/*'));
  assert.match(block, /\/_astro\/\*\n {2}! Cache-Control\n {2}Cache-Control: public, max-age=31536000, immutable/);
});
