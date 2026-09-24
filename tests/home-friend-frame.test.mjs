import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { STARTERS, DAYS } from '../src/lib/friend-frame.ts';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('friend frame hangs in the signal deck after the keyboard strip and before the footer', async () => {
  const deck = await read('src/components/HomeV2SignalDeck.astro');
  const strip = deck.indexOf('<HomeKeyboardStrip />');
  const frame = deck.indexOf('<HomeFriendFrame />');
  assert.ok(strip > -1 && frame > strip && frame < deck.indexOf('signal-deck__foot">'));
  const component = await read('src/components/HomeFriendFrame.astro');
  assert.match(component, /href="\/friend-frame\/"/);
  assert.match(component, /\/api\/friend-frame\/frame\?id=town/, 'the module reads the live town frame');
  assert.match(component, /from '\.\.\/lib\/friend-frame'/, 'stand-ins come from the shared rules');
});

test('the wall carries the same seven house stand-ins as the shared rules', async () => {
  const page = await read('public/friend-frame/index.html');
  assert.equal(STARTERS.length, 7);
  for (const s of STARTERS) {
    assert.ok(page.includes(`friend: "${s.friend}"`), `${s.friend} missing from the page`);
    assert.ok(page.includes(JSON.stringify(s.poem)), `${s.friend}'s poem drifted`);
  }
  for (const d of DAYS) assert.ok(page.includes(`'${d}'`));
});

test('seat and owner keys travel in the URL fragment, never the query string', async () => {
  const page = await read('public/friend-frame/index.html');
  assert.match(page, /#k=\$\{key\}/);
  assert.match(page, /#o=\$\{OWNER_KEY\}/);
  assert.doesNotMatch(page, /[?&](k|o|key|ownerKey)=\$\{/);
  assert.match(page, /noindex/);
});

for (const id of ['0617', '0620']) {
  test(`block ${id} announces friend frame in the garden`, async () => {
    const block = JSON.parse(await read(`src/content/blocks/${id}.json`));
    assert.equal(block.channel, 'GDN');
    assert.ok(block.companions.some((c) => c.id === 'https://pointcast.xyz/friend-frame/'));
    assert.ok(block.dek.length <= 200);
    assert.ok(block.companions.length <= 12);
    for (const c of block.companions) assert.ok(c.id.length <= 80 && c.label.length <= 80);
  });
}
