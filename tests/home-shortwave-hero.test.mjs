import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Shortwave is the front door above the fold, ahead of the drop deck', async () => {
  const [home, hero, welcome] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeShortwaveHero.astro'),
    read('src/components/HomeWelcome.astro'),
  ]);
  assert.match(home, /import HomeShortwaveHero/);
  const masthead = home.indexOf('</header>');
  const heroAt = home.indexOf('<HomeShortwaveHero />');
  assert.ok(masthead > 0 && heroAt > masthead, 'hero sits right under the masthead');
  assert.ok(heroAt < home.indexOf('<HomeV2SignalDeck'), 'hero comes before the drop deck');
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
  assert.doesNotMatch(welcome, /HomeShortwaveLive/, 'one receiver on the page, not two');
});

test('the hero reads and says through the existing Shortwave paths, text-only', async () => {
  const hero = await read('src/components/HomeShortwaveHero.astro');
  assert.match(hero, /fetch\('\/api\/shortwave\?limit=12'/);
  assert.match(hero, /pc:shortwave:post/);
  assert.match(hero, /pc:shortwave:say/);
  assert.match(hero, /data-pc-ref="fb-omni-form"/);
  assert.match(hero, /\/api\/presence\/snapshot/);
  assert.match(hero, /maxlength="280"/);
  assert.doesNotMatch(hero, /innerHTML/, 'visitor text never goes in as HTML');
  assert.match(hero, /from '\.\.\/lib\/band'/, 'the dial is the same band /band uses');
  assert.match(hero, /netState\(\)/);
  for (const href of ['/shortwave', '/band', '/connect', '#new']) assert.ok(hero.includes(`href="${href}`), href);
  assert.match(hero, /astro:before-swap/);
  assert.match(hero, /prefers-reduced-motion: reduce/);
});
