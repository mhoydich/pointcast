import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { scan } from '../scripts/seo-scan.mjs';

const allowlist = JSON.parse(readFileSync(new URL('../docs/seo/onpage-allowlist.json', import.meta.url), 'utf8')).exceptions;

test('rendered HTML meets PointCast on-page SEO invariants', (t) => {
  if (!existsSync(new URL('../dist', import.meta.url))) {
    t.diagnostic('Skipping SEO render audit: dist/ is absent. Run npm run build:bare first.');
    return;
  }
  const result = scan();
  const unexpected = Object.entries(result.defects).flatMap(([kind, examples]) =>
    examples.filter(({ path }) => !allowlist?.[kind]?.includes(path)).map(({ path, detail }) => `${kind}: ${path}${detail ? ` (${detail})` : ''}`),
  );
  assert.deepEqual(unexpected, [], `On-page SEO defects remain:\n${unexpected.slice(0, 50).join('\n')}`);
});
