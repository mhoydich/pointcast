import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Keyboard Bloom plays inside the above-fold signal deck', async () => {
  const deck = await read('src/components/HomeV2SignalDeck.astro');
  const strip = await read('src/components/HomeKeyboardStrip.astro');
  assert.match(deck, /import HomeKeyboardStrip from '\.\/HomeKeyboardStrip\.astro'/);
  assert.ok(deck.indexOf('<HomeKeyboardStrip />') < deck.indexOf('signal-deck__foot">'));
  assert.match(strip, /<a href="\/keyboard">/);
  assert.equal((strip.match(/<h1\b/g) ?? []).length, 0);
});

test('the strip only owns the keyboard while it is on screen, and never nav keys', async () => {
  const strip = await read('src/components/HomeKeyboardStrip.astro');
  assert.match(strip, /new IntersectionObserver/);
  assert.match(strip, /if \(!visible \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey \|\| typing\(e\.target\) \|\| !keys\.has\(e\.code\)\) return;/);
  assert.match(strip, /capture: true/);
  for (const nav of ['Space', 'Tab', 'Enter', 'Escape', 'ArrowLeft']) assert.doesNotMatch(strip, new RegExp(`'${nav}'`));
  assert.match(strip, /astro:before-swap/);
});
