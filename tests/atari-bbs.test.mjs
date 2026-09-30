import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const script = ts.transpileModule(read('src/scripts/atari-bbs.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

function museum({ storageDenied = false, reducedMotion = true } = {}) {
  const dom = new JSDOM(read('dist/atari-bbs/index.html'), {
    url: 'https://pointcast.xyz/atari-bbs/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  dom.window.matchMedia = () => ({ matches: reducedMotion });
  if (storageDenied) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('blocked'); } });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.eval(script);
  const find = selector => dom.window.document.querySelector(selector);
  const click = selector => find(selector).click();
  const command = value => {
    find('#museum-command').value = value;
    find('[data-command-form]').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  };
  return { dom, find, click, command };
}

test('terminal connects, accepts commands safely, and disconnects without a network login', () => {
  const app = museum();
  try {
    const welcome = app.find('[data-output]').textContent;
    app.click('[data-instant]');
    assert.equal(app.find('[data-output]').textContent, welcome);
    app.click('[data-connect]');
    assert.equal(app.find('[data-connection]').textContent, 'CONNECTED');
    assert.equal(app.find('[data-command-form]').hidden, false);
    app.command(' h ');
    assert.match(app.find('[data-output]').textContent, /Overlord = Mike Hoydich/);
    app.command('<img src=x onerror=alert(1)>');
    assert.match(app.find('[data-output]').textContent, /COMMAND NOT FOUND/);
    assert.equal(app.find('[data-output] img'), null);
    app.command('HELP');
    assert.match(app.find('[data-output]').textContent, /WELCOME TO THE MUSEUM/);
    app.command('Q');
    assert.equal(app.find('[data-connection]').textContent, 'OFFLINE');
    assert.equal(app.find('[data-command-form]').hidden, true);
    assert.equal(app.find('[data-connect]').hidden, false);
  } finally { app.dom.window.close(); }
});

test('38-column dash requires alternating input, finishes, resets, and survives denied storage', () => {
  const app = museum({ storageDenied: true });
  try {
    app.click('[data-command="G"]');
    assert.equal(app.find('#dash').hidden, false);
    app.click('[data-step="A"]');
    app.click('[data-step="A"]');
    assert.equal(app.find('.dash-track').getAttribute('aria-valuenow'), '1');
    for (let i = 1; i < 38; i++) app.click(`[data-step="${i % 2 ? 'L' : 'A'}"]`);
    assert.equal(app.find('.dash-track').getAttribute('aria-valuenow'), '38');
    assert.match(app.find('[data-dash-status]').textContent, /Finish!/);
    assert.match(app.find('[data-best]').textContent, /Your best:/);
    app.click('[data-reset]');
    assert.equal(app.find('.dash-track').getAttribute('aria-valuenow'), '0');
    app.find('#museum-command').dispatchEvent(new app.dom.window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    assert.equal(app.find('.dash-track').getAttribute('aria-valuenow'), '0', 'typing a command must not move the game');
    app.find('#dash').dispatchEvent(new app.dom.window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    assert.equal(app.find('.dash-track').getAttribute('aria-valuenow'), '1');
    app.command('Q');
    assert.equal(app.find('#dash').hidden, true);
    assert.equal(app.find('.dash-track').getAttribute('aria-valuenow'), '0');
  } finally { app.dom.window.close(); }
});

test('slow text can be completed immediately and a new command cancels the old output', async () => {
  const app = museum({ reducedMotion: false });
  try {
    app.click('[data-connect]');
    assert.equal(app.find('[data-skip]').hidden, false);
    app.command('R');
    app.click('[data-skip]');
    assert.match(app.find('[data-output]').textContent, /^THE RIG/);
    const rendered = app.find('[data-output]').textContent;
    await new Promise(resolve => setTimeout(resolve, 80));
    assert.equal(app.find('[data-output]').textContent, rendered);
    assert.equal(app.find('[data-skip]').hidden, true);
    app.command('H');
    app.dom.window.dispatchEvent(new app.dom.window.Event('pagehide'));
    assert.match(app.find('[data-output]').textContent, /Read the original post below/);
    assert.equal(app.find('[data-skip]').hidden, true);
  } finally { app.dom.window.close(); }
});

test('built exhibit preserves evidence distinctions, image credits, and human / machine discovery', () => {
  const html = read('dist/atari-bbs/index.html');
  const data = JSON.parse(read('dist/atari-bbs.json'));
  assert.equal(data.recreation.originalSoftwareRecovered, false);
  assert.equal(data.recreation.networkConnection, false);
  assert.ok(data.sources.some(source => source.note.includes('discrepancy remains unresolved')));
  const dom = new JSDOM(html);
  assert.equal(dom.window.document.querySelectorAll('h1').length, 1);
  assert.match(html, /CC BY-SA 3.0/);
  assert.match(html, /CC0/);
  assert.match(html, /Photograph date unconfirmed/);
  assert.match(html, /Apple Death Star list/);
  assert.match(html, /data-pc-isolated="true"/);
  assert.doesNotMatch(html, /src="\/js\/pc-layers.js"/, 'sitewide L shortcut must not intercept the race');
  for (const path of ['dist/index.html', 'dist/apps/index.html', 'dist/agents.json', 'dist/sitemap-discovery.xml', 'dist/llms.txt', 'dist/llms-full.txt']) {
    assert.ok(read(path).includes('/atari-bbs'), `${path} must expose the museum`);
  }
  dom.window.close();
});

test('museum shorthand redirects before the directory rewrite and preserves queries', async () => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
    for (const path of ['/atari', '/atari/', '/bbs', '/bbs/']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await onRequest({
          request: new Request(`https://pointcast.xyz${path}?from=museum`, { method }),
          env: {}, next: () => { throw new Error('alias must redirect before next'); }, waitUntil() {},
        });
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('location'), 'https://pointcast.xyz/atari-bbs/?from=museum');
      }
    }
  } finally { await server.close(); }
});
