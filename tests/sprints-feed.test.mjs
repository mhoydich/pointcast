import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync(new URL('../src/pages/sprints.astro', import.meta.url), 'utf8');
const endpoint = fs.readFileSync(new URL('../src/pages/sprints.xml.ts', import.meta.url), 'utf8');
const jsonEndpoint = fs.readFileSync(new URL('../src/pages/sprints.json.ts', import.meta.url), 'utf8');

test('sprint log advertises its RSS companion', () => {
  assert.match(page, /application\/rss\+xml/);
  assert.match(page, /href: '\/sprints\.xml'/);
  assert.match(page, /href="\/sprints\.xml"/);
});

test('RSS feed is derived from canonical sprint recaps', () => {
  assert.match(endpoint, /readAllRecaps\(\)/);
  assert.match(endpoint, /link: `\/sprints#\$\{recap\.sprintId\}`/);
  assert.match(endpoint, /Number\.isNaN\(publishedAt\.getTime\(\)\)/);
});

test('JSON contract links the RSS feed', () => {
  assert.match(jsonEndpoint, /rss: 'https:\/\/pointcast\.xyz\/sprints\.xml'/);
});
