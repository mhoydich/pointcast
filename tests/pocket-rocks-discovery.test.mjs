import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Rocks gets its own permanent record while concurrent publications remain discoverable', async () => {
  const blocks = await Promise.all((await readdir(new URL('src/content/blocks/', root)))
    .filter(name => name.endsWith('.json'))
    .map(async name => ({ name, block: JSON.parse(await read(`src/content/blocks/${name}`)) })));
  const rocks = blocks.filter(({ block }) => block.title === 'Pocket Rocks');
  assert.equal(rocks.length, 1);
  const { name, block } = rocks[0];
  assert.equal(name, `${block.id}.json`);
  assert.notEqual(block.id, '0643');
  assert.equal(block.external.url, 'https://pointcast.xyz/rocks/');
  const deathStar = blocks.find(({ block }) => block.id === '0643').block;
  assert.equal(deathStar.title, 'Death Star BBS: a museum, a board, a computer club');

  const compiled = await build({
    entryPoints: [new URL('src/lib/pointcast-apps.ts', root).pathname],
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
  });
  const { POINTCAST_APPS } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  for (const slug of ['pocket-rocks', 'arcade-remembrance', 'atari-bbs']) {
    assert.equal(POINTCAST_APPS.filter(app => app.slug === slug).length, 1, slug);
  }
  assert.equal(new Set(POINTCAST_APPS.map(app => app.slug)).size, POINTCAST_APPS.length);

  const sitemap = await read('src/pages/sitemap-discovery.xml.ts');
  for (const path of ['/rocks/', '/rocks.json', '/arcade-remembrance', '/arcade-remembrance.json', '/atari-bbs/', '/atari-bbs.json']) {
    assert.equal(sitemap.split(`https://pointcast.xyz${path}'`).length + sitemap.split(`https://pointcast.xyz${path}\"`).length - 2, 1, path);
  }
  const guide = await read('public/llms-full.txt');
  const rocksSection = guide.split('## Pocket Rocks — Deep time, small treasures\n')[1].split('\n## ')[0];
  assert.ok(rocksSection.includes(`[Block ${block.id}](https://pointcast.xyz/b/${block.id})`));
  assert.ok(!rocksSection.includes('/b/0642'));
  assert.ok(guide.includes('## Death Star BBS — Atari BBS Museum'));
  assert.ok(guide.includes('Permanent Block: [/b/0643](https://pointcast.xyz/b/0643).'));
  for (const source of [sitemap, guide, await read('src/lib/pointcast-apps.ts')]) {
    assert.doesNotMatch(source, /^(?:<<<<<<<|=======|>>>>>>>)/m);
  }
});
