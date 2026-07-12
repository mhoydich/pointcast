import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../src/pages/sitemap-discovery.xml.ts', import.meta.url), 'utf8');
const commercePages = await Promise.all([
  '../src/pages/shop.astro',
  '../src/pages/products/[slug].astro',
  '../src/pages/pairings/[mood].astro',
].map(async (path) => [path, await readFile(new URL(path, import.meta.url), 'utf8')]));

test('every crawler group can reach public JSONL feeds', () => {
  const groups = robots.trim().split(/\n\s*\n/).filter((group) => group.startsWith('User-agent:'));
  assert.ok(groups.length > 1, 'expected named crawler groups');

  for (const group of groups) {
    const agent = group.match(/^User-agent:\s*(.+)$/m)?.[1];
    assert.match(group, /^Allow: \/api\/products\.jsonl$/m, `${agent} must allow the commerce feed`);
    assert.match(group, /^Allow: \/api\/blocks\.jsonl$/m, `${agent} must allow the blocks feed`);
    assert.match(group, /^Disallow: \/api\/$/m, `${agent} must keep other API routes private`);
  }
});

test('discovery sitemap advertises the public JSONL feeds', () => {
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/api\/products\.jsonl/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/api\/blocks\.jsonl/);
});

test('outbound product checkout links are marked sponsored', () => {
  for (const [path, page] of commercePages) {
    const checkoutLinks = page.match(/<a\b[^>]*href=\{(?:product\.data|p\.data|d)\.url\}[^>]*>/g) ?? [];
    assert.ok(checkoutLinks.length > 0, `${path} must expose a product checkout link`);

    for (const link of checkoutLinks) {
      assert.match(link, /target="_blank"/, `${path} checkout must open on the merchant site`);
      assert.match(link, /rel="[^"]*\bnoopener\b[^"]*"/, `${path} checkout must isolate the opener`);
      assert.match(link, /rel="[^"]*\bsponsored\b[^"]*"/, `${path} checkout must identify the commercial relationship`);
    }
  }
});
