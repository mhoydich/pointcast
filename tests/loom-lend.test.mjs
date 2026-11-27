import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transform } from '@astrojs/compiler';
import { experimental_AstroContainer } from 'astro/container';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const runtime = pathToFileURL(require.resolve('astro/runtime/server/index.js')).href;
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

// Like the relay guide test, render real Astro in memory without a site build.
async function compile(source, filename) {
  const compiled = await transform(source, {
    filename,
    internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
    resultScopedSlot: true,
  });
  assert.deepEqual(compiled.diagnostics.filter((d) => d.severity === 1), []);
  const emitted = compiled.code
    .replace(/,\s*createMetadata as \$\$createMetadata/, '')
    .replace(/['"]astro\/runtime\/server\/index\.js['"]/g, JSON.stringify(runtime));
  const code = ts.transpileModule(emitted, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    transformers: { before: [() => (sf) => ts.factory.updateSourceFile(sf, sf.statements.filter((s) => {
      if (ts.isImportDeclaration(s) && /\.css$|\?astro&type=style&/.test(s.moduleSpecifier.text)) return false;
      if (ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === '$$metadata')) return false;
      return true;
    }))] },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}

async function renderLend() {
  const layout = await compile(await read('src/layouts/HearthLayout.astro'), 'HearthLayout.astro');
  const source = await read('src/pages/loom/hearth/lend.astro');
  const route = await compile(source.replace("'../../../layouts/HearthLayout.astro'", JSON.stringify(layout)), 'lend.astro');
  const { default: Page } = await import(route);
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Page, { request: new Request('https://pointcast.xyz/loom/hearth/lend') });
  return new JSDOM(html).window.document;
}

test('Lend your AI renders three short ways in, each with exactly one usable action', async () => {
  const document = await renderLend();
  assert.equal(document.title, 'Loom · Lend your AI');
  assert.ok(document.body.classList.contains('hearth-page'));
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://pointcast.xyz/loom/hearth/lend');
  assert.equal(document.querySelector('h1').textContent, 'Lend your AI.');
  const ways = [...document.querySelectorAll('main section')];
  assert.equal(ways.length, 3);
  const expected = [
    ['From your chat app', '/connectors#client-title', 'Set up the connector'],
    ['On your own machine', '/loom/hearth/room?to=%23loom-v2', 'Follow runner progress'],
    ['Your contributions', 'https://github.com/mhoydich/pointcast/pull/1927', 'See ledger progress'],
  ];
  ways.forEach((way, index) => {
    const [heading, href, label] = expected[index];
    assert.equal(way.querySelector('h2').textContent, heading);
    assert.equal(document.getElementById(way.getAttribute('aria-labelledby')), way.querySelector('h2'));
    const actions = way.querySelectorAll('a, button, input, select, textarea');
    assert.equal(actions.length, 1, `${heading} has one next step`);
    assert.equal(actions[0].getAttribute('href'), href);
    assert.equal(actions[0].textContent, label);
    assert.equal(actions[0].getAttribute('aria-disabled'), null);
  });
  assert.match(ways[0].textContent, /Claude, ChatGPT or Grok.*where connectors are supported/s);
  assert.match(ways[1].textContent, /signed Loom tasks.*coming soon/s);
  assert.match(ways[2].textContent, /finished tasks.*ledger.*Coming soon/s);
  assert.equal(document.querySelector('a[href="/loom/ledger"]'), null, 'do not link the unshipped ledger');
  assert.equal(document.querySelector('a[href="/connect"]'), null, 'site sign-in is not the connector guide');
  assert.match(await read('src/pages/connectors.astro'), /id="client-title"/);
  assert.match(await read('src/pages/connectors.json.ts'), /canonical:.*\/connectors/);
  assert.match(await read('src/pages/loom/hearth/room.astro'), /HearthLayout/);
});

test('Lend your AI keeps the relay guide and keys rule visible without counters or promises of rewards', async () => {
  const document = await renderLend();
  const relay = document.querySelector('main a[href="/loom/relay"]');
  assert.equal(relay.textContent, 'Read the relay guide first');
  assert.ok(relay.compareDocumentPosition(document.querySelector('main section')) & 4, 'guide comes before the choices');
  assert.equal(document.querySelector('footer').textContent, 'One rule: the Loom never holds anyone’s keys or sign-ins.');
  const visibleText = [...document.querySelectorAll('header, main, footer')].map((el) => el.textContent).join(' ');
  assert.doesNotMatch(visibleText, /\b\d+\b|\b(stamps?|money|tokens?|counters?)\b/i);
  assert.ok(visibleText.trim().split(/\s+/).length <= 125, 'keep the phone introduction short');
  assert.equal(document.querySelectorAll('script, pre, [hidden], [data-copy]').length, 0, 'all next steps work without scripts or hidden instructions');
});
