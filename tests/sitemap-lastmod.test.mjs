import test from 'node:test';
import assert from 'node:assert/strict';
import { lastmodForPath } from '../src/lib/sitemap-lastmod.mjs';

test('lastmodForPath maps a page path to its source date', () => {
  const dates = new Map([['src/pages/about.astro', '2026-10-01T00:00:00Z']]);
  assert.equal(lastmodForPath('/about', dates)?.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(lastmodForPath('/nope', dates), undefined);
});

test('lastmodForPath returns undefined with no history (shallow clone)', () => {
  assert.equal(lastmodForPath('/about', new Map()), undefined);
});
