import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the PointCast front door is a catalog of the whole town with stable discovery exits', async () => {
  const [home, layout] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/layouts/BlockLayout.astro'),
  ]);

  // front door rebuilt 2026-09-01: the thesis is "carry the whole town", not one bright edition with three doors.
  assert.match(home, /rebuilt 2026-09-01 to carry the whole town/);
  assert.match(home, /immersive=\{false\}/);
  assert.match(home, /import '\.\.\/styles\/home-shelf\.css'/);
  assert.doesNotMatch(layout, /NetworkFirst100Strip/);

  // front door rebuilt 2026-09-01: the three "fresh-door" cards became twelve shelf sections in a fixed order.
  const sections = ['HomePlayFirst', 'HomeStartHere', 'HomeGlance', 'HomeMagazineRack', 'HomeDrumUniverse', 'HomeRoomsShelf', 'HomeConstellation', 'HomeAgentDesk', 'HomeShipLog', 'HomeScoreboard', 'HomeWire', 'HomeBackCatalog'];
  const positions = sections.map((name) => home.indexOf(`<${name}`, home.indexOf('<BlockLayout')));
  assert.ok(positions.every((p) => p > -1), `every section renders: ${sections.filter((_, i) => positions[i] === -1).join(', ')}`);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'sections render in the documented order');
  assert.match(home, /href="\/now"/);
  assert.match(home, /href(?:="|: ')\/win95-games["']/);
  assert.match(home, /href(?:="|: ')\/network-el-segundo["']/);

  // front door rebuilt 2026-09-01: the four "stories" became a 30-day back-catalog pool that skips the Cola posters.
  assert.match(home, /CATALOG_MIN_AGE_MS = 30 \* 24/);
  assert.match(home, /Nouns Cola poster/);
  assert.match(home, /CHANNEL_LIST\.map/);
  assert.match(home, /href="\/archive"/);
  assert.match(home, /href="\/press"/);
  assert.match(home, /href="\/blocks\.json"/);
  assert.match(home, /href="\/feed\.json"/);
  assert.match(home, /href="\/feed\.xml"/);
  assert.match(home, /href="\/agents\.json"/);
  assert.match(home, /href="\/for-agents"/);
});

test('the Saturday field paper leads with the complete Division I atlas and keeps Texas in the release run', async () => {
  const [home, edition, middleware] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('functions/_middleware.ts'),
  ]);

  // front door rebuilt 2026-09-01: the HomeNewEdition module retired; the Saturday paper and its desks are `covers` entries in index.astro's frontmatter.
  assert.match(home, /href(?:="|: ')\/25\/magazine["']/);
  assert.match(home, /href(?:="|: ')\/25\/directory["']/);
  assert.match(home, /href(?:="|: ')\/25\/magazine\/texas-football-history["']/);
  assert.match(home, /href(?:="|: ')\/25\/magazine\/western-heat-brains["']/);
  assert.match(edition, /PointCast · Saturday field paper/);
  assert.match(edition, /Every program/);
  assert.match(edition, /One honest map/);
  assert.match(edition, /id: '0570', noun: 'Atlas', title: 'THE SATURDAY ATLAS'/);
  assert.match(edition, /id: '0569', noun: 'Archive', title: 'THE HISTORY OF TEXAS FOOTBALL'/);
  assert.match(edition, /id: '0568', noun: 'Proof', title: 'WESTERN HEAT \/ BRAINS 25'/);
  assert.match(edition, /id: '0562', noun: 'Shrine', title: 'SHRINE\/25'/);
  assert.match(edition, /id: '0561', noun: 'Drum', title: 'THE DRUM HOUSE'/);
  assert.match(edition, /id: '0560', noun: 'Tonight', title: 'GO OUT \/ STAY IN'/);
  assert.match(edition, /id: '0559', noun: 'Circuit', title: 'The California Cup'/);
  assert.match(edition, /id: '0557', noun: 'State', title: 'California Football Is Not Dead'/);
  assert.match(edition, /id: '0556', noun: 'Uniform', title: 'The Clothes Have Clocked In'/);
  assert.match(edition, /id: '0555', noun: 'Shift', title: 'Another Manic Monday'/);
  assert.match(edition, /id: '0554', noun: 'Outside', title: 'OPEN\/25'/);
  assert.match(edition, /id: '0551', noun: 'Engineering', title: 'ENG\/25'/);
  assert.match(edition, /Texas was never/);
  assert.match(edition, /California football/);
  assert.match(edition, /<b>138<\/b> FBS/);
  assert.match(edition, /<b>128<\/b> FCS/);
  assert.match(edition, /<b>21<\/b> HBCUs/);
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
  assert.match(edition, /Your profile/);
  assert.match(edition, /Build a Follow Shelf/);
  assert.doesNotMatch(edition, /qwen/i);

  const socialMetadataRewrite = middleware.slice(
    middleware.indexOf('.on(\'meta[property="og:title"]'),
    middleware.indexOf('.on(\'[data-today-signal]\''),
  );
  assert.equal((socialMetadataRewrite.match(/if \(archived\) return;/g) ?? []).length, 5);
});

test('the current field edition gives the living magazine, Tone Bloom, Beach Commons, and the future book real homepage weight', async () => {
  const [home, rack, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeMagazineRack.astro'),
    read('src/styles/front-door-fresh.css'),
  ]);

  // front door rebuilt 2026-09-01: the "One season. Many rooms." field grid became the magazine rack, fed by index.astro's `covers` array.
  assert.match(home, /<HomeMagazineRack covers=\{covers\} volumes=\{beachCommonsVolumes\}/);
  assert.match(home, /href(?:="|: ')\/25\/magazine["']/);
  assert.match(home, /href(?:="|: ')\/reviews\/tone-bloom["']/);
  assert.match(home, /href(?:="|: ')\/beach-commons["']/);
  assert.match(home, /href(?:="|: ')\/digital-pets["']/);
  assert.match(home, /The Animal After the Internet/);
  assert.match(home, /href="\/me"/);
  assert.match(home, /href="\/super-follow"/);
  // front door rebuilt 2026-09-01: the Beach Commons index door now sits at the foot of the rack component.
  assert.match(rack, /All eighteen Beach Commons editions →/);
  assert.match(rack, /href="\/beach-commons\.json"/);
  assert.doesNotMatch(home, /fresh-qwen/);
  assert.doesNotMatch(home, /href="\/qwen-/);
  assert.match(css, /\.fresh-field-grid \{/);
  assert.match(css, /\.fresh-field-card--pets \{/);
  assert.match(css, /\.fresh-field-shelf \{/);
});

test('the freshness slot still feeds /now.json, and the front door links the twin and refreshes its live numbers in place', async () => {
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
  // front door rebuilt 2026-09-01: the Bells / Bloom "current" slot retired from the page; the machine twin is the /now.json door, and the glance row refreshes live with the build-time value as fallback.
  assert.match(home, /href="\/now\.json"/);
  assert.match(home, /fetch\('\/api\/drum'/);
  assert.match(home, /setGlance\('drum-taps', j\.globalTotal\)/);
  assert.match(home, /data-glance/);
  assert.match(nowJson, /featured: \{/);
  assert.match(nowJson, /HOME_FRESH_FEATURE\.jsonHref/);
  assert.match(css, /\.fresh-current \{/);
  assert.match(css, /\.fresh-current__image img \{/);
});

test('the fresh front door is responsive, accessible, and motion-safe by construction', async () => {
  const [home, edition, play, shelf, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/components/HomePlayFirst.astro'),
    read('src/styles/home-shelf.css'),
    read('src/styles/front-door-fresh.css'),
  ]);

  // front door rebuilt 2026-09-01: HomePlayFirst carries the page's only <h1>; index.astro itself has none.
  assert.equal((home.match(/<h1\b/g) ?? []).length, 0);
  assert.equal(((home + play).match(/<h1\b/g) ?? []).length, 1);
  assert.match(edition, /id="home-edition-title"/);
  assert.match(play, /aria-labelledby="play-title"/);
  assert.match(play, /<h1 class="play__title" id="play-title"/);
  assert.match(home, /aria-labelledby="channels-title"/);
  assert.match(home, /aria-label="PointCast channels"/);
  // front door rebuilt 2026-09-01: the signal tuner retired; the pads are a labelled group and the on-air line stays hidden until the booth answers.
  assert.match(play, /aria-label="Rosebud drum pads"/);
  assert.match(home, /data-live-now-playing hidden/);
  assert.match(home, /fetch\('\/now-playing\.json'/);
  assert.match(home, /timeZone: 'America\/Los_Angeles'/);
  assert.match(shelf, /@media \(max-width: 560px\)/);
  assert.match(shelf, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.fresh-home :focus-visible/);
});

test('homepage images preserve their proportions and reserve their space before they load', async () => {
  const [home, rack, shelf, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeMagazineRack.astro'),
    read('src/styles/home-shelf.css'),
    read('src/styles/front-door-fresh.css'),
  ]);

  assert.match(
    css,
    /\.fresh-bell-room__image\s*\{[^}]*height:\s*auto;/s,
  );
  // front door rebuilt 2026-09-01: the image-retry script retired; cover art now has a fixed aspect box, explicit dimensions, small thumbs, and a Noun fallback in the catalog.
  assert.match(shelf, /\.cell__art\s*\{[^}]*aspect-ratio:\s*1\.91 \/ 1;[^}]*object-fit:\s*cover;/s);
  assert.match(rack, /<img class="cell__art" src=\{c\.image\} alt=\{c\.imageAlt \?\? ''\} width="382" height="200" loading="lazy" decoding="async" \/>/);
  assert.match(home, /Never the raw 1–3 MB social cards/);
  assert.match(home, /https:\/\/noun\.pics\/\$\{d\.noun \?\? Number\(d\.id\)\}\.svg/);
});
