import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('El Segundo remains an anchored city guide, not a company roster', async () => {
  const page = await readFile(new URL('../src/pages/el-segundo.astro', import.meta.url), 'utf8');
  assert.match(page, /const place = getPlace\('el-segundo'\)!/);
  assert.match(page, /We deliberately do not keep a company roster on this page\./);
  assert.doesNotMatch(page, /const COMPAN(?:Y|IES)|companyRoster/i);
});

test('the built El Segundo and agent readiness routes exist', { skip: !existsSync(new URL('../dist/el-segundo/index.html', import.meta.url)) && 'run npm run build:bare first' }, async () => {
  for (const path of ['../dist/el-segundo/index.html', '../dist/agent-readiness/index.html']) {
    const html = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(html, /<title>/);
  }
});
