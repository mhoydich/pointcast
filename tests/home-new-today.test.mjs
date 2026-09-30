import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ageInDays, isFresh, shortDay, stripHeading, NEW_TODAY_DAYS } from '../src/lib/new-today.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const at = (iso) => new Date(iso);

test('"New today" sits right under the Shortwave hero, ahead of the drop deck', async () => {
  const home = await read('src/pages/index.astro');
  const hero = home.indexOf('<HomeShortwaveHero demote />');
  const strip = home.indexOf('<HomeNewToday items={newTodayItems} />');
  assert.ok(hero > 0 && strip > hero, 'strip follows the hero');
  assert.ok(strip < home.indexOf('<HomeV2SignalDeck'), 'strip comes before the drop deck');
  assert.match(home, /import newToday from '\.\.\/data\/new-today\.json'/);
  assert.match(home, /frontDoorNewsAll\.filter\(\(item\) => !newTodayLinks\.has\(item\.link\)\)/, 'the register below never repeats a strip item');
  const [heroSource, stripSource] = await Promise.all([read('src/components/HomeShortwaveHero.astro'), read('src/components/HomeNewToday.astro')]);
  assert.match(heroSource, /<a href="#new" data-swh-new>/, 'the hero link falls back to the drop deck');
  assert.match(stripSource, /id="new-today"/);
  assert.match(stripSource, /link\.setAttribute\('href', root\.hidden \? '#new' : '#new-today'\)/, 'while the strip shows, the hero link lands on it');
});

test('launch notes stay out of front-door-news.json while the strip shows them', async () => {
  // The Morning Edition's town slot reads front-door-news.json; a fresh launch note there
  // would print into a week of frozen editions ahead of Shortwave.
  const [items, news] = await Promise.all([read('src/data/new-today.json'), read('src/data/front-door-news.json')].map(async (p) => JSON.parse(await p)));
  const now = new Date();
  const freshLinks = new Set(items.filter((item) => isFresh(item, now)).flatMap((item) => [item.link, ...(item.block ? [`/b/${item.block}`] : [])]));
  for (const note of news) assert.ok(!freshLinks.has(note.link), `${note.label} duplicates a fresh strip item`);
});

test('the strip list is data: dated, linked, and tied to real blocks', async () => {
  const items = JSON.parse(await read('src/data/new-today.json'));
  assert.ok(items.length > 0);
  for (const item of items) {
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.title.length > 0 && item.title.length <= 28, item.title);
    assert.ok(item.kicker.length > 0 && item.kicker.length <= 21, `${item.kicker}: one line in a 375px cell`);
    assert.match(item.link, /^\/[a-z0-9/-]*$/);
    if (item.block) assert.ok(existsSync(new URL(`src/content/blocks/${item.block}.json`, root)), item.block);
    if (item.until) assert.ok(Number.isFinite(Date.parse(item.until)), item.until);
  }
  const component = await read('src/components/HomeNewToday.astro');
  assert.doesNotMatch(component, /06[0-9]{2}/, 'block ids and copy belong to the data file, never the component');
});

test('launches age out after seven town days, and `until` retires copy sooner', () => {
  assert.equal(NEW_TODAY_DAYS, 7);
  assert.equal(ageInDays('2026-09-28', '2026-10-04'), 6);
  const launch = { date: '2026-09-28' };
  assert.equal(isFresh(launch, at('2026-09-28T23:50:00-07:00')), true, 'late on launch night, Pacific');
  assert.equal(isFresh(launch, at('2026-09-28T06:00:00-07:00')), true);
  assert.equal(isFresh(launch, at('2026-09-27T23:00:00-07:00')), false, 'not before it ships');
  assert.equal(isFresh(launch, at('2026-10-04T23:59:00-07:00')), true, 'day seven');
  assert.equal(isFresh(launch, at('2026-10-05T00:01:00-07:00')), false, 'day eight');
  const preview = { date: '2026-09-28', until: '2026-10-03T06:45:00-07:00' };
  assert.equal(isFresh(preview, at('2026-10-03T06:44:00-07:00')), true);
  assert.equal(isFresh(preview, at('2026-10-03T06:45:00-07:00')), false);
  assert.equal(isFresh({ date: 'soon' }, at('2026-09-28T12:00:00-07:00')), false);
});

test('the heading says today only when everything showing shipped today', () => {
  const now = at('2026-09-28T17:00:00-07:00');
  assert.equal(stripHeading(['2026-09-28', '2026-09-28'], now), 'New today');
  assert.equal(stripHeading(['2026-09-28', '2026-09-26'], now), 'New this week');
  assert.equal(stripHeading(['2026-09-28'], at('2026-09-30T09:00:00-07:00')), 'New this week');
  assert.equal(shortDay('2026-09-28'), 'Sep 28');
});
