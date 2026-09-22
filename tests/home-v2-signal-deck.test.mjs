import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the first V2 slice puts data-driven new drops directly below the masthead', async () => {
  const [home, deck] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeV2SignalDeck.astro'),
  ]);

  assert.match(home, /import HomeV2SignalDeck/);
  assert.match(home, /<HomeV2SignalDeck drops=\{latestWire\} total=\{blockCount\} \/>/);
  assert.ok(home.indexOf('<HomeV2SignalDeck') < home.indexOf('<HomeWelcome />'));
  assert.match(home, /allBlocks\.slice\(0, 8\)/);
  assert.match(home, /existsSync\(`public\$\{ogImage\}`\)/);
  assert.match(home, /https:\/\/noun\.pics\/\$\{d\.noun \?\? Number\(d\.id\)\}\.svg/);
  assert.doesNotMatch(deck, /059[0-9]/, 'current block ids belong to content, never the component');
  assert.match(deck, /drops\.slice\(0, 6\)/);
  assert.match(deck, /A little more/);
});

test('the drop deck works without a pointer and remembers freshness locally', async () => {
  const deck = await read('src/components/HomeV2SignalDeck.astro');
  assert.match(deck, /role="tablist"/);
  assert.match(deck, /role="tabpanel"/);
  assert.match(deck, /aria-labelledby=\{`signal-drop-\$\{first\.id\}`\}/);
  assert.match(deck, /panel\.setAttribute\('aria-labelledby', tab\.id\)/);
  assert.match(deck, /aria-selected/);
  for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) assert.ok(deck.includes(key), key);
  assert.match(deck, /pc:front-door:last-block/);
  assert.match(deck, /Since your last look/);
  assert.match(deck, /pc:nowplaying/);
  assert.match(deck, /new AbortController\(\)/);
  assert.match(deck, /astro:before-swap/);
  assert.match(deck, /prefers-reduced-motion: reduce/);
});

test('the home footer is an editorial handoff with the machine room preserved', async () => {
  const home = await read('src/pages/index.astro');
  assert.match(home, /<footer class="shelf machine home-end"/);
  assert.match(home, /Keep <em>wandering\.<\/em>/);
  assert.match(home, /class="home-end__doors"/);
  assert.match(home, /<details class="home-end__machine">/);
  for (const href of ['/downloads/', '/archive', '/random', '/shortwave', '/for-agents', '/about', '/agents.json', '/llms.txt']) {
    assert.ok(home.includes(`href="${href}"`), href);
  }
});
