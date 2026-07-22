import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import {
  DRUM_RUSH_DURATION_MS,
  drumRushRank,
  drumRushShareText,
} from '../src/lib/drum-rush.mjs';

test('Noun Rush lasts four seconds', () => {
  assert.equal(DRUM_RUSH_DURATION_MS, 4_000);
});

test('Noun Rush ranks scores at the intended thresholds', () => {
  assert.equal(drumRushRank(0).label, 'the drum is waiting');
  assert.equal(drumRushRank(1).label, 'first spark');
  assert.equal(drumRushRank(12).label, 'groove finder');
  assert.equal(drumRushRank(24).label, 'room shaker');
  assert.equal(drumRushRank(40).label, 'thunder noun');
});

test('Noun Rush normalizes unsafe scores and builds a challenge line', () => {
  assert.equal(drumRushRank(-8).label, 'the drum is waiting');
  assert.equal(drumRushRank(Number.NaN).label, 'the drum is waiting');
  assert.match(drumRushShareText(41.8), /scored 41/);
  assert.match(drumRushShareText(41.8), /thunder noun/);
});

test('Noun Rush is wired into Drum Room v3 as a local, shareable tap surface', async () => {
  const source = await readFile(new URL('../src/pages/drum-v3.astro', import.meta.url), 'utf8');

  assert.match(source, /id=['"]v3-rush['"]/);
  assert.match(source, /id=['"]v3-rush-board['"][\s\S]{0,220}role=['"]button['"]/);
  assert.match(source, /aria-label=['"]Tap the Noun Rush drum['"]/);
  assert.match(source, /rushBoardEl\?\.addEventListener\(['"]pointerdown['"]/);
  assert.match(source, /rushBoardEl\?\.addEventListener\(['"]keydown['"]/);
  assert.match(source, /scoreRushTap\(mult\)/);
  assert.match(source, /pc:drum-v3:rush-best/);
  assert.match(source, /navigator\.share/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /aria-live=['"]polite['"]/);
});
