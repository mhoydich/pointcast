import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const guarded = ['FooterBar', 'DockLauncher', 'CursorRoom', 'TugRope', 'SpellLayer'];

test('chrome components cannot regress to large inline scripts', async () => {
  for (const name of guarded) {
    const source = await read(`src/components/${name}.astro`);
    const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    for (const [, attributes, body] of scripts) {
      if (!/\bis:inline\b/.test(attributes)) continue;
      const bytes = Buffer.byteLength(body);
      assert.ok(bytes <= 2_048, `${name}.astro contains ${bytes} bytes of inline JS (limit: 2048)`);
    }
  }
});

test('BlockLayout owns one bundled chrome entry and components own no runtime scripts', async () => {
  const [layout, chrome, ...components] = await Promise.all([
    read('src/layouts/BlockLayout.astro'),
    read('src/scripts/chrome.ts'),
    ...guarded.map((name) => read(`src/components/${name}.astro`)),
  ]);
  assert.equal((layout.match(/import '\.\.\/scripts\/chrome'/g) || []).length, 1);
  assert.match(chrome, /document\.addEventListener\('astro:page-load', initChrome\)/);
  assert.match(chrome, /pageScope\?\.abort\(\)/);
  assert.match(chrome, /document\.querySelector<HTMLElement>\('\.cursor-room'\)/);
  for (const component of components) {
    assert.doesNotMatch(component, /<script\b/, 'chrome runtime belongs in src/scripts/chrome.ts');
    assert.doesNotMatch(component, /<[^>]+\sid=/, 'chrome DOM uses scoped data refs, not element ids');
  }
});
