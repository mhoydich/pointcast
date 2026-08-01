import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Crystal Ball Pass publishes a complete playable PointCast surface', async () => {
  const [page, manifest, data, styles] = await Promise.all([
    read('src/pages/crystal-ball-pass.astro'),
    read('src/pages/crystal-ball-pass.json.ts'),
    read('src/lib/crystal-ball-pass.ts'),
    read('src/styles/crystal-ball-pass.css'),
  ]);

  assert.match(page, /BEGIN PASSAGE/);
  assert.match(page, /CODEX MICRO/);
  assert.match(page, /CAMP MAGIC/);
  assert.match(page, /reviews\/crystal-ball-pass/);
  assert.match(page, /CRYSTAL_BALL_PASS_TRAIL/);
  assert.match(page, /AudioContext/);
  assert.match(page, /data-light-preview/);
  assert.match(data, /Fernwake Camp/);
  assert.match(data, /Crystal Ball Pass/);
  assert.equal((data.match(/place: '/g) ?? []).length, 7);
  assert.match(manifest, /pointcast\.game\.crystal-ball-pass\/v1/);
  assert.match(manifest, /connectedToGame: false/);
  assert.match(manifest, /accountDataReceived: false/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media \(max-width: 680px\)/);
});

test('Crystal Ball Pass appears in Review Center, Play, home, Block, and discovery surfaces', async () => {
  const [catalog, review, reviewJson, play, playJson, home, block, sitemap, llms, full] = await Promise.all([
    read('src/data/reviews.ts'),
    read('src/pages/reviews/crystal-ball-pass.astro'),
    read('src/pages/reviews/crystal-ball-pass.json.ts'),
    read('src/lib/play-layer.ts'),
    read('src/pages/play.json.ts'),
    read('src/components/HomeNewEdition.astro'),
    read('src/content/blocks/0550.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  assert.match(catalog, /CRYSTAL_BALL_PASS_REVIEW/);
  assert.match(review, /THE FIVE-MINUTE/);
  assert.match(review, /4\.6/);
  assert.match(reviewJson, /pointcast\.review\/v1/);
  assert.match(play, /id: 'crystal-ball-pass'/);
  assert.match(playJson, /crystalBallPass/);
  assert.match(home, /New<br \/>0550/);
  assert.match(home, /Begin passage/);
  assert.match(block, /"id": "0550"/);
  assert.match(block, /"author": "codex"/);
  assert.match(sitemap, /pointcast\.xyz\/crystal-ball-pass/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/crystal-ball-pass/);
  assert.match(llms, /Block 0550/);
  assert.match(full, /Block 0550/);
});
