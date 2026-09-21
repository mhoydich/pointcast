import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the source directory only points at official https sites and states rights', async () => {
  const directory = JSON.parse(await read('src/data/download-sources.json'));
  assert.match(directory.reviewed, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(directory.rule.length > 40);
  const shelfIds = directory.shelves.map((shelf) => shelf.id);
  assert.deepEqual(shelfIds, ['photos', 'museums', 'type', 'sound', 'world', 'software']);

  const seen = new Set();
  for (const shelf of directory.shelves) {
    assert.ok(shelf.title && shelf.dek, `${shelf.id} needs a title and dek`);
    assert.ok(shelf.entries.length >= 5, `${shelf.id} is thin`);
    for (const entry of shelf.entries) {
      const url = new URL(entry.url);
      assert.equal(url.protocol, 'https:', `${entry.name} must be https`);
      assert.ok(!seen.has(url.hostname + url.pathname), `${entry.name} is listed twice`);
      seen.add(url.hostname + url.pathname);
      assert.ok(entry.rights, `${entry.name} needs a rights pointer`);
      assert.ok(entry.note && entry.note.length <= 160, `${entry.name} note missing or too long`);
      // No download aggregators, mirrors, or link shorteners — maker's site only.
      assert.doesNotMatch(url.hostname, /(^|\.)(softonic\.com|cnet\.com|download\.com|filehippo\.com|sourceforge\.net|uptodown\.com|bit\.ly|t\.co)$/);
      if (entry.search) {
        assert.ok(entry.search.includes('{q}'), `${entry.name} search template needs {q}`);
        assert.equal(new URL(entry.search.replace('{q}', 'x')).hostname, url.hostname, `${entry.name} search must stay on its own host`);
      }
    }
  }
  const wired = directory.shelves.flatMap((shelf) => shelf.entries).filter((entry) => entry.finder).map((entry) => entry.finder).sort();
  assert.deepEqual(wired, ['aic', 'cma', 'met', 'nasa']);
});

test('the downloads page keeps the originals and adds the finder, shelves, and to-go sections', async () => {
  const page = await read('src/pages/downloads.astro');
  for (const id of ['id="originals"', 'id="shelves"', 'id="to-go"', '<PictureFinder />']) assert.ok(page.includes(id), `missing ${id}`);
  assert.match(page, /ART_DOWNLOAD_COLLECTIONS/);
  assert.match(page, /id=\{`set-\$\{set\.blockId\}`\}/, 'per-set anchors are permanent');
  assert.match(page, /rel="noopener"/);
});

test('the finder queries sources from the browser and never proxies through PointCast', async () => {
  const finder = await read('src/components/PictureFinder.astro');
  for (const host of ['api.artic.edu', 'openaccess-api.clevelandart.org', 'collectionapi.metmuseum.org', 'images-api.nasa.gov']) assert.ok(finder.includes(host), `finder should query ${host}`);
  assert.doesNotMatch(finder, /fetch\(['"`]\/api\//, 'no PointCast proxy');
  assert.match(finder, /is_public_domain/);
  assert.match(finder, /isPublicDomain/);
  assert.match(finder, /cc0: '1'/);
  assert.match(finder, /<style is:global>/, 'script-created cards need global styles');
});

test('the JSON catalog carries the directory and every to-go file exists', async () => {
  const endpoint = await read('src/pages/downloads.json.ts');
  for (const key of ['collections:', 'finder:', 'sources:', 'pointcastToGo:']) assert.ok(endpoint.includes(key), `downloads.json missing ${key}`);
  const lib = await read('src/lib/download-sources.ts');
  await access(new URL('../public/downloads/a-calendar-is-a-treaty-field-edition.pdf', import.meta.url));
  await access(new URL('../src/pages/downloads/my-pet-has-retained-counsel-brief.pdf.ts', import.meta.url));
  for (const route of ['blocks.json.ts', 'feed.xml.ts', 'feed.json.ts', 'agents.json.ts', 'connectors.astro']) await access(new URL(`../src/pages/${route}`, import.meta.url));
  for (const file of ['llms.txt', 'llms-full.txt']) await access(new URL(`../public/${file}`, import.meta.url));
  assert.match(lib, /\/downloads\.json/);
});
