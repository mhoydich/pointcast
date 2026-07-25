import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = new URL('../src/pages/network-el-segundo.astro', import.meta.url);
const v2Page = new URL('../src/pages/network-el-segundo/v2.astro', import.meta.url);
const fieldKitPage = new URL('../src/pages/network-el-segundo/field-kit.astro', import.meta.url);
const fieldKitJson = new URL('../src/pages/network-el-segundo/field-kit.json.ts', import.meta.url);
const meshCommonsPage = new URL('../src/pages/network-el-segundo/mesh-commons.astro', import.meta.url);
const meshCommonsJson = new URL('../src/pages/network-el-segundo/mesh-commons.json.ts', import.meta.url);
const jsonPage = new URL('../src/pages/network-el-segundo.json.ts', import.meta.url);
const participantApi = new URL('../functions/api/network-el-segundo/participants.ts', import.meta.url);
const funnelApi = new URL('../functions/api/network-el-segundo/funnel.ts', import.meta.url);
const sharePage = new URL('../src/pages/network-el-segundo/share.astro', import.meta.url);
const firstSee = new URL('../src/components/FirstSee.astro', import.meta.url);
const announcementBlock = new URL('../src/content/blocks/0484.json', import.meta.url);
const signalBlock = new URL('../src/content/blocks/0485.json', import.meta.url);
const v2Block = new URL('../src/content/blocks/0486.json', import.meta.url);
const fieldKitBlock = new URL('../src/content/blocks/0488.json', import.meta.url);
const meshCommonsBlock = new URL('../src/content/blocks/0489.json', import.meta.url);
const jsonFeed = new URL('../src/pages/feed.json.ts', import.meta.url);
const rssFeed = new URL('../src/pages/feed.xml.ts', import.meta.url);
const announcementCardRoute = new URL('../src/pages/images/og/b/0484.png.ts', import.meta.url);
const homePage = new URL('../src/pages/index.astro', import.meta.url);
const homeSignal = new URL('../src/components/NetworkFirst100Home.astro', import.meta.url);

test('PointCast publishes Network El Segundo with a direct fallback and shared auth bridge', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site/);
  assert.match(source, /Checking shared Kukai session/);
  assert.match(source, /Kukai not connected/);
  assert.match(source, /\/api\/auth\/project-ticket/);
  assert.match(source, /Open the release/);
  assert.match(source, /https:\/\/pointcast\.xyz\/network-el-segundo/);
  assert.match(source, /Next founding light is open/);
  assert.match(source, /Every verified wallet turns on one light/);
  assert.match(source, /data-share-signal/);
  assert.match(source, /data-join-signal/);
  assert.match(source, /data-funnel-action="join"/);
  assert.match(source, /data-funnel-action="tezos_rooms"/);
  assert.match(source, /initializeFunnelMetrics/);
  assert.match(source, /pc:network-el-segundo:landing/);
  assert.match(source, /Claim the next light — free/);
  assert.match(source, /campaignSource/);
  assert.match(source, /pointcast_home/);
  assert.match(source, /pointcast_strip/);
  assert.match(source, /pointcast_ad/);
  assert.match(source, /pointcast_block/);
  assert.match(source, /wordpress/);
  assert.match(source, /tumblr/);
  assert.match(source, /tezos_discord/);
  assert.match(source, /tezos_agora/);
  assert.match(source, /teia/);
  assert.match(source, /objkt/);
  assert.match(source, /participant_relay/);
  assert.match(source, /data-signal-moved/);
  assert.match(source, /initialParticipantCount/);
  assert.match(source, /result\.count <= initialParticipantCount/);
  assert.match(source, /PointCast does not identify who signed/);
  assert.match(source, /Share next light/);
  assert.match(source, /participantRelayCopy/);
  assert.match(source, /\/network-el-segundo\/share/);
  assert.match(source, /allow="clipboard-write; web-share"/);
  assert.match(source, /overflow-x: hidden/);
  assert.doesNotMatch(source, /inset: auto auto 1rem 1rem/);
  assert.match(source, /#Tezos #TezosArt/);
  assert.match(source, /https:\/\/tezos\.com\/community/);
  assert.match(source, /\/api\/network-el-segundo\/participants/);
  assert.match(source, /zero tez/);
});

