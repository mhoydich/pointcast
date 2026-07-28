import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('OPEN HEART ships a complete human, machine, block, discovery, and ad-network release', async () => {
  const [page, manifestText, block, sitemap, llms, llmsFull, ads, adsJson, assets] = await Promise.all([
    read('src/pages/garden-signal/open-heart.astro'),
    read('public/garden-signal/open-heart.json'),
    read('src/content/blocks/0520.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/lib/open-ad-network.ts'),
    read('src/pages/ads.json.ts'),
    readdir(new URL('../public/garden-signal/open-heart/', import.meta.url)),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.match(page, /OPEN HEART/);
  assert.match(page, /4SncUHZJK8aqEfsmPB1VF5/);
  assert.match(page, /official Spotify embed/i);
  assert.match(page, /mountOpenHeartAudio/);
  assert.equal(manifest.visuals.frames.length, 4);
  assert.equal(manifest.originalAudio.voices.length, 5);
  assert.equal(manifest.originalAudio.pattern.length, 12);
  assert.equal(manifest.rightsAndProviderBoundary.recordingSampled, false);
  assert.equal(assets.filter((name) => name.endsWith('.jpg')).length, 4);
  assert.match(block, /"id": "0520"/);
  assert.match(block, /"type": "LISTEN"/);
  assert.match(sitemap, /pointcast\.xyz\/garden-signal\/open-heart\.json/);
  assert.match(llms, /OPEN HEART/);
  assert.match(llmsFull, /Garden Signal 002/);
  assert.match(ads, /PC-GARDEN-SIGNAL-OPEN-HEART-2026/);
  assert.match(adsJson, /OPEN_HEART_GARDEN_CAMPAIGN/);
});

test('OPEN HEART serves four immutable Midjourney frames and a share card', async () => {
  const [assetRoute, ogRoute, jsonRoute] = await Promise.all([
    read('src/pages/garden-signal/open-heart/assets/[asset].jpg.ts'),
    read('src/pages/images/og/garden-signal-open-heart.jpg.ts'),
    read('src/pages/garden-signal/open-heart.json.ts'),
  ]);

  assert.match(assetRoute, /getStaticPaths/);
  assert.match(assetRoute, /door-04/);
  assert.match(assetRoute, /Content-Type': 'image\/jpeg/);
  assert.match(ogRoute, /resize\(1200, 630/);
  assert.match(ogRoute, /garden-signal\/open-heart\/door-03\.jpg/);
  assert.match(jsonRoute, /Content-Type': 'application\/json/);
});

test('OPEN HEART audio is gesture-gated, sample-free, finite, and motion-safe', async () => {
  const [page, audio] = await Promise.all([
    read('src/pages/garden-signal/open-heart.astro'),
    read('src/lib/open-heart-audio.ts'),
  ]);

  assert.match(audio, /window\.AudioContext/);
  assert.match(audio, /webkitAudioContext/);
  assert.match(audio, /const TUNING = \[196, 220\.5, 261\.33, 294, 343\]/);
  assert.match(audio, /const LOOP = \[0, null, 2, 1, null, 3, 0, 4, null, 2, 1, 3\]/);
  assert.doesNotMatch(audio, /fetch\(/);
  assert.doesNotMatch(audio, /decodeAudioData/);
  assert.equal((page.match(/data-tone/g) ?? []).length, 10);
  assert.match(page, /prefers-reduced-motion: reduce/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /No interaction telemetry/);
});
