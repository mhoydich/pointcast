import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const BRAND_WORDS = /ralph|lauren|polo|burberry|barbour|brooks brothers/i;

test('Kennel Club September Sitting assigns one original portrait to every day of September', async () => {
  const series = JSON.parse(await read('src/data/kennel-club-september-sitting.json'));

  assert.equal(series.$schema, 'pointcast.kennel-club-series/v1');
  assert.equal(series.mint.chain, 'tezos');
  assert.equal(series.mint.tokenCount, 30);
  assert.equal(series.sittings.length, 30);

  const days = series.sittings.map((s) => s.day);
  assert.deepEqual(days, Array.from({ length: 30 }, (_, i) => i + 1));

  const unique = (key) => new Set(series.sittings.map((s) => s[key])).size;
  assert.equal(unique('name'), 30, 'every dog has a distinct name');
  assert.equal(unique('breed'), 30, 'every sitting is a distinct breed');
  assert.equal(unique('slug'), 30, 'every sitting has a distinct slug');
  assert.equal(unique('title'), 30, 'every sitting has a distinct title');

  for (const sitting of series.sittings) {
    const day = String(sitting.day).padStart(2, '0');
    assert.equal(sitting.tokenId, sitting.day - 1);
    assert.equal(sitting.mintDate, `2026-09-${day}`);
    assert.match(sitting.slug, new RegExp(`^${day}-[a-z]+$`));
    assert.equal(sitting.image.width, 1024);
    assert.equal(sitting.image.height, 1280);
    assert.equal(sitting.image.png, `/images/kennel-club/september-sitting/${sitting.slug}.png`);
    assert.ok(sitting.prompt.length > 400, `prompt for ${sitting.name} is fully composed`);
    assert.match(sitting.prompt, /No text, no lettering, no logos/);
    assert.match(sitting.prompt, /Asymmetrical composition/);
    assert.doesNotMatch(sitting.prompt, BRAND_WORDS, `prompt for ${sitting.name} names no brand`);
    assert.doesNotMatch(sitting.tokenMetadata.description, BRAND_WORDS);
    assert.equal(sitting.tokenMetadata.attributes[0].value, day);
  }

  assert.doesNotMatch(series.visualSystem.styleBase, BRAND_WORDS);
  assert.doesNotMatch(series.visualSystem.register, BRAND_WORDS);
});

test('Kennel Club briefs point at the series data and each other', async () => {
  const [codex, manus] = await Promise.all([
    read('docs/briefs/2026-09-02-codex-kennel-club-september-sitting.md'),
    read('docs/briefs/2026-09-02-manus-kennel-club-september-sitting-objkt.md'),
  ]);
  assert.match(codex, /src\/data\/kennel-club-september-sitting\.json/);
  assert.match(codex, /poster-image-engine\/projects\/kennel-club-september-sitting-2026\//);
  assert.match(codex, /2026-09-02-manus-kennel-club-september-sitting-objkt\.md/);
  assert.match(manus, /2026-09-02-codex-kennel-club-september-sitting\.md/);
  assert.equal((codex.match(/^\| \d{2} \| 2026-09-\d{2} \|/gm) || []).length, 30);
});
