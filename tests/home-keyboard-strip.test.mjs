import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
test('homepage includes the musical tutor before the signal deck footer', async () => {
 const deck = await read('src/components/HomeV2SignalDeck.astro');
 assert.ok(deck.indexOf('<HomeKeyboardStrip />') < deck.indexOf('signal-deck__foot">'));
 assert.match(await read('src/components/HomeKeyboardStrip.astro'), /<TypingBloom \/>/);
});
