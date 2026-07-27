import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadPromoData() {
  const script = `
    import {
      DIGITAL_PETS_PROMO_ANGLES,
      DIGITAL_PETS_PROMO_ASSETS,
      DIGITAL_PETS_SINGLE_POSTS,
      DIGITAL_PETS_X_THREAD,
      DIGITAL_PETS_OUTREACH_NOTES,
      DIGITAL_PETS_LAUNCH_SEQUENCE,
    } from './src/lib/digital-pets-promo.ts';
    process.stdout.write(JSON.stringify({
      angles: DIGITAL_PETS_PROMO_ANGLES,
      assets: DIGITAL_PETS_PROMO_ASSETS,
      singles: DIGITAL_PETS_SINGLE_POSTS,
      thread: DIGITAL_PETS_X_THREAD,
      outreach: DIGITAL_PETS_OUTREACH_NOTES,
      sequence: DIGITAL_PETS_LAUNCH_SEQUENCE,
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('digital-pets promotion compresses the book into bounded reusable copy', () => {
  const promo = loadPromoData();

  assert.equal(promo.angles.length, 3);
  assert.equal(promo.thread.length, 7);
  assert.equal(promo.singles.length, 4);
  assert.equal(promo.outreach.length, 3);
  assert.equal(promo.sequence.length, 5);
  assert.equal(new Set(promo.angles.map((angle) => angle.id)).size, 3);
  assert.equal(new Set(promo.singles.map((post) => post.id)).size, 4);

  promo.thread.forEach((post, index) => {
    assert.equal(post.number, index + 1);
    assert.ok(post.text.length >= 80, `thread post ${post.number} is too short`);
    assert.ok(post.text.length <= 280, `thread post ${post.number} is ${post.text.length} characters`);
  });

  promo.singles.forEach((post) => {
    assert.ok(post.text.length <= 280, `${post.id} is ${post.text.length} characters`);
    assert.match(post.text, /https:\/\/pointcast\.xyz\/digital-pets/);
  });
});

test('promotion artwork reuses the published book assets', async () => {
  const promo = loadPromoData();
  assert.equal(promo.assets.length, 4);

  for (const asset of promo.assets) {
    const file = await stat(new URL(`public${asset.path}`, root));
    assert.ok(file.size > 8_000, `${asset.path} is unexpectedly small`);
  }
});

test('campaign desk has human, JSON, book, share-kit, and discovery surfaces', async () => {
  const [page, json, promoData, book, shareKit, sitemap, agents, forAgents, llms, llmsFull] = await Promise.all([
    read('src/pages/digital-pets/share.astro'),
    read('src/pages/digital-pets/share.json.ts'),
    read('src/lib/digital-pets-promo.ts'),
    read('src/pages/digital-pets.astro'),
    read('src/lib/share-kit.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  assert.match(page, /DIGITAL_PETS_X_THREAD\.map/);
  assert.match(page, /data-native-share/);
  assert.match(page, /Copy full thread/);
  assert.match(json, /\.\.\.DIGITAL_PETS_PROMO_META/);
  assert.match(promoData, /pointcast\.digital-pets-promo\/v1/);
  assert.match(book, /href="\/digital-pets\/share"/);
  assert.match(shareKit, /key: 'digital-pets'/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\/share\.json/);
  assert.match(agents, /digitalPetsCampaign: 'https:\/\/pointcast\.xyz\/digital-pets\/share\.json'/);
  assert.match(forAgents, /\/digital-pets\/share\.json/);
  assert.match(llms, /book’s campaign desk/);
  assert.match(llmsFull, /owned promotion desk/);
});
