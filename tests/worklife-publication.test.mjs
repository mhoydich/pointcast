import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('WORK/LIFE is broader than Monday and opens with a public playlist', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/worklife-publication.ts'),
    read('src/pages/worklife/index.astro'),
    read('src/pages/worklife.json.ts'),
  ]);

  assert.match(data, /title: 'WORK\/LIFE'/);
  assert.match(data, /Monday is an opening scene, not the publication boundary/);
  assert.equal((data.match(/title: '(The Shift|Office Weather|Tool Drawer|Lunch|Payroll|Exit Interview)'/g) ?? []).length, 6);
  assert.match(page, /The job is never only the job/);
  assert.match(page, /WORKLIFE_DESKS\.map/);
  for (const title of ['The Shift', 'Office Weather', 'Tool Drawer', 'Lunch', 'Payroll', 'Exit Interview']) {
    assert.match(data, new RegExp(title));
  }
  assert.match(endpoint, /broader than a weekday playlist/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('Issue 001 preserves the verified eighteen-track public Spotify order', async () => {
  const data = await read('src/lib/worklife-publication.ts');
  assert.equal((data.match(/position: \d+/g) ?? []).length, 18);
  assert.equal((data.match(/number: '0[1-4]'/g) ?? []).length, 4);

  const titles = [
    'Manic Monday', 'The Big Ship', 'Monday Morning', '9 to 5', 'You Can Call Me Al',
    'Watching The Wheels', 'Once in a Lifetime', "Workin' Day and Night", 'Lovely Day',
    'The Working Hour', 'Blue Monday', 'This Must Be the Place', "Busy Earnin'",
    'Town Called Malice', "Workin' Woman Blues", 'Career Opportunities',
    'Step Into My Office, Baby', 'Working for the Knife',
  ];
  let cursor = -1;
  for (const title of titles) {
    const next = data.indexOf(title, cursor + 1);
    assert.ok(next > cursor, `${title} must appear in the verified Spotify order`);
    cursor = next;
  }
  assert.match(data, /spotifyPlaylistId: '3JXWUjuBZ4VTl1TYPnfH60'/);
  assert.match(data, /duration: '1 hr 10 min'/);
  assert.match(data, /durationMinutes: 70/);
});

test('Issue 001 is playable, interactive, responsive, and boundary-safe', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/worklife/001.astro'),
    read('src/pages/worklife/001.json.ts'),
    read('src/content/blocks/0555.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /MusicPlaylist/);
  assert.match(page, /open\.spotify\.com\/embed\/playlist/);
  assert.match(page, /data-worklife-mode/);
  assert.match(page, /data-manic-tab/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /@media \(max-width: 650px\)/);
  assert.doesNotMatch(page, /type="email"/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /playlistVisibility: 'public'/);
  assert.match(endpoint, /does not proxy or restream audio/);
  assert.match(endpoint, /No artist, label, publisher, estate, or Spotify endorsement is claimed/);

  assert.equal(block.id, '0555');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'LISTEN');
  assert.equal(block.meta.playlistVisibility, 'public');
  assert.equal(block.meta.trackCount, 18);
  assert.equal(block.meta.durationMinutes, 70);
  assert.equal(block.meta.automation, false);
  assert.equal(block.meta.audioProxy, false);
  assert.equal(block.meta.networkWrites, false);
});

test('WORK/LIFE travels through the homepage and discovery surfaces', async () => {
  const surfaces = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeWorklifeOpener.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  for (const surface of surfaces) assert.match(surface, /WORK\/LIFE|worklife/);
  assert.match(surfaces[0], /<HomeNewEdition \/>[\s\S]*<HomeWorklifeOpener \/>/);
  assert.match(surfaces[0], /Periodical/);
  assert.match(surfaces[1], /THE PLAYLIST IS STILL THE OPENER/);
  assert.match(surfaces[2], /slug: 'worklife'/);
  assert.match(surfaces[3], /worklife\/001\.json/);
  assert.match(surfaces[4], /worklifeIssue001/);
});

test('the issue cover is square and Block art is social-wide', async () => {
  const cover = new URL('../public/images/worklife/001-cover.png', import.meta.url);
  const social = new URL('../public/images/og/b/0555.png', import.meta.url);
  await Promise.all([access(cover), access(social)]);
  assert.deepEqual(pngSize(await readFile(cover)), { width: 1536, height: 1536 });
  assert.deepEqual(pngSize(await readFile(social)), { width: 1200, height: 630 });
});
