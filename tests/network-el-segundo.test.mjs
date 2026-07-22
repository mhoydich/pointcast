import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = new URL('../src/pages/network-el-segundo.astro', import.meta.url);
const jsonPage = new URL('../src/pages/network-el-segundo.json.ts', import.meta.url);
const participantApi = new URL('../functions/api/network-el-segundo/participants.ts', import.meta.url);
const announcementBlock = new URL('../src/content/blocks/0484.json', import.meta.url);
const jsonFeed = new URL('../src/pages/feed.json.ts', import.meta.url);
const rssFeed = new URL('../src/pages/feed.xml.ts', import.meta.url);

test('PointCast publishes Network El Segundo with a direct fallback and shared auth bridge', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site/);
  assert.match(source, /Checking shared Kukai session/);
  assert.match(source, /authenticate once for every project/);
  assert.match(source, /\/api\/auth\/project-ticket/);
  assert.match(source, /Open the release/);
  assert.match(source, /https:\/\/pointcast\.xyz\/network-el-segundo/);
  assert.match(source, /Signal relay \/ zero capital/);
  assert.match(source, /data-share-signal/);
  assert.match(source, /#Tezos #TezosArt/);
  assert.match(source, /https:\/\/tezos\.com\/community/);
  assert.match(source, /\/api\/network-el-segundo\/participants/);
  assert.match(source, /no purchase or transaction/);
});

test('Network El Segundo publishes a machine-readable roster and prototype boundary', async () => {
  const source = await readFile(jsonPage, 'utf8');

  assert.match(source, /targetVerifiedWallets: 100/);
  assert.match(source, /participantCounter/);
  assert.match(source, /transactionRequired: false/);
  assert.match(source, /livePayoutContract: false/);
  assert.match(source, /returnPromised: false/);
  assert.match(source, /relayKit/);
  assert.match(source, /One verified participant invites one Tezos artist/);
  assert.match(source, /https:\/\/tezos\.com\/community/);
  assert.match(source, /https:\/\/docs\.objkt\.com/);
  assert.match(source, /https:\/\/blog\.teia\.art\/about/);
  assert.match(source, /do not mass-tag/);
  assert.match(source, /https:\/\/pointcast\.xyz\/api\/network-el-segundo\/participants/);
});

test('PointCast proxies the public participant count without caching or collecting identity data', async () => {
  const source = await readFile(participantApi, 'utf8');

  assert.match(source, /cache-control': 'no-store/);
  assert.match(source, /remaining: target - count/);
  assert.match(source, /observedAt/);
  assert.doesNotMatch(source, /email|userAgent|ipAddress/i);
});

test('the first-100 launch enters the canonical Block, JSON Feed, and RSS distribution system', async () => {
  const [blockSource, jsonFeedSource, rssFeedSource] = await Promise.all([
    readFile(announcementBlock, 'utf8'),
    readFile(jsonFeed, 'utf8'),
    readFile(rssFeed, 'utf8'),
  ]);
  const block = JSON.parse(blockSource);

  assert.equal(block.id, '0484');
  assert.equal(block.channel, 'ESC');
  assert.equal(block.external.url, 'https://pointcast.xyz/network-el-segundo');
  assert.match(block.body, /one wallet-control message/i);
  assert.match(block.body, /No live sale contract, payout contract, token, automated yield system/i);
  assert.equal(block.companions.length, 4);
  assert.match(jsonFeedSource, /getCollection\('blocks'/);
  assert.match(rssFeedSource, /getCollection\('blocks'/);
});