test('Network El Segundo publishes a machine-readable roster and prototype boundary', async () => {
  const source = await readFile(jsonPage, 'utf8');

  assert.match(source, /targetVerifiedWallets: 100/);
  assert.match(source, /joinUrl: 'https:\/\/pointcast\.xyz\/auth\/project\?target=network-el-segundo/);
  assert.match(source, /livingArtwork/);
  assert.match(source, /The First 100 Signal/);
  assert.match(source, /walletAddressesDisplayed: false/);
  assert.match(source, /refreshSeconds: 30/);
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
  assert.match(source, /pointcast_block/);
  assert.match(source, /tezos_discord/);
  assert.match(source, /tezos_agora/);
  assert.match(source, /teia/);
  assert.match(source, /objkt/);
  assert.match(source, /participant_relay/);
  assert.match(source, /https:\/\/pointcast\.xyz\/api\/network-el-segundo\/participants/);
  assert.match(source, /latestEdition: 'field-note-004'/);
  assert.match(source, /name: '100 Windows'/);
  assert.match(source, /canonicalUrl: 'https:\/\/pointcast\.xyz\/network-el-segundo\/v2'/);
  assert.match(source, /Touch any window to send a visual pulse without changing the public roster/);
  assert.match(source, /name: 'Local Signal Field Kit'/);
  assert.match(source, /canonicalUrl: 'https:\/\/pointcast\.xyz\/network-el-segundo\/field-kit'/);
  assert.match(source, /signedBy: 'MH'/);
  assert.match(source, /name: 'Mesh Commons'/);
  assert.match(source, /canonicalUrl: 'https:\/\/pointcast\.xyz\/network-el-segundo\/mesh-commons'/);
});

test('PointCast gives 100 Windows a distinct canonical V2 route', async () => {
  const source = await readFile(v2Page, 'utf8');

  assert.match(source, /Network El Segundo V2 — 100 Windows/);
  assert.match(source, /https:\/\/pointcast\.xyz\/network-el-segundo\/v2/);
  assert.match(source, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site\/v2/);
  assert.match(source, /og-v2\.png/);
  assert.match(source, /100 WINDOWS LIT/);
  assert.match(source, /Each verified wallet lights one public window/);
  assert.match(source, /\/api\/network-el-segundo\/participants/);
  assert.match(source, /allow="clipboard-write; web-share"/);
  assert.match(source, /Light a window \/ 0 ꜩ/);
});

test('PointCast publishes the signed Local Signal Field Kit as HTML and JSON', async () => {
  const [pageSource, jsonSource] = await Promise.all([
    readFile(fieldKitPage, 'utf8'),
    readFile(fieldKitJson, 'utf8'),
  ]);

  assert.match(pageSource, /Local Signal Field Kit — Network El Segundo/);
  assert.match(pageSource, /https:\/\/pointcast\.xyz\/network-el-segundo\/field-kit/);
  assert.match(pageSource, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site\/field-kit/);
  assert.match(pageSource, /8 OBJECTS · 4 SIGNALS · 24 NODES/);
  assert.match(pageSource, /No municipal affiliation, emergency channel, surveillance/);
  assert.match(pageSource, /Read Block 0488/);
  assert.match(pageSource, /allow="clipboard-write; web-share"/);
  assert.match(jsonSource, /author: 'MH'/);
  assert.equal((jsonSource.match(/id: '(?:beam|window|chime|burst|pebble|ripple|relay|cards)-0[1-8]'/g) ?? []).length, 8);
  assert.match(jsonSource, /mini fireworks, zero fire/);
  assert.match(jsonSource, /name: 'Dusk rehearsal', nodes: 24/);
  assert.match(jsonSource, /emergencyChannel: false/);
  assert.match(jsonSource, /locationHistory: false/);
  assert.match(jsonSource, /storedData: 'None\.'/);
});

test('PointCast publishes Mesh Commons as HTML, JSON, and Block 0489', async () => {
  const [pageSource, jsonSource, blockSource] = await Promise.all([
    readFile(meshCommonsPage, 'utf8'),
    readFile(meshCommonsJson, 'utf8'),
    readFile(meshCommonsBlock, 'utf8'),
  ]);

  assert.match(pageSource, /Mesh Commons — Network El Segundo/);
  assert.match(pageSource, /25 MILES · 24 MONTHS · \$295 FIRST LINK/);
  assert.match(pageSource, /not active coverage/i);
  assert.match(pageSource, /Read Block 0489/);
  assert.match(pageSource, /allow="clipboard-write; web-share"/);
  assert.match(jsonSource, /radiusMiles: 25/);
  assert.match(jsonSource, /durationMonths: 24/);
  assert.match(jsonSource, /firstMeshTriangleUsd: \{ low: 950, high: 1500 \}/);
  assert.match(jsonSource, /'play\.mesh'/);
  assert.match(jsonSource, /mandatoryMonthlyPriceUsd: 0/);
  assert.match(jsonSource, /contentLogging: false/);
  assert.match(blockSource, /Three roofs make a mesh/);
  assert.match(blockSource, /not a coverage claim/i);
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
  assert.match(source, /bounded campaign label/);
  assert.match(source, /arrival at the shared project-auth bridge/);
  assert.match(source, /pointcast_home/);
  assert.match(source, /pointcast_strip/);
  assert.match(source, /wordpress/);
  assert.match(source, /participant_relay/);
  assert.match(source, /legacy/);
  assert.match(source, /sources/);
  assert.match(source, /Counts are browser events, not unique people/);
  assert.doesNotMatch(source, /CF-Connecting-IP|User-Agent|Referer|document\.cookie/i);
});

test('the PointCast front door routes to Network El Segundo while the 100-light scoreboard contract stays live', async () => {
  const [pageSource, signalSource] = await Promise.all([
    readFile(homePage, 'utf8'),
    readFile(homeSignal, 'utf8'),
  ]);

  assert.match(pageSource, /href="\/network-el-segundo"/);
  assert.match(pageSource, /href:\s*'\/network-el-segundo\/v2'/);
  assert.match(pageSource, /A city of 100 windows\./);
  assert.match(signalSource, /LIGHT/);
  assert.match(signalSource, /IS OPEN/);
  assert.match(signalSource, /Array\.from\(\{ length: 100 \}/);
  assert.match(signalSource, /data-light-position/);
  assert.match(signalSource, /pointcast_home/);
  assert.match(signalSource, /\/auth\/project\?target=network-el-segundo/);
  assert.match(signalSource, /return_to=\$\{encodeURIComponent\(projectReturnTo\)\}/);
  assert.match(signalSource, /source=pointcast_home/);
  assert.doesNotMatch(signalSource, /event: 'join'/);
  assert.match(signalSource, /PC-NETWORK-EL-SEGUNDO-HOME/);
  assert.match(signalSource, /home-first-100/);
  assert.match(signalSource, /intersectionRatio >= 0\.5/);
  assert.match(signalSource, /pc:first100-home-impression/);
  assert.match(signalSource, /navigator\.doNotTrack/);
  assert.match(signalSource, /\/api\/network-el-segundo\/participants/);
  assert.match(signalSource, /Claim light \$\{nextLight\} — free/);
  assert.match(signalSource, /0 TEZ · NO PURCHASE · ABOUT 20 SECONDS/);
  assert.match(signalSource, /50% DISTRIBUTION, OR AUTOMATED YIELD REMAINS A PROTOTYPE/);
});

test('the first-100 relay kit makes the zero-cost invitation portable', async () => {
  const [source, firstSeeSource] = await Promise.all([
    readFile(sharePage, 'utf8'),
    readFile(firstSee, 'utf8'),
  ]);

  assert.match(source, /PASS THE SIGNAL/);
  assert.match(source, /Seat <span data-next-seat>2<\/span><br \/>is open/);
  assert.match(source, /Zero tez/);
  assert.match(source, /utm_source=share_kit/);
  assert.match(source, /\/auth\/project\?target=network-el-segundo/);
  assert.match(source, /source=share_kit/);
  assert.match(source, /source: 'share_kit'/);
  assert.match(source, /data-copy-message/);
  assert.match(source, /navigator\.share/);
  assert.match(source, /\/api\/network-el-segundo\/participants/);
  assert.match(source, /\/api\/network-el-segundo\/funnel/);
  assert.match(source, /Copy community update/);
  assert.match(source, /https:\/\/discord\.com\/invite\/tezos/);
  assert.match(source, /https:\/\/forum\.tezosagora\.org\/c\/community-updates\/17/);
  assert.match(source, /https:\/\/discord\.com\/invite\/US8gMfEkM2/);
  assert.match(source, /https:\/\/discord\.gg\/Gcr9Dk6qKk/);
  assert.match(source, /channelAuthUrl\('tezos_discord'\)/);
  assert.match(source, /channelAuthUrl\('tezos_agora'\)/);
  assert.match(source, /channelAuthUrl\('teia'\)/);
  assert.match(source, /channelAuthUrl\('objkt'\)/);
  assert.match(source, /do not mass-post or DM members/);
  assert.match(source, /community discussion only, not a support request/);
  assert.match(source, /mailto:contact@kukai\.app/);
  assert.match(source, /Nothing on this page posts or sends itself/);
  assert.match(source, /data-relay-event="tezos_rooms"/);
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
  const [blockSource, signalBlockSource, v2BlockSource, fieldKitBlockSource, jsonFeedSource, rssFeedSource, cardRouteSource] = await Promise.all([
    readFile(announcementBlock, 'utf8'),
    readFile(signalBlock, 'utf8'),
    readFile(v2Block, 'utf8'),
    readFile(fieldKitBlock, 'utf8'),
    readFile(jsonFeed, 'utf8'),
    readFile(rssFeed, 'utf8'),
    readFile(announcementCardRoute, 'utf8'),
  ]);
  const block = JSON.parse(blockSource);

  assert.equal(block.id, '0484');
  assert.equal(block.channel, 'ESC');
  assert.match(block.external.url, /^https:\/\/pointcast\.xyz\/auth\/project\?target=network-el-segundo/);
  assert.match(block.external.url, /source=pointcast_block/);
  assert.match(block.body, /one wallet-control message/i);
  assert.match(block.body, /No live sale contract, payout contract, token, automated yield system/i);
  assert.equal(block.companions.length, 5);
  assert.equal(block.companions.at(-1).id, 'https://pointcast.xyz/network-el-segundo/share');
  const signal = JSON.parse(signalBlockSource);
  assert.equal(signal.id, '0485');
  assert.equal(signal.title, 'Every wallet turns on one light');
  assert.match(signal.body, /one hundred light positions/i);
  assert.match(signal.body, /without publishing wallet addresses/i);
  assert.match(signal.external.url, /^https:\/\/pointcast\.xyz\/auth\/project\?target=network-el-segundo/);
  assert.match(signal.external.url, /source=pointcast_block/);
  assert.equal(signal.meta.artwork, 'The First 100 Signal');
  const v2 = JSON.parse(v2BlockSource);
  assert.equal(v2.id, '0486');
  assert.equal(v2.title, 'A city of 100 windows');
  assert.equal(v2.external.url, 'https://pointcast.xyz/network-el-segundo/v2');
  assert.match(v2.body, /one hundred public windows/i);
  assert.match(v2.body, /does not change the roster/i);
  assert.match(v2.body, /No purchase, mint, token, transfer, payout, promised return/i);
  assert.equal(v2.meta.edition, 'Signal 002');
  const fieldKit = JSON.parse(fieldKitBlockSource);
  assert.equal(fieldKit.id, '0488');
  assert.equal(fieldKit.title, 'Signal the block');
  assert.equal(fieldKit.external.url, 'https://pointcast.xyz/network-el-segundo/field-kit');
  assert.match(fieldKit.body, /eight small instruments/i);
  assert.match(fieldKit.body, /no flame, smoke, explosive material, projectile, or debris/i);
  assert.equal(fieldKit.meta.products, 8);
  assert.equal(fieldKit.meta.signals, 4);
  assert.equal(fieldKit.meta.signature, 'MH');
  assert.match(jsonFeedSource, /getCollection\('blocks'/);
  assert.match(rssFeedSource, /getCollection\('blocks'/);
  assert.match(cardRouteSource, /public\/images\/og\/b\/0484\.png/);
  assert.match(cardRouteSource, /Content-Type': 'image\/png/);
  assert.match(cardRouteSource, /max-age=31536000, immutable/);
});
