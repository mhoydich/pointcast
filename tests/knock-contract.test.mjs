import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);

test('knock publishes a CORS-readable random-door contract', async () => {
  const source = await readFile(new URL('src/pages/knock.json.ts', ROOT), 'utf8');

  assert.match(source, /destinationSource: 'https:\/\/pointcast\.xyz\/explore\.json'/);
  assert.match(source, /destinationField: 'features\[\]\.slug'/);
  assert.match(source, /const excludedRoutes = \['\/knock', '\/explore', '\/404'\]/);
  assert.match(source, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(source, /rel="alternate"; type="text\/html"/);
  assert.match(source, /rel="item-source"; type="application\/json"/);
});

test('the human gate advertises its JSON companion', async () => {
  const source = await readFile(new URL('src/pages/knock.astro', ROOT), 'utf8');

  assert.match(source, /href="\/knock\.json">gate contract<\/a>/);
});
