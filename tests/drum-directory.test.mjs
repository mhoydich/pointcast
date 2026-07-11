import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('drum directory publishes the highlighted hub rooms', async () => {
  const directory = JSON.parse(await readFile('dist/drum.json', 'utf8'));

  assert.equal(directory.counts.rooms, 12);
  assert.equal(directory.rooms.length, directory.counts.rooms);
  assert.equal(new Set(directory.rooms.map((room) => room.slug)).size, directory.rooms.length);

  for (const room of directory.rooms) {
    assert.equal(room.url, `https://pointcast.xyz/${room.slug}`);
    assert.equal(typeof room.nounId, 'number');
  }
});

test('drum page advertises its JSON directory', async () => {
  const page = await readFile('dist/drum/index.html', 'utf8');
  assert.match(page, /href="\/drum\.json"/);
});
