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

test('Issue 001 defines a seven-desk college-football magazine', async () => {
  const data = await read('src/lib/pointcast-college-football-magazine.ts');
  const page = await read('src/pages/25/magazine/index.astro');

  for (const desk of [
    'The Belief Board',
    'The Receipt Book',
    'The Song Yard',
    'The Mascot Desk',
    'Future School',
    'Saturday Commons',
    'The Season Ledger',
  ]) {
    assert.match(data, new RegExp(`name: '${desk}'`));
  }

  assert.match(data, /issue: '001'/);
  assert.match(data, /The ranking is one department/);
  assert.match(page, /Seven desks/);
  assert.match(page, /THE MAGAZINE SYSTEM/);
  assert.match(page, /RESEARCH DESK/);
});

test('the repertoire report contains 35 programs, 16 dossiers, and 48 references', async () => {
  const data = await read('src/lib/pointcast-college-football-magazine.ts');
  const json = await read('src/pages/25/magazine.json.ts');
  const block = JSON.parse(await read('src/content/blocks/0530.json'));

  assert.equal(block.meta.selectablePrograms, 35);
  assert.equal(block.meta.pointcast25Programs, 25);
  assert.equal(block.meta.openFieldPrograms, 10);
  assert.equal(block.meta.researchedRepertoirePrograms, 16);
  assert.equal(block.meta.songReferences, 48);
  assert.equal(block.meta.evidenceLabels, 3);

  assert.match(data, /SONG_YARD_PROGRAMS/);
  assert.match(data, /SONG_YARD_REPERTOIRE_PROGRAMS/);
  assert.match(data, /SONG_YARD_REPERTOIRE/);
  assert.match(json, /selectablePrograms: SONG_YARD_PROGRAMS\.length/);
  assert.match(json, /researchedRepertoirePrograms: SONG_YARD_REPERTOIRE_PROGRAMS\.length/);
  assert.match(json, /songReferences: SONG_YARD_REPERTOIRE\.length/);
});

test('research links and rights boundaries travel with the issue', async () => {
  const [data, page, json] = await Promise.all([
    read('src/lib/pointcast-college-football-magazine.ts'),
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
  ]);

  assert.match(data, /apnews\.com/);
  assert.match(data, /wvusports\.com/);
  assert.match(data, /band\.ucla\.edu/);
  assert.match(data, /news\.jrn\.msu\.edu/);
  assert.match(data, /news\.asu\.edu/);
  assert.match(data, /colorado\.edu/);
  assert.match(data, /music\.ku\.edu/);
  assert.match(data, /masongross\.rutgers\.edu/);
  assert.match(data, /nysenate\.gov/);
  assert.match(data, /open\.spotify\.com\/search/);
  assert.match(page, /unofficial editorial/i);
  assert.match(json, /hostsRecordings: false/);
  assert.match(json, /streamsRecordings: false/);
  assert.match(json, /reproducesLyrics: false/);
  assert.match(json, /reconstructsProtectedMelodies: false/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.doesNotMatch(page, /<audio|<iframe/);
});

test('the magazine is discoverable across the full PointCast contract', async () => {
  const surfaces = await Promise.all([
    read('src/pages/index.astro'),
    read('src/pages/25/index.astro'),
    read('src/pages/25.json.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/25/2029/index.astro'),
    read('src/pages/25/2029/field-kit/index.astro'),
    read('src/pages/25/2029/song-yard/index.astro'),
    read('src/pages/25/2029/song-yard.json.ts'),
  ]);

  for (const surface of surfaces) {
    assert.match(surface, /25\/magazine|COLLEGE_FOOTBALL_MAGAZINE\.(canonical|machineEdition)/);
  }
});

test('Block 0530 and the social card publish the complete issue', async () => {
  const block = JSON.parse(await read('src/content/blocks/0530.json'));
  assert.equal(block.id, '0530');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'READ');
  assert.equal(block.meta.official, false);
  assert.equal(block.meta.hostsRecordings, false);
  assert.equal(block.meta.streamsRecordings, false);

  const path = new URL('../public/images/pointcast-college-football-magazine/social-card.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});
