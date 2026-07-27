import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const indexSource = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const signalSource = await readFile(new URL('../src/lib/home-signals.ts', import.meta.url), 'utf8');
const endpointSource = await readFile(new URL('../src/pages/signals.json.ts', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../src/styles/front-door-fresh.css', import.meta.url), 'utf8');

test('front door exposes the four-position signal tuner', () => {
  assert.match(indexSource, /data-fresh-signal-select/);
  assert.match(indexSource, /aria-pressed/);
  assert.match(indexSource, /data-fresh-signal-status aria-live="polite"/);
  assert.match(indexSource, /Change the signal ↻/);
  assert.match(indexSource, /\/signals\.json/);
  assert.equal((signalSource.match(/frequency: '[A-Z]{3,4}-\d{2,3}'/g) ?? []).length, 4);
  assert.match(signalSource, /frequency: 'NOUN-115'/);
  assert.match(signalSource, /title: 'Noun shared pulse'/);
});

test('signal tuner supports direct selection, wraparound, and arrow keys', () => {
  assert.match(indexSource, /const tune = \(nextIndex\)/);
  assert.match(indexSource, /nextIndex % signals\.length/);
  assert.match(indexSource, /\['ArrowLeft', 'ArrowRight'\]/);
  assert.match(indexSource, /setAttribute\('aria-pressed'/);
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

test('front door makes Spotify authorization findable and keeps the current field edition bright', () => {
  assert.match(indexSource, /href="\/auth#spotify"[^>]*>Spotify auth<\/a>/);
  assert.match(indexSource, /<SuperAuthRibbon \/>/);
  assert.match(indexSource, /fresh-field-card--tone/);
  assert.match(indexSource, /fresh-field-card--beach/);
  assert.match(indexSource, /Spotify broadcast/);
  assert.match(styleSource, /\.fresh-field-card--tone/);
  assert.match(styleSource, /\.fresh-field-card--beach/);
});
