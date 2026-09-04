import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const verificationFile = 'googlef8cd34fe0ae765d9.html';

test('Google Search Console verification file ships and is crawlable', (t) => {
  if (!existsSync('dist')) return t.skip('dist is absent; run npm run build:bare first');
  assert.ok(existsSync(`dist/${verificationFile}`), `dist/${verificationFile} is missing`);
  assert.doesNotMatch(readFileSync('dist/robots.txt', 'utf8'), new RegExp(`^Disallow:\\s*/${verificationFile.replace('.', '\\.')}$`, 'mi'));
  assert.match(readFileSync('functions/_middleware.ts', 'utf8'), /STATIC_ASSET_REGEX = \/\\\.\([^)]*\bhtml\b[^)]*\)/);
  assert.ok(existsSync(`functions/${verificationFile}.ts`), 'Pages Function must bypass the platform .html redirect');
});
