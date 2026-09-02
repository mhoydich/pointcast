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

test('THE GOOD WORK publishes the verified public eighteen-track sequence', async () => {
  const data = await read('src/lib/wednesday-publication.ts');

  assert.equal((data.match(/position: \d+/g) ?? []).length, 18);
  assert.equal((data.match(/id: '(pencil|motion|groove|life)'/g) ?? []).length, 4);

  const titlesInOrder = [
    'Sketch for Summer',
    "St Elmo's Fire",
    'Freelance',
    "Can't Do Without You",
    'Ritual Union',
    'Since I Left You',
    'Sound and Vision',
    'Lisztomania',
    "Busy Earnin'",
    'Time (You and I)',
    'Harmony Hall',
    "title: 'On'",
    'Home to You',
    'Huarache Lights',
    'Inspector Norse',
    'Found a Job',
    'The Flower Called Nowhere',
    "La femme d'argent",
  ];

  let cursor = -1;
  for (const title of titlesInOrder) {
    const next = data.indexOf(title, cursor + 1);
    assert.ok(next > cursor, `${title} must appear in the verified Spotify order`);
    cursor = next;
  }

  assert.match(data, /spotifyPlaylistId: '6cO8Len9xWLVftJePvuQhp'/);
  assert.match(data, /duration: '1 hr 23 min'/);
  assert.match(data, /durationMinutes: 83/);
});

test('WEDNESDAY 9:34 is a human-edited publication with a public calendar', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/wednesday-publication.ts'),
    read('src/pages/wednesday/index.astro'),
    read('src/pages/wednesday.json.ts'),
  ]);

  assert.match(data, /title: 'WEDNESDAY 9:34'/);
  assert.match(data, /label: 'Wednesdays at 9:34 PT'/);
  assert.match(data, /mode: 'human-edited'/);
  assert.match(data, /automation: false/);
  assert.equal((data.match(/status: '(pilot double issue|open brief)'/g) ?? []).length, 5);
  assert.match(page, /PUBLIC EDITORIAL CALENDAR/);
  assert.match(page, /Close enough to become a cadence/);
  assert.match(page, /Playlist, cover, sequence, receipt/);
  assert.match(endpoint, /Calendar entries are editorial briefs, not prewritten or automatically generated issues/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('Issue 002 is playable, sequenced, responsive, and motion-safe', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/wednesday/002.astro'),
    read('src/pages/wednesday/002.json.ts'),
    read('src/content/blocks/0538.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /MusicPlaylist/);
  assert.match(page, /open\.spotify\.com\/embed\/playlist/);
  assert.match(page, /data-goodwork-tab/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /@media \(max-width: 650px\)/);
  assert.doesNotMatch(page, /type="email"/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /playlistVisibility: 'public'/);
  assert.match(endpoint, /does not proxy or restream audio/);
  assert.match(endpoint, /No artist, label, publisher, estate, or Spotify endorsement is claimed/);

  assert.equal(block.id, '0538');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'LISTEN');
  assert.equal(block.meta.playlistVisibility, 'public');
  assert.equal(block.meta.trackCount, 18);
  assert.equal(block.meta.durationMinutes, 83);
  assert.equal(block.meta.automation, false);
  assert.equal(block.meta.audioProxy, false);
  assert.equal(block.meta.emailCollection, false);
});

test('the publication remains on the homepage and travels through discovery', async () => {
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

  for (const surface of surfaces) {
    assert.match(surface, /WEDNESDAY 9:34|wednesday/);
  }

  // front door rebuilt 2026-09-01: the edition modules became magazine-rack covers, so check the doors, not the components.
  assert.match(surfaces[0], /href(?:=|: )['"]\/25\/magazine['"]/);
  assert.match(surfaces[0], /href(?:=|: )['"]\/wednesday['"]/);
  assert.match(surfaces[0], /Periodical/);
  assert.match(surfaces[1], /Get me that Wednesday playlist/);
  assert.match(surfaces[1], /Publication \+ calendar/);
  assert.match(surfaces[2], /id: '0538'/);
  assert.match(surfaces[4], /wednesday\/002\.json/);
  assert.match(surfaces[5], /wednesdayGoodWork/);
  assert.match(surfaces[6], /human-edited/);
  assert.match(surfaces[7], /THE GOOD WORK/);
});

test('both checked-in covers are square and both Block images are social-wide', async () => {
  const paths = {
    firstCover: new URL('../public/images/playlists/wednesday-morning-uplift-cover.png', import.meta.url),
    secondCover: new URL('../public/images/playlists/wednesday-0934-good-work-cover.png', import.meta.url),
    firstSocial: new URL('../public/images/og/b/0537.png', import.meta.url),
    secondSocial: new URL('../public/images/og/b/0538.png', import.meta.url),
  };

  await Promise.all(Object.values(paths).map((path) => access(path)));
  assert.deepEqual(pngSize(await readFile(paths.firstCover)), { width: 1536, height: 1536 });
  assert.deepEqual(pngSize(await readFile(paths.secondCover)), { width: 1536, height: 1536 });
  assert.deepEqual(pngSize(await readFile(paths.firstSocial)), { width: 1200, height: 630 });
  assert.deepEqual(pngSize(await readFile(paths.secondSocial)), { width: 1200, height: 630 });
});
