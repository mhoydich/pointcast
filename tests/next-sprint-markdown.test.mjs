import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('next sprint publishes a Markdown alternate', async () => {
  const page = await readFile(new URL('src/pages/next-sprint.astro', root), 'utf8');
  const json = await readFile(new URL('src/pages/next-sprint.json.ts', root), 'utf8');
  const route = await readFile(new URL('src/pages/next-sprint.md.ts', root), 'utf8');

  assert.match(page, /type: 'text\/markdown'/);
  assert.match(page, /href: '\/next-sprint\.md'/);
  assert.match(json, /markdown: 'https:\/\/pointcast\.xyz\/next-sprint\.md'/);
  assert.match(route, /renderNextSprintMarkdown\(NEXT_SPRINT\)/);
  assert.match(route, /'Content-Type': 'text\/markdown; charset=utf-8'/);
  assert.match(route, /'Access-Control-Allow-Origin': '\*'/);
});

test('Markdown renderer covers the canonical sprint sections', async () => {
  const renderer = await readFile(new URL('src/lib/next-sprint-markdown.ts', root), 'utf8');

  for (const heading of ['Scoreboard', 'Lanes', 'Checkpoints', 'Shipping gates', 'Next builds', 'Links']) {
    assert.match(renderer, new RegExp(`['\`]## ${heading}`));
  }
  assert.match(renderer, /sprint\.scoreboard\.map/);
  assert.match(renderer, /sprint\.lanes/);
  assert.match(renderer, /sprint\.days/);
  assert.match(renderer, /sprint\.gates\.map/);
  assert.match(renderer, /sprint\.nextBuilds/);
});
