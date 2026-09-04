import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { normalizeGeneratedSeo, countSvgTitles } from '../src/lib/seo-build.mjs';
import { scan } from '../scripts/seo-scan.mjs';

const dist = new URL('../dist', import.meta.url);
const allowlist = JSON.parse(readFileSync(new URL('../docs/seo/onpage-allowlist.json', import.meta.url), 'utf8')).exceptions;

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}

function copyFixture(count = 50) {
  const source = new URL('../dist', import.meta.url);
  const temp = mkdtempSync(join(tmpdir(), 'pointcast-seo-'));
  const files = htmlFiles(source.pathname);
  const required = ['index.html', 'timeline/index.html', 'town/index.html', '25/2029/index.html']
    .map((relative) => join(source.pathname, relative));
  const selected = [...new Set([...required.filter(existsSync), ...files])].slice(0, count);
  for (const file of selected) {
    const target = join(temp, file.slice(source.pathname.length + 1));
    mkdirSync(dirname(target), { recursive: true });
    cpSync(file, target, { recursive: true });
  }
  return temp;
}

test('rendered HTML meets PointCast on-page SEO invariants', (t) => {
  if (!existsSync(dist)) {
    const reason = 'dist/ is absent. Run npm run build:bare && npm test to exercise the rendered-site audit.';
    console.warn(`[seo-test] SKIPPED: ${reason}`);
    t.diagnostic(reason);
    return;
  }
  const result = scan();
  const unexpected = Object.entries(result.defects).flatMap(([kind, examples]) =>
    examples.filter(({ path }) => !allowlist?.[kind]?.includes(path)).map(({ path, detail }) => `${kind}: ${path}${detail ? ` (${detail})` : ''}`),
  );
  assert.deepEqual(unexpected, [], `On-page SEO defects remain:\n${unexpected.slice(0, 50).join('\n')}`);
});

test('normalizer is idempotent and preserves inline SVG titles', (t) => {
  if (!existsSync(dist)) { t.diagnostic('Skipped: dist/ is absent; run npm run build:bare first.'); return; }
  const fixture = copyFixture();
  try {
    const beforeSvg = htmlFiles(fixture).reduce((total, file) => total + countSvgTitles(readFileSync(file, 'utf8')), 0);
    normalizeGeneratedSeo(fixture, { info() {} });
    const afterFirst = new Map(htmlFiles(fixture).map((file) => [file.slice(fixture.length), readFileSync(file, 'utf8')]));
    const afterSvg = [...afterFirst.values()].reduce((total, html) => total + countSvgTitles(html), 0);
    normalizeGeneratedSeo(fixture, { info() {} });
    const afterSecond = new Map(htmlFiles(fixture).map((file) => [file.slice(fixture.length), readFileSync(file, 'utf8')]));
    assert.ok(beforeSvg > 0, 'fixture did not include any inline SVG <title> labels');
    assert.equal(afterSvg, beforeSvg, 'inline SVG <title> labels changed during normalization');
    assert.deepEqual(afterSecond, afterFirst, 'normalizing the same 50 pages twice changed bytes');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('identity H1 hooks survive the rendered SEO pass', (t) => {
  if (!existsSync(dist)) { t.diagnostic('Skipped: dist/ is absent; run npm run build:bare first.'); return; }
  const me = new JSDOM(readFileSync(new URL('../dist/me/index.html', import.meta.url), 'utf8'));
  const profile = new JSDOM(readFileSync(new URL('../dist/profile/index.html', import.meta.url), 'utf8'));
  assert.ok(me.window.document.querySelector('[data-me-name]'));
  assert.ok(profile.window.document.querySelector('#identity-name'));
});
