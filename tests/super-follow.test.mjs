import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('Super Follow is visible across human, machine, feed, and discovery surfaces', async () => {
  const [page, data, endpoint, jsonFeed, rss, ribbon, homepage, apps, sitemap, llms, llmsFull] = await Promise.all([
    readFile(new URL('src/pages/super-follow.astro', root), 'utf8'),
    readFile(new URL('src/data/super-follow.ts', root), 'utf8'),
    readFile(new URL('src/pages/super-follow.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/super-follow.feed.json.ts', root), 'utf8'),
    readFile(new URL('src/pages/super-follow.xml.ts', root), 'utf8'),
    readFile(new URL('src/components/SuperFollowRibbon.astro', root), 'utf8'),
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/lib/pointcast-apps.ts', root), 'utf8'),
    readFile(new URL('src/pages/sitemap-discovery.xml.ts', root), 'utf8'),
    readFile(new URL('public/llms.txt', root), 'utf8'),
    readFile(new URL('public/llms-full.txt', root), 'utf8'),
  ]);

  assert.match(page, /Follow Sony\.<br \/><em>Your way\.<\/em>/);
  assert.match(page, /Basic/);
  assert.match(page, /Advanced/);
  assert.match(page, /Want Desk/);
  assert.match(page, /pc:super-follow:sony:v1/);
  assert.match(page, /Build a shelf of signals/);
  assert.match(page, /pc:super-follow:shelf:v1/);
  assert.match(page, /pointcast\.follow\/v1/);
  assert.match(page, /data-lens-topics=\{lens\.topics\.join\(' '\)\}/);
  assert.match(page, /function selectedLensIds\(\)/);
  assert.match(page, /timeZone: 'UTC'/);
  assert.match(data, /noun: 'Company'/);
  assert.match(data, /noun: 'Play'/);
  assert.match(data, /noun: 'Sound'/);
  assert.match(data, /noun: 'Product'/);
  assert.match(data, /noun: 'Camera'/);
  assert.match(data, /noun: 'Care'/);
  assert.match(data, /maximumLocalBroadcasters: 12/);
  assert.match(endpoint, /super-follow-v1\.json/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(jsonFeed, /https:\/\/jsonfeed\.org\/version\/1\.1/);
  assert.match(rss, /application\/rss\+xml/);
  assert.match(ribbon, /A company is not one feed/);
  // front door rebuilt 2026-09-01: the SuperFollowRibbon module retired; the homepage now links /super-follow from its machine-surfaces shelf.
  assert.match(homepage, /href="\/super-follow"/);
  assert.match(apps, /slug: 'super-follow'/);
  assert.match(sitemap, /super-follow\.feed\.json/);
  assert.match(llms, /Super Follow personal broadcaster/);
  assert.match(llmsFull, /Super Follow:/);
});

test('Super Follow preserves source receipts and keeps follow and wants local', async () => {
  const [page, data, endpoint] = await Promise.all([
    readFile(new URL('src/pages/super-follow.astro', root), 'utf8'),
    readFile(new URL('src/data/super-follow.ts', root), 'utf8'),
    readFile(new URL('src/pages/super-follow.json.ts', root), 'utf8'),
  ]);

  for (const state of ['Observe', 'Follow', 'Connect', 'Agree', 'Sign', 'Trade']) {
    assert.match(data, new RegExp(`noun: '${state}'`));
  }

  assert.match(page, /Local Want saved\. Nothing was sent/);
  assert.match(page, /Direction only/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /This browser blocked local storage/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.match(endpoint, /sent: false/);
  assert.match(endpoint, /automaticCheckout: false/);
  assert.match(endpoint, /paymentInitiated: false/);
  assert.match(endpoint, /continuousCrawl: false/);
  assert.match(endpoint, /portableFollow/);
  assert.match(endpoint, /receiptIsAuthority: false/);
  assert.match(data, /independent PointCast prototype/);
});

test('Super Follow builds a bounded portable Follow Shelf without network activity', async () => {
  const [page, data, endpoint] = await Promise.all([
    readFile(new URL('src/pages/super-follow.astro', root), 'utf8'),
    readFile(new URL('src/data/super-follow.ts', root), 'utf8'),
    readFile(new URL('src/pages/super-follow.json.ts', root), 'utf8'),
  ]);

  assert.match(page, /data-follow-composer/);
  assert.match(page, /data-follow-shelf-list/);
  assert.match(page, /data-copy-shelf/);
  assert.match(page, /function normalizeBroadcaster/);
  assert.match(page, /function cleanHttpUrl/);
  assert.match(page, /document\.createElement/);
  assert.match(page, /element\.textContent = text/);
  assert.match(page, /networkTransmission: false/);
  assert.match(page, /sourceFetch: false/);
  assert.match(page, /connected: false/);
  assert.match(page, /signed: false/);
  assert.match(page, /was removed from this browser’s shelf\. Nothing was sent/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(page, /\.innerHTML\s*=/);
  assert.match(data, /sourceLimitPerBroadcaster: 8/);
  assert.match(data, /lensNounLimit: 6/);
  assert.match(data, /networkTransmission: false/);
  assert.match(endpoint, /followShelf: 'browser localStorage'/);
  assert.match(endpoint, /portableFollow/);
});

test('Super Follow cites official source desks and keeps commerce claims bounded', async () => {
  const [data, endpoint] = await Promise.all([
    readFile(new URL('src/data/super-follow.ts', root), 'utf8'),
    readFile(new URL('src/pages/super-follow.json.ts', root), 'utf8'),
  ]);

  assert.match(data, /sony\.com\/en\/SonyInfo\/News\/Press\/data\/pressrelease_for_top\.xml/);
  assert.match(data, /blog\.playstation\.com\/feed\//);
  assert.match(data, /sonymusic\.com\/news\//);
  assert.match(data, /electronics\.sony\.com\/imaging/);
  assert.match(data, /sony\.com\/electronics\/support/);
  assert.match(endpoint, /proofOfPossession: 'directional only'/);
  assert.match(data, /checkout and payment remain separate approvals/);
});
