// Readability of the four static areas (Baby Bonfire, Coast Commons, House Channel, Light
// Companion): every public page can be read by a search engine, a link-preview bot and an AI
// agent, and the two private routes stay private. The checks themselves live in
// scripts/audit-area-readability.mjs; this runs them and adds the privacy assertions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS, PRIVATE, PRIVATE_URL, ROOT, audit, readPage, scopePages, sitemapPaths } from '../scripts/audit-area-readability.mjs';

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const result = audit({ root: ROOT });

test('the audit finds no failures on any public page', () => {
  assert.deepEqual(result.failures.map((f) => `[${f.check}] ${f.path}: ${f.detail}`), []);
});

test('every index.html in the four folders is audited, and there are fifty-three public pages', () => {
  const pages = scopePages(ROOT);
  assert.equal(pages.filter((p) => !p.private).length, 53);
  assert.equal(result.pages.length, pages.length);
  for (const a of AREAS) assert.ok(pages.some((p) => p.path === a.hub), `${a.hub} is audited`);
});

test('the phone remote and the circle page say noindex', () => {
  for (const path of Object.keys(PRIVATE)) {
    const d = readPage(read(`public${path}index.html`));
    assert.match(d.robots ?? '', /noindex/i, `${path} robots meta`);
  }
});

test('private routes are in no sitemap, llms file, agents index or JSON twin', () => {
  const sitemap = sitemapPaths(ROOT);
  for (const path of sitemap) assert.ok(!PRIVATE_URL.test(path), `sitemap-discovery names ${path}`);
  for (const p of Object.keys(PRIVATE)) assert.ok(!sitemap.has(p), `sitemap-discovery names ${p}`);
  const sources = {
    'llms.txt': read('public/llms.txt'),
    'llms-full.txt': read('public/llms-full.txt'),
    'agent-surfaces.ts': read('src/data/agent-surfaces.ts'),
    'sitemap-discovery.xml.ts': read('src/pages/sitemap-discovery.xml.ts'),
    ...Object.fromEntries(AREAS.map((a) => [a.twin, read(`public${a.twin}`)])),
  };
  for (const [name, text] of Object.entries(sources)) assert.doesNotMatch(text, PRIVATE_URL, `${name} names a private route`);
});

test('the four JSON twins parse and list every public page of their area', () => {
  for (const a of AREAS) {
    const twin = JSON.parse(read(`public${a.twin}`));
    const listed = new Map(twin.pageIndex.map((e) => [e.url, e]));
    const pages = scopePages(ROOT).filter((p) => p.area.id === a.id && !p.private);
    assert.equal(listed.size, pages.length, `${a.twin} pageIndex has one entry per public page`);
    for (const p of pages) {
      const e = listed.get(`https://pointcast.xyz${p.path}`);
      assert.ok(e, `${p.path} is in ${a.twin}`);
      assert.ok(e.title && e.summary, `${p.path} has a title and a summary in ${a.twin}`);
    }
  }
});

test('robots.txt names the discovery sitemap, and the discovery sitemap holds the hubs and twins', () => {
  assert.match(read('public/robots.txt'), /^Sitemap: https:\/\/pointcast\.xyz\/sitemap-discovery\.xml$/m);
  const sitemap = sitemapPaths(ROOT);
  for (const a of AREAS) { assert.ok(sitemap.has(a.hub), a.hub); assert.ok(sitemap.has(a.twin), a.twin); }
});

test('no public page has a Product, Offer, rating or review in its JSON-LD', () => {
  for (const p of scopePages(ROOT).filter((x) => !x.private)) {
    const text = JSON.stringify(readPage(read(`public${p.path}index.html`)).ld);
    assert.doesNotMatch(text, /"@type":"(?:Product|Offer|Review|AggregateRating|MedicalWebPage)"|"(?:offers|price|aggregateRating|review)"/, p.path);
  }
});
