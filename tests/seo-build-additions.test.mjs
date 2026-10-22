import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { normalizeGeneratedSeo } from '../src/lib/seo-build.mjs';
import { listPublicIndexPages } from '../src/lib/public-pages.mjs';
import { isNoindexPath } from '../src/lib/seo-rules.mjs';

const quiet = { info() {}, warn() {} };
const page = (head, body = '<h1>Hi</h1>') => `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;

test('normalizer mirrors title and description into og:title, og:description and twitter:card when absent, idempotently', () => {
  const dir = mkdtempSync(join(tmpdir(), 'seo-add-'));
  mkdirSync(join(dir, 'x'));
  const file = join(dir, 'x', 'index.html');
  writeFileSync(file, page('<title>Hello &amp; world — PointCast</title><meta name="description" content="A test page about things, long enough to be kept as written by the pass.">'));
  normalizeGeneratedSeo(dir, quiet);
  const once = readFileSync(file, 'utf8');
  assert.match(once, /<meta property="og:title" content="Hello &amp; world">/);
  assert.match(once, /<meta property="og:description" content="A test page about things, long enough to be kept as written by the pass\.">/);
  assert.match(once, /<meta name="twitter:card" content="summary_large_image">/);
  normalizeGeneratedSeo(dir, quiet);
  assert.equal(readFileSync(file, 'utf8'), once, 'second pass changes nothing');
  assert.equal((once.match(/og:title/g) || []).length, 1);
});

test('normalizer leaves authored og tags alone and gives Article JSON-LD the page image', () => {
  const dir = mkdtempSync(join(tmpdir(), 'seo-add-'));
  mkdirSync(join(dir, 'y'));
  const file = join(dir, 'y', 'index.html');
  writeFileSync(file, page('<title>Y — PointCast</title><meta name="description" content="Y is a page with enough description text.">'
    + '<meta property="og:title" content="Authored title"><meta name="twitter:card" content="summary">'
    + '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Article","headline":"Y"},{"@type":"BreadcrumbList"}]}</script>'));
  normalizeGeneratedSeo(dir, quiet);
  const html = readFileSync(file, 'utf8');
  assert.match(html, /og:title" content="Authored title"/);
  assert.equal((html.match(/og:title/g) || []).length, 1);
  assert.match(html, /twitter:card" content="summary"/);
  const ld = JSON.parse(html.match(/ld\+json[^>]*>([^<]*)</)[1]);
  assert.equal(ld['@graph'][0].image, 'https://pointcast.xyz/images/og/og-home-v5.png');
  assert.equal(ld['@graph'][1].image, undefined, 'only Article-type nodes get an image');
});

test('listPublicIndexPages lists static index pages and skips noindex, refresh stubs and excluded paths', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pub-'));
  for (const [route, html] of [
    ['keep', page('<title>Keep</title>')],
    ['noindex', page('<title>No</title><meta name="robots" content="noindex">')],
    ['stub', '<!doctype html><title>Redirecting</title><meta http-equiv="refresh" content="0;url=/x">'],
    ['admin/desk', page('<title>Admin</title>')],
  ]) { mkdirSync(join(dir, route), { recursive: true }); writeFileSync(join(dir, route, 'index.html'), html); }
  writeFileSync(join(dir, 'index.html'), page('<title>Root</title>'));
  writeFileSync(join(dir, 'banner-300x250.html'), page('<title>Ad</title>'));
  assert.deepEqual(listPublicIndexPages(dir), ['/keep/']);
  assert.equal(isNoindexPath('/admin/desk/'), true);
});
