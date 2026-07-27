import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const route = await readFile(new URL('../src/pages/join.md.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/pages/join.astro', import.meta.url), 'utf8');
const json = await readFile(new URL('../src/pages/join.json.ts', import.meta.url), 'utf8');

test('join markdown derives its handoff from the canonical system', () => {
  assert.match(route, /import \{ JOIN_SYSTEM \}/);
  for (const section of ['Operating loop', 'Claimable tasks', 'Projects', 'Claim protocol']) {
    assert.match(route, new RegExp(section));
  }
  assert.match(route, /text\/markdown; charset=utf-8/);
  assert.match(route, /Access-Control-Allow-Origin/);
});

test('join HTML and JSON advertise the markdown handoff', () => {
  assert.match(page, /type: 'text\/markdown', href: '\/join\.md'/);
  assert.match(page, /href="\/join\.md"/);
  assert.match(json, /markdown: 'https:\/\/pointcast\.xyz\/join\.md'/);
});
