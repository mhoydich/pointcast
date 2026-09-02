import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Updraft 01 publishes an exact eighteen-song sequence in four movements', async () => {
  const data = await read('src/lib/wednesday-morning-uplift.ts');

  assert.equal((data.match(/position: \d+/g) ?? []).length, 18);
  assert.equal((data.match(/id: '(porch|crossing|open-road|landing)'/g) ?? []).length, 4);

  for (const title of [
    "Walkin' Boss",
    "Uncle John's Band",
    'Ramble on Rose',
    'Southern Nights',
    'Wide Open Spaces',
    'What I Am',
    'This Must Be the Place',
    'Everywhere',
    'The Whole of the Moon',
    'Capricorn',
    'Right Back to It',
    'Friend of the Devil',
    'Shady Grove',
    'Ripple',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  assert.match(data, /trackCount: 18/);
  assert.match(data, /duration: '1 hr 25 min'/);
  assert.match(data, /6l9PXUEN5nR76vqUjSTPPw/);
});

test('the human page is playable, sequenced, responsive, and motion-safe', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/playlists/wednesday-morning-uplift.astro'),
    read('src/lib/wednesday-morning-uplift.ts'),
  ]);

  assert.match(page, /MusicPlaylist/);
  assert.match(page, /open\.spotify\.com\/embed\/playlist/);
  assert.match(page, /Press play\. Keep the order\./);
  assert.match(page, /data-uplift-jump/);
  assert.match(page, /data-uplift-movement/);
  assert.match(page, /IntersectionObserver/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /@media \(max-width: 620px\)/);
  assert.match(page, /@media print/);
  assert.match(page, /playlist\.participation\.actions/);
  assert.match(data, /Follow on this device/);
  assert.match(data, /Send PointCast a ping/);
  assert.match(data, /Sign in to PointCast/);
  assert.doesNotMatch(page, /type="email"/);
  assert.doesNotMatch(page, /\bfetch\(/);
});

test('the machine edition and Block keep playback, rights, and participation boundaries explicit', async () => {
  const [endpoint, blockText, data] = await Promise.all([
    read('src/pages/playlists/wednesday-morning-uplift.json.ts'),
    read('src/content/blocks/0537.json'),
    read('src/lib/wednesday-morning-uplift.ts'),
  ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0537');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'LISTEN');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.trackCount, 18);
  assert.equal(block.meta.durationMinutes, 85);
  assert.equal(block.meta.movements, 4);
  assert.equal(block.meta.officialSpotifyPlayer, true);
  assert.equal(block.meta.audioProxy, false);
  assert.equal(block.meta.emailCollection, false);
  assert.equal(block.meta.networkWrites, false);

  assert.match(endpoint, /official player/);
  assert.match(endpoint, /does not proxy or restream audio/);
  assert.match(data, /No new inbox harvest/);
  assert.match(endpoint, /No artist, label, publisher, estate, or Spotify endorsement is claimed/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('Wednesday Morning Uplift remains a public Issue 001 and travels through discovery', async () => {
  const surfaces = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeWednesdayPublication.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const surface of surfaces.filter((_, index) => ![1, 3].includes(index))) {
    assert.match(surface, /wednesday-morning-uplift|Wednesday Morning Uplift/);
  }

  // front door rebuilt 2026-09-01: the HomeNewEdition / HomeWednesdayPublication modules retired; both doors are now
  // covers in index.astro's frontmatter (the lead edition and WEDNESDAY 9:34 on the magazine rack; order was incidental).
  assert.match(surfaces[0], /href[:=]\s*["']\/25\/magazine["']/);
  assert.match(surfaces[0], /href[:=]\s*["']\/wednesday["']/);
  assert.match(surfaces[0], /Periodical/);
  assert.match(surfaces[1], /ISSUE 001 \/ ALSO LIVE/);
  assert.match(surfaces[1], /follow locally/);
  assert.match(surfaces[2], /id: '0537'/);
  assert.match(surfaces[4], /wednesday-morning-uplift\.json/);
  assert.match(surfaces[5], /wednesdayMorningUplift/);
  assert.match(surfaces[6], /WEDNESDAY 9:34/);
  assert.match(surfaces[7], /Issue 001, Updraft 01/);
});

test('the checked-in cover is square and Block art is social-wide', async () => {
  const cover = new URL('../public/images/playlists/wednesday-morning-uplift-cover.png', import.meta.url);
  const social = new URL('../public/images/og/b/0537.png', import.meta.url);

  await Promise.all([access(cover), access(social)]);
  assert.deepEqual(pngSize(await readFile(cover)), { width: 1536, height: 1536 });
  assert.deepEqual(pngSize(await readFile(social)), { width: 1200, height: 630 });
});
