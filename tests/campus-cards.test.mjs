import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { cards, prepareStorage, tokenMetadata } from '../scripts/campus-cards-mint-desk.mjs';

const series = JSON.parse(readFileSync(new URL('../src/data/campus-cards.json', import.meta.url), 'utf8'));

test('every set is twelve cards with the published rarity mix', () => {
  assert.deepEqual(series.sets.map((set) => set.campus), series.campuses.map((c) => c.slug));
  assert.equal(series.sets.length, 10);
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

test('token ids run in set order: twelve per campus, Santa Cruz ends at 119', () => {
  const all = cards();
  assert.equal(all.length, 120);
  assert.equal(all.find((c) => c.set.id === 'set-02').tokenId, 12);
  assert.equal(all.at(-1).tokenId, 119);
  assert.equal(all.at(-1).set.campus, 'santa-cruz');
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

test('console pin plan covers every image, token JSON and the contract JSON, then unlocks origination', async () => {
  const lib = await import('../src/lib/campus-cards-mint.mjs');
  const n = lib.cards(series).length;
  const plan = lib.pinPlan(series, {});
  assert.equal(plan.length, n * 3 + 1);
  assert.ok(plan.every((step) => !step.done));
  assert.ok(plan.filter((s) => s.url).every((s) => s.url.startsWith('/images/campus-cards/')));
  const cid = 'bafkreif5lyrusjngyjodfuo4cbgjlfjfv7zqefgjbx4iyss7boqrsztvca';
  const pins = { images: {}, tokens: {}, contract: { cid } };
  for (const c of lib.cards(series)) { pins.images[c.tokenId] = { svg: { cid }, png: { cid } }; pins.tokens[c.tokenId] = { cid }; }
  assert.ok(lib.pinsComplete(series, pins));
  assert.equal(lib.tokenMetadata(series, lib.cards(series)[0], pins).artifactUri, `ipfs://${cid}`);
  const code = JSON.parse(readFileSync(new URL('../contracts/build/campus_cards/step_003_cont_0_contract.json', import.meta.url), 'utf8'));
  const tpl = JSON.parse(readFileSync(new URL('../contracts/build/campus_cards/step_003_cont_0_storage.json', import.meta.url), 'utf8'));
  const { complete, storage } = lib.prepareStorage(series, code, tpl, pins, { admin: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw', treasury: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw' });
  assert.ok(complete);
  assert.ok(!JSON.stringify(storage).includes(lib.hex('__CAMPUS')));
});
