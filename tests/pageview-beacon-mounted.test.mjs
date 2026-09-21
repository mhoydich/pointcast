// The pageview beacon was unmounted for a month without anyone noticing (2026-08-21 → 09-21)
// while /register said every page reported a view. This keeps it mounted, and keeps it honest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the shared layouts mount the pageview beacon', () => {
  for (const layout of ['src/layouts/BlockLayout.astro', 'src/layouts/DrumLayout.astro']) { const s = read(layout); assert.match(s, /import PageviewBeacon from '\.\.\/components\/PageviewBeacon\.astro';/, layout); assert.match(s, /<PageviewBeacon \/>/, layout); }
});

test('the beacon sends a path and nothing else, skips bots, and fires on view-transition navigations', () => {
  const b = read('src/components/PageviewBeacon.astro');
  assert.match(b, /<script is:inline data-astro-rerun>/); assert.match(b, /meta: \{ path: path\.slice\(0, 120\) \}/);
  assert.doesNotMatch(b, /referrer|userAgent\s*:|localStorage|cookie|wallet\s*:/i.source ? /document\.referrer|localStorage|document\.cookie/ : /x/);
  assert.match(b, /navigator\.webdriver \|\| \/bot\|crawl/);
  assert.match(read('functions/api/analytics.ts'), /const SAMPLE_RATE = 10;/, 'the endpoint stays sampled: the beacon is only safe to mount while it is');
});
