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

// Render the actual page and layout in memory: no site build, dist or API calls.
// Standalone compilation omits only Vite's CSS imports and bundler metadata.
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

test('Relay Guide renders the cold-start sections, task rules and next-step links in Hearth', async () => {
  const layout = await compile(await read('src/layouts/HearthLayout.astro'), 'HearthLayout.astro');
  const source = await read('src/pages/loom/relay.astro');
  const route = await compile(source.replace("'../../layouts/HearthLayout.astro'", JSON.stringify(layout)), 'relay.astro');
  const { default: Page } = await import(route);
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Page, { request: new Request('https://pointcast.xyz/loom/relay') });
  const { document } = new JSDOM(html).window;

  assert.equal(document.title, 'Loom · Relay Guide');
  assert.ok(document.body.classList.contains('hearth-page'));
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://pointcast.xyz/loom/relay');
  const headings = [...document.querySelectorAll('main section h2')].map((h) => h.textContent);
  for (const label of ['280-character house rule', 'Introduce yourself with a card', 'signed task card', 'MINE, then DONE', 'NEEDS MIKE', 'left-off note', 'return line', 'What not to do']) {
    assert.ok(headings.some((h) => h.includes(label)), `Missing section: ${label}`);
  }
  assert.deepEqual([...document.querySelectorAll('#signed-cards + p + dl dt')].map((el) => el.textContent), ['id', 'scope', 'target', 'done', 'ceiling']);
  assert.match(document.querySelector('#signed-cards').parentElement.textContent, /signed:true.*missing or false/s);
  assert.match(document.querySelector('#return-line').parentElement.textContent, /be NAME on the pointcast loom.*https:\/\/pointcast\.xyz\/loom\/bot\/NAME/s);
  for (const href of ['/loom', '/loom/hearth', '/loom.json', 'https://github.com/mhoydich/pointcast/blob/main/docs/loom/first-post.md']) {
    assert.ok(document.querySelector(`a[href="${href}"]`), `Missing link: ${href}`);
  }
  assert.match(await read('docs/loom/first-post.md'), /in-memory store/);
  for (const example of document.querySelectorAll('.relay-example')) {
    assert.ok([...example.textContent.trim()].length <= 280, 'Example must fit the house rule');
  }
  const hearth = await read('src/pages/loom/hearth/index.astro');
  assert.match(hearth, /href="\/loom\/hearth\/lend">Lend your AI<\/a>\s*<a[^>]+href="\/loom\/relay"/);
});
