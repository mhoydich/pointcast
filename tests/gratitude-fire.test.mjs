import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { transform } from '@astrojs/compiler';
import { experimental_AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { flameSvg } from '../src/lib/loom/hearth.mjs';
import { DEFAULT_LINE, drawPicture, lineFromHash, mountGratitudeFire, normalizeLine, shareUrl } from '../src/lib/gratitude-fire.mjs';

const require = createRequire(import.meta.url);
const page = new URL('../src/pages/sketches/gratitude-fire.astro', import.meta.url);
const source = await readFile(page, 'utf8');
const client = await readFile(new URL('../src/lib/gratitude-fire.mjs', import.meta.url), 'utf8');
// Exercise real server-rendered HTML entirely in memory using copied dependencies.
// No Astro build, dist directory, browser installation, network, or API writes.
const compiled = await transform(source.replace(/'\.\.\/\.\.\/lib\/([^']+)'/g, (_, file) =>
  JSON.stringify(new URL(`../src/lib/${file}`, import.meta.url).href)), {
  filename: page.pathname,
  internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
});
assert.deepEqual(compiled.diagnostics.filter(d => d.severity === 1), []);
const emitted = compiled.code
  .replace(/,\s*createMetadata as \$\$createMetadata/, '')
  .replace(/['"]astro\/runtime\/server\/index\.js['"]/g, JSON.stringify(pathToFileURL(require.resolve('astro/runtime/server/index.js')).href));
const code = ts.transpileModule(emitted, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  transformers: { before: [() => sf => ts.factory.updateSourceFile(sf, sf.statements.filter(s => {
    if (ts.isImportDeclaration(s) && /\?astro&type=style&/.test(s.moduleSpecifier.text)) return false;
    if (ts.isVariableStatement(s) && s.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === '$$metadata')) return false;
    return true;
  }))] },
}).outputText;
const { default: Page } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const container = await experimental_AstroContainer.create();
const base = 'https://pointcast.xyz/sketches/gratitude-fire/';
const html = await container.renderToString(Page, { request: new Request(base) });
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(url = base, mount = true) {
  const dom = new JSDOM(html, { url });
  if (mount) mountGratitudeFire(dom.window.document, dom.window);
  return dom;
}

test('without JavaScript the actual page shows one canonical Hearth flame and its default line', () => {
  const dom = fixture(base, false);
  const { document } = dom.window;
  assert.equal(document.title, 'A gratitude fire · PointCast');
  assert.equal(document.querySelector('h1').textContent, 'A gratitude fire');
  assert.equal(document.querySelector('#line').textContent, DEFAULT_LINE);
  assert.equal(document.querySelector('#maker').hidden, true);
  assert.equal(document.querySelectorAll('svg').length, 1);
  const expected = JSDOM.fragment(flameSvg(64, 'warm', { still: true })).querySelector('svg');
  assert.equal(document.querySelector('.hearth-flame').outerHTML, expected.outerHTML);
  assert.match(document.querySelector('noscript').textContent, /Turn on JavaScript/);
  assert.equal(document.querySelector('link[rel="canonical"]').href, base);
  dom.window.close();
});

test('the page loads IBM Plex Sans and uses it for the picture preview', () => {
  const dom = fixture(base, false);
  const font = dom.window.document.querySelector('link[rel="stylesheet"]');
  assert.equal(new URL(font.href).searchParams.get('family'), 'IBM Plex Sans:wght@400');
  assert.match(source, /figcaption\s*\{[^}]*font:[^;]*"IBM Plex Sans", system-ui, sans-serif/);
  dom.window.close();
});

test('shared markup is rendered as literal text, never executable elements', () => {
  const text = 'thankful for <img src=x onerror="alert(1)"> & <script>alert(2)</script> 🦃';
  const dom = fixture(shareUrl(base, text));
  const { document } = dom.window;
  assert.equal(document.querySelector('#line').textContent, text);
  assert.equal(document.querySelector('#line').children.length, 0);
  assert.equal(document.querySelector('#words').value, text);
  assert.equal(document.querySelector('#maker').hidden, false);
  assert.equal(document.querySelector('img'), null);
  dom.window.close();
});

test('editing caps complete emoji, defaults an empty preview, and clears a stale copied link', async () => {
  const dom = fixture();
  const { document, Event } = dom.window;
  document.querySelector('#maker').dispatchEvent(new Event('submit', { cancelable: true }));
  await tick();
  assert.equal(document.querySelector('#fallback').hidden, false);
  const input = document.querySelector('#words');
  input.value = '🔥'.repeat(150);
  input.dispatchEvent(new Event('input'));
  assert.equal(input.value, '🔥'.repeat(140));
  assert.equal(document.querySelector('#line').textContent, input.value);
  assert.equal(document.querySelector('#count').textContent, '140 / 140');
  assert.equal(document.querySelector('#fallback').hidden, true);
  assert.equal(document.querySelector('#link').value, '');
  input.value = '   ';
  input.dispatchEvent(new Event('input'));
  assert.equal(document.querySelector('#line').textContent, DEFAULT_LINE);
  dom.window.close();
});

