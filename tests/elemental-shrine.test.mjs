import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/elemental-shrine.astro', import.meta.url);
const audioUrl = new URL(
  '../src/assets/shrines/elemental-shrine/elemental-shrine-elevenlabs.m4a',
  import.meta.url,
);
const socialCardUrl = new URL(
  '../src/assets/shrines/elemental-shrine/elemental-shrine-og.png',
  import.meta.url,
);
const provenanceUrl = new URL(
  '../src/assets/shrines/elemental-shrine/soundscape-provenance.json',
  import.meta.url,
);
const appsUrl = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const launchStripUrl = new URL('../src/components/AppLaunchStrip.astro', import.meta.url);

test('Elemental Shrine presents the four presences as native controls', async () => {
  const source = await readFile(shrineUrl, 'utf8');

  for (const element of ['stone', 'light', 'fire', 'water']) {
    assert.match(source, new RegExp(`data-element=["']${element}["']`));
  }
  assert.equal([...source.matchAll(/data-element=["'](?:stone|light|fire|water)["']/g)].length, 4);
  assert.equal([...source.matchAll(/aria-pressed=["']false["']/g)].length >= 5, true);
  assert.match(source, /<button[\s\S]{0,420}data-element=["']light["']/);
  assert.match(source, /<button[\s\S]{0,420}data-element=["']stone["']/);
  assert.match(source, /<button[\s\S]{0,420}data-element=["']fire["']/);
  assert.match(source, /<button[\s\S]{0,420}data-element=["']water["']/);
  for (const phrase of ['set it down', 'let it be seen', 'let it change', 'let it pass']) {
    assert.match(source, new RegExp(phrase));
  }
});

test('Elemental Shrine keeps the ElevenLabs soundscape opt-in and bounded', async () => {
  const source = await readFile(shrineUrl, 'utf8');
  const audio = await stat(audioUrl);
  const provenance = JSON.parse(await readFile(provenanceUrl, 'utf8'));

  assert.ok(audio.size > 100_000, 'soundscape should contain a real encoded audio asset');
  assert.ok(audio.size < 1_000_000, 'soundscape should remain practical for a web shrine');
  assert.match(source, /elemental-shrine-elevenlabs\.m4a\?url/);
  assert.match(source, /<audio[\s\S]{0,240}\bloop\b/);
  assert.doesNotMatch(source, /<audio[^>]+autoplay/);
  assert.match(source, /Begin listening/);
  assert.match(source, /await\s+ambience\.play\(\)/);
  assert.match(source, /createDynamicsCompressor\(\)/);
  assert.match(source, /activeVoices\s*>=\s*4/);
  assert.match(source, /cueLocks[\s\S]{0,300}<\s*350/);
  assert.match(source, /Sound unavailable — the shrine still works silently\./);
  assert.match(source, /Original elemental soundscape created with ElevenLabs\./);
  assert.equal(provenance.provider, 'ElevenLabs Sound Effects');
  assert.equal(provenance.source.durationSeconds, 30);
  assert.equal(provenance.webAsset.file, 'elemental-shrine-elevenlabs.m4a');
});

test('Elemental Shrine completes without network state and can begin again', async () => {
  const source = await readFile(shrineUrl, 'utf8');

  assert.match(source, /visited\.size\s*===\s*presenceButtons\.length/);
  assert.match(source, /All four are present\./);
  assert.match(source, /Nothing more is asked\./);
  assert.match(source, /Begin again/);
  assert.match(source, /visited\.clear\(\)/);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});

test('Elemental Shrine respects motion, focus, visibility, and native scrolling', async () => {
  const source = await readFile(shrineUrl, 'utf8');

  assert.match(source, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(source, /:focus-visible/);
  assert.match(source, /aria-live=["']polite["']/);
  assert.match(source, /id=["']es-completion["'][^>]+\binert\b/);
  assert.match(source, /role=["']group["']\s+aria-label=["']Sound controls["']/);
  assert.match(source, /role=["']group["']\s+aria-label=["']Four elemental presences["']/);
  assert.match(source, /stopListening\([\s\S]{0,180}immediate/);
  assert.match(source, /let\s+listeningIntent\s*=\s*false/);
  assert.match(source, /let\s+soundOperation\s*=\s*0/);
  assert.match(source, /operation\s*!==\s*soundOperation/);
  assert.match(source, /try\s*\{\s*context\s*=\s*getAudioContext\(\)/);
  assert.match(source, /document\.addEventListener\(\s*["']visibilitychange["']/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /audioContext\?\.state\s*===\s*["']running["']/);
  assert.match(source, /touch-action:\s*manipulation/);
  assert.doesNotMatch(source, /touch-action:\s*none/);
  assert.doesNotMatch(source, /cursor:\s*none/);
  assert.match(source, /min-height:\s*48px/);
  assert.ok(
    source.indexOf('first?.focus()') < source.indexOf("completion.setAttribute('aria-hidden', 'true')"),
    'focus should leave the completion region before it becomes hidden and inert',
  );
});

test('Elemental Shrine metadata and PointCast discovery agree', async () => {
  const [source, apps, launchStrip] = await Promise.all([
    readFile(shrineUrl, 'utf8'),
    readFile(appsUrl, 'utf8'),
    readFile(launchStripUrl, 'utf8'),
  ]);

  await Promise.all([access(socialCardUrl), access(audioUrl)]);
  assert.match(source, /Elemental Shrine · Four Presences/);
  assert.match(source, /https:\/\/pointcast\.xyz\/elemental-shrine/);
  assert.match(source, /elemental-shrine-og\.png/);
  assert.match(source, /["']@type["']:\s*["']WebApplication["']/);
  assert.match(source, /<BlockLayout[\s\S]{0,420}\bimmersive\b/);
  assert.match(apps, /slug:\s*["']elemental-shrine["']/);
  assert.match(apps, /path:\s*["']\/elemental-shrine["']/);
  assert.match(launchStrip, /name:\s*["']ELEMENTAL["']/);
  assert.match(launchStrip, /href:\s*["']\/elemental-shrine["']/);
});
