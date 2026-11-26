import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transform } from '@astrojs/compiler';
import { experimental_AstroContainer } from 'astro/container';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { esc, personHref } from '../src/lib/loom/hearth.mjs';

const require = createRequire(import.meta.url);
const runtime = pathToFileURL(require.resolve('astro/runtime/server/index.js')).href;
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('src/pages/loom/ledger.astro');
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm, '');

// Render the real Astro page and Hearth layout with copied dependencies, in memory.
async function compile(source, filename) {
  const compiled = await transform(source, {
    filename,
    internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
    resultScopedSlot: true,
  });
  assert.deepEqual(compiled.diagnostics.filter(diagnostic => diagnostic.severity === 1), []);
  const emitted = compiled.code
    .replace(/,\s*createMetadata as \$\$createMetadata/, '')
    .replace(/['"]astro\/runtime\/server\/index\.js['"]/g, JSON.stringify(runtime));
  const code = ts.transpileModule(emitted, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    transformers: { before: [() => sourceFile => ts.factory.updateSourceFile(sourceFile, sourceFile.statements.filter(statement => {
      if (ts.isImportDeclaration(statement) && /\.css$|\?astro&type=style&/.test(statement.moduleSpecifier.text)) return false;
      if (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration =>
        ts.isIdentifier(declaration.name) && declaration.name.text === '$$metadata')) return false;
      return true;
    }))] },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}

const rendered = (async () => {
  const layout = await compile(await read('src/layouts/HearthLayout.astro'), 'HearthLayout.astro');
  const route = await compile(source.replace("'../../layouts/HearthLayout.astro'", JSON.stringify(layout)), 'ledger.astro');
  const { default: Page } = await import(route);
  const container = await experimental_AstroContainer.create();
  return container.renderToString(Page, { request: new Request('https://pointcast.xyz/loom/ledger') });
})();

const NOW = Date.parse('2026-11-25T20:00:00Z');
const fixture = () => ({
  rows: [
    { handle: 'mike', name: 'Mike Hoydich', kind: 'human', lent: {
      tokens: 125000, approximate: true,
      tokenSource: { room: '#efficiency', key: 'efficiency-key', id: 'token-report', at: new Date(NOW).toISOString() },
      closedCards: 2, cardSources: [{ room: '#ledger', key: 'ledger-key', id: 'closed-card', task: 'OFF-1' }],
    } },
    { handle: 'sid', name: 'Sid', kind: 'agent', lent: {
      closedCards: 1, cardSources: [{ room: '#officenoun-tasks', id: 'task-only', task: 'OFF-2' }],
    } },
    { handle: 'jane', name: 'Jane', kind: 'human', lent: { tokens: 45000, approximate: false } },
  ],
  asOf: NOW, readRooms: 3, incomplete: false, unavailable: [], trimmed: [],
});

async function page(t, { ledger = fixture(), reader } = {}) {
  const dom = new JSDOM(await rendered, { url: 'https://pointcast.xyz/loom/ledger', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const calls = [];
  Object.assign(dom.window, {
    esc, personHref,
    readHearthLedger: async (...args) => { calls.push(args); return reader ? reader() : ledger; },
  });
  dom.window.eval(script);
  await new Promise(resolve => setTimeout(resolve, 0));
  return { document: dom.window.document, calls };
}

test('the ledger route renders its Hearth shell, canonical URL and report sections', async t => {
  const dom = new JSDOM(await rendered);
  t.after(() => dom.window.close());
  const { document } = dom.window;
  assert.equal(document.title, 'Loom · Ledger');
  assert.ok(document.body.classList.contains('hearth-page'));
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://pointcast.xyz/loom/ledger');
  assert.equal(document.querySelector('main h1').textContent, 'The ledger');
  assert.deepEqual([...document.querySelectorAll('main h2')].map(node => node.textContent), ['By handle', 'About these reports']);
  assert.ok(document.querySelector('a[aria-label="Back to the hearth"]'));
  assert.equal(document.querySelector('.hearth-foot a').getAttribute('href'), '/loom/hearth/');
  assert.match(document.querySelector('main').textContent, /People include bots that name them as operator/);
  assert.match(document.querySelector('main').textContent, /not a lifetime total/);
  assert.match(document.querySelector('main').textContent, /room history may be trimmed/);
});

test('ledger rows keep their contribution order, link people and display positive evidence with approximation', async t => {
  const { document, calls } = await page(t);
  assert.equal(calls.length, 1);
  assert.equal(document.querySelector('#ledger').getAttribute('aria-busy'), 'false');
  assert.equal(document.querySelector('#contributions').hidden, false);
  assert.equal(document.querySelector('#empty').hidden, true);
  assert.equal(document.querySelector('#read-status').textContent, '');
  assert.equal(document.querySelector('#retry').hidden, true);
  const rows = [...document.querySelectorAll('#ledger-rows > li')];
  assert.deepEqual(rows.map(row => row.querySelector('h3').textContent), ['@mike', '@sid', '@jane']);
  assert.deepEqual(rows.map(row => row.querySelector('.hearth-tag').textContent), ['Person', 'Bot', 'Person']);
  assert.equal(rows[0].querySelector('h3 a').getAttribute('href'), '/loom/hearth/person?name=mike');
  assert.equal(rows[1].querySelector('h3 a'), null, 'a bot is not linked to a person card');
  assert.equal(rows[2].querySelector('h3 a').getAttribute('href'), '/loom/hearth/person?name=jane');
  assert.match(rows[0].textContent, /Mike Hoydich/);
  assert.match(rows[0].textContent, /2 closed cards/);
  assert.match(rows[0].textContent, /Latest report: about 125,000 tokens/);
  assert.equal(rows[0].querySelector('a[href="/loom?to=loom%3Aefficiency-key%23token-report"]').textContent, 'about 125,000 tokens');
  assert.equal(rows[0].querySelector('a[href="/loom?to=loom%3Aledger-key%23closed-card"]').textContent, '2 closed cards');
  assert.equal(rows[1].querySelector('a[href="/loom?to=%23officenoun-tasks#task-only"]').textContent, '1 closed card');
  assert.doesNotMatch(rows[1].textContent, /tokens/);
  assert.match(rows[2].textContent, /Latest report: 45,000 tokens/);
  assert.doesNotMatch(rows[2].textContent, /about|closed cards/);
});

test('an outsider with only a signed-card close appears with a link to their DONE post', async t => {
  const ledger = fixture();
  ledger.rows = [{ handle: 'outsider', name: 'Outside contributor', kind: 'human', lent: {
    signedClosedCards: 1,
    signedCardSources: [{ room: '#loom-v2', id: 'outsider-done', task: 'LV2-1' }],
  } }];
  const { document } = await page(t, { ledger });
  const rows = [...document.querySelectorAll('#ledger-rows > li')];
  assert.equal(rows.length, 1);
  assert.equal(document.querySelector('#empty').hidden, true);
  assert.equal(rows[0].querySelector('h3').textContent, '@outsider');
  assert.equal(rows[0].querySelector('h3 a').getAttribute('href'), '/loom/hearth/person?name=outsider');
  assert.equal(rows[0].querySelector('.hearth-body').textContent.trim(), '1 signed card closed');
  assert.equal(rows[0].querySelector('.hearth-body a').getAttribute('href'), '/loom?to=%23loom-v2#outsider-done');
});

test('signed-card closes keep their own plural count and DONE link alongside legacy cards and tokens', async t => {
  const ledger = fixture();
  const key = 'room"><svg onload=alert(1)>';
  const id = 'done&"';
  ledger.rows = [{ ...ledger.rows[0], lent: { ...ledger.rows[0].lent,
    signedClosedCards: 2,
    signedCardSources: [
      { room: '#loom-v2', key, id, task: 'LV2-1' },
      { room: '#loom-v2', key: 'loom-v2-key', id: 'other-done', task: 'LV2-2' },
    ],
  } }];
  const { document } = await page(t, { ledger });
  const body = document.querySelector('#ledger-rows .hearth-body');
  const links = [...body.querySelectorAll('a')];
  assert.equal(links.length, 3);
  const signed = links.find(link => link.textContent === '2 signed cards closed');
  assert.ok(signed);
  assert.equal(signed.getAttribute('href'), '/loom?to=' + encodeURIComponent('loom:' + key + '#' + id));
  assert.equal(links.find(link => link.textContent === '2 closed cards').getAttribute('href'),
    '/loom?to=loom%3Aledger-key%23closed-card');
  assert.equal(links.find(link => link.textContent === 'about 125,000 tokens').getAttribute('href'),
    '/loom?to=loom%3Aefficiency-key%23token-report');
  assert.match(body.textContent, /Latest report: about 125,000 tokens/);
  assert.equal(body.querySelectorAll('svg, [onload]').length, 0);
});

test('rows without positive figures are absent and no zero counters are rendered', async t => {
  const ledger = fixture();
  ledger.rows.push(
    { handle: 'zero', name: 'No reported contributions', kind: 'human', lent: { tokens: 0, closedCards: 0, signedClosedCards: 0 } },
    { handle: 'missing', name: 'No evidence', kind: 'agent', lent: null },
  );
  const { document } = await page(t, { ledger });
  assert.equal(document.querySelectorAll('#ledger-rows > li').length, 3);
  assert.doesNotMatch(document.querySelector('#ledger-rows').textContent, /@zero|@missing|\b0\b/);
});

test('an empty ledger displays a plain empty state without contribution rows', async t => {
  const { document } = await page(t, { ledger: { ...fixture(), rows: [] } });
  assert.equal(document.querySelectorAll('#ledger-rows > li').length, 0);
  assert.equal(document.querySelector('#contributions').hidden, false);
  assert.equal(document.querySelector('#empty').hidden, false);
  assert.match(document.querySelector('#empty').textContent, /No contributions have been reported/);
  assert.doesNotMatch(document.querySelector('#contributions').textContent, /\b0\b/);
});

test('trimmed history warns about missing contributions and unavailable rooms expose retry', async t => {
  const trimmed = await page(t, { ledger: { ...fixture(), incomplete: true, trimmed: ['#efficiency'] } });
  assert.match(trimmed.document.querySelector('#read-status').textContent, /history could not be read/);
  assert.match(trimmed.document.querySelector('#read-status').textContent, /missing contributions/);
  assert.equal(trimmed.document.querySelectorAll('#ledger-rows > li').length, 3);
  assert.equal(trimmed.document.querySelector('#retry').hidden, true, 'trimmed retained history cannot be retried into completeness');
  const unavailable = await page(t, { ledger: { ...fixture(), incomplete: true, unavailable: ['#ledger'] } });
  assert.equal(unavailable.document.querySelector('#retry').hidden, false);
});

test('a failed ledger read exposes retry and a successful retry replaces the failure state', async t => {
  let fail = true;
  const { document, calls } = await page(t, { reader: () => {
    if (fail) throw new Error('offline');
    return fixture();
  } });
  assert.match(document.querySelector('#read-status').textContent, /couldn’t read this ledger/);
  assert.equal(document.querySelector('#retry').hidden, false);
  assert.equal(document.querySelector('#ledger').getAttribute('aria-busy'), 'false');
  assert.equal(document.querySelectorAll('#ledger-rows > li').length, 0);
  fail = false;
  document.querySelector('#retry').click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(calls.length, 2);
  assert.equal(document.querySelector('#read-status').textContent, '');
  assert.equal(document.querySelector('#retry').hidden, true);
  assert.equal(document.querySelectorAll('#ledger-rows > li').length, 3);
});

test('hostile names and handles stay text while person and source URLs remain encoded', async t => {
  const hostile = '<img src=x onerror="alert(1)">';
  const handle = 'mike & co"><script>alert(1)</script>';
  const ledger = fixture();
  ledger.rows = [
    { ...ledger.rows[0], name: hostile, handle,
      lent: { tokens: 1000, tokenSource: { room: '#efficiency', key: 'key"><svg onload=alert(1)>', id: 'id&"' } } },
    { ...ledger.rows[1], name: hostile, handle: hostile },
  ];
  const { document } = await page(t, { ledger });
  const rows = [...document.querySelectorAll('#ledger-rows > li')];
  assert.equal(rows[0].querySelector('h3').textContent, '@' + handle);
  assert.equal(rows[0].querySelector('h3 a').getAttribute('href'), '/loom/hearth/person?name=' + encodeURIComponent(handle));
  assert.equal(rows[0].querySelector('.hearth-quiet').textContent, hostile);
  assert.equal(rows[1].querySelector('h3').textContent, '@' + hostile);
  assert.equal(rows[1].querySelector('h3 a'), null);
  assert.equal(document.querySelectorAll('#ledger-rows img, #ledger-rows script, #ledger-rows svg, #ledger-rows [onerror], #ledger-rows [onload]').length, 0);
  assert.equal(rows[0].querySelector('.hearth-body a').getAttribute('href'),
    '/loom?to=' + encodeURIComponent('loom:key"><svg onload=alert(1)>#id&"'));
});
