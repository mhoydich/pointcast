import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Cheap static guards for the two phone apps: nothing here runs a browser, it only
// checks that what the worker precaches, what app.js looks up and what the manifest
// points at all exist on disk.
const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const APPS = ['pmm', 'nouns-messenger'];

// '/pmm/' is served by public/pmm/index.html; '/pmm/style.css' by public/pmm/style.css.
const onDisk = (url) => join(pub, url.endsWith('/') ? url + 'index.html' : url);
const read = (path) => readFileSync(join(pub, path), 'utf8');

for (const app of APPS) {
  test(`${app}: every file the service worker precaches exists under public/`, () => {
    const m = read(`${app}/sw.js`).match(/const FILES = \[([\s\S]*?)\];/);
    assert.ok(m, 'sw.js declares const FILES = [...]');
    const files = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    assert.ok(files.length > 0, 'FILES is not empty');
    for (const url of files) {
      assert.ok(url.startsWith(`/${app}/`), `${url} stays inside /${app}/`);
      assert.ok(existsSync(onDisk(url)), `${url} → ${onDisk(url)} exists`);
    }
  });

  test(`${app}: every id app.js looks up exists in index.html`, () => {
    const js = read(`${app}/app.js`);
    const html = read(`${app}/index.html`);
    const ids = new Set([...js.matchAll(/(?:\$|getElementById)\(\s*['"]([^'"]+)['"]\s*\)/g)].map((x) => x[1]));
    assert.ok(ids.size > 0, 'app.js references at least one id');
    const declared = new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map((x) => x[1]));
    const missing = [...ids].filter((id) => !declared.has(id));
    assert.deepEqual(missing, [], `ids missing from ${app}/index.html`);
  });

  test(`${app}: manifest.webmanifest parses and its icons exist`, () => {
    const manifest = JSON.parse(read(`${app}/manifest.webmanifest`));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest lists icons');
    for (const icon of manifest.icons) {
      assert.ok(existsSync(onDisk(icon.src)), `${icon.src} exists`);
    }
  });
}
