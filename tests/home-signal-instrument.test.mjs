import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const indexSource = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
// front door rebuilt 2026-09-01: the front-door instrument is now the four-pad Rosebud in HomePlayFirst.
const playFirstSource = await readFile(new URL('../src/components/HomePlayFirst.astro', import.meta.url), 'utf8');
const signalSource = await readFile(new URL('../src/lib/home-signals.ts', import.meta.url), 'utf8');
const endpointSource = await readFile(new URL('../src/pages/signals.json.ts', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../src/styles/front-door-fresh.css', import.meta.url), 'utf8');

test('front door exposes the four-pad Rosebud instrument', () => {
  // front door rebuilt 2026-09-01: the four-position signal tuner became the four Rosebud pads, mounted first and carrying the only <h1>.
  assert.match(indexSource, /<HomePlayFirst taps=\{PINNED\.drumTaps\} blockCount=\{blockCount\} \/>/);
  assert.ok(indexSource.indexOf('<HomePlayFirst') < indexSource.indexOf('<HomeStartHere'));
  assert.equal((indexSource.match(/<h1\b/g) ?? []).length, 0);
  assert.equal((`${indexSource}${playFirstSource}`.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((playFirstSource.match(/\{ id: '[a-z]+', key: '[A-Z]', name: '[A-Za-z]+'/g) ?? []).length, 4);
  assert.match(playFirstSource, /role="group" aria-label="Rosebud drum pads"/);
  assert.match(playFirstSource, /data-hit-count/);
  assert.match(playFirstSource, /data-drum-global/);
  assert.match(playFirstSource, /<a href="\/rosebud">Open the full garden<\/a>/);
  // missing door on the rebuilt front door: /signals.json (src/pages/signals.json.ts still ships) — left as-is for the orchestrator.
  assert.match(indexSource, /\/signals\.json/);
  assert.equal((signalSource.match(/frequency: '[A-Z]{3,4}-\d{2,3}'/g) ?? []).length, 4);
  assert.match(signalSource, /frequency: 'NOUN-115'/);
  assert.match(signalSource, /title: 'Noun shared pulse'/);
});

test('Rosebud pads support direct selection, keyboard keys, and Enter/Space', () => {
  // front door rebuilt 2026-09-01: tune()/wraparound/arrow keys became hit()/keyMap/pointerdown on the Rosebud pads.
  assert.match(playFirstSource, /const hit = \(drum\) =>/);
  assert.match(playFirstSource, /const keyMap = \{ a: 'kick', s: 'bloom', k: 'dew', l: 'thorn' \}/);
  assert.match(playFirstSource, /querySelectorAll\('\[data-drum\]'\)/);
  assert.match(playFirstSource, /addEventListener\('pointerdown'/);
  assert.match(playFirstSource, /window\.addEventListener\('keydown'/);
  assert.match(playFirstSource, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(playFirstSource, /classList\.add\('is-hit'\)/);
});

test('signals endpoint publishes a privacy-bounded machine-readable contract', () => {
  assert.match(endpointSource, /Access-Control-Allow-Origin/);
  assert.match(endpointSource, /Selection happens in the visitor browser/);
  assert.match(endpointSource, /directSelection: true/);
  assert.match(endpointSource, /reducedMotion: true/);
});

test('signal tuner retains reduced-motion and mobile treatments', () => {
  assert.match(styleSource, /prefers-reduced-motion/);
  assert.match(styleSource, /fresh-signal-tuner/);
  assert.match(styleSource, /fresh-signal-tuner__presets/);
});

test('front door points private identity to /me and keeps the current field edition bright', () => {
  assert.match(indexSource, /href="\/me"[^>]*>Your profile<\/a>/);
  assert.match(indexSource, /title="Private PointCast identity and holdings"/);
  assert.match(indexSource, /href: '\/reviews\/tone-bloom'/);
  assert.match(indexSource, /href: '\/beach-commons\/v18'/);
  assert.match(indexSource, /href: '\/beach-commons\/v11'/);
  assert.match(indexSource, /\/me · linked identities \+ holdings/);
  assert.match(styleSource, /\.fresh-field-card--tone/);
  assert.match(styleSource, /\.fresh-field-card--beach/);
});
