import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('classic composer tells a rate-limited sender how long to wait', () => {
  const source = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
  const block = source.match(/if \(!data\.ok\) \{\n        const wait[\s\S]+?\n      \}/)[0];
  const submit = new Function('data', 'status', block);
  const results = [];
  const status = (...args) => results.push(args);
  submit({ ok: false, error: 'rate_limited', retryAfterSec: 24 }, status);
  submit({ ok: false, error: 'rate_limited', retryAfterSec: 0.5 }, status);
  submit({ ok: false, error: 'rate_limited' }, status);
  assert.deepEqual(results, [
    ['Posting limit reached. Try again in 24 seconds.', true],
    ['Posting limit reached. Try again in 1 second.', true],
    ['Declined: rate limited.', true],
  ]);
});
