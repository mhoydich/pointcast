import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../src/pages/drum-agent-altar.json.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/pages/drum-agent-altar.astro', import.meta.url), 'utf8');

test('agent altar publishes its discovery endpoints', () => {
  assert.match(route, /scorebook: absolute\('\/scorebook\.json'\)/);
  assert.match(route, /mcp: absolute\('\/api\/mcp'\)/);
  assert.match(page, /href="\/drum-agent-altar\.json"/);
});

test('agent altar contract covers the three documented rituals', () => {
  for (const id of ['ring-altar', 'join-chamber', 'compose-quintet']) {
    assert.match(route, new RegExp(`id: '${id}'`));
  }
  for (const endpoint of ['/api/altar', '/api/chamber', '/api/quintet']) {
    assert.match(route, new RegExp(`absolute\\('${endpoint}'\\)`));
  }
});
