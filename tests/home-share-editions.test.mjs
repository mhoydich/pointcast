import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { HOME_SHARE_EDITIONS, HOME_SHARE_CANONICAL, homeShareEditionForDate, findHomeShareEdition } from '../src/lib/home-share-editions.mjs';
import { planUnfurl } from '../src/lib/unfurl/plan.mjs';

test('the UTC daily selection is deterministic through day boundaries and repeats after six days', () => {
  assert.equal(HOME_SHARE_EDITIONS.length, 6);
  for (let day = 0; day < 18; day++) {
    const now = new Date(Date.UTC(2026, 9, 3 + day, 12));
    assert.equal(homeShareEditionForDate(now), HOME_SHARE_EDITIONS[day % 6]);
    assert.equal(homeShareEditionForDate(new Date(now)), homeShareEditionForDate(now));
  }
  assert.equal(homeShareEditionForDate(new Date('2026-10-03T23:59:59.999Z')), HOME_SHARE_EDITIONS[0]);
  assert.equal(homeShareEditionForDate(new Date('2026-10-04T00:00:00Z')), HOME_SHARE_EDITIONS[1]);
  assert.equal(homeShareEditionForDate(new Date('2026-10-03T17:00:00-07:00')), HOME_SHARE_EDITIONS[1]);
  assert.equal(homeShareEditionForDate(new Date('2026-10-02T23:59:59Z')), HOME_SHARE_EDITIONS[5]);
});

test('edition identities are fixed and distinct while the home canonical stays fixed', () => {
  assert.equal(HOME_SHARE_CANONICAL, 'https://pointcast.xyz/');
  assert.equal(new Set(HOME_SHARE_EDITIONS.map((edition) => edition.url)).size, 6);
  assert.equal(new Set(HOME_SHARE_EDITIONS.map((edition) => edition.imageUrl)).size, 6);
  for (const edition of HOME_SHARE_EDITIONS) {
    assert.equal(findHomeShareEdition(edition.id), edition);
    assert.ok(edition.path.startsWith('/share/home/2026-10-'));
    assert.equal(new URL(edition.url).pathname, edition.path);
    assert.ok(edition.alt.length > 40);
    for (const now of [new Date('2026-10-03'), new Date('2027-06-30')]) {
      assert.equal(planUnfurl({ pathname: edition.path, currentImage: edition.imageUrl, now }).image, '');
    }
  }
  assert.equal(findHomeShareEdition('not-an-edition'), null);
});

test('all six original PNG cards have the declared dimensions, remain distinct, and fit preview limits', async () => {
  const hashes = new Set();
  for (const edition of HOME_SHARE_EDITIONS) {
    const bytes = await readFile(new URL(`../public${edition.imagePath}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(bytes.length < 5_000_000, `${edition.id}: image is below 5 MB`);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, 1200, edition.id);
    assert.equal(metadata.height, 630, edition.id);
    assert.equal(metadata.format, 'png', edition.id);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(hashes.size, 6, 'each edition has original image bytes');
});