test('Copy link and its permission-denied fallback both open the exact preview line', async () => {
  for (const fail of [false, true]) {
    const dom = fixture();
    const { document, Event } = dom.window;
    const input = document.querySelector('#words');
    input.value = '  thankful for pie & friends! 🥧\nTonight.  ';
    input.dispatchEvent(new Event('input'));
    let copied;
    Object.defineProperty(dom.window.navigator, 'clipboard', { value: {
      writeText: async url => { if (fail) throw new Error('Permission denied'); copied = url; },
    } });
    document.querySelector('#maker').dispatchEvent(new Event('submit', { cancelable: true }));
    await tick();
    const url = fail ? document.querySelector('#link').value : copied;
    assert.equal(lineFromHash(new URL(url).hash), document.querySelector('#line').textContent);
    assert.equal(document.querySelector('#fallback').hidden, !fail);
    if (fail) assert.equal(document.activeElement, document.querySelector('#link'));
    else assert.match(document.querySelector('#status').textContent, /Link copied/);
    dom.window.close();
  }
});

test('changing fragments refreshes both the words and the preview', async () => {
  const dom = fixture();
  const text = 'thankful for another day 🌻';
  dom.window.location.hash = new URL(shareUrl(base, text)).hash;
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert.equal(dom.window.document.querySelector('#words').value, text);
  assert.equal(dom.window.document.querySelector('#line').textContent, text);
  dom.window.location.hash = '#fire=hearth&line=%';
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert.equal(dom.window.document.querySelector('#line').textContent, DEFAULT_LINE);
  dom.window.close();
});

function canvasFixture(dom) {
  const calls = [];
  const context = {
    font: '48px Georgia',
    fillRect(...args) { calls.push(['background', this.fillStyle, ...args]); },
    save() {}, restore() {}, translate(...args) { calls.push(['translate', ...args]); },
    scale(...args) { calls.push(['scale', ...args]); },
    fill(path) { calls.push(['path', this.fillStyle, path.d]); },
    measureText(text) { return { width: Array.from(text).length * parseFloat(this.font) * .65 }; },
    fillText(...args) { calls.push(['text', this.fillStyle, this.font, ...args]); },
  };
  dom.window.Path2D = class { constructor(d) { this.d = d; } };
  const colors = ['#E8572A', '#FF9F1C', '#F4EDE4'];
  const paths = [...dom.window.document.querySelectorAll('.hearth-flame path')];
  dom.window.getComputedStyle = path => ({ fill: colors[paths.indexOf(path)] });
  dom.window.HTMLCanvasElement.prototype.getContext = () => context;
  return { calls, context, paths };
}

test('picture drawing uses exact Hearth paths, 1200x630 pixels, and safely fits the entire line', () => {
  const dom = fixture();
  const { document } = dom.window;
  const { calls, context, paths } = canvasFixture(dom);
  const canvas = document.createElement('canvas');
  const text = 'W'.repeat(140);
  drawPicture(canvas, document.querySelector('svg'), text);
  assert.deepEqual([canvas.width, canvas.height], [1200, 630]);
  assert.deepEqual(calls.find(call => call[0] === 'background'), ['background', '#14110F', 0, 0, 1200, 630]);
  assert.deepEqual(calls.filter(call => call[0] === 'path').map(call => call[2]), paths.map(path => path.getAttribute('d')));
  const written = calls.filter(call => call[0] === 'text');
  assert.equal(written.map(call => call[3]).join(''), text);
  for (const [, color, font, words, x, y] of written) {
    context.font = font;
    assert.equal(color, '#F4EDE4');
    assert.match(font, /^\d+px "IBM Plex Sans", system-ui, sans-serif$/);
    assert.ok(context.measureText(words).width <= 1008);
    assert.equal(x, 600);
    assert.ok(y > 300 && y < 550);
  }
  calls.length = 0;
  const markup = '<img src=x onerror="alert(1)">';
  drawPicture(canvas, document.querySelector('svg'), markup);
  assert.equal(calls.filter(call => call[0] === 'text').map(call => call[3]).join(' '), normalizeLine(markup));
  dom.window.close();
});

function downloadFixture(dom) {
  const receipt = {};
  dom.window.HTMLCanvasElement.prototype.toBlob = (callback, type) => { receipt.format = type; callback(new dom.window.Blob(['png'], { type })); };
  dom.window.URL.createObjectURL = blob => { assert.equal(blob.type, 'image/png'); return 'blob:gratitude'; };
  dom.window.URL.revokeObjectURL = url => { receipt.revoked = url; };
  dom.window.HTMLAnchorElement.prototype.click = function () { receipt.downloaded = [this.href, this.download]; };
  return receipt;
}

