import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('July 22 Today’s Art preserves all fifteen supplied source files', async () => {
  const assets = await readdir(new URL('src/assets/todays-art/2026-07-22/local-batch/', root));
  assert.equal(assets.length, 15);
  assert.deepEqual(assets.map((name) => name.slice(0, 2)), Array.from({ length: 15 }, (_, index) => String(index + 1).padStart(2, '0')));
});

test('homepage places the 3D Today’s Art rack above the prior lead module', async () => {
  const home = await readFile(new URL('src/pages/index.astro', root), 'utf8');
  const nowLine = home.indexOf('<NowLine');
  const todaysArt = home.indexOf('<TodaysArt />');
  const school = home.indexOf('<ElSegundoSchoolHome />');
  assert.ok(nowLine > -1 && todaysArt > nowLine && school > todaysArt);
  assert.equal(home.match(/<TodaysArt \/>/g)?.length, 1);
});

test('current and permanent gallery routes point at edit 003 while edit 002 stays historical', async () => {
  const current = await readFile(new URL('src/pages/gallery/today.astro', root), 'utf8');
  const dated = await readFile(new URL('src/pages/gallery/2026-07-22.astro', root), 'utf8');
  const historicalJson = await readFile(new URL('src/pages/gallery/2026-07-21.json.ts', root), 'utf8');
  const manifest = await readFile(new URL('src/lib/todays-gallery.ts', root), 'utf8');

  assert.match(current, /CityIsAPosterEdition/);
  assert.match(dated, /CityIsAPosterEdition/);
  assert.match(historicalJson, /positiveIndexGalleryManifest/);
  assert.match(manifest, /TODAY_GALLERY_DATE = '2026-07-22'/);
  assert.match(manifest, /generationTool: 'not asserted'/);
});

test('edit 003 is present in priority discovery and CORS-open machine surfaces', async () => {
  const [sitemap, agents, headers] = await Promise.all([
    readFile(new URL('src/pages/sitemap-discovery.xml.ts', root), 'utf8'),
    readFile(new URL('src/pages/agents.json.ts', root), 'utf8'),
    readFile(new URL('public/_headers', root), 'utf8'),
  ]);

  assert.match(sitemap, /gallery\/2026-07-22\.json/);
  assert.match(agents, /todaysArtManifest: 'https:\/\/pointcast\.xyz\/gallery\/today\.json'/);
  assert.match(headers, /\/gallery\/\*\.json[\s\S]*Access-Control-Allow-Origin: \*/);
});
