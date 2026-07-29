import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Beach Commons is a fifteen-edition series with four legible paths', async () => {
  const data = await read('src/lib/beach-commons-series.ts');
  const page = await read('src/pages/beach-commons.astro');

  const editionRecords = [...data.matchAll(/^\s{4}edition: (\d+),$/gm)];
  const pathRecords = [...data.matchAll(/^\s{4}id: '(build|make|kit|coast)',$/gm)];
  const assignedPaths = [...data.matchAll(/^\s{4}path: '(build|make|kit|coast)',$/gm)];

  assert.deepEqual(
    editionRecords.map((match) => Number(match[1])),
    Array.from({ length: 15 }, (_, index) => index + 1),
  );
  assert.deepEqual(pathRecords.map((match) => match[1]), ['build', 'make', 'kit', 'coast']);
  assert.equal(assignedPaths.length, 15);
  assert.equal(assignedPaths.filter((match) => match[1] === 'build').length, 5);
  for (const path of ['make', 'coast']) {
    assert.equal(assignedPaths.filter((match) => match[1] === path).length, 3);
  }
  assert.equal(assignedPaths.filter((match) => match[1] === 'kit').length, 4);

  assert.match(data, /currentEdition: 15/);
  assert.match(data, /current: true/);
  assert.match(page, /Choose your way in\./);
  assert.match(page, /Public life as a design material\./);
  assert.match(page, /Imagine fully\. Claim carefully\./);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /\[hidden\]/);
  assert.match(page, /data-filter=\{path\.id\}/);
  assert.match(page, /id="random-edition"/);
  assert.doesNotMatch(page, /fetch\s*\(/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
});

test('Beach Commons front door publishes a bounded machine index and discovery trail', async () => {
  const [endpoint, sitemap, llms, llmsFull, home] = await Promise.all([
    read('src/pages/beach-commons.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/index.astro'),
  ]);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /localInstrument/);
  assert.match(endpoint, /storage: false/);
  assert.match(endpoint, /network: false/);
  assert.match(endpoint, /physicalStatus/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v1'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v15\.json/);
  assert.match(llms, /Beach Commons — Complete Field Series/);
  assert.match(llms, /\/beach-commons\/v1/);
  assert.match(llmsFull, /Beach Commons — complete field series/);
  assert.match(home, /All fifteen Beach Commons editions/);
  assert.match(home, /Beach Commons index JSON/);
});

test('every Beach Commons index image exists', async () => {
  const data = await read('src/lib/beach-commons-series.ts');
  const imagePaths = [...data.matchAll(/^\s{4}image: '([^']+)',$/gm)].map(
    (match) => match[1],
  );

  assert.equal(imagePaths.length, 15);
  await Promise.all(
    imagePaths.map(async (path) => {
      const url = new URL(`../public${path}`, import.meta.url);
      await access(url);
      assert.ok((await readFile(url)).byteLength > 1_000);
    }),
  );
});
