import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('friend frame hangs in the signal deck after the keyboard strip and before the footer', async () => {
  const deck = await read('src/components/HomeV2SignalDeck.astro');
  const strip = deck.indexOf('<HomeKeyboardStrip />');
  const frame = deck.indexOf('<HomeFriendFrame />');
  assert.ok(strip > -1 && frame > strip && frame < deck.indexOf('signal-deck__foot">'));
  const component = await read('src/components/HomeFriendFrame.astro');
  assert.match(component, /href="\/friend-frame\/"/);
  assert.match(component, /timeZone: 'America\/Los_Angeles'/);
});

test('friend frame page and homepage share the same seven starters', async () => {
  const data = JSON.parse(await read('src/data/friend-frame.json'));
  const page = await read('public/friend-frame/index.html');
  assert.equal(data.length, 7);
  for (const frame of data) {
    assert.match(page, new RegExp(`friend:'${frame.friend}'`));
    assert.ok(page.includes(JSON.stringify(frame.poem).slice(1, -1)), `${frame.friend}'s poem drifted`);
  }
  assert.match(page, /Changes live only while this page is open/);
});

test('block 0617 announces friend frame in the garden', async () => {
  const block = JSON.parse(await read('src/content/blocks/0617.json'));
  assert.equal(block.channel, 'GDN');
  assert.equal(block.title, 'Friend Frame · a frame your friends program');
  assert.ok(block.companions.some((c) => c.id === 'https://pointcast.xyz/friend-frame/'));
  assert.ok(block.dek.length <= 200);
  for (const c of block.companions) assert.ok(c.id.length <= 80 && c.label.length <= 80);
});
