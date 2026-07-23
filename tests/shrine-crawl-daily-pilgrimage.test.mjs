import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const crawlDataUrl = new URL('../src/lib/shrine-bell-crawl.ts', import.meta.url);
const crawlPageUrl = new URL('../src/pages/shrine-crawl.astro', import.meta.url);
const crawlJsonUrl = new URL('../src/pages/shrine-crawl.json.ts', import.meta.url);
const crawlImagesUrl = new URL('../src/pages/images/shrines/[asset].png.ts', import.meta.url);

test('shrine crawl keeps one 24-visit source of truth and derives six daily stops', async () => {
  const source = await readFile(crawlDataUrl, 'utf8');
  const ids = [...source.matchAll(/\n\s{2}\{\n\s{4}id:\s*'([^']+)'/g)].map((match) => match[1]);

  assert.equal(ids.length, 24);
  assert.equal(new Set(ids).size, 24);
  assert.match(source, /SHRINE_CRAWL_DAILY_ROUTE_LENGTH\s*=\s*6/);
  assert.match(source, /SHRINE_CRAWL_DAILY_ALGORITHM\s*=\s*'fnv1a-lcg-v1'/);
  assert.match(source, /getShrineDailyRouteIds/);
  assert.match(source, /SHRINE_CRAWL\.map\(\(shrine\)\s*=>\s*shrine\.id\)/);
  assert.match(source, /Math\.imul\(seed,\s*1664525\)\s*\+\s*1013904223/);
});

test('daily pilgrimage has a local passport, six stamps, and a copyable receipt', async () => {
  const source = await readFile(crawlPageUrl, 'utf8');

  assert.match(source, /href="\/shrine-crawl\?mode=daily"/);
  assert.match(source, /params\.get\('mode'\)\s*===\s*'daily'/);
  assert.match(source, /data-daily-passport/);
  assert.match(source, /data-daily-stop=\{index\}/);
  assert.match(source, /data-copy-daily-receipt/);
  assert.match(source, /pc:shrine-crawl:v3:daily/);
  assert.match(source, /getLocalDateKey/);
  assert.match(source, /dailyRoute\.every\(\(shrine\)\s*=>\s*dailyState\.rung\[shrine\.id\]\)/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /shrine-crawl\.is-daily[\s\S]*min-height:\s*100svh/);
  assert.match(source, /shrine-crawl\.is-daily[\s\S]*daily-passport:not\(\[hidden\]\)/);
});

test('V3 JSON advertises daily route semantics while preserving V2 screensaver fields', async () => {
  const source = await readFile(crawlJsonUrl, 'utf8');

  assert.match(source, /version:\s*3/);
  assert.match(source, /screensaverUrl/);
  assert.match(source, /completionStorageKey/);
  assert.match(source, /dailyPilgrimageUrl/);
  assert.match(source, /dailyReceiptStorageKey/);
  assert.match(source, /dailyReceiptSchema/);
  assert.match(source, /dateBasis:\s*'visitor-local-date'/);
  assert.match(source, /source:\s*'SHRINE_CRAWL'/);
});

test('tracked shrine backgrounds are prerendered despite the empty public directory', async () => {
  const source = await readFile(crawlImagesUrl, 'utf8');

  for (const asset of [
    'block-shrine-bg',
    'campaign-shrine-bg',
    'element-balance-shrine-bg',
    'element-fire-shrine-bg',
    'element-nature-shrine-bg',
    'element-stone-shrine-bg',
    'room-shrine-bg',
    'shrine-background-sheet',
    'system-shrine-bg',
  ]) {
    assert.match(source, new RegExp(`'${asset}'`));
  }
  assert.match(source, /export const prerender = true/);
  assert.match(source, /Cache-Control': 'public, max-age=31536000, immutable'/);
});
