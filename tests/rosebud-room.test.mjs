import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Rosebud keeps its own room after the front door rebuild', async () => {
  const room = await read('src/pages/rosebud.astro');
  // The room is the full instrument codex shipped on 2026-08-31: four pads + the sixteen-step sequencer.
  assert.match(room, /title="Rosebud"/);
  assert.match(room, /data-rosebud-home/);
  assert.match(room, /data-drum="kick"|data-drum=\{pad\.id\}/);
  assert.match(room, /rb-step/);
  assert.match(room, /'https:\/\/pointcast\.xyz\/rosebud#rosebud'/);
  // It points back at the front door instead of calling itself the front door.
  assert.match(room, /href="\/"[^>]*>FRONT DOOR/);
  assert.doesNotMatch(room, /A NEW FRONT DOOR · FIELD TEST/);
});
