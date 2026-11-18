import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const origin = 'https://pointcast.xyz';
const text = path => readFileSync(new URL('public' + path, root), 'utf8');

function assertAsset(pathname) {
  const path = 'public' + pathname;
  if (existsSync(new URL(path, root))) return;
  // A sparse cloud checkout can exclude existing upstream art and libraries.
  const entry = execFileSync('git', ['ls-files', '-t', '--', path], {
    cwd: fileURLToPath(root), encoding: 'utf8'
  }).trim();
  assert.equal(entry, 'S ' + path, 'Missing published asset ' + pathname);
}

test('district pages load the same resources with and without the trailing slash', () => {
  for (const section of ['', 'chain/', 'launch/', 'publications/', 'switchboard/', 'tezos/']) {
    const path = '/metaverse/' + section;
    const page = text(path + 'index.html');
    const base = page.match(/<base\b[^>]*href="([^"]+)"/i)?.[1];
    const tags = page.match(/<(?:script|link|img)\b[^>]+>/gi) ?? [];
    for (const tag of tags) {
      const reference = tag.match(/\b(?:src|href)="([^"]+)"/i)?.[1];
      if (!reference || /\brel="canonical"/i.test(tag)) continue;
      const expected = new URL(reference, origin + path);
      if (expected.origin !== origin) continue;
      for (const entryPath of [path, path.slice(0, -1)]) {
        const entry = new URL(entryPath, origin);
        const actual = new URL(reference, base ? new URL(base, entry) : entry);
        assert.equal(actual.href, expected.href, entry.pathname + ' loads ' + reference);
      }
      assertAsset(expected.pathname);
    }
  }
});

test('WebGL entry imports resolve to on-site modules', () => {
  const page = text('/metaverse/index.html');
  const { imports } = JSON.parse(page.match(/<script type="importmap">([^<]+)<\/script>/)[1]);
  const mainPath = '/metaverse/webgl/main.js';
  for (const [, specifier] of text(mainPath).matchAll(/\bfrom ['"]([^'"]+)['"]/g)) {
    const prefix = Object.keys(imports).find(key => key.endsWith('/') && specifier.startsWith(key));
    const location = imports[specifier] ?? (prefix && imports[prefix] + specifier.slice(prefix.length)) ?? specifier;
    const url = new URL(location, origin + mainPath);
    assert.equal(url.origin, origin);
    assertAsset(url.pathname);
  }
});

test('district catalog and launch artwork can be loaded without external services', () => {
  const window = {};
  runInNewContext(text('/metaverse/buildings.js'), { window });
  const buildings = window.LoomBuildings;
  assert.equal(buildings.length, 6);
  assert.equal(new Set(buildings.map(building => building.id)).size, buildings.length);
  for (const building of buildings) {
    assert.equal(new URL(building.imageSource).pathname, building.image);
    assert.equal(new URL(building.source).origin, origin);
    assert.match(building.job, /^https:\/\/www\.midjourney\.com\/jobs\/[\da-f-]+\?index=\d+$/);
    assertAsset(building.image);
  }
  const draft = JSON.parse(text('/metaverse/launch/metadata-draft.json'));
  const image = new URL(draft.image);
  assert.equal(image.origin, origin);
  assertAsset(image.pathname);
});
