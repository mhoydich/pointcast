import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the PointCast front door is a focused live edition with stable discovery exits', async () => {
  const [home, layout] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/layouts/BlockLayout.astro'),
  ]);

  assert.match(home, /one bright current edition, one live signal, three clear doors, field notes/i);
  assert.match(home, /showNetworkStrip=\{false\}/);
  assert.match(layout, /showNetworkStrip\?: boolean/);
  assert.match(layout, /\{showNetworkStrip && <NetworkFirst100Strip\s*\/>\}/);

  assert.equal((home.match(/class="fresh-door /g) ?? []).length, 3);
  assert.match(home, /href="\/now"/);
  assert.match(home, /href="\/win95-games"/);
  assert.match(home, /href="\/network-el-segundo"/);

  const storySource = home.slice(home.indexOf('const stories'), home.indexOf('function prettyShipTime'));
  assert.equal((storySource.match(/href:\s*'\//g) ?? []).length, 4);
  assert.match(home, /CHANNEL_LIST\.map/);
  assert.match(home, /href="\/archive"/);
  assert.match(home, /href="\/press"/);
  assert.match(home, /href="\/blocks\.json"/);
  assert.match(home, /href="\/feed\.json"/);
  assert.match(home, /href="\/feed\.xml"/);
  assert.match(home, /href="\/agents\.json"/);
  assert.match(home, /href="\/for-agents"/);
});

test('the Monday field paper promotes PointCast Tonight and the complete newest release run without Qwen', async () => {
  const [home, edition, middleware] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('functions/_middleware.ts'),
  ]);

  assert.match(home, /<HomeNewEdition \/>/);
  assert.match(home, /images\/pointcast-tonight\/social-card\.png/);
  assert.match(home, /PointCast Monday field paper — August 3, 2026/);
  assert.match(edition, /Go out/);
  assert.match(edition, /Stay in/);
  assert.match(edition, /One official-source week/);
  assert.match(edition, /id: '0560', noun: 'Tonight', title: 'GO OUT \/ STAY IN'/);
  assert.match(edition, /id: '0559', noun: 'Circuit', title: 'The California Cup'/);
  assert.match(edition, /id: '0557', noun: 'State', title: 'California Football Is Not Dead'/);
  assert.match(edition, /id: '0556', noun: 'Uniform', title: 'The Clothes Have Clocked In'/);
  assert.match(edition, /id: '0555', noun: 'Shift', title: 'Another Manic Monday'/);
  assert.match(edition, /id: '0554', noun: 'Outside', title: 'OPEN\/25'/);
  assert.match(edition, /id: '0551', noun: 'Engineering', title: 'ENG\/25'/);
  assert.match(edition, /The clothes have/);
  assert.match(edition, /California football/);
  assert.match(edition, /<b>06<\/b> outings/);
  assert.match(edition, /05<\/b> local TV signals/);
  assert.match(edition, /07<\/b> official sources/);
  assert.match(edition, /Wednesday Morning Uplift/);
  assert.match(edition, /THE GOOD WORK/);
  assert.match(edition, /Nothing wins/);
  assert.match(edition, /The Fermentation League/);
  assert.match(edition, /Harbor Works/);
  assert.match(edition, /My Pet Has/);
  assert.match(edition, /Retained Counsel/);
  assert.match(edition, /Talkin’/);
  assert.match(edition, /Alabama After Saban/);
  assert.match(edition, /The Reach Line/);
  assert.match(edition, /Tide Cabinet/);
  assert.match(edition, /The Song Yard/);
  assert.match(edition, /Signal Shack/);
  assert.match(edition, /Animal Crossing/);
  assert.match(edition, /Authorize Spotify/);
  assert.match(edition, /Build a Follow Shelf/);
  assert.doesNotMatch(edition, /qwen/i);

  const socialMetadataRewrite = middleware.slice(
    middleware.indexOf('.on(\'meta[property="og:title"]'),
    middleware.indexOf('.on(\'[data-today-signal]\''),
  );
  assert.equal((socialMetadataRewrite.match(/if \(archived\) return;/g) ?? []).length, 5);
});

test('the current field edition gives the living magazine, Tone Bloom, Beach Commons, and the future book real homepage weight', async () => {
  const [home, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/styles/front-door-fresh.css'),
  ]);

  assert.match(home, /One season\. Many rooms\./);
  assert.match(home, /href="\/25\/magazine"/);
  assert.match(home, /href="\/reviews\/tone-bloom"/);
  assert.match(home, /href="\/beach-commons"/);
  assert.match(home, /href="\/digital-pets"/);
  assert.match(home, /The Animal After the Internet/);
  assert.match(home, /href="\/auth#spotify"/);
  assert.match(home, /href="\/super-follow"/);
  assert.match(home, /href="\/beach-commons\.json"/);
  assert.doesNotMatch(home, /fresh-qwen/);
  assert.doesNotMatch(home, /href="\/qwen-/);
  assert.match(css, /\.fresh-field-grid \{/);
  assert.match(css, /\.fresh-field-card--pets \{/);
  assert.match(css, /\.fresh-field-shelf \{/);
});

test('the front door has one reusable editorial freshness slot with a machine-readable twin', async () => {
  const [home, freshness, nowJson, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/home-freshness.ts'),
    read('src/pages/now.json.ts'),
    read('src/styles/front-door-fresh.css'),
  ]);

  assert.match(freshness, /export const HOME_FRESH_FEATURE/);
  assert.match(freshness, /href: '\/showcast\/bells-bloom'/);
  assert.match(freshness, /jsonHref: '\/showcast\/bells-bloom\.json'/);
  assert.match(freshness, /blockId: '0492'/);
  assert.match(freshness, /facts: \['28 works', '4 movements', '8-second drift'\]/);
  assert.match(home, /data-home-freshness=\{HOME_FRESH_FEATURE\.publishedAt\}/);
  assert.match(home, /Enter the showcast/);
  assert.match(home, /showLatestShip/);
  assert.match(nowJson, /featured: \{/);
  assert.match(nowJson, /HOME_FRESH_FEATURE\.jsonHref/);
  assert.match(css, /\.fresh-current \{/);
  assert.match(css, /\.fresh-current__image img \{/);
});

test('the fresh front door is responsive, accessible, and motion-safe by construction', async () => {
  const [home, edition, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/styles/front-door-fresh.css'),
  ]);

  assert.equal(((home + edition).match(/<h1\b/g) ?? []).length, 1);
  assert.match(edition, /id="home-edition-title"/);
  assert.match(home, /aria-labelledby="fresh-hero-title"/);
  assert.match(home, /aria-label="PointCast channels"/);
  assert.match(home, /alt=\{heroSignals\[0\]\.alt\}/);
  assert.match(home, /image\.alt = next\.alt/);
  assert.match(home, /timeZone: 'America\/Los_Angeles'/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.fresh-home :focus-visible/);
});

test('homepage images preserve their proportions and recover from a transient first request failure', async () => {
  const [home, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/styles/front-door-fresh.css'),
  ]);

  assert.match(
    css,
    /\.fresh-bell-room__image\s*\{[^}]*height:\s*auto;/s,
  );
  assert.match(home, /image\.addEventListener\('error', retryOnce\)/);
  assert.match(home, /image\.dataset\.loadRetry === 'true'/);
  assert.match(home, /retryUrl\.searchParams\.set\('pc-image-retry', '1'\)/);
});
