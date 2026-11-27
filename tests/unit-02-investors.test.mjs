import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publicDir = new URL('../public/', import.meta.url);
const pagePath = '/unit-02/investors/';
const html = readFileSync(new URL('unit-02/investors/index.html', publicDir), 'utf8');

test('the company links to the investor page and its downloads are actual PDF and XLSX assets', () => {
  const home = readFileSync(new URL('unit-02/index.html', publicDir), 'utf8');
  assert.ok(home.includes('href="' + pagePath + '"'));
  for (const [name, signature] of [['investor-overview.pdf', '%PDF-'], ['pilot-economics.xlsx', 'PK\x03\x04']]) {
    assert.ok(html.includes('href="' + pagePath + name + '"'));
    const bytes = readFileSync(new URL((pagePath + name).slice(1), publicDir));
    assert.equal(bytes.toString('latin1', 0, signature.length), signature);
  }
});

test('investor links work at both the slashless and canonical site routes', () => {
  const dirs = [pagePath, pagePath.slice(0, -1)];
  const urls = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  for (const url of urls) {
    if (url.startsWith('#')) {
      assert.ok(html.includes('id="' + url.slice(1) + '"'), url);
    } else {
      const resolved = dirs.map(dir => new URL(url, 'https://pointcast.xyz' + dir).href);
      assert.equal(resolved[0], resolved[1], url);
    }
  }
  assert.ok(urls.includes('/loom/?to=%23unit-02&amp;compose=1'));
});
