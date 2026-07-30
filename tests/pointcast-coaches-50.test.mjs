import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test("The Coaches' Room publishes a complete 50-coach editorial board", async () => {
  const [data, page] = await Promise.all([
    read('src/lib/pointcast-coaches-50.ts'),
    read('src/pages/25/magazine/coaches-50.astro'),
  ]);

  assert.equal((data.match(/coach\(\d+,/g) ?? []).length, 50);
  assert.equal((data.match(/id: '(program|capital|players|region|fans|facilities|aura)'/g) ?? []).length, 7);
  assert.match(data, /coach\(1, 'Curt Cignetti', 'Indiana'/);
  assert.match(data, /coach\(50, 'Matt Entz', 'Fresno State'/);
  assert.match(page, /data-conference-filter/);
  assert.match(page, /data-coach-search/);
  assert.match(page, /OPEN THE SEVEN ROOMS/);
  assert.match(page, /spotify\.com\/embed\/playlist\/5HAh6Bu2OhiZxbDNAKbL6a/);
});

test("The Coaches' Room has human, machine, Block, magazine, homepage, and discovery surfaces", async () => {
  const [endpoint, blockText, magazineData, magazine, home, apps, llms, llmsFull] =
    await Promise.all([
      read('src/pages/25/magazine/coaches-50.json.ts'),
      read('src/content/blocks/0541.json'),
      read('src/lib/pointcast-college-football-magazine.ts'),
      read('src/pages/25/magazine/index.astro'),
      read('src/components/HomeNewEdition.astro'),
      read('src/lib/pointcast-apps.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0541');
  assert.equal(block.meta.rankingSize, 50);
  assert.equal(block.meta.scoringAxes, 7);
  assert.equal(block.meta.visualPlates, 6);
  assert.equal(block.external.url, 'https://pointcast.xyz/25/magazine/coaches-50');
  assert.match(magazineData, /name: 'The Coaches Desk'/);
  assert.match(magazine, /href="\/25\/magazine\/coaches-50"/);
  assert.match(home, /id: '0541'/);
  assert.match(home, /href: '\/25\/magazine\/coaches-50'/);
  assert.match(apps, /slug: 'coaches-room-2026'/);
  assert.match(llms, /The Coaches' Room — The PointCast 50 for 2026/);
  assert.match(llmsFull, /`\/25\/magazine\/coaches-50`/);
});

test("six compact editorial plates and the social card are checked in", async () => {
  const platePaths = Array.from(
    { length: 6 },
    (_, index) =>
      new URL(
        `../public/images/pointcast-coaches-50/poster-${String(index + 1).padStart(2, '0')}.webp`,
        import.meta.url,
      ),
  );

  for (const platePath of platePaths) {
    await access(platePath);
    const metadata = await sharp(fileURLToPath(platePath)).metadata();
    assert.equal(metadata.width, 1024);
    assert.equal(metadata.height, 1536);
    assert.equal(metadata.format, 'webp');
  }

  const socialPath = new URL(
    '../public/images/pointcast-coaches-50/social-card.png',
    import.meta.url,
  );
  await access(socialPath);
  const social = await sharp(fileURLToPath(socialPath)).metadata();
  assert.equal(social.width, 1200);
  assert.equal(social.height, 630);
});
