import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import test from 'node:test';

import {
  ART_CREDIT,
  FEEDERS,
  PICKS,
  RUBRIC,
  SOURCES,
  feedersById,
  weightedTotal,
} from '../src/lib/hummingbird-feeders.mjs';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('rubric weights are the published split and sum to 1', () => {
  const weights = Object.fromEntries(RUBRIC.map((c) => [c.key, c.weight]));
  assert.deepEqual(weights, { cleaning: 0.4, defenses: 0.2, durability: 0.2, capacity: 0.1, price: 0.1 });
  assert.equal(Math.round(RUBRIC.reduce((s, c) => s + c.weight, 0) * 1000) / 1000, 1);
  for (const c of RUBRIC) {
    assert.ok(c.why.length > 20, `${c.key} explains itself`);
    assert.ok(c.scale.length >= 3, `${c.key} publishes its rules`);
  }
});

test('nine feeders, scores in range, totals recompute, ranking is sorted', () => {
  assert.equal(FEEDERS.length, 9);
  const styles = new Set(FEEDERS.map((f) => f.style.split(' (')[0]));
  for (const s of ['Saucer', 'Bottle', 'Window mount', 'High-capacity bottle']) assert.ok(styles.has(s), s);
  FEEDERS.forEach((f, i) => {
    assert.equal(f.rank, i + 1);
    for (const c of RUBRIC) {
      const v = f.scores[c.key];
      assert.ok(Number.isFinite(v) && v >= 0 && v <= 10, `${f.id} ${c.key}=${v}`);
    }
    assert.equal(f.total, weightedTotal(f.scores));
    if (i > 0) assert.ok(FEEDERS[i - 1].total >= f.total);
    assert.ok(f.sourceIds.length > 0, `${f.id} cites a source`);
    for (const id of f.sourceIds) assert.ok(SOURCES.some((s) => s.id === id), `${f.id} source ${id}`);
  });
  assert.equal(FEEDERS[0].id, 'hummzinger-highview');
  assert.equal(FEEDERS[0].total, 8.2);
  assert.deepEqual(
    FEEDERS.map((f) => [f.id, f.total]),
    [
      ['hummzinger-highview', 8.2],
      ['first-nature-3055', 7.3],
      ['perky-pet-209b', 7.2],
      ['more-birds-big-gulp', 7],
      ['more-birds-diamond', 7],
      ['more-birds-3-in-1', 6.8],
      ['perky-pet-217', 6.5],
      ['best-1-32oz', 6.2],
      ['aspects-jewel-box', 5.9],
    ],
  );
});

test('glass-and-plastic bottles are held to the same durability standard', () => {
  const bigGulp = feedersById.get('more-birds-big-gulp');
  // Bob Vila never reviewed the Big Gulp; its heaviness note was about a 40-oz Garnet.
  assert.ok(!bigGulp.sourceIds.includes('bob-vila'));
  assert.doesNotMatch(bigGulp.complaints, /Bob Vila/);
  for (const id of ['more-birds-big-gulp', 'more-birds-diamond', 'perky-pet-209b']) {
    const modelSpecific = feedersById.get(id).durability.filter((a) => a.delta < 0 && /maker page/.test(a.why));
    assert.equal(modelSpecific.length, 2, `${id} carries its maker-page owner complaints`);
  }
});

test('every verified price is a single cited listing; unverified prices are flagged', () => {
  for (const f of FEEDERS) {
    if (f.priceVerified) assert.match(f.priceText, /^\$\d+\.\d{2}/, `${f.id} names an exact listing price`);
    else assert.match(f.priceText, /unverified/, `${f.id} says its price is unverified`);
  }
  assert.equal(feedersById.get('hummzinger-highview').priceVerified, false);
  assert.doesNotMatch(PICKS.map((p) => p.why).join(' '), /under \$20/);
});