test('Save picture requests a PNG download and releases the temporary object URL without FontFaceSet support', async () => {
  const dom = fixture();
  canvasFixture(dom);
  const receipt = downloadFixture(dom);
  dom.window.setTimeout = callback => callback();
  dom.window.document.querySelector('#save').click();
  await tick();
  assert.equal(receipt.format, 'image/png');
  assert.deepEqual(receipt.downloaded, ['blob:gratitude', 'gratitude-fire.png']);
  assert.equal(receipt.revoked, 'blob:gratitude');
  assert.equal(dom.window.document.querySelector('#save').disabled, false);
  assert.equal(dom.window.document.querySelector('a[download]'), null);
  dom.window.close();
});

test('Save picture waits for IBM Plex Sans before any canvas drawing or PNG export', async () => {
  const dom = fixture();
  const { document } = dom.window;
  const { calls } = canvasFixture(dom);
  const receipt = downloadFixture(dom);
  const timers = [], cleared = [];
  dom.window.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
  dom.window.clearTimeout = id => cleared.push(id);
  let loaded, request;
  Object.defineProperty(document, 'fonts', { value: {
    load(font, text) {
      request = { font, text };
      return new Promise(resolve => { loaded = resolve; });
    },
  } });
  const text = 'thankful for café and friends.';
  document.querySelector('#words').value = text;
  document.querySelector('#save').click();
  await tick();
  assert.deepEqual(request, { font: '48px "IBM Plex Sans"', text });
  assert.equal(document.querySelector('#save').disabled, true);
  assert.deepEqual(calls, []);
  assert.equal(receipt.format, undefined);

  loaded([]);
  await tick();
  assert.equal(calls[0][0], 'background');
  assert.equal(calls.filter(call => call[0] === 'text').map(call => call[3]).join(' '), text);
  assert.deepEqual(receipt.downloaded, ['blob:gratitude', 'gratitude-fire.png']);
  assert.deepEqual(cleared, [1]);
  assert.equal(document.querySelector('#save').disabled, false);
  dom.window.close();
});

test('a font load that never settles still saves after a short timeout', async () => {
  const dom = fixture();
  const { document } = dom.window;
  const { calls } = canvasFixture(dom);
  const receipt = downloadFixture(dom);
  const timers = [];
  dom.window.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
  dom.window.clearTimeout = () => {};
  Object.defineProperty(document, 'fonts', { value: { load: () => new Promise(() => {}) } });
  document.querySelector('#save').click();
  await tick();
  assert.deepEqual(calls, []);
  assert.equal(timers.length, 1);
  assert.ok(timers[0].delay > 0 && timers[0].delay <= 1500);
  timers[0].callback();
  await tick();
  assert.deepEqual(receipt.downloaded, ['blob:gratitude', 'gratitude-fire.png']);
  assert.match(document.querySelector('#status').textContent, /picture is ready/);
  assert.equal(document.querySelector('#save').disabled, false);
  dom.window.close();
});

for (const failure of ['rejects', 'throws']) {
  test(`a font load that ${failure} still saves the PNG`, async () => {
    const dom = fixture();
    const { document } = dom.window;
    canvasFixture(dom);
    const receipt = downloadFixture(dom);
    Object.defineProperty(document, 'fonts', { value: {
      load() {
        if (failure === 'throws') throw new Error('Font unavailable');
        return Promise.reject(new Error('Font unavailable'));
      },
    } });
    document.querySelector('#save').click();
    await tick();
    assert.deepEqual(receipt.downloaded, ['blob:gratitude', 'gratitude-fire.png']);
    assert.match(document.querySelector('#status').textContent, /picture is ready/);
    assert.equal(document.querySelector('#save').disabled, false);
    dom.window.close();
  });
}

test('picture failures leave Copy link available and permit another save attempt', async () => {
  const dom = fixture();
  dom.window.HTMLCanvasElement.prototype.getContext = () => null;
  dom.window.document.querySelector('#save').click();
  await tick();
  assert.match(dom.window.document.querySelector('#status').textContent, /could not be saved/);
  assert.equal(dom.window.document.querySelector('#save').disabled, false);
  assert.equal(dom.window.document.querySelector('button[type="submit"]').disabled, false);
  dom.window.close();
});

test('the page stays still and its client has no network, storage, or HTML-writing path', () => {
  assert.doesNotMatch(html, /hearth-flicker/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(client, /innerHTML|outerHTML|insertAdjacentHTML|\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.match(source, /--hearth-ground: #14110F/);
  assert.match(source, /--hearth-ember: #E8572A/);
  assert.match(source, /--hearth-flame: #FF9F1C/);
  assert.match(source, /--hearth-core: #F4EDE4/);
});
