import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const wallSource = readFileSync(join(root, 'src/pages/nouns-cola/wall.astro'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const publishSource = readFileSync(join(root, 'scripts/publish-live.mjs'), 'utf8');

test('Nouns Cola wall resolves nightly posters from the repository, not the build cwd', () => {
  assert.match(wallSource, /new URL\('\.\.\/\.\.\/\.\.\/public\/cola\/', import\.meta\.url\)/);
  assert.doesNotMatch(wallSource, /process\.cwd\(\).*public\/cola/);
});

test('production builds stage the Nouns Cola runtime assets', () => {
  assert.match(packageJson.scripts.build, /node scripts\/stage-runtime-assets\.mjs/);
  assert.match(publishSource, /scripts\/stage-runtime-assets\.mjs/);

  for (const name of [
    'poster-01-hero.png',
    'poster-02-night.png',
    'poster-03-pop.png',
    'poster-04-mural.png',
  ]) {
    assert.equal(
      existsSync(join(root, 'public/images/nouns-cola/ads-generated-v2', name)),
      true,
      `${name} must remain checked in`,
    );
  }
});