test('picks point at real feeders and no link is an affiliate or retailer link', () => {
  for (const p of PICKS) assert.ok(feedersById.has(p.id), p.id);
  const makerUrls = new Set(SOURCES.filter((s) => s.kind === 'maker').map((s) => s.url));
  for (const f of FEEDERS) {
    if (f.makerPage) assert.ok(makerUrls.has(f.makerPage), `${f.id} links only to an opened maker page`);
  }
  for (const s of SOURCES) {
    assert.match(s.url, /^https:\/\//);
    assert.doesNotMatch(s.url, /[?&](tag|ref|aff|affiliate|utm_[a-z]+)=/i, `${s.url} carries no tracking or affiliate params`);
  }
  assert.equal(ART_CREDIT, 'Art: Astra (Codex), after hummingbird paintings supplied by Mike Hoydich');
});

test('page says desk review plainly, carries the care guide, table, and sources', async () => {
  const page = await read('src/pages/reviews/hummingbird-feeders.astro');
  assert.match(page, /This is a desk review\. PointCast has not used these feeders\./);
  assert.match(page, /POINTCAST HAS NOT USED THESE FEEDERS · THE RANKING COMES FROM PUBLISHED SPECS AND THE CITED TESTERS/);
  assert.match(page, /NO_COMMISSION/);
  assert.match(page, /maker page ↗/);
  assert.match(page, /id="care"/);
  assert.match(page, /id="ranking"/);
  assert.match(page, /3-or-30/);
  assert.match(page, /No red dye/);
  assert.match(page, /No honey/);
  assert.match(page, /Anna's Hummingbird/);
  assert.match(page, /sedentarius/);
  assert.match(page, /SOURCES/);
  assert.doesNotMatch(page, /OUT OF 5/);
  assert.doesNotMatch(page, /'@type': 'Product'/, 'no nested Product entities without offers or reviews');
  assert.match(page, /Every change: hot water \+ brush; vinegar soak; no soap/);
  assert.match(page, /rinse thoroughly with clean water and let the feeder air-dry before refilling/);
  assert.doesNotMatch(page, /territory/);
  assert.doesNotMatch(page, /amazon\.|amzn\.to|chewy\.com/i);
});

test('catalog entry, JSON contract, and block agree', async () => {
  const [catalog, endpoint, desk, deskJson, blockText, sitemap] = await Promise.all([
    read('src/data/reviews.ts'),
    read('src/pages/reviews/hummingbird-feeders.json.ts'),
    read('src/pages/reviews/index.astro'),
    read('src/pages/reviews.json.ts'),
    read('src/content/blocks/0629.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(catalog, /slug: 'hummingbird-feeders'/);
  assert.match(catalog, /category: 'Desk review'/);
  assert.match(catalog, /rating: null/);
  assert.match(catalog, /blockId: '0629'/);
  assert.match(endpoint, /pointcast\.review\/v1/);
  assert.match(endpoint, /handsOn: false/);
  assert.match(endpoint, /affiliateLinks: 'none'/);
  assert.match(desk, /rating === null/);
  assert.match(deskJson, /desk review/i);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/hummingbird-feeders'/);

  assert.equal(block.id, '0629');
  assert.equal(block.channel, 'GDN');
  assert.equal(block.author, 'cc');
  assert.equal(block.external.url, 'https://pointcast.xyz/reviews/hummingbird-feeders');
  assert.ok(block.dek.length <= 200);
  assert.match(block.body, /PointCast has not used these feeders/);
  assert.match(block.body, /No link, no commission/);
  assert.match(block.body, /after hummingbird paintings supplied by Mike Hoydich/);
  assert.doesNotMatch(block.body + block.source + block.meta.artCredit, /Mike Hoydich's hummingbird paintings|Mike's hummingbird paintings/);
  assert.doesNotMatch(catalog, /from maker specs and hands-on testers/);
  for (const c of block.companions) {
    assert.ok(c.id.length <= 80 && c.label.length <= 80);
  }
});

test('art assets exist and stay under 400 KB', async () => {
  for (const name of ['hero.jpg', 'hero.webp', 'feeder-types.jpg', 'feeder-types.webp']) {
    const url = new URL(`../public/images/hummingbird-feeders/${name}`, import.meta.url);
    await access(url);
    const { size } = await stat(url);
    assert.ok(size < 400 * 1024, `${name} is ${size} bytes`);
  }
});
