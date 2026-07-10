import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/shrines.json.ts', import.meta.url), 'utf8');

test('shrine contract publishes summary counts and navigation', () => {
  assert.match(source, /counts:\s*\{[\s\S]*sets: SHRINE_SETS\.length,[\s\S]*shrines: UNFURL_SHRINES\.length/);
  assert.match(source, /gallery: absoluteUrl\('\/shrines'\)/);
  assert.match(source, /crawl: absoluteUrl\('\/shrine-crawl'\)/);
  assert.match(source, /manifest: absoluteUrl\('\/unfurls\.json'\)/);
});

test('shrine contract exposes a compact flat crawl index', () => {
  assert.match(source, /index: UNFURL_SHRINES\.map/);
  assert.match(source, /set: shrineSetBySlug\.get\(shrine\.slug\) \?\? null/);
  assert.match(source, /miniUrl: absoluteUrl\(shrine\.miniPath\)/);
});
