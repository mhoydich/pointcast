import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const companion = JSON.parse(readFileSync(new URL('src/data/steve-miller-band.json', root), 'utf8'));
const page = readFileSync(new URL('src/pages/steve-miller-band.astro', root), 'utf8');
const script = page.match(/<script define:vars=\{\{ companion \}\}>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Run the actual shipped controller');

function open(query = '', stored = null, denied = false) {
  const preview = { textContent: '' };
  const status = { textContent: '' };
  const saved = [];
  let rewritten = null;
  const localStorage = {
    getItem() { if (denied) throw Error('blocked'); return stored && JSON.stringify(stored); },
    setItem(key, value) { if (denied) throw Error('blocked'); saved.push({ key, value }); },
  };
  const element = {
    querySelectorAll: () => [],
    querySelector: (selector) => selector === '[data-smb-preview]' ? preview : status,
    addEventListener() {},
  };
  vm.runInNewContext(script, {
    companion, URL, URLSearchParams, Date, JSON, Set, localStorage,
    document: { querySelector: () => element },
    location: { search: query, href: 'https://pointcast.xyz/steve-miller-band/' + query },
    history: { replaceState(_state, _title, url) { rewritten = String(url); } },
  }, { timeout: 1000 });
  return { receipt: JSON.parse(preview.textContent), rewritten, saved };
}

for (const era of companion.eras) {
  test(`an era-only link preserves ${era.id} and selects a matching track`, () => {
    const result = open('?era=' + era.id);
    assert.equal(result.receipt.era.id, era.id);
    assert.equal(companion.songs.find((song) => song.id === result.receipt.song.id).era, era.id);
    assert.equal(new URL(result.rewritten).searchParams.get('era'), era.id);
    assert.equal(result.saved.length, 1);
  });
}

test('an explicit valid song determines its era when URL fields conflict', () => {
  const result = open('?era=bay&song=abracadabra&persona=gangster');
  assert.equal(result.receipt.song.id, 'abracadabra');
  assert.equal(result.receipt.era.id, 'later');
});

test('invalid song input cannot override a valid era', () => {
  const result = open('?era=joker&song=unknown');
  assert.equal(result.receipt.era.id, 'joker');
  assert.equal(result.receipt.song.id, 'the-joker');
});

test('stored complete selections retain the existing song/era relationship', () => {
  const result = open('', { era: 'later', song: 'space-cowboy', persona: companion.defaults.persona });
  assert.equal(result.receipt.song.id, 'space-cowboy');
  assert.equal(result.receipt.era.id, 'bay');
});

test('defaults and storage-denied visits remain usable', () => {
  for (const denied of [false, true]) {
    const result = open('', null, denied);
    assert.equal(result.receipt.song.id, companion.defaults.song);
    assert.equal(result.receipt.era.id, companion.defaults.era);
    assert.equal(result.rewritten, null);
  }
});
