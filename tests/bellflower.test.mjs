import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  BELLFLOWER_META,
  BELLFLOWER_RECEIPT_SCHEMA,
  BELLFLOWER_STAGES,
} from '../src/lib/bellflower.mjs';

const pageUrl = new URL('../src/pages/bellflower.astro', import.meta.url);
const audioUrl = new URL('../src/lib/bellflower-audio.ts', import.meta.url);
const jsonUrl = new URL('../src/pages/bellflower.json.ts', import.meta.url);

test('Bellflower has one authored ten-stage progression', () => {
  assert.equal(BELLFLOWER_META.route, '/bellflower');
  assert.equal(BELLFLOWER_META.stageCount, 10);
  assert.equal(BELLFLOWER_STAGES.length, 10);
  assert.equal(new Set(BELLFLOWER_STAGES.map((stage) => stage.id)).size, 10);
  assert.equal(new Set(BELLFLOWER_STAGES.map((stage) => stage.background)).size, 10);
  assert.equal(new Set(BELLFLOWER_STAGES.map((stage) => stage.nounId)).size, 10);
  assert.equal(BELLFLOWER_STAGES.at(-1).id, 'resonant-garden');
  assert.equal(BELLFLOWER_STAGES.at(-1).strikesRequired, 5);

  for (const stage of BELLFLOWER_STAGES) {
    assert.match(stage.background, /^\/images\/shrines\/.+\.png$/);
    assert.ok(stage.strikesRequired >= 1 && stage.strikesRequired <= 5);
    assert.ok(stage.sound.baseHz >= 100 && stage.sound.baseHz <= 500);
    assert.ok(stage.sound.partials.length >= 4);
    assert.ok(stage.midjourney.includes('--ar 16:9'));
  }
});

test('immersive game exposes tactile controls, local progress, keyboard input, and receipt', async () => {
  const source = await readFile(pageUrl, 'utf8');

  assert.doesNotMatch(source, /BlockLayout|BaseLayout/);
  assert.match(source, /height:\s*100svh/);
  assert.match(source, /data-sound/);
  assert.match(source, /data-replay/);
  assert.match(source, /data-back/);
  assert.match(source, /data-next/);
  assert.match(source, /data-restart/);
  assert.match(source, /data-receipt-json/);
  assert.match(source, /localStorage\.setItem\(runtime\.storageKey/);
  assert.match(source, /localStorage\.setItem\(runtime\.receiptKey/);
  assert.match(source, /event\.key\s*!==\s*' '\s*&&\s*event\.key\s*!==\s*'Enter'/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.match(source, /data-motion/);
  assert.match(source, /motion'\)\s*===\s*'reduced'/);
  assert.match(source, /isReducedMotion/);
  assert.match(source, /min-height:\s*44px/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /Created for Michael Hoydich/);
});

test('audio is original, user-gated, limited, spatial, and sample-free', async () => {
  const source = await readFile(audioUrl, 'utf8');

  assert.match(source, /new AudioContextClass\(\)/);
  assert.match(source, /createDynamicsCompressor/);
  assert.match(source, /createConvolver/);
  assert.match(source, /makePinkNoise/);
  assert.match(source, /createStereoPanner/);
  assert.match(source, /quietPriorVoices/);
  assert.match(source, /master\.gain\.value\s*=\s*muted\s*\?\s*0\s*:\s*0\.38/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /new Audio\s*\(/);
  assert.doesNotMatch(source, /\.(mp3|wav|ogg|m4a)/i);
});

test('JSON companion documents rights, prompts, storage, and receipt schema', async () => {
  const source = await readFile(jsonUrl, 'utf8');

  assert.equal(BELLFLOWER_RECEIPT_SCHEMA, 'pointcast.bellflower.receipt.v1');
  assert.match(source, /bbcRecordingsUsed:\s*false/);
  assert.match(source, /sound-effects\.bbcrewind\.co\.uk/);
  assert.match(source, /fetchedRecordings:\s*\[\]/);
  assert.match(source, /Original browser-native Web Audio synthesis/);
  assert.match(source, /local-browser-only/);
  assert.match(source, /laterArtPrompt/);
  assert.match(source, /does not label the live backgrounds as Midjourney outputs/);
});
