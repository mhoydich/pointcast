import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { cards, prepareStorage, tokenMetadata } from '../scripts/campus-cards-mint-desk.mjs';

const series = JSON.parse(readFileSync(new URL('../src/data/campus-cards.json', import.meta.url), 'utf8'));

test('every set is twelve cards with the published rarity mix', () => {
  assert.deepEqual(series.sets.map((set) => set.campus), ['santa-barbara', 'berkeley']);
  for (const set of series.sets) {
    assert.equal(set.cards.length, 12, set.id);
    const count = (r) => set.cards.filter((c) => c.rarity === r).length;
    assert.deepEqual([count('common'), count('uncommon'), count('rare'), count('legendary')], [6, 3, 2, 1], set.id);
  }
});

test('card slugs are unique across sets (they share /campus-cards/{slug})', () => {
  const slugs = series.sets.flatMap((set) => set.cards.map((c) => c.slug));
  assert.equal(new Set(slugs).size, slugs.length);
});

test('token ids run in set order: Berkeley starts at 12', () => {
  const berkeley = cards().filter((c) => c.set.id === 'set-02');
  assert.equal(berkeley[0].tokenId, 12);
  assert.equal(berkeley.at(-1).tokenId, 23);
});

test('every card has its painted svg and png', () => {
  for (const card of cards()) {
    assert.ok(existsSync(new URL(`../${card.svg}`, import.meta.url)), card.svg);
    assert.ok(existsSync(new URL(`../${card.png}`, import.meta.url)), card.png);
    assert.match(readFileSync(new URL(`../${card.svg}`, import.meta.url), 'utf8'), /@keyframes/);
  }
});

test('token metadata stays unofficial and carries no university marks claim', () => {
  const meta = tokenMetadata(cards()[0], { images: {}, tokens: {} });
  assert.match(meta.description, /Not affiliated with, sponsored by, or endorsed by the University of California/);
  assert.equal(meta.rights, 'CC0-1.0');
  assert.equal(meta.decimals, 0);
});

test('origination storage is paused, owned by the configured admin, and points at pinned metadata', () => {
  const code = JSON.parse(readFileSync(new URL('../contracts/build/campus_cards/step_003_cont_0_contract.json', import.meta.url), 'utf8'));
  const tpl = JSON.parse(readFileSync(new URL('../contracts/build/campus_cards/step_003_cont_0_storage.json', import.meta.url), 'utf8'));
  const admin = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
  const { storage, complete } = prepareStorage(code, tpl, { images: {}, tokens: {} }, { admin, treasury: admin });
  const text = JSON.stringify(storage);
  assert.equal(complete, false);
  assert.ok(text.includes(admin));
  assert.ok(text.includes('"prim":"True"'));
  assert.ok(text.includes(Buffer.from('ipfs://__CAMPUS_CARDS_TOKEN_0_CID__').toString('hex')));
});
