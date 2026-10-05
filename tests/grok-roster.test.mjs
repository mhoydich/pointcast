import test from 'node:test';
import assert from 'node:assert/strict';
import roster from '../src/data/grok-roster.json' with { type: 'json' };
import { renderPortrait } from '../src/lib/nouns-parts.mjs';

const everyone = [
  roster.partner,
  roster.lineJudge,
  ...roster.crowd,
  ...roster.favorite,
];

test('every grok portrait is an official-parts combination with noggles', () => {
  const seen = new Set();
  for (const player of everyone) {
    const art = renderPortrait(player.parts);
    assert.match(art.svg, /^<svg width="320" height="320" viewBox="0 0 320 320"/);
    assert.match(art.svg, /<rect /);
    assert.equal(art.svg.includes('Noun '), false);
    assert.equal(player.parts.glasses.startsWith('glasses-'), true);
    assert.equal(art.traits.glasses.length > 0, true);
    assert.equal(art.traits.body.length > 0, true);
    const key = JSON.stringify(player.parts);
    assert.equal(seen.has(key), false, `${player.name} repeats a combo`);
    seen.add(key);
    for (const word of [art.traits.body.split(' ')[0], art.traits.head.split(' ')[0]]) {
      assert.match(player.report.toLowerCase(), new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test("grok's favorite 10 are seeds 1 through 10", () => {
  assert.deepEqual(roster.favorite.map((p) => p.seed), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(roster.favorite.map((p) => p.name)).size, 10);
});
