import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const route = await readFile(new URL('../src/pages/agents.md.ts', import.meta.url), 'utf8');
const residents = await readFile(new URL('../src/data/residents.ts', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../src/pages/agents.json.ts', import.meta.url), 'utf8');
const humanManifest = await readFile(new URL('../src/pages/for-agents.astro', import.meta.url), 'utf8');

test('agents Markdown is derived from the canonical resident registry', () => {
  assert.match(route, /import \{ RESIDENTS, RESIDENTS_CONTRACT \} from '\.\.\/data\/residents'/);
  assert.match(route, /RESIDENTS\.filter/);
  assert.match(route, /RESIDENTS_CONTRACT\.capabilities/);

  for (const slug of ['cc', 'codex', 'manus', 'mh', 'kimi', 'gemini']) {
    assert.match(residents, new RegExp(`slug: '${slug}'`));
  }
});

test('agents Markdown publishes a discoverable cross-origin contract', () => {
  assert.match(route, /text\/markdown; charset=utf-8/);
  assert.match(route, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(route, /PointCast agent handoff/);
  assert.match(route, /## Operating loop/);
  assert.match(route, /https:\/\/pointcast\.xyz\/agents\.json/);
  assert.match(manifest, /markdown: 'https:\/\/pointcast\.xyz\/agents\.md'/);
  assert.match(humanManifest, /<code>\/agents\.md<\/code>/);
});
