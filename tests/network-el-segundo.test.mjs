import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = new URL('../src/pages/network-el-segundo.astro', import.meta.url);
const jsonPage = new URL('../src/pages/network-el-segundo.json.ts', import.meta.url);
const participantApi = new URL('../functions/api/network-el-segundo/participants.ts', import.meta.url);
const funnelApi = new URL('../functions/api/network-el-segundo/funnel.ts', import.meta.url);
const sharePage = new URL('../src/pages/network-el-segundo/share.astro', import.meta.url);
const firstSee = new URL('../src/components/FirstSee.astro', import.meta.url);
const announcementBlock = new URL('../src/content/blocks/0484.json', import.meta.url);
const jsonFeed = new URL('../src/pages/feed.json.ts', import.meta.url);
const rssFeed = new URL('../src/pages/feed.xml.ts', import.meta.url);
const announcementCardRoute = new URL('../src/pages/images/og/b/0484.png.ts', import.meta.url);

test('PointCast publishes Network El Segundo with a direct fallback and shared auth bridge', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site/);
  assert.match(source, /Checking shared Kukai session/);
  assert.match(source, /Kukai not connected/);
  assert.match(source, /\/api\/auth\/project-ticket/);
  assert.match(source, /Open the release/);
  assert.match(source, /https:\/\/pointcast\.xyz\/network-el-segundo/);
  assert.match(source, /First 100 \/ zero capital/);
  assert.match(source, /data-share-signal/);
  assert.match(source, /data-join-signal/);
  assert.match(source, /data-funnel-action="join"/);
  assert.match(source, /data-funnel-action="tezos_rooms"/);
  assert.match(source, /initializeFunnelMetrics/);
  assert.match(source, /pc:network-el-segundo:landing/);
  assert.match(source, /Join free with Kukai/);
  assert.match(source, /\/network-el-segundo\/share/);
  assert.match(source, /allow="clipboard-write; web-share"/);
  assert.match(source, /overflow-x: hidden/);
  assert.doesNotMatch(source, /inset: auto auto 1rem 1rem/);
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
  assert.match(source, /human: 'https:\/\/pointcast\.xyz\/network-el-segundo\/share'/);
  assert.match(source, /One verified participant invites one Tezos artist/);
  assert.match(source, /https:\/\/tezos\.com\/community/);
  assert.match(source, /https:\/\/docs\.objkt\.com/);
  assert.match(source, /https:\/\/blog\.teia\.art\/about/);
  assert.match(source, /do not mass-tag/);
  assert.match(source, /publicFunnel/);
  assert.match(source, /identifiersStored: false/);
  assert.match(source, /https:\/\/pointcast\.xyz\/api\/network-el-segundo\/participants/);
});

test('the first-100 funnel is public, bounded, and stores no visitor identity', async () => {
  const source = await readFile(funnelApi, 'utf8');

  assert.match(source, /PC_ANALYTICS_KV: KVNamespace/);
  assert.match(source, /networkfunnel:/);
  assert.match(source, /MAX_BODY_BYTES = 512/);
  assert.match(source, /context\.waitUntil/);
  assert.match(source, /crypto\.randomUUID/);
  assert.match(source, /expirationTtl: RETENTION_DAYS/);
  assert.match(source, /No IP, user agent, cookie, wallet, referrer, or visitor identifier/);
  assert.match(source, /Counts are browser events, not unique people/);
  assert.doesNotMatch(source, /CF-Connecting-IP|User-Agent|Referer|document\.cookie/i);
});

test('the first-100 relay kit makes the zero-cost invitation portable', async () => {
  const [source, firstSeeSource] = await Promise.all([
    readFile(sharePage, 'utf8'),
    readFile(firstSee, 'utf8'),
  ]);

  assert.match(source, /PASS THE SIGNAL/);
  assert.match(source, /Seat <span data-next-seat>2<\/span><br \/>is open/);
  assert.match(source, /Zero tez/);
  assert.match(source, /data-copy-message/);
  assert.match(source, /navigator\.share/);
  assert.match(source, /\/api\/network-el-segundo\/participants/);
  assert.match(source, /\/api\/network-el-segundo\/funnel/);
  assert.match(source, /Tezos community rooms/);
  assert.match(source, /Download poster/);
  assert.match(firstSeeSource, /\^\\\/network-el-segundo\(\?:\\\/\|\$\)/);
});

test('PointCast proxies the public participant count without caching or collecting identity data', async () => {
  const source = await readFile(participantApi, 'utf8');

  assert.match(source, /cache-control': 'no-store/);
  assert.match(source, /remaining: target - count/);
  assert.match(source, /observedAt/);
  assert.doesNotMatch(source, /email|userAgent|ipAddress/i);
});

test('the first-100 launch enters the canonical Block, JSON Feed, and RSS distribution system', async () => {
  const [blockSource, jsonFeedSource, rssFeedSource, cardRouteSource] = await Promise.all([
    readFile(announcementBlock, 'utf8'),
    readFile(jsonFeed, 'utf8'),
    readFile(rssFeed, 'utf8'),
    readFile(announcementCardRoute, 'utf8'),
  ]);
  const block = JSON.parse(blockSource);

  assert.equal(block.id, '0484');
  assert.equal(block.channel, 'ESC');
  assert.equal(block.external.url, 'https://pointcast.xyz/network-el-segundo');
  assert.match(block.body, /one wallet-control message/i);
  assert.match(block.body, /No live sale contract, payout contract, token, automated yield system/i);
  assert.equal(block.companions.length, 5);
  assert.equal(block.companions.at(-1).id, 'https://pointcast.xyz/network-el-segundo/share');
  assert.match(jsonFeedSource, /getCollection\('blocks'/);
  assert.match(rssFeedSource, /getCollection\('blocks'/);
  assert.match(cardRouteSource, /public\/images\/og\/b\/0484\.png/);
  assert.match(cardRouteSource, /Content-Type': 'image\/png/);
  assert.match(cardRouteSource, /max-age=31536000, immutable/);
});
