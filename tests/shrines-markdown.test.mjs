import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const markdownRoute = await readFile(new URL('../src/pages/shrines.md.ts', import.meta.url), 'utf8');
const htmlPage = await readFile(new URL('../src/pages/shrines.astro', import.meta.url), 'utf8');
const jsonRoute = await readFile(new URL('../src/pages/shrines.json.ts', import.meta.url), 'utf8');

test('shrine Markdown is derived from the canonical manifest', () => {
  assert.match(markdownRoute, /SHRINE_SETS/);
  assert.match(markdownRoute, /UNFURL_SHRINES/);
  assert.match(markdownRoute, /shrine\.audience/);
  assert.match(markdownRoute, /shrine\.ritual/);
  assert.match(markdownRoute, /shrine\.proof\.map\(absoluteUrl\)/);
  assert.match(markdownRoute, /Content-Type': 'text\/markdown; charset=utf-8'/);
  assert.match(markdownRoute, /'Access-Control-Allow-Origin': '\*'/);
});

test('human and JSON shrine surfaces advertise Markdown', () => {
  assert.match(htmlPage, /type: 'text\/markdown', href: '\/shrines\.md'/);
  assert.match(htmlPage, /href="\/shrines\.md"/);
  assert.match(jsonRoute, /markdown: absoluteUrl\('\/shrines\.md'\)/);
  assert.match(jsonRoute, /rel="alternate"; type="text\/markdown"/);
});
