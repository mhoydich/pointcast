import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('known Visit Noun detail routes survive a rate-limited TzKT build', async () => {
  const [page, ids] = await Promise.all([
    readFile(new URL('src/pages/token/[collection]/[tokenId].astro', root), 'utf8'),
    readFile(new URL('src/data/visit-noun-token-ids.ts', root), 'utf8'),
  ]);

  for (const id of [
    '1', '42', '88', '99', '137', '174', '205', '247', '417',
    '420', '557', '777', '808', '945', '1020', '1086', '1111',
  ]) {
    assert.match(ids, new RegExp(`'${id}'`));
  }

  assert.match(ids, /export const KNOWN_VISIT_TOKEN_IDS = \[/);
  assert.match(page, /import \{ KNOWN_VISIT_TOKEN_IDS \}/);
  assert.equal(
    page.match(/new Set\(KNOWN_VISIT_TOKEN_IDS\)/g)?.length,
    2,
    'both the helper and getStaticPaths should use the deterministic fallback',
  );
});
