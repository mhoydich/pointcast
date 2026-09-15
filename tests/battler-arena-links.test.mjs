import test from 'node:test';
import assert from 'node:assert/strict';
import { setupFromParams } from '../public/games/nouns-nation-battler/arena-links.mjs';
import { catalog, parseMatchInput } from '../public/games/nouns-nation-battler/agent-engine.mjs';
test('annual gang selections restore all eight gangs with another opponent', () => {
  for (const gang of catalog.gangs) {
    const setup = setupFromParams(new URLSearchParams({ gang: gang.id }), catalog);
    assert.equal(setup.left.gang, gang.id);
    assert.notEqual(setup.right.gang, gang.id);
    assert.doesNotThrow(() => parseMatchInput(setup));
  }
});
test('rematch URLs preserve exact seed and chosen tactics including seed zero', () => {
  const setup = setupFromParams(new URLSearchParams('leftGang=mint-condition&rightGang=night-auction&leftTactic=flank&rightTactic=rush&seed=0'), catalog);
  assert.deepEqual(setup, { seed: 0, left: { gang: 'mint-condition', tactic: 'flank' }, right: { gang: 'night-auction', tactic: 'rush' } });
});
test('untrusted or invalid query settings fall back to playable defaults', () => {
  for (const seed of ['','-1','4294967296','NaN','1.3','Infinity','1e3']) {
    const setup = setupFromParams(new URLSearchParams({ seed, gang: '<script>', leftTactic: 'win', rightGang: '//evil.example' }), catalog);
    assert.equal(setup.seed, 42);
    assert.doesNotThrow(() => parseMatchInput(setup));
  }
});
